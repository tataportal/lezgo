/**
 * Cloudflare Pages Functions middleware.
 * Handles CORS for all /api/* routes automatically.
 */

import { handleCors, getCorsHeaders } from './_lib/cors.js';

export const onRequest: PagesFunction = async (context) => {
  // Handle CORS preflight
  const corsResponse = handleCors(context.request);
  if (corsResponse) return corsResponse;

  // Run the actual function
  const response = await context.next();

  // Add CORS headers to the response
  const corsHeaders = getCorsHeaders(context.request);
  const newResponse = new Response(response.body, response);
  for (const [key, value] of Object.entries(corsHeaders)) {
    newResponse.headers.set(key, value);
  }

  return newResponse;
};
