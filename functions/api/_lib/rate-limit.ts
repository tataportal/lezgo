/**
 * Simple in-memory rate limiter for Cloudflare Pages Functions.
 *
 * LIMITATIONS:
 * - Each isolate has its own memory, so rate limits are per-instance.
 * - Memory is cleared on cold starts.
 *
 * UPGRADE PATH: Replace with Cloudflare KV or D1 for global state.
 */

import { json } from './types.js';

interface RateLimitEntry {
  count: number;
  resetAt: number;
}

// Per-instance rate limit store
const store = new Map<string, RateLimitEntry>();

// Cleanup old entries periodically
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

export interface RateLimitConfig {
  maxRequests: number;
  windowMs: number;
  keyPrefix?: string;
}

/**
 * Rate limit check. Returns a 429 Response if blocked, or null if allowed.
 */
export function rateLimit(
  identifier: string,
  config: RateLimitConfig
): Response | null {
  cleanup();

  const key = `${config.keyPrefix || 'rl'}:${identifier}`;
  const now = Date.now();
  const entry = store.get(key);

  if (!entry || entry.resetAt < now) {
    store.set(key, { count: 1, resetAt: now + config.windowMs });
    return null;
  }

  entry.count++;

  if (entry.count > config.maxRequests) {
    const retryAfter = Math.ceil((entry.resetAt - now) / 1000);
    return json(
      { error: 'Too many requests. Please wait before trying again.', retryAfter },
      429,
      {
        'Retry-After': String(retryAfter),
        'X-RateLimit-Limit': String(config.maxRequests),
        'X-RateLimit-Remaining': '0',
        'X-RateLimit-Reset': String(Math.ceil(entry.resetAt / 1000)),
      }
    );
  }

  return null;
}

export const RATE_LIMITS = {
  PURCHASE: { maxRequests: 1, windowMs: 30_000, keyPrefix: 'purchase' },
  TRANSFER: { maxRequests: 3, windowMs: 60_000, keyPrefix: 'transfer' },
  RESALE_LIST: { maxRequests: 5, windowMs: 300_000, keyPrefix: 'resale-list' },
  RESALE_PURCHASE: { maxRequests: 2, windowMs: 60_000, keyPrefix: 'resale-buy' },
  COUPON_VALIDATE: { maxRequests: 10, windowMs: 60_000, keyPrefix: 'coupon' },
  SCANNER: { maxRequests: 20, windowMs: 60_000, keyPrefix: 'scanner' },
  GENERAL: { maxRequests: 30, windowMs: 60_000, keyPrefix: 'general' },
} as const;
