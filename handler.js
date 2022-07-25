"use strict";

var crypto = require('crypto');
const { AirtableService } = require('./services/airtableService');

const airtableService = new AirtableService()

module.exports.handleEvent = async (event) => {
  const webhookEvent = JSON.parse(event.body);

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
      case "animal_edited":
        return animalEdited(webhookEvent)
    default:
      return { statusCode: 200 }
  }
};

function hasValidSignature(event) {
  const token = `${event["webhook_type"]}${event["entity_id"]}${event["entity_type"]}`;
  const signature = 
    crypto
      .createHmac('sha256', process.env.WEBHOOK_SIGNATURE_KEY)
      .update(token)
      .digest('hex');

  return signature === event["signature"]
}

async function checkIn(event) {
  const data = event["entity_data"]
  await airtableService.addDog(data)

  return { statusCode: 200 }; 
}

async function checkOut(event) {
  const animalId = event["entity_data"]["animal_id"]
  await airtableService.removeDog(animalId);
  
  return { statusCode: 200 };
}

async function animalEdited(event) {
  const data = event["entity_data"]
  await animalEdited(event)

  return { statusCode: 200 };
}