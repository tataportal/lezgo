import { useEffect, useState, useCallback } from 'react';
import {
  getUserTickets,
  getTicketsByEvent,
  getUserEventTickets,
  getUserActiveTickets,
  getUserPastTickets,
  purchaseTickets,
  updateTicketStatus,
  markTicketAsUsed,
  transferTicket,
} from '../services/ticketService';
import type { Ticket, PurchaseTicketInput, TicketStatus, PurchaseResponse } from '../lib/types';

interface UseUserTicketsReturn {
  tickets: Ticket[];
  loading: boolean;
  error: string | null;
  refetch: () => void;
}

/**
 * Hook to fetch all tickets for the current user
 */
export function useUserTickets(userId: string): UseUserTicketsReturn {
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchTickets = useCallback(async () => {
    if (!userId) {
      setTickets([]);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const data = await getUserTickets(userId);
      setTickets(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch tickets');
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    fetchTickets();
  }, [fetchTickets]);

  return {
    tickets,
    loading,
    error,
    refetch: fetchTickets,
  };
}

interface UseEventTicketsReturn {
  tickets: Ticket[];
  loading: boolean;
  error: string | null;
  refetch: () => void;
}

/**
 * Hook to fetch all tickets for a specific event
 */
export function useEventTickets(eventId: string): UseEventTicketsReturn {
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchTickets = useCallback(async () => {
    if (!eventId) {
      setTickets([]);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const data = await getTicketsByEvent(eventId);
      setTickets(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch tickets');
    } finally {
      setLoading(false);
    }
  }, [eventId]);

  useEffect(() => {
    fetchTickets();
  }, [fetchTickets]);

  return {
    tickets,
    loading,
    error,
    refetch: fetchTickets,
  };
}

interface UseUserActiveTicketsReturn {
  tickets: Ticket[];
  loading: boolean;
  error: string | null;
  refetch: () => void;
}

/**
 * Hook to fetch user's active (unused) tickets
 */
export function useUserActiveTickets(userId: string): UseUserActiveTicketsReturn {
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchTickets = useCallback(async () => {
    if (!userId) {
      setTickets([]);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const data = await getUserActiveTickets(userId);
      setTickets(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch active tickets');
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    fetchTickets();
  }, [fetchTickets]);

  return {
    tickets,
    loading,
    error,
    refetch: fetchTickets,
  };
}

interface UseUserPastTicketsReturn {
  tickets: Ticket[];
  loading: boolean;
  error: string | null;
  refetch: () => void;
}

/**
 * Hook to fetch user's past (used) tickets
 */
export function useUserPastTickets(userId: string): UseUserPastTicketsReturn {
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchTickets = useCallback(async () => {
    if (!userId) {
      setTickets([]);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const data = await getUserPastTickets(userId);
      setTickets(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch past tickets');
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    fetchTickets();
  }, [fetchTickets]);

  return {
    tickets,
    loading,
    error,
    refetch: fetchTickets,
  };
}

interface UseUserEventTicketsReturn {
  tickets: Ticket[];
  loading: boolean;
  error: string | null;
  refetch: () => void;
}

/**
 * Hook to fetch user's tickets for a specific event
 */
export function useUserEventTickets(
  userId: string,
  eventId: string
): UseUserEventTicketsReturn {
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchTickets = useCallback(async () => {
    if (!userId || !eventId) {
      setTickets([]);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const data = await getUserEventTickets(userId, eventId);
      setTickets(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch event tickets');
    } finally {
      setLoading(false);
    }
  }, [userId, eventId]);

  useEffect(() => {
    fetchTickets();
  }, [fetchTickets]);

  return {
    tickets,
    loading,
    error,
    refetch: fetchTickets,
  };
}

interface UsePurchaseTicketsReturn {
  purchasing: boolean;
  error: string | null;
  purchaseTickets: (input: PurchaseTicketInput) => Promise<PurchaseResponse | null>;
}

/**
 * Hook to handle ticket purchases
 */
export function usePurchaseTickets(): UsePurchaseTicketsReturn {
  const [purchasing, setPurchasing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handlePurchase = useCallback(
    async (input: PurchaseTicketInput): Promise<PurchaseResponse | null> => {
      try {
        setPurchasing(true);
        setError(null);
        const result = await purchaseTickets(input);
        return result;
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : 'Failed to purchase tickets';
        setError(errorMessage);
        return null;
      } finally {
        setPurchasing(false);
      }
    },
    []
  );

  return {
    purchasing,
    error,
    purchaseTickets: handlePurchase,
  };
}

interface UseMarkTicketAsUsedReturn {
  marking: boolean;
  error: string | null;
  markAsUsed: (ticketId: string) => Promise<boolean>;
}

/**
 * Hook to mark a ticket as used (scanned at event)
 */
export function useMarkTicketAsUsed(): UseMarkTicketAsUsedReturn {
  const [marking, setMarking] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleMarkAsUsed = useCallback(async (ticketId: string): Promise<boolean> => {
    try {
      setMarking(true);
      setError(null);
      await markTicketAsUsed(ticketId);
      return true;
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : 'Failed to mark ticket as used';
      setError(errorMessage);
      return false;
    } finally {
      setMarking(false);
    }
  }, []);

  return {
    marking,
    error,
    markAsUsed: handleMarkAsUsed,
  };
}

interface UseTransferTicketReturn {
  transferring: boolean;
  error: string | null;
  transferTicket: (
    ticketId: string,
    toUserId: string,
    toEmail: string
  ) => Promise<boolean>;
}

/**
 * Hook to transfer a ticket to another user
 */
export function useTransferTicket(): UseTransferTicketReturn {
  const [transferring, setTransferring] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleTransfer = useCallback(
    async (ticketId: string, toUserId: string, toEmail: string): Promise<boolean> => {
      try {
        setTransferring(true);
        setError(null);
        await transferTicket(ticketId, toUserId, toEmail);
        return true;
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : 'Failed to transfer ticket';
        setError(errorMessage);
        return false;
      } finally {
        setTransferring(false);
      }
    },
    []
  );

  return {
    transferring,
    error,
    transferTicket: handleTransfer,
  };
}

interface UseUpdateTicketStatusReturn {
  updating: boolean;
  error: string | null;
  updateStatus: (ticketId: string, status: TicketStatus) => Promise<boolean>;
}

/**
 * Hook to update ticket status
 */
export function useUpdateTicketStatus(): UseUpdateTicketStatusReturn {
  const [updating, setUpdating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleUpdateStatus = useCallback(
    async (ticketId: string, status: TicketStatus): Promise<boolean> => {
      try {
        setUpdating(true);
        setError(null);
        await updateTicketStatus(ticketId, status);
        return true;
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : 'Failed to update ticket status';
        setError(errorMessage);
        return false;
      } finally {
        setUpdating(false);
      }
    },
    []
  );

  return {
    updating,
    error,
    updateStatus: handleUpdateStatus,
  };
}
