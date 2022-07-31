interface GingrResponse<T> {
    error: boolean,
    data: T
}

interface GetReservationsResponse extends GingrResponse<GetReservationsResponseData> {}

interface GetReservationsResponseData {
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
        trasaction: Array<unknown>,
    }
}