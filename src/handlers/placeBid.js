import AWS from 'aws-sdk';
import createError from 'http-errors';
import commonMiddleware from '../lib/commonMiddleware';
import { getAuctionById } from './getAuction';
import validator from '@middy/validator';
import placeBidSchema from '../lib/schemas/placeBidSchema';

const dynamodb = new AWS.DynamoDB.DocumentClient();
async function placeBid(event, context) {

  const { id } = event.pathParameters;
  const { amount } = event.body;
  const { email } = event.requestContext.authorizer;


  const auction = await getAuctionById(id);

  // Valid that the bidder is not the seller
  if (email === auction.seller) {
    throw new createError.Forbidden(`You can't bid on your auction`);
  }

  // Valid double bidding
  if (email === auction.highestBid.bidder) {
    throw new createError.Forbidden(`You have already the highest bid on this auction`);

  }

  // Valid the auction status
  if (auction.status === 'CLOSED') {
    throw new createError.Forbidden(`You cannot bid on closed auctions!`);
  }

  // Valid that the new amount is higher than the actual highest bid
  if (amount <= auction.highestBid.amount) {
    throw new createError.Forbidden(`Your bid must be higher than ${auction.highestBid.amount}`);
  }


  const params = {
    TableName: process.env.AUCTIONS_TABLE_NAME,
    Key: { id },
    UpdateExpression: 'set highestBid.amount = :amount, highestBid.bidder = :bidder',
    ExpressionAttributeValues: {
      ':amount': amount,
      ':bidder': email
    },
    ReturnValues: 'ALL_NEW'

  };

  let updatedAuction;

  try {
    const result = await dynamodb.update(params).promise();
    updatedAuction = result.Attributes;
  } catch (error) {
    console.error(error);
    throw new createError.InternalServerError(error);
  }

  return {
    statusCode: 200,
    body: JSON.stringify(updatedAuction),
  };
}

export const handler = commonMiddleware(placeBid)
  .use(validator(
    {
      inputSchema: placeBidSchema,
      ajvOptions: {
        strict: false
      }
    }
  ));