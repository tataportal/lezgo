import { verifyPromoter } from './_lib/auth.js';
import { getAdminDb } from './_lib/firebase-admin.js';
import { rateLimit, RATE_LIMITS } from './_lib/rate-limit.js';
import { FieldValue } from 'firebase-admin/firestore';
import { json, errorResponse, type Env } from './_lib/types.js';

/**
 * POST /api/manage-coupon
 * Body: { action: 'create' | 'update' | 'delete' | 'list', ...data }
 */
export const onRequestPost: PagesFunction<Env> = async (context) => {
  try {
    const user = await verifyPromoter(context.request, context.env);

    const rateLimited = rateLimit(user.uid, RATE_LIMITS.GENERAL);
    if (rateLimited) return rateLimited;

    const db = getAdminDb(context.env);
    const body = await context.request.json() as any;
    const { action } = body;

    switch (action) {
      case 'create': {
        const { code, discount, maxUses, expiresAt, eventId, description } = body;

        if (!code || discount == null || !maxUses) {
          return errorResponse('Missing required fields: code, discount, maxUses');
        }

        if (discount < 0 || discount > 1) {
          return errorResponse('Discount must be between 0 and 1 (e.g., 0.15 for 15%)');
        }

        const existing = await db.collection('coupons').doc(code.toUpperCase()).get();
        if (existing.exists) {
          return errorResponse('Coupon code already exists');
        }

        const couponData = {
          code: code.toUpperCase(),
          discount: Number(discount),
          maxUses: Number(maxUses),
          usedCount: 0,
          active: true,
          eventId: eventId || null,
          description: description || '',
          createdBy: user.uid,
          createdAt: FieldValue.serverTimestamp(),
          expiresAt: expiresAt ? new Date(expiresAt) : null,
        };

        await db.collection('coupons').doc(code.toUpperCase()).set(couponData);

        return json({ success: true, coupon: { ...couponData, createdAt: new Date() } });
      }

      case 'update': {
        const { code: updateCode, active, maxUses: newMaxUses, expiresAt: newExpiry } = body;

        if (!updateCode) {
          return errorResponse('Missing coupon code');
        }

        const couponRef = db.collection('coupons').doc(updateCode.toUpperCase());
        const couponSnap = await couponRef.get();

        if (!couponSnap.exists) {
          return errorResponse('Coupon not found', 404);
        }

        const couponData = couponSnap.data()!;
        if (couponData.createdBy !== user.uid) {
          const userDoc = await db.collection('users').doc(user.uid).get();
          if (userDoc.data()?.role !== 'admin') {
            return errorResponse('You can only update your own coupons', 403);
          }
        }

        const updates: Record<string, any> = {};
        if (active !== undefined) updates.active = active;
        if (newMaxUses !== undefined) updates.maxUses = Number(newMaxUses);
        if (newExpiry !== undefined) updates.expiresAt = newExpiry ? new Date(newExpiry) : null;

        await couponRef.update(updates);

        return json({ success: true });
      }

      case 'delete': {
        const { code: deleteCode } = body;

        if (!deleteCode) {
          return errorResponse('Missing coupon code');
        }

        const delRef = db.collection('coupons').doc(deleteCode.toUpperCase());
        const delSnap = await delRef.get();

        if (!delSnap.exists) {
          return errorResponse('Coupon not found', 404);
        }

        const delData = delSnap.data()!;
        if (delData.createdBy !== user.uid) {
          const delUserDoc = await db.collection('users').doc(user.uid).get();
          if (delUserDoc.data()?.role !== 'admin') {
            return errorResponse('You can only delete your own coupons', 403);
          }
        }

        await delRef.update({ active: false });

        return json({ success: true });
      }

      case 'list': {
        const { eventId: filterEventId } = body;

        const snapshot = await db.collection('coupons')
          .where('createdBy', '==', user.uid)
          .get();

        let coupons = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
          createdAt: doc.data().createdAt?.toDate?.() || null,
          expiresAt: doc.data().expiresAt?.toDate?.() || null,
        }));

        if (filterEventId) {
          coupons = coupons.filter((c: any) => c.eventId === filterEventId || c.eventId === null);
        }

        coupons.sort((a: any, b: any) => {
          const dateA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
          const dateB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
          return dateB - dateA;
        });

        return json({ coupons });
      }

      default:
        return errorResponse('Invalid action. Use: create, update, delete, list');
    }
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Operation failed';
    return errorResponse(message);
  }
};
