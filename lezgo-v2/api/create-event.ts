import type { VercelRequest, VercelResponse } from '@vercel/node';
import { verifyPromoter } from './lib/auth';
import { getAdminDb } from './lib/firebase-admin';
import { FieldValue } from 'firebase-admin/firestore';
import { rateLimit, RATE_LIMITS } from './lib/rate-limit';
import { cors } from './lib/cors';

/**
 * POST /api/create-event
 * Body: CreateEventInput (name, tiers, date, venue, etc.)
 *
 * Verifies promoter role, then creates event.
 */
export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (cors(req, res)) return;

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const user = await verifyPromoter(req);

    // Rate limiting
    if (rateLimit(req, res, user.uid, RATE_LIMITS.GENERAL)) return;

    const db = getAdminDb();
    const eventData = req.body;

    if (!eventData.name || !eventData.tiers) {
      return res.status(400).json({ error: 'Missing required fields: name, tiers' });
    }

    // Sanitize: remove any fields the client shouldn't control
    const safeData = {
      name: eventData.name,
      subtitle: eventData.subtitle || '',
      date: eventData.date || null,
      dateLabel: eventData.dateLabel || '',
      timeStart: eventData.timeStart || '',
      timeEnd: eventData.timeEnd || '',
      venue: eventData.venue || '',
      location: eventData.location || '',
      address: eventData.address || '',
      image: eventData.image || '',
      heroVideo: eventData.heroVideo || '',
      description: eventData.description || '',
      descriptionLong: eventData.descriptionLong || '',
      genre: eventData.genre || '',
      lineup: eventData.lineup || [],
      tags: eventData.tags || [],
      prohibitedItems: eventData.prohibitedItems || [],
      tiers: (eventData.tiers || []).map((t: any) => ({
        ...t,
        sold: 0, // Always start at 0
      })),
      status: 'draft', // Always start as draft
      featured: false,
      slug: eventData.slug || '',
      crowdSize: eventData.crowdSize || '',
      minAge: eventData.minAge || '',
      multiStage: eventData.multiStage || false,
      barAvailable: eventData.barAvailable || false,
      reentryAllowed: eventData.reentryAllowed || false,
      outdoor: eventData.outdoor || false,
      visibleSections: eventData.visibleSections || {},
      meta: eventData.meta || {},
      organizer: user.uid,
      createdAt: FieldValue.serverTimestamp(),
    };

    const docRef = await db.collection('events').add(safeData);

    return res.status(200).json({ eventId: docRef.id });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Failed to create event';
    return res.status(400).json({ error: message });
  }
}
