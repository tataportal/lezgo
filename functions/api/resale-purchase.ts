import { verifyAuth } from './_lib/auth.js';
import { getAdminDb } from './_lib/firebase-admin.js';
import { rateLimit, RATE_LIMITS } from './_lib/rate-limit.js';
import { FieldValue } from 'firebase-admin/firestore';
import { json, errorResponse, type Env } from './_lib/types.js';

/**
 * POST /api/resale-purchase
 * Body: { resaleId }
 */
export const onRequestPost: PagesFunction<Env> = async (context) => {
  try {
    const user = await verifyAuth(context.request, context.env);

    const rateLimited = rateLimit(user.uid, RATE_LIMITS.RESALE_PURCHASE);
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

      if (resale.status !== 'listed') throw new Error('This ticket is no longer available');
      if (resale.sellerId === user.uid) throw new Error('Cannot buy your own listing');

      const ticketRef = db.collection('tickets').doc(resale.ticketId);
      const ticketSnap = await transaction.get(ticketRef);

      if (!ticketSnap.exists) throw new Error('Ticket not found');

      const buyerRef = db.collection('users').doc(user.uid);
      const buyerSnap = await transaction.get(buyerRef);
      const buyerProfile = buyerSnap.data() || {};

      transaction.update(resaleRef, {
        status: 'sold',
        buyerId: user.uid,
      });

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

    return json({ success: true });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Purchase failed';
    return errorResponse(message);
  }
};
