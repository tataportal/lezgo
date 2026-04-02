import { verifyAuth } from './_lib/auth.js';
import { runTransaction } from './_lib/firestore-rest.js';
import { FEES } from './_lib/constants.js';
import { rateLimit, RATE_LIMITS } from './_lib/rate-limit.js';
import { json, errorResponse, type Env } from './_lib/types.js';

/**
 * POST /api/resale-list
 * Body: { ticketId, askingPrice, image? }
 */
export const onRequestPost: PagesFunction<Env> = async (context) => {
  try {
    const user = await verifyAuth(context.request, context.env);

    const rateLimited = rateLimit(user.uid, RATE_LIMITS.RESALE_LIST);
    if (rateLimited) return rateLimited;

    const env = context.env;
    const { ticketId, askingPrice, image } = await context.request.json() as any;

    if (!ticketId || typeof askingPrice !== 'number' || isNaN(askingPrice) || askingPrice <= 0) {
      return errorResponse('Missing ticketId or invalid askingPrice');
    }

    const result = await runTransaction(env, async (tx) => {
      const ticketSnap = await tx.get('tickets', ticketId);

      if (!ticketSnap.exists) throw new Error('Ticket not found');

      const ticket = ticketSnap.data()!;

      if (ticket.userId !== user.uid) throw new Error('You do not own this ticket');
      if (ticket.status !== 'active') throw new Error('Ticket is not available for resale');

      const originalPrice = ticket.originalPrice || 0;
      const maxAllowedPrice = originalPrice * 1.20;
      if (originalPrice > 0 && askingPrice > maxAllowedPrice) {
        throw new Error(`Price cannot exceed 20% above original (max: ${maxAllowedPrice.toFixed(2)})`);
      }

      const fee = askingPrice * FEES.RESALE_SELLER;
      const netToSeller = askingPrice - fee;

      const resaleDocId = tx.generateId();
      const resaleData: Record<string, any> = {
        ticketId,
        eventId: ticket.eventId || '',
        eventName: ticket.eventName || '',
        eventDate: ticket.eventDate || null,
        eventDateLabel: ticket.eventDateLabel || '',
        eventVenue: ticket.eventVenue || '',
        ticketTier: ticket.ticketName || '',
        originalPrice: ticket.originalPrice || 0,
        askingPrice,
        sellerId: user.uid,
        sellerName: ticket.userName || '',
        sellerEmail: ticket.userEmail || '',
        image: image || '',
        status: 'listed',
        fee,
        netToSeller,
        createdAt: new Date().toISOString(),
        buyerId: null,
      };

      tx.set('resale', resaleDocId, resaleData);
      tx.update('tickets', ticketId, { status: 'resale-listed' });

      return { resaleId: resaleDocId, fee, netToSeller };
    });

    return json(result);
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Failed to list for resale';
    return errorResponse(message);
  }
};
