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

    async addDog(entityData) {
        const animalId = entityData['animal_id']
        
        const [medications, feedingSchedule] = await Promise.all([
          gingrService.getMedications(animalId),
          gingrService.getFeedingSchedule(animalId)
        ])

        const record = this.entityToRecord(entityData, medications, feedingSchedule)
        await this.table.create(record, opts)
    }

    async updateDog(entityData) {
        const animalId = data['animal_id']

        const [medications, feedingSchedule, record] = await Promise.all([
            gingrService.getMedications(animalId),
            gingrService.getFeedingSchedule(animalId),
            this.getRecordByAnimalId(animalId)
        ]);

        const recordData = this.entityToRecord(entityData, medications, feedingSchedule)

        if (record) {
            record.updateFields(recordData, opts)
        } else {
            await this.table.create(recordData, opts)
        }
    }

    entityToRecord(entityData, medications, feedingSchedule) {
        const { Lunch, ...feeding} = feedingSchedule
        return {
            "Animal Id": parseInt(entityData["animal_id"]),
            "Dog": entityData["animal_name"],
            "Feeding": Object.values(feeding).join('\n'),
            "Belongings": entityData["answer_1"],
            "Medication": medications.join('\n'),
            "Lunch": Lunch,
            "Kongs/Dental Chews": entityData["services_string"],
            "Grooming Services": entityData["services_string"],
            "Departure Date/Time": entityData["end_date_iso"],
            "Type": entityData["type"],
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