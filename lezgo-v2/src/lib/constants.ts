/**
 * Shared constants — single source of truth for fees and validation rules
 */

// ── Fee structure ──
export const FEES = {
  DIRECT_TOTAL: 0.083,       // 8.3% total fee on direct ticket sales
  DIRECT_PLATFORM: 0.033,    // 3.3% platform fee
  DIRECT_VERIFY: 0.021,      // 2.1% identity verification fee
  DIRECT_PROCESSING: 0.029,  // 2.9% payment processing fee
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
  | 'free';

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
  'free':             { key: 'free',               variant: 'yellow', priority: 5 },
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
