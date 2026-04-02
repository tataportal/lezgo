import { verifyPromoter } from './_lib/auth.js';
import { getDoc, queryDocs, runTransaction } from './_lib/firestore-rest.js';
import { rateLimit, RATE_LIMITS } from './_lib/rate-limit.js';

import { json, errorResponse, type Env } from './_lib/types.js';

/**
 * POST /api/scanner-verify
 * Body: { eventId, dni }
 */
export const onRequestPost: PagesFunction<Env> = async (context) => {
  try {
    const user = await verifyPromoter(context.request, context.env);

    const rateLimited = rateLimit(user.uid, RATE_LIMITS.SCANNER);
    if (rateLimited) return rateLimited;

    const env = context.env;
    const { eventId, dni } = await context.request.json() as any;

    if (!eventId || !dni) {
      return errorResponse('Missing eventId or dni');
    }

    // Verify organizer owns this event
    const eventSnap = await getDoc(env, 'events', eventId);
    if (!eventSnap.exists) {
      return errorResponse('Event not found', 404);
    }

    const eventData = eventSnap.data()!;
    if (eventData.organizer !== user.uid) {
      return errorResponse('Not the organizer of this event', 403);
    }

    // Find ticket by DNI for this event
    const ticketsQuery = await queryDocs(env, 'tickets', [
      { field: 'eventId', op: 'EQUAL', value: eventId },
      { field: 'userDni', op: 'EQUAL', value: dni },
    ]);

    if (ticketsQuery.empty) {
      return json({ status: 'denied', message: 'No ticket found for this DNI' });
    }

    const matchingDoc = ticketsQuery.docs.find((doc) => {
      const data = doc.data();
      return data && (data.status === 'active' || data.status === 'used');
    });

    if (!matchingDoc) {
      return json({ status: 'denied', message: 'No active ticket found for this DNI' });
    }

    const matchingDocId = matchingDoc.id;

    const result = await runTransaction(env, async (tx) => {
      const ticketSnap = await tx.get('tickets', matchingDocId);

      if (!ticketSnap.exists) throw new Error('Ticket not found');

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

      tx.update('tickets', matchingDocId, {
        status: 'used',
        usedAt: new Date().toISOString(),
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

    return json(result);
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Verification failed';
    return errorResponse(message);
  }
};
