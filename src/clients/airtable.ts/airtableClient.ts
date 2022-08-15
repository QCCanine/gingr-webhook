import chunk from 'lodash.chunk';
import Airtable, { Record, Records } from 'airtable';
import { DogFields } from "./types";

const baseId = process.env.AIRTABLE_BASE_ID
if (baseId === undefined) {
    throw new Error("environment variable AIRTABLE_BASE_ID is undefined")
}
const opts = {
    typecast: true
}

const table = new Airtable().base(baseId).table<DogFields>("Dogs")

export async function getRecordByAnimalId(animalId: string): Promise<Record<DogFields>> {
    const records = await table.select({
        filterByFormula: `{Animal Id} = ${animalId}`,
        fields: []
    }).firstPage();

    return records[0];
}

export async function getAllRecords(): Promise<Records<DogFields>> {
    let records: Records<DogFields> = []
    await table.select().eachPage((page, next) => {
        records = records.concat(page);
        next();
    })

    return records;
}

export async function createRecord(recordData: Partial<DogFields>): Promise<void> {
    await table.create(recordData, opts)
}

export async function createRecords(recordFields: Array<Partial<DogFields>>): Promise<void> {
    const records = recordFields.map(fields => ({ fields }))
    await Promise.all(
        chunk(records, 10).map(async (recordChunk: { fields: Partial<DogFields> }[]) => {
            table.create(recordChunk, opts)
        })
    )

}

export async function updateRecords(records: Array<{ id: string, fields: Partial<DogFields>}>): Promise<void> {
    await Promise.all(
        chunk(records, 10).map(async (recordChunk: { id: string, fields: Partial<DogFields>}[]) => {
            table.update(recordChunk, opts)
        })
    )
}

export async function deleteRecords(recordIds: Array<string>): Promise<void> {
    await Promise.all(
        chunk(recordIds, 10).map(async (recordIdChunk: string[]) => {
            table.destroy(recordIdChunk)
        })
    )
}