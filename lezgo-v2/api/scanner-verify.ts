import type { VercelRequest, VercelResponse } from '@vercel/node';
import { verifyPromoter } from './lib/auth.js';
import { getAdminDb } from './lib/firebase-admin.js';
import { rateLimit, RATE_LIMITS } from './lib/rate-limit.js';
import { FieldValue } from 'firebase-admin/firestore';
import { cors } from './lib/cors.js';

/**
 * POST /api/scanner-verify
 * Body: { eventId, dni }
 *
 * Server-side verification: finds ticket by DNI for given event,
 * marks as used. Returns only minimal data (name, tier) — never exposes
 * the full ticket list to the client.
 */
export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (cors(req, res)) return;

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const user = await verifyPromoter(req);

    // Rate limiting: 20 scans per minute (fast scanning at gate)
    if (rateLimit(req, res, user.uid, RATE_LIMITS.SCANNER)) return;
    const db = getAdminDb();
    const { eventId, dni } = req.body;

    if (!eventId || !dni) {
      return res.status(400).json({ error: 'Missing eventId or dni' });
    }

    // Verify organizer owns this event
    const eventSnap = await db.collection('events').doc(eventId).get();
    if (!eventSnap.exists) {
      return res.status(404).json({ error: 'Event not found' });
    }

    const eventData = eventSnap.data()!;
    if (eventData.organizer !== user.uid) {
      return res.status(403).json({ error: 'Not the organizer of this event' });
    }

    // Find ticket by DNI for this event (query, cannot be directly inside a transaction)
    const ticketsQuery = await db
      .collection('tickets')
      .where('eventId', '==', eventId)
      .where('userDni', '==', dni)
      .get();

    if (ticketsQuery.empty) {
      return res.status(200).json({
        status: 'denied',
        message: 'No ticket found for this DNI',
      });
    }

    // Find the first active (non-transferred, non-resale) ticket
    const matchingDoc = ticketsQuery.docs.find((doc) => {
      const data = doc.data();
      return data.status === 'active' || data.status === 'used';
    });

    if (!matchingDoc) {
      return res.status(200).json({
        status: 'denied',
        message: 'No active ticket found for this DNI',
      });
    }

    // Use a transaction for the actual status update to prevent double-scan race conditions
    const result = await db.runTransaction(async (transaction) => {
      // Re-read the specific ticket doc inside the transaction
      const ticketSnap = await transaction.get(matchingDoc.ref);

      if (!ticketSnap.exists) {
        throw new Error('Ticket not found');
      }

      const ticket = ticketSnap.data()!;

      if (ticket.status === 'used') {
        return {
          status: 'already-used' as const,
          message: 'Ticket already used',
          data: {
            userName: ticket.userName,
            ticketName: ticket.ticketName,
            usedAt: ticket.usedAt,
          },
        };
      }

      if (ticket.status !== 'active') {
        return {
          status: 'denied' as const,
          message: 'Ticket is no longer active',
        };
      }

      // Mark as used atomically
      transaction.update(matchingDoc.ref, {
        status: 'used',
        usedAt: FieldValue.serverTimestamp(),
      });

      return {
        status: 'approved' as const,
        message: 'Access approved',
        data: {
          userName: ticket.userName,
          ticketName: ticket.ticketName,
          eventName: ticket.eventName,
        },
      };
    });

    return res.status(200).json(result);
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Verification failed';
    return res.status(400).json({ error: message });
  }
}
