"use strict";

import { createRecord, createRecords, deleteRecords, getAllRecords, getRecordByAnimalId, updateRecords } from '../../clients/airtable.ts/airtableClient';
import { DogFields } from '../../clients/airtable.ts/types';
import { Reservation, ReservationPartial } from '../../types'
import { reservationToFields } from "./formatting";


export async function removeDog(animalId: string): Promise<void> {
    const record = await getRecordByAnimalId(animalId);
    if (record) {
        await record.destroy();
    }
}

export async function addDog(reservation: Reservation): Promise<void> {
    const fields = reservationToFields(reservation)
    await createRecord(fields)
}

export async function syncData(
    getReservations: () => Promise<ReservationPartial[]>,
    getAdditional: (r: ReservationPartial) => Promise<Reservation> 
): Promise<void>  {
    const [records, reservations] = await Promise.all([
        getAllRecords(),
        getReservations(),
    ])

    const reservationsByAnimalId: {[id: string]: ReservationPartial} = 
        reservations.reduce((acc, reservation) => {
            acc[reservation.animal.id] = reservation
            return acc
        }, {})

    // Add, update or delete all records
    const toUpdate: Array<{recordId: string, reservation: ReservationPartial}> = []
    const toDelete: Array<string> = []
    records.forEach(record => {
        const animalId = `${record.fields['Animal Id']}`
        const reservation = reservationsByAnimalId[animalId]
        delete reservationsByAnimalId[animalId]

        if (reservation) {
            //update animal with reservation
            toUpdate.push({ recordId: record.id, reservation })
        } else {
            // delete reservation
            toDelete.push(record.id)
        }
    })

    const reservationsToFields = (reservations: ReservationPartial[]) => 
        Promise.all(reservations.map(r => getAdditional(r).then(reservationToFields)))

    const addResponse = reservationsToFields(Object.values(reservationsByAnimalId))
        .then(createRecords)


    const updateResponse = reservationsToFields(toUpdate.map(u => u.reservation))
        .then(recordData =>
            recordData.map<{id: string, fields: Partial<DogFields>}>((fields, i) => {
                return { id: toUpdate[i].recordId, fields }
            }
            ))
        .then(updateRecords)

    const deleteResponse = deleteRecords(toDelete)

    await Promise.all([
        addResponse,
        updateResponse,
        deleteResponse
    ])
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
