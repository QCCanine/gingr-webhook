"use strict";

var crypto = require('crypto');
const { AirtableService } = require('./services/airtableService');
const { NotFoundError } = require('./errors/NotFoundError');
const { GingrService } = require('./services/gingrService');

const airtableService = new AirtableService()
const gingrService = new GingrService()

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
  const animalId = data['animal_id']
  
  const [medications, feedingSchedule] = await Promise.all([
    gingrService.getMedications(animalId),
    gingrService.getFeedingSchedule(animalId)
  ])

  console.log(feedingSchedule)

  await airtableService.addDog(data, medications, feedingSchedule)
  return { statusCode: 200 }; 
}

async function checkOut(event) {
  const animalId = event["entity_data"]["animal_id"]
  try {
    await airtableService.removeDog(animalId);
  } catch (err) {
    if (err instanceof NotFoundError) {
      return { statusCode: 403, body: err.message };
    }

    throw err;
  }
  
  return { statusCode: 200 };
}