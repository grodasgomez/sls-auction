import AWS from 'aws-sdk';

const dynamodb = new AWS.DynamoDB.DocumentClient();
const sqs = new AWS.SQS();

export async function closeAuction(auction) {
  const params = {
    TableName: process.env.AUCTIONS_TABLE_NAME,
    Key: { id: auction.id },
    UpdateExpression: 'set #status = :status',
    ExpressionAttributeValues: {
      ':status': 'CLOSED',
    },
    ExpressionAttributeNames: {
      '#status': 'status',
    },
  };

  await dynamodb.update(params).promise();
  const { title, seller, highestBid } = auction;
  const { amount, bidder } = highestBid;

  const sellerBody = getMessageBody('Your item has been sold!', seller, `Woohoo! Your item "${title}" has been sold for $${amount}.`);
  const notifySeller = sqs.sendMessage({
    QueueUrl: process.env.MAIL_QUEUE_URL,
    MessageBody: sellerBody
  }).promise();

  const bidderBody = getMessageBody('You won an auction!', bidder, `What a great deal! You got yourself a "${title}" for $${amount}.`);

  const notifyBidder = sqs.sendMessage({
    QueueUrl: process.env.MAIL_QUEUE_URL,
    MessageBody: bidderBody
  }).promise();

  return Promise.all([notifySeller, notifyBidder]);
}

function getMessageBody(subject, recipient, body) {
  return JSON.stringify({
    subject,
    recipient,
    body,
  });
}