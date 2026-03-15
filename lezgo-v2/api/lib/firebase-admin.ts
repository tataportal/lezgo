import { initializeApp, getApps, cert, type App } from 'firebase-admin/app';
import { getFirestore, type Firestore } from 'firebase-admin/firestore';
import { getAuth, type Auth } from 'firebase-admin/auth';

let app: App;
let db: Firestore;
let adminAuth: Auth;

function initialize() {
  if (getApps().length > 0) {
    app = getApps()[0];
  } else {
    // In production, use service account from env vars
    // In dev, can use GOOGLE_APPLICATION_CREDENTIALS file path
    const projectId = process.env.FIREBASE_PROJECT_ID || process.env.VITE_FIREBASE_PROJECT_ID;
    const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
    const privateKey = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n');

    if (clientEmail && privateKey) {
      app = initializeApp({
        credential: cert({ projectId, clientEmail, privateKey }),
      });
    } else {
      // Fallback: uses GOOGLE_APPLICATION_CREDENTIALS or default credentials
      app = initializeApp({ projectId });
    }
  }

  db = getFirestore(app);
  adminAuth = getAuth(app);
}

export function getAdminDb(): Firestore {
  if (!db) initialize();
  return db;
}

export function getAdminAuth(): Auth {
  if (!adminAuth) initialize();
  return adminAuth;
}
