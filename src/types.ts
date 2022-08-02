interface Reservation {
    id: string,
    animal: Animal,
    feedingSchedules: Array<FeedingSchedule>
    medicationSchedules: Array<MedicationSchedule>,
    services: Array<Service>,
    belongings: string,
    departureTime: Date,
    type: string
}

interface Animal {
    id: string,
    name: string
}

interface FeedingSchedule {
    time: string,
    amount: string,
    unit: string,
    instructions: string
}

interface MedicationSchedule {
    time: string,
    unit: string,
    type: string,
    amount: string,
    notes: string,
}

interface Service {
    name: string,
    time: Date,
}