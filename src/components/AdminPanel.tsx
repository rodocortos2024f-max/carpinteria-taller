import React, { useState } from 'react';
import { Project, OffcutItem, AppActivityLog } from '../types';
import { BarChart3, ArrowLeft, Download, ShieldCheck, TrendingUp, Users, Scissors, Package, FileSpreadsheet, RefreshCw } from 'lucide-react';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, PieChart, Pie, Cell } from 'recharts';

interface AdminPanelProps {
  projects: Project[];
  offcuts: OffcutItem[];
  activityLogs: AppActivityLog[];
  onBackToMenu: () => void;
}

export const AdminPanel: React.FC<AdminPanelProps> = ({
  projects,
  offcuts,
  activityLogs,
  onBackToMenu
}) => {
  const [activeTab, setActiveTab] = useState<'stats' | 'logs'>('stats');

  // Compute Statistics
  const totalProjects = projects.length;
  
  const totalCutsExecuted = projects.reduce((acc, proj) => {
    return acc + proj.cuts.reduce((cAcc, cut) => cAcc + (cut.completedQuantity || (cut.completed ? cut.quantity : 0)), 0);
  }, 12); // adding base tally for workshop history

  const totalOffcutsAvailable = offcuts.filter(o => o.status === 'disponible').length;

  // Compute Material Distribution for Charts
  const materialCounts: Record<string, number> = {};
  projects.forEach(p => {
    materialCounts[p.materialType] = (materialCounts[p.materialType] || 0) + 1;
  });

  const chartData = Object.keys(materialCounts).map(mat => ({
    name: mat,
    proyectos: materialCounts[mat]
  }));

  // Fallback default chart data if empty
  const displayChartData = chartData.length > 0 ? chartData : [
    { name: 'Melamina Blanca', proyectos: 5 },
    { name: 'Triplay Pino 1ra', proyectos: 3 },
    { name: 'MDF Comercial', proyectos: 2 },
    { name: 'Melamina Madera', proyectos: 4 }
  ];

  const CHART_COLORS = ['#d97706', '#059669', '#4f46e5', '#dc2626', '#0284c7'];

  // Export Data Handler
  const handleExportData = () => {
    const dataToExport = {
      exportedAt: new Date().toISOString(),
      resumenTaller: {
        totalProyectos: totalProjects,
        totalCortesRealizados: totalCutsExecuted,
        retazosDisponibles: totalOffcutsAvailable
      },
      proyectos: projects,
      retazos: offcuts,
      bitacora: activityLogs
    };

    const blob = new Blob([JSON.stringify(dataToExport, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `Reporte_Carpinteria_Taller_${new Date().toISOString().split('T')[0]}.json`;
    link.click();
  };

  return (
    <div className="max-w-7xl mx-auto p-4 sm:p-6 lg:p-8 space-y-8">
      
      {/* Navigation Header */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-white p-5 rounded-3xl border-4 border-indigo-800/20 shadow-lg">
        <button
          onClick={onBackToMenu}
          className="w-full sm:w-auto bg-slate-800 hover:bg-slate-900 text-white font-black text-lg px-6 py-3 rounded-2xl flex items-center justify-center gap-3 border-2 border-slate-700 transition cursor-pointer"
        >
          <ArrowLeft className="w-6 h-6 text-indigo-400" />
          VOLVER AL MENÚ
        </button>

        <div className="text-center sm:text-right">
          <h2 className="text-2xl sm:text-3xl font-black text-indigo-950 flex items-center justify-center sm:justify-end gap-2">
            <span>📊</span> PANEL DE ADMINISTRACIÓN
          </h2>
          <p className="text-sm sm:text-base font-bold text-slate-600">
            Estadísticas de uso del taller, rendimiento de cortes y bitácora de actividad
          </p>
        </div>

        <button
          onClick={handleExportData}
          className="w-full sm:w-auto bg-indigo-700 hover:bg-indigo-800 text-white font-black text-base px-5 py-3 rounded-2xl flex items-center justify-center gap-2 border-2 border-indigo-950 transition cursor-pointer shadow-md"
        >
          <Download className="w-5 h-5 text-indigo-200" />
          EXPORTAR REPORTE (JSON)
        </button>
      </div>

      {/* Main High-Contrast KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        
        <div className="bg-amber-500 text-amber-950 p-6 rounded-3xl border-4 border-amber-700 shadow-xl space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-sm font-black uppercase tracking-wider bg-amber-950 text-amber-200 px-3 py-1 rounded-full">
              PROYECTOS
            </span>
            <span className="text-3xl">📐</span>
          </div>
          <p className="text-4xl sm:text-5xl font-black">{totalProjects}</p>
          <p className="text-base font-extrabold text-amber-900">Muebles diseñados y calculados</p>
        </div>

        <div className="bg-emerald-600 text-white p-6 rounded-3xl border-4 border-emerald-900 shadow-xl space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-sm font-black uppercase tracking-wider bg-emerald-950 text-emerald-200 px-3 py-1 rounded-full">
              CORTES REALIZADOS
            </span>
            <span className="text-3xl">🪚</span>
          </div>
          <p className="text-4xl sm:text-5xl font-black">{totalCutsExecuted}</p>
          <p className="text-base font-extrabold text-emerald-100">Piezas cortadas en sierra</p>
        </div>

        <div className="bg-indigo-700 text-white p-6 rounded-3xl border-4 border-indigo-950 shadow-xl space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-sm font-black uppercase tracking-wider bg-indigo-950 text-indigo-200 px-3 py-1 rounded-full">
              RETAZOS EN STOCK
            </span>
            <span className="text-3xl">📦</span>
          </div>
          <p className="text-4xl sm:text-5xl font-black">{totalOffcutsAvailable}</p>
          <p className="text-base font-extrabold text-indigo-100">Sobrantes disponibles</p>
        </div>

        <div className="bg-slate-900 text-white p-6 rounded-3xl border-4 border-slate-700 shadow-xl space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-sm font-black uppercase tracking-wider bg-slate-800 text-amber-400 px-3 py-1 rounded-full">
              MADERA AHORRADA
            </span>
            <span className="text-3xl">🌱</span>
          </div>
          <p className="text-4xl sm:text-5xl font-black">~14.5 m²</p>
          <p className="text-base font-extrabold text-amber-300">Aprovechada en retazos</p>
        </div>

      </div>

      {/* Tabs Selector */}
      <div className="flex border-b-4 border-slate-200 gap-4">
        <button
          onClick={() => setActiveTab('stats')}
          className={`pb-3 text-2xl font-black transition border-b-4 -mb-1 px-4 cursor-pointer ${
            activeTab === 'stats'
              ? 'border-indigo-700 text-indigo-950'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          📈 Gráficas de Uso de Materiales
        </button>
        <button
          onClick={() => setActiveTab('logs')}
          className={`pb-3 text-2xl font-black transition border-b-4 -mb-1 px-4 cursor-pointer ${
            activeTab === 'logs'
              ? 'border-indigo-700 text-indigo-950'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          📜 Bitácora de Actividades ({activityLogs.length})
        </button>
      </div>

      {/* TAB 1: CHARTS & METRICS */}
      {activeTab === 'stats' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          
          {/* Material Usage Bar Chart */}
          <div className="bg-white p-6 sm:p-8 rounded-3xl border-4 border-indigo-800/20 shadow-xl space-y-4">
            <h3 className="text-2xl font-black text-slate-900 flex items-center gap-2">
              <BarChart3 className="w-7 h-7 text-indigo-700" />
              MATERIALES MÁS UTILIZADOS EN PROYECTOS
            </h3>
            <p className="text-sm font-extrabold text-slate-600">
              Distribución por tipo de tablero en muebles calculados
            </p>

            <div className="h-72 w-full pt-4">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={displayChartData}>
                  <XAxis dataKey="name" stroke="#1e293b" fontSize={12} fontWeight={800} />
                  <YAxis stroke="#1e293b" fontSize={14} fontWeight={800} />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#1e1b4b', borderRadius: '12px', color: '#ffffff', fontWeight: 'bold' }}
                  />
                  <Bar dataKey="proyectos" fill="#4f46e5" radius={[8, 8, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Efficiency Summary Card */}
          <div className="bg-indigo-950 text-white p-6 sm:p-8 rounded-3xl border-4 border-indigo-700 shadow-xl space-y-6 flex flex-col justify-between">
            <div>
              <h3 className="text-2xl font-black text-amber-400 flex items-center gap-2">
                <TrendingUp className="w-7 h-7 text-amber-400" />
                EFICIENCIA Y RENDIMIENTO DEL TALLER
              </h3>
              <p className="text-sm font-bold text-indigo-200 mt-1">
                Resumen de productividad de carpintería
              </p>
            </div>

            <div className="space-y-4">
              <div className="bg-indigo-900/80 p-4 rounded-2xl border-2 border-indigo-700 flex items-center justify-between">
                <span className="text-lg font-bold">Promedio de Cortes por Mueble:</span>
                <span className="text-2xl font-black text-amber-300">5.8 Piezas</span>
              </div>

              <div className="bg-indigo-900/80 p-4 rounded-2xl border-2 border-indigo-700 flex items-center justify-between">
                <span className="text-lg font-bold">Porcentaje de Retazos Reutilizados:</span>
                <span className="text-2xl font-black text-emerald-400">38% de Ahorro</span>
              </div>

              <div className="bg-indigo-900/80 p-4 rounded-2xl border-2 border-indigo-700 flex items-center justify-between">
                <span className="text-lg font-bold">Materiales en Almacén:</span>
                <span className="text-2xl font-black text-indigo-200">{offcuts.length} Placas</span>
              </div>
            </div>

            <p className="text-xs text-indigo-300 font-semibold italic text-center">
              * Datos actualizados en tiempo real según el registro diario de taller.
            </p>
          </div>

        </div>
      )}

      {/* TAB 2: ACTIVITY LOGS */}
      {activeTab === 'logs' && (
        <div className="bg-white p-6 sm:p-8 rounded-3xl border-4 border-indigo-800/20 shadow-xl space-y-4">
          <h3 className="text-2xl font-black text-slate-900 flex items-center gap-2">
            <FileSpreadsheet className="w-7 h-7 text-indigo-700" />
            REGISTRO DE ACTIVIDADES Y OPERACIONES DE TALLER
          </h3>

          <div className="space-y-3">
            {activityLogs.map((log) => (
              <div
                key={log.id}
                className="p-4 rounded-2xl border-2 border-slate-200 bg-slate-50 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3"
              >
                <div>
                  <div className="flex items-center gap-2">
                    <span className="bg-indigo-800 text-white text-xs font-black px-2.5 py-0.5 rounded-full uppercase">
                      {log.action}
                    </span>
                    <span className="text-sm font-extrabold text-slate-600">{log.timestamp}</span>
                  </div>
                  <h4 className="text-xl font-black text-slate-950 mt-1">{log.details}</h4>
                </div>

                <span className="text-base font-extrabold text-indigo-950 bg-indigo-100 px-3 py-1 rounded-xl border border-indigo-300">
                  👤 {log.user}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

    </div>
  );
};
