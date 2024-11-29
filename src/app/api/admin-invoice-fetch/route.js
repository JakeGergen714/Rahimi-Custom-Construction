import { parse } from 'cookie';
import jwt from 'jsonwebtoken';
import { NextResponse } from 'next/server';
import AWS from 'aws-sdk';

// Initialize DynamoDB
const dynamoDb = new AWS.DynamoDB.DocumentClient({
  region: 'us-east-2',
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
});

export async function GET(req) {
  const cookies = req.headers.get('cookie');
  const parsedCookies = parse(cookies || '');
  const token = parsedCookies.auth_token;

  if (!token) {
    return NextResponse.json(
      { error: 'Unauthorized: No token provided' },
      { status: 401 }
    );
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    if (!decoded.isAdmin) {
      return NextResponse.json(
        { error: 'Unauthorized: Not an admin' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(req.url);
    const year = searchParams.get('year') || null;
    const lastKey = searchParams.get('lastKey');

    // Set up base DynamoDB query parameters
    const params = {
      TableName: 'rahimi-invoices',
      KeyConditionExpression: '#partitionKey = :partitionValue',
      ExpressionAttributeNames: {
        '#partitionKey': 'invoice_partition',
      },
      ExpressionAttributeValues: {
        ':partitionValue': 'invoices',
      },
      Limit: 25,
      ScanIndexForward: false,
    };

    // Initialize filter expression parts
    let filterExpressions = [];

    if (year) {
      // Add year filter
      filterExpressions.push('#yearAttr = :yearValue');
      params.ExpressionAttributeNames['#yearAttr'] = 'year';
      params.ExpressionAttributeValues[':yearValue'] = year;
    }

    // Add isProposal filter
    filterExpressions.push(
      '(attribute_not_exists(#isProposal) OR #isProposal <> :isProposalValue)'
    );
    params.ExpressionAttributeNames['#isProposal'] = 'isProposal';
    params.ExpressionAttributeValues[':isProposalValue'] = true;

    // Combine filter expressions, if any
    if (filterExpressions.length > 0) {
      params.FilterExpression = filterExpressions.join(' AND ');
    }

    // Set pagination key if provided
    if (lastKey) {
      params.ExclusiveStartKey = JSON.parse(decodeURIComponent(lastKey));
    }

    // Query DynamoDB
    const result = await dynamoDb.query(params).promise();
    console.log(result);
    const lastEvaluatedKey = result.LastEvaluatedKey
      ? encodeURIComponent(JSON.stringify(result.LastEvaluatedKey))
      : null;

    return NextResponse.json(
      {
        success: true,
        data: result.Items,
        lastKey: lastEvaluatedKey,
      },
      { status: 200 }
    );
  } catch (err) {
    console.error('Error fetching invoices:', err);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
