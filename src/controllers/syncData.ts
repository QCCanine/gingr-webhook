import { Record } from 'airtable';
import { createRecords, deleteRecords, getAllRecords, updateRecords } from '../services/airtable/airtableService';
import { reservationToFields } from '../services/airtable/formatting';
import { DogFields } from '../services/airtable/types';
import { getCheckedInReservationPartials, getReservationAdditional } from '../services/gingr/gingrService';
import { ReservationPartial } from '../types';

export async function syncData() {
    const [records, reservations] = await Promise.all([
        getAllRecords(),
        getCheckedInReservationPartials()
    ])

    const reservationsByAnimalId: {[id: string]: ReservationPartial} = 
        reservations.reduce((acc, reservation) => {
            acc[reservation.animal.id] = reservation
            return acc
        }, {})

    // Add, update or delete all records
    const toUpdate: Array<{record: Record<DogFields>, reservation: ReservationPartial}> = []
    const toDelete: Array<string> = []
    records.forEach(record => {
        const animalId = `${record.fields['Animal Id']}`
        const reservation = reservationsByAnimalId[animalId]
        delete reservationsByAnimalId[animalId]

        if (reservation) {
            //update animal with reservation
            toUpdate.push({ record, reservation })
        } else {
            // delete reservation
            toDelete.push(record.id)
        }
    })

    const addResponse = reservationsToFields(Object.values(reservationsByAnimalId))
        .then(createRecords)


    const updateResponse = reservationsToFields(toUpdate.map(u => u.reservation))
        .then(recordData =>
            recordData.map<{id: string, fields: Partial<DogFields>}>((fields, i) => {
                return { id: toUpdate[i].record.id, fields }
            }
            ))
        .then(updateRecords)

    const deleteResponse = deleteRecords(toDelete)

    await Promise.all([
        addResponse,
        updateResponse,
        deleteResponse
    ])

    console.log("Sync complete")
}

function reservationsToFields(reservations: Array<ReservationPartial>): Promise<Array<Partial<DogFields>>> {
    return Promise.all(
        reservations.map(r => getReservationAdditional(r).then(reservationToFields))
    )
}