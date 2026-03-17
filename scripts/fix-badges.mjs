/**
 * Fix badges: Add badgeConfig to event + assign badge to existing ticket
 *
 * Usage:
 *   GOOGLE_APPLICATION_CREDENTIALS=/path/to/serviceAccount.json node scripts/fix-badges.mjs
 */

import { initializeApp, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { readFileSync } from 'fs';

const PROJECT_ID = 'lezgo-ticketingapp';
const EVENT_ID = 'P1SwOrvcPYeNuU5BizGg';

// Load service account
const saPath = process.env.GOOGLE_APPLICATION_CREDENTIALS;
if (!saPath) {
  console.error('❌ Set GOOGLE_APPLICATION_CREDENTIALS=/path/to/serviceAccount.json');
  process.exit(1);
}

const sa = JSON.parse(readFileSync(saPath, 'utf-8'));
const app = initializeApp({
  credential: cert(sa),
});
const db = getFirestore(app);

async function fixBadges() {
  // Step 1: Add badgeConfig to the event
  console.log('📦 Adding badgeConfig to event...');
  const eventRef = db.collection('events').doc(EVENT_ID);
  const eventSnap = await eventRef.get();

  if (!eventSnap.exists) {
    console.error('❌ Event not found!');
    process.exit(1);
  }

  const eventData = eventSnap.data();
  const totalSupply = eventData.tiers.reduce((sum, t) => sum + t.capacity, 0);

  await eventRef.update({
    badgeConfig: {
      type: 'numbered',
      totalSupply,
    },
  });
  console.log(`✅ badgeConfig added: type=numbered, totalSupply=${totalSupply}`);

  // Step 2: Initialize badge counter
  const counterRef = db.collection('badgeCounters').doc(EVENT_ID);
  const counterSnap = await counterRef.get();

  // Step 3: Find existing tickets for this event and assign badge numbers
  const ticketsSnap = await db.collection('tickets')
    .where('eventId', '==', EVENT_ID)
    .get();

  console.log(`\n🎟️  Found ${ticketsSnap.size} existing tickets`);

  let nextBadge = 1;
  const batch = db.batch();

  for (const doc of ticketsSnap.docs) {
    const data = doc.data();
    const tierBadgeType = data.ticketType || 'numbered';

    if (!data.badgeNumber) {
      batch.update(doc.ref, {
        badgeNumber: nextBadge,
        badgeType: tierBadgeType,
      });
      console.log(`  ✅ Ticket ${doc.id} → Badge #${nextBadge} (${tierBadgeType}) — ${data.userName || data.userEmail}`);
      nextBadge++;
    } else {
      console.log(`  ⏭️  Ticket ${doc.id} already has badge #${data.badgeNumber}`);
      nextBadge = Math.max(nextBadge, data.badgeNumber + 1);
    }
  }

  // Update badge counter
  batch.set(counterRef, {
    eventId: EVENT_ID,
    nextNumber: nextBadge,
  });

  await batch.commit();
  console.log(`\n✅ Done! Badge counter set to nextNumber=${nextBadge}`);
  console.log('🎉 Future purchases will automatically get numbered badges.');
}

fixBadges().then(() => process.exit(0)).catch(err => {
  console.error('❌', err.message);
  process.exit(1);
});
