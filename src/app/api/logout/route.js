import { NextResponse } from 'next/server';
import { serialize } from 'cookie'; // Import cookie serialization library

export async function GET(req) {
  // Create a cookie header to remove the 'auth_token' cookie by setting it with 'Max-Age' to 0
  const cookieHeader = serialize('auth_token', '', {
    httpOnly: true, // Keep the cookie HTTP only
    secure: process.env.NODE_ENV === 'production', // Ensure secure in production
    sameSite: 'strict', // Prevent cross-site attacks
    path: '/', // Apply to the whole site
    maxAge: 0, // Set to 0 to immediately expire the cookie
  });

  // Return response with the Set-Cookie header to remove the auth token
  const response = NextResponse.json({
    success: true,
    message: 'Logged out successfully',
  });
  response.headers.set('Set-Cookie', cookieHeader); // Set the 'Set-Cookie' header to remove the cookie

  return response;
}
