import AWS from 'aws-sdk';
import Stripe from 'stripe';
import { NextResponse } from 'next/server';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET;

// Initialize DynamoDB
const dynamoDb = new AWS.DynamoDB.DocumentClient({
  region: 'us-east-2',
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
});

export async function POST(req) {
  const sig = req.headers.get('stripe-signature');
  const body = await req.text(); // Get raw body for Stripe verification

  let event;

  try {
    // Verify Stripe event
    event = stripe.webhooks.constructEvent(body, sig, endpointSecret);
  } catch (err) {
    console.error('Webhook signature verification failed:', err);
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
  }

  // Process the event
  if (event.type === 'checkout.session.completed') {
    const session = event.data.object;

    // Get invoiceId from metadata
    const invoiceId = session.metadata.invoiceId;
    console.log(invoiceId);

    if (!invoiceId) {
      console.error('Invoice ID not found in session metadata');
      return NextResponse.json(
        { error: 'Invoice ID not found' },
        { status: 400 }
      );
    }

    // Update invoice status in DynamoDB
    const params = {
      TableName: 'rahimi-invoices',
      Key: {
        invoice_partition: 'invoices',
        id: Number(invoiceId),
      },
      UpdateExpression: 'SET #status = :statusValue',
      ExpressionAttributeNames: {
        '#status': 'status',
      },
      ExpressionAttributeValues: {
        ':statusValue': 'paid_online',
      },
    };

    try {
      await dynamoDb.update(params).promise();
      console.log(`Invoice ${invoiceId} status updated to paid_online`);

      return NextResponse.json(
        { success: true, message: 'Invoice status updated' },
        { status: 200 }
      );
    } catch (error) {
      console.error('Failed to update invoice status:', error);
      return NextResponse.json(
        { error: 'Failed to update invoice' },
        { status: 500 }
      );
    }
  }

  // Return a 200 response for other event types
  return NextResponse.json({ received: true }, { status: 200 });
}
