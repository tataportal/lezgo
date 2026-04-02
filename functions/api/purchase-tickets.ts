import { verifyAuth } from './_lib/auth.js';
import { runTransaction } from './_lib/firestore-rest.js';
import { rateLimit, RATE_LIMITS } from './_lib/rate-limit.js';
import { verifyRecaptcha } from './_lib/recaptcha.js';
import { validatePurchaseToken } from './_lib/purchase-token.js';
import { calculateBuyerFee, calculateBuyerFeeForTickets, calculateOrganizerFee, getDirectFeeBracket } from './_lib/constants.js';
import { sendEmail, transactionalShell } from './_lib/email.js';

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

    const { eventId, quantities, couponCode, purchaseToken } = body;

    // Layer 3: Purchase token
    validatePurchaseToken(purchaseToken, user.uid, eventId);

    // Layer 4: Device fingerprint
    const deviceFingerprint = context.request.headers.get('x-device-fingerprint') || 'unknown';

    if (!eventId || !quantities || !Array.isArray(quantities)) {
      return errorResponse('Missing eventId or quantities');
    }

    const env = context.env;

    const result = await runTransaction(env, async (tx) => {
      // ═══ PHASE 1: ALL READS ═══

      const eventSnap = await tx.get('events', eventId);

      if (!eventSnap.exists) throw new Error('Event not found');

      const eventData = eventSnap.data()!;
      const tiers = eventData.tiers || [];

      if (eventData.status !== 'published') {
        throw new Error('Event is not available for purchase');
      }

      if (eventData.date && new Date(eventData.date) < new Date()) {
        throw new Error('Event is no longer available for purchase');
      }

      const userSnap = await tx.get('users', user.uid);
      const userProfile = userSnap.data() || {};

      const userName = userProfile.displayName || '';
      const userDni = userProfile.dni || '';
      const userEmail = user.email;

      if (!userDni) {
        throw new Error('Identity document required. Please complete your profile.');
      }

      const maxTicketsPerBuyer = Math.max(Number(eventData.maxTicketsPerBuyer || 1), 1);
      const requestedTotal = quantities.reduce(
        (sum: number, q: { quantity: number }) => sum + q.quantity, 0
      );

      if (requestedTotal <= 0) {
        throw new Error('Select at least one ticket');
      }

      for (const q of quantities) {
        if (!Number.isInteger(q.quantity) || q.quantity < 1) {
          throw new Error('Invalid ticket quantity');
        }
      }

      const counterId = `${eventId}_${userDni}`;
      const counterSnap = await tx.get('purchaseCounts', counterId);
      const existingCount = counterSnap.exists ? (counterSnap.data()!.count || 0) : 0;

      if (existingCount + requestedTotal > maxTicketsPerBuyer) {
        throw new Error(
          `Máximo ${maxTicketsPerBuyer} entrada${maxTicketsPerBuyer > 1 ? 's' : ''} por documento de identidad. ` +
          `Ya tienes ${existingCount}.`
        );
      }

      let couponData: Record<string, any> | null = null;
      let hasCoupon = false;
      let couponUsageCounterId = '';
      let couponUsageCount = 0;
      const normalizedCouponCode = couponCode ? String(couponCode).trim().toUpperCase() : '';

      if (normalizedCouponCode) {
        const couponSnap = await tx.get('coupons', normalizedCouponCode);

        if (!couponSnap.exists) throw new Error('Coupon not found');

        couponData = couponSnap.data()!;
        hasCoupon = true;

        if (!couponData.active) throw new Error('Coupon is not active');
        if ((couponData.usedCount ?? 0) >= (couponData.maxUses ?? 0)) throw new Error('Coupon usage limit reached');
        if (couponData.expiresAt && new Date(couponData.expiresAt) < new Date()) throw new Error('Coupon has expired');
        if (couponData.eventId && couponData.eventId !== eventId) throw new Error('Coupon not valid for this event');
        if (couponData.tierId) {
          const hasEligibleTier = quantities.some((q: { tierId: string; quantity: number }) => q.quantity > 0 && q.tierId === couponData.tierId);
          if (!hasEligibleTier) throw new Error('Coupon not valid for the selected ticket type');
        }
        if (couponData.maxUsesPerBuyer) {
          couponUsageCounterId = `${normalizedCouponCode}_${user.uid}`;
          const usageSnap = await tx.get('couponUsageCounters', couponUsageCounterId);
          couponUsageCount = usageSnap.exists ? Number(usageSnap.data()!.count || 0) : 0;
          if (couponUsageCount >= Number(couponData.maxUsesPerBuyer)) {
            throw new Error('You already used this coupon the maximum number of times');
          }
        }
      }

      const badgeConfig = eventData.badgeConfig || null;
      let nextBadgeNumber = 0;
      let badgeCounterExists = false;
      if (badgeConfig) {
        const badgeCounterSnap = await tx.get('badgeCounters', eventId);
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

      const discountRate = couponData ? Math.min(Math.max(couponData.discount ?? 0, 0), 1) : 0;

      const tierDiscountMap = new Map<string, number>();
      let couponDiscount = 0;
      for (const tier of tiers) {
        const tierQty = quantityMap.get(tier.id);
        if (!tierQty || tierQty.quantity <= 0) continue;

        const activePhase = tier.phases?.find((p: { active: boolean }) => p.active);
        const grossForTier = (activePhase?.price || 0) * tierQty.quantity;
        const eligibleForCoupon = couponData
          ? (!couponData.tierId || couponData.tierId === tier.id)
          : false;
        const tierDiscount = eligibleForCoupon ? grossForTier * discountRate : 0;
        tierDiscountMap.set(tier.id, tierDiscount);
        couponDiscount += tierDiscount;
      }
      discountApplied = couponDiscount;

      const discountedTicketPrices: number[] = [];
      for (const tierQty of quantities) {
        if (tierQty.quantity <= 0) continue;
        const tier = tiers.find((t: { id: string }) => t.id === tierQty.tierId);
        if (!tier) continue;

        const activePhase = tier.phases?.find((p: { active: boolean }) => p.active);
        const ticketPrice = activePhase?.price || 0;
        const tierCouponDiscount = tierDiscountMap.get(tier.id) || 0;
        const perTicketCouponDiscount = tierQty.quantity > 0 ? tierCouponDiscount / tierQty.quantity : 0;
        const discountedTicketPrice = Math.max(ticketPrice - perTicketCouponDiscount, 0);

        for (let i = 0; i < tierQty.quantity; i++) {
          discountedTicketPrices.push(discountedTicketPrice);
        }
      }

      const totalBuyerFee = calculateBuyerFeeForTickets(discountedTicketPrices);

      // ═══ PHASE 3: ALL WRITES ═══

      if (hasCoupon && normalizedCouponCode) {
        tx.update('coupons', normalizedCouponCode, { usedCount: (couponData!.usedCount ?? 0) + 1 });
        const nextCount = couponUsageCount + 1;
        if (couponUsageCounterId && couponUsageCount > 0) {
          tx.update('couponUsageCounters', couponUsageCounterId, {
            count: nextCount,
            updatedAt: new Date().toISOString(),
          });
        } else if (couponUsageCounterId) {
          tx.set('couponUsageCounters', couponUsageCounterId, {
            code: normalizedCouponCode,
            userId: user.uid,
            count: nextCount,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          });
        }
      }

      const isSoldOut = updatedTiers.length > 0 && updatedTiers.every((tier: any) => tier.sold >= tier.capacity);
      tx.update('events', eventId, {
        tiers: updatedTiers,
        ...(isSoldOut ? { status: 'sold-out' } : {}),
      });

      if (badgeConfig) {
        if (badgeCounterExists) {
          tx.update('badgeCounters', eventId, { nextNumber: nextBadgeNumber + requestedTotal });
        } else {
          tx.set('badgeCounters', eventId, { eventId, nextNumber: nextBadgeNumber + requestedTotal });
        }
      }

      const ticketIds: string[] = [];
      const badges: { ticketId: string; badgeNumber: number; badgeType: string }[] = [];
      let allocatedBuyerFee = 0;
      let totalOrganizerFees = 0;
      let totalPlatformRevenue = 0;
      let totalNetToOrganizer = 0;

      for (const tierQty of quantities) {
        if (tierQty.quantity > 0) {
          const tier = tiers.find((t: { id: string }) => t.id === tierQty.tierId);
          if (!tier) continue;

          const activePhase = tier.phases?.find((p: { active: boolean }) => p.active);
          const ticketPrice = activePhase?.price || 0;
          const tierCouponDiscount = tierDiscountMap.get(tier.id) || 0;
          const perTicketCouponDiscount = tierQty.quantity > 0 ? tierCouponDiscount / tierQty.quantity : 0;

          for (let i = 0; i < tierQty.quantity; i++) {
            const ticketDocId = tx.generateId();
            const discountedTicketPrice = Math.max(ticketPrice - perTicketCouponDiscount, 0);
            const organizerFee = calculateOrganizerFee(discountedTicketPrice);
            const buyerFeeShare = calculateBuyerFee(discountedTicketPrice);
            allocatedBuyerFee += buyerFeeShare;
            totalOrganizerFees += organizerFee;
            totalPlatformRevenue += organizerFee + buyerFeeShare;
            totalNetToOrganizer += discountedTicketPrice - organizerFee;

            const ticketData: Record<string, any> = {
              ticketId: `${eventId}-${tierQty.tierId}-${Date.now()}-${i}`,
              eventId,
              eventName: eventData.name || '',
              eventDate: eventData.date || null,
              eventDateLabel: eventData.dateLabel || '',
              eventTimeStart: eventData.timeStart || '',
              eventTimeEnd: eventData.timeEnd || '',
              eventVenue: eventData.venue || '',
              eventLocation: eventData.location || '',
              eventSlug: eventData.slug || '',
              image: eventData.image || '',
              ticketType: tier.id,
              ticketName: tier.name,
              originalPrice: ticketPrice,
              price: discountedTicketPrice,
              couponCode: normalizedCouponCode || '',
              couponDiscount: perTicketCouponDiscount,
              buyerFee: buyerFeeShare,
              organizerFee,
              platformRevenue: organizerFee + buyerFeeShare,
              netToOrganizer: discountedTicketPrice - organizerFee,
              feeTier: getDirectFeeBracket(discountedTicketPrice).tier,
              userId: user.uid,
              userEmail,
              userDni,
              userName,
              status: 'active',
              usedAt: null,
              purchasedAt: new Date().toISOString(),
              transferredAt: null,
              transferredFrom: null,
              boughtInResale: false,
              deviceFingerprint,
            };

            if (badgeConfig) {
              ticketData.badgeNumber = nextBadgeNumber;
              ticketData.badgeType = tier.badgeType || badgeConfig.type;
            }

            tx.set('tickets', ticketDocId, ticketData);
            ticketIds.push(ticketDocId);

            if (badgeConfig) {
              badges.push({
                ticketId: ticketDocId,
                badgeNumber: nextBadgeNumber,
                badgeType: badgeConfig.type,
              });
              nextBadgeNumber++;
            }
          }
        }
      }

      if (counterSnap.exists) {
        tx.update('purchaseCounts', counterId, { count: existingCount + requestedTotal });
      } else {
        tx.set('purchaseCounts', counterId, { eventId, dni: userDni, count: requestedTotal });
      }

      return {
        ticketIds,
        totalPrice,
        discountApplied,
        buyerFee: allocatedBuyerFee,
        organizerFees: totalOrganizerFees,
        platformRevenue: totalPlatformRevenue,
        netToOrganizer: totalNetToOrganizer,
        userEmail,
        userName,
        eventName: eventData.name || '',
        eventVenue: eventData.venue || '',
        eventTimeStart: eventData.timeStart || '',
        eventTimeEnd: eventData.timeEnd || '',
        ticketCount: requestedTotal,
        ...(badges.length > 0 ? { badges } : {}),
      };
    });

    if (result.userEmail) {
      const firstName = String(result.userName || 'fan').split(' ')[0];
      const ticketWord = result.ticketCount === 1 ? 'entrada quedó' : 'entradas quedaron';
      const html = transactionalShell(`
        <p style="font-size:16px;margin:0 0 20px;">Hey ${firstName},</p>
        <p style="font-size:16px;margin:0 0 20px;">Tu compra fue confirmada para <strong>${result.eventName}</strong>.</p>
        <p style="font-size:16px;margin:0 0 20px;">${result.ticketCount} ${ticketWord} vinculadas a tu identidad.</p>
        <p style="font-size:16px;margin:0 0 20px;">
          Venue: ${result.eventVenue || 'Por confirmar'}<br />
          Horario: ${result.eventTimeStart || '--'} ${result.eventTimeEnd ? `- ${result.eventTimeEnd}` : ''}
        </p>
        <p style="font-size:16px;margin:0 0 24px;">
          <a href="https://lezgo.fans/mis-entradas" style="display:inline-block;background:#E5FF00;color:#111111;padding:12px 18px;border-radius:999px;text-decoration:none;font-weight:800;">Ver mis entradas</a>
        </p>
        <p style="font-size:16px;margin:0 0 20px;">
          También puedes <a href="https://lezgo.fans/eventos" style="color:#0b57d0;font-weight:600;">explorar otros eventos</a>.
        </p>
        <p style="font-size:16px;margin:0;color:#44403a;">Si algo se ve raro, responde este correo y lo revisamos.</p>
      `);
      const text = `Hey ${firstName},

Tu compra fue confirmada para ${result.eventName}.

${result.ticketCount} ${result.ticketCount === 1 ? 'entrada quedó' : 'entradas quedaron'} vinculadas a tu identidad.

Venue: ${result.eventVenue || 'Por confirmar'}
Horario: ${result.eventTimeStart || '--'} ${result.eventTimeEnd ? `- ${result.eventTimeEnd}` : ''}

Puedes ver tus entradas aquí:
https://lezgo.fans/mis-entradas

También puedes explorar otros eventos:
https://lezgo.fans/eventos

Si algo se ve raro, responde este correo y lo revisamos.`;
      sendEmail(env, {
        to: result.userEmail,
        subject: `Compra confirmada: ${result.eventName}`,
        html,
        text,
      }).catch(() => {});
    }

    return json(result);
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Purchase failed';
    return errorResponse(message);
  }
};
