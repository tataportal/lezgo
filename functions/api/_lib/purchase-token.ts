/**
 * Purchase Token system (Security Layer 3 — Virtual Queue).
 *
 * Uses crypto.randomUUID for Cloudflare Workers compatibility.
 *
 * UPGRADE PATH: Replace Map with Cloudflare KV for global state.
 * Or use Cloudflare Waiting Room for true virtual queue.
 */

interface PurchaseToken {
  userId: string;
  eventId: string;
  createdAt: number;
  expiresAt: number;
  used: boolean;
}

const TOKEN_TTL_MS = 2 * 60 * 1000; // 2 minutes
const tokenStore = new Map<string, PurchaseToken>();

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
 */
export function generatePurchaseToken(userId: string, eventId: string): string {
  cleanup();

  // Use Web Crypto API (available in Workers) instead of Node's crypto
  const token = crypto.randomUUID() + '-' + crypto.randomUUID();
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
 */
export function validatePurchaseToken(
  token: string | null | undefined,
  userId: string,
  eventId: string
): boolean {
  // If no token system is enforced yet (marcha blanca), allow
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

  entry.used = true;
  return true;
}
