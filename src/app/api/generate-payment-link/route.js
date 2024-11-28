import AWS from 'aws-sdk';
import Stripe from 'stripe';

import { NextResponse } from 'next/server';

// Initialize DynamoDB
const dynamoDb = new AWS.DynamoDB.DocumentClient({
  region: 'us-east-2',
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
});

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

export async function GET(req) {
  const { searchParams } = new URL(req.url);
  const id = searchParams.get('id');
  const secretCode = searchParams.get('secretCode');

  if (!id || !secretCode) {
    return NextResponse.json(
      { error: 'ID and secret code are required' },
      { status: 400 }
    );
  }

  // Define the query parameters to fetch the invoice by id
  const params = {
    TableName: 'rahimi-invoices',
    KeyConditionExpression:
      '#partitionKey = :partitionValue AND #id = :idValue',
    ExpressionAttributeNames: {
      '#partitionKey': 'invoice_partition',
      '#id': 'id',
    },
    ExpressionAttributeValues: {
      ':partitionValue': 'invoices',
      ':idValue': Number(id),
    },
  };

  try {
    const result = await dynamoDb.query(params).promise();

    // Check if invoice was found
    if (result.Items.length === 0) {
      return NextResponse.json({ error: 'Invoice not found' }, { status: 404 });
    }

    const invoice = result.Items[0];

    // Validate the secret code
    if (invoice.secretCode !== secretCode) {
      return NextResponse.json(
        { error: 'Invalid secret code' },
        { status: 403 }
      );
    }

    const hostUrl = `${
      req.headers.get('x-forwarded-proto') || 'http'
    }://${req.headers.get('host')}`;

    if (invoice.status != 'open') {
      console.log('invoice already paid');
      return NextResponse.redirect(
        hostUrl + '/paidInvoice?id=${id}&secretCode=${secretCode}',
        303
      );
    }
    const totalAmount = invoice.lines.reduce(
      (sum, line) => sum + line.price.unit_amount * line.price.unit_quantity,
      0
    );
    const serviceFeeAmount = Math.round(totalAmount * 0.035 * 100); // 3.5% service fee in cents

    // Create a Stripe Checkout Session
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [
        // Map over each invoice line to create detailed line items
        ...invoice.lines.map((line) => ({
          price_data: {
            currency: 'usd',
            product_data: {
              name: line.description,
            },
            unit_amount: Math.round(line.price.unit_amount * 100), // Convert to cents
          },
          quantity: line.price.unit_quantity,
        })),
        // Add the 3.5% service fee as a separate line item
        {
          price_data: {
            currency: 'usd',
            product_data: {
              name: 'Service Fee (3.5%)',
            },
            unit_amount: serviceFeeAmount, // Fee amount in cents
          },
          quantity: 1,
        },
      ],
      mode: 'payment',
      metadata: {
        invoiceId: id,
      },
      success_url: hostUrl,
      cancel_url: hostUrl,
    });

    // Return the invoice details if validation succeeds
    return NextResponse.redirect(session.url, 303);
  } catch (error) {
    console.error('Error fetching invoice:', error);
    return NextResponse.json(
      { error: 'Failed to retrieve invoice' },
      { status: 500 }
    );
  }
}
