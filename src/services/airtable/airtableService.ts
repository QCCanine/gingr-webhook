"use strict";

import Airtable, { Record, Records } from 'airtable';
import chunk from 'lodash.chunk';
import {  Reservation } from '../../types'
import { reservationToFields } from "./formatting";
import { DogFields } from "./types";

const baseId = process.env.AIRTABLE_BASE_ID
if (baseId === undefined) {
    throw new Error("environment variable AIRTABLE_BASE_ID is undefined")
}
const opts = {
    typecast: true
}

const table = new Airtable().base(baseId).table<DogFields>("Dogs")

export async function removeDog(animalId: string): Promise<void> {
    const record = await getRecordByAnimalId(animalId);
    if (record) {
        await record.destroy();
    }
}

export async function addDog(reservation: Reservation): Promise<void> {
    const record = reservationToFields(reservation)
    await table.create(record, opts)
}

export async function getAllRecords(): Promise<Records<DogFields>> {
    let records: Records<DogFields> = []
    await table.select().eachPage((page, next) => {
        records = records.concat(page);
        next();
    })

    return records;
}

async function getRecordByAnimalId(animalId: string): Promise<Record<DogFields>> {
    const records = await table.select({
        filterByFormula: `{Animal Id} = ${animalId}`,
        fields: []
    }).firstPage();

    return records[0];
}

export async function createRecords(records: Array<Partial<DogFields>>): Promise<void> {
    chunk(records, 10).map(async (recordChunk: Array<Partial<DogFields>>) => {
        await table.create(recordChunk, opts)
    })
}

export async function updateRecords(records: Array<{ id: string, fields: Partial<DogFields>}>) {
    chunk(records, 10).map(async (recordChunk: Array<{ id: string, fields: Partial<DogFields>}>) => {
        await table.update(recordChunk, opts)
    })
}

export async function deleteRecords(recordIds: Array<string>) {
    chunk(recordIds, 10).map(async (recordIdChunk: Array<string>) => {
        await table.destroy(recordIdChunk)
    })
}





// async function updateDog(entityData) {
//     const animalId = entityData['a_id']

//     const [medications, feedingSchedule, reservations, record] = await Promise.all([
//         getMedications(animalId),
//         getFeedingInfo(animalId),
//         getCheckedInReservations(),
//         getRecordByAnimalId(animalId),
//     ]);

//     const services =
//         Object.values(reservations).map(r => r.animal.id == animalId)?.["services"] || [];

//     const recordData = animalEventToRecord(entityData, medications, feedingSchedule, services)

//     if (record) {
//         record.updateFields(recordData, opts)
//     } else {
//         await table.create(recordData, opts)
//     }
// }

// function animalEventToRecord(entityData, medications, feedingSchedule, services) {
//     const isHouseFood = !!services?.find(service => {
//         service["name"] === "House Food"
//     })

//     const { Lunch, ...feeding } = formatFeedingSchedule(feedingSchedule, isHouseFood)
//     return {
//         "Animal Id": entityData["a_id"],
//         "Dog": entityData["animal_name"],
//         "Feeding": Object.values(feeding).join('\n'),
//         "Medication": medications.join('\n'),
//         "Lunch": Lunch,
//     }
// }
