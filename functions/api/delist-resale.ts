import { verifyAuth } from './_lib/auth.js';
import { getAdminDb } from './_lib/firebase-admin.js';
import { rateLimit, RATE_LIMITS } from './_lib/rate-limit.js';
import { FieldValue } from 'firebase-admin/firestore';
import { json, errorResponse, type Env } from './_lib/types.js';

/**
 * POST /api/delist-resale
 * Body: { resaleId }
 */
export const onRequestPost: PagesFunction<Env> = async (context) => {
  try {
    const user = await verifyAuth(context.request, context.env);

    const rateLimited = rateLimit(user.uid, RATE_LIMITS.GENERAL);
    if (rateLimited) return rateLimited;

    const db = getAdminDb(context.env);
    const { resaleId } = await context.request.json() as any;

    if (!resaleId) {
      return errorResponse('Missing resaleId');
    }

    await db.runTransaction(async (transaction) => {
      const resaleRef = db.collection('resale').doc(resaleId);
      const resaleSnap = await transaction.get(resaleRef);

      if (!resaleSnap.exists) throw new Error('Resale listing not found');

      const resale = resaleSnap.data()!;

      if (resale.sellerId !== user.uid) throw new Error('You are not the seller of this listing');
      if (resale.status !== 'listed') throw new Error('This listing is not active');

      transaction.update(resaleRef, { status: 'cancelled', cancelledAt: FieldValue.serverTimestamp() });

      if (resale.ticketId) {
        const ticketRef = db.collection('tickets').doc(resale.ticketId);
        transaction.update(ticketRef, { status: 'active' });
      }
    });

    return json({ success: true });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Failed to delist resale';
    return errorResponse(message);
  }
};
