import { verifyPromoter } from './_lib/auth.js';
import { getAdminDb } from './_lib/firebase-admin.js';
import { rateLimit, RATE_LIMITS } from './_lib/rate-limit.js';
import { json, errorResponse, type Env } from './_lib/types.js';

/**
 * PUT /api/update-event
 * Body: { eventId, ...updates }
 */
export const onRequestPut: PagesFunction<Env> = async (context) => {
  try {
    const user = await verifyPromoter(context.request, context.env);

    const rateLimited = rateLimit(user.uid, RATE_LIMITS.GENERAL);
    if (rateLimited) return rateLimited;

    const db = getAdminDb(context.env);
    const body = await context.request.json() as any;
    const { eventId, ...updates } = body;

    if (!eventId) {
      return errorResponse('Missing eventId');
    }

    const eventRef = db.collection('events').doc(eventId);
    const eventSnap = await eventRef.get();

    if (!eventSnap.exists) {
      return errorResponse('Event not found', 404);
    }

    if (eventSnap.data()!.organizer !== user.uid) {
      return errorResponse('Not the organizer of this event', 403);
    }

    const ALLOWED_FIELDS = [
      'name', 'subtitle', 'date', 'dateLabel', 'venue', 'location', 'address',
      'image', 'heroVideo', 'description', 'descriptionLong', 'genre',
      'lineup', 'tags', 'prohibitedItems', 'tiers', 'status', 'slug',
      'visibleSections', 'meta', 'timeStart', 'timeEnd',
    ];

    const sanitized: Record<string, unknown> = {};
    for (const key of ALLOWED_FIELDS) {
      if (key in updates) {
        sanitized[key] = updates[key];
      }
    }

    delete sanitized['organizer'];
    delete sanitized['createdAt'];

    if (sanitized['tiers'] && Array.isArray(sanitized['tiers'])) {
      const existingTiers = eventSnap.data()!.tiers || [];
      const existingSoldMap = new Map<string, number>();
      for (const t of existingTiers) {
        existingSoldMap.set(t.id, t.sold ?? 0);
      }

      sanitized['tiers'] = (sanitized['tiers'] as any[]).map((tier: any) => ({
        ...tier,
        sold: existingSoldMap.get(tier.id) ?? 0,
      }));
    }

    if (Object.keys(sanitized).length === 0) {
      return errorResponse('No valid fields to update');
    }

    await eventRef.update(sanitized);

    return json({ success: true });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Failed to update event';
    return errorResponse(message);
  }
};
