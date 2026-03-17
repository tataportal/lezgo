/**
 * Shared types for Cloudflare Pages Functions.
 */

export interface Env {
  FIREBASE_PROJECT_ID: string;
  FIREBASE_CLIENT_EMAIL: string;
  FIREBASE_PRIVATE_KEY: string;
  RECAPTCHA_SECRET_KEY?: string;
}

export interface AuthUser {
  uid: string;
  email: string;
}

/** Helper to create JSON responses */
export function json(data: unknown, status = 200, extraHeaders?: Record<string, string>): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      'Content-Type': 'application/json',
      ...extraHeaders,
    },
  });
}

/** Helper to create error responses */
export function errorResponse(message: string, status = 400): Response {
  return json({ error: message }, status);
}
