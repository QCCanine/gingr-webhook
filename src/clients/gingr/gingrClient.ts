import axios from 'axios';
import FormData from 'form-data';

import type { GetFeedingInfoResponse, GetMedicationsResponse, GetReservationsByAnimalIdResponse, GetReservationsResponse } from './types'

const client = axios.create({
    baseURL: "https://queencitycanine.gingrapp.com/api/v1",
    params: {
        key: process.env.GINGR_API_KEY
    }
})

export async function getCheckedInReservations(): Promise<GetReservationsResponse> {
    const data = new FormData();
    data.append("checked_in", "true")
    const res = await client.post<GetReservationsResponse>("/reservations", data, {
        headers: data.getHeaders()
    })

    return res.data;
}

export async function getMedicationInfo(animalId: string): Promise<GetMedicationsResponse> {
    const res = await client.get<GetMedicationsResponse>("/get_medication_info", {
        params: {
            animal_id: animalId
        }
    })

    return res.data;
}

export async function getFeedingInfo(animalId: string): Promise<GetFeedingInfoResponse> {
    const res = await client.get<GetFeedingInfoResponse>("/get_feeding_info", {
        params: {
            animal_id: animalId
        }
    })

    return res.data
}

export async function getReservationsByAnimalId(animalId: string): Promise<GetReservationsByAnimalIdResponse> {
    const res = await client.get<GetReservationsByAnimalIdResponse>("/reservations_by_animal", {
        params: {
            id: animalId,
            restrict_to: "currently_checked_in"
        }
    })

    return res.data;

}
