import { verifyPromoter } from './_lib/auth.js';
import { queryDocs } from './_lib/firestore-rest.js';
import { rateLimit, RATE_LIMITS } from './_lib/rate-limit.js';
import { json, errorResponse, type Env } from './_lib/types.js';

/**
 * POST /api/organizer-analytics
 * Body: { eventId?, timeRange?: '7d' | '30d' | 'all' }
 */
export const onRequestPost: PagesFunction<Env> = async (context) => {
  try {
    const user = await verifyPromoter(context.request, context.env);

    const rateLimited = rateLimit(user.uid, RATE_LIMITS.GENERAL);
    if (rateLimited) return rateLimited;

    const env = context.env;
    const { eventId, timeRange = '30d' } = await context.request.json() as any;

    const now = new Date();
    let sinceDate: Date | null = null;
    if (timeRange === '7d') sinceDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    else if (timeRange === '30d') sinceDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    const eventsSnap = await queryDocs(env, 'events', [
      { field: 'organizer', op: 'EQUAL', value: user.uid },
    ]);

    const eventIds = eventsSnap.docs.map((d) => d.id);
    const eventMap = new Map(eventsSnap.docs.map((d) => [d.id, d.data()!]));

    if (eventIds.length === 0) {
      return json(emptyAnalytics());
    }

    const targetEventIds = eventId ? [eventId] : eventIds;

    if (eventId && !eventIds.includes(eventId)) {
      return errorResponse('Event not found or not owned by you', 403);
    }

    // Fetch tickets — Firestore IN operator supports max 30 values
    const ticketBatches: any[] = [];
    for (let i = 0; i < targetEventIds.length; i += 30) {
      const batch = targetEventIds.slice(i, i + 30);
      const snap = await queryDocs(env, 'tickets', [
        { field: 'eventId', op: 'IN', value: batch },
      ]);
      ticketBatches.push(...snap.docs.map((d) => ({ id: d.id, ...d.data() })));
    }

    const tickets = ticketBatches;
    const guestlistBatches: any[] = [];
    for (let i = 0; i < targetEventIds.length; i += 30) {
      const batch = targetEventIds.slice(i, i + 30);
      const snap = await queryDocs(env, 'guestlists', [
        { field: 'eventId', op: 'IN', value: batch },
      ]);
      guestlistBatches.push(...snap.docs.map((d) => ({ id: d.id, ...d.data() })));
    }
    const guestlists = guestlistBatches;

    // Analytics calculations
    const salesByDay: Record<string, { count: number; revenue: number }> = {};
    const salesByHour: Record<number, number> = {};
    const salesByTier: Record<string, { count: number; revenue: number; tierName: string }> = {};
    const salesByEvent: Record<string, { count: number; revenue: number; eventName: string }> = {};
    let totalRevenue = 0;
    let totalBuyerFees = 0;
    let totalOrganizerFees = 0;
    let totalPlatformRevenue = 0;
    let totalNetToOrganizer = 0;
    let totalTickets = 0;
    let usedTickets = 0;
    let transferredTickets = 0;
    let resaleTickets = 0;
    let couponUsages = 0;
    let couponSavings = 0;
    let totalGuests = 0;
    let checkedInGuests = 0;

    for (const ticket of tickets) {
      const purchasedAt = ticket.purchasedAt;
      if (!purchasedAt) continue;

      const purchaseDate = new Date(purchasedAt);
      if (sinceDate && purchaseDate < sinceDate) continue;

      totalTickets++;
      const price = ticket.price ?? ticket.originalPrice ?? 0;
      totalRevenue += price;
      totalBuyerFees += ticket.buyerFee || 0;
      totalOrganizerFees += ticket.organizerFee || 0;
      totalPlatformRevenue += ticket.platformRevenue || ((ticket.buyerFee || 0) + (ticket.organizerFee || 0));
      totalNetToOrganizer += ticket.netToOrganizer || Math.max(price - (ticket.organizerFee || 0), 0);

      const dayKey = purchaseDate.toISOString().split('T')[0];
      if (!salesByDay[dayKey]) salesByDay[dayKey] = { count: 0, revenue: 0 };
      salesByDay[dayKey].count++;
      salesByDay[dayKey].revenue += price;

      const hour = purchaseDate.getHours();
      salesByHour[hour] = (salesByHour[hour] || 0) + 1;

      const tierId = ticket.ticketType || 'unknown';
      if (!salesByTier[tierId]) salesByTier[tierId] = { count: 0, revenue: 0, tierName: ticket.ticketName || tierId };
      salesByTier[tierId].count++;
      salesByTier[tierId].revenue += price;

      const evId = ticket.eventId || 'unknown';
      if (!salesByEvent[evId]) salesByEvent[evId] = { count: 0, revenue: 0, eventName: ticket.eventName || evId };
      salesByEvent[evId].count++;
      salesByEvent[evId].revenue += price;

      if (ticket.status === 'used') usedTickets++;
      if (ticket.status === 'transferred') transferredTickets++;
      if (ticket.status === 'resale-listed') resaleTickets++;

      if (ticket.couponCode) {
        couponUsages++;
        couponSavings += ticket.couponDiscount || 0;
      }
    }

    for (const guest of guestlists) {
      totalGuests++;
      if (guest.status === 'checked-in') checkedInGuests++;
    }

    // Consumer behavior
    const buyerPatterns: Record<string, { ticketCount: number; totalSpent: number; events: Set<string> }> = {};

    for (const ticket of tickets) {
      const purchasedAt = ticket.purchasedAt;
      if (!purchasedAt) continue;

      const purchaseDate = new Date(purchasedAt);
      if (sinceDate && purchaseDate < sinceDate) continue;

      const anonKey = `buyer_${hashCode(ticket.userId || 'anon')}`;
      if (!buyerPatterns[anonKey]) {
        buyerPatterns[anonKey] = { ticketCount: 0, totalSpent: 0, events: new Set() };
      }
      buyerPatterns[anonKey].ticketCount++;
      buyerPatterns[anonKey].totalSpent += ticket.originalPrice || 0;
      buyerPatterns[anonKey].events.add(ticket.eventId);
    }

    const segments = {
      singleEvent: 0,
      multiEvent: 0,
      highSpender: 0,
      groupBuyer: 0,
      total: Object.keys(buyerPatterns).length,
    };

    const allSpends = Object.values(buyerPatterns).map((b) => b.totalSpent);
    const medianSpend = allSpends.length > 0
      ? allSpends.sort((a, b) => a - b)[Math.floor(allSpends.length / 2)]
      : 0;

    for (const buyer of Object.values(buyerPatterns)) {
      if (buyer.events.size === 1) segments.singleEvent++;
      if (buyer.events.size >= 2) segments.multiEvent++;
      if (buyer.totalSpent > medianSpend && medianSpend > 0) segments.highSpender++;
      if (buyer.ticketCount >= 3) segments.groupBuyer++;
    }

    const peakHours = Object.entries(salesByHour)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 5)
      .map(([hour, count]) => ({ hour: Number(hour), count, label: `${hour}:00` }));

    const totalCapacity = targetEventIds.reduce((sum, id) => {
      const ev = eventMap.get(id);
      if (!ev) return sum;
      return sum + (ev.tiers || []).reduce((s: number, t: any) => s + (t.capacity || 0), 0);
    }, 0);

    const fillRate = totalCapacity > 0 ? (totalTickets / totalCapacity) * 100 : 0;
    const checkInRate = totalTickets > 0 ? (usedTickets / totalTickets) * 100 : 0;
    const transferRate = totalTickets > 0 ? (transferredTickets / totalTickets) * 100 : 0;

    const dailySales = Object.entries(salesByDay)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([date, data]) => ({ date, count: data.count, revenue: data.revenue }));

    return json({
      overview: {
        totalTickets,
        totalRevenue,
        totalBuyerFees: Math.round(totalBuyerFees * 100) / 100,
        totalOrganizerFees: Math.round(totalOrganizerFees * 100) / 100,
        totalPlatformRevenue: Math.round(totalPlatformRevenue * 100) / 100,
        totalNetToOrganizer: Math.round(totalNetToOrganizer * 100) / 100,
        totalEvents: targetEventIds.length,
        totalCapacity,
        fillRate: Math.round(fillRate * 10) / 10,
        checkInRate: Math.round(checkInRate * 10) / 10,
        transferRate: Math.round(transferRate * 10) / 10,
        usedTickets,
        transferredTickets,
        resaleTickets,
        uniqueBuyers: segments.total,
        avgTicketsPerBuyer: segments.total > 0
          ? Math.round((totalTickets / segments.total) * 10) / 10
          : 0,
        avgRevPerBuyer: segments.total > 0
          ? Math.round((totalRevenue / segments.total) * 100) / 100
          : 0,
      },
      salesTimeline: dailySales,
      peakHours,
      tierBreakdown: Object.values(salesByTier),
      eventBreakdown: Object.values(salesByEvent),
      coupons: {
        totalUsages: couponUsages,
        totalSavings: couponSavings,
        conversionLift: totalTickets > 0
          ? Math.round((couponUsages / totalTickets) * 1000) / 10
          : 0,
      },
      guestlist: {
        totalGuests,
        checkedIn: checkedInGuests,
        pending: Math.max(totalGuests - checkedInGuests, 0),
      },
      consumerBehavior: {
        segments,
        medianSpend,
        avgSpend: segments.total > 0 ? Math.round((totalRevenue / segments.total) * 100) / 100 : 0,
        repeatRate: segments.total > 0
          ? Math.round((segments.multiEvent / segments.total) * 1000) / 10
          : 0,
        groupBuyRate: segments.total > 0
          ? Math.round((segments.groupBuyer / segments.total) * 1000) / 10
          : 0,
      },
      timeRange,
      generatedAt: new Date().toISOString(),
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Analytics failed';
    return errorResponse(message);
  }
};

function emptyAnalytics() {
  return {
    overview: {
      totalTickets: 0, totalRevenue: 0, totalEvents: 0, totalCapacity: 0,
      totalBuyerFees: 0, totalOrganizerFees: 0, totalPlatformRevenue: 0, totalNetToOrganizer: 0,
      fillRate: 0, checkInRate: 0, transferRate: 0, usedTickets: 0,
      transferredTickets: 0, resaleTickets: 0, uniqueBuyers: 0,
      avgTicketsPerBuyer: 0, avgRevPerBuyer: 0,
    },
    salesTimeline: [],
    peakHours: [],
    tierBreakdown: [],
    eventBreakdown: [],
    coupons: { totalUsages: 0, totalSavings: 0, conversionLift: 0 },
    guestlist: { totalGuests: 0, checkedIn: 0, pending: 0 },
    consumerBehavior: {
      segments: { singleEvent: 0, multiEvent: 0, highSpender: 0, groupBuyer: 0, total: 0 },
      medianSpend: 0, avgSpend: 0, repeatRate: 0, groupBuyRate: 0,
    },
    timeRange: '30d',
    generatedAt: new Date().toISOString(),
  };
}

function hashCode(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  return Math.abs(hash);
}
