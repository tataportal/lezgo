/**
 * Seed script: update demo events in Firestore with proper tiers + missing fields
 * Run with: node scripts/seed-tiers.mjs
 */
import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs, doc, updateDoc, setDoc } from 'firebase/firestore/lite';

const app = initializeApp({
  apiKey: 'AIzaSyDPUyIOfSKa1b9Cn4ExMhmAhacsOzfgu8A',
  authDomain: 'lezgo-ticketingapp.firebaseapp.com',
  projectId: 'lezgo-ticketingapp',
  storageBucket: 'lezgo-ticketingapp.firebasestorage.app',
  messagingSenderId: '218719712607',
  appId: '1:218719712607:web:2c9bd08b0f177f7d8932ea',
});

const db = getFirestore(app);

// ── Step 1: Read all current events ──
const snap = await getDocs(collection(db, 'events'));
const events = snap.docs.map(d => ({ id: d.id, ...d.data() }));

console.log(`\n📦 Found ${events.length} events in Firestore:\n`);

// Required fields per Event type
const REQUIRED_FIELDS = [
  'name', 'subtitle', 'date', 'dateLabel', 'venue', 'location', 'address',
  'image', 'description', 'descriptionLong', 'genre', 'lineup', 'tags',
  'prohibitedItems', 'tiers', 'status', 'featured', 'organizer', 'slug',
  'visibleSections', 'meta',
];

for (const ev of events) {
  const missing = REQUIRED_FIELDS.filter(f => ev[f] === undefined || ev[f] === null);
  console.log(`  ${ev.id} — "${ev.name}"`);
  console.log(`    status: ${ev.status} | tiers: ${(ev.tiers || []).length} | featured: ${ev.featured}`);
  if (missing.length) {
    console.log(`    ⚠️  Missing: ${missing.join(', ')}`);
  } else {
    console.log(`    ✅ All fields present`);
  }
}

// ── Step 2: Define tier updates for each event ──
// Each event gets realistic tiers so badges work properly
const updates = {
  // ── Bodysonic → PREVENTA (active phase "Preventa") ──
  'bodysonic-lima': {
    tiers: [{
      id: 'general',
      name: 'General',
      capacity: 300,
      sold: 45,
      phases: [
        { name: 'Preventa', price: 150, active: true },
        { name: 'Regular', price: 220, active: false },
        { name: 'Puerta', price: 280, active: false },
      ],
      includes: ['Acceso general', 'Barra disponible'],
    }],
  },

  // ── Room 3 Sessions → ÚLTIMAS ENTRADAS (93% sold: 140/150) ──
  'room3-sessions-lima': {
    tiers: [{
      id: 'general',
      name: 'General',
      capacity: 150,
      sold: 140,
      phases: [
        { name: 'Regular', price: 180, active: true },
      ],
      includes: ['Acceso general'],
    }],
  },

  // ── HESSLE AUDIO → Regular (no special badge, mid-sales) ──
  'hessle-audio-lima': {
    tiers: [
      {
        id: 'general',
        name: 'General',
        capacity: 200,
        sold: 80,
        phases: [
          { name: 'Regular', price: 250, active: true },
        ],
        includes: ['Acceso general'],
      },
      {
        id: 'vip',
        name: 'VIP',
        capacity: 50,
        sold: 20,
        phases: [
          { name: 'Regular', price: 450, active: true },
        ],
        includes: ['Acceso VIP', 'Barra premium', 'Zona exclusiva'],
      },
    ],
  },

  // ── Drumcode Night → SOLD OUT (already status sold-out, fill tiers) ──
  'drumcode-night-lima': {
    tiers: [
      {
        id: 'general',
        name: 'General',
        capacity: 500,
        sold: 500,
        phases: [
          { name: 'Preventa', price: 200, active: false },
          { name: 'Regular', price: 300, active: false },
        ],
        includes: ['Acceso general'],
      },
      {
        id: 'vip',
        name: 'VIP',
        capacity: 100,
        sold: 100,
        phases: [
          { name: 'Regular', price: 550, active: false },
        ],
        includes: ['Acceso VIP', 'Open bar', 'Backstage meet & greet'],
      },
    ],
  },

  // ── Dekmantel → GRATIS (all phases price 0) ──
  'dekmantel-lima': {
    tiers: [{
      id: 'general',
      name: 'General',
      capacity: 1000,
      sold: 350,
      phases: [
        { name: 'Free Entry', price: 0, active: true },
      ],
      includes: ['Acceso libre', 'Food trucks'],
    }],
  },

  // ── EXIT → PREVENTA (active phase "Presale") ──
  'exit-through-warehouse': {
    tiers: [{
      id: 'general',
      name: 'General',
      capacity: 400,
      sold: 30,
      phases: [
        { name: 'Presale', price: 180, active: true },
        { name: 'Regular', price: 280, active: false },
        { name: 'Puerta', price: 350, active: false },
      ],
      includes: ['Acceso general', 'Barra disponible'],
    }],
  },

  // ── Concrete × Lima → ÚLTIMAS ENTRADAS (88% sold: 220/250) ──
  'concrete-lima': {
    tiers: [{
      id: 'general',
      name: 'General',
      capacity: 250,
      sold: 220,
      phases: [
        { name: 'Regular', price: 270, active: true },
      ],
      includes: ['Acceso general'],
    }],
  },

  // ── Sunday Papers → GRATIS (free brunch event) ──
  'sunday-papers-lima': {
    tiers: [{
      id: 'general',
      name: 'General',
      capacity: 80,
      sold: 20,
      phases: [
        { name: 'Free Entry', price: 0, active: true },
      ],
      includes: ['Acceso libre', 'Brunch incluido'],
    }],
  },
};

// ── Also check for promo events (WHP Lima, FABRICLIMA) ──
const promoIds = ['whp-lima', 'fabriclima-001'];
for (const ev of events) {
  if (!updates[ev.id] && !promoIds.includes(ev.id)) {
    // Check for any other events we missed
    const slug = ev.slug || ev.id;
    if (!updates[slug]) {
      console.log(`\n  ⚠️  No tier update defined for: ${ev.id} ("${ev.name}")`);
    }
  }
}

// Find WHP and FABRICLIMA by partial ID match
for (const ev of events) {
  const id = ev.id.toLowerCase();
  if ((id.includes('whp') || id.includes('warehouse-project')) && !updates[ev.id]) {
    console.log(`\n  Found WHP event: ${ev.id}`);
    updates[ev.id] = {
      tiers: [{
        id: 'general',
        name: 'General',
        capacity: 600,
        sold: 50,
        phases: [
          { name: 'Preventa', price: 200, active: true },
          { name: 'Regular', price: 320, active: false },
          { name: 'Puerta', price: 400, active: false },
        ],
        includes: ['Acceso general', 'Warehouse experience'],
      }],
    };
  }
  if ((id.includes('fabriclima') || id.includes('fabric')) && !updates[ev.id]) {
    console.log(`\n  Found FABRICLIMA event: ${ev.id}`);
    updates[ev.id] = {
      tiers: [
        {
          id: 'general',
          name: 'General',
          capacity: 350,
          sold: 350,
          phases: [
            { name: 'Regular', price: 280, active: false },
          ],
          includes: ['Acceso general'],
        },
      ],
    };
  }
}

// Also add the LEZGO v2 Launch event — 3 sequential tiers with Gold/Silver/Bronze badges
// Tickets #001-#015 reserved for the company, public starts at #016
// Tier 1 (Gold):   #016 - #050 (35 public tickets)
// Tier 2 (Silver): #051 - #100 (50 tickets, unlocks when Tier 1 sells out)
// Tier 3 (Bronze): #101+       (unlocks when Tier 2 sells out)
let lezgoEventId = null;
for (const ev of events) {
  if (ev.name?.toLowerCase().includes('lezgo') && !updates[ev.id]) {
    console.log(`\n  Found LEZGO event: ${ev.id}`);
    lezgoEventId = ev.id;
    updates[ev.id] = {
      // Update date to April 5, 2026
      date: new Date('2026-04-05T20:00:00-05:00'),
      dateLabel: 'Domingo, 5 de abril de 2026',
      tiers: [
        {
          id: 'gold',
          name: 'Gold',
          capacity: 35,
          sold: 0,
          phases: [
            { name: 'Launch', price: 0, active: true },
          ],
          includes: ['Badge Oro numerado', 'Acceso prioritario', 'Beneficios exclusivos', 'Early Adopter perks'],
          badgeType: 'gold',
        },
        {
          id: 'silver',
          name: 'Silver',
          capacity: 50,
          sold: 0,
          phases: [
            { name: 'Launch', price: 0, active: true },
          ],
          includes: ['Badge Plata numerado', 'Acceso prioritario', 'Beneficios exclusivos'],
          unlockAfterTier: 'gold',
          badgeType: 'silver',
        },
        {
          id: 'bronze',
          name: 'Bronze',
          capacity: 100,
          sold: 0,
          phases: [
            { name: 'Launch', price: 0, active: true },
          ],
          includes: ['Badge Bronce numerado', 'Acceso general'],
          unlockAfterTier: 'silver',
          badgeType: 'bronze',
        },
      ],
      badgeConfig: {
        type: 'early-adopter',
        label: 'Early Adopter',
        totalSupply: 185,  // 15 reserved + 35 gold + 50 silver + 100 bronze = 200 (but public = 185)
        emoji: '⚡',
      },
    };
  }
}

// ── Step 3: Apply updates ──
console.log('\n🔄 Applying tier updates...\n');

let success = 0;
let errors = 0;

for (const [eventId, data] of Object.entries(updates)) {
  try {
    const ref = doc(db, 'events', eventId);
    await updateDoc(ref, data);
    console.log(`  ✅ ${eventId}`);
    success++;
  } catch (err) {
    console.log(`  ❌ ${eventId}: ${err.message}`);
    errors++;
  }
}

// ── Step 4: Initialize badge counter for LEZGO event ──
if (lezgoEventId) {
  console.log('\n🎖️  Setting up Early Adopter badge counter...');
  try {
    const counterRef = doc(db, 'badgeCounters', lezgoEventId);
    // Start at 16 — badges #001-#015 are reserved
    await setDoc(counterRef, {
      eventId: lezgoEventId,
      nextNumber: 16,
    });
    console.log(`  ✅ Badge counter initialized at #016 (badges #001-#015 reserved)`);
  } catch (err) {
    console.log(`  ❌ Badge counter: ${err.message}`);
  }
}

console.log(`\n✨ Done! ${success} updated, ${errors} errors.\n`);
process.exit(0);
