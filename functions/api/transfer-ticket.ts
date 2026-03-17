import { verifyAuth } from './_lib/auth.js';
import { getAdminDb } from './_lib/firebase-admin.js';
import { rateLimit, RATE_LIMITS } from './_lib/rate-limit.js';
import { FieldValue } from 'firebase-admin/firestore';
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

    const db = getAdminDb(context.env);
    const { ticketId, recipientEmail } = await context.request.json() as any;

    if (!ticketId || !recipientEmail) {
      return errorResponse('Missing ticketId or recipientEmail');
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(recipientEmail)) {
      return errorResponse('Invalid recipient email');
    }

    // Look up recipient by email (query, cannot be done inside transaction)
    const recipientSnap = await db
      .collection('users')
      .where('email', '==', recipientEmail)
      .limit(1)
      .get();

    if (recipientSnap.empty) {
      return errorResponse('Recipient not found. They must have a Lezgo account.', 404);
    }

    const recipient = recipientSnap.docs[0];
    const recipientData = recipient.data();

    if (recipient.id === user.uid) {
      return errorResponse('Cannot transfer ticket to yourself');
    }

    await db.runTransaction(async (transaction) => {
      const ticketRef = db.collection('tickets').doc(ticketId);
      const ticketSnap = await transaction.get(ticketRef);

      if (!ticketSnap.exists) throw new Error('Ticket not found');

      const ticket = ticketSnap.data()!;

      if (ticket.userId !== user.uid) throw new Error('You do not own this ticket');
      if (ticket.status !== 'active') throw new Error('Only active tickets can be transferred');

      transaction.update(ticketRef, {
        status: 'active',
        userId: recipient.id,
        userEmail: recipientEmail,
        userName: recipientData.displayName || '',
        userDni: recipientData.dni || '',
        transferredAt: FieldValue.serverTimestamp(),
        transferredFrom: user.uid,
      });
    });

    return json({ success: true });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Failed to transfer ticket';
    return errorResponse(message);
  }
};
