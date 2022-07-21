"use strict";

const Airtable = require('airtable')
const { NotFoundError } = require('../errors/NotFoundError')

class AirtableService {
    constructor() {
        this.table = new Airtable().base('appd02u10BuFuz904').table("Dogs")
    }

    async removeDog(animalId) {
        const recordId = await this.getRecordIdByAnimalId(animalId);
        await this.table.destroy(recordId)
    }

    async addDog(entityData, medications, feedingSchedule) {
        const record = this.entityToRecord(entityData, medications, feedingSchedule)
        await this.table.create(record, {
            typecast: true
        })
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
     * @returns {Promise<Number>} Id of the record in Airtable
     */
    async getRecordIdByAnimalId(animalId) {
        const records = await this.table.select({
            filterByFormula: `{Animal Id} = ${animalId}`,
            fields: []
        }).firstPage();

        const record = records[0];
        if(!record) {
            throw new NotFoundError(`record for animal ${animalId} not found`)
        }
        return record["id"];
    }

}

module.exports = {
    AirtableService
}