import React from 'react';
import { ViewMode, User } from '../types';
import { Hammer, Package, BarChart3, PlusCircle, Wrench, Layers, CheckCircle2, Volume2, VolumeX, ShieldCheck, Sparkles } from 'lucide-react';

interface MainMenuProps {
  currentUser: User;
  onNavigate: (view: ViewMode) => void;
  projectsCount: number;
  offcutsCount: number;
  isVoiceAudioEnabled?: boolean;
  onToggleVoiceAudio?: () => void;
}

export const MainMenu: React.FC<MainMenuProps> = ({
  currentUser,
  onNavigate,
  projectsCount,
  offcutsCount,
  isVoiceAudioEnabled = true,
  onToggleVoiceAudio
}) => {
  const isOperator = currentUser.role === 'operario' || currentUser.role === 'ayudante';
  const isSuperAdmin = currentUser.role === 'superadmin';

  return (
    <div className="max-w-5xl mx-auto p-4 sm:p-6 lg:p-8 space-y-8 sm:space-y-10">
      
      {/* Welcome Banner */}
      <div className="bg-amber-950 text-white rounded-3xl p-6 sm:p-10 shadow-2xl border-4 border-amber-600 flex flex-col sm:flex-row items-center justify-between gap-6">
        <div className="flex items-center gap-5 text-center sm:text-left">
          <div className={`w-16 h-16 sm:w-20 sm:h-20 rounded-3xl flex items-center justify-center font-black text-3xl sm:text-4xl shadow-lg border-2 shrink-0 ${
            isSuperAdmin ? 'bg-amber-400 text-slate-950 border-amber-200' : isOperator ? 'bg-orange-500 text-white border-orange-300' : 'bg-amber-500 text-amber-950 border-amber-300'
          }`}>
            {isSuperAdmin ? '👑' : isOperator ? '🔨' : '🪚'}
          </div>
          <div>
            <div className="flex items-center gap-2 justify-center sm:justify-start flex-wrap">
              <h2 className="text-3xl sm:text-4xl font-black text-white tracking-tight">
                ¡Bienvenido, {currentUser.name}!
              </h2>
              {currentUser.tenantName && !isSuperAdmin && (
                <span className="bg-amber-800 text-amber-200 text-xs font-black px-2.5 py-0.5 rounded-full border border-amber-600">
                  🏢 {currentUser.tenantName}
                </span>
              )}
            </div>
            <p className="text-lg sm:text-xl font-bold text-amber-200 mt-1">
              {isSuperAdmin
                ? 'Panel de control maestro de la plataforma SaaS y gestión de clientes.'
                : isOperator
                ? 'Modo Operario: Seleccione el proceso de corte o armado para iniciar su jornada.'
                : 'Seleccione una opción para comenzar a trabajar en el taller:'}
            </p>
          </div>
        </div>
      </div>

      {/* Super Admin Special Highlight Card */}
      {isSuperAdmin && (
        <button
          onClick={() => onNavigate('superadmin')}
          className="group w-full bg-gradient-to-r from-slate-950 via-slate-900 to-indigo-950 hover:from-slate-900 hover:to-indigo-900 text-white p-6 sm:p-8 rounded-3xl border-4 border-amber-400 shadow-2xl hover:shadow-amber-500/20 transition-all transform active:scale-[0.98] text-left flex items-center justify-between gap-6 cursor-pointer"
        >
          <div className="flex items-center gap-6">
            <div className="w-16 h-16 sm:w-20 sm:h-20 bg-amber-400 text-slate-950 rounded-2xl flex items-center justify-center text-3xl sm:text-4xl shrink-0 border-2 border-amber-200 group-hover:scale-110 transition-transform">
              👑
            </div>
            <div>
              <div className="flex items-center gap-3">
                <span className="bg-amber-400 text-slate-950 text-xs sm:text-sm font-black px-3 py-1 rounded-full uppercase tracking-wider">
                  Acceso Exclusivo • Super Admin
                </span>
              </div>
              <h3 className="text-2xl sm:text-3xl lg:text-4xl font-black text-white tracking-tight mt-1 mb-1">
                Panel de Super Administrador (Dueño)
              </h3>
              <p className="text-base sm:text-lg text-amber-200 font-bold max-w-xl">
                Alta de nuevos talleres, gestión de licencias, cuentas de maestros y operarios, y métricas mensuales globales.
              </p>
            </div>
          </div>
          <div className="hidden sm:flex w-14 h-14 rounded-full bg-amber-400 text-slate-950 items-center justify-center shrink-0 font-black text-2xl shadow-lg border-2 border-amber-200 group-hover:translate-x-2 transition-transform">
            ➔
          </div>
        </button>
      )}

      {/* Workshop Modules Grid */}
      <div className="grid grid-cols-1 gap-6 sm:gap-8">
        
        {/* Module 1: Crear Nuevo Proyecto / Despiece (Visible para Maestro y Superadmin) */}
        {!isOperator && (
          <button
            onClick={() => onNavigate('project')}
            className="group w-full bg-gradient-to-r from-amber-600 via-amber-700 to-amber-800 hover:from-amber-700 hover:to-amber-900 text-white p-6 sm:p-8 rounded-3xl border-4 border-amber-900 shadow-2xl hover:shadow-amber-900/40 transition-all transform active:scale-[0.98] text-left flex items-center justify-between gap-6 cursor-pointer"
          >
            <div className="flex items-center gap-6">
              <div className="w-16 h-16 sm:w-20 sm:h-20 bg-amber-950/80 text-amber-300 rounded-2xl flex items-center justify-center text-3xl sm:text-4xl shrink-0 border-2 border-amber-400 group-hover:scale-110 transition-transform">
                🪚
              </div>
              <div>
                <div className="flex items-center gap-3">
                  <span className="bg-amber-400 text-amber-950 text-xs sm:text-sm font-black px-3 py-1 rounded-full uppercase tracking-wider">
                    Módulo 1 • Calculadora & Despiece
                  </span>
                </div>
                <h3 className="text-2xl sm:text-3xl lg:text-4xl font-black text-white tracking-tight mt-1 mb-1">
                  Crear / Editar Proyectos
                </h3>
                <p className="text-base sm:text-lg text-amber-100 font-bold max-w-xl">
                  Ingresa dimensiones de muebles, genera la lista de cortes exacta y visualiza el despiece.
                </p>
              </div>
            </div>
            <div className="hidden sm:flex w-14 h-14 rounded-full bg-amber-400 text-amber-950 items-center justify-center shrink-0 font-black text-2xl shadow-lg border-2 border-amber-200 group-hover:translate-x-2 transition-transform">
              ➔
            </div>
          </button>
        )}

        {/* Module 2: Guía de Corte en Sierra (Visible para Todos) */}
        <button
          onClick={() => onNavigate('optimizer')}
          className="group w-full bg-gradient-to-r from-blue-700 via-indigo-800 to-slate-900 hover:from-blue-800 hover:to-slate-950 text-white p-6 sm:p-8 rounded-3xl border-4 border-blue-950 shadow-2xl hover:shadow-blue-900/40 transition-all transform active:scale-[0.98] text-left flex items-center justify-between gap-6 cursor-pointer"
        >
          <div className="flex items-center gap-6">
            <div className="w-16 h-16 sm:w-20 sm:h-20 bg-blue-950/80 text-blue-300 rounded-2xl flex items-center justify-center text-3xl sm:text-4xl shrink-0 border-2 border-blue-400 group-hover:scale-110 transition-transform">
              ✂️
            </div>
            <div>
              <div className="flex items-center gap-3">
                <span className="bg-blue-400 text-slate-950 text-xs sm:text-sm font-black px-3 py-1 rounded-full uppercase tracking-wider">
                  Módulo 2 • Guía y Planos de Corte
                </span>
                <span className="bg-emerald-500 text-white text-xs font-black px-2.5 py-0.5 rounded-full uppercase">
                  Checklist en Sierra
                </span>
              </div>
              <h3 className="text-2xl sm:text-3xl lg:text-4xl font-black text-white tracking-tight mt-1 mb-1">
                Optimización y Corte en Sierra
              </h3>
              <p className="text-base sm:text-lg text-blue-100 font-bold max-w-xl">
                Planos visuales de corte, aprovechamiento de tableros, registro de piezas cortadas y extracción de pedacería.
              </p>
            </div>
          </div>
          <div className="hidden sm:flex w-14 h-14 rounded-full bg-blue-400 text-slate-950 items-center justify-center shrink-0 font-black text-2xl shadow-lg border-2 border-blue-200 group-hover:translate-x-2 transition-transform">
            ➔
          </div>
        </button>

        {/* Module 3: Proceso de Armado en Taller (Visible para Todos) */}
        <button
          onClick={() => onNavigate('assembly')}
          className="group w-full bg-gradient-to-r from-orange-600 via-amber-700 to-amber-900 hover:from-orange-700 hover:to-amber-950 text-white p-6 sm:p-8 rounded-3xl border-4 border-orange-950 shadow-2xl hover:shadow-orange-900/40 transition-all transform active:scale-[0.98] text-left flex items-center justify-between gap-6 cursor-pointer"
        >
          <div className="flex items-center gap-6">
            <div className="w-16 h-16 sm:w-20 sm:h-20 bg-orange-950/80 text-amber-300 rounded-2xl flex items-center justify-center text-3xl sm:text-4xl shrink-0 border-2 border-amber-400 group-hover:scale-110 transition-transform">
              🔨
            </div>
            <div>
              <div className="flex items-center gap-3">
                <span className="bg-amber-300 text-amber-950 text-xs sm:text-sm font-black px-3 py-1 rounded-full uppercase tracking-wider">
                  Módulo 3 • Proceso de Armado en Taller
                </span>
                <span className="bg-orange-500 text-white text-xs font-extrabold px-2.5 py-0.5 rounded-full uppercase">
                  Paso a Paso & Modo Cubrecanto
                </span>
              </div>
              <h3 className="text-2xl sm:text-3xl lg:text-4xl font-black text-white tracking-tight mt-1 mb-1">
                Armado, Herrajes & Canteado
              </h3>
              <p className="text-base sm:text-lg text-amber-100 font-bold max-w-xl">
                Secuencia de ensamble asistida por voz, checklist de piezas en mesa, cálculo de herrajes y taller de cubrecanto.
              </p>
            </div>
          </div>
          <div className="hidden sm:flex w-14 h-14 rounded-full bg-amber-300 text-amber-950 items-center justify-center shrink-0 font-black text-2xl shadow-lg border-2 border-amber-100 group-hover:translate-x-2 transition-transform">
            ➔
          </div>
        </button>

        {/* Module 4: Cotización y Catálogo de Precios (ESTRICTAMENTE OCULTO PARA OPERARIO / CHALÁN) */}
        {!isOperator && (
          <button
            onClick={() => onNavigate('budget')}
            className="group w-full bg-gradient-to-r from-emerald-600 via-teal-700 to-emerald-900 hover:from-emerald-700 hover:to-teal-950 text-white p-6 sm:p-8 rounded-3xl border-4 border-emerald-950 shadow-2xl hover:shadow-emerald-900/40 transition-all transform active:scale-[0.98] text-left flex items-center justify-between gap-6 cursor-pointer"
          >
            <div className="flex items-center gap-6">
              <div className="w-16 h-16 sm:w-20 sm:h-20 bg-emerald-950/80 text-emerald-300 rounded-2xl flex items-center justify-center text-3xl sm:text-4xl shrink-0 border-2 border-emerald-400 group-hover:scale-110 transition-transform">
                💵
              </div>
              <div>
                <div className="flex items-center gap-3">
                  <span className="bg-emerald-300 text-emerald-950 text-xs sm:text-sm font-black px-3 py-1 rounded-full uppercase tracking-wider">
                    Módulo 4 • Cotización y Catálogo de Precios
                  </span>
                  <span className="bg-emerald-500 text-white text-xs font-extrabold px-2.5 py-0.5 rounded-full uppercase">
                    PDF & Catálogo Maestro
                  </span>
                </div>
                <h3 className="text-2xl sm:text-3xl lg:text-4xl font-black text-white tracking-tight mt-1 mb-1">
                  Cotización y Catálogo de Precios
                </h3>
                <p className="text-base sm:text-lg text-emerald-100 font-bold max-w-xl">
                  Cálculo automatizado de tableros, cubrecanto, herrajes, mano de obra, catálogo general de precios y exportación de cotización en PDF.
                </p>
              </div>
            </div>
            <div className="hidden sm:flex w-14 h-14 rounded-full bg-emerald-300 text-emerald-950 items-center justify-center shrink-0 font-black text-2xl shadow-lg border-2 border-emerald-100 group-hover:translate-x-2 transition-transform">
              ➔
            </div>
          </button>
        )}

        {/* Button: Revisar Pedacería / Retazos */}
        <button
          onClick={() => onNavigate('offcuts')}
          className="group w-full bg-gradient-to-r from-emerald-600 via-emerald-700 to-emerald-800 hover:from-emerald-700 hover:to-emerald-900 text-white p-6 sm:p-8 rounded-3xl border-4 border-emerald-950 shadow-2xl hover:shadow-emerald-900/40 transition-all transform active:scale-[0.98] text-left flex items-center justify-between gap-6 cursor-pointer"
        >
          <div className="flex items-center gap-6">
            <div className="w-16 h-16 sm:w-20 sm:h-20 bg-emerald-950/80 text-emerald-300 rounded-2xl flex items-center justify-center text-3xl sm:text-4xl shrink-0 border-2 border-emerald-400 group-hover:scale-110 transition-transform">
              📦
            </div>
            <div>
              <div className="flex items-center gap-3">
                <span className="bg-emerald-300 text-emerald-950 text-xs sm:text-sm font-black px-3 py-1 rounded-full uppercase tracking-wider">
                  Inventario de Madera ({offcutsCount} Piezas)
                </span>
              </div>
              <h3 className="text-2xl sm:text-3xl lg:text-4xl font-black text-white tracking-tight mt-1 mb-1">
                Revisar Pedacería / Retazos
              </h3>
              <p className="text-base sm:text-lg text-emerald-100 font-bold max-w-xl">
                Consulta sobrantes de tableros guardados y busca coincidencias para ahorrar material en taller.
              </p>
            </div>
          </div>
          <div className="hidden sm:flex w-14 h-14 rounded-full bg-emerald-300 text-emerald-950 items-center justify-center shrink-0 font-black text-2xl shadow-lg border-2 border-emerald-100 group-hover:translate-x-2 transition-transform">
            ➔
          </div>
        </button>

        {/* Button: Panel de Administración del Taller (Solo Maestro y Super Admin) */}
        {!isOperator && (
          <button
            onClick={() => onNavigate('admin')}
            className="group w-full bg-gradient-to-r from-indigo-700 via-indigo-800 to-indigo-900 hover:from-indigo-800 hover:to-indigo-950 text-white p-6 sm:p-8 rounded-3xl border-4 border-indigo-950 shadow-2xl hover:shadow-indigo-900/40 transition-all transform active:scale-[0.98] text-left flex items-center justify-between gap-6 cursor-pointer"
          >
            <div className="flex items-center gap-6">
              <div className="w-16 h-16 sm:w-20 sm:h-20 bg-indigo-950/80 text-indigo-300 rounded-2xl flex items-center justify-center text-3xl sm:text-4xl shrink-0 border-2 border-indigo-400 group-hover:scale-110 transition-transform">
                📊
              </div>
              <div>
                <div className="flex items-center gap-3">
                  <span className="bg-indigo-300 text-indigo-950 text-xs sm:text-sm font-black px-3 py-1 rounded-full uppercase tracking-wider">
                    Estadísticas & Reportes
                  </span>
                </div>
                <h3 className="text-2xl sm:text-3xl lg:text-4xl font-black text-white tracking-tight mt-1 mb-1">
                  Panel de Estadísticas del Taller
                </h3>
                <p className="text-base sm:text-lg text-indigo-100 font-bold max-w-xl">
                  Métricas de proyectos ejecutados, volumen de cortes realizados y rendimiento de este taller.
                </p>
              </div>
            </div>
            <div className="hidden sm:flex w-14 h-14 rounded-full bg-indigo-300 text-indigo-950 items-center justify-center shrink-0 font-black text-2xl shadow-lg border-2 border-indigo-100 group-hover:translate-x-2 transition-transform">
              ➔
            </div>
          </button>
        )}

      </div>

      {/* Quick Workshop Status Bar */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border-4 border-amber-800/20 shadow-xl grid grid-cols-1 md:grid-cols-3 gap-6 text-center">
        <div className="p-4 bg-amber-50 rounded-2xl border-2 border-amber-200">
          <p className="text-sm font-extrabold text-amber-800 uppercase tracking-wider">Proyectos en Taller</p>
          <p className="text-4xl font-black text-amber-950 mt-1">{projectsCount} Proyectos</p>
        </div>
        <div className="p-4 bg-emerald-50 rounded-2xl border-2 border-emerald-200">
          <p className="text-sm font-extrabold text-emerald-800 uppercase tracking-wider">Retazos en Almacén</p>
          <p className="text-4xl font-black text-emerald-950 mt-1">{offcutsCount} Retazos</p>
        </div>
        
        {/* Toggleable Voice Audio Status Card */}
        <button
          type="button"
          onClick={onToggleVoiceAudio}
          className={`p-4 rounded-2xl border-2 transition-all text-center cursor-pointer select-none flex flex-col items-center justify-between ${
            isVoiceAudioEnabled
              ? 'bg-emerald-50 hover:bg-emerald-100/80 border-emerald-300 text-emerald-950 ring-2 ring-emerald-400/40'
              : 'bg-slate-100 hover:bg-slate-200 border-slate-300 text-slate-700'
          }`}
          title={isVoiceAudioEnabled ? 'Clic para silenciar alertas por voz' : 'Clic para activar alertas por voz'}
        >
          <div className="flex items-center justify-between w-full">
            <span className="text-xs font-black uppercase tracking-wider text-slate-600">
              Voz del Asistente
            </span>
            <span className={`text-[10px] font-black px-2 py-0.5 rounded-full uppercase ${
              isVoiceAudioEnabled ? 'bg-emerald-600 text-white' : 'bg-slate-400 text-white'
            }`}>
              {isVoiceAudioEnabled ? 'Activo' : 'Silenciado'}
            </span>
          </div>
          
          <div className="flex items-center justify-center gap-2 mt-2">
            {isVoiceAudioEnabled ? (
              <>
                <Volume2 className="w-7 h-7 text-emerald-600 animate-pulse" />
                <span className="text-2xl font-black text-emerald-950">Voz Activada</span>
              </>
            ) : (
              <>
                <VolumeX className="w-7 h-7 text-slate-500" />
                <span className="text-2xl font-black text-slate-700">Voz Silenciada</span>
              </>
            )}
          </div>
          <span className="text-[11px] font-semibold text-slate-500 mt-1">
            {isVoiceAudioEnabled ? 'Toca para silenciar' : 'Toca para activar audio'}
          </span>
        </button>
      </div>

    </div>
  );
};
