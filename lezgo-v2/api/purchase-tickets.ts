import type { VercelRequest, VercelResponse } from '@vercel/node';
import { verifyAuth } from './lib/auth';
import { getAdminDb } from './lib/firebase-admin';
import { rateLimit, RATE_LIMITS } from './lib/rate-limit';
import { verifyRecaptcha } from './lib/recaptcha';
import { validatePurchaseToken } from './lib/purchase-token';
import { FieldValue } from 'firebase-admin/firestore';
import { cors } from './lib/cors';

/**
 * POST /api/purchase-tickets
 * Body: { eventId, quantities: [{ tierId, tierName, quantity }], couponCode? }
 *
 * Security: Rate limited (1 purchase per user every 30s), identity-based limits.
 * Server-side: reads event, validates inventory, reads user profile for DNI,
 * validates coupon, creates tickets atomically.
 */
export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (cors(req, res)) return;

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const user = await verifyAuth(req);

    // Layer 1: Rate limiting — 1 purchase per user every 30 seconds
    if (rateLimit(req, res, user.uid, RATE_LIMITS.PURCHASE)) return;

    // Layer 2: reCAPTCHA v3 — bot detection (active when configured)
    const recaptchaToken = req.body.recaptchaToken;
    const recaptchaResult = await verifyRecaptcha(recaptchaToken, 'purchase');
    if (!recaptchaResult.success) {
      return res.status(403).json({ error: recaptchaResult.error || 'Bot detected' });
    }

    const db = getAdminDb();
    const { eventId, quantities, couponCode, purchaseToken } = req.body;

    // Layer 3: Purchase token validation (virtual queue)
    validatePurchaseToken(purchaseToken, user.uid, eventId);

    // Layer 4: Device fingerprint — track for anti-abuse analysis
    const deviceFingerprint = (req.headers['x-device-fingerprint'] as string) || 'unknown';

    if (!eventId || !quantities || !Array.isArray(quantities)) {
      return res.status(400).json({ error: 'Missing eventId or quantities' });
    }

    // Run everything in a Firestore transaction
    const result = await db.runTransaction(async (transaction) => {
      // 1. Get event from Firestore (server-side, not from client)
      const eventRef = db.collection('events').doc(eventId);
      const eventSnap = await transaction.get(eventRef);

      if (!eventSnap.exists) {
        throw new Error('Event not found');
      }

      const eventData = eventSnap.data()!;
      const tiers = eventData.tiers || [];

      if (eventData.status !== 'published') {
        throw new Error('Event is not available for purchase');
      }

      // 2. Get user profile for DNI and name (from server, not client)
      const userRef = db.collection('users').doc(user.uid);
      const userSnap = await transaction.get(userRef);
      const userProfile = userSnap.data() || {};

      const userName = userProfile.displayName || '';
      const userDni = userProfile.dni || '';
      const userEmail = user.email;

      if (!userDni) {
        throw new Error('Identity document required. Please complete your profile.');
      }

      // Layer 5: Identity-based purchase limits — max 4 tickets per DNI per event
      // B5 FIX: Use a counter document within the transaction to prevent race conditions.
      // Firestore transactions only support transaction.get() on document references (not queries),
      // so we maintain an atomic counter at purchaseCounts/{eventId}_{dni}.
      const MAX_TICKETS_PER_IDENTITY = 4;
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
          `Maximum ${MAX_TICKETS_PER_IDENTITY} tickets per identity per event. ` +
          `You already have ${existingCount}.`
        );
      }

      // 3. Validate inventory and calculate price
      let totalPrice = 0;
      let discountApplied = 0;
      const quantityMap = new Map(
        quantities.map((q: { tierId: string; quantity: number }) => [q.tierId, q])
      );
      const updatedTiers = [];

      for (const tier of tiers) {
        const tierQty = quantityMap.get(tier.id);

        if (tierQty && tierQty.quantity > 0) {
          const available = tier.capacity - tier.sold;
          if (tierQty.quantity > available) {
            throw new Error(
              `Not enough tickets for ${tier.name}. Available: ${available}`
            );
          }

          const activePhase = tier.phases?.find((p: { active: boolean }) => p.active);
          if (!activePhase) {
            throw new Error(`No active phase for tier ${tier.name}`);
          }

          totalPrice += activePhase.price * tierQty.quantity;
          updatedTiers.push({ ...tier, sold: tier.sold + tierQty.quantity });
        } else {
          updatedTiers.push(tier);
        }
      }

      // 4. Validate coupon server-side
      let couponDiscount = 0;
      if (couponCode) {
        const couponRef = db.collection('coupons').doc(couponCode);
        const couponSnap = await transaction.get(couponRef);

        if (!couponSnap.exists) {
          throw new Error('Coupon not found');
        }

        const couponData = couponSnap.data()!;

        if (!couponData.active) throw new Error('Coupon is not active');

        if ((couponData.usedCount ?? 0) >= (couponData.maxUses ?? 0)) {
          throw new Error('Coupon usage limit reached');
        }

        if (couponData.expiresAt?.toDate() < new Date()) {
          throw new Error('Coupon has expired');
        }

        // Verify coupon is valid for this event
        if (couponData.eventId && couponData.eventId !== eventId) {
          throw new Error('Coupon not valid for this event');
        }

        const discountRate = Math.min(Math.max(couponData.discount ?? 0, 0), 1);
        couponDiscount = totalPrice * discountRate;
        discountApplied = couponDiscount;

        transaction.update(couponRef, {
          usedCount: FieldValue.increment(1),
        });
      }

      // 5. Update event tiers
      transaction.update(eventRef, { tiers: updatedTiers });

      // 6. Create ticket documents
      const ticketIds: string[] = [];

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
              deviceFingerprint, // Layer 4: audit trail
            };

            transaction.set(ticketRef, ticketData);
            ticketIds.push(ticketRef.id);
          }
        }
      }

      // B5 FIX: Atomically update the purchase counter within the transaction
      if (counterSnap.exists) {
        transaction.update(counterRef, { count: FieldValue.increment(requestedTotal) });
      } else {
        transaction.set(counterRef, {
          eventId,
          dni: userDni,
          count: requestedTotal,
        });
      }

      return { ticketIds, totalPrice, discountApplied };
    });

    return res.status(200).json(result);
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Purchase failed';
    return res.status(400).json({ error: message });
  }
}
