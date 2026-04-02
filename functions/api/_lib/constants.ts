/**
 * Server-side constants — mirrors src/lib/constants.ts
 */

export const DIRECT_FEE_BRACKETS = [
  { maxPrice: 50, buyerFlat: 2.9, buyerRate: 0.035, organizerRate: 0.04, tier: 'reinforced' },
  { maxPrice: 200, buyerFlat: 3.5, buyerRate: 0.0325, organizerRate: 0.0325, tier: 'standard' },
  { maxPrice: 500, buyerFlat: 4.5, buyerRate: 0.025, organizerRate: 0.0275, tier: 'preferred' },
  { maxPrice: Infinity, buyerFlat: 5.9, buyerRate: 0.02, organizerRate: 0.0225, tier: 'premium' },
] as const;

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

export const FEES = {
  RESALE_BUYER: 0.05,
  RESALE_SELLER: 0.10,
} as const;
