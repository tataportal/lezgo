/**
 * Shared constants — single source of truth for fees and validation rules
 */

// ── Fee structure ──
export const DIRECT_FEE_BRACKETS = [
  { maxPrice: 50, buyerFlat: 2.9, buyerRate: 0.035, organizerRate: 0.04, tier: 'reinforced' },
  { maxPrice: 200, buyerFlat: 3.5, buyerRate: 0.0325, organizerRate: 0.0325, tier: 'standard' },
  { maxPrice: 500, buyerFlat: 4.5, buyerRate: 0.025, organizerRate: 0.0275, tier: 'preferred' },
  { maxPrice: Infinity, buyerFlat: 5.9, buyerRate: 0.02, organizerRate: 0.0225, tier: 'premium' },
] as const;

export type DirectFeeTier = (typeof DIRECT_FEE_BRACKETS)[number]['tier'];

export function getDirectFeeBracket(ticketPrice: number) {
  return DIRECT_FEE_BRACKETS.find((bracket) => ticketPrice <= bracket.maxPrice) ?? DIRECT_FEE_BRACKETS[DIRECT_FEE_BRACKETS.length - 1];
}

export function calculateBuyerFee(ticketPrice: number): number {
  const bracket = getDirectFeeBracket(ticketPrice);
  return bracket.buyerFlat + ticketPrice * bracket.buyerRate;
}

export function calculateOrganizerFee(ticketPrice: number): number {
  const bracket = getDirectFeeBracket(ticketPrice);
  return ticketPrice * bracket.organizerRate;
}

export function calculateDirectFees(ticketPrice: number) {
  const bracket = getDirectFeeBracket(ticketPrice);
  const buyerFee = calculateBuyerFee(ticketPrice);
  const organizerFee = calculateOrganizerFee(ticketPrice);
  return {
    buyerFee,
    organizerFee,
    totalFee: buyerFee + organizerFee,
    buyerFlat: bracket.buyerFlat,
    buyerRate: bracket.buyerRate,
    organizerRate: bracket.organizerRate,
    feeTier: bracket.tier,
  };
}

export function calculateBuyerFeeForTickets(ticketPrices: number[]): number {
  return ticketPrices.reduce((sum, ticketPrice) => (
    ticketPrice > 0 ? sum + calculateBuyerFee(ticketPrice) : sum
  ), 0);
}

export function calculateOrganizerFeeForTickets(ticketPrices: number[]): number {
  return ticketPrices.reduce((sum, ticketPrice) => (
    ticketPrice > 0 ? sum + calculateOrganizerFee(ticketPrice) : sum
  ), 0);
}

export function estimateDirectFeesForRevenue(revenue: number, ticketsSold: number) {
  if (ticketsSold <= 0 || revenue <= 0) {
    return {
      buyerFees: 0,
      organizerFees: 0,
      totalFees: 0,
      netToOrganizer: revenue,
    };
  }

  const averageTicketPrice = revenue / ticketsSold;
  const { buyerFee, organizerFee } = calculateDirectFees(averageTicketPrice);
  const buyerFees = buyerFee * ticketsSold;
  const organizerFees = organizerFee * ticketsSold;

  return {
    buyerFees,
    organizerFees,
    totalFees: buyerFees + organizerFees,
    netToOrganizer: revenue - organizerFees,
  };
}

export const FEES = {
  RESALE_BUYER: 0.05,        // 5% fee charged to resale buyer
  RESALE_SELLER: 0.10,       // 10% fee charged to resale seller
} as const;

// ── ID document validation ──
export type IdType = 'dni' | 'ce' | 'pasaporte';

export const ID_CONFIG: Record<IdType, { maxLength: number; pattern: RegExp; digitsOnly: boolean }> = {
  dni: { maxLength: 8, pattern: /^\d{8}$/, digitsOnly: true },
  ce: { maxLength: 9, pattern: /^\d{9}$/, digitsOnly: true },
  pasaporte: { maxLength: 12, pattern: /^[a-zA-Z0-9]{5,12}$/, digitsOnly: false },
};

/** Sanitize ID input based on document type */
export function sanitizeIdInput(value: string, idType: IdType): string {
  const config = ID_CONFIG[idType];
  if (config.digitsOnly) {
    return value.replace(/\D/g, '').slice(0, config.maxLength);
  }
  return value.replace(/[^a-zA-Z0-9]/g, '').slice(0, config.maxLength);
}

/** Validate if an ID number is valid for its type */
export function isValidId(value: string, idType: IdType): boolean {
  return ID_CONFIG[idType].pattern.test(value);
}

// ── Badge system ──
// Two categories: "ticket status" (right) and "adjective" (left)

export type BadgeVariant = 'red' | 'green' | 'yellow' | 'acid';

/** Ticket-status badges — shown top-right of card */
export type TicketBadgeKey =
  | 'sold-out'
  | 'resale-available'
  | 'last-tickets'
  | 'presale'
  | 'free'
  | 'demo';

/** Adjective badges — shown top-left of card */
export type AdjectiveBadgeKey =
  | 'today'
  | 'tomorrow'
  | 'hot'
  | 'exclusive';

export interface BadgeDef {
  key: string;
  variant: BadgeVariant;
  priority: number; // lower = higher priority
}

/** Ticket-status badge definitions (priority order) */
export const TICKET_BADGES: Record<TicketBadgeKey, BadgeDef> = {
  'sold-out':         { key: 'sold-out',         variant: 'red',    priority: 1 },
  'resale-available': { key: 'resale-available',  variant: 'green',  priority: 2 },
  'last-tickets':     { key: 'last-tickets',      variant: 'yellow', priority: 3 },
  'presale':          { key: 'presale',            variant: 'yellow', priority: 4 },
  'free':             { key: 'free',               variant: 'green',  priority: 5 },
  'demo':             { key: 'demo',               variant: 'green',  priority: 6 },
} as const;

/** Adjective badge definitions (priority order) */
export const ADJECTIVE_BADGES: Record<AdjectiveBadgeKey, BadgeDef> = {
  'today':     { key: 'today',     variant: 'yellow', priority: 1 },
  'tomorrow':  { key: 'tomorrow',  variant: 'yellow', priority: 2 },
  'hot':       { key: 'hot',       variant: 'red',    priority: 3 },
  'exclusive': { key: 'exclusive', variant: 'acid',   priority: 4 },
} as const;

/** Threshold: % of capacity sold to show "last tickets" */
export const LAST_TICKETS_THRESHOLD = 0.85;
