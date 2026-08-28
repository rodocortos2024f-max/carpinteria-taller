import React, { useState } from 'react';
import { User } from '../types';
import { authenticateUserCredentials } from '../utils/tenants';
import {
  Mail,
  Lock,
  LogIn,
  Eye,
  EyeOff,
  AlertTriangle
} from 'lucide-react';

interface LoginViewProps {
  onLogin: (user: User) => void;
  onOpenFirebaseModal?: () => void;
}

export const LoginView: React.FC<LoginViewProps> = ({ onLogin }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
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
              className="w-full bg-amber-700 hover:bg-amber-800 text-white border-2 border-amber-900 active:bg-amber-900 shadow-xl py-4.5 text-xl sm:text-2xl font-black tracking-wide rounded-2xl uppercase mt-4 flex items-center justify-center gap-3 cursor-pointer transition transform active:scale-98"
            >
              <LogIn className="w-7 h-7 text-amber-300" />
              {isLoading ? 'VERIFICANDO...' : 'INICIAR SESIÓN'}
            </button>
          </form>

        </div>

      </div>
    </div>
  );
};
