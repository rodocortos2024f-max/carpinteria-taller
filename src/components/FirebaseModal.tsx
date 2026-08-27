import React from 'react';
import { Flame, ShieldCheck, Database, Key, CheckCircle, XCircle } from 'lucide-react';

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
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl max-w-2xl w-full border-4 border-amber-800 shadow-2xl overflow-hidden flex flex-col">
        
        {/* Header */}
        <div className="bg-gradient-to-r from-amber-950 via-amber-900 to-amber-950 text-white p-6 border-b-4 border-amber-600 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Flame className="w-8 h-8 text-amber-400 animate-pulse" />
            <h3 className="text-2xl font-black">ESTADO DE FIREBASE AUTH</h3>
          </div>
          <button
            onClick={onClose}
            className="bg-amber-800 hover:bg-amber-700 text-white font-black px-4 py-2 rounded-xl text-base"
          >
            ✕ CERRAR
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 sm:p-8 space-y-6">
          
          <div className="bg-amber-50 border-3 border-amber-300 rounded-2xl p-5 flex items-start gap-4">
            <ShieldCheck className="w-10 h-10 text-amber-700 shrink-0 mt-1" />
            <div>
              <h4 className="text-xl font-black text-amber-950">
                {isConfigured ? 'Firebase Conectado Activamente' : 'Listo para Conexión con Firebase Authentication'}
              </h4>
              <p className="text-base font-bold text-amber-900 mt-1">
                La pantalla de Login e inicio de sesión está 100% optimizada para conectarse con Firebase Auth (Google Sign-In o Correo/Contraseña) y almacenar proyectos en Firestore.
              </p>
            </div>
          </div>

          <div className="space-y-3">
            <h5 className="text-lg font-black text-slate-900">Servicios Preparados:</h5>
            
            <div className="p-4 bg-slate-50 rounded-2xl border-2 border-slate-200 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Key className="w-6 h-6 text-amber-700" />
                <span className="text-base font-extrabold text-slate-900">Firebase Authentication</span>
              </div>
              <span className="bg-emerald-100 text-emerald-900 text-xs font-black px-3 py-1 rounded-full uppercase border border-emerald-300">
                ✓ Preparado
              </span>
            </div>

            <div className="p-4 bg-slate-50 rounded-2xl border-2 border-slate-200 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Database className="w-6 h-6 text-amber-700" />
                <span className="text-base font-extrabold text-slate-900">Cloud Firestore (Base de Datos)</span>
              </div>
              <span className="bg-emerald-100 text-emerald-900 text-xs font-black px-3 py-1 rounded-full uppercase border border-emerald-300">
                ✓ Preparado
              </span>
            </div>
          </div>

          <div className="bg-slate-100 p-4 rounded-2xl border border-slate-300 text-xs font-mono text-slate-800 space-y-1">
            <p className="font-bold text-slate-900 font-sans">Colecciones Firestore Estructuradas:</p>
            <p>• /proyectos/{`{projectId}`} - Muebles y listas de cortes</p>
            <p>• /retazos/{`{offcutId}`} - Inventario de pedacería</p>
            <p>• /usuarios/{`{userId}`} - Perfiles de maestros carpinteros</p>
          </div>

          <button
            onClick={onClose}
            className="w-full bg-amber-700 hover:bg-amber-800 text-white font-black text-xl py-4 rounded-2xl border-2 border-amber-950 shadow-lg cursor-pointer"
          >
            ENTENDIDO, VOLVER AL TALLER
          </button>

        </div>

      </div>
    </div>
  );
};
