export interface ReservationPartial {
    id: string,
    animal: Animal,
    services: Array<Service>,
    departureTime: Date,
}

export interface Reservation extends ReservationPartial {
    feedingSchedules: Array<FeedingSchedule>
    medicationSchedules: Array<MedicationSchedule>,
    belongings: string | null,
    type: string
}

export interface Animal {
    id: string,
    name: string
}

export interface FeedingSchedule {
    time: string,
    amount: string | null,
    unit: string | null,
    instructions: string | null
}

export interface MedicationSchedule {
    time: string,
    unit: string | null,
    type: string | null,
    amount: string | null,
    notes: string | null,
}

export interface Service {
    name: string,
    time: Date,
}