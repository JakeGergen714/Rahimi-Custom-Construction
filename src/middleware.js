import { NextResponse } from 'next/server';
import { jwtVerify } from 'jose'; // Import from jose library

export async function middleware(req) {
  const { pathname } = req.nextUrl; // Get the current pathname
  const { cookies } = req;
  const tokenCookie = cookies.get('auth_token');

  // If no token is found and the user is not on the login page, redirect to the login page
  if (!tokenCookie && pathname !== '/login') {
    return NextResponse.redirect(new URL('/login', req.url));
  }

  // Allow the user to access the login page if they are not authenticated
  if (!tokenCookie && pathname === '/login') {
    return NextResponse.next();
  }

  const token = tokenCookie?.value;

  try {
    // Use jose to verify the JWT token
    const secret = new TextEncoder().encode(process.env.JWT_SECRET); // Secret must be Uint8Array
    const { payload } = await jwtVerify(token, secret); // Verify the token and extract payload

    const isAdmin = payload.isAdmin;

    // Prevent redirect loop for admin-dashboard and invoices routes
    if (isAdmin) {
      console.log('logged in as admin');
      return NextResponse.next();
    } else {
      return NextResponse.redirect('/');
    }
  } catch (err) {
    console.log('error in middleware', err);
    // If verification fails, redirect to the login page (but don't cause a redirect loop)
    if (pathname !== '/login') {
      return NextResponse.redirect(new URL('/login', req.url));
    }

    return NextResponse.next();
  }
}

export const config = {
  matcher: ['/invoices', '/login'], // Apply middleware to these routes
};
