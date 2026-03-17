/**
 * Quick script to update the LEZGO v2 Launch event tiers using firebase-admin.
 *
 * Usage:
 *   GOOGLE_APPLICATION_CREDENTIALS=/path/to/serviceAccount.json node scripts/update-tiers-admin.mjs
 *
 * Or if you have gcloud configured:
 *   gcloud auth application-default login
 *   node scripts/update-tiers-admin.mjs
 */

import { initializeApp, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';

const PROJECT_ID = 'lezgo-ticketingapp';
const EVENT_ID = 'P1SwOrvcPYeNuU5BizGg';  // LEZGO v2 Launch

// Try service account from env, otherwise use ADC
const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
const privateKey = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n');

let app;
if (clientEmail && privateKey) {
  app = initializeApp({
    credential: cert({ projectId: PROJECT_ID, clientEmail, privateKey }),
  });
} else {
  app = initializeApp({ projectId: PROJECT_ID });
}

const db = getFirestore(app);

const tiers = [
  {
    id: 'gold',
    name: 'Gold',
    capacity: 35,
    sold: 0,
    phases: [{ name: 'Launch', price: 0, active: true }],
    includes: ['Badge Oro numerado', 'Acceso prioritario', 'Beneficios exclusivos', 'Early Adopter perks'],
    badgeType: 'gold',
  },
  {
    id: 'silver',
    name: 'Silver',
    capacity: 50,
    sold: 0,
    phases: [{ name: 'Launch', price: 0, active: true }],
    includes: ['Badge Plata numerado', 'Acceso prioritario', 'Beneficios exclusivos'],
    unlockAfterTier: 'gold',
    badgeType: 'silver',
  },
  {
    id: 'bronze',
    name: 'Bronze',
    capacity: 100,
    sold: 0,
    phases: [{ name: 'Launch', price: 0, active: true }],
    includes: ['Badge Bronce numerado', 'Acceso general'],
    unlockAfterTier: 'silver',
    badgeType: 'bronze',
  },
];

console.log('📦 Updating LEZGO v2 Launch event tiers...\n');
console.log('Tiers:');
tiers.forEach(t => {
  const locked = t.unlockAfterTier ? ` (🔒 unlocks after ${t.unlockAfterTier})` : ' (✅ available)';
  console.log(`  ${t.name}: ${t.capacity} tickets${locked}`);
});

try {
  const ref = db.collection('events').doc(EVENT_ID);
  const snap = await ref.get();

  if (!snap.exists) {
    console.error(`\n❌ Event ${EVENT_ID} not found!`);
    process.exit(1);
  }

  // Preserve existing sold counts
  const existing = snap.data().tiers || [];
  const soldMap = {};
  existing.forEach(t => { soldMap[t.id] = t.sold ?? 0; });

  const finalTiers = tiers.map(t => ({
    ...t,
    sold: soldMap[t.id] ?? t.sold,
  }));

  await ref.update({ tiers: finalTiers });
  console.log('\n✅ Tiers updated successfully!');

  // Verify
  const verify = await ref.get();
  console.log(`\n📋 Verification: ${verify.data().tiers.length} tiers in Firestore`);
  verify.data().tiers.forEach(t => {
    console.log(`  ${t.name}: ${t.sold}/${t.capacity} sold`);
  });
} catch (err) {
  console.error(`\n❌ Error: ${err.message}`);
  if (err.message.includes('Could not load the default credentials')) {
    console.log('\n💡 You need to provide credentials. Options:');
    console.log('   1. Set GOOGLE_APPLICATION_CREDENTIALS=/path/to/serviceAccount.json');
    console.log('   2. Run: gcloud auth application-default login');
    console.log('   3. Set FIREBASE_CLIENT_EMAIL and FIREBASE_PRIVATE_KEY env vars');
  }
  process.exit(1);
}

process.exit(0);
