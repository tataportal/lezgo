import { verifyAuth } from './_lib/auth.js';
import { runTransaction } from './_lib/firestore-rest.js';
import { rateLimit, RATE_LIMITS } from './_lib/rate-limit.js';

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

    const env = context.env;
    const { resaleId } = await context.request.json() as any;

    if (!resaleId) {
      return errorResponse('Missing resaleId');
    }

    await runTransaction(env, async (tx) => {
      const resaleSnap = await tx.get('resale', resaleId);

      if (!resaleSnap.exists) throw new Error('Resale listing not found');

      const resale = resaleSnap.data()!;

      if (resale.sellerId !== user.uid) throw new Error('You are not the seller of this listing');
      if (resale.status !== 'listed') throw new Error('This listing is not active');

      tx.update('resale', resaleId, { status: 'cancelled', cancelledAt: new Date().toISOString() });

      if (resale.ticketId) {
        tx.update('tickets', resale.ticketId, { status: 'active' });
      }
    });

    return json({ success: true });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Failed to delist resale';
    return errorResponse(message);
  }
};
