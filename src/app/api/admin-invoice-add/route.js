import { v4 as uuidv4 } from 'uuid';
import Stripe from 'stripe';
import { parse } from 'cookie';
import jwt from 'jsonwebtoken';
import AWS from 'aws-sdk';
import { NextResponse } from 'next/server'; // Use NextResponse for responses

// Initialize Stripe
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

export async function POST(req) {
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
  } catch (e) {
    return NextResponse.json(
      { error: 'Failed to decode token' },
      { status: 400 }
    );
  }

  try {
    const body = await req.json();
    const {
      customerEmail,
      date,
      lineItems, // List of line items
    } = body;

    // Step 1: Check if the customer already exists in Stripe
    let stripeCustomer;
    const existingCustomers = await stripe.customers.list({
      email: customerEmail,
      limit: 1,
    });

    if (existingCustomers.data.length > 0) {
      // Customer exists, retrieve it
      stripeCustomer = existingCustomers.data[0];
    } else {
      // Customer does not exist, create a new one
      stripeCustomer = await stripe.customers.create({
        email: customerEmail,
      });
    }

    const stripeCustomerId = stripeCustomer.id;

    // Step 2: Create the Invoice in Stripe
    const stripeInvoice = await stripe.invoices.create({
      customer: stripeCustomerId, // The Stripe customer ID
      collection_method: 'send_invoice', // The invoice will be emailed to the customer
      days_until_due: 30, // Invoice due in 30 days
    });

    var invoiceAmount = 0;
    // Add other line items (if any)
    for (const item of lineItems) {
      if (item.amount > 0) {
        invoiceAmount += item.amount;
        await stripe.invoiceItems.create({
          customer: stripeCustomerId,
          amount: Math.round(item.amount * 100), // Amount in cents
          currency: 'usd',
          description: item.description,
          invoice: stripeInvoice.id, // Associate with the created invoice
        });
      }
    }

    // Step 4: Finalize and send the invoice
    await stripe.invoices.finalizeInvoice(stripeInvoice.id);
    await stripe.invoices.sendInvoice(stripeInvoice.id);

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Invoice created and sent via Stripe',
      }),
      { status: 200 }
    );
  } catch (error) {
    console.error('Error creating invoice:', error);
    return new Response(JSON.stringify({ error: 'Failed to create invoice' }), {
      status: 500,
    });
  }
}
