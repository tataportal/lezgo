import { apiFetch } from '../lib/api';
import type { CouponValidationResult } from '../lib/types';

/**
 * Validate a coupon code via server-side API.
 * Server checks active status, expiration, and usage limits.
 */
export async function validateCoupon(code: string): Promise<CouponValidationResult> {
  try {
    return await apiFetch<CouponValidationResult>('validate-coupon', {
      method: 'POST',
      body: { code },
    });
  } catch (error) {
    return {
      valid: false,
      error: error instanceof Error ? error.message : 'Validation failed',
    };
  }
}
