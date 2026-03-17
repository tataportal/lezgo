import { useEffect, useState, useCallback } from 'react';
import {
  getEvents,
  getEventById,
  getEventBySlug,
  getEventsByOrganizer,
  getFeaturedEvents,
  searchEvents,
} from '../services/eventService';
import type { Event, EventStatus } from '../lib/types';

interface UseEventsOptions {
  status?: EventStatus;
  genre?: string;
  featured?: boolean;
  limit?: number;
}

interface UseEventsReturn {
  events: Event[];
  loading: boolean;
  error: string | null;
  refetch: () => void;
}

/**
 * Hook to fetch all events with optional filters
 */
export function useEvents(options?: UseEventsOptions): UseEventsReturn {
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchEvents = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await getEvents(options);
      setEvents(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch events');
    } finally {
      setLoading(false);
    }
  }, [options?.status, options?.genre, options?.featured, options?.limit]);

  useEffect(() => {
    fetchEvents();
  }, [fetchEvents]);

  return {
    events,
    loading,
    error,
    refetch: fetchEvents,
  };
}

interface UseEventByIdReturn {
  event: Event | null;
  loading: boolean;
  error: string | null;
  refetch: () => void;
}

/**
 * Hook to fetch a single event by ID or slug.
 * First tries by Firestore document ID; if not found, tries by slug.
 */
export function useEventById(eventIdOrSlug: string): UseEventByIdReturn {
  const [event, setEvent] = useState<Event | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchEvent = useCallback(async () => {
    if (!eventIdOrSlug) {
      setEvent(null);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      // Try by document ID first
      let data = await getEventById(eventIdOrSlug);

      // If not found, try by slug
      if (!data) {
        data = await getEventBySlug(eventIdOrSlug);
      }

      setEvent(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch event');
    } finally {
      setLoading(false);
    }
  }, [eventIdOrSlug]);

  useEffect(() => {
    fetchEvent();
  }, [fetchEvent]);

  return {
    event,
    loading,
    error,
    refetch: fetchEvent,
  };
}

interface UseEventsByOrganizerReturn {
  events: Event[];
  loading: boolean;
  error: string | null;
  refetch: () => void;
}

/**
 * Hook to fetch events organized by a specific user
 */
export function useEventsByOrganizer(
  organizerId: string
): UseEventsByOrganizerReturn {
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchEvents = useCallback(async () => {
    if (!organizerId) {
      setEvents([]);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const data = await getEventsByOrganizer(organizerId);
      setEvents(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch events');
    } finally {
      setLoading(false);
    }
  }, [organizerId]);

  useEffect(() => {
    fetchEvents();
  }, [fetchEvents]);

  return {
    events,
    loading,
    error,
    refetch: fetchEvents,
  };
}

interface UseFeaturedEventsReturn {
  events: Event[];
  loading: boolean;
  error: string | null;
  refetch: () => void;
}

/**
 * Hook to fetch featured events
 */
export function useFeaturedEvents(limit?: number): UseFeaturedEventsReturn {
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchEvents = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await getFeaturedEvents(limit);
      setEvents(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch featured events');
    } finally {
      setLoading(false);
    }
  }, [limit]);

  useEffect(() => {
    fetchEvents();
  }, [fetchEvents]);

  return {
    events,
    loading,
    error,
    refetch: fetchEvents,
  };
}

interface UseSearchEventsReturn {
  events: Event[];
  loading: boolean;
  error: string | null;
  search: (query: string) => Promise<void>;
}

/**
 * Hook to search events by name or genre
 */
export function useSearchEvents(): UseSearchEventsReturn {
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const search = useCallback(async (query: string) => {
    if (!query.trim()) {
      setEvents([]);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const data = await searchEvents(query);
      setEvents(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to search events');
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    events,
    loading,
    error,
    search,
  };
}
