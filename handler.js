"use strict";

const { AirtableService } = require('./airtableService');
const { NotFoundError } = require('./errors/NotFoundError');

const service = new AirtableService()

module.exports.handleEvent = async (event) => {
  const webhookEvent = JSON.parse(event.body);
  
  // TODO: Validate event signature
  switch (webhookEvent["webhook_type"]) {
    case "check_in":
      return checkIn(webhookEvent)
    case "check_out":
      return checkOut(webhookEvent)
    default:
      return { statusCode: 200 }
  }
};

async function checkIn(event) {
  const data = event["entity_data"]
  await service.addDog(data)
  return { statusCode: 200 }; 
}

async function checkOut(event) {
  const animalId = event["entity_data"]["animal_id"]
  try {
    await service.removeDog(animalId);
  } catch (err) {
    if (err instanceof NotFoundError) {
      return { statusCode: 403, body: err.message };
    }

    throw err;
  }
  
  return { statusCode: 200 };
}