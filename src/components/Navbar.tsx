import React, { useState, useEffect } from 'react';
import { User, ViewMode, WorkshopTenant } from '../types';
import { LogOut, Home, Flame, Sparkles, Volume2, VolumeX, ShieldCheck, Building2, Wifi, WifiOff, Clock } from 'lucide-react';
import { getAllTenants } from '../utils/tenants';
import { checkOfflineLicenseStatus, OfflineLicenseStatus } from '../utils/licenseSecurity';

interface NavbarProps {
  currentUser: User | null;
  currentView: ViewMode;
  isVoiceAudioEnabled?: boolean;
  onToggleVoiceAudio?: () => void;
  onNavigate: (view: ViewMode) => void;
  onLogout: () => void;
  onToggleFirebaseInfo: () => void;
  onSwitchTenant?: (tenant: WorkshopTenant) => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentUser,
  currentView,
  isVoiceAudioEnabled = true,
  onToggleVoiceAudio,
  onNavigate,
  onLogout,
  onToggleFirebaseInfo,
  onSwitchTenant
}) => {
  const isOperator = currentUser?.role === 'operario' || currentUser?.role === 'ayudante';
  const isSuperAdmin = currentUser?.role === 'superadmin';
  const tenants = isSuperAdmin ? getAllTenants() : [];

  const [offlineStatus, setOfflineStatus] = useState<OfflineLicenseStatus>(() => checkOfflineLicenseStatus());

  useEffect(() => {
    const handleUpdate = () => {
      setOfflineStatus(checkOfflineLicenseStatus());
    };

    const interval = setInterval(handleUpdate, 30000);
    window.addEventListener('online', handleUpdate);
    window.addEventListener('offline', handleUpdate);
    window.addEventListener('carpinteria_firebase_validation_updated', handleUpdate);

    return () => {
      clearInterval(interval);
      window.removeEventListener('online', handleUpdate);
      window.removeEventListener('offline', handleUpdate);
      window.removeEventListener('carpinteria_firebase_validation_updated', handleUpdate);
    };
  }, []);

  return (
    <header className="bg-amber-950 text-amber-50 border-b-4 border-amber-600 shadow-xl sticky top-0 z-40 no-print">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20 sm:h-24">
          
          {/* Logo and App Title */}
          <div
            className="flex items-center gap-3 cursor-pointer"
            onClick={() => {
              if (currentUser) {
                if (isSuperAdmin && currentView === 'superadmin') {
                  onNavigate('superadmin');
                } else if (isSuperAdmin) {
                  onNavigate('menu');
                } else {
                  onNavigate('menu');
                }
              }
            }}
          >
            <div className="bg-amber-600 p-2 sm:p-2.5 rounded-2xl shadow-lg border-2 border-amber-400 flex items-center justify-center overflow-hidden shrink-0">
              <img src="/icon.svg" alt="Carpintería" className="w-7 h-7 sm:w-8 sm:h-8 object-contain drop-shadow" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white flex items-center gap-2">
                  Carpintería <span className="text-amber-400">Taller</span>
                </h1>
                {currentUser?.tenantName && !isSuperAdmin && (
                  <span className="bg-amber-800 text-amber-200 border border-amber-600 text-xs font-black px-2.5 py-0.5 rounded-full hidden md:inline-block">
                    🏢 {currentUser.tenantName}
                  </span>
                )}
                {isSuperAdmin && (
                  <span className="bg-amber-400 text-slate-950 font-black text-xs px-2.5 py-0.5 rounded-full hidden sm:inline-block">
                    👑 SUPER ADMIN
                  </span>
                )}
              </div>
              <p className="text-xs sm:text-sm font-semibold text-amber-200 tracking-wide uppercase">
                {isOperator
                  ? 'Modo Operario / Chalán (Corte y Ensamble)'
                  : isSuperAdmin
                  ? 'Plataforma Multi-Taller • Control Maestro'
                  : 'Sistema Para Maestros Carpinteros'}
              </p>
            </div>
          </div>

          {/* User Info & Actions */}
          <div className="flex items-center gap-2 sm:gap-4">
            {currentUser ? (
              <>
                {/* Super Admin Switch to Platform Panel Button */}
                {isSuperAdmin && (
                  <button
                    onClick={() => onNavigate('superadmin')}
                    className={`px-3 sm:px-4 py-2 rounded-xl text-xs sm:text-sm font-black transition flex items-center gap-2 border-2 shadow-md cursor-pointer ${
                      currentView === 'superadmin'
                        ? 'bg-amber-400 text-slate-950 border-amber-200 ring-2 ring-amber-300'
                        : 'bg-slate-900 text-amber-300 border-amber-500/80 hover:bg-slate-800'
                    }`}
                  >
                    <span>👑</span>
                    <span className="hidden sm:inline">Panel Super Admin</span>
                  </button>
                )}

                {/* Direct Module Navigation Buttons on larger screens */}
                <div className="hidden xl:flex items-center gap-1.5 bg-amber-900/90 p-1.5 rounded-2xl border border-amber-700/80">
                  {/* Módulo 1: Despiece (visible para Maestro y Superadmin) */}
                  {!isOperator && (
                    <button
                      onClick={() => onNavigate('project')}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${
                        currentView === 'project'
                          ? 'bg-amber-600 text-white shadow-sm'
                          : 'text-amber-200 hover:bg-amber-800'
                      }`}
                    >
                      <span>🪚</span>
                      <span>Módulo 1: Despiece</span>
                    </button>
                  )}

                  {/* Módulo 2: Corte (visible para todos) */}
                  <button
                    onClick={() => onNavigate('optimizer')}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${
                      currentView === 'optimizer'
                        ? 'bg-amber-600 text-white shadow-sm'
                        : 'text-amber-200 hover:bg-amber-800'
                    }`}
                  >
                    <span>✂️</span>
                    <span>Módulo 2: Corte</span>
                  </button>

                  {/* Módulo 3: Armado (visible para todos) */}
                  <button
                    onClick={() => onNavigate('assembly')}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${
                      currentView === 'assembly'
                        ? 'bg-amber-600 text-white shadow-sm'
                        : 'text-amber-200 hover:bg-amber-800'
                    }`}
                  >
                    <span>🔨</span>
                    <span>Módulo 3: Armado</span>
                  </button>

                  {/* Módulo 4: Cotización (ESTRICTAMENTE OCULTO PARA OPERARIO / CHALÁN) */}
                  {!isOperator && (
                    <button
                      onClick={() => onNavigate('budget')}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${
                        currentView === 'budget'
                          ? 'bg-emerald-600 text-white shadow-sm ring-2 ring-emerald-400'
                          : 'text-emerald-200 hover:bg-amber-800 hover:text-emerald-300'
                      }`}
                    >
                      <span>💵</span>
                      <span>Módulo 4: Cotización</span>
                    </button>
                  )}
                </div>

                {/* BOTÓN DE CONTROL DE AUDIO / VOZ DE CONFIRMACIÓN */}
                {onToggleVoiceAudio && (
                  <button
                    id="toggle-voice-audio-btn"
                    type="button"
                    onClick={onToggleVoiceAudio}
                    className={`p-2.5 sm:px-3 sm:py-2.5 rounded-xl border flex items-center gap-1.5 sm:gap-2 text-xs sm:text-sm font-black transition-all shadow-md cursor-pointer select-none ${
                      isVoiceAudioEnabled
                        ? 'bg-emerald-800 hover:bg-emerald-700 text-emerald-100 border-emerald-400 ring-2 ring-emerald-500/50'
                        : 'bg-amber-900/90 hover:bg-amber-800 text-amber-300/80 border-amber-700/80'
                    }`}
                    title={
                      isVoiceAudioEnabled
                        ? 'Alertas por Voz: ACTIVADAS (Clic para desactivar)'
                        : 'Alertas por Voz: DESACTIVADAS (Clic para activar)'
                    }
                    aria-label={isVoiceAudioEnabled ? 'Desactivar voz de confirmación' : 'Activar voz de confirmación'}
                  >
                    {isVoiceAudioEnabled ? (
                      <>
                        <Volume2 className="w-5 h-5 text-emerald-300 shrink-0" />
                        <span className="hidden sm:inline font-black tracking-wide">Voz ON</span>
                        <span className="w-2 h-2 rounded-full bg-emerald-400 shrink-0 animate-pulse"></span>
                      </>
                    ) : (
                      <>
                        <VolumeX className="w-5 h-5 text-amber-300/90 shrink-0" />
                        <span className="hidden sm:inline font-bold text-amber-200/90 tracking-wide">Voz OFF</span>
                        <span className="w-2 h-2 rounded-full bg-rose-400 shrink-0"></span>
                      </>
                    )}
                  </button>
                )}

                {currentView !== 'menu' && currentView !== 'superadmin' && (
                  <button
                    onClick={() => onNavigate('menu')}
                    className="bg-amber-800 hover:bg-amber-700 text-white font-bold px-3 sm:px-4 py-2 sm:py-2.5 rounded-xl flex items-center gap-2 border-2 border-amber-600 text-sm sm:text-base transition shadow-md cursor-pointer"
                    title="Ir al Menú Principal"
                  >
                    <Home className="w-4 h-4 sm:w-5 sm:h-5 text-amber-300" />
                    <span className="hidden md:inline">Menú</span>
                  </button>
                )}

                {/* User Profile Badge */}
                <div className="hidden lg:flex items-center gap-3 bg-amber-900/80 px-4 py-2 rounded-2xl border border-amber-700/60">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center font-black text-xl shadow-inner ${
                    isSuperAdmin ? 'bg-amber-400 text-slate-950' : isOperator ? 'bg-orange-500 text-white' : 'bg-amber-600 text-amber-950'
                  }`}>
                    {isSuperAdmin ? '👑' : isOperator ? '🔨' : currentUser.name.charAt(0)}
                  </div>
                  <div className="text-left">
                    <p className="text-sm font-extrabold text-white leading-tight flex items-center gap-1.5">
                      <span>{currentUser.name}</span>
                    </p>
                    <p className="text-xs font-bold text-amber-300">
                      {isSuperAdmin
                        ? 'Dueño de Plataforma'
                        : isOperator
                        ? 'Operario / Chalán'
                        : `Maestro • ${currentUser.tenantName || 'Taller'}`}
                    </p>
                  </div>
                </div>

                {/* Firebase & Multi-Tenant Control Button (100% EXCLUSIVO PARA SUPER ADMIN) */}
                {isSuperAdmin && (
                  <button
                    onClick={onToggleFirebaseInfo}
                    className="bg-amber-900 hover:bg-amber-800 text-amber-200 p-2.5 sm:px-3.5 sm:py-2.5 rounded-xl border border-amber-700/80 flex items-center gap-2 text-xs sm:text-sm font-bold transition shadow-md cursor-pointer"
                    title="Configuración y Estado Firebase Firestore"
                  >
                    <Flame className="w-5 h-5 text-amber-400 animate-pulse" />
                    <span className="hidden sm:inline">Firebase</span>
                  </button>
                )}

                <button
                  onClick={onLogout}
                  className="bg-rose-700 hover:bg-rose-800 text-white font-black px-3 sm:px-4 py-2.5 sm:py-3 rounded-xl flex items-center gap-2 text-sm sm:text-base border-2 border-rose-500 transition shadow-lg cursor-pointer"
                  title="Cerrar Sesión"
                >
                  <LogOut className="w-5 h-5 sm:w-6 sm:h-6" />
                  <span className="hidden sm:inline">Salir</span>
                </button>
              </>
            ) : (
              <div className="flex items-center gap-2">
                <span className="bg-amber-800 text-amber-200 text-xs sm:text-sm px-3 py-1.5 rounded-full font-bold uppercase tracking-wider">
                  Acceso Requerido
                </span>
              </div>
            )}
          </div>

        </div>
      </div>
    </header>
  );
};
