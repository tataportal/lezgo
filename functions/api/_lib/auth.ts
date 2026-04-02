/**
 * Authentication helpers for Cloudflare Workers.
 * Verifies Firebase ID tokens using Web Crypto API with JWK keys.
 */

import { getDoc } from './firestore-rest.js';
import type { Env, AuthUser } from './types.js';

// Google's JWK endpoint — supported by crypto.subtle.importKey('jwk', ...)
const GOOGLE_JWK_URL = 'https://www.googleapis.com/service_accounts/v1/jwk/securetoken@system.gserviceaccount.com';

interface JWK {
  kty: string;
  alg: string;
  use: string;
  kid: string;
  n: string;
  e: string;
}

let cachedKeys: JWK[] | null = null;
let keysExpiry = 0;

async function getGoogleKeys(): Promise<JWK[]> {
  const now = Date.now();
  if (cachedKeys && now < keysExpiry) return cachedKeys;

  const res = await fetch(GOOGLE_JWK_URL);
  const data = await res.json() as { keys: JWK[] };

  const cacheControl = res.headers.get('cache-control') || '';
  const maxAgeMatch = cacheControl.match(/max-age=(\d+)/);
  keysExpiry = now + (maxAgeMatch ? parseInt(maxAgeMatch[1]) * 1000 : 3600_000);
  cachedKeys = data.keys;

  return data.keys;
}

function base64UrlDecode(str: string): Uint8Array {
  const base64 = str.replace(/-/g, '+').replace(/_/g, '/');
  const pad = base64.length % 4;
  const padded = pad ? base64 + '='.repeat(4 - pad) : base64;
  const binary = atob(padded);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
}

interface JWTHeader {
  alg: string;
  kid: string;
}

interface JWTPayload {
  iss: string;
  aud: string;
  sub: string;
  email?: string;
  iat: number;
  exp: number;
}

async function verifyFirebaseToken(token: string, projectId: string): Promise<JWTPayload> {
  const parts = token.split('.');
  if (parts.length !== 3) throw new Error('Invalid token format');

  const headerStr = new TextDecoder().decode(base64UrlDecode(parts[0]));
  const payloadStr = new TextDecoder().decode(base64UrlDecode(parts[1]));
  const header: JWTHeader = JSON.parse(headerStr);
  const payload: JWTPayload = JSON.parse(payloadStr);

  // Validate claims
  const now = Math.floor(Date.now() / 1000);
  if (payload.exp < now) throw new Error('Token expired');
  if (payload.iat > now + 60) throw new Error('Token issued in the future');
  if (payload.iss !== `https://securetoken.google.com/${projectId}`) throw new Error('Invalid issuer');
  if (payload.aud !== projectId) throw new Error('Invalid audience');
  if (!payload.sub) throw new Error('Missing subject');

  // Get the matching JWK key
  const keys = await getGoogleKeys();
  const jwk = keys.find(k => k.kid === header.kid);
  if (!jwk) throw new Error('Unknown signing key');

  // Import as JWK — fully supported in Cloudflare Workers
  const key = await crypto.subtle.importKey(
    'jwk',
    { kty: jwk.kty, n: jwk.n, e: jwk.e, alg: 'RS256', ext: true },
    { name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256' },
    false,
    ['verify']
  );

  const signedData = new TextEncoder().encode(`${parts[0]}.${parts[1]}`);
  const signature = base64UrlDecode(parts[2]);

  const valid = await crypto.subtle.verify('RSASSA-PKCS1-v1_5', key, signature, signedData);
  if (!valid) throw new Error('Invalid signature');

  return payload;
}

/**
 * Verify Firebase ID token from Authorization header.
 * Returns { uid, email } or throws.
 */
export async function verifyAuth(request: Request, env: Env): Promise<AuthUser> {
  const authHeader = request.headers.get('Authorization');

  if (!authHeader?.startsWith('Bearer ')) {
    throw new Error('Missing or invalid Authorization header');
  }

  const idToken = authHeader.slice(7);
  const decoded = await verifyFirebaseToken(idToken, env.FIREBASE_PROJECT_ID);

  return {
    uid: decoded.sub,
    email: decoded.email || '',
  };
}

/**
 * Verify auth and also check that user has promoter/admin role.
 */
export async function verifyPromoter(request: Request, env: Env): Promise<AuthUser> {
  const user = await verifyAuth(request, env);

  const userDoc = await getDoc(env, 'users', user.uid);
  const role = userDoc.data()?.role;

  if (role !== 'promoter' && role !== 'admin') {
    throw new Error('Insufficient permissions: promoter or admin role required');
  }

  return user;
}
