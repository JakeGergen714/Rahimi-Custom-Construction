import AWS from 'aws-sdk';
import { parse } from 'cookie';
import jwt from 'jsonwebtoken';

const dynamoDb = new AWS.DynamoDB.DocumentClient({
  region: 'us-east-2',
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
});

export async function PUT(req) {
  try {
    const cookies = req.headers.get('cookie');
    const parsedCookies = parse(cookies || '');
    const token = parsedCookies.auth_token;

    if (!token) {
      return NextResponse.json(
        { error: 'Unauthorized: No token provided' },
        { status: 401 }
      );
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    if (!decoded.isAdmin) {
      return NextResponse.json(
        { error: 'Unauthorized: Not an admin' },
        { status: 401 }
      );
    }

    const invoice = await req.json();

    if (!invoice || !invoice.id) {
      return new Response(
        JSON.stringify({ success: false, message: 'Invoice ID is required.' }),
        { status: 400 }
      );
    }

    const params = {
      TableName: 'rahimi-invoices',
      Key: { invoice_partition: 'invoices', id: invoice.id },
      UpdateExpression: 'SET #statusAttr = :status',
      ExpressionAttributeNames: { '#statusAttr': 'status' },
      ExpressionAttributeValues: { ':status': 'paid' },
    };

    await dynamoDb.update(params).promise();
    console.log(`Invoice ${invoice.id} marked as paid.`);

    return new Response(
      JSON.stringify({
        success: true,
        message: `Invoice ${invoice.id} marked as paid.`,
      }),
      { status: 200 }
    );
  } catch (error) {
    console.error('Error marking invoice as paid:', error);
    return new Response(
      JSON.stringify({
        success: false,
        message: 'Failed to mark invoice as paid.',
      }),
      { status: 500 }
    );
  }
}
