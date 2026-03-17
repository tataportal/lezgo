import { verifyAuth } from './_lib/auth.js';
import { getAdminDb } from './_lib/firebase-admin.js';
import { rateLimit, RATE_LIMITS } from './_lib/rate-limit.js';
import { verifyRecaptcha } from './_lib/recaptcha.js';
import { validatePurchaseToken } from './_lib/purchase-token.js';
import { FieldValue } from 'firebase-admin/firestore';
import { json, errorResponse, type Env } from './_lib/types.js';

/**
 * POST /api/purchase-tickets
 * Body: { eventId, quantities: [{ tierId, tierName, quantity }], couponCode? }
 */
export const onRequestPost: PagesFunction<Env> = async (context) => {
  try {
    const user = await verifyAuth(context.request, context.env);

    const rateLimited = rateLimit(user.uid, RATE_LIMITS.PURCHASE);
    if (rateLimited) return rateLimited;

    const body = await context.request.json() as any;

    // Layer 2: reCAPTCHA
    const recaptchaResult = await verifyRecaptcha(
      body.recaptchaToken,
      'purchase',
      context.env.RECAPTCHA_SECRET_KEY
    );
    if (!recaptchaResult.success) {
      return errorResponse(recaptchaResult.error || 'Bot detected', 403);
    }

    const db = getAdminDb(context.env);
    const { eventId, quantities, couponCode, purchaseToken } = body;

    // Layer 3: Purchase token
    validatePurchaseToken(purchaseToken, user.uid, eventId);

    // Layer 4: Device fingerprint
    const deviceFingerprint = context.request.headers.get('x-device-fingerprint') || 'unknown';

    if (!eventId || !quantities || !Array.isArray(quantities)) {
      return errorResponse('Missing eventId or quantities');
    }

    const result = await db.runTransaction(async (transaction) => {
      // ═══ PHASE 1: ALL READS ═══

      const eventRef = db.collection('events').doc(eventId);
      const eventSnap = await transaction.get(eventRef);

      if (!eventSnap.exists) throw new Error('Event not found');

      const eventData = eventSnap.data()!;
      const tiers = eventData.tiers || [];

      if (eventData.status !== 'published') {
        throw new Error('Event is not available for purchase');
      }

      const userRef = db.collection('users').doc(user.uid);
      const userSnap = await transaction.get(userRef);
      const userProfile = userSnap.data() || {};

      const userName = userProfile.displayName || '';
      const userDni = userProfile.dni || '';
      const userEmail = user.email;

      if (!userDni) {
        throw new Error('Identity document required. Please complete your profile.');
      }

      const MAX_TICKETS_PER_IDENTITY = 1;
      const requestedTotal = quantities.reduce(
        (sum: number, q: { quantity: number }) => sum + q.quantity, 0
      );

      for (const q of quantities) {
        if (!Number.isInteger(q.quantity) || q.quantity < 1) {
          throw new Error('Invalid ticket quantity');
        }
      }

      const counterId = `${eventId}_${userDni}`;
      const counterRef = db.collection('purchaseCounts').doc(counterId);
      const counterSnap = await transaction.get(counterRef);
      const existingCount = counterSnap.exists ? (counterSnap.data()!.count || 0) : 0;

      if (existingCount + requestedTotal > MAX_TICKETS_PER_IDENTITY) {
        throw new Error(
          `Máximo ${MAX_TICKETS_PER_IDENTITY} ticket por documento de identidad. ` +
          `Ya tienes ${existingCount}.`
        );
      }

      let couponRef = null;
      let couponData = null;
      if (couponCode) {
        couponRef = db.collection('coupons').doc(couponCode);
        const couponSnap = await transaction.get(couponRef);

        if (!couponSnap.exists) throw new Error('Coupon not found');

        couponData = couponSnap.data()!;

        if (!couponData.active) throw new Error('Coupon is not active');
        if ((couponData.usedCount ?? 0) >= (couponData.maxUses ?? 0)) throw new Error('Coupon usage limit reached');
        if (couponData.expiresAt?.toDate() < new Date()) throw new Error('Coupon has expired');
        if (couponData.eventId && couponData.eventId !== eventId) throw new Error('Coupon not valid for this event');
      }

      const badgeConfig = eventData.badgeConfig || null;
      let nextBadgeNumber = 0;
      let badgeCounterRef = null;
      let badgeCounterExists = false;
      if (badgeConfig) {
        badgeCounterRef = db.collection('badgeCounters').doc(eventId);
        const badgeCounterSnap = await transaction.get(badgeCounterRef);
        badgeCounterExists = badgeCounterSnap.exists;
        nextBadgeNumber = badgeCounterExists
          ? (badgeCounterSnap.data()!.nextNumber || 1)
          : 1;

        if (nextBadgeNumber + requestedTotal - 1 > badgeConfig.totalSupply) {
          throw new Error(
            `Only ${badgeConfig.totalSupply - nextBadgeNumber + 1} numbered badges remaining`
          );
        }
      }

      // ═══ PHASE 2: VALIDATION & PRICE CALCULATION ═══

      let totalPrice = 0;
      let discountApplied = 0;
      const quantityMap = new Map(
        quantities.map((q: { tierId: string; quantity: number }) => [q.tierId, q])
      );
      const updatedTiers = [];

      for (const tier of tiers) {
        const tierQty = quantityMap.get(tier.id);

        if (tierQty && tierQty.quantity > 0) {
          if (tier.unlockAfterTier) {
            const prerequisiteTier = tiers.find((t: { id: string }) => t.id === tier.unlockAfterTier);
            if (prerequisiteTier && prerequisiteTier.sold < prerequisiteTier.capacity) {
              throw new Error(
                `${tier.name} is not yet available. ${prerequisiteTier.name} must sell out first.`
              );
            }
          }

          const available = tier.capacity - tier.sold;
          if (tierQty.quantity > available) {
            throw new Error(`Not enough tickets for ${tier.name}. Available: ${available}`);
          }

          const activePhase = tier.phases?.find((p: { active: boolean }) => p.active);
          if (!activePhase) throw new Error(`No active phase for tier ${tier.name}`);

          totalPrice += activePhase.price * tierQty.quantity;
          updatedTiers.push({ ...tier, sold: tier.sold + tierQty.quantity });
        } else {
          updatedTiers.push(tier);
        }
      }

      let couponDiscount = 0;
      if (couponData) {
        const discountRate = Math.min(Math.max(couponData.discount ?? 0, 0), 1);
        couponDiscount = totalPrice * discountRate;
        discountApplied = couponDiscount;
      }

      // ═══ PHASE 3: ALL WRITES ═══

      if (couponRef) {
        transaction.update(couponRef, { usedCount: FieldValue.increment(1) });
      }

      transaction.update(eventRef, { tiers: updatedTiers });

      if (badgeConfig && badgeCounterRef) {
        if (badgeCounterExists) {
          transaction.update(badgeCounterRef, { nextNumber: nextBadgeNumber + requestedTotal });
        } else {
          transaction.set(badgeCounterRef, { eventId, nextNumber: nextBadgeNumber + requestedTotal });
        }
      }

      const ticketIds: string[] = [];
      const badges: { ticketId: string; badgeNumber: number; badgeType: string }[] = [];

      for (const tierQty of quantities) {
        if (tierQty.quantity > 0) {
          const tier = tiers.find((t: { id: string }) => t.id === tierQty.tierId);
          if (!tier) continue;

          const activePhase = tier.phases?.find((p: { active: boolean }) => p.active);
          const ticketPrice = activePhase?.price || 0;

          for (let i = 0; i < tierQty.quantity; i++) {
            const ticketRef = db.collection('tickets').doc();
            const ticketData = {
              ticketId: `${eventId}-${tierQty.tierId}-${Date.now()}-${i}`,
              eventId,
              eventName: eventData.name || '',
              eventDate: eventData.date || null,
              eventDateLabel: eventData.dateLabel || '',
              eventTimeStart: eventData.timeStart || '',
              eventTimeEnd: eventData.timeEnd || '',
              eventVenue: eventData.venue || '',
              eventLocation: eventData.location || '',
              ticketType: tier.id,
              ticketName: tierQty.tierName || tier.name,
              originalPrice: ticketPrice,
              price: ticketPrice - couponDiscount / requestedTotal,
              couponCode: couponCode || '',
              couponDiscount: couponDiscount / requestedTotal,
              userId: user.uid,
              userEmail,
              userDni,
              userName,
              status: 'active',
              usedAt: null,
              purchasedAt: FieldValue.serverTimestamp(),
              transferredAt: null,
              transferredFrom: null,
              boughtInResale: false,
              deviceFingerprint,
              ...(badgeConfig ? {
                badgeNumber: nextBadgeNumber,
                badgeType: tier.badgeType || badgeConfig.type,
              } : {}),
            };

            transaction.set(ticketRef, ticketData);
            ticketIds.push(ticketRef.id);

            if (badgeConfig) {
              badges.push({
                ticketId: ticketRef.id,
                badgeNumber: nextBadgeNumber,
                badgeType: badgeConfig.type,
              });
              nextBadgeNumber++;
            }
          }
        }
      }

      if (counterSnap.exists) {
        transaction.update(counterRef, { count: FieldValue.increment(requestedTotal) });
      } else {
        transaction.set(counterRef, { eventId, dni: userDni, count: requestedTotal });
      }

      return {
        ticketIds,
        totalPrice,
        discountApplied,
        ...(badges.length > 0 ? { badges } : {}),
      };
    });

    return json(result);
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Purchase failed';
    return errorResponse(message);
  }
};
