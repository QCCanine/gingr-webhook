export interface GetReservationsResponse {
    error: boolean,
    data: GetReservationsResponseData
}

export interface GetReservationsResponseData {
    [reservationId: string]: {
        reservation_id: string,
        standing_reservation: boolean,
        start_date: string,
        end_date: string,
        cancelled_date: string | null,
        confirmed_date: string | null,
        check_in_date: string | null,
        check_out_date: string | null,
        created_date: string | null,
        wait_list_date: string | null,
        reservation_type: {
            id: string,
            type: string
        },
        notes: {
            reservation_notes: string,
            animal_notes: string | null,
            owner_notes: string | null
        },
        warnings: {
            medicines: string,
            allergies: string
        }
        animal: {
            id: string,
            name: string,
            breed: string
        }
        owner: {
            id: string,
            first_name: string,
            last_name: string,
            address_1: string,
            address_2: string,
            city: string,
            region: string,
            email: string,
            cell_phone: string
        },
        services: Array<{
            id: string,
            name: string,
            scheduled_at: string,
            scheduled_until: string,
            cost: number,
            assigned_to: string | null,
            completed_by: string | null,
            completed_at: string | null
        }>
        deposit: Array<unknown>,
        transaction: Array<unknown>,
    }
}

export interface GetMedicationsResponse {
    medicationSchedules: Array<{
        id: string,
        time: string
    }>,
    medicationUnitOptions: Array<{
        value: string,
        label: string
    }>,
    medicationAmountOptions: Array<{
        value: string,
        label: string
    }>,
    medicationTypeOptions: Array<{
        value: string,
        label: string
    }>,
    animal_id: string,
    animal_medication_schedules: {
        [medicationScheduleId: string]: Array<{
            id: string,
            medication_schedule_id: string,
            medication_notes: {
                value: string
            },
            medication_amount: {
                value: string
                value_string: string
            },
            medication_type: {
                value: string
                value_string: string
            },
            medication_unit: {
                value: string
                value_string: string
            }
        }>
    }
}

export interface GetFeedingInfoResponse {
    feedingSchedules: Array<{
        id: string,
        time: string
    }>,
    feedingMethodOptions: Array<{
        value: string,
        label: string
    }>,
    feedingUnitOptions: Array<{
        value: string,
        label: string
    }>,
    feedingAmountOptions: Array<{
        value: string,
        label: string
    }>,
    feedingTypeOptions: Array<{
        value: string,
        label: string
    }>,
    0: {
        animal_id: string,
        feedingSchedules: {
            [feedingScheduleId: string]: {
                id: string,
                scheduleId: string,
                feedingSchedule: {
                    value: string,
                    label: string
                },
                feedingInstructions: string,
                feedingAmount: {
                    value: string,
                    label: string
                },
                feedingUnit: {
                    value: string,
                    label: string
                }
            }
        }
    }
}

export interface GetReservationsByAnimalIdResponse {
    success: boolean,
    data: Array<ReservationByAnimalIdData>
}

interface ReservationData {
    a_id: string,
    animal_id: string,
    animal_name: string,
    gender: string,
    fixed: string,
    vip: string,
    medicines: string,
    image: string,
    species_id: string,
    a_notes: string,
    grooming_notes: string | null,
    birthday: string,
    weight: string,
    pricing_rules_apply: string,
    next_immunization_expiration: string,
    o_id: string,
    o_first: string,
    o_last: string,
    address_1: string
    address_2: string
    city: string
    state: string
    zip: string
    email: string
    home_phone: string
    cell_phone: string
    emergency_contact_name: string,
    emergency_contact_phone: string,
    o_notes: string | null,
    current_balance: string,
    default_payment_method_fk: string | null,
    stripe_customer_id: string,
    vet_id: string,
    vet_name: string,
    vet_phone: string,
    barcode: string | null,
    r_id: string,
    start_date: string,
    end_date: string,
    r_notes: string,
    confirmed_stamp: string | null,
    cancel_stamp: string | null,
    check_in_stamp: string | null,
    check_out_stamp: string | null,
    wait_list_stamp: string | null,
    wait_list_accepted_stamp: string | null,
    location_id: string,
    last_email_sent: string,
    last_sms_sent: string | null,
    class_id: string | null,
    type_id: string,
    self_made: string,
    answer_1: string | null,
    answer_2: string | null,
    answer_3: string | null,
    created_at: string,
    base_rate: string,
    final_rate: string,
    units_of_time: string | null,
    void_id: string | null,
    created_by: string | null,
    breed_id: string,
    breed_name: string ,
    feeding_method: string | null,
    feeding_type: string | null,
    feeding_notes: string | null,
    temperment_type: string | null,
    default_payment_method: string | null,
    payment_amount: string | null,
    type: string,
    question_1: string | null,
    question_2: string | null,
    question_3: string | null,
    charge_by_hour: string,
    single_day: string,
    only_appointment: string,
    show_on_feeding_report: string,
    show_on_medication_report: string,
    account_code_id: string | null,
    location_name: string,
    location_city: string,
    location_timezone: string | null,
    cancellation_reason: string | null,
    cancellation_reason_id: string | null,
    cancelled_by_username: string | null,
    services_string: string,
    feeding_time: string,
    feeding_amount: string
}

export interface ReservationByAnimalIdData extends ReservationData {
    check_in_stamp_formatted: string | null,
    check_out_stamp_formatted: string | null,
    start_date_formatted: string,
    end_date_formatted: string
}

export interface GingrWebhook<T> {
    webhook_url: string,
    webhook_type: string,
    entity_id: number,
    entity_type: string,
    entity_data: T,
    signature: string,
    numberTries: number
}

export interface GingerReservationWebhook extends GingrWebhook<WebhookReservationData> {}

interface WebhookReservationData extends ReservationData {
    start_date_iso: string,
    check_in_stamp_iso: string | null,
    end_date_iso: string,
    form: {
        system_id: string,
        notes: string,
        submission_id: string,
        is_dirty: string
    }
}