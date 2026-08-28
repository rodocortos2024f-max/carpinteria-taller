import React, { useState, useEffect, useRef } from 'react';
import { User, ViewMode, Project, OffcutItem, AppActivityLog, WorkshopTenant } from './types';
import { Navbar } from './components/Navbar';
import { LoginView } from './components/LoginView';
import { MainMenu } from './components/MainMenu';
import { ProjectsView } from './components/ProjectsView';
import { CuttingOptimizerView } from './components/CuttingOptimizerView';
import { OffcutsView } from './components/OffcutsView';
import { AdminPanel } from './components/AdminPanel';
import { AssemblyModule } from './components/AssemblyModule';
import { BudgetView } from './components/BudgetView';
import { SuperAdminPanel } from './components/SuperAdminPanel';
import { FirebaseModal } from './components/FirebaseModal';
import { isVoiceAudioEnabled, toggleVoiceAudio } from './utils/cutCalculator';
import {
  checkOfflineLicenseStatus,
  recordSuccessfulFirebaseValidation,
  getOfflineLockoutMessage,
  setOfflineLockoutMessage,
  clearOfflineLockoutMessage
} from './utils/licenseSecurity';
import {
  getTenantProjects,
  saveTenantProjects,
  getTenantOffcuts,
  saveTenantOffcuts,
  getTenantLogs,
  saveTenantLogs,
  getAllTenants
} from './utils/tenants';

export default function App() {
  // Current Logged-in User (Mandatory Login on app launch)
  const [currentUser, setCurrentUser] = useState<User | null>(null);

  // Current Active View (Starts strictly at Login screen)
  const [currentView, setCurrentView] = useState<ViewMode>('login');

  // Workshop Voice Audio Confirmation State
  const [isVoiceActive, setIsVoiceActive] = useState<boolean>(() => isVoiceAudioEnabled());

  useEffect(() => {
    const handleVoiceChange = (e: any) => {
      setIsVoiceActive(e.detail?.enabled ?? isVoiceAudioEnabled());
    };
    window.addEventListener('carpinteria_voice_audio_change', handleVoiceChange);
    window.addEventListener('storage', handleVoiceChange);
    return () => {
      window.removeEventListener('carpinteria_voice_audio_change', handleVoiceChange);
      window.removeEventListener('storage', handleVoiceChange);
    };
  }, []);

  const handleToggleVoiceAudio = () => {
    const next = toggleVoiceAudio();
    setIsVoiceActive(next);
    addLog(
      next ? 'Voz Activada' : 'Voz Silenciada',
      next ? 'Se activaron las confirmaciones y alertas por voz del taller.' : 'Se silenciaron las alertas por voz.'
    );
  };

  // Projects State (Tenant Isolated)
  const [projects, setProjects] = useState<Project[]>(() => {
    return getTenantProjects(currentUser?.tenantId);
  });

  const loadedTenantIdRef = useRef<string | undefined>(currentUser?.tenantId);

  // Active Project ID across all modules
  const [activeProjectId, setActiveProjectId] = useState<string>(() => {
    const tenantId = currentUser?.tenantId || 'global';
    const savedActive = localStorage.getItem(`carpinteria_active_project_id_${tenantId}`);
    if (savedActive) return savedActive;
    const initialList = getTenantProjects(currentUser?.tenantId);
    return initialList[0]?.id || 'proj_1';
  });

  // Active Cuts to Optimize in Module 2
  const [optimizerData, setOptimizerData] = useState<{
    cuts: any[];
    materialType: string;
    thicknessMm: number;
    projectName: string;
  }>(() => {
    const initialList = getTenantProjects(currentUser?.tenantId);
    const defaultProj = initialList[0];
    const initialCuts = defaultProj
      ? (defaultProj.furnitureUnits && defaultProj.furnitureUnits.length > 0
          ? defaultProj.furnitureUnits.flatMap(u => u.cuts.map(c => ({ ...c, furnitureId: c.furnitureId || u.id, furnitureName: c.furnitureName || u.name })))
          : defaultProj.cuts)
      : [];
    return {
      cuts: initialCuts,
      materialType: defaultProj ? defaultProj.materialType : 'Melamina Blanca',
      thicknessMm: defaultProj ? defaultProj.thicknessMm : 15,
      projectName: defaultProj ? defaultProj.name : 'Proyecto Taller'
    };
  });

  // Offcuts State (Tenant Isolated)
  const [offcuts, setOffcuts] = useState<OffcutItem[]>(() => {
    return getTenantOffcuts(currentUser?.tenantId);
  });

  // Activity Logs (Tenant Isolated)
  const [activityLogs, setActivityLogs] = useState<AppActivityLog[]>(() => {
    return getTenantLogs(currentUser?.tenantId);
  });

  // Firebase Modal Visibility State
  const [isFirebaseModalOpen, setIsFirebaseModalOpen] = useState(false);

  // Security & Offline License 24-Hour Expiration Check Effect
  useEffect(() => {
    const verifyOfflineLicense = () => {
      const status = checkOfflineLicenseStatus();

      // If user is logged in (not Super Admin) and offline limit of 24 hours exceeded
      if (currentUser && currentUser.role !== 'superadmin' && status.isExpired) {
        const lockoutReason = `SESIÓN CERRADA AUTOMÁTICAMENTE: La aplicación ha superado las 24 horas continuas sin conexión a internet desde la última validación exitosa con Firebase (${status.lastValidationFormatted}). Por favor conecte el dispositivo a internet para revalidar la licencia del taller.`;
        setOfflineLockoutMessage(lockoutReason);
        handleLogout();
        return;
      }

      // If online and user is active, periodically keep Firebase validation fresh
      if (typeof navigator !== 'undefined' && navigator.onLine && currentUser) {
        // Auto-refresh validation if more than 30 minutes have passed since last record
        const elapsed = Date.now() - status.lastValidationTimestamp;
        if (elapsed > 30 * 60 * 1000) {
          recordSuccessfulFirebaseValidation('periodic_online_heartbeat');
        }
      }
    };

    // Check immediately on mount and user change
    verifyOfflineLicense();

    // Check periodically every 20 seconds
    const interval = setInterval(verifyOfflineLicense, 20000);

    // Also check on network status and window focus events
    const handleNetworkChange = () => verifyOfflineLicense();
    window.addEventListener('online', handleNetworkChange);
    window.addEventListener('offline', handleNetworkChange);
    window.addEventListener('focus', handleNetworkChange);
    window.addEventListener('carpinteria_firebase_validation_updated', handleNetworkChange);

    return () => {
      clearInterval(interval);
      window.removeEventListener('online', handleNetworkChange);
      window.removeEventListener('offline', handleNetworkChange);
      window.removeEventListener('focus', handleNetworkChange);
      window.removeEventListener('carpinteria_firebase_validation_updated', handleNetworkChange);
    };
  }, [currentUser]);

  // Sync state to LocalStorage per Tenant
  useEffect(() => {
    if (currentUser) {
      localStorage.setItem('carpinteria_user', JSON.stringify(currentUser));
    } else {
      localStorage.removeItem('carpinteria_user');
    }
  }, [currentUser]);

  useEffect(() => {
    if (currentUser?.tenantId && loadedTenantIdRef.current === currentUser.tenantId) {
      saveTenantProjects(currentUser.tenantId, projects);
    }
  }, [projects, currentUser?.tenantId]);

  useEffect(() => {
    if (activeProjectId && currentUser?.tenantId) {
      localStorage.setItem(`carpinteria_active_project_id_${currentUser.tenantId}`, activeProjectId);
    }
  }, [activeProjectId, currentUser?.tenantId]);

  useEffect(() => {
    if (currentUser?.tenantId && loadedTenantIdRef.current === currentUser.tenantId) {
      saveTenantOffcuts(currentUser.tenantId, offcuts);
    }
  }, [offcuts, currentUser?.tenantId]);

  useEffect(() => {
    if (currentUser?.tenantId && loadedTenantIdRef.current === currentUser.tenantId) {
      saveTenantLogs(currentUser.tenantId, activityLogs);
    }
  }, [activityLogs, currentUser?.tenantId]);

  // Log Helper
  const addLog = (action: string, details: string) => {
    const newLog: AppActivityLog = {
      id: 'log_' + Math.random().toString(36).substring(2, 8),
      timestamp: new Date().toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }),
      user: currentUser ? currentUser.name : 'Usuario Taller',
      action,
      details
    };
    setActivityLogs(prev => [newLog, ...prev]);
  };

  // Reload Tenant Data when user switches
  const loadTenantData = (tenantId?: string) => {
    const tenantProjects = getTenantProjects(tenantId);
    const tenantOffcuts = getTenantOffcuts(tenantId);
    const tenantLogs = getTenantLogs(tenantId);

    loadedTenantIdRef.current = tenantId;
    setProjects(tenantProjects);
    setOffcuts(tenantOffcuts);
    setActivityLogs(tenantLogs);

    const firstProj = tenantProjects[0];
    if (firstProj) {
      setActiveProjectId(firstProj.id);
      const allCuts = (firstProj.furnitureUnits && firstProj.furnitureUnits.length > 0)
        ? firstProj.furnitureUnits.flatMap(u => u.cuts.map(c => ({
            ...c,
            furnitureId: c.furnitureId || u.id,
            furnitureName: c.furnitureName || u.name,
            materialType: c.materialType || u.materialType || firstProj.materialType,
            thicknessMm: c.thicknessMm || u.thicknessMm || firstProj.thicknessMm
          })))
        : firstProj.cuts;

      setOptimizerData({
        cuts: allCuts,
        materialType: firstProj.materialType,
        thicknessMm: firstProj.thicknessMm,
        projectName: firstProj.name
      });
    } else {
      setActiveProjectId('');
      setOptimizerData({
        cuts: [],
        materialType: 'Melamina Blanca',
        thicknessMm: 15,
        projectName: 'Nuevo Proyecto'
      });
    }
  };

  // Handlers
  const handleLogin = (user: User) => {
    setCurrentUser(user);
    loadTenantData(user.tenantId);

    if (user.role === 'superadmin') {
      setCurrentView('superadmin');
    } else if (user.role === 'operario' || user.role === 'ayudante') {
      setCurrentView('optimizer');
    } else {
      setCurrentView('menu');
    }

    addLog('Inicio de Sesión', `Accedió con el correo ${user.email} (${user.role.toUpperCase()})`);
  };

  const handleLogout = () => {
    if (currentUser) {
      addLog('Cierre de Sesión', `El usuario ${currentUser.name} cerró sesión.`);
    }
    loadedTenantIdRef.current = undefined;
    setCurrentUser(null);
    setProjects([]);
    setOffcuts([]);
    setActivityLogs([]);
    setCurrentView('login');
  };

  // Super Admin Action: Simulate/Switch into a client workshop
  const handleSimulateTenantLogin = (tenant: WorkshopTenant, role: 'maestro' | 'operario') => {
    if (role === 'operario' && !tenant.operatorAccount) {
      alert(`El taller "${tenant.name}" no tiene configurada una cuenta de Operario.`);
      return;
    }

    const simUser: User = {
      id: role === 'maestro' ? tenant.masterAccount.id : tenant.operatorAccount!.id,
      name: role === 'maestro' ? tenant.masterAccount.name : tenant.operatorAccount!.name,
      email: role === 'maestro' ? tenant.masterAccount.email : tenant.operatorAccount!.email,
      role: role,
      tenantId: tenant.id,
      tenantName: tenant.name,
      isFirebaseConfigured: false
    };

    setCurrentUser(simUser);
    loadTenantData(tenant.id);
    setCurrentView(role === 'operario' ? 'optimizer' : 'menu');
    addLog('Simulación Super Admin', `Super Admin ingresó al taller "${tenant.name}" con rol de ${role.toUpperCase()}`);
  };

  const handleSaveProject = (newProject: Project) => {
    setProjects(prev => {
      const index = prev.findIndex(p => p.id === newProject.id);
      if (index >= 0) {
        if (JSON.stringify(prev[index]) === JSON.stringify(newProject)) {
          return prev;
        }
        const updated = [...prev];
        updated[index] = newProject;
        return updated;
      }
      return [newProject, ...prev];
    });
    setActiveProjectId(prev => prev === newProject.id ? prev : newProject.id);

    // Synchronize optimizer data in real time for Module 2
    const allCuts = (newProject.furnitureUnits && newProject.furnitureUnits.length > 0)
      ? newProject.furnitureUnits.flatMap(u => u.cuts.map(c => ({
          ...c,
          furnitureId: c.furnitureId || u.id,
          furnitureName: c.furnitureName || u.name,
          materialType: c.materialType || u.materialType || newProject.materialType,
          thicknessMm: c.thicknessMm || u.thicknessMm || newProject.thicknessMm
        })))
      : newProject.cuts;

    setOptimizerData({
      cuts: allCuts,
      materialType: newProject.materialType,
      thicknessMm: newProject.thicknessMm,
      projectName: newProject.name
    });
  };

  const handleDeleteProject = (id: string) => {
    const target = projects.find(p => p.id === id);
    const updated = projects.filter(p => p.id !== id);
    setProjects(updated);
    if (target) {
      addLog('Proyecto Eliminado', `Eliminó el proyecto "${target.name}".`);
    }
    if (activeProjectId === id && updated.length > 0) {
      setActiveProjectId(updated[0].id);
    }
  };

  const handleAddOffcut = (newItem: OffcutItem) => {
    setOffcuts(prev => [newItem, ...prev]);
    addLog('Retazo Guardado', `Añadió retazo de ${newItem.materialType} (${newItem.lengthCm}x${newItem.widthCm}cm) en ${newItem.location}.`);
  };

  const handleUpdateOffcut = (updatedItem: OffcutItem) => {
    setOffcuts(prev => prev.map(o => o.id === updatedItem.id ? updatedItem : o));
    addLog('Retazo Actualizado', `Actualizó medidas de retazo #${updatedItem.id}: ${updatedItem.lengthCm}x${updatedItem.widthCm}cm (${updatedItem.status}).`);
  };

  const handleUpdateOffcutStatus = (id: string, status: 'disponible' | 'reservado' | 'usado') => {
    setOffcuts(prev => prev.map(o => o.id === id ? { ...o, status } : o));
    addLog('Estado Retazo', `Cambió estado de retazo a ${status.toUpperCase()}.`);
  };

  const handleDeleteOffcut = (id: string) => {
    setOffcuts(prev => prev.filter(o => o.id !== id));
  };

  const handleProceedToOptimizer = (cuts: any[], materialType: string, thicknessMm: number, projectName: string) => {
    setOptimizerData({
      cuts,
      materialType,
      thicknessMm,
      projectName
    });
    setCurrentView('optimizer');
    addLog('Paso a Módulo 2', `Inició optimización de corte para "${projectName}" con ${cuts.length} piezas.`);
  };

  const handleProceedToAssembly = (projectId?: string) => {
    const targetId = projectId || activeProjectId || (projects.length > 0 ? projects[0].id : undefined);
    if (targetId) {
      setActiveProjectId(targetId);
    }
    setCurrentView('assembly');
    addLog('Paso a Módulo 3', `Ingresó al Módulo de Armado en Taller.`);
  };

  // Safe navigation between modules: checks RBAC and synchronizes active project
  const handleNavigate = (targetView: ViewMode) => {
    // RBAC: If operario tries to go to budget or project creation, redirect safely
    const isOperator = currentUser?.role === 'operario' || currentUser?.role === 'ayudante';
    if (isOperator && (targetView === 'budget' || targetView === 'admin')) {
      setCurrentView('optimizer');
      return;
    }

    const currentProj = projects.find(p => p.id === activeProjectId) || projects[0];
    if (currentProj) {
      const allCuts = (currentProj.furnitureUnits && currentProj.furnitureUnits.length > 0)
        ? currentProj.furnitureUnits.flatMap(u => u.cuts.map(c => ({
            ...c,
            furnitureId: c.furnitureId || u.id,
            furnitureName: c.furnitureName || u.name,
            materialType: c.materialType || u.materialType || currentProj.materialType,
            thicknessMm: c.thicknessMm || u.thicknessMm || currentProj.thicknessMm
          })))
        : currentProj.cuts;

      setOptimizerData({
        cuts: allCuts,
        materialType: currentProj.materialType,
        thicknessMm: currentProj.thicknessMm,
        projectName: currentProj.name
      });
    }
    setCurrentView(targetView);
  };

  return (
    <div className="min-h-screen bg-amber-50/40 text-slate-900 font-sans pb-12 selection:bg-amber-500 selection:text-white">
      
      {/* Top Header Navbar */}
      <Navbar
        currentUser={currentUser}
        currentView={currentView}
        isVoiceAudioEnabled={isVoiceActive}
        onToggleVoiceAudio={handleToggleVoiceAudio}
        onNavigate={handleNavigate}
        onLogout={handleLogout}
        onToggleFirebaseInfo={() => setIsFirebaseModalOpen(true)}
      />

      {/* Main View Router */}
      <main className="transition-all duration-200">
        {!currentUser || currentView === 'login' ? (
          <LoginView
            onLogin={handleLogin}
          />
        ) : currentView === 'superadmin' ? (
          <SuperAdminPanel
            currentUser={currentUser}
            onLogout={handleLogout}
            onSimulateTenantLogin={handleSimulateTenantLogin}
          />
        ) : currentView === 'menu' ? (
          <MainMenu
            currentUser={currentUser}
            onNavigate={handleNavigate}
            projectsCount={projects.length}
            offcutsCount={offcuts.filter(o => o.status === 'disponible').length}
            isVoiceAudioEnabled={isVoiceActive}
            onToggleVoiceAudio={handleToggleVoiceAudio}
          />
        ) : currentView === 'project' ? (
          <ProjectsView
            projects={projects}
            activeProjectId={activeProjectId}
            currentUser={currentUser}
            onSelectProject={(id) => setActiveProjectId(id)}
            onSaveProject={handleSaveProject}
            onDeleteProject={handleDeleteProject}
            onBackToMenu={() => handleNavigate('menu')}
            onProceedToOptimizer={handleProceedToOptimizer}
            onNavigateToAssembly={handleProceedToAssembly}
          />
        ) : currentView === 'optimizer' ? (
          <CuttingOptimizerView
            cuts={optimizerData.cuts}
            projectName={optimizerData.projectName}
            projectId={activeProjectId || undefined}
            materialType={optimizerData.materialType}
            thicknessMm={optimizerData.thicknessMm}
            offcuts={offcuts}
            onUpdateOffcut={handleUpdateOffcut}
            onUpdateOffcutStatus={handleUpdateOffcutStatus}
            onDeleteOffcut={handleDeleteOffcut}
            onBackToProject={() => handleNavigate('project')}
            onSaveOffcut={handleAddOffcut}
            onNavigateToAssembly={() => handleProceedToAssembly(activeProjectId || (projects[0]?.id))}
          />
        ) : currentView === 'assembly' ? (
          <AssemblyModule
            projects={projects}
            activeProjectId={activeProjectId || undefined}
            onBackToMenu={() => handleNavigate('menu')}
            onNavigateToOptimizer={() => handleNavigate('optimizer')}
            onNavigateToProject={() => handleNavigate('project')}
            onNavigateToBudget={(projectId) => {
              if (projectId) setActiveProjectId(projectId);
              handleNavigate('budget');
            }}
            onSelectProject={(id) => setActiveProjectId(id)}
          />
        ) : currentView === 'budget' ? (
          <BudgetView
            projects={projects}
            activeProjectId={activeProjectId || undefined}
            onBackToMenu={() => handleNavigate('menu')}
            onNavigateToOptimizer={handleProceedToOptimizer}
            onNavigateToProject={() => handleNavigate('project')}
            onNavigateToAssembly={handleProceedToAssembly}
            onSelectProject={(id) => setActiveProjectId(id)}
          />
        ) : currentView === 'offcuts' ? (
          <OffcutsView
            offcuts={offcuts}
            onAddOffcut={handleAddOffcut}
            onUpdateOffcutStatus={handleUpdateOffcutStatus}
            onDeleteOffcut={handleDeleteOffcut}
            onBackToMenu={() => handleNavigate('menu')}
          />
        ) : currentView === 'admin' ? (
          <AdminPanel
            projects={projects}
            offcuts={offcuts}
            activityLogs={activityLogs}
            onBackToMenu={() => handleNavigate('menu')}
          />
        ) : null}
      </main>

      {/* Firebase Info Modal */}
      <FirebaseModal
        isOpen={isFirebaseModalOpen}
        onClose={() => setIsFirebaseModalOpen(false)}
        isConfigured={currentUser?.isFirebaseConfigured || false}
      />

    </div>
  );
}
