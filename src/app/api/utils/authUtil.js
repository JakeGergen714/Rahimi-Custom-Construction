// utils/authUtil.js
import jwt from 'jsonwebtoken';
import { parse } from 'cookie';

export function verifyAdmin(req) {
  // Get cookies from the request headers
  const cookies = req.headers.get('cookie');
  const parsedCookies = parse(cookies || '');
  const token = parsedCookies.auth_token;

  // Check if token is present
  if (!token) {
    return new Response(
      JSON.stringify({ error: 'Unauthorized: No token provided' }),
      { status: 401, headers: { 'Content-Type': 'application/json' } }
    );
  }

  try {
    // Verify the JWT token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Check if the user has admin privileges
    if (!decoded.isAdmin) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized: Not an admin' }),
        { status: 401, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Authentication successful; return decoded token
    return decoded;
  } catch (error) {
    console.error('Failed to decode JWT:', error);
    return new Response(JSON.stringify({ error: 'Failed to decode token' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}
