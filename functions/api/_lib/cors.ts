/**
 * CORS handling for Cloudflare Pages Functions.
 * Uses standard Request/Response API.
 */

const ALLOWED_ORIGINS = [
  'https://lezgo.fans',
  'https://www.lezgo.fans',
  'https://lezgoapp.pages.dev',
  'http://localhost:5173',
  'http://localhost:3000',
];

const CORS_HEADERS = {
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, x-device-fingerprint',
  'Access-Control-Max-Age': '86400',
};

/**
 * Returns CORS headers including the origin if allowed.
 */
export function getCorsHeaders(request: Request): Record<string, string> {
  const origin = request.headers.get('Origin') || '';
  const headers: Record<string, string> = { ...CORS_HEADERS };

  if (ALLOWED_ORIGINS.includes(origin)) {
    headers['Access-Control-Allow-Origin'] = origin;
  }

  return headers;
}

/**
 * Handle CORS preflight (OPTIONS) request.
 * Returns a Response if it's a preflight, or null if not.
 */
export function handleCors(request: Request): Response | null {
  if (request.method === 'OPTIONS') {
    return new Response(null, {
      status: 204,
      headers: getCorsHeaders(request),
    });
  }
  return null;
}
