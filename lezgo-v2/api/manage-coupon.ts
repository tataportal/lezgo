import type { VercelRequest, VercelResponse } from '@vercel/node';
import { verifyPromoter } from './lib/auth';
import { getAdminDb } from './lib/firebase-admin';
import { rateLimit, RATE_LIMITS } from './lib/rate-limit';
import { FieldValue } from 'firebase-admin/firestore';
import { cors } from './lib/cors';

/**
 * POST /api/manage-coupon
 * Body: { action: 'create' | 'update' | 'delete' | 'list', ...data }
 *
 * Manages coupons for event organizers.
 * Requires promoter/admin role.
 */
export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (cors(req, res)) return;

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const user = await verifyPromoter(req);
    if (rateLimit(req, res, user.uid, RATE_LIMITS.GENERAL)) return;

    const db = getAdminDb();
    const { action } = req.body;

    switch (action) {
      case 'create': {
        const { code, discount, maxUses, expiresAt, eventId, description } = req.body;

        if (!code || discount == null || !maxUses) {
          return res.status(400).json({ error: 'Missing required fields: code, discount, maxUses' });
        }

        if (discount < 0 || discount > 1) {
          return res.status(400).json({ error: 'Discount must be between 0 and 1 (e.g., 0.15 for 15%)' });
        }

        // Check if code already exists
        const existing = await db.collection('coupons').doc(code.toUpperCase()).get();
        if (existing.exists) {
          return res.status(400).json({ error: 'Coupon code already exists' });
        }

        const couponData = {
          code: code.toUpperCase(),
          discount: Number(discount),
          maxUses: Number(maxUses),
          usedCount: 0,
          active: true,
          eventId: eventId || null, // null = applies to all events
          description: description || '',
          createdBy: user.uid,
          createdAt: FieldValue.serverTimestamp(),
          expiresAt: expiresAt ? new Date(expiresAt) : null,
        };

        await db.collection('coupons').doc(code.toUpperCase()).set(couponData);

        return res.status(200).json({ success: true, coupon: { ...couponData, createdAt: new Date() } });
      }

      case 'update': {
        const { code: updateCode, active, maxUses: newMaxUses, expiresAt: newExpiry } = req.body;

        if (!updateCode) {
          return res.status(400).json({ error: 'Missing coupon code' });
        }

        const couponRef = db.collection('coupons').doc(updateCode.toUpperCase());
        const couponSnap = await couponRef.get();

        if (!couponSnap.exists) {
          return res.status(404).json({ error: 'Coupon not found' });
        }

        // Verify ownership
        const couponData = couponSnap.data()!;
        if (couponData.createdBy !== user.uid) {
          // Check if admin
          const userDoc = await db.collection('users').doc(user.uid).get();
          if (userDoc.data()?.role !== 'admin') {
            return res.status(403).json({ error: 'You can only update your own coupons' });
          }
        }

        const updates: Record<string, any> = {};
        if (active !== undefined) updates.active = active;
        if (newMaxUses !== undefined) updates.maxUses = Number(newMaxUses);
        if (newExpiry !== undefined) updates.expiresAt = newExpiry ? new Date(newExpiry) : null;

        await couponRef.update(updates);

        return res.status(200).json({ success: true });
      }

      case 'delete': {
        const { code: deleteCode } = req.body;

        if (!deleteCode) {
          return res.status(400).json({ error: 'Missing coupon code' });
        }

        const delRef = db.collection('coupons').doc(deleteCode.toUpperCase());
        const delSnap = await delRef.get();

        if (!delSnap.exists) {
          return res.status(404).json({ error: 'Coupon not found' });
        }

        // W7 FIX: Verify ownership before deleting (same check as update)
        const delData = delSnap.data()!;
        if (delData.createdBy !== user.uid) {
          const delUserDoc = await db.collection('users').doc(user.uid).get();
          if (delUserDoc.data()?.role !== 'admin') {
            return res.status(403).json({ error: 'You can only delete your own coupons' });
          }
        }

        // Soft delete — mark as inactive instead of deleting
        await delRef.update({ active: false });

        return res.status(200).json({ success: true });
      }

      case 'list': {
        const { eventId: filterEventId } = req.body;

        let q = db.collection('coupons').where('createdBy', '==', user.uid);

        const snapshot = await q.get();
        let coupons = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
          createdAt: doc.data().createdAt?.toDate?.() || null,
          expiresAt: doc.data().expiresAt?.toDate?.() || null,
        }));

        // Filter by eventId if specified
        if (filterEventId) {
          coupons = coupons.filter((c: any) => c.eventId === filterEventId || c.eventId === null);
        }

        // Sort by creation date (newest first)
        coupons.sort((a: any, b: any) => {
          const dateA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
          const dateB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
          return dateB - dateA;
        });

        return res.status(200).json({ coupons });
      }

      default:
        return res.status(400).json({ error: 'Invalid action. Use: create, update, delete, list' });
    }
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Operation failed';
    return res.status(400).json({ error: message });
  }
}
