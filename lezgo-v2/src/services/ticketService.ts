import {
  collection,
  doc,
  getDoc,
  getDocs,
  query,
  where,
  orderBy,
  runTransaction,
  addDoc,
  updateDoc,
  increment,
} from 'firebase/firestore';
import { db } from '../firebase';
import type {
  Ticket,
  PurchaseTicketInput,
  TicketStatus,
  PurchaseResponse,
} from '../lib/types';

const TICKETS_COLLECTION = 'tickets';

/**
 * Get all tickets for a specific user
 */
export async function getUserTickets(userId: string): Promise<Ticket[]> {
  const q = query(
    collection(db, TICKETS_COLLECTION),
    where('userId', '==', userId),
    orderBy('purchasedAt', 'desc')
  );

  const querySnapshot = await getDocs(q);

  return querySnapshot.docs.map((doc) => ({
    id: doc.id,
    ...doc.data(),
  } as Ticket));
}

/**
 * Get all tickets for a specific event
 */
export async function getTicketsByEvent(eventId: string): Promise<Ticket[]> {
  const q = query(
    collection(db, TICKETS_COLLECTION),
    where('eventId', '==', eventId),
    orderBy('purchasedAt', 'desc')
  );

  const querySnapshot = await getDocs(q);

  return querySnapshot.docs.map((doc) => ({
    id: doc.id,
    ...doc.data(),
  } as Ticket));
}

/**
 * Get a single ticket by ID
 */
export async function getTicketById(ticketId: string): Promise<Ticket | null> {
  const docRef = doc(db, TICKETS_COLLECTION, ticketId);
  const docSnap = await getDoc(docRef);

  if (!docSnap.exists()) {
    return null;
  }

  return {
    id: docSnap.id,
    ...docSnap.data(),
  } as Ticket;
}

/**
 * Get all active tickets for a user at a specific event
 */
export async function getUserEventTickets(
  userId: string,
  eventId: string
): Promise<Ticket[]> {
  const q = query(
    collection(db, TICKETS_COLLECTION),
    where('userId', '==', userId),
    where('eventId', '==', eventId),
    where('status', 'in', ['active', 'transferred'])
  );

  const querySnapshot = await getDocs(q);

  return querySnapshot.docs.map((doc) => ({
    id: doc.id,
    ...doc.data(),
  } as Ticket));
}

/**
 * Purchase tickets with Firestore transaction
 * Handles inventory check, ticket creation, and coupon validation
 */
export async function purchaseTickets(
  input: PurchaseTicketInput
): Promise<PurchaseResponse> {
  const { eventId, quantities, couponCode } = input;

  const result = await runTransaction(db, async (transaction) => {
    // Get the event
    const eventRef = doc(db, 'events', eventId);
    const eventSnap = await transaction.get(eventRef);

    if (!eventSnap.exists()) {
      throw new Error(`Event ${eventId} not found`);
    }

    const eventData = eventSnap.data();
    const tiers = eventData.tiers || [];

    // Validate inventory and calculate price
    let totalPrice = 0;
    let discountApplied = 0;
    const quantityMap = new Map(quantities.map((q) => [q.tierId, q]));
    const updatedTiers = [];

    for (const tier of tiers) {
      const tierQuantity = quantityMap.get(tier.id);

      if (tierQuantity && tierQuantity.quantity > 0) {
        // Check capacity
        const available = tier.capacity - tier.sold;
        if (tierQuantity.quantity > available) {
          throw new Error(
            `Not enough tickets available for tier ${tier.name}. Available: ${available}, Requested: ${tierQuantity.quantity}`
          );
        }

        // Get current price from active phase
        const activePhase = tier.phases?.find((phase: any) => phase.active);
        if (!activePhase) {
          throw new Error(`No active phase for tier ${tier.name}`);
        }

        totalPrice += activePhase.price * tierQuantity.quantity;

        // Update sold count
        updatedTiers.push({
          ...tier,
          sold: tier.sold + tierQuantity.quantity,
        });
      } else {
        updatedTiers.push(tier);
      }
    }

    // Validate and apply coupon if provided
    let couponDiscount = 0;
    if (couponCode) {
      const couponRef = doc(db, 'coupons', couponCode);
      const couponSnap = await transaction.get(couponRef);

      if (!couponSnap.exists()) {
        throw new Error(`Coupon ${couponCode} not found`);
      }

      const couponData = couponSnap.data();

      if (!couponData.active) {
        throw new Error('Coupon is not active');
      }

      if (couponData.usedCount >= couponData.maxUses) {
        throw new Error('Coupon usage limit reached');
      }

      if (couponData.expiresAt.toDate() < new Date()) {
        throw new Error('Coupon has expired');
      }

      couponDiscount = totalPrice * couponData.discount;
      discountApplied = couponDiscount;

      // Increment coupon usage
      transaction.update(couponRef, {
        usedCount: increment(1),
      });
    }

    // Update event with new tier information
    transaction.update(eventRef, { tiers: updatedTiers });

    // Create ticket documents
    const ticketIds: string[] = [];
    const ticketCollectionRef = collection(db, TICKETS_COLLECTION);

    for (const tierQuantity of quantities) {
      if (tierQuantity.quantity > 0) {
        const tier = tiers.find((t: any) => t.id === tierQuantity.tierId);
        if (!tier) continue;

        const activePhase = tier.phases?.find((phase: any) => phase.active);
        const ticketPrice = activePhase?.price || 0;

        for (let i = 0; i < tierQuantity.quantity; i++) {
          const ticketData = {
            ticketId: `${eventId}-${tierQuantity.tierId}-${Date.now()}-${i}`,
            eventId: input.eventId,
            eventName: input.eventName,
            eventDate: input.eventDate,
            eventDateLabel: input.eventDateLabel,
            eventTimeStart: input.eventTimeStart,
            eventTimeEnd: input.eventTimeEnd,
            eventVenue: input.eventVenue,
            eventLocation: input.eventLocation,
            ticketType: tier.id,
            ticketName: tierQuantity.tierName,
            originalPrice: ticketPrice,
            price: ticketPrice - couponDiscount / tierQuantity.quantity,
            couponCode: couponCode || '',
            couponDiscount: couponDiscount / tierQuantity.quantity,
            userId: input.userId,
            userEmail: input.userEmail,
            userDni: input.userDni,
            userName: input.userName,
            status: 'active' as TicketStatus,
            usedAt: null,
            purchasedAt: new Date(),
            transferredAt: null,
            transferredFrom: null,
            boughtInResale: false,
          };

          const ticketDocRef = await addDoc(ticketCollectionRef, ticketData);
          ticketIds.push(ticketDocRef.id);
        }
      }
    }

    return {
      ticketIds,
      totalPrice,
      discountApplied,
    };
  });

  return result;
}

/**
 * Update ticket status
 */
export async function updateTicketStatus(
  ticketId: string,
  status: TicketStatus
): Promise<void> {
  const docRef = doc(db, TICKETS_COLLECTION, ticketId);
  const updateData: any = { status };

  if (status === 'used') {
    updateData.usedAt = new Date();
  }

  await updateDoc(docRef, updateData);
}

/**
 * Mark ticket as used (scanned at event)
 */
export async function markTicketAsUsed(ticketId: string): Promise<void> {
  const docRef = doc(db, TICKETS_COLLECTION, ticketId);
  await updateDoc(docRef, {
    status: 'used',
    usedAt: new Date(),
  });
}

/**
 * Transfer ticket to another user
 */
export async function transferTicket(
  ticketId: string,
  toUserId: string,
  toEmail: string
): Promise<void> {
  const docRef = doc(db, TICKETS_COLLECTION, ticketId);
  const ticketSnap = await getDoc(docRef);

  if (!ticketSnap.exists()) {
    throw new Error(`Ticket ${ticketId} not found`);
  }

  const currentTicket = ticketSnap.data() as Ticket;

  await updateDoc(docRef, {
    status: 'transferred',
    userId: toUserId,
    userEmail: toEmail,
    transferredAt: new Date(),
    transferredFrom: currentTicket.userId,
  });
}

/**
 * Get user's active tickets (not used or transferred)
 */
export async function getUserActiveTickets(userId: string): Promise<Ticket[]> {
  const q = query(
    collection(db, TICKETS_COLLECTION),
    where('userId', '==', userId),
    where('status', 'in', ['active', 'transferred']),
    orderBy('eventDate', 'asc')
  );

  const querySnapshot = await getDocs(q);

  return querySnapshot.docs.map((doc) => ({
    id: doc.id,
    ...doc.data(),
  } as Ticket));
}

/**
 * Get used/past tickets for a user
 */
export async function getUserPastTickets(userId: string): Promise<Ticket[]> {
  const q = query(
    collection(db, TICKETS_COLLECTION),
    where('userId', '==', userId),
    where('status', '==', 'used'),
    orderBy('eventDate', 'desc')
  );

  const querySnapshot = await getDocs(q);

  return querySnapshot.docs.map((doc) => ({
    id: doc.id,
    ...doc.data(),
  } as Ticket));
}
