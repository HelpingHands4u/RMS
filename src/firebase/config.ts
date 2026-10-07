// Firebase configuration module.
// All values come from VITE_FIREBASE_* environment variables (see .env.example).
// No credentials are stored in source code.
import { initializeApp, getApps, type FirebaseApp } from "firebase/app";
import { getAuth, type Auth } from "firebase/auth";
import { getFirestore, type Firestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY as string | undefined,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN as string | undefined,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID as string | undefined,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET as string | undefined,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID as string | undefined,
  appId: import.meta.env.VITE_FIREBASE_APP_ID as string | undefined,
};

/** True when the minimum Firebase env variables are present. */
export const isFirebaseConfigured = Boolean(
  firebaseConfig.apiKey && firebaseConfig.projectId && firebaseConfig.appId,
);

let app: FirebaseApp | null = null;
let authInstance: Auth | null = null;
let dbInstance: Firestore | null = null;

export class FirebaseNotConfiguredError extends Error {
  constructor() {
    super("Firebase is not configured. Add VITE_FIREBASE_* variables (see FIREBASE_SETUP.md).");
    this.name = "FirebaseNotConfiguredError";
  }
}

function getApp(): FirebaseApp {
  if (!isFirebaseConfigured) throw new FirebaseNotConfiguredError();
  if (!app) app = getApps()[0] ?? initializeApp(firebaseConfig);
  return app;
}

/** Firebase Auth instance (browser only). */
export function getFirebaseAuth(): Auth {
  if (!authInstance) authInstance = getAuth(getApp());
  return authInstance;
}

/** Cloud Firestore instance. */
export function getDb(): Firestore {
  if (!dbInstance) dbInstance = getFirestore(getApp());
  return dbInstance;
}
