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
