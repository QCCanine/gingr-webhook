import { DogFields } from "../../clients/airtable.ts/types"
import { FeedingSchedule, MedicationSchedule, Reservation, Service } from "../../types"
import { formatInTimeZone } from 'date-fns-tz'

export function reservationToFields(reservation: Reservation): Partial<DogFields> {
    const { lunchSchedule, feedingSchedule } = formatFeedingSchedule(reservation.feedingSchedules)
    const { groomingServices, treatServices } = formatServices(reservation.services)
    const medicationSchedule = formatMedications(reservation.medicationSchedules)

    return {
        "Animal Id": parseInt(reservation.animal.id) ?? undefined,
        "Dog": `${reservation.animal.name}\n${reservation.owner.lastName}`,
        "Feeding": feedingSchedule ?? undefined,
        "Belongings": reservation.belongings ?? undefined,
        "Medication": medicationSchedule ?? undefined,
        "Lunch": lunchSchedule ?? undefined,
        "Kongs/Dental Chews": treatServices ?? undefined,
        "Grooming Services": groomingServices ?? undefined,
        "Departure Date/Time": reservation.departureTime.toISOString(),
        "Type": reservation.type,
    }
}


const groomingServiceNames = new Set(["Basic Bath", "Nail Trim", "Brushing"])
const treatServiceNames = new Set(["Kong Treat", "Dental Chew", "Calming Treat"])
function formatServices(services: Array<Service>): { groomingServices: string | null, treatServices: string| null } {
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
            times.forEach(t => acc.push(`${name} ${formatInTimeZone(t, "America/New_York", "M/d h:mm")}`))
            return acc
        }, [])
        .join('\n')

    const treatStr = Object.entries<Array<Date>>(treat)
        .map(([name, times]) => {
            const timeStr = times.map(t => formatInTimeZone(t, "America/New_York", "M/d")).join(", ")
            return `${name} ${timeStr}`
        })
        .join('\n')

    return { groomingServices: groomingStr ?? null, treatServices: treatStr ?? null}
}

function createOrAppend(obj: object, key: any, value: any): object {
    if (obj.hasOwnProperty(key)) {
        obj[key].push(value)
    } else {
        obj[key] = [value]
    }
    return obj
}


function formatFeedingSchedule(feedingSchedules: Array<FeedingSchedule>): { lunchSchedule: string | null, feedingSchedule: string | null } {
    var feedingSchedule: string | null = null;
    var lunchSchedule: string | null = null;

    feedingSchedules.forEach(schedule => {
        var line = formatLine([schedule.amount, schedule.unit, schedule.time], schedule.instructions)
        if (schedule.time === "Lunch") {
            lunchSchedule = line
        } else {
            feedingSchedule = feedingSchedule ? `${feedingSchedule}\n${line}` : line
        }
    })

    return { feedingSchedule, lunchSchedule }
}


function formatMedications(medicationSchedules: Array<MedicationSchedule>): string | null {
    var medicationSchedule: string | null = null;

    medicationSchedules.forEach(schedule => {
        var line = formatLine([schedule.amount, schedule.unit, schedule.type, schedule.time], schedule.notes)
        medicationSchedule = medicationSchedule ? `${medicationSchedule}\n${line}` : line
    })

    return medicationSchedule;
}

function formatLine(fields: Array<string | null>, additional: string | null): string {
    // remove null elements and join
    var line = fields.filter(x => x).join(" ")

    if (additional) {
        line += `: ${additional}`;
    }

    return line;
}