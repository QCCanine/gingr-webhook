"use strict";

const { AirtableService } = require('./services/airtableService');
const { GingrService } = require('./services/gingrService');

const gingrService = new GingrService()
const airtableService = new AirtableService()

module.exports.syncData = async (event) => {
    const [records, reservations] = await Promise.all([
        airtableService.getAllRecords(),
        gingrService.getCheckedInReservations()
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
            acc.toUpdate.push({record, reservation})
        } else {
            // delete reservation
            acc.toDelete.push(record.id)
        }
        return acc
    }, { toUpdate: [], toDelete: []})

    const addRecords = reservationsToFields(Object.values(reservationsByAnimalId))
        .then(airtableService.createRecords)

    
    const updateRecords = reservationsToFields(toUpdate.map(u => u.reservation))
        .then(recordData =>
            recordData.map((data, i) => {
                return { id: toUpdate[i].record.id, ...data}
            }
        ))
        .then(airtableService.updateRecords)

    const deleteRecords = airtableService.deleteRecords(toDelete)

    await Promise.all[
        addRecords,
        updateRecords,
        deleteRecords
    ]

    console.log("Sync complete")
}

function reservationsToFields(reservations) {
    return Promise.all(
        reservations.map(async reservation => {
            const animalId = reservation.animal.id
            const [medications, feedingSchedule, reservationAdditional] = await Promise.all([
                gingrService.getMedications(animalId),
                gingrService.getFeedingSchedule(animalId),
                gingrService.getCheckedInReservationByAnimalId(animalId),
            ])

            const services = reservation["services"] || [];

            const reservationData = {
                'animal_id': animalId,
                'animal_name': reservation.animal.name,
                'answer_1': reservationAdditional["answer_1"],
                'end_date_iso': reservation['start_date'],
                'type': reservationAdditional["type"]
            }

            return { fields: airtableService.reservationEventToRecord(reservationData, medications, feedingSchedule, services) }

        })
    )
}