import { verifyAuth } from './_lib/auth.js';
import { queryDocs, runTransaction } from './_lib/firestore-rest.js';
import { rateLimit, RATE_LIMITS } from './_lib/rate-limit.js';

import { json, errorResponse, type Env } from './_lib/types.js';

/**
 * POST /api/transfer-ticket
 * Body: { ticketId, recipientEmail }
 */
export const onRequestPost: PagesFunction<Env> = async (context) => {
  try {
    const user = await verifyAuth(context.request, context.env);

    const rateLimited = rateLimit(user.uid, RATE_LIMITS.TRANSFER);
    if (rateLimited) return rateLimited;

    const env = context.env;
    const { ticketId, recipientEmail } = await context.request.json() as any;

    if (!ticketId || !recipientEmail) {
      return errorResponse('Missing ticketId or recipientEmail');
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(recipientEmail)) {
      return errorResponse('Invalid recipient email');
    }

    // Look up recipient by email (query, cannot be done inside transaction)
    const recipientSnap = await queryDocs(env, 'users', [
      { field: 'email', op: 'EQUAL', value: recipientEmail },
    ], 1);

    if (recipientSnap.empty) {
      return errorResponse('Recipient not found. They must have a Lezgo account.', 404);
    }

    const recipient = recipientSnap.docs[0];
    const recipientData = recipient.data()!;

    if (recipient.id === user.uid) {
      return errorResponse('Cannot transfer ticket to yourself');
    }

    if (!recipientData.dni) {
      return errorResponse('Recipient must complete identity verification before receiving tickets');
    }

    await runTransaction(env, async (tx) => {
      const ticketSnap = await tx.get('tickets', ticketId);

      if (!ticketSnap.exists) throw new Error('Ticket not found');

      const ticket = ticketSnap.data()!;

      if (ticket.userId !== user.uid) throw new Error('You do not own this ticket');
      if (ticket.status !== 'active') throw new Error('Only active tickets can be transferred');

      tx.update('tickets', ticketId, {
        status: 'active',
        userId: recipient.id,
        userEmail: recipientEmail,
        userName: recipientData.displayName || '',
        userDni: recipientData.dni || '',
        transferredAt: new Date().toISOString(),
        transferredFrom: user.uid,
      });
    });

    return json({ success: true });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Failed to transfer ticket';
    return errorResponse(message);
  }
};
