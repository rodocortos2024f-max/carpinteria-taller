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
import { db } from '../lib/firebase';
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
 * Save / Create Workshop directly in Firestore collection('workshops') with zero Firebase Auth dependencies.
 * Stores a unified document with workshop details, maestro { email, password, role: 'MAESTRO' },
 * operario { email, password, role: 'OPERARIO' }, and estado: 'activo'.
 */
export async function saveWorkshopToFirestore(tenant: WorkshopTenant): Promise<{ success: boolean; message: string }> {
  try {
    if (!db) {
      throw new Error('No se pudo inicializar la conexión con Firestore. Revisa la configuración de Firebase.');
    }

    const workshopsCollectionRef = collection(db, WORKSHOPS_COLLECTION);
    const docRef = doc(workshopsCollectionRef, tenant.id);

    // Format consistent document for Option A (Direct Firestore)
    const estado = tenant.estado || (tenant.status === 'suspendida' ? 'suspendido' : tenant.status === 'vencida' ? 'vencido' : 'activo');
    const maestroObj = {
      id: tenant.masterAccount?.id || `usr_${tenant.id}_m`,
      name: tenant.masterAccount?.name || tenant.ownerName || 'Maestro Encargado',
      email: tenant.masterAccount?.email?.trim().toLowerCase(),
      password: tenant.masterAccount?.password || 'taller2026',
      role: 'MAESTRO' as const
    };

    const operarioObj = tenant.operatorAccount ? {
      id: tenant.operatorAccount.id || `usr_${tenant.id}_op`,
      name: tenant.operatorAccount.name || 'Operario de Taller',
      email: tenant.operatorAccount.email?.trim().toLowerCase(),
      password: tenant.operatorAccount.password || 'chalan2026',
      role: 'OPERARIO' as const
    } : null;

    const firestoreDocumentData: WorkshopTenant = {
      ...tenant,
      estado,
      status: tenant.status || 'activa',
      maestro: maestroObj,
      operario: operarioObj,
      masterAccount: {
        id: maestroObj.id,
        name: maestroObj.name,
        email: maestroObj.email,
        password: maestroObj.password,
        role: 'maestro'
      },
      operatorAccount: operarioObj ? {
        id: operarioObj.id,
        name: operarioObj.name,
        email: operarioObj.email,
        password: operarioObj.password,
        role: 'operario'
      } : undefined
    };

    // Clean undefined values before writing to Firestore
    const cleanData = JSON.parse(JSON.stringify(firestoreDocumentData));
    await setDoc(docRef, cleanData, { merge: true });

    // Update local cache & dispatch
    updateLocalWorkshopCache(firestoreDocumentData);
    recordSuccessfulFirebaseValidation('firestore_save_workshop_direct');

    return {
      success: true,
      message: `Taller "${tenant.name}" guardado directamente en Firestore con éxito.`
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
    // Keep estado and status synchronized
    const normalizedUpdates: any = { ...updates };
    if (updates.status) {
      normalizedUpdates.estado = updates.status === 'suspendida' ? 'suspendido' : updates.status === 'vencida' ? 'vencido' : 'activo';
    } else if (updates.estado) {
      normalizedUpdates.status = updates.estado === 'suspendido' ? 'suspendida' : updates.estado === 'vencido' ? 'vencida' : 'activa';
    }

    if (updates.masterAccount) {
      normalizedUpdates.maestro = {
        id: updates.masterAccount.id,
        name: updates.masterAccount.name,
        email: updates.masterAccount.email?.trim().toLowerCase(),
        password: updates.masterAccount.password,
        role: 'MAESTRO'
      };
    }

    if (updates.operatorAccount !== undefined) {
      normalizedUpdates.operario = updates.operatorAccount ? {
        id: updates.operatorAccount.id,
        name: updates.operatorAccount.name,
        email: updates.operatorAccount.email?.trim().toLowerCase(),
        password: updates.operatorAccount.password,
        role: 'OPERARIO'
      } : null;
    }

    if (db) {
      const docRef = doc(db, WORKSHOPS_COLLECTION, tenantId);
      const cleanUpdates = JSON.parse(JSON.stringify(normalizedUpdates));
      await updateDoc(docRef, cleanUpdates);
    }

    // Update in local cache
    const current = getWorkshopsFromLocalCache();
    const idx = current.findIndex(w => w.id === tenantId);
    if (idx >= 0) {
      current[idx] = { ...current[idx], ...normalizedUpdates };
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
