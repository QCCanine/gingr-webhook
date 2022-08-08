import { createHmac } from "crypto";
import { GingerReservationWebhook, GingrWebhook } from "../clients/gingr/types";
import { addDog, removeDog } from "../services/airtable/airtableService";
import { APIGatewayProxyResult } from 'aws-lambda';
import { getFeedingSchedules, getMedicationSchedules, getCheckedInReservationPartials } from "../services/gingr/gingrService";
import { Reservation } from "../types";

export const SUCCESS_RESPONSE: APIGatewayProxyResult = { statusCode: 200, body: '' }

export function hasValidSignature(event: GingrWebhook<any>): boolean {
    const key = process.env.WEBHOOK_SIGNATURE_KEY;
    if (key === undefined) {
        throw new Error("no key set in parameter store  to validate webhook")
    }

    const token = `${event.webhook_type}${event.entity_id}${event.entity_type}`;
    const signature =
        createHmac('sha256', key)
            .update(token)
            .digest('hex');

    return signature === event.signature
}

export async function checkIn(event: GingerReservationWebhook): Promise<APIGatewayProxyResult> {
    const reservationId = event.entity_id;
    const data = event.entity_data;
    const animalId = data.animal_id;


    const [medicationSchedules, feedingSchedules, reservations] = await Promise.all([
        getMedicationSchedules(animalId),
        getFeedingSchedules(animalId),
        getCheckedInReservationPartials(),
    ])

    const services = reservations[`${reservationId}`]?.services ?? [];

    const reservation: Reservation = {
        id: `${reservationId}`,
        animal: {
            id: data.animal_id,
            name: data.animal_name
        },
        services,
        departureTime: new Date(data.end_date_iso),
        medicationSchedules,
        feedingSchedules,
        belongings: data.answer_1,
        type: data.type
    }
    await addDog(reservation)

    return SUCCESS_RESPONSE;
}

export async function checkOut(event: GingerReservationWebhook): Promise<APIGatewayProxyResult> {
    const animalId = event["entity_data"]["animal_id"]
    await removeDog(animalId);

    return SUCCESS_RESPONSE;
}



// async function animalEdited(event) {
//   const data = event["entity_data"]
//   await updateDog(data)

//   return { statusCode: 200 };
// }
