import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "AIzaSyDPUyIOfSKa1b9Cn4ExMhmAhacsOzfgu8A",
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "lezgo-ticketingapp.firebaseapp.com",
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "lezgo-ticketingapp",
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "lezgo-ticketingapp.firebasestorage.app",
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "218719712607",
  appId: import.meta.env.VITE_FIREBASE_APP_ID || "1:218719712607:web:2c9bd08b0f177f7d8932ea",
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID || "G-5WY8YPW3MV",
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
export default app;
