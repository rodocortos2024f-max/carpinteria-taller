import { initializeApp, getApps, getApp, FirebaseApp } from 'firebase/app';
import { getAuth, Auth } from 'firebase/auth';
import { getFirestore, Firestore } from 'firebase/firestore';
import config from '../../firebase-applet-config.json';

let app: FirebaseApp;
let auth: Auth;
let db: Firestore;

try {
  if (!getApps().length) {
    app = initializeApp(config);
  } else {
    app = getApp();
  }
  auth = getAuth(app);
  // Using custom or default database
  const dbId = (config as any).firestoreDatabaseId;
  db = dbId && dbId !== '(default)' ? getFirestore(app, dbId) : getFirestore(app);
} catch (error) {
  console.error('Firebase initialization error:', error);
}

export { app, auth, db };
export default app;
