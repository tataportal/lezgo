import { verifyAuth } from './_lib/auth.js';
import { runTransaction } from './_lib/firestore-rest.js';
import { rateLimit, RATE_LIMITS } from './_lib/rate-limit.js';

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

    const env = context.env;
    const { resaleId } = await context.request.json() as any;

    if (!resaleId) {
      return errorResponse('Missing resaleId');
    }

    await runTransaction(env, async (tx) => {
      const resaleSnap = await tx.get('resale', resaleId);

      if (!resaleSnap.exists) throw new Error('Resale listing not found');

      const resale = resaleSnap.data()!;

      if (resale.status !== 'listed') throw new Error('This ticket is no longer available');
      if (resale.sellerId === user.uid) throw new Error('Cannot buy your own listing');

      const ticketSnap = await tx.get('tickets', resale.ticketId);

      if (!ticketSnap.exists) throw new Error('Ticket not found');

      const buyerSnap = await tx.get('users', user.uid);
      const buyerProfile = buyerSnap.data() || {};

      if (!buyerProfile.dni) {
        throw new Error('Identity document required. Please complete your profile.');
      }

      tx.update('resale', resaleId, {
        status: 'sold',
        buyerId: user.uid,
      });

      tx.update('tickets', resale.ticketId, {
        status: 'active',
        userId: user.uid,
        userEmail: user.email,
        userName: buyerProfile.displayName || '',
        userDni: buyerProfile.dni || '',
        boughtInResale: true,
        purchasedAt: new Date().toISOString(),
        transferredFrom: resale.sellerId,
        transferredAt: new Date().toISOString(),
      });
    });

    return json({ success: true });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Purchase failed';
    return errorResponse(message);
  }
};
