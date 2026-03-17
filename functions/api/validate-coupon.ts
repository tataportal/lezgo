import { verifyAuth } from './_lib/auth.js';
import { getAdminDb } from './_lib/firebase-admin.js';
import { rateLimit, RATE_LIMITS } from './_lib/rate-limit.js';
import { json, errorResponse, type Env } from './_lib/types.js';

/**
 * POST /api/validate-coupon
 * Body: { code }
 */
export const onRequestPost: PagesFunction<Env> = async (context) => {
  try {
    const user = await verifyAuth(context.request, context.env);

    const rateLimited = rateLimit(user.uid, RATE_LIMITS.COUPON_VALIDATE);
    if (rateLimited) return rateLimited;

    const db = getAdminDb(context.env);
    const { code } = await context.request.json() as any;

    if (!code) {
      return errorResponse('Missing coupon code');
    }

    const couponRef = db.collection('coupons').doc(code);
    const couponSnap = await couponRef.get();

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

    if (coupon.expiresAt?.toDate() < new Date()) {
      return json({ valid: false, error: 'Coupon has expired' });
    }

    return json({ valid: true, discount: coupon.discount ?? 0 });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Validation failed';
    return errorResponse(message);
  }
};
