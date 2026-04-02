import { verifyPromoter } from './_lib/auth.js';
import { getDoc, setDoc, updateDoc, queryDocs } from './_lib/firestore-rest.js';
import { rateLimit, RATE_LIMITS } from './_lib/rate-limit.js';

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

    const env = context.env;
    const body = await context.request.json() as any;
    const { action } = body;

    switch (action) {
      case 'create': {
        const { code, discount, maxUses, expiresAt, eventId, tierId, maxUsesPerBuyer, description } = body;

        if (!code || discount == null || !maxUses) {
          return errorResponse('Missing required fields: code, discount, maxUses');
        }

        if (discount < 0 || discount > 1) {
          return errorResponse('Discount must be between 0 and 1 (e.g., 0.15 for 15%)');
        }

        const existing = await getDoc(env, 'coupons', code.toUpperCase());
        if (existing.exists) {
          return errorResponse('Coupon code already exists');
        }

        const couponData: Record<string, any> = {
          code: code.toUpperCase(),
          discount: Number(discount),
          maxUses: Number(maxUses),
          usedCount: 0,
          active: true,
          eventId: eventId || null,
          tierId: tierId || null,
          maxUsesPerBuyer: maxUsesPerBuyer ? Number(maxUsesPerBuyer) : null,
          description: description || '',
          createdBy: user.uid,
          createdAt: new Date().toISOString(),
          expiresAt: expiresAt ? new Date(expiresAt).toISOString() : null,
        };

        await setDoc(env, 'coupons', code.toUpperCase(), couponData);

        return json({ success: true, coupon: couponData });
      }

      case 'update': {
        const {
          code: updateCode,
          active,
          maxUses: newMaxUses,
          expiresAt: newExpiry,
          tierId: newTierId,
          maxUsesPerBuyer: newMaxUsesPerBuyer,
          eventId: newEventId,
          description: newDescription,
        } = body;

        if (!updateCode) {
          return errorResponse('Missing coupon code');
        }

        const couponSnap = await getDoc(env, 'coupons', updateCode.toUpperCase());

        if (!couponSnap.exists) {
          return errorResponse('Coupon not found', 404);
        }

        const couponData = couponSnap.data()!;
        if (couponData.createdBy !== user.uid) {
          const userDoc = await getDoc(env, 'users', user.uid);
          if (userDoc.data()?.role !== 'admin') {
            return errorResponse('You can only update your own coupons', 403);
          }
        }

        const updates: Record<string, any> = {};
        if (active !== undefined) updates.active = active;
        if (newMaxUses !== undefined) updates.maxUses = Number(newMaxUses);
        if (newExpiry !== undefined) updates.expiresAt = newExpiry ? new Date(newExpiry).toISOString() : null;
        if (newTierId !== undefined) updates.tierId = newTierId || null;
        if (newEventId !== undefined) updates.eventId = newEventId || null;
        if (newMaxUsesPerBuyer !== undefined) updates.maxUsesPerBuyer = newMaxUsesPerBuyer ? Number(newMaxUsesPerBuyer) : null;
        if (newDescription !== undefined) updates.description = newDescription || '';

        await updateDoc(env, 'coupons', updateCode.toUpperCase(), updates);

        return json({ success: true });
      }

      case 'delete': {
        const { code: deleteCode } = body;

        if (!deleteCode) {
          return errorResponse('Missing coupon code');
        }

        const delSnap = await getDoc(env, 'coupons', deleteCode.toUpperCase());

        if (!delSnap.exists) {
          return errorResponse('Coupon not found', 404);
        }

        const delData = delSnap.data()!;
        if (delData.createdBy !== user.uid) {
          const delUserDoc = await getDoc(env, 'users', user.uid);
          if (delUserDoc.data()?.role !== 'admin') {
            return errorResponse('You can only delete your own coupons', 403);
          }
        }

        await updateDoc(env, 'coupons', deleteCode.toUpperCase(), { active: false });

        return json({ success: true });
      }

      case 'list': {
        const { eventId: filterEventId } = body;

        const snapshot = await queryDocs(env, 'coupons', [
          { field: 'createdBy', op: 'EQUAL', value: user.uid },
        ]);

        let coupons = snapshot.docs.map((doc) => {
          const data = doc.data()!;
          return {
            id: doc.id,
            ...data,
          };
        });

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
