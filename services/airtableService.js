"use strict";

const Airtable = require('airtable')
const { getMedications, getFeedingInfo, getCheckedInReservations } = require('./gingrService/gingrService');
const chunk = require('lodash.chunk')

const opts = {
    typecast: true
}
const groomingServices = new Set(["Basic Bath", "Nail Trim", "Brushing"])
const treatServices = new Set(["Kong Treat", "Dental Chew"])

const table = new Airtable().base('appd02u10BuFuz904').table("Dogs")

async function removeDog(animalId) {
    const record = await getRecordByAnimalId(animalId);
    if (record) {
        await record.destroy();
    }
}

async function addDog(event) {
    const reservationId = event["entity_id"];
    const data = event["entity_data"];
    const animalId = data["animal_id"];

    const [medications, feedingSchedule, reservations] = await Promise.all([
        getMedications(animalId),
        getFeedingInfo(animalId),
        getCheckedInReservations(),
    ])

    const services = reservations[`${reservationId}`]?.["services"] || [];

    const record = reservationEventToRecord(data, medications, feedingSchedule, services)
    await table.create(record, opts)
}

async function updateDog(entityData) {
    const animalId = entityData['a_id']

    const [medications, feedingSchedule, reservations, record] = await Promise.all([
        getMedications(animalId),
        getFeedingInfo(animalId),
        getCheckedInReservations(),
        getRecordByAnimalId(animalId),
    ]);

    const services =
        Object.values(reservations).map(r => r.animal.id == animalId)?.["services"] || [];

    const recordData = animalEventToRecord(entityData, medications, feedingSchedule, services)

    if (record) {
        record.updateFields(recordData, opts)
    } else {
        await table.create(recordData, opts)
    }
}

function reservationEventToRecord(reservation, medications, feedingSchedule, services) {
    const isHouseFood = !!services?.find(service => {
        service["name"] === "House Food"
    })

    const { Lunch, ...feeding } = formatFeedingSchedule(feedingSchedule, isHouseFood)

    const serviceTimes = getServiceTimes(services)

    const treats = Object.entries(serviceTimes.treat)
        .map(([name, times]) => {
            const timeStr = times.map(formatShortDate).join(", ")
            return `${name} ${timeStr}`
        })
        .join('\n')


    const grooming = Object.entries(serviceTimes.grooming)
        .reduce((acc, [name, times]) => {
            times.forEach(t => acc.push(`${name} ${formatShortDatetime(t)}`))
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
    }
}

function animalEventToRecord(entityData, medications, feedingSchedule, services) {
    const isHouseFood = !!services?.find(service => {
        service["name"] === "House Food"
    })

    const { Lunch, ...feeding } = formatFeedingSchedule(feedingSchedule, isHouseFood)
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

function getServiceTimes(services) {
    return services.reduce((acc, service) => {
        const name = service["name"];
        const time = new Date(service["scheduled_at"])

        if (groomingServices.has(name)) {
            createOrAppend(acc.grooming, name, time)
        } else if (treatServices.has(name)) {
            createOrAppend(acc.treat, name, time)
        }

        return acc
    }, { grooming: [], treat: [] })
}

function formatShortDate(t) {
    return `${t.getMonth() + 1}/${t.getDate()}`
}

function formatShortDatetime(t) {
    let hours = t.getHours() % 12
    hours = hours == 0 ? 12 : hours

    const minutes = ('0' + t.getMinutes()).slice(-2)
    return `${formatShortDate(t)} ${hours}:${minutes}`
}

function formatFeedingSchedule(formattedSchedule, isHouseFood) {
    const data = formattedSchedule['0']['feedingSchedules']
    return Object.values(data).reduce((acc, v) => {
        const sched = v['feedingSchedule']['label']
        const amount = v['feedingAmount']['label']
        const unit = v['feedingUnit']['label']
        const instructions = v['feedingInstructions'] !== null ? v['feedingInstructions'] : ''
        const feedingStr = `${amount} ${unit} ${sched}`
        const customInstructions = `${isHouseFood ? "House Food " : ""}${instructions}`

        return { ...acc, [sched]: `${feedingStr}${customInstructions ? ": " + customInstructions : customInstructions}` }
    }, {})
}


function createOrAppend(obj, key, value) {
    if (obj.hasOwnProperty(key)) {
        obj[key].push(value)
    } else {
        obj[key] = [value]
    }
    return obj
}

async function getAllRecords() {
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
async function getRecordByAnimalId(animalId) {
    const records = await table.select({
        filterByFormula: `{Animal Id} = ${animalId}`,
        fields: []
    }).firstPage();

    return records[0];
}

async function createRecords(records) {
    chunk(records, 10).map(async recordChunk => {
        await table.create(recordChunk, opts)
    })
}

async function updateRecords(records) {
    chunk(records, 10).map(async recordChunk => {
        await table.update(recordChunk, opts)
    })
}

async function deleteRecords(recordIds) {
    chunk(recordIds, 10).map(async recordIdChunk => {
        await table.destroy(recordIdChunk)
    })
}

module.exports = {
    removeDog,
    addDog,
    updateDog,
    getAllRecords,
    createRecords,
    updateRecords,
    deleteRecords
}