"use strict";

import { GingerReservationWebhook } from "../../clients/gingr/types";

import Airtable, { FieldSet } from 'airtable';
import { getMedicationSchedules, getFeedingSchedules, getReservationPartials } from '../gingr/gingrService';
import { FeedingSchedule, MedicationSchedule, Reservation, Service } from '../../types'
import chunk from 'lodash.chunk';
import { reservationToFields } from "./formatting";
import { DogFields } from "./types";

const opts = {
    typecast: true
}

const table = new Airtable().base('appd02u10BuFuz904').table<DogFields>("Dogs")

// async function removeDog(animalId) {
//     const record = await getRecordByAnimalId(animalId);
//     if (record) {
//         await record.destroy();
//     }
// }

export async function addDog(reservation: Reservation) {
    const record = reservationToFields(reservation)
    await table.create(record, opts)
}

// async function getAllRecords() {
//     let records = []
//     await table.select().eachPage((page, next) => {
//         records = records.concat(page);
//         next();
//     })

//     return records;
// }

// async function getRecordByAnimalId(animalId) {
//     const records = await table.select({
//         filterByFormula: `{Animal Id} = ${animalId}`,
//         fields: []
//     }).firstPage();

//     return records[0];
// }

// async function createRecords(records) {
//     chunk(records, 10).map(async recordChunk => {
//         await table.create(recordChunk, opts)
//     })
// }

// async function updateRecords(records) {
//     chunk(records, 10).map(async recordChunk => {
//         await table.update(recordChunk, opts)
//     })
// }

// async function deleteRecords(recordIds) {
//     chunk(recordIds, 10).map(async recordIdChunk => {
//         await table.destroy(recordIdChunk)
//     })
// }







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
