import type { VercelRequest } from '@vercel/node';
import { getAdminAuth } from './firebase-admin.js';

export interface AuthUser {
  uid: string;
  email: string;
}

/**
 * Verify Firebase ID token from Authorization header.
 * Returns { uid, email } or throws.
 */
export async function verifyAuth(req: VercelRequest): Promise<AuthUser> {
  const authHeader = req.headers.authorization;

  if (!authHeader?.startsWith('Bearer ')) {
    throw new Error('Missing or invalid Authorization header');
  }

  const idToken = authHeader.slice(7);
  const decoded = await getAdminAuth().verifyIdToken(idToken);

  return {
    uid: decoded.uid,
    email: decoded.email || '',
  };
}

/**
 * Verify auth and also check that user has promoter/admin role.
 */
export async function verifyPromoter(req: VercelRequest): Promise<AuthUser> {
  const user = await verifyAuth(req);
  const { getAdminDb } = await import('./firebase-admin');
  const db = getAdminDb();

  const userDoc = await db.collection('users').doc(user.uid).get();
  const role = userDoc.data()?.role;

  if (role !== 'promoter' && role !== 'admin') {
    throw new Error('Insufficient permissions: promoter or admin role required');
  }

  return user;
}
