"use strict";

const Airtable = require('airtable')
const { GingrService } = require('./gingrService');
const chunk = require('lodash.chunk')

const gingrService = new GingrService()
const opts = {
    typecast: true
}
const groomingServices = new Set(["Basic Bath", "Nail Trim", "Brushing"])
const treatServices = new Set(["Kong Treat", "Dental Chew"])

const table = new Airtable().base('appd02u10BuFuz904').table("Dogs")

class AirtableService {
    async removeDog(animalId) {
        const record = await this.getRecordByAnimalId(animalId);
        if (record) {
            await record.destroy();
        }
    }

    async addDog(event) {
        const reservationId = event["entity_id"];
        const data = event["entity_data"];
        const animalId = data["animal_id"];

        const [medications, feedingSchedule, reservations] = await Promise.all([
            gingrService.getMedications(animalId),
            gingrService.getFeedingSchedule(animalId),
            gingrService.getCheckedInReservations(),
        ])

        const services = reservations[`${reservationId}`]?.["services"] || [];

        const record = this.reservationEventToRecord(data, medications, feedingSchedule, services)
        await table.create(record, opts)
    }

    async updateDog(entityData) {
        const animalId = entityData['a_id']

        const [medications, feedingSchedule, reservations, record] = await Promise.all([
            gingrService.getMedications(animalId),
            gingrService.getFeedingSchedule(animalId),
            gingrService.getCheckedInReservations(),
            this.getRecordByAnimalId(animalId),
        ]);

        const services = 
            Object.values(reservations).map(r => r.animal.id == animalId)?.["services"] || [];

        const recordData = this.animalEventToRecord(entityData, medications, feedingSchedule, services)

        if (record) {
            record.updateFields(recordData, opts)
        } else {
            await table.create(recordData, opts)
        }
    }

    reservationEventToRecord(reservation, medications, feedingSchedule, services) {
        const isHouseFood = !!services?.find(service => {
            service["name"] === "House Food"
        })

        const { Lunch, ...feeding } = this.formatFeedingSchedule(feedingSchedule, isHouseFood)

        const serviceTimes = this.getServiceTimes(services)

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
            "Animal Id": reservation["animal_id"],
            "Dog": reservation["animal_name"],
            "Feeding": Object.values(feeding).join('\n'),
            "Belongings": reservation["answer_1"],
            "Medication": medications.join('\n'),
            "Lunch": Lunch,
            "Kongs/Dental Chews": treats,
            "Grooming Services": grooming,
            "Departure Date/Time": reservation["end_date_iso"],
            "Type": reservation["type"],
            "Checked In By": reservation["created_by"]
        }
    }

    animalEventToRecord(entityData, medications, feedingSchedule, services) {
        const isHouseFood = !!services?.find(service => {
            service["name"] === "House Food"
        })

        const { Lunch, ...feeding } = this.formatFeedingSchedule(feedingSchedule, isHouseFood)
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

    formatFeedingSchedule(formattedSchedule, isHouseFood) {
        const data = formattedSchedule['0']['feedingSchedules']
        return Object.values(data).reduce((acc, v) => {
            const sched = v['feedingSchedule']['label']
            const amount = v['feedingAmount']['label']
            const unit = v['feedingUnit']['label']
            const instructions = v['feedingInstructions'] !== null ? v['feedingInstructions'] : ''  
            const feedingStr = `${amount} ${unit} ${sched}`
            const customInstructions = `${isHouseFood ? "House Food " : ""}${instructions}`

            return { ...acc, [sched]:  `${feedingStr}${customInstructions ? ": " + customInstructions : customInstructions}` }
        }, {})
    }
    

    createOrAppend(obj, key, value) {
        if (obj.hasOwnProperty(key)) {
            obj[key].push(value)
        } else {
            obj[key] = [value]
        }
        return obj
    }

    async getAllRecords() {
        let records = []
        await table.select().eachPage((page, next) => {
            records = records.concat(page);
            next();
        })

        return records;
    }

    /**
     * 
     * @param {Number} animalId Id of the animal from Gingr
     * @returns {Promise<Record>} Record in Airtable
     */
    async getRecordByAnimalId(animalId) {
        const records = await table.select({
            filterByFormula: `{Animal Id} = ${animalId}`,
            fields: []
        }).firstPage();

        return records[0];
    }

    async createRecords(records) {
        chunk(records, 10).map(async recordChunk => {
            await table.create(recordChunk, opts)
        })
    }

    async updateRecords(records) {
        chunk(records, 10).map(async recordChunk => {
            await table.update(recordChunk, opts)
        })
    }

    async deleteRecords(recordIds) {
        chunk(recordIds, 10).map(async recordIdChunk => {
            await table.destroy(recordIdChunk)
        })
    }


}

module.exports = {
    AirtableService
}