import React, { useState, useEffect } from 'react';
import { Flame, ShieldCheck, Database, Key, CheckCircle, Clock, Wifi, WifiOff, RefreshCw, AlertTriangle } from 'lucide-react';
import {
  checkOfflineLicenseStatus,
  getLastFirebaseValidation,
  revalidateLicenseWithFirebase,
  recordSuccessfulFirebaseValidation
} from '../utils/licenseSecurity';

interface FirebaseModalProps {
  isOpen: boolean;
  onClose: () => void;
  isConfigured: boolean;
}

export const FirebaseModal: React.FC<FirebaseModalProps> = ({
  isOpen,
  onClose,
  isConfigured
}) => {
  const [offlineStatus, setOfflineStatus] = useState(() => checkOfflineLicenseStatus());
  const [isRevalidating, setIsRevalidating] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      setOfflineStatus(checkOfflineLicenseStatus());
      setStatusMessage(null);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleManualRevalidate = async () => {
    setIsRevalidating(true);
    setStatusMessage(null);
    const res = await revalidateLicenseWithFirebase();
    setIsRevalidating(false);
    setStatusMessage(res.message);
    setOfflineStatus(checkOfflineLicenseStatus());
  };

  const handleSimulate24HoursOffline = () => {
    // Simula que la última validación ocurrió hace 25 horas
    const pastTimestamp = Date.now() - (25 * 60 * 60 * 1000);
    const record = {
      timestamp: pastTimestamp,
      formattedDate: new Date(pastTimestamp).toLocaleString('es-ES', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      }),
      source: 'test_simulation_25h'
    };
    localStorage.setItem('carpinteria_last_firebase_validation_v1', JSON.stringify(record));
    window.dispatchEvent(new CustomEvent('carpinteria_firebase_validation_updated', { detail: record }));
    setOfflineStatus(checkOfflineLicenseStatus());
    setStatusMessage('Simulación activada: Se fijó la última validación con Firebase hace 25 horas (>24h). El sistema exigirá conexión.');
  };

  const handleResetValidationNow = () => {
    recordSuccessfulFirebaseValidation('manual_reset');
    setOfflineStatus(checkOfflineLicenseStatus());
    setStatusMessage('Validación restablecida con fecha y hora actual. Tienes 24 horas continuas de gracia offline.');
  };

  return (
    <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl max-w-2xl w-full border-4 border-amber-800 shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="bg-gradient-to-r from-amber-950 via-amber-900 to-amber-950 text-white p-6 border-b-4 border-amber-600 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <Flame className="w-8 h-8 text-amber-400 animate-pulse" />
            <div>
              <h3 className="text-2xl font-black">FIREBASE & SEGURIDAD OFFLINE</h3>
              <p className="text-xs text-amber-200 font-semibold">Validación y Regla de 24 Horas de Licencia</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="bg-amber-800 hover:bg-amber-700 text-white font-black px-4 py-2 rounded-xl text-base cursor-pointer"
          >
            ✕ CERRAR
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 sm:p-8 space-y-6 overflow-y-auto">
          
          {/* Security & 24h Expiration Card */}
          <div className={`border-3 rounded-2xl p-5 ${
            offlineStatus.isExpired
              ? 'bg-rose-50 border-rose-400 text-rose-950'
              : 'bg-amber-50 border-amber-300 text-amber-950'
          }`}>
            <div className="flex items-start gap-4">
              <ShieldCheck className={`w-9 h-9 shrink-0 mt-0.5 ${offlineStatus.isExpired ? 'text-rose-600' : 'text-amber-700'}`} />
              <div className="space-y-2 flex-1">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <h4 className="text-lg sm:text-xl font-black">
                    Regla de Seguridad de Licencias Offline (24h)
                  </h4>
                  <span className={`text-xs font-black px-3 py-1 rounded-full uppercase border ${
                    offlineStatus.isExpired
                      ? 'bg-rose-200 text-rose-900 border-rose-400'
                      : 'bg-emerald-100 text-emerald-900 border-emerald-300'
                  }`}>
                    {offlineStatus.isExpired ? '⚠️ Licencia Offline Caducada (>24h)' : '✓ Licencia Offline Válida'}
                  </span>
                </div>

                <p className="text-sm font-medium leading-relaxed">
                  Para proteger las licencias del taller y permitir trabajo continuo en zonas sin señal, la aplicación almacena localmente la fecha y hora de la última validación con Firebase.
                </p>

                <div className="bg-white/80 rounded-xl p-3.5 border border-amber-200/80 space-y-1.5 text-sm">
                  <div className="flex items-center justify-between text-slate-700 font-bold">
                    <span className="flex items-center gap-1.5">
                      <Clock className="w-4 h-4 text-amber-700" />
                      Última Validación con Firebase:
                    </span>
                    <span className="font-extrabold text-slate-950">{offlineStatus.lastValidationFormatted}</span>
                  </div>
                  <div className="flex items-center justify-between text-slate-700 font-bold">
                    <span className="flex items-center gap-1.5">
                      {offlineStatus.isOnline ? <Wifi className="w-4 h-4 text-emerald-600" /> : <WifiOff className="w-4 h-4 text-rose-600" />}
                      Tiempo Transcurrido sin Conexión:
                    </span>
                    <span className={`font-extrabold ${offlineStatus.isExpired ? 'text-rose-600' : 'text-emerald-700'}`}>
                      {offlineStatus.hoursOffline} horas {offlineStatus.isExpired ? '(Límite Excedido)' : `(${offlineStatus.hoursRemaining}h restantes)`}
                    </span>
                  </div>
                </div>

                {/* Status or Action Feedback */}
                {statusMessage && (
                  <div className="p-3 bg-amber-100/90 rounded-xl border border-amber-300 text-xs font-bold text-amber-900">
                    {statusMessage}
                  </div>
                )}

                {/* Revalidate Button */}
                <div className="pt-2 flex flex-col sm:flex-row gap-2">
                  <button
                    type="button"
                    onClick={handleManualRevalidate}
                    disabled={isRevalidating}
                    className="flex-1 bg-amber-700 hover:bg-amber-800 text-white font-black text-sm py-3 px-4 rounded-xl border-2 border-amber-900 shadow flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                  >
                    <RefreshCw className={`w-4 h-4 ${isRevalidating ? 'animate-spin' : ''}`} />
                    {isRevalidating ? 'Revalidando con Firebase...' : 'Revalidar Licencia Ahora (Online)'}
                  </button>
                </div>

              </div>
            </div>
          </div>

          {/* Test & Simulation Controls */}
          <div className="bg-slate-50 p-4 rounded-2xl border-2 border-slate-200 space-y-3">
            <h5 className="text-xs font-black text-slate-600 uppercase tracking-wider flex items-center gap-1.5">
              <AlertTriangle className="w-4 h-4 text-amber-600" />
              Herramientas de Verificación de Caducidad Offline (Desarrollo / Pruebas)
            </h5>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={handleSimulate24HoursOffline}
                className="bg-rose-100 hover:bg-rose-200 text-rose-900 text-xs font-bold px-3 py-2 rounded-xl border border-rose-300 transition cursor-pointer"
              >
                Simular &gt;24h Offline (Forzar Caducidad)
              </button>
              <button
                type="button"
                onClick={handleResetValidationNow}
                className="bg-emerald-100 hover:bg-emerald-200 text-emerald-900 text-xs font-bold px-3 py-2 rounded-xl border border-emerald-300 transition cursor-pointer"
              >
                Restablecer Validación a Ahora (0h Offline)
              </button>
            </div>
          </div>

          {/* Service status info */}
          <div className="space-y-3">
            <h5 className="text-base font-black text-slate-900">Servicios Firebase Integrados:</h5>
            
            <div className="p-3.5 bg-slate-50 rounded-2xl border-2 border-slate-200 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Key className="w-5 h-5 text-amber-700" />
                <span className="text-sm font-extrabold text-slate-900">Firebase Authentication & Verificación de Licencias</span>
              </div>
              <span className="bg-emerald-100 text-emerald-900 text-xs font-black px-3 py-1 rounded-full uppercase border border-emerald-300">
                ✓ Activo
              </span>
            </div>

            <div className="p-3.5 bg-slate-50 rounded-2xl border-2 border-slate-200 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Database className="w-5 h-5 text-amber-700" />
                <span className="text-sm font-extrabold text-slate-900">Cloud Firestore (Base de Datos en Tiempo Real)</span>
              </div>
              <span className="bg-emerald-100 text-emerald-900 text-xs font-black px-3 py-1 rounded-full uppercase border border-emerald-300">
                ✓ Preparado
              </span>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-full bg-amber-700 hover:bg-amber-800 text-white font-black text-lg py-3.5 rounded-2xl border-2 border-amber-950 shadow-lg cursor-pointer"
          >
            ENTENDIDO, VOLVER AL TALLER
          </button>

        </div>

      </div>
    </div>
  );
};

