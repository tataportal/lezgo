import { verifyAuth } from './_lib/auth.js';
import { getDoc } from './_lib/firestore-rest.js';
import { rateLimit, RATE_LIMITS } from './_lib/rate-limit.js';
import { json, errorResponse, type Env } from './_lib/types.js';

/**
 * POST /api/validate-coupon
 * Body: { code, eventId?, tierIds? }
 */
export const onRequestPost: PagesFunction<Env> = async (context) => {
  try {
    const user = await verifyAuth(context.request, context.env);

    const rateLimited = rateLimit(user.uid, RATE_LIMITS.COUPON_VALIDATE);
    if (rateLimited) return rateLimited;

    const env = context.env;
    const { code, eventId, tierIds } = await context.request.json() as any;

    if (!code) {
      return errorResponse('Missing coupon code');
    }

    const normalizedCode = String(code).trim().toUpperCase();
    const couponSnap = await getDoc(env, 'coupons', normalizedCode);

    if (!couponSnap.exists) {
      return json({ valid: false, error: 'Coupon not found' });
    }

    const coupon = couponSnap.data()!;

    if (!coupon.active) {
      return json({ valid: false, error: 'Coupon is not active' });
    }

    if ((coupon.usedCount ?? 0) >= (coupon.maxUses ?? 0)) {
      return json({ valid: false, error: 'Coupon usage limit reached' });
    }

    if (coupon.expiresAt && new Date(coupon.expiresAt) < new Date()) {
      return json({ valid: false, error: 'Coupon has expired' });
    }

    if (eventId && coupon.eventId && coupon.eventId !== eventId) {
      return json({ valid: false, error: 'Coupon not valid for this event' });
    }

    if (coupon.tierId) {
      const selectedTierIds = Array.isArray(tierIds) ? tierIds : [];
      if (selectedTierIds.length > 0 && !selectedTierIds.includes(coupon.tierId)) {
        return json({ valid: false, error: 'Coupon not valid for the selected ticket type' });
      }
    }

    if (coupon.maxUsesPerBuyer) {
      const usageCounterId = `${normalizedCode}_${user.uid}`;
      const usageSnap = await getDoc(env, 'couponUsageCounters', usageCounterId);
      const usageCount = usageSnap.exists ? Number(usageSnap.data()?.count || 0) : 0;
      if (usageCount >= Number(coupon.maxUsesPerBuyer)) {
        return json({ valid: false, error: 'You already used this coupon the maximum number of times' });
      }
    }

    return json({
      valid: true,
      discount: coupon.discount ?? 0,
      tierId: coupon.tierId ?? null,
      maxUsesPerBuyer: coupon.maxUsesPerBuyer ?? null,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Validation failed';
    return errorResponse(message);
  }
};
