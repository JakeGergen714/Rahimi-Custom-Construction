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
  const {
    customer_email,
    customer_name,
    lines, // List of line items
    amount_due,
  } = body;

  const latestId = getLatestInvoiceId();
  console.log('fetched id', latestId);
  const id = latestId + 1;

  // Create the DynamoDB entry
  const params = {
    TableName: 'rahimi-invoices',
    Item: {
      invoice_partition: 'invoices', // Static partition key value
      id,
      customer_email,
      customer_name,
      lines,
      amount_due,
      due_date,
      status: 'open',
      isProposal: true,
    },
  };

  try {
    // Store the email and code in DynamoDB
    await dynamoDb.put(params).promise();

    return NextResponse.json(
      { success: true, message: 'Proposal created' },
      { status: 200 }
    );
  } catch (err) {
    console.error('Failed to create proposal:', err);
    return NextResponse.json(
      { error: 'Failed to create proposal' },
      { status: 500 }
    );
  }
}

const getLatestInvoiceId = async () => {
  const params = {
    TableName: 'rahimi-invoices',
    // Limit to 1 item to get only the latest
    Limit: 1,
    ScanIndexForward: false, // Sorts in descending order to get the highest id
    KeyConditionExpression: '#partitionKey = :partitionValue',
    ExpressionAttributeNames: {
      '#partitionKey': 'invoice_partition', // Use 'invoice_partition' as the partition key name
    },
    ExpressionAttributeValues: {
      ':partitionValue': 'invoices', // Static value for 'invoice_partition' when inserting records
    },
  };

  try {
    const result = await dynamodb.query(params).promise();
    return result.Items.length > 0 ? result.Items[0].id : 0; // Return the latest invoice ID or 0 if no items exist
  } catch (error) {
    console.error('Error fetching latest invoice ID:', error);
    throw new Error('Could not retrieve latest invoice ID');
  }
};
