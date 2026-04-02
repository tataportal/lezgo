import { verifyPromoter } from './_lib/auth.js';
import { addDoc } from './_lib/firestore-rest.js';

import { rateLimit, RATE_LIMITS } from './_lib/rate-limit.js';
import { json, errorResponse, type Env } from './_lib/types.js';

/**
 * POST /api/create-event
 * Body: CreateEventInput (name, tiers, date, venue, etc.)
 */
export const onRequestPost: PagesFunction<Env> = async (context) => {
  try {
    const user = await verifyPromoter(context.request, context.env);

    const rateLimited = rateLimit(user.uid, RATE_LIMITS.GENERAL);
    if (rateLimited) return rateLimited;

    const env = context.env;
    const eventData = await context.request.json() as any;

    if (!eventData.name || !eventData.tiers) {
      return errorResponse('Missing required fields: name, tiers');
    }

    const safeData: Record<string, any> = {
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
        sold: 0,
      })),
      maxTicketsPerBuyer: Math.max(Number(eventData.maxTicketsPerBuyer || 1), 1),
      status: eventData.status || 'draft',
      featured: Boolean(eventData.featured),
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
      createdAt: new Date().toISOString(),
    };

    const docId = await addDoc(env, 'events', safeData);

    return json({ eventId: docId });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Failed to create event';
    return errorResponse(message);
  }
};
