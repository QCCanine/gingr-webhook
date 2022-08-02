interface ReservationPartial {
    id: string,
    animal: Animal,
    services: Array<Service>,
    departureTime: Date,
}

interface Reservation extends ReservationPartial {
    feedingSchedules: Array<FeedingSchedule>
    medicationSchedules: Array<MedicationSchedule>,
    belongings: string | null,
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