import AWS from 'aws-sdk';
import jwt from 'jsonwebtoken';
import { NextResponse } from 'next/server';
import { serialize } from 'cookie';

const dynamoDb = new AWS.DynamoDB.DocumentClient({
  region: process.env.AWS_REGION,
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
});

// Named export for POST request
export async function POST(req) {
  const body = await req.json(); // Parse the request body (Next.js App Router uses streaming)
  const { email, code } = body;

  if (!email || !code) {
    return NextResponse.json(
      { error: 'Email and code are required' },
      { status: 400 }
    );
  }

  // Query DynamoDB to get the stored code for this email
  const params = {
    TableName: 'AdminAuth',
    Key: { email },
  };

  try {
    const result = await dynamoDb.get(params).promise();

    if (!result.Item) {
      return NextResponse.json(
        { error: 'No code found for this email' },
        { status: 404 }
      );
    }

    const { code: storedCode, timestamp } = result.Item;

    // Validate the code and check if it is within the time limit (e.g., 10 minutes)
    const timeElapsed = Date.now() - timestamp;
    const timeLimit = 10 * 60 * 1000; // 10 minutes in milliseconds

    if (storedCode !== code) {
      return NextResponse.json({ error: 'Invalid code' }, { status: 401 });
    }

    if (timeElapsed > timeLimit) {
      return NextResponse.json({ error: 'Code has expired' }, { status: 401 });
    }

    // Code is valid and within time limit

    // Generate a JWT token to identify the user session
    const token = jwt.sign(
      { email, isAdmin: true }, // Payload, where custom fields like isAdmin should go
      process.env.JWT_SECRET, // Secret key
      { expiresIn: '1d' } // Options, such as token expiration
    );

    // Set the HTTP-only cookie with the JWT token using NextResponse
    const response = NextResponse.json({
      success: true,
      message: 'Code validated, user authenticated',
    });

    // Add the Set-Cookie header to the response
    response.headers.set(
      'Set-Cookie',
      serialize('auth_token', token, {
        httpOnly: true, // Prevent JavaScript from accessing the cookie
        secure: process.env.NODE_ENV === 'production', // Use HTTPS in production
        sameSite: 'Strict', // Prevent CSRF attacks
        maxAge: 60 * 60 * 24, // 1 day expiration
        path: '/', // Cookie is accessible on all pages
      })
    );

    return response;
  } catch (err) {
    console.error('Error validating code:', err);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
