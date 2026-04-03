import { useEffect, useState } from 'react';
import { doc, getDoc } from 'firebase/firestore/lite';
import { db } from '../firebase';

const POLL_INTERVAL_MS = 24 * 60 * 60 * 1000; // 24 hours

/**
 * Reads aggregate counters from /publicStats/global — a single document
 * updated by the admin SDK on every purchase/resale.
 * Public read is allowed; no auth required.
 *
 * Document shape:
 *   { ticketCount: number, resaleCount: number }
 */
export function useLiveTicketCount() {
  const [ticketCount, setTicketCount] = useState<number | null>(null);
  const [resaleCount, setResaleCount] = useState<number | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function fetchCounts() {
      try {
        const snap = await getDoc(doc(db, 'publicStats', 'global'));
        if (!cancelled && snap.exists()) {
          const data = snap.data() as { ticketCount?: number; resaleCount?: number };
          if (typeof data.ticketCount === 'number') setTicketCount(data.ticketCount);
          if (typeof data.resaleCount === 'number') setResaleCount(data.resaleCount);
        }
      } catch {
        // silently ignore — deck is public, no auth required
      }
    }

    fetchCounts();
    const interval = setInterval(fetchCounts, POLL_INTERVAL_MS);
    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, []);

  return { ticketCount, resaleCount };
}
