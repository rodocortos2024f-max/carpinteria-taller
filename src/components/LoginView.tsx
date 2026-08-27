import React, { useState } from 'react';
import { User, WorkshopTenant } from '../types';
import { authenticateUserCredentials } from '../utils/tenants';
import {
  Mail,
  Lock,
  LogIn,
  Flame,
  Eye,
  EyeOff,
  ShieldCheck,
  Hammer,
  Building2,
  Sparkles,
  AlertTriangle,
  Users,
  CheckCircle2
} from 'lucide-react';

interface LoginViewProps {
  onLogin: (user: User) => void;
  onOpenFirebaseModal: () => void;
}

export const LoginView: React.FC<LoginViewProps> = ({ onLogin, onOpenFirebaseModal }) => {
  const [email, setEmail] = useState('rodocortos2024f@gmail.com');
  const [password, setPassword] = useState('superadmin2026');
  const [showPassword, setShowPassword] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    if (!email || !password) {
      setErrorMsg('Por favor ingrese su correo electrónico y contraseña.');
      return;
    }

    setIsLoading(true);

    setTimeout(() => {
      setIsLoading(false);
      const authResult = authenticateUserCredentials(email, password);

      if (!authResult.success) {
        setErrorMsg(authResult.errorMessage || 'Credenciales inválidas. Por favor verifique correo y contraseña.');
        return;
      }

      if (authResult.user) {
        onLogin(authResult.user);
      }
    }, 300);
  };

  const handleQuickLogin = (presetEmail: string, presetPass: string) => {
    setEmail(presetEmail);
    setPassword(presetPass);
    setErrorMsg('');
    setIsLoading(true);

    setTimeout(() => {
      setIsLoading(false);
      const authResult = authenticateUserCredentials(presetEmail, presetPass);
      if (authResult.success && authResult.user) {
        onLogin(authResult.user);
      } else if (authResult.errorMessage) {
        setErrorMsg(authResult.errorMessage);
      }
    }, 200);
  };

  return (
    <div className="min-h-[calc(100vh-6rem)] flex items-center justify-center p-4 sm:p-6 lg:p-8">
      <div className="w-full max-w-2xl bg-white rounded-3xl shadow-2xl border-4 border-amber-800/20 overflow-hidden">
        
        {/* Banner Header */}
        <div className="bg-gradient-to-r from-amber-950 via-amber-900 to-amber-950 p-6 sm:p-10 text-center text-white border-b-4 border-amber-600 relative">
          <div className="inline-flex p-4 bg-amber-600 text-amber-950 rounded-2xl mb-4 shadow-xl border-2 border-amber-300">
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
        <div className="p-6 sm:p-10 space-y-8">
          
          {errorMsg && (
            <div className="bg-rose-100 border-l-8 border-rose-600 p-5 rounded-2xl text-rose-900 text-base font-bold flex items-start gap-3">
              <AlertTriangle className="w-6 h-6 text-rose-600 shrink-0 mt-0.5" />
              <div>
                <p className="font-black text-lg">Atención:</p>
                <p>{errorMsg}</p>
              </div>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            
            {/* Field 1: Email */}
            <div>
              <label className="block text-xl font-black text-slate-900 mb-2 flex items-center gap-2">
                <Mail className="w-6 h-6 text-amber-700" />
                Correo Electrónico de Acceso:
              </label>
              <div className="relative">
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="ejemplo@taller.com"
                  required
                  className="w-full text-lg sm:text-xl p-4 sm:p-4.5 rounded-2xl border-4 border-slate-300 focus:border-amber-600 focus:ring-4 focus:ring-amber-200 font-bold text-slate-900 bg-slate-50 placeholder:text-slate-400"
                />
              </div>
            </div>

            {/* Field 2: Password */}
            <div>
              <label className="block text-xl font-black text-slate-900 mb-2 flex items-center gap-2">
                <Lock className="w-6 h-6 text-amber-700" />
                Contraseña:
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••••••"
                  required
                  className="w-full text-lg sm:text-xl p-4 sm:p-4.5 rounded-2xl border-4 border-slate-300 focus:border-amber-600 focus:ring-4 focus:ring-amber-200 font-bold text-slate-900 bg-slate-50 placeholder:text-slate-400 pr-16"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-600 hover:text-amber-700 p-2 font-bold cursor-pointer"
                  title={showPassword ? 'Ocultar contraseña' : 'Ver contraseña'}
                >
                  {showPassword ? <EyeOff className="w-7 h-7" /> : <Eye className="w-7 h-7" />}
                </button>
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-amber-700 hover:bg-amber-800 text-white border-2 border-amber-900 active:bg-amber-900 shadow-2xl py-5 text-2xl font-black tracking-wide rounded-2xl uppercase mt-2 flex items-center justify-center gap-3 cursor-pointer transition transform active:scale-98"
            >
              <LogIn className="w-8 h-8 text-amber-300" />
              {isLoading ? 'VERIFICANDO...' : 'INICIAR SESIÓN'}
            </button>
          </form>

          {/* Quick Access Roles Selector */}
          <div className="pt-6 border-t-4 border-slate-100 space-y-4">
            <div className="flex items-center justify-between">
              <p className="text-sm font-black text-slate-700 uppercase tracking-wider flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-amber-600" />
                Acceso Rápido por Perfil (Demo Multi-Taller):
              </p>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              
              {/* Option 1: Super Admin */}
              <button
                type="button"
                onClick={() => handleQuickLogin('rodocortos2024f@gmail.com', 'superadmin2026')}
                className="bg-slate-950 hover:bg-slate-900 text-white p-4 rounded-2xl border-2 border-amber-400 text-left transition shadow-md flex items-start gap-3 cursor-pointer"
              >
                <span className="text-2xl">👑</span>
                <div>
                  <div className="flex items-center gap-1.5">
                    <p className="font-black text-sm text-amber-300">SUPER ADMIN</p>
                    <span className="text-[10px] bg-amber-400 text-slate-950 font-black px-1.5 py-0.2 rounded">Tú</span>
                  </div>
                  <p className="text-xs text-slate-300 font-medium">Panel de control, licencias y métricas globales.</p>
                </div>
              </button>

              {/* Option 2: Maestro Don José */}
              <button
                type="button"
                onClick={() => handleQuickLogin('jose.carpintero@taller.es', 'carpinteria2026')}
                className="bg-amber-50 hover:bg-amber-100 text-amber-950 p-4 rounded-2xl border-2 border-amber-300 text-left transition shadow-md flex items-start gap-3 cursor-pointer"
              >
                <span className="text-2xl">🪚</span>
                <div>
                  <p className="font-black text-sm text-amber-900">Maestro Don José (Taller 1)</p>
                  <p className="text-xs text-amber-800 font-medium">Módulos 1, 2, 3 y 4 con costos y cotización.</p>
                </div>
              </button>

              {/* Option 3: Operario / Chalán Beto */}
              <button
                type="button"
                onClick={() => handleQuickLogin('operario.jose@taller.es', 'chalan2026')}
                className="bg-orange-50 hover:bg-orange-100 text-orange-950 p-4 rounded-2xl border-2 border-orange-300 text-left transition shadow-md flex items-start gap-3 cursor-pointer"
              >
                <span className="text-2xl">🔨</span>
                <div>
                  <p className="font-black text-sm text-orange-900">Operario / Chalán (Taller 1)</p>
                  <p className="text-xs text-orange-800 font-medium">Solo M2 (Corte) y M3 (Armado). Precios ocultos.</p>
                </div>
              </button>

              {/* Option 4: Segundo Taller (Los Cedros) */}
              <button
                type="button"
                onClick={() => handleQuickLogin('carlos.cedros@muebleria.com', 'cedros2026')}
                className="bg-indigo-50 hover:bg-indigo-100 text-indigo-950 p-4 rounded-2xl border-2 border-indigo-300 text-left transition shadow-md flex items-start gap-3 cursor-pointer"
              >
                <span className="text-2xl">🏢</span>
                <div>
                  <p className="font-black text-sm text-indigo-950">Taller Los Cedros (Taller 2)</p>
                  <p className="text-xs text-indigo-800 font-medium">Verifica el aislamiento total de proyectos.</p>
                </div>
              </button>

            </div>
          </div>

          {/* Firebase Authentication Status Banner */}
          <div className="bg-amber-50 border-2 border-amber-300 rounded-2xl p-5 text-amber-950 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3 text-left">
              <div className="p-3 bg-amber-200 text-amber-900 rounded-xl">
                <Flame className="w-7 h-7 text-amber-700" />
              </div>
              <div>
                <p className="font-extrabold text-base">Aislamiento de Base de Datos Multi-Taller</p>
                <p className="text-xs font-medium text-amber-800">
                  Cada taller cliente accede exclusivamente a sus propios proyectos y catálogos.
                </p>
              </div>
            </div>

            <button
              onClick={onOpenFirebaseModal}
              className="bg-amber-900 hover:bg-amber-950 text-white text-xs font-bold px-4 py-2.5 rounded-xl border border-amber-700 flex items-center gap-2 whitespace-nowrap cursor-pointer"
            >
              <ShieldCheck className="w-4 h-4 text-amber-400" />
              Detalles Firebase
            </button>
          </div>

        </div>

      </div>
    </div>
  );
};
