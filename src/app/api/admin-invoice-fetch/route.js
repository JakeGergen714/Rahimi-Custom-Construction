import { parse } from 'cookie';
import jwt from 'jsonwebtoken';
import AWS from 'aws-sdk';
import { NextResponse } from 'next/server'; // Use NextResponse for responses

// Initialize DynamoDB client
const dynamoDb = new AWS.DynamoDB.DocumentClient({
  region: process.env.AWS_REGION,
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

    console.log(decoded);

    if (!decoded.isAdmin) {
      return NextResponse.json(
        { error: 'Unauthorized: Not an admin' },
        { status: 401 }
      );
    }

    // Get the searchParams from the request query parameters
    const { searchParams } = new URL(req.url);
    const lastEvaluatedKey = searchParams.get('lastKey') || null; // Passed from the frontend
    const status = searchParams.get('status') || null;
    const startDate = searchParams.get('startDate') || null;
    const endDate = searchParams.get('endDate') || null;
    const lastKey = searchParams.get('lastKey');

    let parsedLastKey = null;

    if (lastKey) {
      try {
        parsedLastKey = JSON.parse(decodeURIComponent(lastKey)); // Safely decode and parse the lastKey
      } catch (error) {
        return NextResponse.json(
          { error: 'Invalid lastKey provided' },
          { status: 400 }
        );
      }
    }

    // Base query parameters
    const params = {
      TableName: 'rahimi-invoices',
      ...(parsedLastKey && { ExclusiveStartKey: parsedLastKey }),
    };

    // Only add FilterExpression and ExpressionAttributes if filters are provided
    let filterExpressions = [];
    let expressionAttributeNames = {};
    let expressionAttributeValues = {};

    // Filter by status (if provided)
    if (status) {
      expressionAttributeNames['#status'] = 'status'; // Alias for reserved keyword
      expressionAttributeValues[':status'] = status;
      filterExpressions.push('#status = :status');
    }

    // Filter by date range (if provided)
    if (startDate && endDate) {
      expressionAttributeNames['#date'] = 'date';
      expressionAttributeValues[':startDate'] = startDate;
      expressionAttributeValues[':endDate'] = endDate;
      filterExpressions.push('#date BETWEEN :startDate AND :endDate');
    }

    // Add the FilterExpression only if there are filters
    if (filterExpressions.length > 0) {
      params.ExpressionAttributeNames = expressionAttributeNames;
      params.ExpressionAttributeValues = expressionAttributeValues;
      params.FilterExpression = filterExpressions.join(' AND ');
    }

    const result = await dynamoDb.scan(params).promise();
    console.log(result);

    // Sort the results by date (assuming date is stored as a string or number)
    const sortedInvoices = result.Items.sort((a, b) => {
      return new Date(b.date) - new Date(a.date); // Sort descending by date
    });

    // Return the fetched data and LastEvaluatedKey for pagination
    return NextResponse.json(
      {
        success: true,
        data: sortedInvoices,
        lastEvaluatedKey: result.LastEvaluatedKey || null, // Send next key for pagination
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
