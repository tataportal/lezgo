import {
  doc,
  getDoc,
  collection,
  getDocs,
  query,
  where,
  updateDoc,
  increment,
  Timestamp,
} from 'firebase/firestore';
import { db } from '../firebase';
import type { Coupon, CouponValidationResult } from '../lib/types';

const COUPONS_COLLECTION = 'coupons';

/**
 * Validate a coupon code
 * Returns validation result with discount if valid
 */
export async function validateCoupon(code: string): Promise<CouponValidationResult> {
  try {
    const couponRef = doc(db, COUPONS_COLLECTION, code);
    const couponSnap = await getDoc(couponRef);

    if (!couponSnap.exists()) {
      return {
        valid: false,
        error: 'Coupon code not found',
      };
    }

    const couponData = couponSnap.data() as Coupon;

    // Check if coupon is active
    if (!couponData?.active) {
      return {
        valid: false,
        error: 'Coupon is not active',
      };
    }

    // Check expiration date
    const expiresAt = couponData?.expiresAt;
    const now = new Date();
    const expiresAtDate = expiresAt instanceof Timestamp ? expiresAt.toDate() : expiresAt;

    if (expiresAtDate && expiresAtDate < now) {
      return {
        valid: false,
        error: 'Coupon has expired',
      };
    }

    // Check usage limit
    const usedCount = couponData?.usedCount ?? 0;
    const maxUses = couponData?.maxUses ?? 0;
    if (usedCount >= maxUses) {
      return {
        valid: false,
        error: 'Coupon usage limit reached',
      };
    }

    return {
      valid: true,
      discount: couponData?.discount ?? 0,
    };
  } catch (error) {
    return {
      valid: false,
      error: `Error validating coupon: ${error instanceof Error ? error.message : 'Unknown error'}`,
    };
  }
}

/**
 * Get a coupon by code
 */
export async function getCoupon(code: string): Promise<Coupon | null> {
  try {
    const couponRef = doc(db, COUPONS_COLLECTION, code);
    const couponSnap = await getDoc(couponRef);

    if (!couponSnap.exists()) {
      return null;
    }

    return {
      code: couponSnap.id,
      ...couponSnap.data(),
    } as Coupon;
  } catch (error) {
    console.error('Error getting coupon:', error);
    return null;
  }
}

/**
 * Create a new coupon
 */
export async function createCoupon(
  code: string,
  discount: number,
  expiresAt: Timestamp,
  maxUses: number
): Promise<string> {
  try {
    // Check if coupon already exists
    const existingCoupon = await getCoupon(code);
    if (existingCoupon) {
      throw new Error('Coupon code already exists');
    }

    // Validate discount (0-1 float)
    if (discount < 0 || discount > 1) {
      throw new Error('Discount must be between 0 and 1');
    }

    const couponRef = doc(db, COUPONS_COLLECTION, code);
    const couponData = {
      code,
      discount,
      active: true,
      expiresAt,
      maxUses,
      usedCount: 0,
    };

    // Use setDoc to create with custom ID
    const { setDoc } = await import('firebase/firestore');
    await setDoc(couponRef, couponData);

    return code;
  } catch (error) {
    throw new Error(
      `Error creating coupon: ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }
}

/**
 * Update coupon status
 */
export async function updateCouponStatus(
  code: string,
  active: boolean
): Promise<void> {
  try {
    const couponRef = doc(db, COUPONS_COLLECTION, code);
    await updateDoc(couponRef, { active });
  } catch (error) {
    throw new Error(
      `Error updating coupon: ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }
}

/**
 * Update coupon usage count
 */
export async function incrementCouponUsage(code: string): Promise<void> {
  try {
    const couponRef = doc(db, COUPONS_COLLECTION, code);
    await updateDoc(couponRef, { usedCount: increment(1) });
  } catch (error) {
    throw new Error(
      `Error updating coupon usage: ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }
}

/**
 * Get all active coupons
 */
export async function getActiveCoupons(): Promise<Coupon[]> {
  try {
    const q = query(
      collection(db, COUPONS_COLLECTION),
      where('active', '==', true)
    );

    const querySnapshot = await getDocs(q);

    return querySnapshot.docs.map((doc) => ({
      code: doc.id,
      ...doc.data(),
    } as Coupon));
  } catch (error) {
    console.error('Error getting active coupons:', error);
    return [];
  }
}

/**
 * Calculate discount amount based on coupon
 */
export function calculateDiscount(
  originalPrice: number,
  discount: number
): number {
  return originalPrice * discount;
}

/**
 * Get coupon usage statistics
 */
export async function getCouponStats(code: string): Promise<{
  code: string;
  usedCount: number;
  maxUses: number;
  remaining: number;
  usagePercentage: number;
} | null> {
  try {
    const coupon = await getCoupon(code);

    if (!coupon) {
      return null;
    }

    const maxUses = coupon.maxUses ?? 1;
    const usedCount = coupon.usedCount ?? 0;
    const remaining = maxUses - usedCount;
    const usagePercentage = maxUses > 0 ? (usedCount / maxUses) * 100 : 0;

    return {
      code: coupon.code ?? '',
      usedCount,
      maxUses,
      remaining,
      usagePercentage,
    };
  } catch (error) {
    console.error('Error getting coupon stats:', error);
    return null;
  }
}

/**
 * Check if coupon is nearly exhausted (>80% usage)
 */
export async function isCouponNearlyExhausted(code: string): Promise<boolean> {
  try {
    const stats = await getCouponStats(code);

    if (!stats) {
      return false;
    }

    return stats.usagePercentage > 80;
  } catch (error) {
    console.error('Error checking coupon status:', error);
    return false;
  }
}
