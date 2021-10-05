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

  // If the highest bid amount equals zero, there weren't any bids in the auction
  if (amount === 0) {
    // Notify to the seller
    const request = getMessageRequest('No bids on your auction item :(', seller, `Unfortunately, your item ${title} didn't get any bids!`);
    await sqs.sendMessage(request).promise();
    return;
  }

  // Otherwise, send an email to the seller and the bidder
  const sellerRequest = getMessageRequest('Your item has been sold!', seller, `Woohoo! Your item "${title}" has been sold for $${amount}.`);
  const notifySeller = sqs.sendMessage(sellerRequest).promise();


  const bidderRequest = getMessageRequest('You won an auction!', bidder, `What a great deal! You got yourself a "${title}" for $${amount}.`);
  const notifyBidder = sqs.sendMessage(bidderRequest).promise();

  return Promise.all([notifySeller, notifyBidder]);
}

function getMessageRequest(subject, recipient, body) {
  return {
    QueueUrl: process.env.MAIL_QUEUE_URL,
    MessageBody: JSON.stringify({
      subject,
      recipient,
      body,
    })
  };
}