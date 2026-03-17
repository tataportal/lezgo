/**
 * Firebase Admin SDK initialization for Cloudflare Workers.
 * Uses environment variables from Cloudflare Pages settings.
 *
 * Requires `nodejs_compat` compatibility flag in wrangler.toml.
 */

import { initializeApp, getApps, cert, type App } from 'firebase-admin/app';
import { getFirestore, type Firestore } from 'firebase-admin/firestore';
import { getAuth, type Auth } from 'firebase-admin/auth';
import type { Env } from './types.js';

let app: App;
let db: Firestore;
let adminAuth: Auth;

function initialize(env: Env) {
  if (getApps().length > 0) {
    app = getApps()[0];
  } else {
    const projectId = env.FIREBASE_PROJECT_ID;
    const clientEmail = env.FIREBASE_CLIENT_EMAIL;
    const privateKey = env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n');

    if (clientEmail && privateKey) {
      app = initializeApp({
        credential: cert({ projectId, clientEmail, privateKey }),
      });
    } else {
      app = initializeApp({ projectId });
    }
  }

  db = getFirestore(app);
  adminAuth = getAuth(app);
}

export function getAdminDb(env: Env): Firestore {
  if (!db) initialize(env);
  return db;
}

export function getAdminAuth(env: Env): Auth {
  if (!adminAuth) initialize(env);
  return adminAuth;
}
