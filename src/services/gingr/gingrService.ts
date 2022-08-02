import axios from 'axios';
import FormData from 'form-data';

import type { GetFeedingInfoResponse, GetMedicationsResponse, GetReservationsByAnimalIdResponse, GetReservationsResponse, GetReservationsResponseData, ReservationByAnimalIdData } from './types'

const client = axios.create({
    baseURL: "https://queencitycanine.gingrapp.com/api/v1",
    params: {
        key: process.env.GINGR_API_KEY
    }
})

async function getCheckedInReservations(): Promise<GetReservationsResponseData> {
    const data = new FormData();
    data.append("checked_in", "true")
    const res = await client.post<GetReservationsResponse>("/reservations", data, {
        headers: data.getHeaders()
    })

    return res.data.data;
}

async function getMedications(animalId: string) {
    const res = await client.get<GetMedicationsResponse>("/get_medication_info", {
        params: {
            animal_id: animalId
        }
    })

    return formatMedications(res.data)
}

function formatMedications(json) {
    const schedules = json["medicationSchedules"]
        .reduce((a, v) => ({ ...a, [v.id]: v.time }), {})

    const keys =
        Object.keys(json["animal_medication_schedules"])
            .map(k => parseInt(k))
            .sort()

    return keys.reduce((acc, k) =>
        acc.concat(
            json["animal_medication_schedules"][k].map(med => {
                const sched = schedules[k];
                const unit = med['medication_unit']['value_string'];
                const type = med['medication_type']['value_string'];
                const amount = med['medication_amount']['value_string'];
                const notes = med['medication_notes']['value'];
                return `${amount} ${unit} ${type} ${sched}: ${notes}`
            })
        ),
        []
    )
}

async function getFeedingInfo(animalId: string): Promise<GetFeedingInfoResponse> {
    const res = await client.get<GetFeedingInfoResponse>("/get_feeding_info", {
        params: {
            animal_id: animalId
        }
    })

    return res.data
}

async function getReservationAdditional(reservationId: string, animalId: string): Promise<ReservationByAnimalIdData> {
    const res = await client.get<GetReservationsByAnimalIdResponse>("/reservations_by_animal", {
        params: {
            id: animalId,
            restrict_to: "currently_checked_in"
        }
    })

    const reservation = res.data.data.find(r => r["r_id"] == reservationId);
    if (reservation === undefined) {
        throw new Error(`can't find reservation for { reservationId: ${reservationId}, animalId: ${animalId}`)
    }

    return reservation;
}


module.exports = {
    getCheckedInReservations,
    getMedications,
    getFeedingInfo,
    getReservationAdditional
}
