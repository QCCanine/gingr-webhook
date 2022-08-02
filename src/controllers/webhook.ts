import { createHmac } from "crypto";
import { GingerReservationWebhook, GingrWebhook } from "../services/gingr/types";
import { addDog, removeDog } from "../services/airtableService";
import { APIGatewayProxyResult } from 'aws-lambda';

export const SUCCESS_RESPONSE: APIGatewayProxyResult = { statusCode: 200, body: '' }

export function hasValidSignature(event: GingrWebhook<any>) {
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
    await addDog(event)

    return SUCCESS_RESPONSE;
}

export async function checkOut(event: GingerReservationWebhook): Promise<APIGatewayProxyResult> {
    const animalId = event["entity_data"]["animal_id"]
    await removeDog(animalId);

    return SUCCESS_RESPONSE;
}
