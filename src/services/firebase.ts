import { getApp, getApps, initializeApp } from "firebase/app";
import { Firestore, getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.EXPO_PUBLIC_FIREBASE_APP_ID,
};

function getMissingFirebaseKeys() {
  return Object.entries(firebaseConfig)
    .filter(([, value]) => typeof value !== "string" || value.length === 0)
    .map(([key]) => key);
}

function isFirebaseConfigured() {
  return getMissingFirebaseKeys().length === 0;
}

let db: Firestore | null = null;

if (isFirebaseConfigured()) {
  const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
  db = getFirestore(app);
}

export function ensureFirestoreConfigured(): Firestore {
  if (!db) {
    const missing = getMissingFirebaseKeys();
    const details = missing.length > 0 ? ` Missing keys: ${missing.join(", ")}.` : "";
    throw new Error(`Firebase is not configured.${details} Restart Expo after updating .env.`);
  }
  return db;
}
