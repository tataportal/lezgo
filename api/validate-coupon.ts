import type { VercelRequest, VercelResponse } from '@vercel/node';
import { verifyAuth } from './lib/auth.js';
import { getAdminDb } from './lib/firebase-admin.js';
import { rateLimit, RATE_LIMITS } from './lib/rate-limit.js';
import { cors } from './lib/cors.js';

/**
 * POST /api/validate-coupon
 * Body: { code }
 *
 * Server-side coupon validation. Returns { valid, discount } or { valid: false, error }.
 */
export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (cors(req, res)) return;

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const user = await verifyAuth(req); // Must be logged in

    // Rate limiting: 10 coupon validations per minute
    if (rateLimit(req, res, user.uid, RATE_LIMITS.COUPON_VALIDATE)) return;
    const db = getAdminDb();
    const { code } = req.body;

    if (!code) {
      return res.status(400).json({ valid: false, error: 'Missing coupon code' });
    }

    const couponRef = db.collection('coupons').doc(code);
    const couponSnap = await couponRef.get();

    if (!couponSnap.exists) {
      return res.status(200).json({ valid: false, error: 'Coupon not found' });
    }

    const coupon = couponSnap.data()!;

    if (!coupon.active) {
      return res.status(200).json({ valid: false, error: 'Coupon is not active' });
    }

    if ((coupon.usedCount ?? 0) >= (coupon.maxUses ?? 0)) {
      return res.status(200).json({ valid: false, error: 'Coupon usage limit reached' });
    }

    if (coupon.expiresAt?.toDate() < new Date()) {
      return res.status(200).json({ valid: false, error: 'Coupon has expired' });
    }

    return res.status(200).json({
      valid: true,
      discount: coupon.discount ?? 0,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Validation failed';
    return res.status(400).json({ error: message });
  }
}
