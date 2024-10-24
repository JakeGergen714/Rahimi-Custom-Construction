import { parse } from 'cookie';
import jwt from 'jsonwebtoken';
import { NextResponse } from 'next/server'; // Use NextResponse for responses
import Stripe from 'stripe';

// Initialize Stripe client
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

export async function GET(req) {
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

    // Get the searchParams from the request query parameters
    const { searchParams } = new URL(req.url);
    const status = searchParams.get('status') || null;
    const startDate = searchParams.get('startDate') || null;
    const endDate = searchParams.get('endDate') || null;
    const lastKey = searchParams.get('lastKey'); // Pagination key
    const sanitizedLastKey = lastKey
      ? decodeURIComponent(lastKey).replace(/['"]+/g, '')
      : null;

    // Stripe invoice query parameters
    const stripeParams = {
      limit: 25, // Adjust this value to control the number of invoices per request
      ...(sanitizedLastKey && { starting_after: sanitizedLastKey }), // Set pagination using lastKey
    };

    // Add filters based on status, startDate, and endDate
    if (status) {
      stripeParams.status = status;
    }

    if (startDate && endDate) {
      stripeParams.created = {
        gte: Math.floor(new Date(startDate).getTime() / 1000),
        lte: Math.floor(new Date(endDate).getTime() / 1000),
      };
    }

    // Fetch invoices from Stripe
    const invoices = await stripe.invoices.list(stripeParams);
    console.log(invoices);

    // Check if there are more invoices to paginate through
    const lastEvaluatedKey = invoices.has_more
      ? invoices.data[invoices.data.length - 1].id
      : null;

    // Return the fetched data and pagination key (lastKey)
    return NextResponse.json(
      {
        success: true,
        data: invoices.data,
        lastKey: lastEvaluatedKey, // Set lastKey for pagination
      },
      { status: 200 }
    );
  } catch (err) {
    console.error('Error fetching invoices from Stripe:', err);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
