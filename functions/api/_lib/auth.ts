/**
 * Authentication helpers for Cloudflare Pages Functions.
 * Verifies Firebase ID tokens from Authorization header.
 */

import { getAdminAuth, getAdminDb } from './firebase-admin.js';
import type { Env, AuthUser } from './types.js';

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
  const decoded = await getAdminAuth(env).verifyIdToken(idToken);

  return {
    uid: decoded.uid,
    email: decoded.email || '',
  };
}

/**
 * Verify auth and also check that user has promoter/admin role.
 */
export async function verifyPromoter(request: Request, env: Env): Promise<AuthUser> {
  const user = await verifyAuth(request, env);
  const db = getAdminDb(env);

  const userDoc = await db.collection('users').doc(user.uid).get();
  const role = userDoc.data()?.role;

  if (role !== 'promoter' && role !== 'admin') {
    throw new Error('Insufficient permissions: promoter or admin role required');
  }

  return user;
}
