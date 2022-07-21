const axios = require('axios').default

class GingrService {
    constructor() {
        this.client = axios.create({
            baseURL: "https://queencitycanine.gingrapp.com/api/v1",
            params: {
                key: process.env.GINGR_API_KEY
            }
        })
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
            .reduce((a, v) => ({ ...a, [v.id]: v.time}), {})

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

        return this.formatFeedingSchedule(res.data)
    }

    formatFeedingSchedule(json) {
        const data = json['0']['feedingSchedules']
        return Object.values(data).reduce((acc, v) => {
            const sched = v['feedingSchedule']['label']
            const amount = v['feedingAmount']['label']
            const unit = v['feedingUnit']['label']
            const instructions = v['feedingInstructions']
            const feedingStr = `${amount} ${unit} ${sched}`
            console.log(feedingStr)
            console.log(instructions)
            console.log(instructions != null ? `${feedingStr}: ${instructions}` : feedingStr)

            return { ...acc, [sched]: instructions != null ? `${feedingStr}: ${instructions}` : feedingStr }
        }, {})
    }

    
}

module.exports = {
    GingrService
}