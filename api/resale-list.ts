import type { VercelRequest, VercelResponse } from '@vercel/node';
import { verifyAuth } from './lib/auth.js';
import { getAdminDb } from './lib/firebase-admin.js';
import { FEES } from './lib/constants.js';
import { rateLimit, RATE_LIMITS } from './lib/rate-limit.js';
import { cors } from './lib/cors.js';

/**
 * POST /api/resale-list
 * Body: { ticketId, askingPrice, image? }
 *
 * Validates ownership, calculates 10% seller fee, creates listing.
 */
export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (cors(req, res)) return;

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const user = await verifyAuth(req);

    // Rate limiting: 5 resale listings per 5 minutes
    if (rateLimit(req, res, user.uid, RATE_LIMITS.RESALE_LIST)) return;
    const db = getAdminDb();
    const { ticketId, askingPrice, image } = req.body;

    if (!ticketId || typeof askingPrice !== 'number' || isNaN(askingPrice) || askingPrice <= 0) {
      return res.status(400).json({ error: 'Missing ticketId or invalid askingPrice' });
    }

    // Run everything in a Firestore transaction
    const result = await db.runTransaction(async (transaction) => {
      // Verify ticket exists and belongs to user — read INSIDE the transaction
      const ticketRef = db.collection('tickets').doc(ticketId);
      const ticketSnap = await transaction.get(ticketRef);

      if (!ticketSnap.exists) {
        throw new Error('Ticket not found');
      }

      const ticket = ticketSnap.data()!;

      if (ticket.userId !== user.uid) {
        throw new Error('You do not own this ticket');
      }

      if (ticket.status !== 'active') {
        throw new Error('Ticket is not available for resale');
      }

      // B4 FIX: Enforce resale price cap — max 20% above original price
      const originalPrice = ticket.originalPrice || 0;
      const maxAllowedPrice = originalPrice * 1.20;
      if (originalPrice > 0 && askingPrice > maxAllowedPrice) {
        throw new Error(
          `Price cannot exceed 20% above original (max: ${maxAllowedPrice.toFixed(2)})`,
        );
      }

      // Calculate fee
      const fee = askingPrice * FEES.RESALE_SELLER;
      const netToSeller = askingPrice - fee;

      // Create resale listing
      const resaleRef = db.collection('resale').doc();
      const resaleData = {
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
        createdAt: new Date(),
        buyerId: null,
      };

      // Both writes inside the transaction
      transaction.set(resaleRef, resaleData);
      transaction.update(ticketRef, { status: 'resale-listed' });

      return { resaleId: resaleRef.id, fee, netToSeller };
    });

    return res.status(200).json(result);
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Failed to list for resale';
    return res.status(400).json({ error: message });
  }
}
