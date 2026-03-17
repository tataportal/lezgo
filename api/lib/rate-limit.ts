import type { VercelRequest, VercelResponse } from '@vercel/node';

/**
 * Simple in-memory rate limiter for Vercel serverless functions.
 *
 * LIMITATIONS:
 * - Each serverless instance has its own memory, so rate limits
 *   are per-instance rather than global. This is acceptable for
 *   marcha blanca. For production scale, upgrade to Vercel KV or Redis.
 * - Memory is cleared on cold starts.
 *
 * UPGRADE PATH: Replace the Map with Vercel KV:
 *   import { kv } from '@vercel/kv';
 *   const key = `rate:${identifier}:${window}`;
 *   const count = await kv.incr(key);
 *   if (count === 1) await kv.expire(key, windowMs / 1000);
 */

interface RateLimitEntry {
  count: number;
  resetAt: number;
}

// Per-instance rate limit store
const store = new Map<string, RateLimitEntry>();

// Cleanup old entries periodically (every 60s)
let lastCleanup = Date.now();
function cleanup() {
  const now = Date.now();
  if (now - lastCleanup < 60_000) return;
  lastCleanup = now;
  for (const [key, entry] of store) {
    if (entry.resetAt < now) {
      store.delete(key);
    }
  }
}

interface RateLimitConfig {
  /** Maximum number of requests per window */
  maxRequests: number;
  /** Time window in milliseconds */
  windowMs: number;
  /** Key prefix to namespace different rate limits */
  keyPrefix?: string;
}

/**
 * Rate limit middleware for Vercel serverless functions.
 * Returns null if the request is allowed, or sends a 429 response.
 *
 * Usage:
 *   const blocked = rateLimit(req, res, userId, { maxRequests: 1, windowMs: 30000 });
 *   if (blocked) return; // Response already sent
 */
export function rateLimit(
  _req: VercelRequest,
  res: VercelResponse,
  identifier: string,
  config: RateLimitConfig
): boolean {
  cleanup();

  const key = `${config.keyPrefix || 'rl'}:${identifier}`;
  const now = Date.now();
  const entry = store.get(key);

  if (!entry || entry.resetAt < now) {
    // First request in this window
    store.set(key, { count: 1, resetAt: now + config.windowMs });
    return false; // Not blocked
  }

  entry.count++;

  if (entry.count > config.maxRequests) {
    const retryAfter = Math.ceil((entry.resetAt - now) / 1000);
    res.setHeader('Retry-After', String(retryAfter));
    res.setHeader('X-RateLimit-Limit', String(config.maxRequests));
    res.setHeader('X-RateLimit-Remaining', '0');
    res.setHeader('X-RateLimit-Reset', String(Math.ceil(entry.resetAt / 1000)));
    res.status(429).json({
      error: 'Too many requests. Please wait before trying again.',
      retryAfter,
    });
    return true; // Blocked
  }

  return false; // Not blocked
}

/**
 * Pre-configured rate limits for common operations.
 */
export const RATE_LIMITS = {
  /** 1 purchase per user every 30 seconds */
  PURCHASE: { maxRequests: 1, windowMs: 30_000, keyPrefix: 'purchase' },
  /** 3 transfer attempts per user per minute */
  TRANSFER: { maxRequests: 3, windowMs: 60_000, keyPrefix: 'transfer' },
  /** 5 resale listings per user per 5 minutes */
  RESALE_LIST: { maxRequests: 5, windowMs: 300_000, keyPrefix: 'resale-list' },
  /** 2 resale purchases per user per minute */
  RESALE_PURCHASE: { maxRequests: 2, windowMs: 60_000, keyPrefix: 'resale-buy' },
  /** 10 coupon validations per user per minute */
  COUPON_VALIDATE: { maxRequests: 10, windowMs: 60_000, keyPrefix: 'coupon' },
  /** 20 scanner verifications per organizer per minute */
  SCANNER: { maxRequests: 20, windowMs: 60_000, keyPrefix: 'scanner' },
  /** General API: 30 requests per minute */
  GENERAL: { maxRequests: 30, windowMs: 60_000, keyPrefix: 'general' },
} as const;
