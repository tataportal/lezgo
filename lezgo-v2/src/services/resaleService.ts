import {
  collection,
  doc,
  getDoc,
  getDocs,
  query,
  where,
  orderBy,
  limit,
} from 'firebase/firestore/lite';
import { db } from '../firebase';
import { apiFetch } from '../lib/api';
import type {
  Resale,
  ListForResaleInput,
  PurchaseResaleInput,
} from '../lib/types';

const RESALE_COLLECTION = 'resale';

/**
 * List a ticket for resale via server-side API.
 * Server validates ownership and calculates fees.
 */
export async function listForResale(
  ticketId: string,
  input: ListForResaleInput,
  _sellerId: string
): Promise<string> {
  const result = await apiFetch<{ resaleId: string }>('resale-list', {
    method: 'POST',
    body: {
      ticketId,
      askingPrice: input.askingPrice,
      image: input.image || '',
    },
  });
  return result.resaleId;
}

/**
 * Get all active resale listings.
 * Falls back to in-memory filtering if composite index is missing.
 */
export async function getResaleListings(
  filters?: {
    eventId?: string;
    status?: 'listed' | 'sold';
    limit?: number;
  }
): Promise<Resale[]> {
  const targetStatus = filters?.status || 'listed';

  try {
    const constraints = [];
    constraints.push(where('status', '==', targetStatus));
    if (filters?.eventId) {
      constraints.push(where('eventId', '==', filters.eventId));
    }
    constraints.push(orderBy('createdAt', 'desc'));
    if (filters?.limit) {
      constraints.push(limit(filters.limit));
    }

    const q = query(collection(db, RESALE_COLLECTION), ...constraints);
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() } as Resale));
  } catch (err: any) {
    if (err?.code === 'failed-precondition' || err?.message?.includes('index')) {
      console.warn('Firestore index missing for resale query, using fallback.');
      const fallbackQ = query(collection(db, RESALE_COLLECTION));
      const querySnapshot = await getDocs(fallbackQ);
      let results = querySnapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() } as Resale));

      results = results.filter((r) => r.status === targetStatus);
      if (filters?.eventId) {
        results = results.filter((r) => r.eventId === filters.eventId);
      }
      results.sort((a, b) => {
        const dateA = a.createdAt ? new Date(a.createdAt as any).getTime() : 0;
        const dateB = b.createdAt ? new Date(b.createdAt as any).getTime() : 0;
        return dateB - dateA;
      });
      if (filters?.limit) results = results.slice(0, filters.limit);
      return results;
    }
    throw err;
  }
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
 * Get resale listings by seller.
 * Falls back to in-memory filtering if composite index is missing.
 */
export async function getResaleListingsBySeller(
  sellerId: string
): Promise<Resale[]> {
  try {
    const q = query(
      collection(db, RESALE_COLLECTION),
      where('sellerId', '==', sellerId),
      orderBy('createdAt', 'desc')
    );
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() } as Resale));
  } catch (err: any) {
    if (err?.code === 'failed-precondition' || err?.message?.includes('index')) {
      console.warn('Firestore index missing for seller resale query, using fallback.');
      const fallbackQ = query(collection(db, RESALE_COLLECTION), where('sellerId', '==', sellerId));
      const querySnapshot = await getDocs(fallbackQ);
      const results = querySnapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() } as Resale));
      results.sort((a, b) => {
        const dateA = a.createdAt ? new Date(a.createdAt as any).getTime() : 0;
        const dateB = b.createdAt ? new Date(b.createdAt as any).getTime() : 0;
        return dateB - dateA;
      });
      return results;
    }
    throw err;
  }
}

/**
 * Get resale listings for a specific event.
 * Falls back to in-memory filtering if composite index is missing.
 */
export async function getEventResaleListings(eventId: string): Promise<Resale[]> {
  try {
    const q = query(
      collection(db, RESALE_COLLECTION),
      where('eventId', '==', eventId),
      where('status', '==', 'listed'),
      orderBy('askingPrice', 'asc')
    );
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() } as Resale));
  } catch (err: any) {
    if (err?.code === 'failed-precondition' || err?.message?.includes('index')) {
      console.warn('Firestore index missing for event resale query, using fallback.');
      const fallbackQ = query(collection(db, RESALE_COLLECTION));
      const querySnapshot = await getDocs(fallbackQ);
      let results = querySnapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() } as Resale));
      results = results.filter((r) => r.eventId === eventId && r.status === 'listed');
      results.sort((a, b) => (a.askingPrice ?? 0) - (b.askingPrice ?? 0));
      return results;
    }
    throw err;
  }
}

/**
 * Purchase a resale ticket via server-side API.
 * Server handles atomic transaction and ticket transfer.
 */
export async function purchaseResale(
  input: PurchaseResaleInput
): Promise<void> {
  await apiFetch('resale-purchase', {
    method: 'POST',
    body: { resaleId: input.resaleId },
  });
}

/**
 * Delist a resale ticket (seller cancels listing) via server-side API.
 * Server validates ownership and sets status to 'cancelled' (not 'sold').
 */
export async function delistResale(
  resaleId: string,
  _ticketId: string
): Promise<void> {
  await apiFetch('delist-resale', {
    method: 'POST',
    body: { resaleId },
  });
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
