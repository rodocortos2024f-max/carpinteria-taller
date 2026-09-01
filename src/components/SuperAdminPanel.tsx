import React, { useState, useEffect } from 'react';
import { WorkshopTenant, User, GlobalPlatformStats } from '../types';
import { db } from '../lib/firebase';
import {
  collection,
  addDoc,
  doc,
  updateDoc,
  deleteDoc,
  onSnapshot,
  query,
  orderBy
} from 'firebase/firestore';
import {
  getAllTenants,
  getGlobalPlatformStats,
  getTenantProjects,
  removeTenantOperatorAccount,
  createOrActivateTenantOperator
} from '../utils/tenants';
import {
  fetchWorkshopsOnce,
  normalizeWorkshopDoc,
  saveWorkshopsToLocalCache
} from '../utils/firebaseWorkshops';
import {
  ShieldCheck,
  Building2,
  Users,
  PlusCircle,
  BarChart3,
  Activity,
  CheckCircle2,
  AlertTriangle,
  Lock,
  Mail,
  Phone,
  MapPin,
  FileSpreadsheet,
  Copy,
  Check,
  RefreshCw,
  LogOut,
  TrendingUp,
  Sparkles,
  Eye,
  EyeOff,
  Trash2,
  Search,
  Filter
} from 'lucide-react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid
} from 'recharts';

interface SuperAdminPanelProps {
  currentUser: User;
  onLogout: () => void;
  onSimulateTenantLogin: (tenant: WorkshopTenant, role: 'maestro' | 'operario') => void;
}

export const SuperAdminPanel: React.FC<SuperAdminPanelProps> = ({
  currentUser,
  onLogout,
  onSimulateTenantLogin
}) => {
  const [tenants, setTenants] = useState<WorkshopTenant[]>(() => getAllTenants());
  const [stats, setStats] = useState<GlobalPlatformStats>(() => getGlobalPlatformStats());
  const [activeTab, setActiveTab] = useState<'tenants' | 'stats' | 'new_tenant'>('tenants');

  // Search & Filter State
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'activa' | 'suspendida'>('all');

  // Modal / Form States
  const [credentialsModalTenant, setCredentialsModalTenant] = useState<WorkshopTenant | null>(null);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [showPasswords, setShowPasswords] = useState<Record<string, boolean>>({});

  // Helper to calculate default expiration date based on plan
  const calculateExpiryDate = (plan: 'mensual' | 'anual' | 'vitalicia' | 'demo'): string => {
    const d = new Date();
    if (plan === 'mensual') {
      d.setMonth(d.getMonth() + 1);
    } else if (plan === 'anual') {
      d.setFullYear(d.getFullYear() + 1);
    } else if (plan === 'vitalicia') {
      d.setFullYear(d.getFullYear() + 10);
    } else if (plan === 'demo') {
      d.setDate(d.getDate() + 14);
    }
    return d.toISOString().split('T')[0];
  };

  // Form State for creating a workshop (Direct Firestore)
  const [nombreTaller, setNombreTaller] = useState('');
  const [duenoNombre, setDuenoNombre] = useState('');
  const [ciudad, setCiudad] = useState('');
  const [telefono, setTelefono] = useState('');
  const [taxId, setTaxId] = useState('');
  const [address, setAddress] = useState('');
  const [plan, setPlan] = useState<'mensual' | 'anual' | 'vitalicia' | 'demo'>('anual');
  const [vencimiento, setVencimiento] = useState<string>(() => calculateExpiryDate('anual'));
  const [customNotes, setCustomNotes] = useState('');

  // Maestro Account State
  const [maestroNombre, setMaestroNombre] = useState('');
  const [maestroEmail, setMaestroEmail] = useState('');
  const [maestroPassword, setMaestroPassword] = useState('taller2026');

  // Operario Account State (Opcional)
  const [hasOperario, setHasOperario] = useState(false);
  const [operarioNombre, setOperarioNombre] = useState('');
  const [operarioEmail, setOperarioEmail] = useState('');
  const [operarioPassword, setOperarioPassword] = useState('chalan2026');

  const [loading, setLoading] = useState(false);
  const [isFirebaseSyncing, setIsFirebaseSyncing] = useState(false);

  // Handle plan change and calculate default expiry
  const handlePlanChange = (selectedPlan: 'mensual' | 'anual' | 'vitalicia' | 'demo') => {
    setPlan(selectedPlan);
    setVencimiento(calculateExpiryDate(selectedPlan));
  };

  // Auto-suggest emails on workshop name typing
  const handleWorkshopNameChange = (val: string) => {
    setNombreTaller(val);
    const clean = val
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]+/g, '')
      .slice(0, 12);
    if (clean && !maestroEmail) {
      setMaestroEmail(`maestro@${clean}.com`);
    }
    if (clean && !operarioEmail) {
      setOperarioEmail(`operario@${clean}.com`);
    }
  };

  // Real-time Firestore sync via onSnapshot
  useEffect(() => {
    if (!db) return;
    setIsFirebaseSyncing(true);

    const workshopsRef = collection(db, 'workshops');
    const q = query(workshopsRef, orderBy('createdAt', 'desc'));

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const list: WorkshopTenant[] = [];
        snapshot.forEach((docSnap) => {
          const item = normalizeWorkshopDoc(docSnap.id, docSnap.data());
          if (item.id !== 'taller_don_jose' && item.id !== 'taller_los_cedros' && item.id !== 'taller_cocinas_vanguardia') {
            list.push(item);
          }
        });
        setTenants(list);
        saveWorkshopsToLocalCache(list);
        setStats(getGlobalPlatformStats());
        setIsFirebaseSyncing(false);
      },
      (err) => {
        console.warn('Error en onSnapshot Firestore:', err);
        setIsFirebaseSyncing(false);
      }
    );

    return () => {
      unsubscribe();
    };
  }, []);

  // Manual Refresh directly with Firebase Firestore
  const handleManualRefresh = async () => {
    setIsFirebaseSyncing(true);
    try {
      const workshops = await fetchWorkshopsOnce();
      const filtered = workshops.filter(
        w => w.id !== 'taller_don_jose' && w.id !== 'taller_los_cedros' && w.id !== 'taller_cocinas_vanguardia'
      );
      setTenants(filtered);
      setStats(getGlobalPlatformStats());
    } catch (e) {
      console.warn('Error refreshing workshops:', e);
    } finally {
      setIsFirebaseSyncing(false);
    }
  };

  /**
   * Direct Firestore Creation with strict Try / Catch / Finally.
   * Completely independent of Firebase Auth and local servers.
   */
  const handleCreateWorkshop = async (e: React.FormEvent) => {
    e.preventDefault();
    console.log("Iniciando guardado en Firestore...");

    if (!nombreTaller.trim() || !duenoNombre.trim() || !telefono.trim() || !ciudad.trim()) {
      alert('Por favor complete todos los datos obligatorios del taller.');
      return;
    }

    if (!maestroEmail.trim()) {
      alert('Debe especificar el correo de acceso para la cuenta del Maestro.');
      return;
    }

    if (hasOperario && !operarioEmail.trim()) {
      alert('Ha activado la cuenta de Operario; ingrese su correo o desactive la opción.');
      return;
    }

    setLoading(true);

    try {
      const cleanMaestroEmail = maestroEmail.trim().toLowerCase();
      const cleanOperarioEmail = operarioEmail.trim().toLowerCase();

      const maestroObj = {
        nombre: maestroNombre.trim() || duenoNombre.trim() || 'Maestro Encargado',
        name: maestroNombre.trim() || duenoNombre.trim() || 'Maestro Encargado',
        email: cleanMaestroEmail,
        password: maestroPassword || 'taller2026',
        role: 'MAESTRO' as const
      };

      const operarioObj = hasOperario ? {
        nombre: operarioNombre.trim() || 'Operario / Chalán',
        name: operarioNombre.trim() || 'Operario / Chalán',
        email: cleanOperarioEmail,
        password: operarioPassword || 'chalan2026',
        role: 'OPERARIO' as const
      } : null;

      const newWorkshopData = {
        nombreTaller: nombreTaller.trim(),
        name: nombreTaller.trim(),
        duenoNombre: duenoNombre.trim(),
        ownerName: duenoNombre.trim(),
        ciudad: ciudad.trim(),
        city: ciudad.trim(),
        telefono: telefono.trim(),
        phone: telefono.trim(),
        taxId: taxId.trim(),
        address: address.trim(),
        plan,
        licensePlan: plan,
        vencimiento,
        licenseExpiry: vencimiento,
        maestro: maestroObj,
        operario: operarioObj,
        masterAccount: {
          id: `usr_${Date.now()}_m`,
          name: maestroObj.nombre,
          email: maestroObj.email,
          password: maestroObj.password,
          role: 'maestro' as const
        },
        operatorAccount: operarioObj ? {
          id: `usr_${Date.now()}_op`,
          name: operarioObj.nombre,
          email: operarioObj.email,
          password: operarioObj.password,
          role: 'operario' as const
        } : undefined,
        estado: 'activo',
        status: 'activa',
        createdAt: new Date().toISOString(),
        lastAccess: 'Nunca',
        activeProjectsCount: 0,
        totalProjectsCount: 0,
        customNotes: customNotes.trim()
      };

      if (!db) {
        throw new Error('No se pudo inicializar la conexión con Firestore. Verifique la configuración de Firebase.');
      }

      const docRef = await addDoc(collection(db, 'workshops'), newWorkshopData);

      // Normalization for credentials modal
      const normalizedCreated = normalizeWorkshopDoc(docRef.id, newWorkshopData);
      setCredentialsModalTenant(normalizedCreated);

      // Reset Form Fields
      setNombreTaller('');
      setDuenoNombre('');
      setCiudad('');
      setTelefono('');
      setTaxId('');
      setAddress('');
      setMaestroNombre('');
      setMaestroEmail('');
      setMaestroPassword('taller2026');
      setHasOperario(false);
      setOperarioNombre('');
      setOperarioEmail('');
      setOperarioPassword('chalan2026');
      setCustomNotes('');
      setPlan('anual');
      setVencimiento(calculateExpiryDate('anual'));

      alert('¡Taller guardado exitosamente!');
      setActiveTab('tenants');
    } catch (err: any) {
      console.error("Error al guardar en Firestore:", err);
      alert('Error: ' + (err?.message || err));
    } finally {
      setLoading(false);
    }
  };

  // Toggle Status in Firestore
  const handleToggleStatus = async (tenantId: string, currentStatus: string) => {
    try {
      if (!db) return;
      const nextStatus = currentStatus === 'activa' ? 'suspendida' : 'activa';
      const nextEstado = nextStatus === 'activa' ? 'activo' : 'suspendido';

      const docRef = doc(db, 'workshops', tenantId);
      await updateDoc(docRef, {
        status: nextStatus,
        estado: nextEstado
      });
    } catch (e: any) {
      alert('Error al cambiar el estado del taller en Firestore: ' + (e?.message || e));
    }
  };

  // Delete Tenant from Firestore
  const handleDeleteTenant = async (tenant: WorkshopTenant) => {
    if (window.confirm(`¿Está seguro de eliminar definitivamente el taller "${tenant.name}" de Firebase Firestore?`)) {
      try {
        if (!db) return;
        const docRef = doc(db, 'workshops', tenant.id);
        await deleteDoc(docRef);
      } catch (e: any) {
        alert('Error al eliminar el taller de Firestore: ' + (e?.message || e));
      }
    }
  };

  // Delete Operator Account in Firestore
  const handleDeleteOperatorAccount = async (tenant: WorkshopTenant) => {
    if (window.confirm(`¿Desea eliminar la cuenta de Operario del taller "${tenant.name}" de Firestore?`)) {
      try {
        await removeTenantOperatorAccount(tenant.id);
        if (db) {
          const docRef = doc(db, 'workshops', tenant.id);
          await updateDoc(docRef, {
            operario: null,
            operatorAccount: null
          });
        }
      } catch (e: any) {
        alert('Error al eliminar la cuenta de operario: ' + (e?.message || e));
      }
    }
  };

  // Quick 1-Click Activate Operator Account in Firestore
  const handleQuickActivateOperator = async (tenant: WorkshopTenant) => {
    try {
      const updated = await createOrActivateTenantOperator(tenant.id);
      if (updated) {
        setCredentialsModalTenant(updated);
        if (db) {
          const docRef = doc(db, 'workshops', tenant.id);
          await updateDoc(docRef, {
            operario: {
              nombre: updated.operatorAccount?.name || 'Operario de Taller',
              email: updated.operatorAccount?.email || `operario@${tenant.id}.com`,
              password: updated.operatorAccount?.password || 'chalan2026',
              role: 'OPERARIO'
            },
            operatorAccount: updated.operatorAccount
          });
        }
      }
    } catch (e: any) {
      alert('Error al activar la cuenta de operario en Firestore: ' + (e?.message || e));
    }
  };

  // Copy helper
  const handleCopyText = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2500);
  };

  // Filtered tenants list
  const filteredTenants = tenants.filter(t => {
    const matchesSearch =
      t.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      t.ownerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      t.city.toLowerCase().includes(searchTerm.toLowerCase()) ||
      t.masterAccount.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (Boolean(t.operatorAccount?.email) && t.operatorAccount!.email.toLowerCase().includes(searchTerm.toLowerCase()));

    const matchesStatus = statusFilter === 'all' || t.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 pb-16">
      
      {/* Top Super Admin Platform Bar */}
      <header className="bg-slate-950 border-b-4 border-amber-500 shadow-2xl sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-20 sm:h-24">
            
            {/* Logo & Super Admin Title */}
            <div className="flex items-center gap-3">
              <div className="bg-gradient-to-br from-amber-400 to-amber-600 text-slate-950 p-3 rounded-2xl shadow-xl border-2 border-amber-300 font-black text-2xl flex items-center justify-center">
                👑
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
                    PANEL SUPER ADMIN
                  </h1>
                  <span className="bg-amber-400 text-slate-950 text-xs font-black px-2.5 py-0.5 rounded-full uppercase tracking-wider hidden sm:inline-block">
                    Dueño de la Plataforma
                  </span>
                </div>
                <p className="text-xs sm:text-sm font-bold text-amber-300/90 flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4 text-emerald-400" />
                  Sistema Multi-Taller • {currentUser.email}
                </p>
              </div>
            </div>

            {/* Quick Actions & Logout */}
            <div className="flex items-center gap-3">
              {/* Firebase Realtime Sync Indicator */}
              <div className="hidden lg:flex items-center gap-2 bg-slate-900 border border-slate-700 px-3 py-2 rounded-xl text-xs font-bold text-slate-300">
                <span className={`w-2.5 h-2.5 rounded-full ${isFirebaseSyncing ? 'bg-amber-400 animate-ping' : 'bg-emerald-400'}`} />
                <span>Firestore Realtime:</span>
                <span className="text-emerald-400 font-black">{isFirebaseSyncing ? 'Sincronizando...' : 'Conectado (onSnapshot)'}</span>
              </div>

              <button
                onClick={handleManualRefresh}
                disabled={isFirebaseSyncing}
                className="bg-slate-800 hover:bg-slate-700 disabled:opacity-50 text-slate-200 p-2.5 sm:px-4 sm:py-2.5 rounded-xl border border-slate-700 font-bold text-sm flex items-center gap-2 transition cursor-pointer"
                title="Sincronizar y Leer Directamente desde Firestore"
              >
                <RefreshCw className={`w-4 h-4 text-amber-400 ${isFirebaseSyncing ? 'animate-spin' : ''}`} />
                <span className="hidden md:inline">{isFirebaseSyncing ? 'Sincronizando...' : 'Refrescar Firestore'}</span>
              </button>

              <button
                onClick={onLogout}
                className="bg-rose-900 hover:bg-rose-800 text-white font-black text-sm sm:text-base px-4 py-2.5 rounded-xl border border-rose-700 flex items-center gap-2 shadow-lg transition cursor-pointer"
              >
                <LogOut className="w-5 h-5 text-rose-300" />
                <span className="hidden sm:inline">CERRAR SESIÓN</span>
              </button>
            </div>

          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 space-y-8">
        
        {/* Platform Overview Banner */}
        <div className="bg-gradient-to-r from-slate-950 via-slate-900 to-indigo-950 p-6 sm:p-8 rounded-3xl border-4 border-slate-800 shadow-2xl flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
          <div className="space-y-2">
            <span className="inline-flex items-center gap-1.5 text-xs font-black uppercase tracking-widest text-amber-400 bg-amber-950/80 px-3 py-1 rounded-full border border-amber-600/40">
              <Sparkles className="w-3.5 h-3.5" />
              Centro de Control Global SaaS • Firebase Firestore Directo
            </span>
            <h2 className="text-3xl sm:text-4xl font-black text-white tracking-tight">
              Gestión de Licencias y Talleres Clientes
            </h2>
            <p className="text-base sm:text-lg text-slate-300 font-medium max-w-2xl">
              Crea nuevos talleres con persistencia 100% directa en Firestore, asigna cuentas para Maestros y Operarios, y supervisa métricas globales.
            </p>
          </div>

          <button
            onClick={() => setActiveTab('new_tenant')}
            className="w-full lg:w-auto bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-black text-lg sm:text-xl px-6 py-4 rounded-2xl shadow-xl border-2 border-amber-300 flex items-center justify-center gap-3 transition transform active:scale-95 cursor-pointer whitespace-nowrap"
          >
            <PlusCircle className="w-7 h-7 text-slate-950" />
            + CREAR NUEVO TALLER CLIENTE
          </button>
        </div>

        {/* Global High-Contrast KPI Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
          
          <div className="bg-slate-950 p-6 rounded-3xl border-4 border-amber-500/40 shadow-xl space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-black uppercase tracking-wider bg-amber-950 text-amber-300 px-3 py-1 rounded-full border border-amber-700/50">
                TALLERES EN FIRESTORE
              </span>
              <Building2 className="w-7 h-7 text-amber-400" />
            </div>
            <p className="text-4xl sm:text-5xl font-black text-white">{tenants.length}</p>
            <p className="text-sm font-extrabold text-amber-400">
              {tenants.filter(t => t.status === 'activa').length} Activos • {tenants.filter(t => t.status === 'suspendida').length} Suspendidos
            </p>
          </div>

          <div className="bg-slate-950 p-6 rounded-3xl border-4 border-emerald-500/40 shadow-xl space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-black uppercase tracking-wider bg-emerald-950 text-emerald-300 px-3 py-1 rounded-full border border-emerald-700/50">
                PROYECTOS TOTALES
              </span>
              <BarChart3 className="w-7 h-7 text-emerald-400" />
            </div>
            <p className="text-4xl sm:text-5xl font-black text-white">{stats.totalProjects}</p>
            <p className="text-sm font-extrabold text-emerald-400">
              {stats.totalActiveProjects} Proyectos activos en taller
            </p>
          </div>

          <div className="bg-slate-950 p-6 rounded-3xl border-4 border-cyan-500/40 shadow-xl space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-black uppercase tracking-wider bg-cyan-950 text-cyan-300 px-3 py-1 rounded-full border border-cyan-700/50">
                SEGURIDAD & ROLES
              </span>
              <Users className="w-7 h-7 text-cyan-400" />
            </div>
            <p className="text-4xl sm:text-5xl font-black text-white">
              {tenants.length + tenants.filter(t => Boolean(t.operatorAccount)).length}
            </p>
            <p className="text-sm font-extrabold text-cyan-400">
              {tenants.length} Maestros • {tenants.filter(t => Boolean(t.operatorAccount)).length} Operarios Registrados
            </p>
          </div>

        </div>

        {/* Tab Navigation */}
        <div className="flex border-b-4 border-slate-800 gap-3 sm:gap-6 overflow-x-auto">
          <button
            onClick={() => setActiveTab('tenants')}
            className={`pb-4 text-xl sm:text-2xl font-black transition border-b-4 -mb-1 px-4 cursor-pointer whitespace-nowrap flex items-center gap-2 ${
              activeTab === 'tenants'
                ? 'border-amber-400 text-amber-300'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Building2 className="w-6 h-6" />
            Talleres Clientes en Firestore ({tenants.length})
          </button>

          <button
            onClick={() => setActiveTab('stats')}
            className={`pb-4 text-xl sm:text-2xl font-black transition border-b-4 -mb-1 px-4 cursor-pointer whitespace-nowrap flex items-center gap-2 ${
              activeTab === 'stats'
                ? 'border-amber-400 text-amber-300'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <TrendingUp className="w-6 h-6" />
            Métricas de Uso Mensual
          </button>

          <button
            onClick={() => setActiveTab('new_tenant')}
            className={`pb-4 text-xl sm:text-2xl font-black transition border-b-4 -mb-1 px-4 cursor-pointer whitespace-nowrap flex items-center gap-2 ${
              activeTab === 'new_tenant'
                ? 'border-amber-400 text-amber-300'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <PlusCircle className="w-6 h-6" />
            Formulario Crear Taller
          </button>
        </div>

        {/* ================= TAB 1: GESTIÓN DE TALLERES & LICENCIAS ================= */}
        {activeTab === 'tenants' && (
          <div className="space-y-6">
            
            {/* Search & Filter Bar */}
            <div className="bg-slate-950 p-5 rounded-2xl border-2 border-slate-800 flex flex-col md:flex-row items-center justify-between gap-4">
              <div className="relative w-full md:w-96">
                <Search className="w-5 h-5 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Buscar por taller, dueño, correo o ciudad..."
                  className="w-full bg-slate-900 border border-slate-700 text-white rounded-xl pl-10 pr-4 py-2.5 font-bold focus:border-amber-400 focus:outline-none"
                />
              </div>

              <div className="flex items-center gap-3 w-full md:w-auto">
                <Filter className="w-5 h-5 text-slate-400 shrink-0" />
                <select
                  value={statusFilter}
                  onChange={(e: any) => setStatusFilter(e.target.value)}
                  className="bg-slate-900 border border-slate-700 text-white rounded-xl px-4 py-2.5 font-bold focus:border-amber-400 focus:outline-none cursor-pointer w-full md:w-auto"
                >
                  <option value="all">Todas las licencias</option>
                  <option value="activa">Solo Activas</option>
                  <option value="suspendida">Solo Suspendidas</option>
                </select>
              </div>
            </div>

            {/* Tenants Cards Grid */}
            <div className="grid grid-cols-1 gap-6">
              {filteredTenants.map((t) => (
                <div
                  key={t.id}
                  className={`bg-slate-950 rounded-3xl border-4 shadow-2xl p-6 sm:p-8 space-y-6 transition-all ${
                    t.status === 'activa' ? 'border-slate-800 hover:border-amber-500/60' : 'border-rose-900/60 opacity-90'
                  }`}
                >
                  {/* Card Header: Workshop info & License badge */}
                  <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4 border-b-2 border-slate-800/80 pb-6">
                    <div className="flex items-center gap-4">
                      <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-amber-500/20 border-2 border-amber-400/40 text-amber-300 flex items-center justify-center font-black text-2xl sm:text-3xl shrink-0">
                        🪵
                      </div>
                      <div>
                        <div className="flex items-center gap-3 flex-wrap">
                          <h3 className="text-2xl sm:text-3xl font-black text-white">
                            {t.name}
                          </h3>
                          <span
                            className={`text-xs font-black uppercase px-3 py-1 rounded-full border ${
                              t.status === 'activa'
                                ? 'bg-emerald-950 text-emerald-300 border-emerald-500'
                                : 'bg-rose-950 text-rose-300 border-rose-600'
                            }`}
                          >
                            ● {t.status === 'activa' ? `Licencia Activa (${t.licensePlan})` : 'Licencia Suspendida'}
                          </span>
                        </div>
                        <p className="text-sm font-bold text-slate-400 flex items-center gap-2 mt-1">
                          <span>👤 Dueño: <strong className="text-slate-200">{t.ownerName}</strong></span>
                          <span>•</span>
                          <span>📍 {t.city}</span>
                          {t.taxId && <span>• RFC: {t.taxId}</span>}
                        </p>
                      </div>
                    </div>

                    {/* Quick Simulation / Switch-Tenant Buttons for Super Admin */}
                    <div className="flex items-center gap-2 w-full lg:w-auto flex-wrap">
                      <button
                        onClick={() => onSimulateTenantLogin(t, 'maestro')}
                        className="bg-amber-600 hover:bg-amber-500 text-slate-950 font-black text-sm px-4 py-2.5 rounded-xl border border-amber-300 shadow-md flex items-center gap-2 transition cursor-pointer"
                        title="Abrir taller como Maestro (Acceso Módulos 1, 2, 3 y 4)"
                      >
                        <span>🪚</span>
                        <span>PROBAR COMO MAESTRO</span>
                      </button>

                      {t.operatorAccount ? (
                        <button
                          onClick={() => onSimulateTenantLogin(t, 'operario')}
                          className="bg-orange-800 hover:bg-orange-700 text-amber-100 font-black text-sm px-4 py-2.5 rounded-xl border border-orange-600 shadow-md flex items-center gap-2 transition cursor-pointer"
                          title="Abrir taller como Operario/Chalán (Solo Módulos 2 y 3, sin precios)"
                        >
                          <span>🔨</span>
                          <span>PROBAR COMO OPERARIO</span>
                        </button>
                      ) : (
                        <button
                          disabled
                          className="bg-slate-900 text-slate-500 font-bold text-xs px-3.5 py-2.5 rounded-xl border border-slate-800 flex items-center gap-2 cursor-not-allowed opacity-50 select-none"
                          title="Este taller no tiene cuenta de operario activa"
                        >
                          <span className="opacity-40">🔨</span>
                          <span>PROBAR COMO OPERARIO (DESHABILITADO)</span>
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Body Grid: Metric Tallies & Accounts */}
                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    
                    {/* Column 1: Métricas de Uso del Taller */}
                    <div className="bg-slate-900 p-5 rounded-2xl border border-slate-800 space-y-3">
                      <h4 className="text-xs font-black uppercase tracking-wider text-amber-400 flex items-center gap-2">
                        <Activity className="w-4 h-4" />
                        Métricas de Uso en Taller
                      </h4>

                      <div className="space-y-2">
                        <div className="flex justify-between items-center py-1 border-b border-slate-800 text-sm font-bold">
                          <span className="text-slate-400">Proyectos Activos:</span>
                          <span className="text-white text-base font-black">
                            {getTenantProjects(t.id).length} muebles
                          </span>
                        </div>

                        <div className="flex justify-between items-center py-1 border-b border-slate-800 text-sm font-bold">
                          <span className="text-slate-400">Proyectos Históricos:</span>
                          <span className="text-emerald-400 font-extrabold">{t.totalProjectsCount || getTenantProjects(t.id).length} creados</span>
                        </div>

                        <div className="flex justify-between items-center py-1 border-b border-slate-800 text-sm font-bold">
                          <span className="text-slate-400">Último Acceso:</span>
                          <span className="text-amber-300 font-extrabold">{t.lastAccess || 'Hoy'}</span>
                        </div>

                        <div className="flex justify-between items-center py-1 text-sm font-bold">
                          <span className="text-slate-400">Vencimiento Licencia:</span>
                          <span className="text-slate-200">{t.licenseExpiry || 'Indefinida'}</span>
                        </div>
                      </div>
                    </div>

                    {/* Column 2: Cuenta del Maestro */}
                    <div className="bg-slate-900 p-5 rounded-2xl border border-amber-900/40 space-y-3">
                      <div className="flex items-center justify-between">
                        <h4 className="text-xs font-black uppercase tracking-wider text-amber-300 flex items-center gap-1.5">
                          <span>🪚</span>
                          Cuenta Maestro (Completa)
                        </h4>
                        <span className="text-[10px] bg-amber-400/20 text-amber-300 px-2 py-0.5 rounded-full font-black">
                          MÓDULOS 1, 2, 3, 4
                        </span>
                      </div>

                      <div className="space-y-1.5 text-sm font-bold">
                        <p className="text-white">{t.masterAccount.name}</p>
                        <div className="flex items-center justify-between bg-slate-950 p-2 rounded-xl border border-slate-800 text-xs">
                          <span className="text-slate-300 truncate">{t.masterAccount.email}</span>
                          <button
                            onClick={() => handleCopyText(t.masterAccount.email, `m_email_${t.id}`)}
                            className="text-amber-400 hover:text-amber-300 p-1 shrink-0"
                            title="Copiar Correo"
                          >
                            {copiedKey === `m_email_${t.id}` ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                          </button>
                        </div>
                        <div className="flex items-center justify-between bg-slate-950 p-2 rounded-xl border border-slate-800 text-xs">
                          <span className="text-slate-400">Pass:</span>
                          <span className="text-amber-400 font-mono font-bold">
                            {showPasswords[`m_${t.id}`] ? t.masterAccount.password || 'taller2026' : '••••••••'}
                          </span>
                          <button
                            onClick={() => setShowPasswords(prev => ({ ...prev, [`m_${t.id}`]: !prev[`m_${t.id}`] }))}
                            className="text-slate-400 hover:text-slate-200 p-1"
                          >
                            {showPasswords[`m_${t.id}`] ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* Column 3: Cuenta del Operario / Chalán (Opcional) */}
                    {t.operatorAccount ? (
                      <div className="bg-slate-900 p-5 rounded-2xl border border-orange-900/40 space-y-3">
                        <div className="flex items-center justify-between">
                          <h4 className="text-xs font-black uppercase tracking-wider text-orange-400 flex items-center gap-1.5">
                            <span>🔨</span>
                            Cuenta Operario / Chalán
                          </h4>
                          <div className="flex items-center gap-1.5">
                            <span className="text-[10px] bg-orange-400/20 text-orange-300 px-2 py-0.5 rounded-full font-black">
                              SOLO M2 & M3
                            </span>
                            <button
                              onClick={() => handleDeleteOperatorAccount(t)}
                              className="p-1 text-slate-400 hover:text-rose-400 hover:bg-rose-950/80 rounded-lg transition cursor-pointer"
                              title="Eliminar cuenta de Operario"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>

                        <div className="space-y-1.5 text-sm font-bold">
                          <p className="text-white">{t.operatorAccount.name}</p>
                          <div className="flex items-center justify-between bg-slate-950 p-2 rounded-xl border border-slate-800 text-xs">
                            <span className="text-slate-300 truncate">{t.operatorAccount.email}</span>
                            <button
                              onClick={() => handleCopyText(t.operatorAccount!.email, `op_email_${t.id}`)}
                              className="text-orange-400 hover:text-orange-300 p-1 shrink-0"
                              title="Copiar Correo"
                            >
                              {copiedKey === `op_email_${t.id}` ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                            </button>
                          </div>
                          <div className="flex items-center justify-between bg-slate-950 p-2 rounded-xl border border-slate-800 text-xs">
                            <span className="text-slate-400">Pass:</span>
                            <span className="text-orange-400 font-mono font-bold">
                              {showPasswords[`op_${t.id}`] ? t.operatorAccount.password || 'chalan2026' : '••••••••'}
                            </span>
                            <button
                              onClick={() => setShowPasswords(prev => ({ ...prev, [`op_${t.id}`]: !prev[`op_${t.id}`] }))}
                              className="text-slate-400 hover:text-slate-200 p-1"
                            >
                              {showPasswords[`op_${t.id}`] ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                            </button>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="bg-slate-900/40 p-5 rounded-2xl border border-dashed border-slate-800 space-y-3 flex flex-col justify-between">
                        <div>
                          <div className="flex items-center justify-between">
                            <h4 className="text-xs font-black uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                              <span className="opacity-40">🔨</span>
                              Cuenta Operario / Chalán
                            </h4>
                            <span className="text-[10px] bg-slate-800 text-slate-400 px-2 py-0.5 rounded-full font-bold">
                              NO ASIGNADA (OPCIONAL)
                            </span>
                          </div>
                          <p className="text-xs text-slate-400 mt-2.5 leading-relaxed font-medium">
                            Este taller opera únicamente con la cuenta del Maestro. La cuenta de operario no ha sido creada.
                          </p>
                        </div>

                        <button
                          onClick={() => handleQuickActivateOperator(t)}
                          className="w-full bg-orange-700 hover:bg-orange-600 text-white font-black text-xs px-3.5 py-3 rounded-xl border border-orange-500 shadow-md flex items-center justify-center gap-2 transition cursor-pointer"
                          title="Crear y activar cuenta de operario para este taller en Firestore con un solo clic"
                        >
                          <Sparkles className="w-4 h-4 text-amber-200" />
                          <span>ACTIVAR OPERARIO EN FIRESTORE (1 CLIC)</span>
                        </button>
                      </div>
                    )}

                  </div>

                  {/* Card Footer: Management Buttons */}
                  <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2 border-t border-slate-850">
                    <button
                      onClick={() => setCredentialsModalTenant(t)}
                      className="w-full sm:w-auto bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs px-4 py-2.5 rounded-xl border border-slate-700 flex items-center justify-center gap-2 transition cursor-pointer"
                    >
                      <Copy className="w-4 h-4 text-amber-400" />
                      COPIAR CREDENCIALES PARA ENVIAR AL CLIENTE
                    </button>

                    <div className="flex items-center gap-2 w-full sm:w-auto">
                      <button
                        onClick={() => handleToggleStatus(t.id, t.status)}
                        className={`w-full sm:w-auto font-black text-xs px-4 py-2.5 rounded-xl border flex items-center justify-center gap-2 transition cursor-pointer ${
                          t.status === 'activa'
                            ? 'bg-rose-950/80 hover:bg-rose-900 text-rose-300 border-rose-700'
                            : 'bg-emerald-950/80 hover:bg-emerald-900 text-emerald-300 border-emerald-700'
                        }`}
                      >
                        {t.status === 'activa' ? '⏸️ SUSPENDER LICENCIA' : '▶️ REACTIVAR LICENCIA'}
                      </button>

                      <button
                        onClick={() => handleDeleteTenant(t)}
                        className="p-2.5 bg-slate-900 hover:bg-rose-950 text-slate-400 hover:text-rose-400 rounded-xl border border-slate-800 hover:border-rose-700 transition cursor-pointer"
                        title="Eliminar Taller de Firestore"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                </div>
              ))}

              {filteredTenants.length === 0 && (
                <div className="bg-slate-950 p-12 rounded-3xl border-2 border-slate-800 text-center space-y-4">
                  <div className="text-5xl">🪵</div>
                  <h4 className="text-2xl font-black text-white">No hay talleres clientes registrados en Firestore</h4>
                  <p className="text-slate-400 font-medium max-w-md mx-auto">
                    Haz clic en "Crear Nuevo Taller Cliente" para registrar tu primer taller en Firebase.
                  </p>
                  <button
                    onClick={() => setActiveTab('new_tenant')}
                    className="bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-base px-6 py-3 rounded-xl border border-amber-300 transition cursor-pointer inline-flex items-center gap-2"
                  >
                    <PlusCircle className="w-5 h-5" />
                    Crear Primer Taller
                  </button>
                </div>
              )}
            </div>

          </div>
        )}

        {/* ================= TAB 2: MÉTRICAS DE USO MENSUAL & GRÁFICAS ================= */}
        {activeTab === 'stats' && (
          <div className="space-y-8">
            
            {/* Chart 1: Proyectos Creados por Mes en la Plataforma */}
            <div className="bg-slate-950 p-6 sm:p-8 rounded-3xl border-4 border-slate-800 shadow-2xl space-y-6">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div>
                  <h3 className="text-2xl font-black text-white flex items-center gap-2.5">
                    <TrendingUp className="w-7 h-7 text-amber-400" />
                    CANTIDAD DE PROYECTOS CREADOS POR MES (USO GLOBAL)
                  </h3>
                  <p className="text-sm font-bold text-slate-400 mt-1">
                    Evolución mensual del volumen de diseño y despiece en toda la plataforma
                  </p>
                </div>
                <span className="text-xs font-black bg-amber-950 text-amber-300 px-3 py-1.5 rounded-full border border-amber-600/40">
                  Año en Curso 2026
                </span>
              </div>

              {stats.monthlyTrends.length > 0 ? (
                <div className="h-80 w-full pt-4">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={stats.monthlyTrends}>
                      <defs>
                        <linearGradient id="colorProjects" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.8}/>
                          <stop offset="95%" stopColor="#f59e0b" stopOpacity={0}/>
                        </linearGradient>
                        <linearGradient id="colorCuts" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#10b981" stopOpacity={0.8}/>
                          <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.5} />
                      <XAxis dataKey="monthLabel" stroke="#94a3b8" fontSize={12} fontWeight={700} />
                      <YAxis stroke="#94a3b8" fontSize={12} fontWeight={700} />
                      <Tooltip
                        contentStyle={{ backgroundColor: '#020617', borderColor: '#f59e0b', borderRadius: '16px', color: '#fff', fontWeight: 'bold' }}
                      />
                      <Area type="monotone" dataKey="projectsCount" name="Proyectos Creados" stroke="#f59e0b" strokeWidth={3} fillOpacity={1} fill="url(#colorProjects)" />
                      <Area type="monotone" dataKey="cutsCount" name="Piezas de Corte" stroke="#10b981" strokeWidth={2} fillOpacity={1} fill="url(#colorCuts)" />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                <div className="bg-slate-900 p-8 rounded-2xl text-center text-slate-400 font-bold">
                  Las métricas se generarán conforme los talleres creen proyectos y despieces.
                </div>
              )}
            </div>

            {/* Table of Usage per Tenant */}
            <div className="bg-slate-950 p-6 sm:p-8 rounded-3xl border-4 border-slate-800 shadow-2xl space-y-6">
              <h3 className="text-2xl font-black text-white flex items-center gap-2.5">
                <BarChart3 className="w-7 h-7 text-indigo-400" />
                MÉTRICAS DETALLADAS POR TALLER CLIENTE
              </h3>

              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b-2 border-slate-800 text-xs font-black uppercase text-amber-400 tracking-wider">
                      <th className="py-4 px-4">Taller / Empresa</th>
                      <th className="py-4 px-4">Maestro Encargado</th>
                      <th className="py-4 px-4">Ciudad</th>
                      <th className="py-4 px-4 text-center">Plan Licencia</th>
                      <th className="py-4 px-4 text-center">Proyectos Activos</th>
                      <th className="py-4 px-4 text-center">Total Proyectos</th>
                      <th className="py-4 px-4 text-right">Último Acceso</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-850 text-sm font-bold">
                    {stats.tenantsUsageRanking.map((r, i) => (
                      <tr key={r.id} className="hover:bg-slate-900/60 transition">
                        <td className="py-4 px-4 text-white font-black flex items-center gap-2">
                          <span className="text-amber-400">#{i + 1}</span>
                          <span>{r.name}</span>
                        </td>
                        <td className="py-4 px-4 text-slate-300">{r.owner}</td>
                        <td className="py-4 px-4 text-slate-400">{r.city}</td>
                        <td className="py-4 px-4 text-center">
                          <span className="bg-slate-900 border border-slate-700 text-amber-300 px-3 py-1 rounded-full text-xs font-black uppercase">
                            {r.plan}
                          </span>
                        </td>
                        <td className="py-4 px-4 text-center">
                          <span className="text-emerald-400 font-black text-base">{r.activeProjects}</span>
                        </td>
                        <td className="py-4 px-4 text-center text-white font-black">{r.totalProjects}</td>
                        <td className="py-4 px-4 text-right text-amber-300 font-mono text-xs">{r.lastAccess || 'Hoy'}</td>
                      </tr>
                    ))}
                    {stats.tenantsUsageRanking.length === 0 && (
                      <tr>
                        <td colSpan={7} className="py-8 text-center text-slate-500 font-bold">
                          Sin registros de uso todavía.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

          </div>
        )}

        {/* ================= TAB 3: FORMULARIO CREAR NUEVO TALLER (DIRECT FIRESTORE) ================= */}
        {activeTab === 'new_tenant' && (
          <div className="bg-slate-950 p-6 sm:p-10 rounded-3xl border-4 border-amber-500/40 shadow-2xl space-y-8 max-w-4xl mx-auto">
            
            <div className="border-b-2 border-slate-800 pb-6 space-y-2">
              <h3 className="text-3xl font-black text-white flex items-center gap-3">
                <PlusCircle className="w-8 h-8 text-amber-400" />
                ALTA DE NUEVO TALLER CLIENTE & LICENCIA
              </h3>
              <p className="text-base text-slate-300 font-medium">
                Define los datos del taller cliente y guarda el documento directamente en Firestore con acceso para Maestro y Operario.
              </p>
            </div>

            <form onSubmit={handleCreateWorkshop} className="space-y-8">
              
              {/* Sección 1: Datos Generales del Taller */}
              <div className="space-y-4">
                <h4 className="text-lg font-black text-amber-400 flex items-center gap-2 border-b border-slate-800 pb-2">
                  <Building2 className="w-5 h-5 text-amber-400" />
                  1. Datos del Taller o Carpintería
                </h4>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="block text-xs font-black uppercase text-slate-300">
                      Nombre del Taller / Empresa *
                    </label>
                    <input
                      type="text"
                      required
                      value={nombreTaller}
                      onChange={(e) => handleWorkshopNameChange(e.target.value)}
                      placeholder="Ej. Carpintería Don José"
                      className="w-full bg-slate-900 border-2 border-slate-700 text-white rounded-xl px-4 py-3 font-bold focus:border-amber-400 focus:outline-none"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="block text-xs font-black uppercase text-slate-300">
                      Nombre del Dueño / Maestro Principal *
                    </label>
                    <input
                      type="text"
                      required
                      value={duenoNombre}
                      onChange={(e) => {
                        setDuenoNombre(e.target.value);
                        if (!maestroNombre) setMaestroNombre(e.target.value);
                      }}
                      placeholder="Ej. José Guadalupe Pérez"
                      className="w-full bg-slate-900 border-2 border-slate-700 text-white rounded-xl px-4 py-3 font-bold focus:border-amber-400 focus:outline-none"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="block text-xs font-black uppercase text-slate-300">
                      Ciudad / Estado *
                    </label>
                    <input
                      type="text"
                      required
                      value={ciudad}
                      onChange={(e) => setCiudad(e.target.value)}
                      placeholder="Ej. Guadalajara, Jalisco"
                      className="w-full bg-slate-900 border-2 border-slate-700 text-white rounded-xl px-4 py-3 font-bold focus:border-amber-400 focus:outline-none"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="block text-xs font-black uppercase text-slate-300">
                      Teléfono / WhatsApp *
                    </label>
                    <input
                      type="tel"
                      required
                      value={telefono}
                      onChange={(e) => setTelefono(e.target.value)}
                      placeholder="Ej. 33 1234 5678"
                      className="w-full bg-slate-900 border-2 border-slate-700 text-white rounded-xl px-4 py-3 font-bold focus:border-amber-400 focus:outline-none"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="block text-xs font-black uppercase text-slate-300">
                      RFC / Identificación Fiscal (Opcional)
                    </label>
                    <input
                      type="text"
                      value={taxId}
                      onChange={(e) => setTaxId(e.target.value)}
                      placeholder="Ej. PEGJ800101XYZ"
                      className="w-full bg-slate-900 border-2 border-slate-700 text-white rounded-xl px-4 py-3 font-bold focus:border-amber-400 focus:outline-none"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="block text-xs font-black uppercase text-slate-300">
                      Dirección Física del Taller (Opcional)
                    </label>
                    <input
                      type="text"
                      value={address}
                      onChange={(e) => setAddress(e.target.value)}
                      placeholder="Ej. Av. Hidalgo 450, Col. Centro"
                      className="w-full bg-slate-900 border-2 border-slate-700 text-white rounded-xl px-4 py-3 font-bold focus:border-amber-400 focus:outline-none"
                    />
                  </div>
                </div>
              </div>

              {/* Sección 2: Plan de Licencia y Vencimiento */}
              <div className="space-y-4">
                <h4 className="text-lg font-black text-amber-400 flex items-center gap-2 border-b border-slate-800 pb-2">
                  <ShieldCheck className="w-5 h-5 text-amber-400" />
                  2. Plan de Licencia y Vigencia
                </h4>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="block text-xs font-black uppercase text-slate-300">
                      Tipo de Licencia *
                    </label>
                    <select
                      value={plan}
                      onChange={(e: any) => handlePlanChange(e.target.value)}
                      className="w-full bg-slate-900 border-2 border-slate-700 text-white rounded-xl px-4 py-3 font-bold focus:border-amber-400 focus:outline-none cursor-pointer"
                    >
                      <option value="anual">Licencia Anual (1 Año)</option>
                      <option value="mensual">Licencia Mensual (30 Días)</option>
                      <option value="vitalicia">Licencia Vitalicia / Ilimitada</option>
                      <option value="demo">Licencia Demo de Prueba (14 Días)</option>
                    </select>
                  </div>

                  <div className="space-y-1.5">
                    <label className="block text-xs font-black uppercase text-slate-300">
                      Fecha de Vencimiento *
                    </label>
                    <input
                      type="date"
                      required
                      value={vencimiento}
                      onChange={(e) => setVencimiento(e.target.value)}
                      className="w-full bg-slate-900 border-2 border-slate-700 text-white rounded-xl px-4 py-3 font-bold focus:border-amber-400 focus:outline-none"
                    />
                  </div>
                </div>
              </div>

              {/* Sección 3: Cuenta de Acceso para el Maestro */}
              <div className="bg-slate-900 p-6 rounded-2xl border-2 border-amber-500/30 space-y-4">
                <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                  <h4 className="text-base font-black text-amber-300 flex items-center gap-2">
                    <span>🪚</span>
                    3. Cuenta Principal del Maestro Encargado
                  </h4>
                  <span className="text-xs bg-amber-400/20 text-amber-300 font-bold px-2.5 py-0.5 rounded-full">
                    ACCESO COMPLETO (M1, M2, M3, M4)
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-1.5">
                    <label className="block text-xs font-black uppercase text-slate-300">
                      Nombre del Maestro
                    </label>
                    <input
                      type="text"
                      value={maestroNombre}
                      onChange={(e) => setMaestroNombre(e.target.value)}
                      placeholder="Ej. Maestro José"
                      className="w-full bg-slate-950 border border-slate-700 text-white rounded-xl px-4 py-2.5 font-bold focus:border-amber-400 focus:outline-none text-sm"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="block text-xs font-black uppercase text-slate-300">
                      Correo Electrónico (Login) *
                    </label>
                    <input
                      type="email"
                      required
                      value={maestroEmail}
                      onChange={(e) => setMaestroEmail(e.target.value)}
                      placeholder="maestro@taller.com"
                      className="w-full bg-slate-950 border border-slate-700 text-white rounded-xl px-4 py-2.5 font-bold focus:border-amber-400 focus:outline-none text-sm font-mono"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="block text-xs font-black uppercase text-slate-300">
                      Contraseña Asignada *
                    </label>
                    <input
                      type="text"
                      required
                      value={maestroPassword}
                      onChange={(e) => setMaestroPassword(e.target.value)}
                      placeholder="taller2026"
                      className="w-full bg-slate-950 border border-slate-700 text-amber-300 rounded-xl px-4 py-2.5 font-bold focus:border-amber-400 focus:outline-none text-sm font-mono"
                    />
                  </div>
                </div>
              </div>

              {/* Sección 4: Cuenta Opcional para el Operario / Chalán */}
              <div className="bg-slate-900 p-6 rounded-2xl border-2 border-orange-500/30 space-y-4">
                <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                  <div className="flex items-center gap-3">
                    <input
                      type="checkbox"
                      id="enableOperator"
                      checked={hasOperario}
                      onChange={(e) => setHasOperario(e.target.checked)}
                      className="w-5 h-5 accent-orange-500 rounded cursor-pointer"
                    />
                    <label htmlFor="enableOperator" className="text-base font-black text-orange-400 flex items-center gap-2 cursor-pointer">
                      <span>🔨</span>
                      4. Activar Cuenta de Operario / Chalán (Opcional)
                    </label>
                  </div>
                  <span className="text-xs bg-orange-400/20 text-orange-300 font-bold px-2.5 py-0.5 rounded-full">
                    SOLO CORTE & SOBRANTES (SIN PRECIOS)
                  </span>
                </div>

                {hasOperario ? (
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
                    <div className="space-y-1.5">
                      <label className="block text-xs font-black uppercase text-slate-300">
                        Nombre del Operario
                      </label>
                      <input
                        type="text"
                        value={operarioNombre}
                        onChange={(e) => setOperarioNombre(e.target.value)}
                        placeholder="Ej. Luis Hernández"
                        className="w-full bg-slate-950 border border-slate-700 text-white rounded-xl px-4 py-2.5 font-bold focus:border-orange-400 focus:outline-none text-sm"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="block text-xs font-black uppercase text-slate-300">
                        Correo de Acceso (Login) *
                      </label>
                      <input
                        type="email"
                        required={hasOperario}
                        value={operarioEmail}
                        onChange={(e) => setOperarioEmail(e.target.value)}
                        placeholder="operario@taller.com"
                        className="w-full bg-slate-950 border border-slate-700 text-white rounded-xl px-4 py-2.5 font-bold focus:border-orange-400 focus:outline-none text-sm font-mono"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="block text-xs font-black uppercase text-slate-300">
                        Contraseña Asignada *
                      </label>
                      <input
                        type="text"
                        required={hasOperario}
                        value={operarioPassword}
                        onChange={(e) => setOperarioPassword(e.target.value)}
                        placeholder="chalan2026"
                        className="w-full bg-slate-950 border border-slate-700 text-orange-300 rounded-xl px-4 py-2.5 font-bold focus:border-orange-400 focus:outline-none text-sm font-mono"
                      />
                    </div>
                  </div>
                ) : (
                  <p className="text-xs text-slate-400 font-medium">
                    Marcando la casilla puedes crear una cuenta restringida para el chalán u operario de corte. Si no la activas, el taller funcionará únicamente con la cuenta del Maestro.
                  </p>
                )}
              </div>

              {/* Sección 5: Notas Administrativas */}
              <div className="space-y-1.5">
                <label className="block text-xs font-black uppercase text-slate-300">
                  Notas Internas de Administración (Opcional)
                </label>
                <textarea
                  rows={2}
                  value={customNotes}
                  onChange={(e) => setCustomNotes(e.target.value)}
                  placeholder="Ej. Taller especializado en cocinas integrales. Pago de licencia recibido por transferencia."
                  className="w-full bg-slate-900 border-2 border-slate-700 text-white rounded-xl p-4 font-bold focus:border-amber-400 focus:outline-none text-sm"
                />
              </div>

              {/* Botón de Guardado */}
              <div className="pt-4 flex flex-col sm:flex-row items-center gap-4">
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full sm:w-auto flex-1 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 disabled:opacity-50 text-slate-950 font-black text-xl px-8 py-5 rounded-2xl shadow-2xl border-2 border-amber-300 flex items-center justify-center gap-3 transition transform active:scale-95 cursor-pointer"
                >
                  {loading ? (
                    <>
                      <RefreshCw className="w-7 h-7 text-slate-950 animate-spin" />
                      <span>GUARDANDO...</span>
                    </>
                  ) : (
                    <>
                      <PlusCircle className="w-7 h-7 text-slate-950" />
                      <span>Guardar Taller</span>
                    </>
                  )}
                </button>

                <button
                  type="button"
                  onClick={() => setActiveTab('tenants')}
                  className="w-full sm:w-auto bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-base px-6 py-5 rounded-2xl border border-slate-700 transition cursor-pointer"
                >
                  Cancelar
                </button>
              </div>

            </form>

          </div>
        )}

      </main>

      {/* ================= MODAL: CREDENCIALES DE ACCESO ================= */}
      {credentialsModalTenant && (
        <div className="fixed inset-0 bg-slate-950/85 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-950 border-4 border-amber-400 rounded-3xl p-6 sm:p-8 max-w-xl w-full shadow-2xl space-y-6 animate-in fade-in zoom-in-95 duration-200">
            
            <div className="flex items-center justify-between border-b-2 border-slate-800 pb-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-amber-500/20 text-amber-300 border border-amber-400 flex items-center justify-center text-2xl font-black">
                  🪵
                </div>
                <div>
                  <h3 className="text-2xl font-black text-white">
                    {credentialsModalTenant.name}
                  </h3>
                  <p className="text-xs font-bold text-amber-400">
                    Credenciales de Acceso al Sistema
                  </p>
                </div>
              </div>

              <button
                onClick={() => setCredentialsModalTenant(null)}
                className="text-slate-400 hover:text-white p-2 rounded-xl bg-slate-900 border border-slate-800 text-sm font-bold cursor-pointer"
              >
                ✕ Cerrar
              </button>
            </div>

            {/* Credenciales Maestro */}
            <div className="bg-slate-900 p-5 rounded-2xl border-2 border-amber-500/40 space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="text-sm font-black text-amber-300 uppercase flex items-center gap-2">
                  <span>🪚</span>
                  Cuenta Maestro (Completa)
                </h4>
                <span className="text-[10px] bg-amber-400/20 text-amber-300 px-2 py-0.5 rounded-full font-bold">
                  MÓDULOS 1, 2, 3, 4
                </span>
              </div>

              <div className="space-y-2 text-xs font-bold font-mono">
                <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 flex justify-between items-center">
                  <span className="text-slate-400">Correo:</span>
                  <span className="text-white">{credentialsModalTenant.masterAccount.email}</span>
                </div>
                <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 flex justify-between items-center">
                  <span className="text-slate-400">Contraseña:</span>
                  <span className="text-amber-300">{credentialsModalTenant.masterAccount.password || 'taller2026'}</span>
                </div>
              </div>
            </div>

            {/* Credenciales Operario */}
            {credentialsModalTenant.operatorAccount && (
              <div className="bg-slate-900 p-5 rounded-2xl border-2 border-orange-500/40 space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-black text-orange-400 uppercase flex items-center gap-2">
                    <span>🔨</span>
                    Cuenta Operario / Chalán
                  </h4>
                  <span className="text-[10px] bg-orange-400/20 text-orange-300 px-2 py-0.5 rounded-full font-bold">
                    SOLO CORTE (M2 & M3)
                  </span>
                </div>

                <div className="space-y-2 text-xs font-bold font-mono">
                  <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 flex justify-between items-center">
                    <span className="text-slate-400">Correo:</span>
                    <span className="text-white">{credentialsModalTenant.operatorAccount.email}</span>
                  </div>
                  <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 flex justify-between items-center">
                    <span className="text-slate-400">Contraseña:</span>
                    <span className="text-orange-300">{credentialsModalTenant.operatorAccount.password || 'chalan2026'}</span>
                  </div>
                </div>
              </div>
            )}

            {/* Botón para copiar texto formateado para WhatsApp / Correo */}
            <button
              onClick={() => {
                const text = `🪵 *ACCESO AL SISTEMA DE CARPINTERÍA - ${credentialsModalTenant.name.toUpperCase()}*\n\n` +
                  `🪚 *Cuenta de Maestro (Acceso Total):*\n` +
                  `• Correo: ${credentialsModalTenant.masterAccount.email}\n` +
                  `• Contraseña: ${credentialsModalTenant.masterAccount.password || 'taller2026'}\n\n` +
                  (credentialsModalTenant.operatorAccount ? (
                    `🔨 *Cuenta de Operario (Solo Corte y Sobrantes):*\n` +
                    `• Correo: ${credentialsModalTenant.operatorAccount.email}\n` +
                    `• Contraseña: ${credentialsModalTenant.operatorAccount.password || 'chalan2026'}\n\n`
                  ) : '') +
                  `📅 Vigencia de Licencia: ${credentialsModalTenant.licenseExpiry || 'Activa'}\n` +
                  `🌐 Enlace de acceso: ${typeof window !== 'undefined' ? window.location.origin : ''}`;

                handleCopyText(text, 'modal_full_text');
              }}
              className="w-full bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-base py-4 rounded-2xl border-2 border-amber-300 shadow-xl flex items-center justify-center gap-2 transition cursor-pointer"
            >
              {copiedKey === 'modal_full_text' ? (
                <>
                  <Check className="w-5 h-5 text-slate-950" />
                  <span>¡TEXTO COPIADO AL PORTAPAPELES!</span>
                </>
              ) : (
                <>
                  <Copy className="w-5 h-5 text-slate-950" />
                  <span>COPIAR MENSAJE COMPLETO PARA WHATSAPP</span>
                </>
              )}
            </button>

          </div>
        </div>
      )}

    </div>
  );
};
