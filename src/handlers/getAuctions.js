import AWS from 'aws-sdk';
import middy from '@middy/core';
import httpJsonBodyParser from '@middy/http-json-body-parser';
import httpEventNormalizer from '@middy/http-event-normalizer';
import httpErrorHandler from '@middy/http-error-handler';
import createError from 'http-errors';

const dynamodb = new AWS.DynamoDB.DocumentClient();
async function getAuction(event, context) {
  let auctions;

  try {
    const result = await dynamodb.scan({
      TableName: process.env.AUCTIONS_TABLE_NAME,
    }).promise();
    auctions = result.Items;
  } catch (error) {
    console.error(error);
    throw new createError.InternalServerError(error);
  }
  return {
    statusCode: 200,
    body: JSON.stringify(auctions),
  };
}

export const handler = middy(getAuction)
  .use(httpJsonBodyParser()) //Will automatically parse our string from event.body
  .use(httpEventNormalizer()) // Reduce the room for errors, making always accessible event api objects such as query parameters or path parameters
  .use(httpErrorHandler()); // Helps us to manager errors smoothly


