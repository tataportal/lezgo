import {
  collection,
  doc,
  getDoc,
  getDocs,
  query,
  where,
  orderBy,
} from 'firebase/firestore/lite';
import { db } from '../firebase';
import { apiFetch } from '../lib/api';
import { getRecaptchaToken } from '../lib/recaptcha';
import type {
  Ticket,
  PurchaseResponse,
} from '../lib/types';

const TICKETS_COLLECTION = 'tickets';

/**
 * Get all tickets for a specific user.
 * Falls back to in-memory sort if composite index is missing.
 */
export async function getUserTickets(userId: string): Promise<Ticket[]> {
  try {
    const q = query(
      collection(db, TICKETS_COLLECTION),
      where('userId', '==', userId),
      orderBy('purchasedAt', 'desc')
    );
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() } as Ticket));
  } catch (err: any) {
    if (err?.code === 'failed-precondition' || err?.message?.includes('index')) {
      console.warn('Firestore index missing for getUserTickets, using fallback.');
      const fallbackQ = query(collection(db, TICKETS_COLLECTION), where('userId', '==', userId));
      const querySnapshot = await getDocs(fallbackQ);
      const results = querySnapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() } as Ticket));
      results.sort((a, b) => {
        const dateA = a.purchasedAt ? new Date(a.purchasedAt as any).getTime() : 0;
        const dateB = b.purchasedAt ? new Date(b.purchasedAt as any).getTime() : 0;
        return dateB - dateA;
      });
      return results;
    }
    throw err;
  }
}

/**
 * Get all tickets for a specific event.
 * Falls back to in-memory sort if composite index is missing.
 */
export async function getTicketsByEvent(eventId: string): Promise<Ticket[]> {
  try {
    const q = query(
      collection(db, TICKETS_COLLECTION),
      where('eventId', '==', eventId),
      orderBy('purchasedAt', 'desc')
    );
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() } as Ticket));
  } catch (err: any) {
    if (err?.code === 'failed-precondition' || err?.message?.includes('index')) {
      console.warn('Firestore index missing for getTicketsByEvent, using fallback.');
      const fallbackQ = query(collection(db, TICKETS_COLLECTION), where('eventId', '==', eventId));
      const querySnapshot = await getDocs(fallbackQ);
      const results = querySnapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() } as Ticket));
      results.sort((a, b) => {
        const dateA = a.purchasedAt ? new Date(a.purchasedAt as any).getTime() : 0;
        const dateB = b.purchasedAt ? new Date(b.purchasedAt as any).getTime() : 0;
        return dateB - dateA;
      });
      return results;
    }
    throw err;
  }
}

/**
 * Get a single ticket by ID
 */
export async function getTicketById(ticketId: string): Promise<Ticket | null> {
  const docRef = doc(db, TICKETS_COLLECTION, ticketId);
  const docSnap = await getDoc(docRef);

  if (!docSnap.exists()) {
    return null;
  }

  return {
    id: docSnap.id,
    ...docSnap.data(),
  } as Ticket;
}

/**
 * Get all active tickets for a user at a specific event.
 * Falls back to in-memory filtering if composite index is missing.
 */
export async function getUserEventTickets(
  userId: string,
  eventId: string
): Promise<Ticket[]> {
  try {
    const q = query(
      collection(db, TICKETS_COLLECTION),
      where('userId', '==', userId),
      where('eventId', '==', eventId),
      where('status', 'in', ['active', 'transferred'])
    );
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() } as Ticket));
  } catch (err: any) {
    if (err?.code === 'failed-precondition' || err?.message?.includes('index')) {
      console.warn('Firestore index missing for getUserEventTickets, using fallback.');
      const fallbackQ = query(collection(db, TICKETS_COLLECTION), where('userId', '==', userId));
      const querySnapshot = await getDocs(fallbackQ);
      return querySnapshot.docs
        .map((doc) => ({ id: doc.id, ...doc.data() } as Ticket))
        .filter((t) => t.eventId === eventId && ['active', 'transferred'].includes(t.status));
    }
    throw err;
  }
}

/**
 * Purchase tickets via server-side API.
 * Server validates inventory, prices, coupon, and user profile.
 * Client sends: eventId, quantities, optional couponCode, reCAPTCHA token.
 *
 * Security layers applied:
 * - Layer 1: Rate limiting (server-side)
 * - Layer 2: reCAPTCHA v3 token (client → server → Google)
 * - Layer 4: Device fingerprint (sent via apiFetch headers)
 * - Layer 5: Identity-based limits (server-side)
 */
export async function purchaseTickets(
  input: {
    eventId: string;
    quantities: { tierId: string; tierName: string; quantity: number }[];
    couponCode?: string;
  }
): Promise<PurchaseResponse> {
  // Layer 2: Get reCAPTCHA token (null if not configured)
  const recaptchaToken = await getRecaptchaToken('purchase');

  return apiFetch<PurchaseResponse>('purchase-tickets', {
    method: 'POST',
    body: {
      eventId: input.eventId,
      quantities: input.quantities,
      couponCode: input.couponCode,
      recaptchaToken,
    },
  });
}

/**
 * Transfer ticket to another user via server-side API.
 * Server validates ownership, looks up recipient, and performs the transfer.
 */
export async function transferTicket(
  ticketId: string,
  _toUserId: string,
  toEmail: string
): Promise<void> {
  await apiFetch('transfer-ticket', {
    method: 'POST',
    body: { ticketId, recipientEmail: toEmail },
  });
}

/**
 * Get user's active tickets (not used).
 * Falls back to in-memory filtering if composite index is missing.
 */
export async function getUserActiveTickets(userId: string): Promise<Ticket[]> {
  try {
    const q = query(
      collection(db, TICKETS_COLLECTION),
      where('userId', '==', userId),
      where('status', 'in', ['active', 'transferred']),
      orderBy('eventDate', 'asc')
    );
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() } as Ticket));
  } catch (err: any) {
    if (err?.code === 'failed-precondition' || err?.message?.includes('index')) {
      console.warn('Firestore index missing for getUserActiveTickets, using fallback.');
      const fallbackQ = query(collection(db, TICKETS_COLLECTION), where('userId', '==', userId));
      const querySnapshot = await getDocs(fallbackQ);
      const results = querySnapshot.docs
        .map((doc) => ({ id: doc.id, ...doc.data() } as Ticket))
        .filter((t) => ['active', 'transferred'].includes(t.status));
      results.sort((a, b) => {
        const dateA = a.eventDate ? new Date(a.eventDate as any).getTime() : 0;
        const dateB = b.eventDate ? new Date(b.eventDate as any).getTime() : 0;
        return dateA - dateB;
      });
      return results;
    }
    throw err;
  }
}

/**
 * Get used/past tickets for a user.
 * Falls back to in-memory filtering if composite index is missing.
 */
export async function getUserPastTickets(userId: string): Promise<Ticket[]> {
  try {
    const q = query(
      collection(db, TICKETS_COLLECTION),
      where('userId', '==', userId),
      where('status', '==', 'used'),
      orderBy('eventDate', 'desc')
    );
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() } as Ticket));
  } catch (err: any) {
    if (err?.code === 'failed-precondition' || err?.message?.includes('index')) {
      console.warn('Firestore index missing for getUserPastTickets, using fallback.');
      const fallbackQ = query(collection(db, TICKETS_COLLECTION), where('userId', '==', userId));
      const querySnapshot = await getDocs(fallbackQ);
      const results = querySnapshot.docs
        .map((doc) => ({ id: doc.id, ...doc.data() } as Ticket))
        .filter((t) => t.status === 'used');
      results.sort((a, b) => {
        const dateA = a.eventDate ? new Date(a.eventDate as any).getTime() : 0;
        const dateB = b.eventDate ? new Date(b.eventDate as any).getTime() : 0;
        return dateB - dateA;
      });
      return results;
    }
    throw err;
  }
}
