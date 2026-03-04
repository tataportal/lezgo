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
  addDoc,
  updateDoc,
} from 'firebase/firestore';
import { db } from '../firebase';
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
  const querySnapshot = await getDocs(q);

  return querySnapshot.docs.map((doc) => ({
    id: doc.id,
    ...doc.data(),
  } as Event));
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
 * Create a new event
 */
export async function createEvent(
  eventData: CreateEventInput,
  organizerId: string
): Promise<string> {
  const docRef = await addDoc(collection(db, EVENTS_COLLECTION), {
    ...eventData,
    organizer: organizerId,
    createdAt: new Date(),
  });

  return docRef.id;
}

/**
 * Update an existing event
 */
export async function updateEvent(
  eventId: string,
  updates: Partial<CreateEventInput>
): Promise<void> {
  const docRef = doc(db, EVENTS_COLLECTION, eventId);
  await updateDoc(docRef, updates);
}

/**
 * Update event status
 */
export async function updateEventStatus(
  eventId: string,
  status: EventStatus
): Promise<void> {
  const docRef = doc(db, EVENTS_COLLECTION, eventId);
  await updateDoc(docRef, { status });
}

/**
 * Update event tier sold count
 */
export async function updateEventTierSold(
  eventId: string,
  tierId: string,
  soldIncrement: number
): Promise<void> {
  const eventRef = doc(db, EVENTS_COLLECTION, eventId);
  const eventSnap = await getDoc(eventRef);

  if (!eventSnap.exists()) {
    throw new Error(`Event ${eventId} not found`);
  }

  const event = eventSnap.data() as Event;
  const updatedTiers = event.tiers.map((tier) => {
    if (tier.id === tierId) {
      return {
        ...tier,
        sold: tier.sold + soldIncrement,
      };
    }
    return tier;
  });

  await updateDoc(eventRef, { tiers: updatedTiers });
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
  const querySnapshot = await getDocs(q);

  return querySnapshot.docs.map((doc) => ({
    id: doc.id,
    ...doc.data(),
  } as Event));
}

/**
 * Search events by name or genre
 */
export async function searchEvents(searchTerm: string): Promise<Event[]> {
  const q = query(
    collection(db, EVENTS_COLLECTION),
    where('status', '==', 'published'),
    orderBy('date', 'desc')
  );

  const querySnapshot = await getDocs(q);

  const events = querySnapshot.docs.map((doc) => ({
    id: doc.id,
    ...doc.data(),
  } as Event));

  const lowerSearchTerm = searchTerm.toLowerCase();

  return events.filter(
    (event) =>
      event.name.toLowerCase().includes(lowerSearchTerm) ||
      event.genre.toLowerCase().includes(lowerSearchTerm) ||
      event.lineup.some((artist) => artist.toLowerCase().includes(lowerSearchTerm))
  );
}
