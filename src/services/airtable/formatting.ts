import { FeedingSchedule, MedicationSchedule, Reservation, Service } from "../../types"
import { DogFields } from "./types"

export function reservationToFields(reservation: Reservation): Partial<DogFields> {
    const { lunchSchedule, feedingSchedule } = formatFeedingSchedule(reservation.feedingSchedules)
    const { groomingServices, treatServices } = formatServices(reservation.services)
    const medicationSchedule = formatMedications(reservation.medicationSchedules)

    return {
        "Animal Id": parseInt(reservation.animal.id),
        "Dog": reservation.animal.name,
        "Feeding": feedingSchedule,
        "Belongings": reservation.belongings ?? undefined,
        "Medication": medicationSchedule,
        "Lunch": lunchSchedule,
        "Kongs/Dental Chews": treatServices,
        "Grooming Services": groomingServices,
        "Departure Date/Time": reservation.departureTime.toISOString(),
        "Type": reservation.type,
    }
}


const groomingServiceNames = new Set(["Basic Bath", "Nail Trim", "Brushing"])
const treatServiceNames = new Set(["Kong Treat", "Dental Chew"])
function formatServices(services: Array<Service>): { groomingServices: string | undefined, treatServices: string| undefined } {
    const { grooming, treat } = services.reduce((acc: { grooming: {[serviceName: string]: Array<Date>}, treat: {[serviceName: string]: Array<Date>} }, service: Service) => {
        if (groomingServiceNames.has(service.name)) {
            createOrAppend(acc.grooming, service.name, service.time)
        } else if (treatServiceNames.has(service.name)) {
            createOrAppend(acc.treat, service.name, service.time)
        }

        return acc
    }, { grooming: {}, treat: {} })

    const groomingStr = Object.entries<Array<Date>>(grooming)
        .reduce((acc: Array<string>, [name, times]) => {
            times.forEach(t => acc.push(`${name} ${formatShortDateTime(t)}`))
            return acc
        }, [])
        .join('\n')

    const treatStr = Object.entries<Array<Date>>(treat)
        .map(([name, times]) => {
            const timeStr = times.map(formatShortDate).join(", ")
            return `${name} ${timeStr}`
        })
        .join('\n')

    return { groomingServices: groomingStr ?? undefined, treatServices: treatStr ?? undefined}
}

function formatShortDate(t: Date): string {
    return `${t.getMonth() + 1}/${t.getDate()}`
}

function formatShortDateTime(t: Date): string {
    let hours = t.getHours() % 12
    hours = hours == 0 ? 12 : hours

    const minutes = ('0' + t.getMinutes()).slice(-2)
    return `${formatShortDate(t)} ${hours}:${minutes}`
}

function createOrAppend(obj: object, key: any, value: any): object {
    if (obj.hasOwnProperty(key)) {
        obj[key].push(value)
    } else {
        obj[key] = [value]
    }
    return obj
}


function formatFeedingSchedule(feedingSchedules: Array<FeedingSchedule>): { lunchSchedule: string | undefined, feedingSchedule: string | undefined } {
    return feedingSchedules.reduce((acc: { lunchSchedule: string | undefined, feedingSchedule: string | undefined}, schedule: FeedingSchedule) => {
        var line = `${schedule.amount} ${schedule.unit} ${schedule.time}`;
        const notes = schedule.instructions;
        if (notes) {
            line += `: ${notes}`
        }
        if (schedule.time === "Lunch") {
            acc.lunchSchedule = notes
        } else {
            acc.feedingSchedule = acc.feedingSchedule ? notes : `${acc.feedingSchedule}\n${notes}`
        }

        return acc;
    }, { lunchSchedule: undefined, feedingSchedule: undefined})
}


function formatMedications(medicationSchedules: Array<MedicationSchedule>): string | undefined {
    return medicationSchedules.reduce((acc: string | undefined, s: MedicationSchedule) => {
        var str = `${s.amount} ${s.unit} ${s.type} ${s.time}`;
        if (s.notes) {
            str += `: ${s.notes}`
        }
        
        return acc ? str : acc + `\n${str}`
    }, undefined)
}