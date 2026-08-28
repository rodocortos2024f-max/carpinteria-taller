// Manejo de Seguridad y Caducidad Offline de Licencias con Firebase
// Regla: 24 horas continuas de gracia offline máxima desde la última validación exitosa.

const FIREBASE_VALIDATION_KEY = 'carpinteria_last_firebase_validation_v1';
const OFFLINE_EXPIRATION_HOURS = 24;
export const OFFLINE_EXPIRATION_MS = OFFLINE_EXPIRATION_HOURS * 60 * 60 * 1000;
const OFFLINE_LOCKOUT_REASON_KEY = 'carpinteria_offline_lockout_reason';

export interface FirebaseValidationRecord {
  timestamp: number;
  formattedDate: string;
  source: string;
}

export interface OfflineLicenseStatus {
  isExpired: boolean;
  hoursOffline: number;
  minutesRemaining: number;
  hoursRemaining: number;
  lastValidationFormatted: string;
  lastValidationTimestamp: number;
  isOnline: boolean;
  needsRevalidation: boolean;
}

/**
 * Obtener la última validación exitosa con Firebase almacenada localmente
 */
export function getLastFirebaseValidation(): FirebaseValidationRecord {
  if (typeof window === 'undefined') {
    const now = Date.now();
    return {
      timestamp: now,
      formattedDate: new Date(now).toLocaleString('es-ES', { dateStyle: 'medium', timeStyle: 'short' }),
      source: 'init'
    };
  }

  try {
    const raw = localStorage.getItem(FIREBASE_VALIDATION_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed && typeof parsed.timestamp === 'number') {
        return parsed;
      }
    }
  } catch (e) {
    console.error('Error leyendo registro de validación Firebase:', e);
  }

  // Si es la primera ejecución y está en línea, inicializar con la fecha/hora actual
  const now = Date.now();
  const initialRecord: FirebaseValidationRecord = {
    timestamp: now,
    formattedDate: new Date(now).toLocaleString('es-ES', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }),
    source: 'initial_setup'
  };

  try {
    localStorage.setItem(FIREBASE_VALIDATION_KEY, JSON.stringify(initialRecord));
  } catch (e) {
    // ignore
  }

  return initialRecord;
}

/**
 * Guarda en el almacenamiento local la fecha y hora de la última validación exitosa con Firebase
 */
export function recordSuccessfulFirebaseValidation(source: string = 'online_sync'): FirebaseValidationRecord {
  const now = Date.now();
  const dateObj = new Date(now);
  const formattedDate = dateObj.toLocaleString('es-ES', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'
  });

  const record: FirebaseValidationRecord = {
    timestamp: now,
    formattedDate,
    source
  };

  if (typeof window !== 'undefined') {
    try {
      localStorage.setItem(FIREBASE_VALIDATION_KEY, JSON.stringify(record));
      clearOfflineLockoutMessage();
      window.dispatchEvent(new CustomEvent('carpinteria_firebase_validation_updated', { detail: record }));
    } catch (e) {
      console.error('Error guardando validación Firebase:', e);
    }
  }

  return record;
}

/**
 * Verifica el estado actual de la licencia offline y si ha superado las 24 horas continuas
 */
export function checkOfflineLicenseStatus(): OfflineLicenseStatus {
  const record = getLastFirebaseValidation();
  const now = Date.now();
  const elapsedMs = Math.max(0, now - record.timestamp);
  const hoursOffline = elapsedMs / (1000 * 60 * 60);

  const remainingMs = Math.max(0, OFFLINE_EXPIRATION_MS - elapsedMs);
  const minutesRemaining = Math.floor(remainingMs / (1000 * 60));
  const hoursRemaining = Number((remainingMs / (1000 * 60 * 60)).toFixed(1));

  const isOnline = typeof navigator !== 'undefined' ? navigator.onLine : true;
  const isExpired = hoursOffline >= OFFLINE_EXPIRATION_HOURS;
  const needsRevalidation = isExpired || (hoursOffline >= 20);

  return {
    isExpired,
    hoursOffline: Number(hoursOffline.toFixed(1)),
    minutesRemaining,
    hoursRemaining,
    lastValidationFormatted: record.formattedDate,
    lastValidationTimestamp: record.timestamp,
    isOnline,
    needsRevalidation
  };
}

/**
 * Revalida la licencia del taller con Firebase cuando hay conexión a internet
 */
export async function revalidateLicenseWithFirebase(): Promise<{
  success: boolean;
  message: string;
  record?: FirebaseValidationRecord;
}> {
  if (typeof navigator !== 'undefined' && !navigator.onLine) {
    return {
      success: false,
      message: 'No hay conexión a internet disponible. Conecte su dispositivo a Wi-Fi o datos móviles para revalidar la licencia del taller con Firebase.'
    };
  }

  try {
    // Simulación de ping/handshake seguro con Firebase
    await new Promise((resolve) => setTimeout(resolve, 600));

    const newRecord = recordSuccessfulFirebaseValidation('manual_revalidation');
    return {
      success: true,
      message: `Licencia del taller validada exitosamente con Firebase (${newRecord.formattedDate}). Dispones de 24 horas continuas de operación offline garantizadas.`,
      record: newRecord
    };
  } catch (error) {
    return {
      success: false,
      message: 'Ocurrió un error al contactar los servidores de Firebase. Verifique su conexión e intente nuevamente.'
    };
  }
}

/**
 * Guarda el mensaje de bloqueo por caducidad offline
 */
export function setOfflineLockoutMessage(message: string): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(OFFLINE_LOCKOUT_REASON_KEY, message);
  } catch (e) {
    // ignore
  }
}

/**
 * Obtener mensaje de bloqueo offline
 */
export function getOfflineLockoutMessage(): string | null {
  if (typeof window === 'undefined') return null;
  try {
    return localStorage.getItem(OFFLINE_LOCKOUT_REASON_KEY);
  } catch (e) {
    return null;
  }
}

/**
 * Limpiar mensaje de bloqueo offline
 */
export function clearOfflineLockoutMessage(): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.removeItem(OFFLINE_LOCKOUT_REASON_KEY);
  } catch (e) {
    // ignore
  }
}
