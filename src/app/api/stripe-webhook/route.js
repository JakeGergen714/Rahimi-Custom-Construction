import Stripe from 'stripe';
import AWS from 'aws-sdk';
import { NextResponse } from 'next/server';

const dynamoDb = new AWS.DynamoDB.DocumentClient({
  region: 'us-east-2',
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
});

// Initialize Stripe
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: '2022-11-15',
});

export const GET = {
  runtime: 'nodejs',
};

export async function POST(req) {
  const sig = req.headers.get('stripe-signature');
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  let event;

  try {
    // Get raw body of the request
    const rawBody = await req.arrayBuffer(); // Use arrayBuffer to handle raw body
    const bufferData = Buffer.from(rawBody);

    // Validate webhook signature
    event = stripe.webhooks.constructEvent(bufferData, sig, webhookSecret);
  } catch (err) {
    console.error('⚠️ Webhook signature verification failed.', err.message);
    return new Response(`Webhook Error: ${err.message}`, { status: 400 });
  }

  console.log('Stripe webhook event:', event.type);

  // Extract the invoice object from the event
  console.log('event :', event);
  const invoice = event.data.object;
  let newStatus;

  // Use switch to handle different event types and set the status accordingly
  switch (event.type) {
    case 'invoice.paid':
      newStatus = 'Paid';
      console.log(`Invoice ${invoice.id} paid.`);
      break;

    case 'invoice.payment_failed':
      newStatus = 'Payment Failed';
      console.log(`Invoice ${invoice.id} payment failed.`);
      break;

    case 'invoice.voided':
      newStatus = 'Voided';
      console.log(`Invoice ${invoice.id} voided.`);
      break;

    default:
      console.warn(`Unhandled event type: ${event.type}`);
      return NextResponse.json({ received: true }, { status: 200 });
  }

  // Update the invoice status in DynamoDB
  const params = {
    TableName: 'rahimi-invoices',
    Key: {
      id: invoice.metadata.invoiceId,
      date: invoice.metadata.invoiceDate, // Sort key (if applicable)
    },
    UpdateExpression: 'set #status = :status',
    ExpressionAttributeNames: {
      '#status': 'status',
    },
    ExpressionAttributeValues: {
      ':status': newStatus,
    },
  };

  try {
    await dynamoDb.update(params).promise();
    console.log(`Invoice status updated to "${newStatus}".`);
  } catch (error) {
    console.error('Failed to update invoice status:', error);
    return new Response('Failed to update invoice status.', { status: 500 });
  }

  return NextResponse.json({ received: true }, { status: 200 });
}
