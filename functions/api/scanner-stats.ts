import { verifyPromoter } from './_lib/auth.js';
import { getAdminDb } from './_lib/firebase-admin.js';
import { rateLimit, RATE_LIMITS } from './_lib/rate-limit.js';
import { json, errorResponse, type Env } from './_lib/types.js';

/**
 * GET /api/scanner-stats?eventId=xxx
 */
export const onRequestGet: PagesFunction<Env> = async (context) => {
  try {
    const user = await verifyPromoter(context.request, context.env);

    const rateLimited = rateLimit(user.uid, RATE_LIMITS.GENERAL);
    if (rateLimited) return rateLimited;

    const db = getAdminDb(context.env);
    const url = new URL(context.request.url);
    const eventId = url.searchParams.get('eventId');

    if (!eventId) {
      return errorResponse('Missing eventId');
    }

    const eventSnap = await db.collection('events').doc(eventId).get();
    if (!eventSnap.exists) {
      return errorResponse('Event not found', 404);
    }

    if (eventSnap.data()!.organizer !== user.uid) {
      return errorResponse('Not the organizer of this event', 403);
    }

    const ticketsSnap = await db
      .collection('tickets')
      .where('eventId', '==', eventId)
      .where('status', 'in', ['active', 'used'])
      .get();

    let usedCount = 0;
    let totalSold = 0;

    ticketsSnap.docs.forEach((doc) => {
      totalSold++;
      if (doc.data().status === 'used') usedCount++;
    });

    return json({ usedCount, totalSold });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Failed to get stats';
    return errorResponse(message);
  }
};
