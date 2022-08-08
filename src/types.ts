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
    amount: string,
    unit: string,
    instructions: string
}

export interface MedicationSchedule {
    time: string,
    unit: string,
    type: string,
    amount: string,
    notes: string,
}

export interface Service {
    name: string,
    time: Date,
}