import { initializeApp, getApps, FirebaseApp } from "firebase/app";
import { getAuth, GoogleAuthProvider, Auth } from "firebase/auth";
import { getFirestore, Firestore } from "firebase/firestore";

// Helper function to safely read environment variables from various sources (Vite, CRA, etc.)
const getEnv = (key: string) => {
  // Try Vite's import.meta.env
  // @ts-ignore
  if (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env[key]) {
    // @ts-ignore
    return import.meta.env[key];
  }
  // Try Standard process.env
  // @ts-ignore
  if (typeof process !== 'undefined' && process.env && process.env[key]) {
    return process.env[key];
  }
  return undefined;
};

// Attempt to retrieve keys using common prefixes
const apiKey = getEnv('REACT_APP_FIREBASE_API_KEY') || getEnv('VITE_FIREBASE_API_KEY');
const authDomain = getEnv('REACT_APP_FIREBASE_AUTH_DOMAIN') || getEnv('VITE_FIREBASE_AUTH_DOMAIN');
const projectId = getEnv('REACT_APP_FIREBASE_PROJECT_ID') || getEnv('VITE_FIREBASE_PROJECT_ID');
const storageBucket = getEnv('REACT_APP_FIREBASE_STORAGE_BUCKET') || getEnv('VITE_FIREBASE_STORAGE_BUCKET');
const messagingSenderId = getEnv('REACT_APP_FIREBASE_MESSAGING_SENDER_ID') || getEnv('VITE_FIREBASE_MESSAGING_SENDER_ID');
const appId = getEnv('REACT_APP_FIREBASE_APP_ID') || getEnv('VITE_FIREBASE_APP_ID');

const firebaseConfig = {
  apiKey,
  authDomain,
  projectId,
  storageBucket,
  messagingSenderId,
  appId
};

let app: FirebaseApp | undefined;
let auth: Auth | undefined;
let db: Firestore | undefined;
const googleProvider = new GoogleAuthProvider();

// Initialize Firebase ONLY if the API key is present
if (apiKey && apiKey !== 'undefined') {
  try {
    // Check if app is already initialized to avoid duplicates in hot-reload
    app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];
    auth = getAuth(app);
    db = getFirestore(app);
  } catch (error) {
    console.error("Firebase Initialization Failed:", error);
  }
} else {
  console.warn("Firebase API Key not found in environment variables. App running in offline/demo mode.");
}

export { auth, googleProvider, db };
