import type { VercelRequest, VercelResponse } from '@vercel/node';
import { verifyAuth } from './lib/auth';
import { getAdminDb } from './lib/firebase-admin';
import { rateLimit, RATE_LIMITS } from './lib/rate-limit';
import { cors } from './lib/cors';
import { FieldValue } from 'firebase-admin/firestore';

/**
 * POST /api/transfer-ticket
 * Body: { ticketId, recipientEmail }
 *
 * Transfers a ticket from the authenticated user to another user.
 * Server validates ownership and looks up recipient by email.
 */
export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (cors(req, res)) return;

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const user = await verifyAuth(req);

    // Rate limiting: 3 transfers per minute
    if (rateLimit(req, res, user.uid, RATE_LIMITS.TRANSFER)) return;
    const db = getAdminDb();
    const { ticketId, recipientEmail } = req.body;

    if (!ticketId || !recipientEmail) {
      return res.status(400).json({ error: 'Missing ticketId or recipientEmail' });
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(recipientEmail)) {
      return res.status(400).json({ error: 'Invalid recipient email' });
    }

    // Look up recipient by email (query, cannot be done inside transaction)
    const recipientSnap = await db
      .collection('users')
      .where('email', '==', recipientEmail)
      .limit(1)
      .get();

    if (recipientSnap.empty) {
      return res.status(404).json({ error: 'Recipient not found. They must have a Lezgo account.' });
    }

    const recipient = recipientSnap.docs[0];
    const recipientData = recipient.data();

    // Cannot transfer to yourself
    if (recipient.id === user.uid) {
      return res.status(400).json({ error: 'Cannot transfer ticket to yourself' });
    }

    // Run the read-validate-write flow inside a Firestore transaction
    await db.runTransaction(async (transaction) => {
      // Get the ticket inside the transaction
      const ticketRef = db.collection('tickets').doc(ticketId);
      const ticketSnap = await transaction.get(ticketRef);

      if (!ticketSnap.exists) {
        throw new Error('Ticket not found');
      }

      const ticket = ticketSnap.data()!;

      // Verify the authenticated user owns this ticket
      if (ticket.userId !== user.uid) {
        throw new Error('You do not own this ticket');
      }

      // Only active tickets can be transferred
      if (ticket.status !== 'active') {
        throw new Error('Only active tickets can be transferred');
      }

      // Transfer the ticket — set to 'active' so new owner can use/resell/re-transfer
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

    return res.status(200).json({ success: true });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Failed to transfer ticket';
    return res.status(400).json({ error: message });
  }
}
