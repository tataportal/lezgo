import type { VercelRequest, VercelResponse } from '@vercel/node';
import { verifyAuth } from './lib/auth.js';
import { getAdminDb } from './lib/firebase-admin.js';
import { rateLimit, RATE_LIMITS } from './lib/rate-limit.js';
import { FieldValue } from 'firebase-admin/firestore';
import { cors } from './lib/cors.js';

/**
 * POST /api/resale-purchase
 * Body: { resaleId }
 *
 * Atomic transaction: marks listing as sold, transfers ticket to buyer.
 */
export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (cors(req, res)) return;

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const user = await verifyAuth(req);

    // Rate limiting: 2 resale purchases per minute
    if (rateLimit(req, res, user.uid, RATE_LIMITS.RESALE_PURCHASE)) return;
    const db = getAdminDb();
    const { resaleId } = req.body;

    if (!resaleId) {
      return res.status(400).json({ error: 'Missing resaleId' });
    }

    await db.runTransaction(async (transaction) => {
      // Get resale listing
      const resaleRef = db.collection('resale').doc(resaleId);
      const resaleSnap = await transaction.get(resaleRef);

      if (!resaleSnap.exists) {
        throw new Error('Resale listing not found');
      }

      const resale = resaleSnap.data()!;

      if (resale.status !== 'listed') {
        throw new Error('This ticket is no longer available');
      }

      if (resale.sellerId === user.uid) {
        throw new Error('Cannot buy your own listing');
      }

      // Get ticket
      const ticketRef = db.collection('tickets').doc(resale.ticketId);
      const ticketSnap = await transaction.get(ticketRef);

      if (!ticketSnap.exists) {
        throw new Error('Ticket not found');
      }

      // Get buyer profile for DNI
      const buyerRef = db.collection('users').doc(user.uid);
      const buyerSnap = await transaction.get(buyerRef);
      const buyerProfile = buyerSnap.data() || {};

      // Update resale listing → sold
      transaction.update(resaleRef, {
        status: 'sold',
        buyerId: user.uid,
      });

      // Transfer ticket → new owner
      transaction.update(ticketRef, {
        status: 'active',
        userId: user.uid,
        userEmail: user.email,
        userName: buyerProfile.displayName || '',
        userDni: buyerProfile.dni || '',
        boughtInResale: true,
        purchasedAt: FieldValue.serverTimestamp(),
        transferredFrom: resale.sellerId,
        transferredAt: FieldValue.serverTimestamp(),
      });
    });

    return res.status(200).json({ success: true });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Purchase failed';
    return res.status(400).json({ error: message });
  }
}
