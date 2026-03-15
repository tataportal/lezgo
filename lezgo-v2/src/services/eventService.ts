import {
  collection,
  doc,
  getDoc,
  getDocs,
  query,
  where,
  orderBy,
  limit,
  startAfter,
  QueryConstraint,
} from 'firebase/firestore/lite';
import { db } from '../firebase';
import { apiFetch } from '../lib/api';
import type { Event, CreateEventInput, EventStatus } from '../lib/types';

const EVENTS_COLLECTION = 'events';

/**
 * Get all events with optional filtering and pagination
 */
export async function getEvents(
  filters?: {
    status?: EventStatus;
    genre?: string;
    featured?: boolean;
    limit?: number;
    startAfterDoc?: any;
  }
): Promise<Event[]> {
  const constraints: QueryConstraint[] = [];

  if (filters?.status) {
    constraints.push(where('status', '==', filters.status));
  }

  if (filters?.genre) {
    constraints.push(where('genre', '==', filters.genre));
  }

  if (filters?.featured !== undefined) {
    constraints.push(where('featured', '==', filters.featured));
  }

  constraints.push(orderBy('date', 'desc'));

  if (filters?.limit) {
    constraints.push(limit(filters.limit));
  }

  if (filters?.startAfterDoc) {
    constraints.push(startAfter(filters.startAfterDoc));
  }

  const q = query(collection(db, EVENTS_COLLECTION), ...constraints);

  try {
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    } as Event));
  } catch (err: any) {
    // If composite index is missing, fallback to unordered query
    if (err?.code === 'failed-precondition' || err?.message?.includes('index')) {
      console.warn('Firestore index missing, falling back to simple query. Create the index for better performance.');
      const fallbackQ = query(collection(db, EVENTS_COLLECTION));
      const querySnapshot = await getDocs(fallbackQ);
      let events = querySnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      } as Event));

      // Apply filters in memory
      if (filters?.status) {
        events = events.filter((e) => e.status === filters.status);
      }
      if (filters?.genre) {
        events = events.filter((e) => e.genre === filters.genre);
      }
      if (filters?.featured !== undefined) {
        events = events.filter((e) => e.featured === filters.featured);
      }
      // Sort by date desc
      events.sort((a, b) => {
        const dateA = a.date ? new Date(a.date as any).getTime() : 0;
        const dateB = b.date ? new Date(b.date as any).getTime() : 0;
        return dateB - dateA;
      });
      if (filters?.limit) {
        events = events.slice(0, filters.limit);
      }
      return events;
    }
    throw err;
  }
}

/**
 * Get a single event by ID
 */
export async function getEventById(eventId: string): Promise<Event | null> {
  const docRef = doc(db, EVENTS_COLLECTION, eventId);
  const docSnap = await getDoc(docRef);

  if (!docSnap.exists()) {
    return null;
  }

  return {
    id: docSnap.id,
    ...docSnap.data(),
  } as Event;
}

/**
 * Get all events organized by a specific user
 */
export async function getEventsByOrganizer(organizerId: string): Promise<Event[]> {
  try {
    const q = query(
      collection(db, EVENTS_COLLECTION),
      where('organizer', '==', organizerId),
      orderBy('createdAt', 'desc')
    );
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    } as Event));
  } catch (err: any) {
    if (err?.code === 'failed-precondition' || err?.message?.includes('index')) {
      const fallbackQ = query(collection(db, EVENTS_COLLECTION), where('organizer', '==', organizerId));
      const querySnapshot = await getDocs(fallbackQ);
      return querySnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      } as Event));
    }
    throw err;
  }
}

/**
 * Get event by slug for URL-friendly routing
 */
export async function getEventBySlug(slug: string): Promise<Event | null> {
  const q = query(
    collection(db, EVENTS_COLLECTION),
    where('slug', '==', slug),
    limit(1)
  );

  const querySnapshot = await getDocs(q);

  if (querySnapshot.empty) {
    return null;
  }

  const doc = querySnapshot.docs[0];
  return {
    id: doc.id,
    ...doc.data(),
  } as Event;
}

/**
 * Create a new event via server-side API.
 * Server verifies promoter role and sanitizes data.
 */
export async function createEvent(
  eventData: CreateEventInput,
  _organizerId: string
): Promise<string> {
  const result = await apiFetch<{ eventId: string }>('create-event', {
    method: 'POST',
    body: eventData,
  });
  return result.eventId;
}

/**
 * Update an existing event via server-side API.
 * Server verifies ownership and whitelists fields.
 */
export async function updateEvent(
  eventId: string,
  updates: Partial<CreateEventInput>
): Promise<void> {
  await apiFetch('update-event', {
    method: 'PUT',
    body: { eventId, ...updates },
  });
}

/**
 * Update event status via server-side API.
 * Uses the update-event endpoint which verifies ownership.
 */
export async function updateEventStatus(
  eventId: string,
  status: EventStatus
): Promise<void> {
  await apiFetch('update-event', {
    method: 'PUT',
    body: { eventId, status },
  });
}

/**
 * Get trending/featured events
 */
export async function getFeaturedEvents(limitCount?: number): Promise<Event[]> {
  const constraints: QueryConstraint[] = [
    where('featured', '==', true),
    where('status', '==', 'published'),
    orderBy('date', 'asc'),
  ];

  if (limitCount) {
    constraints.push(limit(limitCount));
  }

  const q = query(collection(db, EVENTS_COLLECTION), ...constraints);

  try {
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    } as Event));
  } catch (err: any) {
    if (err?.code === 'failed-precondition' || err?.message?.includes('index')) {
      console.warn('Firestore index missing for featured events query, using fallback.');
      const fallbackQ = query(collection(db, EVENTS_COLLECTION));
      const querySnapshot = await getDocs(fallbackQ);
      let events = querySnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      } as Event));
      events = events.filter((e) => e.featured && e.status === 'published');
      events.sort((a, b) => {
        const dateA = a.date ? new Date(a.date as any).getTime() : 0;
        const dateB = b.date ? new Date(b.date as any).getTime() : 0;
        return dateA - dateB;
      });
      if (limitCount) events = events.slice(0, limitCount);
      return events;
    }
    throw err;
  }
}

/**
 * Search events by name or genre
 */
export async function searchEvents(searchTerm: string): Promise<Event[]> {
  let querySnapshot;
  try {
    const q = query(
      collection(db, EVENTS_COLLECTION),
      where('status', '==', 'published'),
      orderBy('date', 'desc')
    );
    querySnapshot = await getDocs(q);
  } catch (err: any) {
    if (err?.code === 'failed-precondition' || err?.message?.includes('index')) {
      const fallbackQ = query(collection(db, EVENTS_COLLECTION));
      querySnapshot = await getDocs(fallbackQ);
    } else {
      throw err;
    }
  }

  const events = querySnapshot.docs.map((doc) => ({
    id: doc.id,
    ...doc.data(),
  } as Event));

  const lowerSearchTerm = searchTerm.toLowerCase();

  return events.filter(
    (event) =>
      event.name?.toLowerCase().includes(lowerSearchTerm) ||
      event.genre?.toLowerCase().includes(lowerSearchTerm) ||
      (event.lineup || []).some((artist) => artist.toLowerCase().includes(lowerSearchTerm))
  );
}
