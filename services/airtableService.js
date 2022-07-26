"use strict";

const Airtable = require('airtable')
const { GingrService } = require('./gingrService');

const gingrService = new GingrService()
const opts = {
    typecast: true
}

class AirtableService {
    constructor() {
        this.table = new Airtable().base('appd02u10BuFuz904').table("Dogs")
    }

    async removeDog(animalId) {
        const record = await this.getRecordByAnimalId(animalId);
        if (record) {
            await record.destroy();
        }
    }

    async addDog(event) {
        // const reservationId = event["entity_id"];
        const reservationId = 24578
        const data = event["entity_data"];
        const animalId = data["animal_id"];
        
        const [medications, feedingSchedule, reservations] = await Promise.all([
          gingrService.getMedications(animalId),
          gingrService.getFeedingSchedule(animalId),
          gingrService.getCheckedInReservations(),
        ])

        const services = reservations[`${reservationId}`]?.["services"];
        const isHouseFood = services.find(service => {
            service["name"] === "House Food"
        })


        const formattedFeedingSchedule = gingrService.formatFeedingSchedule(feedingSchedule, !!isHouseFood)

        const record = this.reservationEventToRecord(data, medications, formattedFeedingSchedule)

        await this.table.create(record, opts)
    }

    async updateDog(entityData) {
        const animalId = entityData['a_id']
        console.log(entityData)

        const [medications, feedingSchedule, record] = await Promise.all([
            gingrService.getMedications(animalId),
            gingrService.getFeedingSchedule(animalId),
            this.getRecordByAnimalId(animalId)
        ]);

        const recordData = this.animalEventToRecord(entityData, medications, feedingSchedule)

        if (record) {
            record.updateFields(recordData, opts)
        } else {
            await this.table.create(recordData, opts)
        }
    }

    reservationEventToRecord(entityData, medications, feedingSchedule) {
        const { Lunch, ...feeding} = feedingSchedule
        return {
            "Animal Id": entityData["animal_id"],
            "Dog": entityData["animal_name"],
            "Feeding": Object.values(feeding).join('\n'),
            "Belongings": entityData["answer_1"],
            "Medication": medications.join('\n'),
            "Lunch": Lunch,
            "Kongs/Dental Chews": entityData["services_string"],
            "Grooming Services": entityData["services_string"],
            "Departure Date/Time": entityData["end_date_iso"],
            "Type": entityData["type"],
            "Checked In By": entityData["created_by"]
        }
    }

    animalEventToRecord(entityData, medications, feedingSchedule) {
        const { Lunch, ...feeding} = feedingSchedule
        return {
            "Animal Id": entityData["a_id"],
            "Dog": entityData["animal_name"],
            "Feeding": Object.values(feeding).join('\n'),
            "Medication": medications.join('\n'),
            "Lunch": Lunch,
            "Kongs/Dental Chews": entityData["services_string"],
            "Grooming Services": entityData["services_string"],
        }
    }

    /**
     * 
     * @param {Number} animalId Id of the animal from Gingr
     * @returns {Promise<Record>} Record in Airtable
     */
    async getRecordByAnimalId(animalId) {
        const records = await this.table.select({
            filterByFormula: `{Animal Id} = ${animalId}`,
            fields: []
        }).firstPage();

        return records[0];
    }

}

module.exports = {
    AirtableService
}