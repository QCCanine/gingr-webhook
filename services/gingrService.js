const axios = require('axios').default
const FormData = require('form-data');

class GingrService {
    constructor() {
        this.client = axios.create({
            baseURL: "https://queencitycanine.gingrapp.com/api/v1",
            params: {
                key: process.env.GINGR_API_KEY
            }
        })
    }

    async getCheckedInReservations() {
        const data = new FormData();
        data.append("checked_in", "true")
        const res = await this.client.post("/reservations", data, {
            headers: data.getHeaders()
        })

        return res.data["data"];
    }

    async getMedications(animalId) {
        const res = await this.client.get("/get_medication_info", {
            params: {
                animal_id: animalId
            }
        })

        return this.formatMedications(res.data)
    }

    formatMedications(json) {
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

    async getFeedingSchedule(animalId) {
        const res = await this.client.get("/get_feeding_info", {
            params: {
                animal_id: animalId
            }
        })

        return res.data
    }

    async getCheckedInReservationByAnimalId(animalId) {
        const res = await this.client.get("/reservations_by_animal", {
            params: {
                id: animalId,
                restrict_to: "currently_checked_in"
            }
        })

        const now = new Date()
        return res.data["data"].find(r => 
            new Date(r.end_date_formatted) >= now && 
            new Date(r.start_date_formatted) <= now
        );
    }

}

module.exports = {
    GingrService
}