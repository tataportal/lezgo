import {
  collection,
  doc,
  getDoc,
  getDocs,
  query,
  where,
  orderBy,
  limit,
  addDoc,
  updateDoc,
  runTransaction,
} from 'firebase/firestore';
import { db } from '../firebase';
import type {
  Resale,
  ListForResaleInput,
  PurchaseResaleInput,
  Ticket,
} from '../lib/types';

const RESALE_COLLECTION = 'resale';
const TICKETS_COLLECTION = 'tickets';

const RESALE_FEE_PERCENTAGE = 0.1; // 10% fee

/**
 * List a ticket for resale
 */
export async function listForResale(
  ticketId: string,
  input: ListForResaleInput,
  sellerId: string
): Promise<string> {
  // Get ticket details
  const ticketRef = doc(db, TICKETS_COLLECTION, ticketId);
  const ticketSnap = await getDoc(ticketRef);

  if (!ticketSnap.exists()) {
    throw new Error(`Ticket ${ticketId} not found`);
  }

  const ticket = ticketSnap.data() as Ticket;

  // Guard against missing ticket data
  if (!ticket?.eventId || !ticket?.ticketName) {
    throw new Error(`Ticket ${ticketId} is missing required data`);
  }

  // Validate asking price
  if (!input.askingPrice || input.askingPrice <= 0) {
    throw new Error('Asking price must be greater than 0');
  }

  // Calculate fee
  const fee = input.askingPrice * RESALE_FEE_PERCENTAGE;
  const netToSeller = input.askingPrice - fee;

  // Create resale listing
  const resaleData = {
    ticketId,
    eventId: ticket.eventId ?? '',
    eventName: ticket.eventName ?? '',
    eventDate: ticket.eventDate ?? null,
    eventDateLabel: ticket.eventDateLabel ?? '',
    eventVenue: ticket.eventVenue ?? '',
    ticketTier: ticket.ticketName ?? '',
    originalPrice: ticket.originalPrice ?? 0,
    askingPrice: input.askingPrice,
    sellerId,
    sellerName: ticket.userName ?? '',
    sellerEmail: ticket.userEmail ?? '',
    image: input.image || '',
    status: 'listed' as const,
    fee,
    netToSeller,
    createdAt: new Date(),
    buyerId: null,
  };

  const docRef = await addDoc(collection(db, RESALE_COLLECTION), resaleData);

  // Update ticket status to resale-listed
  await updateDoc(ticketRef, { status: 'resale-listed' });

  return docRef.id;
}

/**
 * Get all active resale listings
 */
export async function getResaleListings(
  filters?: {
    eventId?: string;
    status?: 'listed' | 'sold';
    limit?: number;
  }
): Promise<Resale[]> {
  const constraints = [];

  if (filters?.status) {
    constraints.push(where('status', '==', filters.status));
  } else {
    constraints.push(where('status', '==', 'listed'));
  }

  if (filters?.eventId) {
    constraints.push(where('eventId', '==', filters.eventId));
  }

  constraints.push(orderBy('createdAt', 'desc'));

  if (filters?.limit) {
    constraints.push(limit(filters.limit));
  }

  const q = query(collection(db, RESALE_COLLECTION), ...constraints);
  const querySnapshot = await getDocs(q);

  return querySnapshot.docs.map((doc) => ({
    id: doc.id,
    ...doc.data(),
  } as Resale));
}

/**
 * Get resale listing by ID
 */
export async function getResaleById(resaleId: string): Promise<Resale | null> {
  const docRef = doc(db, RESALE_COLLECTION, resaleId);
  const docSnap = await getDoc(docRef);

  if (!docSnap.exists()) {
    return null;
  }

  return {
    id: docSnap.id,
    ...docSnap.data(),
  } as Resale;
}

/**
 * Get resale listings by seller
 */
export async function getResaleListingsBySeller(
  sellerId: string
): Promise<Resale[]> {
  const q = query(
    collection(db, RESALE_COLLECTION),
    where('sellerId', '==', sellerId),
    orderBy('createdAt', 'desc')
  );

  const querySnapshot = await getDocs(q);

  return querySnapshot.docs.map((doc) => ({
    id: doc.id,
    ...doc.data(),
  } as Resale));
}

/**
 * Get resale listings for a specific event
 */
export async function getEventResaleListings(eventId: string): Promise<Resale[]> {
  const q = query(
    collection(db, RESALE_COLLECTION),
    where('eventId', '==', eventId),
    where('status', '==', 'listed'),
    orderBy('askingPrice', 'asc')
  );

  const querySnapshot = await getDocs(q);

  return querySnapshot.docs.map((doc) => ({
    id: doc.id,
    ...doc.data(),
  } as Resale));
}

/**
 * Purchase a resale ticket with transaction
 * Updates resale status to sold and transfers ticket ownership
 */
export async function purchaseResale(
  input: PurchaseResaleInput
): Promise<void> {
  await runTransaction(db, async (transaction) => {
    // Get resale listing
    const resaleRef = doc(db, RESALE_COLLECTION, input.resaleId);
    const resaleSnap = await transaction.get(resaleRef);

    if (!resaleSnap.exists()) {
      throw new Error(`Resale listing ${input.resaleId} not found`);
    }

    const resaleData = resaleSnap.data() as Resale;

    if (resaleData.status !== 'listed') {
      throw new Error('This ticket is no longer available');
    }

    // Get ticket
    const ticketRef = doc(db, TICKETS_COLLECTION, resaleData.ticketId);
    const ticketSnap = await transaction.get(ticketRef);

    if (!ticketSnap.exists()) {
      throw new Error(`Ticket ${resaleData.ticketId} not found`);
    }

    // Update resale listing
    transaction.update(resaleRef, {
      status: 'sold',
      buyerId: input.buyerId,
    });

    // Transfer ticket ownership
    transaction.update(ticketRef, {
      status: 'active',
      userId: input.buyerId,
      userEmail: input.buyerEmail,
      boughtInResale: true,
      purchasedAt: new Date(),
    });
  });
}

/**
 * Delist a resale ticket (seller cancels listing)
 */
export async function delistResale(
  resaleId: string,
  ticketId: string
): Promise<void> {
  const resaleRef = doc(db, RESALE_COLLECTION, resaleId);
  const ticketRef = doc(db, TICKETS_COLLECTION, ticketId);

  await updateDoc(resaleRef, { status: 'sold' });
  await updateDoc(ticketRef, { status: 'active' });
}

/**
 * Get resale statistics for an event
 */
export async function getResaleStats(eventId: string): Promise<{
  activeListings: number;
  averagePrice: number;
  minPrice: number;
  maxPrice: number;
}> {
  const listings = await getEventResaleListings(eventId);

  if (listings.length === 0) {
    return {
      activeListings: 0,
      averagePrice: 0,
      minPrice: 0,
      maxPrice: 0,
    };
  }

  const prices = listings
    .map((l) => l.askingPrice ?? 0)
    .filter((price) => price > 0);

  if (prices.length === 0) {
    return {
      activeListings: 0,
      averagePrice: 0,
      minPrice: 0,
      maxPrice: 0,
    };
  }

  const averagePrice = prices.reduce((a, b) => a + b, 0) / prices.length;
  const minPrice = Math.min(...prices);
  const maxPrice = Math.max(...prices);

  return {
    activeListings: listings.length,
    averagePrice,
    minPrice,
    maxPrice,
  };
}

/**
 * Search resale listings by event and price range
 */
export async function searchResaleListings(
  eventId: string,
  filters?: {
    maxPrice?: number;
    minPrice?: number;
  }
): Promise<Resale[]> {
  const listings = await getEventResaleListings(eventId);

  return listings.filter((listing) => {
    const askingPrice = listing.askingPrice ?? 0;
    if (filters?.maxPrice && askingPrice > filters.maxPrice) {
      return false;
    }
    if (filters?.minPrice && askingPrice < filters.minPrice) {
      return false;
    }
    return true;
  });
}
