import axios from 'axios';
import FormData from 'form-data';

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

async function getMedications(animalId) {
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

async function getFeedingSchedule(animalId) {
    const res = await client.get("/get_feeding_info", {
        params: {
            animal_id: animalId
        }
    })

    return res.data
}

async function getReservationAdditional(reservationId, animalId) {
    const res = await this.client.get("/reservations_by_animal", {
        params: {
            id: animalId,
            restrict_to: "currently_checked_in"
        }
    })

    return res.data["data"].find(r => r["r_id"] == reservationId);
}


module.exports = {
    getCheckedInReservations,
    getMedications,
    getFeedingSchedule,
    getReservationAdditional
}
