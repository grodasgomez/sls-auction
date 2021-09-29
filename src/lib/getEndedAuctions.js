import AWS from 'aws-sdk';


const dynamodb = new AWS.DynamoDB.DocumentClient();

export async function getEndedAuctions() {
  const now = new Date();

  const params = {
    TableName: process.env.AUCTIONS_TABLE_NAME,
    IndexName: 'statusAndEndDate',
    KeyConditionExpression: '#status = :status AND endingAt <= :now',
    ExpressionAttributeValues: {
      ':status': 'OPEN',
      ':now': now.toISOString(),
    },
    // This tell to DynamoDB to replace #status with status upon executing the query, we do this because 'status' is a reserved word
    ExpressionAttributeNames: {
      '#status': 'status'
    }
  };

  const result = await dynamodb.query(params).promise();
  return result.Items;
}