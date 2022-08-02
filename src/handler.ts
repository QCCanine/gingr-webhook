"use strict";

import { hasValidSignature, checkIn, checkOut, SUCCESS_RESPONSE } from "./controllers/webhook";
import { GingrWebhook } from "./services/gingr/types";
import {  updateDog, removeDog } from './services/airtableService';
import { APIGatewayProxyResult, APIGatewayEvent } from 'aws-lambda';

module.exports.handleEvent = async (event: APIGatewayEvent): Promise<APIGatewayProxyResult> => {
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

// async function animalEdited(event) {
//   const data = event["entity_data"]
//   await updateDog(data)

//   return { statusCode: 200 };
// }