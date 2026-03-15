import type { VercelRequest, VercelResponse } from '@vercel/node';
import { verifyPromoter } from './lib/auth.js';
import { getAdminDb } from './lib/firebase-admin.js';
import { rateLimit, RATE_LIMITS } from './lib/rate-limit.js';
import { cors } from './lib/cors.js';

/**
 * PUT /api/update-event
 * Body: { eventId, ...updates }
 *
 * Verifies ownership, then updates event.
 */
export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (cors(req, res)) return;

  if (req.method !== 'PUT') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const user = await verifyPromoter(req);

    // Rate limiting
    if (rateLimit(req, res, user.uid, RATE_LIMITS.GENERAL)) return;

    const db = getAdminDb();
    const { eventId, ...updates } = req.body;

    if (!eventId) {
      return res.status(400).json({ error: 'Missing eventId' });
    }

    // Verify ownership
    const eventRef = db.collection('events').doc(eventId);
    const eventSnap = await eventRef.get();

    if (!eventSnap.exists) {
      return res.status(404).json({ error: 'Event not found' });
    }

    if (eventSnap.data()!.organizer !== user.uid) {
      return res.status(403).json({ error: 'Not the organizer of this event' });
    }

    // Whitelist allowed fields
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

    // Prevent overwriting organizer or createdAt
    delete sanitized['organizer'];
    delete sanitized['createdAt'];

    // B3 FIX: When tiers are updated, preserve the existing `sold` count
    // to prevent promoters from resetting inventory
    if (sanitized['tiers'] && Array.isArray(sanitized['tiers'])) {
      const existingTiers = eventSnap.data()!.tiers || [];
      const existingSoldMap = new Map<string, number>();
      for (const t of existingTiers) {
        existingSoldMap.set(t.id, t.sold ?? 0);
      }

      sanitized['tiers'] = (sanitized['tiers'] as any[]).map((tier: any) => ({
        ...tier,
        // Force sold to the existing value; default to 0 for brand-new tiers
        sold: existingSoldMap.get(tier.id) ?? 0,
      }));
    }

    if (Object.keys(sanitized).length === 0) {
      return res.status(400).json({ error: 'No valid fields to update' });
    }

    await eventRef.update(sanitized);

    return res.status(200).json({ success: true });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Failed to update event';
    return res.status(400).json({ error: message });
  }
}
