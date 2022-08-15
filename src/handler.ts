"use strict";

import { hasValidSignature, checkIn, checkOut, SUCCESS_RESPONSE } from "./controllers/webhook";
import { GingrWebhook } from "./clients/gingr/types";
import { APIGatewayProxyResult, APIGatewayEvent } from 'aws-lambda';
import { syncGingrData } from "./controllers/syncData";

export async function handleWebhook(event: APIGatewayEvent): Promise<APIGatewayProxyResult> {
  if (event.body === null) {
    throw new Error("event body is empty")
  }

  const webhookEvent: GingrWebhook<any> = JSON.parse(event.body);

  if (!hasValidSignature(webhookEvent)) {
    return {
      statusCode: 403,
      body: "Invalid signature"
    }
  }
  
  switch (webhookEvent["webhook_type"]) {
    case "check_in":
      return checkIn(webhookEvent)
    case "check_out":
      return checkOut(webhookEvent)
      // case "animal_edited":
      //   return animalEdited(webhookEvent)
    default:
      return SUCCESS_RESPONSE
  }
};

export async function scheduledSync(): Promise<void> {
  await syncGingrData();
}
