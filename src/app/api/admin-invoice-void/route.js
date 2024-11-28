import Stripe from 'stripe';
import { parse } from 'cookie';
import jwt from 'jsonwebtoken';
import { NextResponse } from 'next/server'; // Use NextResponse for responses

// Initialize Stripe
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

export async function PUT(req) {
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
  } catch (e) {
    console.log('Failed to decode jwt', e);
    return NextResponse.json(
      { error: 'Failed to decode token' },
      { status: 400 }
    );
  }

  try {
    const body = await req.json();
    const invoiceId = body.id;

    if (!invoiceId) {
      console.log('stripe invoice id not found');
      return NextResponse.json(
        { error: 'Missing Stripe invoice ID' },
        { status: 400 }
      );
    }

    // Void the invoice in Stripe
    const voidedInvoice = await stripe.invoices.voidInvoice(invoiceId);

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Invoice voided successfully in Stripe',
        stripeInvoice: voidedInvoice, // Return the voided invoice details
      }),
      { status: 200 }
    );
  } catch (error) {
    console.error('Error voiding Stripe invoice:', error);
    return new Response(
      JSON.stringify({ error: 'Failed to void Stripe invoice' }),
      {
        status: 500,
      }
    );
  }
}
