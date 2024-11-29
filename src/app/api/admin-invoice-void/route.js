import Stripe from 'stripe';
import { NextResponse } from 'next/server'; // Use NextResponse for responses

// Initialize Stripe
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

export async function PUT(req) {
  // Authenticate the request
  const authResult = verifyAdmin(req);

  // If authentication fails, return the error response
  if (authResult instanceof NextResponse) {
    return authResult;
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
