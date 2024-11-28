import AWS from 'aws-sdk';
import nodemailer from 'nodemailer';
import { NextResponse } from 'next/server'; // Use NextResponse for handling server responses
const fs = require('fs');
const path = require('path');

const templatePath = path.join(
  process.cwd(),
  'src/templates/emailTemplate.html'
);
let htmlTemplate = fs.readFileSync(templatePath, 'utf8');

const adminEmail = process.env.ADMIN_EMAIL;

// Initialize DynamoDB
const dynamoDb = new AWS.DynamoDB.DocumentClient({
  region: 'us-east-2',
  accessKeyId: process.env.AWS_ACCESS_KEY_ID, // Use environment variables for AWS credentials
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY, // Use environment variables for AWS credentials
});

// Named export for POST request
export async function POST(req) {
  const body = await req.json(); // Parse the request body (Next.js App Router uses streaming)
  const { email } = body;

  if (!email) {
    return NextResponse.json({ error: 'Email is required' }, { status: 400 });
  }

  if (email != adminEmail) {
    return NextResponse.json(
      { error: 'Incorrect email address' },
      { status: 400 }
    );
  }

  // Generate a random 6-digit 2FA code
  const code = Math.floor(100000 + Math.random() * 900000).toString(); // Generates a 6-digit code
  const currentTime = Math.floor(Date.now() / 1000); // Current time in Unix seconds
  const ttl = currentTime + 3600; // Set TTL for 1 hour (3600 seconds) from now
  console.log(ttl);

  // Create the DynamoDB entry
  const params = {
    TableName: 'AdminAuth',
    Item: {
      email, // Partition key
      code, // The 2FA code
      timestamp: Date.now(), // When the code was generated
      ttl,
    },
  };

  try {
    // Store the email and code in DynamoDB
    await dynamoDb.put(params).promise();

    // Send the 2FA code via email
    await sendEmail(email, code);

    return NextResponse.json(
      { success: true, message: '2FA code sent to email' },
      { status: 200 }
    );
  } catch (err) {
    console.error('Error storing 2FA code:', err);
    return NextResponse.json(
      { error: 'Failed to store 2FA code' },
      { status: 500 }
    );
  }
}

// Function to send email with the 2FA code
async function sendEmail(recipient, code) {
  const transporter = nodemailer.createTransport({
    host: 'smtp.gmail.com', // Replace with your SMTP server if needed
    port: 587, // 587 for TLS or 465 for SSL
    secure: false, // Use TLS (false), SSL (true) would require port 465
    auth: {
      user: process.env.SMTP_USER, // Your email address (from environment variables)
      pass: process.env.GOOGLE_PASS, // Your email password or app-specific password (from environment variables)
    },
  });

  const htmlContent = htmlTemplate.replace('${code}', code);

  const mailOptions = {
    from: process.env.SMTP_USER, // Sender address
    to: recipient, // Recipient's email
    subject: 'Rahimi Construction Validation Code',
    text: `Your Validation code is: ${code}`, // Simple text version
    html: htmlContent, // Use the loaded HTML template
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log(`2FA code sent to ${recipient}`);
  } catch (err) {
    console.error('Failed to send 2FA code via email:', err);
    throw err; // Rethrow the error so it can be handled in the main handler
  }
}
