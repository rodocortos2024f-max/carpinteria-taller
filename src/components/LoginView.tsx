import React, { useState, useEffect } from 'react';
import { User } from '../types';
import { authenticateUserCredentials } from '../utils/tenants';
import { fetchWorkshopsOnce } from '../utils/firebaseWorkshops';
import {
  checkOfflineLicenseStatus,
  getOfflineLockoutMessage,
  clearOfflineLockoutMessage,
  revalidateLicenseWithFirebase,
  recordSuccessfulFirebaseValidation
} from '../utils/licenseSecurity';
import {
  Mail,
  Lock,
  LogIn,
  Eye,
  EyeOff,
  AlertTriangle,
  Wifi,
  WifiOff,
  RefreshCw,
  CheckCircle,
  Clock,
  ShieldAlert
} from 'lucide-react';

interface LoginViewProps {
  onLogin: (user: User) => void;
}

export const LoginView: React.FC<LoginViewProps> = ({ onLogin }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isRevalidating, setIsRevalidating] = useState(false);
  const [revalidationNotice, setRevalidationNotice] = useState<string | null>(null);

  const [offlineStatus, setOfflineStatus] = useState(() => checkOfflineLicenseStatus());
  const [lockoutMsg, setLockoutMsg] = useState<string | null>(() => getOfflineLockoutMessage());

  useEffect(() => {
    const updateStatus = () => {
      setOfflineStatus(checkOfflineLicenseStatus());
      setLockoutMsg(getOfflineLockoutMessage());
    };

    window.addEventListener('online', updateStatus);
    window.addEventListener('offline', updateStatus);
    window.addEventListener('carpinteria_firebase_validation_updated', updateStatus);

    return () => {
      window.removeEventListener('online', updateStatus);
      window.removeEventListener('offline', updateStatus);
      window.removeEventListener('carpinteria_firebase_validation_updated', updateStatus);
    };
  }, []);

  const handleRevalidateLicense = async () => {
    setIsRevalidating(true);
    setRevalidationNotice(null);
    const result = await revalidateLicenseWithFirebase();
    setIsRevalidating(false);

    if (result.success) {
      clearOfflineLockoutMessage();
      setLockoutMsg(null);
      setErrorMsg('');
      setRevalidationNotice(result.message);
      setOfflineStatus(checkOfflineLicenseStatus());
    } else {
      setErrorMsg(result.message);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setRevalidationNotice(null);

    if (!email || !password) {
      setErrorMsg('Por favor ingrese su correo electrónico y contraseña.');
      return;
    }

    setIsLoading(true);

    try {
      // Sync fresh workshop documents directly from Firestore if device is online
      const isOnline = typeof navigator !== 'undefined' ? navigator.onLine : true;
      if (isOnline) {
        try {
          await fetchWorkshopsOnce();
        } catch (_) {}
      }

      const authResult = authenticateUserCredentials(email, password);

      if (!authResult.success) {
        setErrorMsg(authResult.errorMessage || 'Credenciales inválidas. Por favor verifique correo y contraseña.');
        return;
      }

      if (authResult.user) {
        clearOfflineLockoutMessage();
        onLogin(authResult.user);
      }
    } catch (err: any) {
      setErrorMsg('Error al verificar credenciales con Firestore: ' + (err?.message || err));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-[calc(100vh-6rem)] flex items-center justify-center p-4 sm:p-6 lg:p-8">
      <div className="w-full max-w-xl bg-white rounded-3xl shadow-2xl border-4 border-amber-800/20 overflow-hidden">
        
        {/* Banner Header */}
        <div className="bg-gradient-to-r from-amber-950 via-amber-900 to-amber-950 p-6 sm:p-8 text-center text-white border-b-4 border-amber-600 relative">
          <div className="inline-flex p-3.5 bg-amber-600 text-amber-950 rounded-2xl mb-3 shadow-xl border-2 border-amber-300">
            <span className="text-4xl sm:text-5xl">🪵</span>
          </div>
          <h2 className="text-3xl sm:text-4xl font-black tracking-tight text-white mb-2">
            SISTEMA MULTI-TALLER
          </h2>
          <p className="text-base sm:text-lg font-bold text-amber-200">
            Ingreso y Aislamiento Seguro de Datos por Taller
          </p>
        </div>

        {/* Login Form */}
        <div className="p-6 sm:p-8 space-y-6">
          
          {/* Critical 24h Offline Lockout Alert */}
          {(lockoutMsg || (offlineStatus.isExpired && !offlineStatus.isOnline)) && (
            <div className="bg-rose-50 border-4 border-rose-600 p-5 rounded-2xl text-rose-950 shadow-lg space-y-3">
              <div className="flex items-start gap-3">
                <ShieldAlert className="w-8 h-8 text-rose-600 shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-black text-lg text-rose-900 leading-tight">
                    CADUCIDAD DE LICENCIA OFFLINE (LÍMITE 24 HORAS)
                  </h4>
                  <p className="text-sm font-bold text-rose-800 mt-1 leading-relaxed">
                    {lockoutMsg || `Han transcurrido más de 24 horas continuas sin conexión a internet desde la última validación exitosa con Firebase. Para reanudar el trabajo en el taller, conecte el dispositivo a internet para revalidar la licencia del taller.`}
                  </p>
                </div>
              </div>

              {/* Revalidation Action Button */}
              <div className="pt-2">
                <button
                  type="button"
                  onClick={handleRevalidateLicense}
                  disabled={isRevalidating}
                  className="w-full bg-rose-700 hover:bg-rose-800 text-white font-black py-3 px-4 rounded-xl border-2 border-rose-950 shadow flex items-center justify-center gap-2 text-base cursor-pointer disabled:opacity-50 transition"
                >
                  <RefreshCw className={`w-5 h-5 ${isRevalidating ? 'animate-spin' : ''}`} />
                  {isRevalidating ? 'REVALIDANDO CONEXIÓN...' : 'REVALIDAR LICENCIA CON INTERNET'}
                </button>
              </div>
            </div>
          )}

          {/* Success Revalidation Notice */}
          {revalidationNotice && (
            <div className="bg-emerald-50 border-3 border-emerald-500 p-4 rounded-2xl text-emerald-950 text-sm font-bold flex items-start gap-3">
              <CheckCircle className="w-6 h-6 text-emerald-600 shrink-0 mt-0.5" />
              <div>
                <p className="font-black text-base text-emerald-900">¡Licencia Revalidada Exitosamente!</p>
                <p className="text-emerald-800">{revalidationNotice}</p>
              </div>
            </div>
          )}

          {/* Standard Form Error */}
          {errorMsg && (
            <div className="bg-rose-100 border-l-8 border-rose-600 p-4 rounded-2xl text-rose-900 text-base font-bold flex items-start gap-3">
              <AlertTriangle className="w-6 h-6 text-rose-600 shrink-0 mt-0.5" />
              <div>
                <p className="font-black text-lg">Atención:</p>
                <p>{errorMsg}</p>
              </div>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            
            {/* Field 1: Email */}
            <div>
              <label className="block text-lg font-black text-slate-900 mb-2 flex items-center gap-2">
                <Mail className="w-5 h-5 text-amber-700" />
                Correo Electrónico de Acceso:
              </label>
              <div className="relative">
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="ejemplo@taller.com"
                  required
                  className="w-full text-lg sm:text-xl p-4 rounded-2xl border-4 border-slate-300 focus:border-amber-600 focus:ring-4 focus:ring-amber-200 font-bold text-slate-900 bg-slate-50 placeholder:text-slate-400 outline-none"
                />
              </div>
            </div>

            {/* Field 2: Password */}
            <div>
              <label className="block text-lg font-black text-slate-900 mb-2 flex items-center gap-2">
                <Lock className="w-5 h-5 text-amber-700" />
                Contraseña:
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••••••"
                  required
                  className="w-full text-lg sm:text-xl p-4 rounded-2xl border-4 border-slate-300 focus:border-amber-600 focus:ring-4 focus:ring-amber-200 font-bold text-slate-900 bg-slate-50 placeholder:text-slate-400 pr-16 outline-none"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-600 hover:text-amber-700 p-2 font-bold cursor-pointer"
                  title={showPassword ? 'Ocultar contraseña' : 'Ver contraseña'}
                >
                  {showPassword ? <EyeOff className="w-6 h-6" /> : <Eye className="w-6 h-6" />}
                </button>
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-gradient-to-r from-orange-600 via-amber-600 to-orange-700 hover:from-orange-500 hover:via-amber-500 hover:to-orange-600 text-white border-4 border-amber-950 ring-2 ring-amber-300/70 active:from-orange-700 active:to-amber-800 shadow-2xl shadow-orange-900/40 py-5 text-xl sm:text-2xl font-black tracking-wider rounded-2xl uppercase mt-6 flex items-center justify-center gap-3 cursor-pointer transition-all duration-200 transform hover:-translate-y-0.5 active:translate-y-0 active:scale-[0.99]"
            >
              <LogIn className="w-7 h-7 sm:w-8 sm:h-8 text-amber-200 shrink-0 filter drop-shadow" />
              <span className="drop-shadow-md">{isLoading ? 'VERIFICANDO CREDENCIALES...' : 'INICIAR SESIÓN'}</span>
            </button>
          </form>

          {/* Discreet PWA Indicator */}
          <div className="pt-2 flex items-center justify-center gap-2 text-xs font-semibold text-slate-400 select-none">
            <span className={`inline-block w-2 h-2 rounded-full ${offlineStatus.isOnline ? 'bg-emerald-500' : 'bg-slate-400'}`}></span>
            <span>Modo PWA 24</span>
          </div>

        </div>

      </div>
    </div>
  );
};
