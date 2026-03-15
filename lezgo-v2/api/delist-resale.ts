import type { VercelRequest, VercelResponse } from '@vercel/node';
import { verifyAuth } from './lib/auth.js';
import { getAdminDb } from './lib/firebase-admin.js';
import { rateLimit, RATE_LIMITS } from './lib/rate-limit.js';
import { cors } from './lib/cors.js';
import { FieldValue } from 'firebase-admin/firestore';

/**
 * POST /api/delist-resale
 * Body: { resaleId }
 *
 * Cancels a resale listing. Server validates the seller owns it.
 * Sets resale status to 'cancelled' and restores ticket to 'active'.
 */
export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (cors(req, res)) return;

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const user = await verifyAuth(req);

    // Rate limiting
    if (rateLimit(req, res, user.uid, RATE_LIMITS.GENERAL)) return;

    const db = getAdminDb();
    const { resaleId } = req.body;

    if (!resaleId) {
      return res.status(400).json({ error: 'Missing resaleId' });
    }

    // Run everything in a Firestore transaction
    await db.runTransaction(async (transaction) => {
      // Get the resale listing inside the transaction
      const resaleRef = db.collection('resale').doc(resaleId);
      const resaleSnap = await transaction.get(resaleRef);

      if (!resaleSnap.exists) {
        throw new Error('Resale listing not found');
      }

      const resale = resaleSnap.data()!;

      // Verify the authenticated user is the seller
      if (resale.sellerId !== user.uid) {
        throw new Error('You are not the seller of this listing');
      }

      // Only listed items can be delisted
      if (resale.status !== 'listed') {
        throw new Error('This listing is not active');
      }

      // Cancel listing + restore ticket to active
      transaction.update(resaleRef, { status: 'cancelled', cancelledAt: FieldValue.serverTimestamp() });

      if (resale.ticketId) {
        const ticketRef = db.collection('tickets').doc(resale.ticketId);
        transaction.update(ticketRef, { status: 'active' });
      }
    });

    return res.status(200).json({ success: true });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Failed to delist resale';
    return res.status(400).json({ error: message });
  }
}
