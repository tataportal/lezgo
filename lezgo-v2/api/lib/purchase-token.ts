/**
 * Purchase Token system (Security Layer 3 — Virtual Queue).
 *
 * HOW IT WORKS:
 * 1. Before purchase, client requests a purchase token via /api/request-purchase-token
 * 2. Server creates a token with a TTL (2 minutes)
 * 3. Client includes the token in the purchase request
 * 4. Server validates the token hasn't expired and marks it as used
 *
 * This prevents:
 * - Automated bulk purchases (bots must go through the token flow)
 * - Race conditions (tokens are single-use)
 * - Replay attacks (tokens expire after 2 minutes)
 *
 * MARCHA BLANCA:
 * Uses in-memory Map (same limitation as rate limiter — per instance).
 *
 * PRODUCTION UPGRADE:
 * Replace Map with Vercel KV or Redis for global state.
 * Or use Cloudflare Waiting Room for true virtual queue.
 */

import * as crypto from 'crypto';

interface PurchaseToken {
  userId: string;
  eventId: string;
  createdAt: number;
  expiresAt: number;
  used: boolean;
}

const TOKEN_TTL_MS = 2 * 60 * 1000; // 2 minutes
const tokenStore = new Map<string, PurchaseToken>();

// Cleanup expired tokens periodically
let lastCleanup = Date.now();
function cleanup() {
  const now = Date.now();
  if (now - lastCleanup < 30_000) return;
  lastCleanup = now;
  for (const [key, token] of tokenStore) {
    if (token.expiresAt < now) {
      tokenStore.delete(key);
    }
  }
}

/**
 * Generate a purchase token for a user + event combination.
 * Returns the token string.
 */
export function generatePurchaseToken(userId: string, eventId: string): string {
  cleanup();

  const token = crypto.randomBytes(32).toString('hex');
  const now = Date.now();

  tokenStore.set(token, {
    userId,
    eventId,
    createdAt: now,
    expiresAt: now + TOKEN_TTL_MS,
    used: false,
  });

  return token;
}

/**
 * Validate and consume a purchase token.
 * Returns true if valid, throws if invalid.
 */
export function validatePurchaseToken(
  token: string | null | undefined,
  userId: string,
  eventId: string
): boolean {
  // If no token system is enforced yet (marcha blanca), allow
  // To enforce: remove this early return
  if (!token) return true;

  cleanup();

  const entry = tokenStore.get(token);

  if (!entry) {
    throw new Error('Invalid or expired purchase token. Please try again.');
  }

  if (entry.used) {
    throw new Error('Purchase token already used. Please request a new one.');
  }

  if (entry.expiresAt < Date.now()) {
    tokenStore.delete(token);
    throw new Error('Purchase token expired. Please request a new one.');
  }

  if (entry.userId !== userId) {
    throw new Error('Purchase token does not belong to this user.');
  }

  if (entry.eventId !== eventId) {
    throw new Error('Purchase token is for a different event.');
  }

  // Mark as used (single-use)
  entry.used = true;

  return true;
}
