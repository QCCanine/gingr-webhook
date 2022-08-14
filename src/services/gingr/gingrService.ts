import axios from 'axios';
import { getCheckedInReservations, getFeedingInfo, getMedicationInfo, getReservationsByAnimalId } from '../../clients/gingr/gingrClient';
import { ReservationPartial, Reservation, MedicationSchedule, FeedingSchedule } from '../../types'

const client = axios.create({
    baseURL: "https://queencitycanine.gingrapp.com/api/v1",
    params: {
        key: process.env.GINGR_API_KEY
    }
})

export async function getCheckedInReservationPartials(): Promise<Array<ReservationPartial>> {
    const res = await getCheckedInReservations();

    return Object.values(res.data).map(r => ({
        id: r.reservation_id,
        animal: {
            id: r.animal.id,
            name: r.animal.name
        },
        owner: {
            lastName: r.owner.last_name
        },
        services: r.services.map(s => ({ 
            name: s.name, time: 
            new Date(s.scheduled_at)
        })),
        departureTime: new Date(r.end_date)
    }))
}


export async function getReservationAdditional(reservation: ReservationPartial): Promise<Reservation> {
    const [feedingSchedules, medicationSchedules, animalReservations] = await Promise.all([
        getFeedingSchedules(reservation.animal.id),
        getMedicationSchedules(reservation.animal.id),
        getReservationsByAnimalId(reservation.animal.id)
    ])

    const additional = animalReservations.data.find(r => r.r_id == reservation.id);
    if (additional === undefined) {
        throw new Error(`can't find reservation for { reservationId: ${reservation}, animalId: ${reservation.animal.id}`)
    }

    return {
        ...reservation,
        feedingSchedules,
        medicationSchedules,
        belongings: additional.answer_1,
        type: additional.type
    };
}

export async function getMedicationSchedules(animalId: string): Promise<Array<MedicationSchedule>> {
    const res = await getMedicationInfo(animalId)

    const schedules: { [id: string]: string} = 
        res.medicationSchedules
            .reduce((a, v) => ({ ...a, [v.id]: v.time }), {})

    const keys = 
        Object.keys(res.animal_medication_schedules)
            .map(k => parseInt(k))
            .sort()

    return keys.reduce((acc: Array<MedicationSchedule>, k: number) =>
        acc.concat(
            res.animal_medication_schedules[k].map(med => ({
                time: schedules[k],
                unit: med.medication_unit.value_string,
                type: med.medication_type.value_string,
                amount: med.medication_amount.value_string,
                notes: med.medication_notes.value
            }))
        ),
        []
    )
}

export async function getFeedingSchedules(animalId: string): Promise<Array<FeedingSchedule>> {
    const feedingInfo = await getFeedingInfo(animalId);

    return Object.values(feedingInfo[0].feedingSchedules).map(s => ({
        time: s.feedingSchedule.label,
        amount: s.feedingAmount.label,
        unit: s.feedingUnit.label,
        instructions: s.feedingInstructions
    }))
}
