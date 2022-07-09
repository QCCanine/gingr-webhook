"use strict";

const { AirtableService } = require('./airtableService');
const { NotFoundError } = require('./errors/NotFoundError');

const service = new AirtableService()

module.exports.hello = async (event) => {
  // TODO: Validate event signature

  switch (event["webhook_type"]) {
    case "check_in":
      return checkIn(event)
    case "check_out":
      return checkOut(event)
    default:
      return { statusCode: 403 }
  }
  
  
};

async function checkIn(event) {
  const data = event["entity_data"]
  await service.addDog(data)
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