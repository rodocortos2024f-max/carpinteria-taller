import { initializeApp, getApps, getApp, FirebaseApp } from 'firebase/app';
import { getAuth, Auth } from 'firebase/auth';
import { getFirestore, Firestore } from 'firebase/firestore';
import baseConfig from '../../firebase-applet-config.json';

export interface FirebaseAppConfig {
  projectId: string;
  appId: string;
  apiKey: string;
  authDomain: string;
  firestoreDatabaseId?: string;
  storageBucket?: string;
  messagingSenderId?: string;
  measurementId?: string;
  oAuthClientId?: string;
  recaptchaSiteKey?: string;
}

/**
 * Get active Firebase Config (supports local custom overrides if provided)
 */
export function getFirebaseConfig(): FirebaseAppConfig {
  if (typeof window !== 'undefined') {
    try {
      const custom = localStorage.getItem('carpinteria_custom_firebase_config');
      if (custom) {
        const parsed = JSON.parse(custom);
        if (parsed && (parsed.projectId || parsed.apiKey)) {
          return { ...baseConfig, ...parsed };
        }
      }
    } catch (_) {}
  }
  return baseConfig as FirebaseAppConfig;
}

export const firebaseConfig = getFirebaseConfig();

let app: FirebaseApp;
let auth: Auth;
let db: Firestore;

try {
  if (!getApps().length) {
    app = initializeApp(firebaseConfig);
  } else {
    app = getApp();
  }
  auth = getAuth(app);
  
  // Connect to custom Firestore database if specified, otherwise default
  const dbId = firebaseConfig.firestoreDatabaseId;
  if (dbId && dbId !== '(default)') {
    try {
      db = getFirestore(app, dbId);
    } catch (e) {
      console.warn('Fallback to default Firestore database:', e);
      db = getFirestore(app);
    }
  } else {
    db = getFirestore(app);
  }
} catch (error) {
  console.error('Firebase initialization error:', error);
}

export { app, auth, db };
export default app;

