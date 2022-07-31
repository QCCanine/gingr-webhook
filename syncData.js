"use strict";

const { getAllRecords, createRecords, updateRecords, deleteRecords } = require('./services/airtableService');
const { getCheckedInReservations, getMedications, getFeedingInfo, getCheckedInReservationByAnimalId } = require('./services/gingrService/gingrService');

module.exports.syncData = async (event) => {
    const [records, reservations] = await Promise.all([
        getAllRecords(),
        getCheckedInReservations()
    ])

    const reservationsByAnimalId = Object.values(reservations)
        .reduce((acc, reservation) => {
            acc[reservation.animal.id] = reservation
            return acc
        }, {})

    // Add, update or delete all records
    const { toUpdate, toDelete } = records.reduce((acc, record) => {
        const animalId = `${record.fields['Animal Id']}`
        const reservation = reservationsByAnimalId[animalId]
        delete reservationsByAnimalId[animalId]

        if (reservation) {
            //update animal with reservation
            acc.toUpdate.push({ record, reservation })
        } else {
            // delete reservation
            acc.toDelete.push(record.id)
        }
        return acc
    }, { toUpdate: [], toDelete: [] })

    const addResponse = reservationsToFields(Object.values(reservationsByAnimalId))
        .then(createRecords)


    const updateRespose = reservationsToFields(toUpdate.map(u => u.reservation))
        .then(recordData =>
            recordData.map((data, i) => {
                return { id: toUpdate[i].record.id, ...data }
            }
            ))
        .then(updateRecords)

    const deleteResponse = deleteRecords(toDelete)

    await Promise.all[
        addResponse,
        updateRespose,
        deleteResponse
    ]

    console.log("Sync complete")
}

function reservationsToFields(reservations) {
    return Promise.all(
        reservations.map(async reservation => {
            const reservationId  = reservation.reservation_id
            const animalId = reservation.animal.id
            const [medications, feedingSchedule, reservationAdditional] = await Promise.all([
                getMedications(animalId),
                getFeedingInfo(animalId),
                getReservationAdditional(reservationId, animalId),
            ])

            const services = reservation["services"] || [];

            const reservationData = {
                'animal_id': animalId,
                'animal_name': reservation.animal.name,
                'answer_1': reservationAdditional["answer_1"],
                'end_date_iso': reservation['start_date'],
                'type': reservationAdditional["type"]
            }

            return { fields: reservationEventToRecord(reservationData, medications, feedingSchedule, services) }

        })
    )
}