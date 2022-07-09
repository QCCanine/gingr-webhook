"use strict";

const Airtable = require('airtable')
const { NotFoundError } = require('./errors/NotFoundError')

class AirtableService {
    constructor() {
        this.table = new Airtable().base('appd02u10BuFuz904').table("Dogs")
    }

    async removeDog(animalId) {
        const recordId = await this.getRecordIdByAnimalId(animalId);
        await this.table.destroy(recordId)
    }

    async addDog(entityData) {
        const record = this.entityToRecord(entityData)
        await this.table.create(record, {
            typecast: true
        })
    }

    entityToRecord(entityData) {
        return {
            "Animal Id": parseInt(entityData["animal_id"]),
            "Dog": entityData["animal_name"]
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