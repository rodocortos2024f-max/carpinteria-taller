import { 
  collection, 
  doc, 
  setDoc, 
  getDocs, 
  deleteDoc, 
  updateDoc, 
  onSnapshot, 
  query, 
  orderBy,
  Unsubscribe 
} from 'firebase/firestore';
import { initializeApp, deleteApp, FirebaseApp } from 'firebase/app';
import { 
  getAuth,
  createUserWithEmailAndPassword, 
  signOut
} from 'firebase/auth';
import config from '../../firebase-applet-config.json';
import { db, auth } from '../lib/firebase';
import { WorkshopTenant } from '../types';
import { recordSuccessfulFirebaseValidation } from './licenseSecurity';

export const WORKSHOPS_COLLECTION = 'workshops';
const LOCAL_WORKSHOPS_CACHE_KEY = 'carpinteria_firebase_workshops_v1';
const LEGACY_STORAGE_KEY = 'carpinteria_tenants_v1';

export interface FirebaseSyncState {
  isListening: boolean;
  lastSyncTimestamp: number;
  lastSyncFormatted: string;
  source: 'firestore_realtime' | 'firestore_cache' | 'offline';
  totalWorkshops: number;
  error?: string | null;
}

let activeSnapshotUnsubscribe: Unsubscribe | null = null;

/**
 * Register user in Firebase Authentication safely using an isolated secondary App instance
 * to avoid signing out or overriding the active Super Admin session.
 */
export async function registerFirebaseUser(email: string, password?: string): Promise<{ success: boolean; uid?: string; error?: string }> {
  let secondaryApp: FirebaseApp | null = null;
  try {
    const cleanEmail = email.trim().toLowerCase();
    const securePass = password && password.length >= 6 ? password : 'taller2026';
    
    // Create an isolated secondary app instance to preserve current super admin auth session
    const secondaryAppName = `authWorker_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    secondaryApp = initializeApp(config, secondaryAppName);
    const secondaryAuth = getAuth(secondaryApp);

    const userCredential = await createUserWithEmailAndPassword(secondaryAuth, cleanEmail, securePass);
    const uid = userCredential.user.uid;

    try {
      await signOut(secondaryAuth);
    } catch (_) {}

    return { success: true, uid };
  } catch (error: any) {
    // If email already exists or in use, treat as success/existing without failing the workshop creation
    if (error?.code === 'auth/email-already-in-use') {
      return { success: true, error: 'Email ya registrado en Firebase Auth' };
    }
    console.warn('Firebase Auth user registration note:', error?.message || error);
    return { success: false, error: error?.message || 'Error al registrar en Auth' };
  } finally {
    if (secondaryApp) {
      try {
        await deleteApp(secondaryApp);
      } catch (_) {}
    }
  }
}

/**
 * Save / Create Workshop in Firestore and register its users in Firebase Auth
 */
export async function saveWorkshopToFirestore(tenant: WorkshopTenant): Promise<{ success: boolean; message: string }> {
  try {
    // 1. Register Master Account in Firebase Auth using isolated secondary instance
    if (tenant.masterAccount?.email) {
      await registerFirebaseUser(tenant.masterAccount.email, tenant.masterAccount.password);
    }

    // 2. Register Operator Account in Firebase Auth (if present) using isolated secondary instance
    if (tenant.operatorAccount?.email) {
      await registerFirebaseUser(tenant.operatorAccount.email, tenant.operatorAccount.password);
    }

    // 3. Persist Workshop Document in Firestore
    if (db) {
      const docRef = doc(db, WORKSHOPS_COLLECTION, tenant.id);
      // Clean undefined values before writing to Firestore
      const cleanData = JSON.parse(JSON.stringify(tenant));
      await setDoc(docRef, cleanData, { merge: true });
    } else {
      throw new Error('No se pudo inicializar la conexión con Firestore.');
    }

    // 4. Update local cache & dispatch
    updateLocalWorkshopCache(tenant);
    recordSuccessfulFirebaseValidation('firestore_save_workshop');

    return {
      success: true,
      message: `Taller "${tenant.name}" guardado exitosamente en Firestore y usuarios registrados en Firebase Auth.`
    };
  } catch (error: any) {
    console.error('Error saving workshop to Firestore:', error);
    // Keep local cache fallback
    updateLocalWorkshopCache(tenant);
    throw error;
  }
}

/**
 * Update Workshop in Firestore
 */
export async function updateWorkshopInFirestore(tenantId: string, updates: Partial<WorkshopTenant>): Promise<{ success: boolean }> {
  try {
    if (db) {
      const docRef = doc(db, WORKSHOPS_COLLECTION, tenantId);
      const cleanUpdates = JSON.parse(JSON.stringify(updates));
      await updateDoc(docRef, cleanUpdates);
    }

    // Update in local cache
    const current = getWorkshopsFromLocalCache();
    const idx = current.findIndex(w => w.id === tenantId);
    if (idx >= 0) {
      current[idx] = { ...current[idx], ...updates };
      saveWorkshopsToLocalCache(current);
    }

    recordSuccessfulFirebaseValidation('firestore_update_workshop');
    return { success: true };
  } catch (error: any) {
    console.error('Error updating workshop in Firestore:', error);
    // Local fallback update
    const current = getWorkshopsFromLocalCache();
    const idx = current.findIndex(w => w.id === tenantId);
    if (idx >= 0) {
      current[idx] = { ...current[idx], ...updates };
      saveWorkshopsToLocalCache(current);
    }
    return { success: false };
  }
}

/**
 * Delete Workshop from Firestore
 */
export async function deleteWorkshopFromFirestore(tenantId: string): Promise<{ success: boolean }> {
  try {
    if (db) {
      const docRef = doc(db, WORKSHOPS_COLLECTION, tenantId);
      await deleteDoc(docRef);
    }

    // Remove from local cache
    const current = getWorkshopsFromLocalCache();
    const filtered = current.filter(w => w.id !== tenantId);
    saveWorkshopsToLocalCache(filtered);

    // Clean tenant scoped storage
    if (typeof window !== 'undefined') {
      localStorage.removeItem(`carpinteria_projects_${tenantId}`);
      localStorage.removeItem(`carpinteria_offcuts_${tenantId}`);
      localStorage.removeItem(`carpinteria_logs_${tenantId}`);
    }

    recordSuccessfulFirebaseValidation('firestore_delete_workshop');
    return { success: true };
  } catch (error: any) {
    console.error('Error deleting workshop from Firestore:', error);
    const current = getWorkshopsFromLocalCache();
    const filtered = current.filter(w => w.id !== tenantId);
    saveWorkshopsToLocalCache(filtered);
    return { success: false };
  }
}

/**
 * Subscribe in real-time to Firestore workshops collection (onSnapshot)
 */
export function subscribeToWorkshopsRealtime(
  onWorkshopsChanged: (workshops: WorkshopTenant[]) => void,
  onError?: (error: any) => void
): () => void {
  if (!db) {
    // If no db, provide local cached workshops immediately
    const cached = getWorkshopsFromLocalCache();
    onWorkshopsChanged(cached);
    return () => {};
  }

  try {
    if (activeSnapshotUnsubscribe) {
      activeSnapshotUnsubscribe();
    }

    const workshopsRef = collection(db, WORKSHOPS_COLLECTION);
    const q = query(workshopsRef, orderBy('createdAt', 'desc'));

    activeSnapshotUnsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const workshops: WorkshopTenant[] = [];
        snapshot.forEach((docSnap) => {
          const data = docSnap.data() as WorkshopTenant;
          workshops.push({ ...data, id: docSnap.id });
        });

        // Save to cache for offline availability
        saveWorkshopsToLocalCache(workshops);
        recordSuccessfulFirebaseValidation('firestore_onSnapshot_sync');

        onWorkshopsChanged(workshops);
      },
      (error) => {
        console.warn('Firestore onSnapshot subscription notice:', error);
        if (onError) onError(error);
        // Fallback to local cache
        const cached = getWorkshopsFromLocalCache();
        onWorkshopsChanged(cached);
      }
    );

    return () => {
      if (activeSnapshotUnsubscribe) {
        activeSnapshotUnsubscribe();
        activeSnapshotUnsubscribe = null;
      }
    };
  } catch (err) {
    console.error('Error establishing Firestore onSnapshot:', err);
    const cached = getWorkshopsFromLocalCache();
    onWorkshopsChanged(cached);
    return () => {};
  }
}

/**
 * Fetch all workshops once from Firestore
 */
export async function fetchWorkshopsOnce(): Promise<WorkshopTenant[]> {
  try {
    if (db) {
      const workshopsRef = collection(db, WORKSHOPS_COLLECTION);
      const snapshot = await getDocs(workshopsRef);
      const workshops: WorkshopTenant[] = [];
      snapshot.forEach((docSnap) => {
        const data = docSnap.data() as WorkshopTenant;
        workshops.push({ ...data, id: docSnap.id });
      });

      if (workshops.length > 0) {
        saveWorkshopsToLocalCache(workshops);
        recordSuccessfulFirebaseValidation('firestore_getDocs');
        return workshops;
      }
    }
  } catch (error) {
    console.warn('Error fetching workshops from Firestore once:', error);
  }

  return getWorkshopsFromLocalCache();
}

/**
 * Helper to get workshops from local cache (clean initial empty state, no fake mock items)
 */
export function getWorkshopsFromLocalCache(): WorkshopTenant[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(LOCAL_WORKSHOPS_CACHE_KEY) || localStorage.getItem(LEGACY_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        return parsed;
      }
    }
  } catch (e) {
    console.error('Error reading local workshop cache:', e);
  }
  return [];
}

/**
 * Helper to save workshops into local caches
 */
export function saveWorkshopsToLocalCache(workshops: WorkshopTenant[]): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(LOCAL_WORKSHOPS_CACHE_KEY, JSON.stringify(workshops));
    localStorage.setItem(LEGACY_STORAGE_KEY, JSON.stringify(workshops));
    window.dispatchEvent(new CustomEvent('carpinteria_tenants_change', { detail: { tenants: workshops } }));
  } catch (e) {
    console.error('Error saving workshops to local cache:', e);
  }
}

/**
 * Helper to upsert a workshop into local cache
 */
function updateLocalWorkshopCache(tenant: WorkshopTenant): void {
  const current = getWorkshopsFromLocalCache();
  const idx = current.findIndex(w => w.id === tenant.id);
  let updated: WorkshopTenant[];
  if (idx >= 0) {
    updated = [...current];
    updated[idx] = { ...tenant };
  } else {
    updated = [tenant, ...current];
  }
  saveWorkshopsToLocalCache(updated);
}
