"use strict";

const Airtable = require('airtable')
const { GingrService } = require('./gingrService');

const gingrService = new GingrService()
const opts = {
    typecast: true
}
const groomingServices = new Set(["Basic Bath", "Nail Trim", "Brushing"])
const treatServices = new Set(["Kong Treat", "Dental Chew"])

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
        const serviceTimes = this.getServiceTimes(services)

        const record = this.reservationEventToRecord(data, medications, formattedFeedingSchedule, serviceTimes)
        await this.table.create(record, opts)
    }

    async updateDog(entityData) {
        const animalId = entityData['a_id']

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

    reservationEventToRecord(entityData, medications, feedingSchedule, serviceTimes) {
        const { Lunch, ...feeding } = feedingSchedule

        const treats = Object.entries(serviceTimes.treat)
            .map(([name, times]) => {
                const timeStr = times.map(this.formatShortDate).join(", ")
                return `${name} ${timeStr}`
            })
            .join('\n')


        const grooming = Object.entries(serviceTimes.grooming)
            .reduce((acc, [name, times]) => {
                times.forEach(t => acc.push(`${name} ${this.formatShortDatetime(t)}`))
                return acc
            }, [])
            .join('\n')

        return {
            "Animal Id": entityData["animal_id"],
            "Dog": entityData["animal_name"],
            "Feeding": Object.values(feeding).join('\n'),
            "Belongings": entityData["answer_1"],
            "Medication": medications.join('\n'),
            "Lunch": Lunch,
            "Kongs/Dental Chews": treats,
            "Grooming Services": grooming,
            "Departure Date/Time": entityData["end_date_iso"],
            "Type": entityData["type"],
            "Checked In By": entityData["created_by"]
        }
    }

    animalEventToRecord(entityData, medications, feedingSchedule) {
        const { Lunch, ...feeding } = feedingSchedule
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

    getServiceTimes(services) {
        return services.reduce((acc, service) => {
            const name = service["name"];
            const time = new Date(service["scheduled_at"])

            if (groomingServices.has(name)) {
                this.createOrAppend(acc.grooming, name, time)
            } else if (treatServices.has(name)) {
                this.createOrAppend(acc.treat, name, time)
            }

            return acc
        }, { grooming: [], treat: [] })
    }

    formatShortDate(t) {
        return `${t.getMonth() + 1}/${t.getDate()}`
    }

    formatShortDatetime(t) {
        let hours = t.getHours() % 12
        hours = hours == 0 ? 12 : hours

        const minutes = ('0' + t.getMinutes()).slice(-2)
        return `${this.formatShortDate(t)} ${hours}:${minutes}`
    }
    

    createOrAppend(obj, key, value) {
        if (obj.hasOwnProperty(key)) {
            obj[key].push(value)
        } else {
            obj[key] = [value]
        }
        return obj
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