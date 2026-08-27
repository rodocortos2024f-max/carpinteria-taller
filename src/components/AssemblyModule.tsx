import React, { useState, useMemo, useEffect } from 'react';
import { 
  Project, 
  WoodCut, 
  FurnitureCategory, 
  FurnitureUnit 
} from '../types';
import { speakCutDetails } from '../utils/cutCalculator';
import { 
  getAllProjectsAssembled, 
  saveAllProjectsAssembled, 
  getAllProjectsEdgeBanded, 
  saveAllProjectsEdgeBanded 
} from '../utils/productionProgress';
import { EdgeBandingPdfModal } from './EdgeBandingPdfModal';
import { 
  Hammer, 
  CheckCircle2, 
  Volume2, 
  ArrowLeft, 
  Printer, 
  Check, 
  RotateCcw,
  Layers,
  Ruler,
  Scissors,
  Box,
  CheckCheck,
  Sparkles,
  Trophy,
  AlertCircle,
  Tag,
  Search,
  Filter,
  CheckSquare,
  Square,
  ExternalLink,
  Info,
  Clock,
  Package,
  FolderOpen,
  ClipboardList
} from 'lucide-react';

interface AssemblyModuleProps {
  projects: Project[];
  activeProjectId?: string;
  onBackToMenu: () => void;
  onNavigateToOptimizer?: (cuts: WoodCut[], material: string, thickness: number, projectName: string) => void;
  onNavigateToProject?: () => void;
  onNavigateToBudget?: (projectId?: string) => void;
  onSelectProject?: (projectId: string) => void;
}

const STORAGE_KEY = 'carpinteria_assembly_progress_v2';
const EDGE_STORAGE_KEY = 'carpinteria_edgebanding_progress_v2';

export const AssemblyModule: React.FC<AssemblyModuleProps> = ({
  projects,
  activeProjectId,
  onBackToMenu,
  onNavigateToOptimizer,
  onNavigateToProject,
  onNavigateToBudget,
  onSelectProject
}) => {
  // Selector de Proyecto Activo
  const [selectedProjectId, setSelectedProjectId] = useState<string>(() => {
    if (activeProjectId && projects.some(p => p.id === activeProjectId)) {
      return activeProjectId;
    }
    return projects[0]?.id || '';
  });

  // Modal para ver y seleccionar proyectos guardados
  const [showProjectModal, setShowProjectModal] = useState<boolean>(false);
  const [showEdgeBandingPdfModal, setShowEdgeBandingPdfModal] = useState<boolean>(false);

  const projectsRef = React.useRef(projects);
  projectsRef.current = projects;

  // Sincronizar selectedProjectId cuando cambie la prop activeProjectId
  useEffect(() => {
    if (activeProjectId && projectsRef.current.some(p => p.id === activeProjectId)) {
      setSelectedProjectId(activeProjectId);
      setSelectedUnitId('all');
      setSelectedPieceId(null);
      setHoveredPieceId(null);
    }
  }, [activeProjectId]);

  const activeProject = projects.find(p => p.id === selectedProjectId) || projects[0];

  // Cambiar proyecto activo libremente dentro del Módulo 3
  const handleProjectChange = (newProjId: string) => {
    setSelectedProjectId(newProjId);
    setSelectedUnitId('all');
    setSelectedPieceId(null);
    setHoveredPieceId(null);
    if (onSelectProject) {
      onSelectProject(newProjId);
    }
  };

  // Modo de Trabajo Superior: 'assembly' (Armado & Croquis) | 'edgebanding' (Taller de Canteado / Cubrecanto)
  const [activeWorkMode, setActiveWorkMode] = useState<'assembly' | 'edgebanding'>('assembly');

  // Filtros específicos del Modo Canteado
  const [edgeFilter, setEdgeFilter] = useState<'all' | 'pending' | 'completed'>('all');
  const [edgeSearch, setEdgeSearch] = useState<string>('');

  // Selector de Unidad / Mueble específico dentro del proyecto ('all' o id del mueble)
  const [selectedUnitId, setSelectedUnitId] = useState<string>('all');

  // Pieza resaltada al hacer hover o clic en la lista
  const [hoveredPieceId, setHoveredPieceId] = useState<string | null>(null);
  const [selectedPieceId, setSelectedPieceId] = useState<string | null>(null);

  // Modo de vista del croquis: 'armado' (ensamble 3D/2D) o 'explotado' (despiece)
  const [diagramMode, setDiagramMode] = useState<'armado' | 'explotado'>('armado');

  // Estado de armado de piezas por proyecto: { [projectId]: { [cutId]: boolean } }
  const [projectAssembledMap, setProjectAssembledMap] = useState<Record<string, Record<string, boolean>>>(() => {
    return getAllProjectsAssembled();
  });

  // Guardar en localStorage cada vez que cambie el estado de armado
  useEffect(() => {
    saveAllProjectsAssembled(projectAssembledMap);
  }, [projectAssembledMap]);

  // Estado de canteado de piezas por proyecto: { [projectId]: { [cutId]: boolean } }
  const [projectEdgeBandedMap, setProjectEdgeBandedMap] = useState<Record<string, Record<string, boolean>>>(() => {
    return getAllProjectsEdgeBanded();
  });

  // Guardar en localStorage cada vez que cambie el estado de canteado
  useEffect(() => {
    saveAllProjectsEdgeBanded(projectEdgeBandedMap);
  }, [projectEdgeBandedMap]);

  // Escuchar eventos globales de cambio de progreso de producción
  useEffect(() => {
    const handleProgressChange = () => {
      setProjectAssembledMap(getAllProjectsAssembled());
      setProjectEdgeBandedMap(getAllProjectsEdgeBanded());
    };
    window.addEventListener('carpinteria_production_progress_change', handleProgressChange);
    window.addEventListener('storage', handleProgressChange);
    return () => {
      window.removeEventListener('carpinteria_production_progress_change', handleProgressChange);
      window.removeEventListener('storage', handleProgressChange);
    };
  }, []);

  // Mapa de armado del proyecto actual
  const currentProjectMap = useMemo(() => {
    if (!activeProject) return {};
    return projectAssembledMap[activeProject.id] || {};
  }, [projectAssembledMap, activeProject]);

  // Mapa de canteado del proyecto actual
  const currentEdgeProjectMap = useMemo(() => {
    if (!activeProject) return {};
    return projectEdgeBandedMap[activeProject.id] || {};
  }, [projectEdgeBandedMap, activeProject]);

  // Retazos asignados para el proyecto actual
  const [assignedOffcuts, setAssignedOffcuts] = useState<Record<string, any>>(() => {
    if (!activeProject) return {};
    try {
      const saved = localStorage.getItem(`carpinteria_assigned_offcuts_${activeProject.name}`);
      if (saved) return JSON.parse(saved);
      const globalSaved = localStorage.getItem('carpinteria_assigned_offcuts');
      return globalSaved ? JSON.parse(globalSaved) : {};
    } catch (e) {
      return {};
    }
  });

  useEffect(() => {
    if (!activeProject) return;
    const projName = activeProject.name;
    const syncAssigned = () => {
      try {
        const saved = localStorage.getItem(`carpinteria_assigned_offcuts_${projName}`);
        if (saved) {
          setAssignedOffcuts(JSON.parse(saved));
        } else {
          const globalSaved = localStorage.getItem('carpinteria_assigned_offcuts');
          if (globalSaved) setAssignedOffcuts(JSON.parse(globalSaved));
        }
      } catch (e) {
        // ignore
      }
    };
    syncAssigned();
    window.addEventListener('storage', syncAssigned);
    return () => window.removeEventListener('storage', syncAssigned);
  }, [activeProject?.id, activeProject?.name]);

  // Helper para consultar si una pieza proviene de un retazo de almacén
  const getPieceOffcutInfo = (cut: WoodCut): string | null => {
    if (cut.sourceOffcutLabel) {
      return cut.sourceOffcutLabel;
    }
    // Buscar en assignedOffcuts
    const match = Object.values(assignedOffcuts).find((a: any) => a?.pieceId === cut.id) as any;
    if (match) {
      return match.offcutLabel || `Retazo #${match.offcutNumber || match.offcutIndex || 1} (${match.originalLengthCm || ''}×${match.originalWidthCm || ''} cm)`;
    }
    return null;
  };

  // Función para consultar si una pieza está armada
  const isCutAssembled = (cut: WoodCut): boolean => {
    if (currentProjectMap[cut.id] !== undefined) {
      return currentProjectMap[cut.id];
    }
    return !!cut.completed;
  };

  // Función para consultar si una pieza está canteada
  const isCutEdgeBanded = (cut: WoodCut): boolean => {
    if (currentEdgeProjectMap[cut.id] !== undefined) {
      return currentEdgeProjectMap[cut.id];
    }
    return false;
  };

  // =========================================================================
  // CÁLCULO DE PROGRESO POR MUEBLE Y PROGRESO GLOBAL DEL PROYECTO
  // =========================================================================

  // Estadísticas globales del proyecto completo
  const projectStats = useMemo(() => {
    if (!activeProject) {
      return {
        totalPieces: 0,
        assembledPieces: 0,
        percentage: 0,
        totalUnits: 0,
        completedUnits: 0,
        inProgressUnits: 0,
        isAllCompleted: false
      };
    }

    const allCuts = activeProject.cuts || [];
    const totalPieces = allCuts.reduce((sum, c) => sum + (c.quantity || 1), 0);
    const assembledPieces = allCuts.reduce((sum, c) => {
      return sum + (isCutAssembled(c) ? (c.quantity || 1) : 0);
    }, 0);

    const percentage = totalPieces > 0 ? Math.round((assembledPieces / totalPieces) * 100) : 0;

    const units = activeProject.furnitureUnits || [];
    let completedUnits = 0;
    let inProgressUnits = 0;

    if (units.length > 0) {
      units.forEach(unit => {
        const uTotal = unit.cuts.reduce((s, c) => s + (c.quantity || 1), 0);
        const uAssembled = unit.cuts.reduce((s, c) => s + (isCutAssembled(c) ? (c.quantity || 1) : 0), 0);
        if (uTotal > 0 && uAssembled === uTotal) {
          completedUnits++;
        } else if (uAssembled > 0) {
          inProgressUnits++;
        }
      });
    } else {
      completedUnits = percentage === 100 ? 1 : 0;
    }

    return {
      totalPieces,
      assembledPieces,
      percentage,
      totalUnits: units.length > 0 ? units.length : 1,
      completedUnits,
      inProgressUnits,
      isAllCompleted: totalPieces > 0 && assembledPieces === totalPieces
    };
  }, [activeProject, currentProjectMap]);

  // Estadísticas individuales de cada mueble/unidad
  const unitStatsList = useMemo(() => {
    if (!activeProject || !activeProject.furnitureUnits) return [];

    return activeProject.furnitureUnits.map(unit => {
      const totalPieces = unit.cuts.reduce((s, c) => s + (c.quantity || 1), 0);
      const assembledPieces = unit.cuts.reduce((s, c) => s + (isCutAssembled(c) ? (c.quantity || 1) : 0), 0);
      const percentage = totalPieces > 0 ? Math.round((assembledPieces / totalPieces) * 100) : 0;
      const isCompleted = totalPieces > 0 && assembledPieces === totalPieces;
      const isInProgress = assembledPieces > 0 && !isCompleted;

      return {
        unit,
        totalPieces,
        assembledPieces,
        percentage,
        isCompleted,
        isInProgress
      };
    });
  }, [activeProject, currentProjectMap]);

  // Helper para resolver el nombre descriptivo completo del mueble (ej. "Mueble A: Alacena Cocina" o "Mueble B: Bajo Mesada")
  const getFurnitureDisplayName = (cut: WoodCut, project?: Project): string => {
    if (!project) return cut.furnitureName || 'Mueble de Taller';
    
    // 1. Si el corte tiene furnitureId y coincide con una unidad del proyecto
    if (cut.furnitureId && project.furnitureUnits && project.furnitureUnits.length > 0) {
      const unitIndex = project.furnitureUnits.findIndex(u => u.id === cut.furnitureId);
      if (unitIndex >= 0) {
        const unit = project.furnitureUnits[unitIndex];
        const letter = String.fromCharCode(65 + unitIndex);
        return unit.name.toLowerCase().startsWith('mueble') 
          ? unit.name 
          : `Mueble ${letter}: ${unit.name}`;
      }
    }

    // 2. Si el corte ya trae un furnitureName explícito y no es genérico
    if (cut.furnitureName && cut.furnitureName.trim()) {
      const trimmed = cut.furnitureName.trim();
      if (trimmed.toLowerCase() !== 'mueble' && trimmed.toLowerCase() !== 'general') {
        return trimmed;
      }
    }

    // 3. Buscar si el cut.id pertenece a alguna de las furnitureUnits
    if (project.furnitureUnits && project.furnitureUnits.length > 0) {
      for (let idx = 0; idx < project.furnitureUnits.length; idx++) {
        const unit = project.furnitureUnits[idx];
        if (unit.cuts.some(c => c.id === cut.id)) {
          const letter = String.fromCharCode(65 + idx);
          return unit.name.toLowerCase().startsWith('mueble') 
            ? unit.name 
            : `Mueble ${letter}: ${unit.name}`;
        }
      }
      if (project.furnitureUnits.length === 1) {
        const u = project.furnitureUnits[0];
        return u.name.toLowerCase().startsWith('mueble') ? u.name : `Mueble A: ${u.name}`;
      }
    }

    // 4. Default: Nombre del Proyecto General
    return project.name || 'Mueble Principal';
  };

  // Lista de piezas activas para el mueble seleccionado (o todo el proyecto)
  const activeCuts = useMemo(() => {
    if (!activeProject) return [];
    if (selectedUnitId !== 'all' && activeProject.furnitureUnits) {
      const unitIndex = activeProject.furnitureUnits.findIndex(u => u.id === selectedUnitId);
      const unit = unitIndex >= 0 ? activeProject.furnitureUnits[unitIndex] : undefined;
      if (unit) {
        const letter = String.fromCharCode(65 + unitIndex);
        const fullUnitName = unit.name.toLowerCase().startsWith('mueble') 
          ? unit.name 
          : `Mueble ${letter}: ${unit.name}`;
        return unit.cuts.map(c => ({
          ...c,
          furnitureId: c.furnitureId || unit.id,
          furnitureName: fullUnitName
        }));
      }
    }
    if (activeProject.furnitureUnits && activeProject.furnitureUnits.length > 0) {
      return activeProject.furnitureUnits.flatMap((unit, idx) => {
        const letter = String.fromCharCode(65 + idx);
        const fullUnitName = unit.name.toLowerCase().startsWith('mueble') 
          ? unit.name 
          : `Mueble ${letter}: ${unit.name}`;
        return unit.cuts.map(c => ({
          ...c,
          furnitureId: c.furnitureId || unit.id,
          furnitureName: fullUnitName
        }));
      });
    }
    return (activeProject.cuts || []).map(c => ({
      ...c,
      furnitureName: c.furnitureName || activeProject.name
    }));
  }, [activeProject, selectedUnitId]);

  const activeFurnitureName = useMemo(() => {
    if (!activeProject) return 'Mueble de Taller';
    if (selectedUnitId !== 'all' && activeProject.furnitureUnits) {
      const unitIndex = activeProject.furnitureUnits.findIndex(u => u.id === selectedUnitId);
      const unit = unitIndex >= 0 ? activeProject.furnitureUnits[unitIndex] : undefined;
      if (unit) {
        const letter = String.fromCharCode(65 + unitIndex);
        return unit.name.toLowerCase().startsWith('mueble') 
          ? unit.name 
          : `Mueble ${letter}: ${unit.name}`;
      }
    }
    return `Todo el Proyecto (${activeProject.name})`;
  }, [activeProject, selectedUnitId]);

  const activeCategory: FurnitureCategory = useMemo(() => {
    if (!activeProject) return 'gabinete';
    if (selectedUnitId !== 'all' && activeProject.furnitureUnits) {
      const unit = activeProject.furnitureUnits.find(u => u.id === selectedUnitId);
      if (unit) return unit.category;
    }
    return activeProject.category || 'gabinete';
  }, [activeProject, selectedUnitId]);

  // Dimensiones del mueble seleccionado
  const dimensions = useMemo(() => {
    if (!activeProject) return { height: 80, width: 60, depth: 35, thickness: 15 };
    if (selectedUnitId !== 'all' && activeProject.furnitureUnits) {
      const unit = activeProject.furnitureUnits.find(u => u.id === selectedUnitId);
      if (unit) {
        return {
          height: unit.heightCm || 80,
          width: unit.widthCm || 60,
          depth: unit.depthCm || 35,
          thickness: unit.thicknessMm || 15
        };
      }
    }
    return {
      height: activeProject.totalHeightCm || 80,
      width: activeProject.totalWidthCm || 60,
      depth: activeProject.totalDepthCm || 35,
      thickness: activeProject.thicknessMm || 15
    };
  }, [activeProject, selectedUnitId]);

  // Conteo de piezas del mueble seleccionado
  const currentUnitTotalPieces = activeCuts.reduce((acc, c) => acc + (c.quantity || 1), 0);
  const currentUnitAssembledPieces = activeCuts.reduce((acc, c) => {
    return acc + (isCutAssembled(c) ? (c.quantity || 1) : 0);
  }, 0);

  const currentUnitPercentage = currentUnitTotalPieces > 0 
    ? Math.round((currentUnitAssembledPieces / currentUnitTotalPieces) * 100) 
    : 0;

  // =========================================================================
  // ACCIONES DE ARMADO (GUARDADO AUTOMÁTICO EN LOCALSTORAGE)
  // =========================================================================

  // Toggle estado de una pieza individual
  const togglePieceAssembly = (cutId: string) => {
    if (!activeProject) return;
    setProjectAssembledMap(prev => {
      const currentMap = prev[activeProject.id] || {};
      const currentVal = currentMap[cutId] !== undefined 
        ? currentMap[cutId] 
        : (activeProject.cuts.find(c => c.id === cutId)?.completed || false);

      return {
        ...prev,
        [activeProject.id]: {
          ...currentMap,
          [cutId]: !currentVal
        }
      };
    });
  };

  // Marcar todas las piezas del mueble seleccionado (o del proyecto) como armadas
  const handleMarkCurrentAssembled = () => {
    if (!activeProject) return;
    setProjectAssembledMap(prev => {
      const currentMap = { ...(prev[activeProject.id] || {}) };
      activeCuts.forEach(c => {
        currentMap[c.id] = true;
      });
      return {
        ...prev,
        [activeProject.id]: currentMap
      };
    });
  };

  // Marcar un mueble específico completo directamente desde su tarjeta
  const handleMarkUnitAssembled = (unitId: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    if (!activeProject || !activeProject.furnitureUnits) return;
    const targetUnit = activeProject.furnitureUnits.find(u => u.id === unitId);
    if (!targetUnit) return;

    setProjectAssembledMap(prev => {
      const currentMap = { ...(prev[activeProject.id] || {}) };
      targetUnit.cuts.forEach(c => {
        currentMap[c.id] = true;
      });
      return {
        ...prev,
        [activeProject.id]: currentMap
      };
    });
  };

  // Reiniciar estado del mueble seleccionado
  const handleResetCurrent = () => {
    if (!activeProject) return;
    setProjectAssembledMap(prev => {
      const currentMap = { ...(prev[activeProject.id] || {}) };
      activeCuts.forEach(c => {
        currentMap[c.id] = false;
      });
      return {
        ...prev,
        [activeProject.id]: currentMap
      };
    });
  };

  // Marcar TODO el proyecto completo como armado
  const handleMarkEntireProjectAssembled = () => {
    if (!activeProject) return;
    setProjectAssembledMap(prev => {
      const currentMap: Record<string, boolean> = {};
      (activeProject.cuts || []).forEach(c => {
        currentMap[c.id] = true;
      });
      return {
        ...prev,
        [activeProject.id]: currentMap
      };
    });
  };

  // Reiniciar TODO el proyecto
  const handleResetEntireProject = () => {
    if (!activeProject) return;
    setProjectAssembledMap(prev => {
      const currentMap: Record<string, boolean> = {};
      (activeProject.cuts || []).forEach(c => {
        currentMap[c.id] = false;
      });
      return {
        ...prev,
        [activeProject.id]: currentMap
      };
    });
  };

  // =========================================================================
  // ACCIONES Y LÓGICA DEL TALLER DE CUBRECANTO / CANTEADO (PARA AYUDANTE)
  // =========================================================================

  // Helper para verificar si una pieza tiene al menos 1 lado marcado con cubrecanto
  const hasAnyEdgeBanding = (cut: WoodCut): boolean => {
    const edges = cut.edges;
    return !!(edges && (edges.top || edges.bottom || edges.left || edges.right));
  };

  // Toggle estado de canteado individual de una pieza
  const togglePieceEdgeBanded = (cutId: string) => {
    if (!activeProject) return;
    setProjectEdgeBandedMap(prev => {
      const currentMap = prev[activeProject.id] || {};
      const currentVal = currentMap[cutId] || false;
      return {
        ...prev,
        [activeProject.id]: {
          ...currentMap,
          [cutId]: !currentVal
        }
      };
    });
  };

  // Lista de piezas que requieren cubrecanto (filtradas por mueble si aplica y ordenadas por Mueble y Nombre)
  const allEdgeCuts = useMemo(() => {
    if (!activeProject) return [];
    
    let cutsPool: (WoodCut & { fullFurnitureName?: string })[] = [];

    if (selectedUnitId !== 'all' && activeProject.furnitureUnits) {
      const unitIndex = activeProject.furnitureUnits.findIndex(u => u.id === selectedUnitId);
      const unit = unitIndex >= 0 ? activeProject.furnitureUnits[unitIndex] : undefined;
      if (unit) {
        const letter = String.fromCharCode(65 + unitIndex);
        const fullUnitName = unit.name.toLowerCase().startsWith('mueble') 
          ? unit.name 
          : `Mueble ${letter}: ${unit.name}`;
        cutsPool = unit.cuts.map(c => ({
          ...c,
          furnitureId: c.furnitureId || unit.id,
          furnitureName: unit.name,
          fullFurnitureName: fullUnitName
        }));
      }
    } else {
      if (activeProject.furnitureUnits && activeProject.furnitureUnits.length > 0) {
        cutsPool = activeProject.furnitureUnits.flatMap((unit, idx) => {
          const letter = String.fromCharCode(65 + idx);
          const fullUnitName = unit.name.toLowerCase().startsWith('mueble') 
            ? unit.name 
            : `Mueble ${letter}: ${unit.name}`;
          return unit.cuts.map(c => ({
            ...c,
            furnitureId: c.furnitureId || unit.id,
            furnitureName: unit.name,
            fullFurnitureName: fullUnitName
          }));
        });
      } else {
        cutsPool = (activeProject.cuts || []).map(c => ({
          ...c,
          furnitureName: c.furnitureName || activeProject.name,
          fullFurnitureName: `Mueble: ${c.furnitureName || activeProject.name}`
        }));
      }
    }

    const withEdges = cutsPool.filter(hasAnyEdgeBanding);

    // Ordenar estrictamente por Mueble y Nombre de Pieza
    return [...withEdges].sort((a, b) => {
      const furnA = (a.fullFurnitureName || a.furnitureName || '').toLowerCase();
      const furnB = (b.fullFurnitureName || b.furnitureName || '').toLowerCase();
      if (furnA !== furnB) return furnA.localeCompare(furnB);
      return (a.name || '').toLowerCase().localeCompare((b.name || '').toLowerCase());
    });
  }, [activeProject, selectedUnitId]);

  // Lista filtrada por estado (todas / pendientes / canteadas) y término de búsqueda
  const filteredEdgeCuts = useMemo(() => {
    return allEdgeCuts.filter(cut => {
      const isBanded = isCutEdgeBanded(cut);
      if (edgeFilter === 'pending' && isBanded) return false;
      if (edgeFilter === 'completed' && !isBanded) return false;
      if (edgeSearch.trim()) {
        const q = edgeSearch.toLowerCase().trim();
        const matchName = (cut.name || '').toLowerCase().includes(q);
        const matchFurn = ((cut as any).fullFurnitureName || cut.furnitureName || '').toLowerCase().includes(q);
        const matchDim = `${cut.lengthCm}x${cut.widthCm}`.includes(q) || `${cut.lengthCm} × ${cut.widthCm}`.includes(q);
        if (!matchName && !matchFurn && !matchDim) return false;
      }
      return true;
    });
  }, [allEdgeCuts, edgeFilter, edgeSearch, currentEdgeProjectMap]);

  // Estadísticas globales de canteado
  const edgeStats = useMemo(() => {
    const totalPieces = allEdgeCuts.reduce((sum, c) => sum + (c.quantity || 1), 0);
    const completedPieces = allEdgeCuts.reduce((sum, c) => {
      return sum + (isCutEdgeBanded(c) ? (c.quantity || 1) : 0);
    }, 0);
    const percentage = totalPieces > 0 ? Math.round((completedPieces / totalPieces) * 100) : 0;

    let totalMeters = 0;
    let bandedMeters = 0;

    allEdgeCuts.forEach(c => {
      const edges = c.edges || {};
      let piecePerimeterCm = 0;
      if (edges.top) piecePerimeterCm += c.lengthCm;
      if (edges.bottom) piecePerimeterCm += c.lengthCm;
      if (edges.left) piecePerimeterCm += c.widthCm;
      if (edges.right) piecePerimeterCm += c.widthCm;

      const metersForPiece = (piecePerimeterCm * (c.quantity || 1)) / 100;
      totalMeters += metersForPiece;
      if (isCutEdgeBanded(c)) {
        bandedMeters += metersForPiece;
      }
    });

    return {
      totalPieces,
      completedPieces,
      pendingPieces: totalPieces - completedPieces,
      percentage,
      isAllCompleted: totalPieces > 0 && completedPieces === totalPieces,
      totalMeters: Number(totalMeters.toFixed(1)),
      bandedMeters: Number(bandedMeters.toFixed(1)),
      pendingMeters: Number((totalMeters - bandedMeters).toFixed(1))
    };
  }, [allEdgeCuts, currentEdgeProjectMap]);

  // Marcar todas las piezas con cubrecanto como canteadas
  const handleMarkAllEdgeBanded = () => {
    if (!activeProject) return;
    setProjectEdgeBandedMap(prev => {
      const currentMap = { ...(prev[activeProject.id] || {}) };
      allEdgeCuts.forEach(c => {
        currentMap[c.id] = true;
      });
      return {
        ...prev,
        [activeProject.id]: currentMap
      };
    });
  };

  // Reiniciar estado de canteado
  const handleResetAllEdgeBanded = () => {
    if (!activeProject) return;
    setProjectEdgeBandedMap(prev => {
      const currentMap = { ...(prev[activeProject.id] || {}) };
      allEdgeCuts.forEach(c => {
        currentMap[c.id] = false;
      });
      return {
        ...prev,
        [activeProject.id]: currentMap
      };
    });
  };

  // Dictar detalles de canteado por voz para el ayudante
  const handleSpeakEdgeBanding = (cut: WoodCut) => {
    const edges = cut.edges || {};
    const sides: string[] = [];
    if (edges.top) sides.push(`Largo superior de ${cut.lengthCm} centímetros`);
    if (edges.bottom) sides.push(`Largo inferior de ${cut.lengthCm} centímetros`);
    if (edges.left) sides.push(`Ancho izquierdo de ${cut.widthCm} centímetros`);
    if (edges.right) sides.push(`Ancho derecho de ${cut.widthCm} centímetros`);

    const sidesText = sides.length > 0 ? `Cantear en: ${sides.join(', ')}.` : 'Sin cubrecanto.';
    const furnName = (cut as any).fullFurnitureName || getFurnitureDisplayName(cut, activeProject);
    const text = `${cut.name}, del ${furnName}. ${cut.quantity > 1 ? `${cut.quantity} piezas` : '1 pieza'}. Medida: ${cut.lengthCm} por ${cut.widthCm} centímetros. ${sidesText}`;
    speakCutDetails(text);
  };

  // Dictar detalles por voz
  const handleSpeakPiece = (cut: WoodCut) => {
    const furnName = (cut as any).fullFurnitureName || getFurnitureDisplayName(cut, activeProject);
    const text = `${cut.name}, del ${furnName}. Cantidad ${cut.quantity}. Medida: ${cut.lengthCm} por ${cut.widthCm} centímetros.`;
    speakCutDetails(text);
  };

  // Código de Color y Mecanizado según tipo de pieza
  const getPieceStyling = (cut: WoodCut) => {
    const nameLower = (cut.name || '').toLowerCase();
    const cat = cut.category || '';

    // AMARRES / LISTONES SUPERIORES (NARANJA VIBRANTE #ea580c)
    if (
      nameLower.includes('amarre') || 
      nameLower.includes('liston') || 
      nameLower.includes('listón') || 
      nameLower.includes('travesaño') || 
      nameLower.includes('travesano') || 
      cat === 'amarre' || 
      cat === 'liston' ||
      cat === 'travesaño'
    ) {
      const isFront = nameLower.includes('front') || nameLower.includes('delant');
      const isRear = nameLower.includes('post') || nameLower.includes('tras');
      return {
        typeTag: isFront ? 'Amarre Frontal' : isRear ? 'Amarre Posterior' : 'Amarre / Listón Sup.',
        colorHex: '#ea580c',
        tagBg: 'bg-orange-600 text-white',
        borderAccent: 'border-l-8 border-l-orange-600',
        machiningBadge: '🔩 Fijación a Costados y Cubierta',
        machiningDetail: 'Atornillar a costados (4.0×50mm) + perforaciones superiores para fijar la cubierta',
        machiningBg: 'bg-orange-50 text-orange-950 border-orange-300'
      };
    }

    // COSTADOS / LATERALES DE CAJÓN (AZUL REY #1d4ed8)
    if (
      (nameLower.includes('costado') || nameLower.includes('lateral') || nameLower.includes('lado')) && 
      (nameLower.includes('caj') || cat === 'lateral_cajon')
    ) {
      return {
        typeTag: 'Costado de Cajón',
        colorHex: '#1d4ed8',
        tagBg: 'bg-blue-600 text-white',
        borderAccent: 'border-l-8 border-l-blue-600',
        machiningBadge: '📐 Ranura 3mm + Corredera Telescópica',
        machiningDetail: 'Ranura a 12mm de la base (prof. 6mm) • Atornillar corredera H45 en eje central',
        machiningBg: 'bg-blue-50 text-blue-950 border-blue-300'
      };
    }

    // CONTRAFRENTE / TRASERA DE CAJÓN (NARANJA #ea580c)
    if (
      nameLower.includes('contrafrente') || 
      (nameLower.includes('traser') && nameLower.includes('caj')) || 
      cat === 'trasera_cajon'
    ) {
      return {
        typeTag: 'Contrafrente Cajón',
        colorHex: '#ea580c',
        tagBg: 'bg-orange-600 text-white',
        borderAccent: 'border-l-8 border-l-orange-600',
        machiningBadge: '📐 Ranura / Encastre Fondo 3mm',
        machiningDetail: 'Ranura a 12mm de la base o pieza reducida entre costados para deslizar fondo',
        machiningBg: 'bg-orange-50 text-orange-950 border-orange-300'
      };
    }

    // FONDO DE CAJÓN (MDF 3MM - PÚRPURA #7c3aed)
    if (nameLower.includes('fondo') && (nameLower.includes('caj') || cat === 'fondo_cajon')) {
      return {
        typeTag: 'Fondo Cajón MDF 3mm',
        colorHex: '#7c3aed',
        tagBg: 'bg-purple-700 text-white',
        borderAccent: 'border-l-8 border-l-purple-700',
        machiningBadge: '🪵 Fondo Deslizable',
        machiningDetail: 'Deslizar en ranuras de 6mm antes de atornillar contrafrente posterior',
        machiningBg: 'bg-purple-50 text-purple-950 border-purple-300'
      };
    }

    // FRENTE DE CAJÓN (AMARILLO / ÁMBAR INTENSO #d97706)
    if (
      nameLower.includes('frente caj') || 
      nameLower.includes('frente de caj') || 
      cat === 'frente_cajon' ||
      (nameLower.includes('frente') && !nameLower.includes('marco') && !nameLower.includes('puerta'))
    ) {
      return {
        typeTag: 'Frente de Cajón (Vista)',
        colorHex: '#d97706',
        tagBg: 'bg-amber-600 text-white',
        borderAccent: 'border-l-8 border-l-amber-600',
        machiningBadge: '🔘 Jaladera + Tornillo Interior',
        machiningDetail: 'Orificios para jaladera y atornillado de fijación (4×30mm) desde el interior de la caja',
        machiningBg: 'bg-amber-50 text-amber-950 border-amber-300'
      };
    }

    // LATERAL / COSTADO PRINCIPAL DE GABINETE (AZUL REY #1d4ed8)
    if (nameLower.includes('lateral') || nameLower.includes('costado') || cat === 'lateral') {
      return {
        typeTag: 'Costado / Lateral',
        colorHex: '#1d4ed8',
        tagBg: 'bg-blue-600 text-white',
        borderAccent: 'border-l-8 border-l-blue-600',
        machiningBadge: '📐 Ranura MDF 3mm + Correderas/Pernos',
        machiningDetail: 'A 20mm del borde posterior (prof. 7mm) • Marcar ejes de correderas a 37mm',
        machiningBg: 'bg-blue-50 text-blue-950 border-blue-300'
      };
    }

    // PISO / TECHO (NARANJA VIBRANTE #ea580c)
    if (
      nameLower.includes('piso') || 
      nameLower.includes('techo') || 
      nameLower.includes('base') || 
      nameLower.includes('tapa') || 
      cat === 'piso' || 
      cat === 'techo'
    ) {
      return {
        typeTag: nameLower.includes('techo') || nameLower.includes('tapa') || cat === 'techo' ? 'Techo / Tapa' : 'Piso / Base',
        colorHex: '#ea580c',
        tagBg: 'bg-orange-600 text-white',
        borderAccent: 'border-l-8 border-l-orange-600',
        machiningBadge: '📐 Ranura MDF 3mm',
        machiningDetail: 'A 20mm del borde posterior para fondo continuo',
        machiningBg: 'bg-orange-50 text-orange-950 border-orange-300'
      };
    }

    // PUERTA BATIENTE (AMARILLO / ÁMBAR INTENSO #d97706)
    if (nameLower.includes('puerta') || cat === 'puerta') {
      return {
        typeTag: 'Puerta Batiente',
        colorHex: '#d97706',
        tagBg: 'bg-amber-600 text-white',
        borderAccent: 'border-l-8 border-l-amber-600',
        machiningBadge: '🔘 2 Cazoletas Ø35mm',
        machiningDetail: 'A 90mm de extremos, K=4mm, prof. 11.5mm',
        machiningBg: 'bg-amber-50 text-amber-950 border-amber-300'
      };
    }

    // ENTREPAÑO / REPISA (VERDE ESMERALDA #059669)
    if (nameLower.includes('repisa') || nameLower.includes('entrepaño') || cat === 'repisa') {
      return {
        typeTag: 'Entrepaño / Repisa',
        colorHex: '#059669',
        tagBg: 'bg-emerald-600 text-white',
        borderAccent: 'border-l-8 border-l-emerald-600',
        machiningBadge: '📌 Pernos Soporte Ø5mm',
        machiningDetail: 'Taladrar laterales con broca 5mm (prof. 8mm)',
        machiningBg: 'bg-emerald-50 text-emerald-950 border-emerald-300'
      };
    }

    // FONDO MDF 3MM (PÚRPURA / MORADO #7c3aed)
    if (nameLower.includes('fondo') || cat === 'fondo') {
      return {
        typeTag: 'Fondo MDF 3mm',
        colorHex: '#7c3aed',
        tagBg: 'bg-purple-700 text-white',
        borderAccent: 'border-l-8 border-l-purple-700',
        machiningBadge: '🪵 Fondo MDF 3mm',
        machiningDetail: 'Deslizar en ranura antes de fijar tapa o clavar',
        machiningBg: 'bg-purple-50 text-purple-950 border-purple-300'
      };
    }

    return {
      typeTag: 'Pieza Estructural',
      colorHex: '#475569',
      tagBg: 'bg-slate-700 text-white',
      borderAccent: 'border-l-8 border-l-slate-700',
      machiningBadge: '✨ Corte Liso',
      machiningDetail: 'Sin ranuras ni cazoletas especiales',
      machiningBg: 'bg-slate-100 text-slate-900 border-slate-300'
    };
  };

  // Texto resumido de cantos
  const getEdgeBandingSummary = (edges?: WoodCut['edges']) => {
    if (!edges) return { text: 'Sin canto', count: 0, top: false, bottom: false, left: false, right: false };
    const { top, bottom, left, right } = edges;
    const activeSides = [
      top ? 'Largo 1' : null,
      bottom ? 'Largo 2' : null,
      left ? 'Ancho 1' : null,
      right ? 'Ancho 2' : null,
    ].filter(Boolean);

    if (activeSides.length === 4) return { text: '4 Lados Canteados', count: 4, top, bottom, left, right };
    if (activeSides.length === 0) return { text: 'Sin Cubrecanto', count: 0, top: false, bottom: false, left: false, right: false };
    return { 
      text: `${activeSides.length} Lado${activeSides.length > 1 ? 's' : ''} (${activeSides.join(', ')})`, 
      count: activeSides.length,
      top: !!top,
      bottom: !!bottom,
      left: !!left,
      right: !!right
    };
  };

  return (
    <div className="max-w-7xl mx-auto p-4 sm:p-6 lg:p-8 space-y-6">
      
      {/* ========================================================================= */}
      {/* CABECERA ULTRA COMPACTA & LIMPIA DE TALLER                                */}
      {/* ========================================================================= */}
      <div className="bg-gradient-to-r from-amber-900 via-amber-950 to-slate-950 text-white rounded-3xl p-5 sm:p-6 shadow-2xl border-4 border-amber-600 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 sm:w-16 sm:h-16 bg-amber-500 text-amber-950 rounded-2xl flex items-center justify-center font-black text-2xl sm:text-3xl shadow-lg border-2 border-amber-300 shrink-0">
            {activeWorkMode === 'edgebanding' ? '🏷️' : '🔨'}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="bg-amber-500 text-amber-950 text-xs font-black px-2.5 py-0.5 rounded-full uppercase tracking-wider">
                Módulo 3
              </span>
              <span className="text-amber-200 text-xs font-bold">
                {activeWorkMode === 'edgebanding' ? 'Modo Cubrecanto' : 'Croquis & Armado Rápido'}
              </span>
            </div>
            <h2 className="text-xl sm:text-2xl lg:text-3xl font-black text-white tracking-tight mt-0.5">
              {activeWorkMode === 'edgebanding' ? 'MODO CUBRECANTO' : 'Proceso de Armado en Taller'}
            </h2>
          </div>
        </div>

        {/* Acciones rápidas de navegación */}
        <div className="flex items-center gap-2 w-full md:w-auto justify-between md:justify-end no-print flex-wrap">
          {onNavigateToProject && (
            <button
              type="button"
              onClick={onNavigateToProject}
              className="bg-amber-700 hover:bg-amber-600 text-white font-bold px-3.5 py-2 rounded-xl border border-amber-500 flex items-center gap-1.5 text-xs shadow-md transition cursor-pointer"
              title="Ir a Despiece / Módulo 1"
            >
              <Box className="w-4 h-4 text-amber-200" />
              <span className="hidden sm:inline">Módulo 1: Despiece</span>
            </button>
          )}

          {onNavigateToOptimizer && (
            <button
              type="button"
              onClick={() => onNavigateToOptimizer(activeCuts, activeProject.materialType, activeProject.thicknessMm, activeProject.name)}
              className="bg-emerald-800 hover:bg-emerald-700 text-white font-bold px-3.5 py-2 rounded-xl border border-emerald-600 flex items-center gap-1.5 text-xs shadow-md transition cursor-pointer"
              title="Ir a Corte de Tableros"
            >
              <Scissors className="w-4 h-4 text-emerald-300" />
              <span className="hidden sm:inline">Módulo 2: Corte</span>
            </button>
          )}

          {onNavigateToBudget && (
            <button
              type="button"
              onClick={() => onNavigateToBudget(activeProject?.id)}
              className="bg-teal-800 hover:bg-teal-700 text-white font-bold px-3.5 py-2 rounded-xl border border-teal-500 flex items-center gap-1.5 text-xs shadow-md transition cursor-pointer"
              title="Ir a Cotizaciones y Presupuestos"
            >
              <span>💵</span>
              <span className="hidden sm:inline">Módulo 4: Presupuesto</span>
            </button>
          )}

          {/* Botón Exclusivo: Lista de Cubrecanto (PDF) */}
          <button
            type="button"
            id="btn-lista-cubrecanto-pdf"
            onClick={() => setShowEdgeBandingPdfModal(true)}
            className="bg-emerald-600 hover:bg-emerald-500 text-white font-black px-3.5 py-2 rounded-xl border-2 border-emerald-300 flex items-center gap-1.5 text-xs shadow-md transition cursor-pointer"
            title="Ver y Descargar la Lista de Cubrecanto en PDF para el taller"
          >
            <Tag className="w-4 h-4 text-emerald-200" />
            <span className="hidden sm:inline">📄 Lista de Cubrecanto (PDF)</span>
            <span className="sm:hidden">📄 Cubrecanto PDF</span>
          </button>

          <button
            type="button"
            onClick={() => window.print()}
            className="bg-amber-800/90 hover:bg-amber-700 text-white font-bold px-3.5 py-2 rounded-xl border border-amber-600 flex items-center gap-1.5 text-xs shadow-md transition cursor-pointer"
            title="Imprimir Croquis y Lista"
          >
            <Printer className="w-4 h-4 text-amber-300" />
            <span className="hidden sm:inline">Imprimir</span>
          </button>

          <button
            type="button"
            onClick={onBackToMenu}
            className="bg-slate-800 hover:bg-slate-700 text-white font-bold px-3.5 py-2 rounded-xl border border-slate-600 flex items-center gap-1.5 text-xs shadow-md transition cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4 text-slate-300" />
            <span>Menú</span>
          </button>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* SELECTOR GENERAL DE PROYECTOS EN MÓDULO 3 (IDÉNTICO AL MÓDULO 1)          */}
      {/* ========================================================================= */}
      <div className="bg-white rounded-3xl p-4 sm:p-5 border-4 border-amber-800/20 shadow-xl flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4 no-print">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-amber-950 text-amber-400 flex items-center justify-center font-black text-xl shadow-md border-2 border-amber-600 shrink-0">
            📂
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="bg-amber-100 text-amber-950 text-[10px] font-black uppercase px-2 py-0.5 rounded-md border border-amber-300">
                PROYECTO ACTIVO EN MÓDULO 3
              </span>
              <span className="text-slate-500 text-xs font-bold">
                {projects.length} {projects.length === 1 ? 'proyecto disponible' : 'proyectos disponibles'}
              </span>
            </div>
            <h3 className="text-lg sm:text-xl font-black text-slate-900 leading-tight mt-0.5">
              {activeProject?.name || 'Seleccione un Proyecto'}
            </h3>
          </div>
        </div>

        {/* Dropdown Selector General de Proyectos + Botón Modal de Proyectos */}
        <div className="flex items-center gap-2.5 flex-1 md:max-w-xl justify-end">
          <div className="relative flex-1">
            <select
              value={selectedProjectId}
              onChange={(e) => handleProjectChange(e.target.value)}
              className="w-full bg-slate-100 hover:bg-slate-200 text-black font-black text-xs sm:text-sm py-3 px-3.5 rounded-2xl border-3 border-amber-600 focus:outline-none focus:ring-3 focus:ring-amber-500/40 cursor-pointer shadow-sm"
            >
              {projects.map((proj, projIdx) => {
                const totalPieces = (proj.cuts || []).reduce((sum, c) => sum + (c.quantity || 1), 0);
                const unitsCount = proj.furnitureUnits?.length || 1;
                return (
                  <option key={`asm-proj-opt-${proj.id}-${projIdx}`} value={proj.id} className="text-black font-bold">
                    📁 {proj.name} {proj.clientName ? `• Cliente: ${proj.clientName}` : ''} ({totalPieces} piezas • {unitsCount} {unitsCount === 1 ? 'mueble' : 'muebles'})
                  </option>
                );
              })}
            </select>
          </div>

          <button
            type="button"
            onClick={() => setShowProjectModal(true)}
            className="bg-amber-600 hover:bg-amber-700 text-white font-black text-xs sm:text-sm px-4 py-3 rounded-2xl border-2 border-amber-900 flex items-center gap-2 transition cursor-pointer shadow-md shrink-0"
            title="Ver todos los proyectos guardados"
          >
            <Layers className="w-4 h-4 text-amber-200" />
            <span className="hidden sm:inline">PROYECTOS ({projects.length})</span>
          </button>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* SELECTOR SUPERIOR DE MODO DE TRABAJO (ARMADO vs TALLER DE CANTEADO)       */}
      {/* ========================================================================= */}
      <div className="bg-slate-900 p-2 rounded-2xl border-4 border-slate-800 flex flex-col sm:flex-row gap-2 no-print shadow-xl">
        <button
          type="button"
          onClick={() => setActiveWorkMode('assembly')}
          className={`flex-1 py-3.5 px-5 rounded-xl font-black text-sm sm:text-base flex items-center justify-center gap-2.5 transition-all cursor-pointer ${
            activeWorkMode === 'assembly'
              ? 'bg-amber-500 text-slate-950 shadow-lg border-2 border-amber-300 scale-[1.01]'
              : 'bg-slate-800/80 hover:bg-slate-800 text-slate-300 border border-slate-700'
          }`}
        >
          <Hammer className="w-5 h-5" />
          <span>🔨 MODO ARMADO & CROQUIS 3D/2D</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveWorkMode('edgebanding')}
          className={`flex-1 py-3.5 px-5 rounded-xl font-black text-sm sm:text-base flex items-center justify-center gap-2.5 transition-all cursor-pointer relative ${
            activeWorkMode === 'edgebanding'
              ? 'bg-emerald-500 text-slate-950 shadow-lg border-2 border-emerald-300 scale-[1.01]'
              : 'bg-slate-800/80 hover:bg-slate-800 text-slate-300 border border-slate-700'
          }`}
        >
          <Tag className="w-5 h-5" />
          <span>🏷️ MODO CUBRECANTO</span>
          <span className={`text-xs px-2.5 py-0.5 rounded-full font-black ${
            activeWorkMode === 'edgebanding'
              ? 'bg-emerald-950 text-emerald-200'
              : 'bg-emerald-600 text-white animate-pulse'
          }`}>
            {edgeStats.completedPieces}/{edgeStats.totalPieces} Listas
          </span>
        </button>
      </div>

      {/* ========================================================================= */}
      {/* VISTA 1: MODO ARMADO GENERAL (CROQUIS, BLUEPRINT Y LISTA DE ENSAMBLE)      */}
      {/* ========================================================================= */}
      {activeWorkMode === 'assembly' && (
        <div className="space-y-6">

      {/* ========================================================================= */}
      {/* BARRA DE PROGRESO GLOBAL DEL PROYECTO COMPLETO                             */}
      {/* ========================================================================= */}
      <div className="bg-gradient-to-br from-slate-900 via-slate-950 to-slate-900 text-white rounded-3xl p-5 sm:p-6 border-4 border-slate-800 shadow-2xl space-y-4">
        
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className={`w-11 h-11 rounded-xl flex items-center justify-center font-black text-xl shadow-md border ${
              projectStats.isAllCompleted
                ? 'bg-emerald-500 text-emerald-950 border-emerald-300'
                : 'bg-amber-500 text-amber-950 border-amber-300'
            }`}>
              {projectStats.isAllCompleted ? <Trophy className="w-6 h-6" /> : <Box className="w-6 h-6" />}
            </div>
            <div>
              <span className="text-[11px] font-black uppercase tracking-wider text-amber-400 block">
                Control General de Taller
              </span>
              <h3 className="text-lg sm:text-xl font-black text-white leading-tight">
                Progreso Global del Proyecto: {activeProject?.name}
              </h3>
            </div>
          </div>

          {/* Badges de estado general */}
          <div className="flex items-center gap-2 flex-wrap">
            <div className="bg-slate-800/90 border border-slate-700 px-3.5 py-1.5 rounded-xl text-xs font-black text-slate-200">
              Muebles: <span className="text-amber-400 text-sm font-extrabold">{projectStats.completedUnits} / {projectStats.totalUnits}</span> Finalizados
            </div>
            <div className="bg-slate-800/90 border border-slate-700 px-3.5 py-1.5 rounded-xl text-xs font-black text-slate-200">
              Piezas Totales: <span className="text-emerald-400 text-sm font-extrabold">{projectStats.assembledPieces} / {projectStats.totalPieces}</span>
            </div>
            <div className={`px-3.5 py-1.5 rounded-xl text-xs font-black uppercase tracking-wider flex items-center gap-1.5 shadow-sm border ${
              projectStats.isAllCompleted
                ? 'bg-emerald-600 text-white border-emerald-400'
                : 'bg-amber-500 text-amber-950 border-amber-300'
            }`}>
              {projectStats.isAllCompleted ? (
                <>
                  <CheckCheck className="w-4 h-4" />
                  <span>Proyecto 100% Armado</span>
                </>
              ) : (
                <>
                  <Hammer className="w-4 h-4" />
                  <span>En Armado ({projectStats.percentage}%)</span>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Barra de Progreso Global */}
        <div className="space-y-1.5">
          <div className="w-full bg-slate-800 h-6 rounded-full overflow-hidden p-1 border-2 border-slate-700 relative">
            <div 
              className={`h-full rounded-full transition-all duration-500 ${
                projectStats.isAllCompleted 
                  ? 'bg-gradient-to-r from-emerald-500 to-emerald-400' 
                  : 'bg-gradient-to-r from-amber-500 via-orange-500 to-emerald-500'
              }`}
              style={{ width: `${projectStats.percentage}%` }}
            />
            <span className="absolute inset-0 flex items-center justify-center text-[11px] font-black text-white drop-shadow">
              {projectStats.percentage}% COMPLETADO GLOBAL ({projectStats.assembledPieces} de {projectStats.totalPieces} piezas en taller)
            </span>
          </div>

          <div className="flex items-center justify-between text-[11px] font-black text-slate-400 px-1">
            <span>Inicio de Ensamblado</span>
            <span>{projectStats.completedUnits} de {projectStats.totalUnits} Muebles Listos para Entrega</span>
            <span>100% Terminado</span>
          </div>
        </div>

        {/* Botones de acción global para todo el proyecto */}
        <div className="pt-2 border-t border-slate-800 flex items-center justify-between flex-wrap gap-2 text-xs no-print">
          <span className="text-slate-400 font-bold">
            El progreso se guarda automáticamente y se conserva entre muebles.
          </span>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleMarkEntireProjectAssembled}
              className="bg-emerald-700 hover:bg-emerald-600 text-white font-black px-3 py-1.5 rounded-lg transition flex items-center gap-1 border border-emerald-500 cursor-pointer"
            >
              <CheckCheck className="w-3.5 h-3.5" />
              <span>Marcar Todo el Proyecto como Armado</span>
            </button>
            <button
              type="button"
              onClick={handleResetEntireProject}
              className="bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold px-3 py-1.5 rounded-lg border border-slate-600 transition cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Reiniciar Todo</span>
            </button>
          </div>
        </div>

      </div>

      {/* ========================================================================= */}
      {/* SELECTOR DE MUEBLES CON ESTADO VISUAL EN CADA BOTÓN                       */}
      {/* ========================================================================= */}
      <div className="bg-white rounded-3xl p-5 sm:p-6 border-4 border-amber-800/20 shadow-xl space-y-4">
        
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b-2 border-slate-200 pb-3">
          <div>
            <span className="text-[11px] font-black uppercase tracking-wider text-amber-700 block">
              Selección de Mueble a Armar
            </span>
            <h3 className="text-xl font-black text-black tracking-tight">
              Módulos del Proyecto ({unitStatsList.length > 0 ? unitStatsList.length : 1} Mueble{unitStatsList.length > 1 ? 's' : ''})
            </h3>
          </div>

          {/* Selector de Proyecto en caso de haber varios proyectos creados */}
          {projects.length > 1 && (
            <div className="flex items-center gap-2 self-start sm:self-center">
              <label className="text-xs font-black text-slate-700 uppercase">Cambiar Proyecto:</label>
              <select
                value={selectedProjectId}
                onChange={(e) => {
                  setSelectedProjectId(e.target.value);
                  setSelectedUnitId('all');
                }}
                className="bg-amber-50 border-2 border-amber-400 rounded-xl px-3 py-1.5 text-xs font-black text-black cursor-pointer focus:ring-2 focus:ring-amber-500 focus:outline-none"
              >
                {projects.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>

        {/* BOTONES / TARJETAS INTERACTIVAS DE SELECCIÓN DE MUEBLES */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
          
          {/* Opción 1: Todo el Proyecto */}
          <button
            type="button"
            onClick={() => setSelectedUnitId('all')}
            className={`p-4 rounded-2xl border-3 text-left transition-all relative flex flex-col justify-between gap-2 shadow-sm cursor-pointer ${
              selectedUnitId === 'all'
                ? 'bg-amber-50 border-amber-600 ring-3 ring-amber-400/50 shadow-md'
                : 'bg-slate-50 border-slate-300 hover:border-amber-400 hover:bg-white'
            }`}
          >
            <div className="flex items-start justify-between gap-2">
              <div>
                <span className="text-[10px] font-black uppercase tracking-wider text-slate-600 block">
                  Vista Completa
                </span>
                <h4 className="text-base font-black text-black leading-tight">
                  Todo el Proyecto
                </h4>
              </div>
              <Box className="w-5 h-5 text-slate-600 shrink-0" />
            </div>

            {/* Badge de Material Base del Proyecto */}
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="inline-flex items-center gap-1 bg-slate-200 text-slate-900 font-bold text-[11px] px-2 py-0.5 rounded-lg border border-slate-300">
                <span>📦</span>
                <span>{activeProject?.materialType || 'Melamina Blanca'} • {activeProject?.thicknessMm || 15}mm</span>
              </span>
            </div>

            <div className="text-xs font-black text-slate-700">
              {projectStats.totalPieces} Piezas en total
            </div>

            {/* Badge de Estado */}
            <div className="pt-2 border-t border-slate-200 flex items-center justify-between">
              <span className={`text-[11px] font-black px-2.5 py-1 rounded-lg flex items-center gap-1 ${
                projectStats.isAllCompleted
                  ? 'bg-emerald-600 text-white'
                  : projectStats.percentage > 0
                  ? 'bg-amber-500 text-amber-950'
                  : 'bg-slate-200 text-slate-700'
              }`}>
                {projectStats.isAllCompleted ? <Check className="w-3.5 h-3.5 stroke-[3]" /> : null}
                {projectStats.isAllCompleted 
                  ? '✓ 100% ARMADO' 
                  : projectStats.percentage > 0 
                  ? `⏳ ${projectStats.percentage}% En Proceso` 
                  : '⚪ Pendiente'}
              </span>

              <span className="text-xs font-black text-slate-900">
                {projectStats.assembledPieces}/{projectStats.totalPieces}
              </span>
            </div>
          </button>

          {/* Muebles Individuales */}
          {unitStatsList.map(({ unit, totalPieces, assembledPieces, percentage, isCompleted, isInProgress }, unitIdx) => {
            const isSelected = selectedUnitId === unit.id;
            const unitMaterial = unit.materialType || activeProject?.materialType || 'Melamina Blanca';
            const unitThickness = unit.thicknessMm || activeProject?.thicknessMm || 15;

            return (
              <div
                key={`unit-stat-card-${unit.id}-${unitIdx}`}
                onClick={() => setSelectedUnitId(unit.id)}
                className={`p-4 rounded-2xl border-3 text-left transition-all relative flex flex-col justify-between gap-2.5 shadow-sm cursor-pointer ${
                  isCompleted
                    ? isSelected
                    ? 'bg-emerald-50 border-emerald-600 ring-3 ring-emerald-500/50 shadow-md'
                    : 'bg-emerald-50/60 border-emerald-500 hover:bg-emerald-50'
                    : isSelected
                    ? 'bg-amber-50 border-black ring-3 ring-black/40 shadow-md'
                    : 'bg-white border-slate-300 hover:border-amber-500 hover:bg-amber-50/30'
                }`}
              >
                {/* Cabecera del Mueble */}
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <span className="text-[10px] font-black uppercase tracking-wider text-slate-600 block truncate">
                      {unit.category || 'Mueble'} • {unit.heightCm}×{unit.widthCm}×{unit.depthCm} cm
                    </span>
                    <h4 className="text-base font-black text-black leading-tight truncate">
                      {unit.name}
                    </h4>
                  </div>

                  {/* Indicador de estado iconográfico */}
                  <div className="shrink-0">
                    {isCompleted ? (
                      <div className="w-6 h-6 rounded-full bg-emerald-600 text-white flex items-center justify-center shadow-xs">
                        <Check className="w-4 h-4 stroke-[3]" />
                      </div>
                    ) : isInProgress ? (
                      <div className="w-6 h-6 rounded-full bg-amber-500 text-amber-950 font-black text-[10px] flex items-center justify-center shadow-xs">
                        ⏳
                      </div>
                    ) : (
                      <div className="w-6 h-6 rounded-full bg-slate-200 text-slate-600 font-black text-[10px] flex items-center justify-center">
                        {totalPieces}
                      </div>
                    )}
                  </div>
                </div>

                {/* Badge Visual Destacado de Material y Espesor */}
                <div className="flex items-center gap-1.5 flex-wrap">
                  <span className="inline-flex items-center gap-1.5 bg-amber-100 text-amber-950 font-black text-xs px-2.5 py-1 rounded-xl border-2 border-amber-300 shadow-2xs">
                    <span>📦</span>
                    <span>{unitMaterial} • {unitThickness}mm</span>
                  </span>
                </div>

                {/* Dimensiones y piezas */}
                <div className="text-xs font-black text-slate-800 flex items-center justify-between">
                  <span>{totalPieces} Piezas físicas</span>
                  <span className={isCompleted ? 'text-emerald-800' : 'text-slate-600'}>
                    {assembledPieces} de {totalPieces} Listas
                  </span>
                </div>

                {/* Mini Barra de Progreso del Mueble */}
                <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden">
                  <div 
                    className={`h-full transition-all duration-300 ${
                      isCompleted ? 'bg-emerald-600' : 'bg-amber-500'
                    }`}
                    style={{ width: `${percentage}%` }}
                  />
                </div>

                {/* Badge de Estado y Botón Rápido */}
                <div className="pt-2 border-t border-slate-200/80 flex items-center justify-between gap-1">
                  <span className={`text-[11px] font-black px-2 py-0.5 rounded-lg flex items-center gap-1 ${
                    isCompleted
                      ? 'bg-emerald-600 text-white shadow-xs'
                      : isInProgress
                      ? 'bg-amber-500 text-amber-950'
                      : 'bg-slate-200 text-slate-700'
                  }`}>
                    {isCompleted ? (
                      <>
                        <Check className="w-3 h-3 stroke-[3]" />
                        <span>✓ 100% ARMADO</span>
                      </>
                    ) : isInProgress ? (
                      <span>⏳ {assembledPieces}/{totalPieces} ({percentage}%)</span>
                    ) : (
                      <span>⚪ Pendiente</span>
                    )}
                  </span>

                  {/* Botón rápido "Marcar Todo el Mueble Listo" */}
                  {!isCompleted ? (
                    <button
                      type="button"
                      onClick={(e) => handleMarkUnitAssembled(unit.id, e)}
                      className="bg-slate-100 hover:bg-emerald-600 hover:text-white text-slate-800 font-black text-[10px] px-2 py-1 rounded-md border border-slate-300 transition cursor-pointer"
                      title="Marcar todas las piezas de este mueble como armadas"
                    >
                      ✓ Terminar
                    </button>
                  ) : (
                    <span className="text-[10px] font-black text-emerald-800">
                      Listo en taller
                    </span>
                  )}
                </div>

              </div>
            );
          })}

        </div>

        {/* ========================================================================= */}
        {/* BARRA DE PROGRESO DEL MUEBLE SELECCIONADO ACTUAL                          */}
        {/* ========================================================================= */}
        <div className="bg-slate-100 rounded-2xl p-4 sm:p-5 border-3 border-slate-300 space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <span className={`w-4 h-4 rounded-full ${
                currentUnitPercentage === 100 ? 'bg-emerald-600' : 'bg-amber-500 animate-pulse'
              }`} />
              <span className="text-base sm:text-lg font-black text-black">
                Progreso del Mueble Activo: <strong className="text-black underline decoration-amber-500">{activeFurnitureName}</strong>
              </span>
            </div>

            <div className="flex items-center gap-2 self-start sm:self-center">
              <span className={`text-base sm:text-lg font-black ${
                currentUnitPercentage === 100 ? 'text-emerald-800' : 'text-orange-800'
              }`}>
                {currentUnitAssembledPieces} de {currentUnitTotalPieces} Piezas Armadas ({currentUnitPercentage}%)
              </span>
            </div>
          </div>

          <div className="w-full bg-slate-300 h-5 rounded-full overflow-hidden p-0.5 border-2 border-slate-400">
            <div 
              className={`h-full rounded-full transition-all duration-500 ${
                currentUnitPercentage === 100 
                  ? 'bg-emerald-600' 
                  : 'bg-gradient-to-r from-amber-500 via-orange-500 to-emerald-500'
              }`}
              style={{ width: `${currentUnitPercentage}%` }}
            />
          </div>

          {/* Acciones directas sobre el mueble seleccionado */}
          <div className="flex items-center justify-between flex-wrap gap-2 pt-1 no-print">
            <span className="text-xs font-black text-slate-700">
              {currentUnitPercentage === 100 
                ? '🎉 ¡Todas las piezas de este mueble han sido fijadas y ensambladas!' 
                : 'Marca cada pieza en la lista inferior conforme la ensables en el banco.'}
            </span>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleMarkCurrentAssembled}
                className="bg-emerald-600 hover:bg-emerald-700 text-white font-black px-3.5 py-1.5 rounded-xl text-xs flex items-center gap-1 shadow-sm border border-emerald-800 transition cursor-pointer"
              >
                <Check className="w-3.5 h-3.5 stroke-[3]" />
                <span>Marcar Este Mueble Completo</span>
              </button>
              <button
                type="button"
                onClick={handleResetCurrent}
                className="bg-white hover:bg-slate-200 text-black font-black px-3 py-1.5 rounded-xl text-xs border border-slate-400 transition cursor-pointer"
                title="Reiniciar piezas de este mueble"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Reiniciar</span>
              </button>
            </div>
          </div>

        </div>

      </div>

      {/* ========================================================================= */}
      {/* 1. CROQUIS / DIAGRAMA VISUAL DEL MUEBLE (FONDO BLANCO Y ALTO CONTRASTE)   */}
      {/* ========================================================================= */}
      <div className="bg-white rounded-3xl p-5 sm:p-6 border-4 border-amber-800/20 shadow-xl space-y-4">
        
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b-2 border-slate-300 pb-3">
          <div>
            <h3 className="text-xl sm:text-2xl font-black text-black tracking-tight flex items-center gap-2">
              <Ruler className="w-6 h-6 text-amber-600" />
              <span>Croquis Visual de Ensamble y Estructura ({activeFurnitureName})</span>
            </h3>
            <p className="text-xs sm:text-sm font-black text-slate-700 mt-0.5">
              Esquema técnico directo en fondo blanco: código de colores vivo para cada componente y cotas legibles.
            </p>
          </div>

          {/* Toggle Modo Armado vs Explotado */}
          <div className="flex items-center bg-slate-200 p-1.5 rounded-xl border-2 border-slate-400 self-start sm:self-center text-xs font-black no-print">
            <button
              type="button"
              onClick={() => setDiagramMode('armado')}
              className={`px-3.5 py-1.5 rounded-lg transition ${
                diagramMode === 'armado'
                  ? 'bg-black text-white shadow-md'
                  : 'text-slate-800 hover:text-black font-black'
              }`}
            >
              📐 Mueble Ensamblado
            </button>
            <button
              type="button"
              onClick={() => setDiagramMode('explotado')}
              className={`px-3.5 py-1.5 rounded-lg transition ${
                diagramMode === 'explotado'
                  ? 'bg-black text-white shadow-md'
                  : 'text-slate-800 hover:text-black font-black'
              }`}
            >
              💥 Despiece / Explotado
            </button>
          </div>
        </div>

        {/* Canvas / SVG Croquis Blueprint - FONDO BLANCO PURO DE ALTO CONTRASTE */}
        <div className="bg-white rounded-2xl p-4 sm:p-6 border-4 border-black shadow-lg text-black flex flex-col items-center justify-center min-h-[360px] relative overflow-hidden">
          
          {/* Leyenda superior de cotas con texto negro puro */}
          <div className="w-full flex items-center justify-between text-xs sm:text-sm text-black font-black border-b-2 border-slate-300 pb-2 mb-3">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="bg-black text-white px-2.5 py-1 rounded-lg uppercase tracking-wider text-xs font-black">
                Medidas Generales
              </span>
              <span className="bg-amber-100 text-black px-3 py-1 rounded-lg border-2 border-amber-400 font-black text-sm">
                {dimensions.height} cm Alto × {dimensions.width} cm Ancho × {dimensions.depth} cm Fondo (Espesor {dimensions.thickness} mm)
              </span>
            </div>

            {/* Código de Colores Rápido */}
            <div className="hidden lg:flex items-center gap-2 text-[11px] font-black flex-wrap">
              <span className="flex items-center gap-1 text-blue-800"><span className="w-3 h-3 bg-[#1d4ed8] rounded border border-black inline-block"></span> Costados/Laterales</span>
              <span className="flex items-center gap-1 text-orange-800"><span className="w-3 h-3 bg-[#ea580c] rounded border border-black inline-block"></span> Piso/Techo/Amarres</span>
              <span className="flex items-center gap-1 text-emerald-800"><span className="w-3 h-3 bg-[#059669] rounded border border-black inline-block"></span> Repisas</span>
              <span className="flex items-center gap-1 text-purple-800"><span className="w-3 h-3 bg-[#7c3aed] rounded border border-black inline-block"></span> Fondo MDF 3mm</span>
              <span className="flex items-center gap-1 text-amber-800"><span className="w-3 h-3 bg-[#d97706] rounded border border-black inline-block"></span> Puertas/Frentes Cajón</span>
            </div>
          </div>

          {/* Render dinámico del croquis en SVG */}
          <FurnitureBlueprintSVG
            category={activeCategory}
            cuts={activeCuts}
            dimensions={dimensions}
            mode={diagramMode}
            hoveredPieceId={hoveredPieceId}
            selectedPieceId={selectedPieceId}
            onSelectPiece={(id) => setSelectedPieceId(id === selectedPieceId ? null : id)}
          />

          {/* Guía Rápida de Atornillado, Ranuras y Correderas - Texto Negro sobre fondo claro */}
          <div className="w-full mt-3 pt-3 border-t-2 border-slate-300 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2 text-xs font-black text-black">
            <div className="bg-slate-100 p-2.5 rounded-xl border-2 border-slate-400 flex items-center gap-2 shadow-xs">
              <span className="text-amber-600 text-lg">🔩</span>
              <span><strong>Spax 4.0×50:</strong> A tope (pretaladrar Ø3mm)</span>
            </div>
            <div className="bg-orange-50 p-2.5 rounded-xl border-2 border-orange-300 flex items-center gap-2 shadow-xs text-orange-950">
              <span className="text-orange-600 text-lg">🪵</span>
              <span><strong>Amarres Sup.:</strong> Fijación costados + cubierta</span>
            </div>
            <div className="bg-blue-50 p-2.5 rounded-xl border-2 border-blue-300 flex items-center gap-2 shadow-xs text-blue-950">
              <span className="text-blue-600 text-lg">📏</span>
              <span><strong>Correderas H45:</strong> Holgura 12.7mm/lado (eje 37mm)</span>
            </div>
            <div className="bg-purple-50 p-2.5 rounded-xl border-2 border-purple-300 flex items-center gap-2 shadow-xs text-purple-950">
              <span className="text-purple-700 text-lg">📐</span>
              <span><strong>Ranura 3mm:</strong> A 20mm gabinete / 12mm cajón</span>
            </div>
          </div>

        </div>

      </div>

      {/* ========================================================================= */}
      {/* 2. TARJETAS / LISTA DE PIEZAS VISUAL (TEXTO NEGRO DE ALTO CONTRASTE)      */}
      {/* ========================================================================= */}
      <div className="bg-white rounded-3xl p-5 sm:p-6 border-4 border-amber-800/20 shadow-xl space-y-4">
        
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b-2 border-slate-300 pb-3">
          <div>
            <h3 className="text-xl sm:text-2xl font-black text-black tracking-tight flex items-center gap-2">
              <Layers className="w-6 h-6 text-amber-600" />
              <span>Lista Visual de Piezas para Ensamble ({activeCuts.length} Tipos de Pieza)</span>
            </h3>
            <p className="text-xs sm:text-sm font-black text-slate-700 mt-0.5">
              Revisa medida exacta, lados canteados, mecanizado requerido y marca como armada al fijar.
            </p>
          </div>

          <div className="text-xs font-black text-black bg-amber-100 px-3.5 py-2 rounded-xl border-2 border-amber-400">
            Total en Banco: <span className="text-black text-sm font-black">{currentUnitTotalPieces} Piezas Físicas</span>
          </div>
        </div>

        {/* Grid de Tarjetas de Piezas */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {activeCuts.map((cut, index) => {
            const isAssembled = isCutAssembled(cut);
            const styling = getPieceStyling(cut);
            const edgeSummary = getEdgeBandingSummary(cut.edges);
            const isHighlighted = hoveredPieceId === cut.id || selectedPieceId === cut.id;

            // Identificación de Material y Espesor de la Pieza vs Mueble Padre
            const parentUnit = activeProject?.furnitureUnits?.find(u => u.id === cut.furnitureId || u.id === selectedUnitId);
            const defaultParentMat = parentUnit?.materialType || activeProject?.materialType || 'Melamina Blanca';
            const defaultParentTh = parentUnit?.thicknessMm || activeProject?.thicknessMm || 15;
            
            const pieceMaterial = cut.materialType || defaultParentMat;
            const pieceThickness = cut.thicknessMm || defaultParentTh;

            const isCustomOrDifferent = 
              pieceMaterial.toLowerCase().trim() !== defaultParentMat.toLowerCase().trim() ||
              Number(pieceThickness) !== Number(defaultParentTh);

            return (
              <div
                key={`piece-cut-${cut.id || index}-${index}`}
                onMouseEnter={() => setHoveredPieceId(cut.id)}
                onMouseLeave={() => setHoveredPieceId(null)}
                className={`rounded-2xl p-4 sm:p-5 border-2 transition-all flex flex-col justify-between gap-3 shadow-md relative bg-white ${styling.borderAccent} ${
                  isAssembled
                    ? 'border-emerald-600 bg-emerald-50/40 ring-2 ring-emerald-500/20'
                    : isHighlighted
                    ? 'border-black ring-3 ring-black/40 shadow-xl'
                    : 'border-slate-400 hover:border-black'
                }`}
              >
                {/* Cabecera de la Pieza: Nombre, Tipo y Cantidad */}
                <div>
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <div className="flex-1">
                      <div className="flex items-center gap-1.5 flex-wrap mb-1">
                        <span className="w-6 h-6 rounded-lg bg-black text-white font-black text-xs flex items-center justify-center shrink-0">
                          {index + 1}
                        </span>
                        <span className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-md ${styling.tagBg}`}>
                          {styling.typeTag}
                        </span>
                      </div>
                      <h4 className="text-lg sm:text-xl font-black text-black leading-tight">
                        {cut.name}
                      </h4>
                      {cut.furnitureName && (
                        <div className="text-xs text-slate-700 font-bold">
                          {cut.furnitureName}
                        </div>
                      )}
                    </div>

                    {/* Cantidad Badge */}
                    <div className="bg-black text-white font-black text-sm px-3 py-1 rounded-xl shrink-0 shadow-sm border border-slate-700">
                      {cut.quantity} {cut.quantity > 1 ? 'piezas' : 'pieza'}
                    </div>
                  </div>

                  {/* Etiqueta Destacada: Pieza cortada de Retazo en Almacén */}
                  {getPieceOffcutInfo(cut) && (
                    <div className="bg-gradient-to-r from-amber-100 to-amber-200 border-2 border-amber-500 p-2.5 rounded-xl flex items-center justify-between gap-2 shadow-xs my-2">
                      <div className="flex items-center gap-2 min-w-0">
                        <span className="text-base shrink-0">📦</span>
                        <div className="min-w-0">
                          <span className="text-[9px] font-black uppercase text-amber-900 block tracking-wider">
                            Origen: Pedacería de Taller
                          </span>
                          <span className="text-xs font-black text-black truncate block">
                            Cortar de Retazo en Almacén ({getPieceOffcutInfo(cut)})
                          </span>
                        </div>
                      </div>
                      <span className="bg-amber-800 text-amber-100 text-[9px] font-black px-2 py-0.5 rounded-md uppercase shrink-0">
                        Retazo
                      </span>
                    </div>
                  )}

                  {/* Badge de Material de la Pieza (Resaltado Especial si difiere) */}
                  {isCustomOrDifferent ? (
                    <div className="bg-purple-100 border-2 border-purple-400 p-2 rounded-xl flex items-center justify-between gap-2 shadow-xs my-2">
                      <div className="flex items-center gap-1.5 min-w-0">
                        <span className="text-sm">⭐</span>
                        <div className="min-w-0">
                          <span className="text-[9px] font-black uppercase text-purple-900 block tracking-wider">
                            Material Diferente / Especial:
                          </span>
                          <span className="text-xs font-black text-purple-950 truncate block">
                            {pieceMaterial} • {pieceThickness}mm
                          </span>
                        </div>
                      </div>
                      <span className="bg-purple-700 text-white text-[9px] font-black px-2 py-0.5 rounded uppercase shrink-0">
                        Especial
                      </span>
                    </div>
                  ) : (
                    <div className="flex items-center gap-1.5 my-1.5">
                      <span className="inline-flex items-center gap-1 bg-slate-100 text-slate-800 font-bold text-[11px] px-2.5 py-1 rounded-lg border border-slate-300">
                        <span>🪵</span>
                        <span>{pieceMaterial} • {pieceThickness}mm</span>
                      </span>
                    </div>
                  )}

                  {/* Medida Gigante y Clara (Largo × Ancho) en TEXTO NEGRO PURO */}
                  <div className="bg-slate-100 p-3 rounded-xl border-2 border-slate-400 flex items-center justify-between my-2">
                    <div className="flex items-center gap-2.5">
                      <Ruler className="w-5 h-5 text-black shrink-0" />
                      <div>
                        <span className="text-[10px] font-black text-slate-700 uppercase tracking-wider block">
                          Medida Exacta:
                        </span>
                        <span className="text-2xl sm:text-3xl font-black text-black tracking-tight">
                          {cut.lengthCm} × {cut.widthCm} <span className="text-sm text-slate-800 font-black">cm</span>
                        </span>
                      </div>
                    </div>

                    {/* Botón de Voz */}
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleSpeakPiece(cut);
                      }}
                      className="p-2.5 rounded-xl bg-amber-200 hover:bg-amber-300 text-black border border-amber-400 transition cursor-pointer"
                      title="Escuchar medida"
                    >
                      <Volume2 className="w-4 h-4" />
                    </button>
                  </div>

                  {/* Visual Limpio de Cubrecantos (Mini-Diagrama 4 lados) */}
                  <div className="bg-white rounded-xl p-2.5 border-2 border-slate-300 flex items-center justify-between gap-3 text-xs">
                    <div className="flex-1">
                      <span className="text-[10px] font-black uppercase tracking-wide text-slate-700 block">
                        Cubrecantos:
                      </span>
                      <span className={`font-black text-xs block ${edgeSummary.count > 0 ? 'text-emerald-800' : 'text-slate-600'}`}>
                        {edgeSummary.text}
                      </span>
                    </div>

                    {/* Mini Croquis Rectangular de Cantos */}
                    <div className="w-14 h-9 bg-slate-100 rounded border-2 border-slate-400 relative flex items-center justify-center shadow-2xs shrink-0">
                      {/* Borde Superior */}
                      <div className={`absolute top-0 left-0 right-0 h-1.5 rounded-t ${edgeSummary.top ? 'bg-emerald-600' : 'bg-slate-300'}`} />
                      {/* Borde Inferior */}
                      <div className={`absolute bottom-0 left-0 right-0 h-1.5 rounded-b ${edgeSummary.bottom ? 'bg-emerald-600' : 'bg-slate-300'}`} />
                      {/* Borde Izquierdo */}
                      <div className={`absolute top-0 bottom-0 left-0 w-1.5 rounded-l ${edgeSummary.left ? 'bg-emerald-600' : 'bg-slate-300'}`} />
                      {/* Borde Derecho */}
                      <div className={`absolute top-0 bottom-0 right-0 w-1.5 rounded-r ${edgeSummary.right ? 'bg-emerald-600' : 'bg-slate-300'}`} />
                      <span className="text-[10px] font-black text-black">
                        {edgeSummary.count > 0 ? `${edgeSummary.count}C` : '0'}
                      </span>
                    </div>
                  </div>

                  {/* Detalle Rápido de Mecanizado con color distintivo */}
                  <div className={`mt-2 p-2.5 rounded-xl border-2 text-xs font-black ${styling.machiningBg}`}>
                    <div className="font-black text-xs flex items-center gap-1 text-black">
                      <span>{styling.machiningBadge}</span>
                    </div>
                    <div className="text-[11px] mt-0.5 text-black font-extrabold opacity-90">
                      {styling.machiningDetail}
                    </div>
                  </div>
                </div>

                {/* Botón de Control Directo de Armado */}
                <div className="pt-2 border-t-2 border-slate-200">
                  <button
                    type="button"
                    onClick={() => togglePieceAssembly(cut.id)}
                    className={`w-full py-3 px-4 rounded-xl font-black text-xs sm:text-sm flex items-center justify-center gap-2 transition-all shadow-md cursor-pointer ${
                      isAssembled
                        ? 'bg-emerald-600 hover:bg-emerald-700 text-white border-2 border-emerald-800'
                        : 'bg-black hover:bg-slate-800 text-white border-2 border-black'
                    }`}
                  >
                    {isAssembled ? (
                      <>
                        <CheckCircle2 className="w-5 h-5 text-white" />
                        <span>✓ Pieza Armada / Fijada</span>
                      </>
                    ) : (
                      <>
                        <Hammer className="w-5 h-5 text-amber-400" />
                        <span>Marcar como Armada</span>
                      </>
                    )}
                  </button>
                </div>

              </div>
            );
          })}
        </div>

      </div>
      </div>
      )}

      {/* ========================================================================= */}
      {/* VISTA 2: TALLER DE CUBRECANTO / CANTEADO EXCLUSIVO (PARA EL AYUDANTE)     */}
      {/* ========================================================================= */}
      {activeWorkMode === 'edgebanding' && (
        <div className="space-y-6">
          
          {/* BANNER DE CONTROL DEL TALLER DE CANTEADO */}
          <div className="bg-gradient-to-br from-emerald-950 via-slate-950 to-emerald-950 text-white rounded-3xl p-5 sm:p-6 border-4 border-emerald-600 shadow-2xl space-y-4">
            
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="flex items-center gap-3.5">
                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center font-black text-2xl shadow-lg border-2 ${
                  edgeStats.isAllCompleted
                    ? 'bg-emerald-400 text-emerald-950 border-emerald-200'
                    : 'bg-emerald-600 text-white border-emerald-400'
                }`}>
                  🏷️
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="bg-emerald-500 text-emerald-950 text-xs font-black px-2.5 py-0.5 rounded-full uppercase tracking-wider">
                      Estación de Trabajo
                    </span>
                    <span className="text-emerald-300 text-xs font-bold">
                      Ayudante / Operario de Canteadora
                    </span>
                  </div>
                  <h3 className="text-xl sm:text-2xl font-black text-white leading-tight mt-0.5">
                    MODO CUBRECANTO
                  </h3>
                </div>
              </div>

              {/* Métricas clave en grande */}
              <div className="flex items-center gap-2 flex-wrap">
                <div className="bg-slate-900/90 border border-emerald-700/60 px-3.5 py-2 rounded-xl text-xs font-bold text-slate-200">
                  Cinta Estimada: <span className="text-emerald-400 text-sm font-black">{edgeStats.bandedMeters}m / {edgeStats.totalMeters}m</span>
                </div>
                <div className="bg-slate-900/90 border border-emerald-700/60 px-3.5 py-2 rounded-xl text-xs font-bold text-slate-200">
                  Piezas Canteadas: <span className="text-amber-400 text-sm font-black">{edgeStats.completedPieces} / {edgeStats.totalPieces}</span>
                </div>
                <div className={`px-3.5 py-2 rounded-xl text-xs font-black uppercase tracking-wider flex items-center gap-1.5 shadow-sm border ${
                  edgeStats.isAllCompleted
                    ? 'bg-emerald-500 text-emerald-950 border-emerald-300'
                    : 'bg-emerald-800 text-emerald-100 border-emerald-600'
                }`}>
                  {edgeStats.isAllCompleted ? (
                    <>
                      <CheckCheck className="w-4 h-4" />
                      <span>100% Canteado Listo</span>
                    </>
                  ) : (
                    <>
                      <Clock className="w-4 h-4 text-emerald-300" />
                      <span>{edgeStats.percentage}% ({edgeStats.pendingPieces} pendientes)</span>
                    </>
                  )}
                </div>
              </div>
            </div>

            {/* Barra de Progreso de Canteado */}
            <div className="space-y-1.5">
              <div className="w-full bg-slate-900 h-6 rounded-full overflow-hidden p-1 border-2 border-emerald-700/80 relative">
                <div 
                  className={`h-full rounded-full transition-all duration-500 ${
                    edgeStats.isAllCompleted
                      ? 'bg-gradient-to-r from-emerald-400 to-teal-300'
                      : 'bg-gradient-to-r from-emerald-600 via-teal-500 to-emerald-400'
                  }`}
                  style={{ width: `${edgeStats.percentage}%` }}
                />
                <span className="absolute inset-0 flex items-center justify-center text-xs font-black text-white drop-shadow">
                  {edgeStats.percentage}% COMPLETADO • {edgeStats.completedPieces} de {edgeStats.totalPieces} piezas canteadas ({edgeStats.bandedMeters} m de cinta)
                </span>
              </div>
            </div>

            {/* Instrucción clara de taller para el operario */}
            <div className="bg-emerald-900/40 border border-emerald-700/50 p-3 rounded-2xl flex items-start gap-2.5 text-xs text-emerald-100">
              <Info className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
              <p>
                <strong>Secuencia para el ayudante:</strong> Revisa el nombre y mueble de la pieza, verifica los <strong>lados resaltados en verde/azul</strong>, aplica cubrecanto en canteadora o plancha manual, y presiona el botón <strong>[✓ Listo / Canteado]</strong> para registrar que la pieza puede pasar a la mesa de armado.
              </p>
            </div>

          </div>

          {/* BARRA DE HERRAMIENTAS, FILTROS Y BÚSQUEDA */}
          <div className="bg-white rounded-3xl p-5 sm:p-6 border-4 border-emerald-800/20 shadow-xl space-y-4">
            
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
              
              {/* Filtro por Mueble */}
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-xs font-black text-slate-700 uppercase tracking-wider flex items-center gap-1">
                  <Filter className="w-4 h-4 text-emerald-700" />
                  Filtrar por Mueble:
                </span>
                <select
                  value={selectedUnitId}
                  onChange={(e) => setSelectedUnitId(e.target.value)}
                  className="bg-slate-100 hover:bg-slate-200 text-black font-black text-xs sm:text-sm px-3.5 py-2.5 rounded-xl border-2 border-slate-400 focus:outline-none focus:border-emerald-600 cursor-pointer shadow-sm"
                >
                  <option value="all">📦 Todos los Muebles del Proyecto ({activeProject?.name})</option>
                  {(activeProject?.furnitureUnits || []).map((unit, idx) => {
                    const letter = String.fromCharCode(65 + idx);
                    const fullUnitName = unit.name.toLowerCase().startsWith('mueble') 
                      ? unit.name 
                      : `Mueble ${letter}: ${unit.name}`;
                    const unitEdgePieces = unit.cuts.filter(hasAnyEdgeBanding);
                    const unitTotalPieces = unitEdgePieces.reduce((sum, c) => sum + (c.quantity || 1), 0);
                    return (
                      <option key={unit.id} value={unit.id}>
                        {fullUnitName} ({unitTotalPieces} piezas con cubrecanto)
                      </option>
                    );
                  })}
                </select>
              </div>

              {/* Filtros de Estado Rápido */}
              <div className="flex items-center gap-1.5 bg-slate-100 p-1.5 rounded-2xl border-2 border-slate-300 flex-wrap">
                <button
                  type="button"
                  onClick={() => setEdgeFilter('all')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-black transition cursor-pointer ${
                    edgeFilter === 'all'
                      ? 'bg-black text-white shadow-sm'
                      : 'text-slate-700 hover:text-black'
                  }`}
                >
                  Todas ({allEdgeCuts.length})
                </button>
                <button
                  type="button"
                  onClick={() => setEdgeFilter('pending')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-black transition cursor-pointer ${
                    edgeFilter === 'pending'
                      ? 'bg-amber-500 text-slate-950 shadow-sm border border-amber-400'
                      : 'text-amber-800 hover:text-amber-950'
                  }`}
                >
                  ⏳ Pendientes ({edgeStats.pendingPieces})
                </button>
                <button
                  type="button"
                  onClick={() => setEdgeFilter('completed')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-black transition cursor-pointer ${
                    edgeFilter === 'completed'
                      ? 'bg-emerald-600 text-white shadow-sm'
                      : 'text-emerald-800 hover:text-emerald-950'
                  }`}
                >
                  ✓ Canteadas ({edgeStats.completedPieces})
                </button>
              </div>

            </div>

            {/* Buscador de piezas y botones de acción rápida */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-3 border-t-2 border-slate-200">
              
              {/* Input de Búsqueda */}
              <div className="relative flex-1 max-w-md">
                <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={edgeSearch}
                  onChange={(e) => setEdgeSearch(e.target.value)}
                  placeholder="Buscar pieza por nombre, mueble o medida (ej. 80x45)..."
                  className="w-full pl-9 pr-3.5 py-2 bg-slate-50 border-2 border-slate-300 rounded-xl text-xs font-bold text-black focus:outline-none focus:border-emerald-600"
                />
              </div>

              {/* Botones de acción masiva y exportación */}
              <div className="flex items-center gap-2 flex-wrap">
                <button
                  type="button"
                  onClick={() => setShowEdgeBandingPdfModal(true)}
                  className="bg-emerald-700 hover:bg-emerald-600 text-white font-black text-xs px-3.5 py-2 rounded-xl border border-emerald-500 flex items-center gap-1.5 shadow-sm transition cursor-pointer"
                  title="Ver y Descargar Lista de Cubrecanto en PDF"
                >
                  <Tag className="w-4 h-4 text-emerald-200" />
                  <span>📄 Lista de Cubrecanto (PDF)</span>
                </button>
                <button
                  type="button"
                  onClick={handleMarkAllEdgeBanded}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs px-3.5 py-2 rounded-xl border border-emerald-700 flex items-center gap-1.5 shadow-sm transition cursor-pointer"
                >
                  <CheckCheck className="w-4 h-4" />
                  <span>Marcar Todo Canteado</span>
                </button>
                <button
                  type="button"
                  onClick={handleResetAllEdgeBanded}
                  className="bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs px-3.5 py-2 rounded-xl border border-slate-300 flex items-center gap-1.5 transition cursor-pointer"
                >
                  <RotateCcw className="w-4 h-4" />
                  <span>Reiniciar</span>
                </button>
              </div>

            </div>

          </div>

          {/* GRID DE TARJETAS DE CANTEADO (ORDENADAS POR MUEBLE Y NOMBRE) */}
          {filteredEdgeCuts.length === 0 ? (
            <div className="bg-white rounded-3xl p-10 text-center border-4 border-dashed border-slate-300 space-y-3">
              <div className="w-16 h-16 bg-emerald-100 text-emerald-800 rounded-2xl flex items-center justify-center font-black text-3xl mx-auto">
                🏷️
              </div>
              <h4 className="text-xl font-black text-black">
                {allEdgeCuts.length === 0 
                  ? 'No hay piezas con cubrecanto en este mueble / proyecto'
                  : 'No se encontraron piezas con los filtros seleccionados'}
              </h4>
              <p className="text-xs text-slate-600 max-w-md mx-auto">
                {allEdgeCuts.length === 0 
                  ? 'Todas las piezas de este mueble son cortes limpios sin canto o están configuradas en 0 lados.'
                  : 'Prueba cambiando los filtros de pendientes/canteadas o borrando el término de búsqueda.'}
              </p>
              {allEdgeCuts.length > 0 && (
                <button
                  type="button"
                  onClick={() => { setEdgeFilter('all'); setEdgeSearch(''); }}
                  className="bg-black hover:bg-slate-800 text-white font-bold text-xs px-4 py-2 rounded-xl transition cursor-pointer mt-2"
                >
                  Ver Todas las Piezas con Canto ({allEdgeCuts.length})
                </button>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {filteredEdgeCuts.map((cut, index) => {
                const isBanded = isCutEdgeBanded(cut);
                const edges = cut.edges || {};
                const top = !!edges.top;
                const bottom = !!edges.bottom;
                const left = !!edges.left;
                const right = !!edges.right;

                // Conteo de lados activos
                const activeSidesCount = [top, bottom, left, right].filter(Boolean).length;

                // Metros de cinta para esta pieza específica
                let singlePieceCm = 0;
                if (top) singlePieceCm += cut.lengthCm;
                if (bottom) singlePieceCm += cut.lengthCm;
                if (left) singlePieceCm += cut.widthCm;
                if (right) singlePieceCm += cut.widthCm;
                const singlePieceMeters = (singlePieceCm / 100).toFixed(2);
                const totalPieceMeters = ((singlePieceCm * (cut.quantity || 1)) / 100).toFixed(2);

                const pieceMat = cut.materialType || activeProject?.materialType || 'Melamina Blanca';
                const pieceTh = cut.thicknessMm || activeProject?.thicknessMm || 15;
                const isCustomMat = 
                  pieceMat.toLowerCase().trim() !== (activeProject?.materialType || '').toLowerCase().trim() ||
                  Number(pieceTh) !== Number(activeProject?.thicknessMm || 15);

                return (
                  <div
                    key={`edge-cut-${cut.id || index}-${index}`}
                    className={`rounded-3xl p-5 border-3 transition-all flex flex-col justify-between gap-4 shadow-lg relative bg-white ${
                      isBanded
                        ? 'border-emerald-600 bg-emerald-50/50 ring-2 ring-emerald-500/20'
                        : 'border-slate-300 hover:border-black hover:shadow-xl'
                    }`}
                  >
                    {/* CABECERA: MUEBLE, NOMBRE Y CANTIDAD */}
                    <div>
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <div className="flex-1">
                          <div className="flex items-center gap-1.5 flex-wrap mb-1">
                            <span className="w-6 h-6 rounded-lg bg-black text-white font-black text-xs flex items-center justify-center shrink-0">
                              {index + 1}
                            </span>
                            <span className="bg-slate-900 text-amber-300 text-[10px] sm:text-xs font-black px-2.5 py-1 rounded-md border border-slate-700 max-w-full truncate shadow-xs">
                              📦 {(cut as any).fullFurnitureName || getFurnitureDisplayName(cut, activeProject)}
                            </span>
                            <span className="bg-emerald-100 text-emerald-900 text-[10px] font-black uppercase px-2 py-0.5 rounded-md">
                              {activeSidesCount} {activeSidesCount === 1 ? 'Lado con Canto' : 'Lados con Canto'}
                            </span>
                          </div>
                          
                          <h4 className="text-xl font-black text-black leading-tight mt-1">
                            {cut.name}
                          </h4>

                          {/* Etiqueta Destacada: Pieza cortada de Retazo en Almacén */}
                          {getPieceOffcutInfo(cut) && (
                            <div className="bg-amber-100 border-2 border-amber-500 text-amber-950 px-2.5 py-1 rounded-xl inline-flex items-center gap-1.5 text-xs font-black my-1 shadow-xs">
                              <span>📦</span>
                              <span>Cortar de Retazo en Almacén ({getPieceOffcutInfo(cut)})</span>
                            </div>
                          )}
                          
                          {/* Badge de Material */}
                          {isCustomMat ? (
                            <div className="inline-flex items-center gap-1 bg-purple-100 text-purple-950 text-xs font-black px-2.5 py-0.5 rounded-lg border border-purple-300 mt-1">
                              <span>⭐</span>
                              <span>{pieceMat} • {pieceTh}mm (Especial)</span>
                            </div>
                          ) : (
                            <div className="text-xs text-slate-600 font-bold mt-0.5">
                              {pieceMat} • {pieceTh} mm
                            </div>
                          )}
                        </div>

                        {/* Cantidad Gigante */}
                        <div className="bg-black text-white font-black text-sm px-3.5 py-1.5 rounded-2xl shrink-0 shadow-md border-2 border-slate-700 flex flex-col items-center">
                          <span className="text-[10px] uppercase font-bold text-amber-400">Cantidad</span>
                          <span className="text-base">x{cut.quantity} {cut.quantity > 1 ? 'piezas' : 'pza'}</span>
                        </div>
                      </div>

                      {/* DIMENSIÓN EXACTA EN GRANDE + BOTÓN DE AUDIO */}
                      <div className="bg-slate-100 p-3.5 rounded-2xl border-2 border-slate-300 flex items-center justify-between my-2 shadow-xs">
                        <div className="flex items-center gap-2.5">
                          <Ruler className="w-6 h-6 text-black shrink-0" />
                          <div>
                            <span className="text-[10px] font-black text-slate-600 uppercase tracking-wider block">
                              Medida de Corte (Largo × Ancho):
                            </span>
                            <span className="text-2xl sm:text-3xl font-black text-black tracking-tight">
                              {cut.lengthCm} × {cut.widthCm} <span className="text-sm font-black text-slate-700">cm</span>
                            </span>
                          </div>
                        </div>

                        <button
                          type="button"
                          onClick={() => handleSpeakEdgeBanding(cut)}
                          className="p-2.5 rounded-xl bg-amber-200 hover:bg-amber-300 text-black border border-amber-400 transition cursor-pointer shadow-xs"
                          title="Escuchar lados de cubrecanto"
                        >
                          <Volume2 className="w-5 h-5" />
                        </button>
                      </div>

                      {/* INDICADORES VISUALES DESTACADOS DE LOS 4 LADOS (SUPERIOR, INFERIOR, IZQUIERDA, DERECHA) */}
                      <div className="space-y-2 my-3">
                        <div className="flex items-center justify-between text-[11px] font-black text-slate-700 uppercase tracking-wide">
                          <span>🏷️ Lados a Cantear:</span>
                          <span className="text-emerald-800 font-extrabold">{totalPieceMeters}m de cinta ({singlePieceMeters}m/pza)</span>
                        </div>

                        {/* Grid 2x2 de Lados */}
                        <div className="grid grid-cols-2 gap-2 text-xs">
                          {/* LARGO 1 - SUPERIOR */}
                          <div className={`p-2.5 rounded-xl border-2 flex items-center justify-between gap-1 ${
                            top
                              ? 'bg-emerald-600 text-white border-emerald-700 shadow-xs font-black'
                              : 'bg-slate-100 text-slate-400 border-slate-200 font-bold'
                          }`}>
                            <div className="flex items-center gap-1.5 truncate">
                              <span className="text-sm">⬆️</span>
                              <div className="truncate">
                                <span className="block text-[10px] uppercase opacity-90">Largo 1 (Sup.)</span>
                                <span className="text-xs font-black">{cut.lengthCm} cm</span>
                              </div>
                            </div>
                            <span className={`text-[10px] px-1.5 py-0.5 rounded font-black shrink-0 ${
                              top ? 'bg-emerald-800 text-emerald-100' : 'bg-slate-200 text-slate-500'
                            }`}>
                              {top ? '✓ CANTO' : '—'}
                            </span>
                          </div>

                          {/* LARGO 2 - INFERIOR */}
                          <div className={`p-2.5 rounded-xl border-2 flex items-center justify-between gap-1 ${
                            bottom
                              ? 'bg-emerald-600 text-white border-emerald-700 shadow-xs font-black'
                              : 'bg-slate-100 text-slate-400 border-slate-200 font-bold'
                          }`}>
                            <div className="flex items-center gap-1.5 truncate">
                              <span className="text-sm">⬇️</span>
                              <div className="truncate">
                                <span className="block text-[10px] uppercase opacity-90">Largo 2 (Inf.)</span>
                                <span className="text-xs font-black">{cut.lengthCm} cm</span>
                              </div>
                            </div>
                            <span className={`text-[10px] px-1.5 py-0.5 rounded font-black shrink-0 ${
                              bottom ? 'bg-emerald-800 text-emerald-100' : 'bg-slate-200 text-slate-500'
                            }`}>
                              {bottom ? '✓ CANTO' : '—'}
                            </span>
                          </div>

                          {/* ANCHO 1 - IZQUIERDA */}
                          <div className={`p-2.5 rounded-xl border-2 flex items-center justify-between gap-1 ${
                            left
                              ? 'bg-blue-600 text-white border-blue-700 shadow-xs font-black'
                              : 'bg-slate-100 text-slate-400 border-slate-200 font-bold'
                          }`}>
                            <div className="flex items-center gap-1.5 truncate">
                              <span className="text-sm">⬅️</span>
                              <div className="truncate">
                                <span className="block text-[10px] uppercase opacity-90">Ancho 1 (Izq.)</span>
                                <span className="text-xs font-black">{cut.widthCm} cm</span>
                              </div>
                            </div>
                            <span className={`text-[10px] px-1.5 py-0.5 rounded font-black shrink-0 ${
                              left ? 'bg-blue-800 text-blue-100' : 'bg-slate-200 text-slate-500'
                            }`}>
                              {left ? '✓ CANTO' : '—'}
                            </span>
                          </div>

                          {/* ANCHO 2 - DERECHA */}
                          <div className={`p-2.5 rounded-xl border-2 flex items-center justify-between gap-1 ${
                            right
                              ? 'bg-blue-600 text-white border-blue-700 shadow-xs font-black'
                              : 'bg-slate-100 text-slate-400 border-slate-200 font-bold'
                          }`}>
                            <div className="flex items-center gap-1.5 truncate">
                              <span className="text-sm">➡️</span>
                              <div className="truncate">
                                <span className="block text-[10px] uppercase opacity-90">Ancho 2 (Der.)</span>
                                <span className="text-xs font-black">{cut.widthCm} cm</span>
                              </div>
                            </div>
                            <span className={`text-[10px] px-1.5 py-0.5 rounded font-black shrink-0 ${
                              right ? 'bg-blue-800 text-blue-100' : 'bg-slate-200 text-slate-500'
                            }`}>
                              {right ? '✓ CANTO' : '—'}
                            </span>
                          </div>
                        </div>

                      </div>

                      {/* MINI CROQUIS RECTANGULAR VISUAL */}
                      <div className="bg-slate-100 p-3 rounded-2xl border-2 border-slate-300 flex items-center justify-center">
                        <div className="relative w-44 h-24 bg-white rounded-lg border-2 border-slate-300 flex items-center justify-center shadow-xs">
                          {/* Lado Superior */}
                          <div className={`absolute top-0 left-0 right-0 h-2.5 rounded-t transition-all ${
                            top ? 'bg-emerald-600 shadow-xs' : 'bg-slate-200'
                          }`} />
                          <span className={`absolute -top-4 text-[9px] font-black uppercase ${top ? 'text-emerald-700' : 'text-slate-400'}`}>
                            {cut.lengthCm}cm {top ? '(Canto)' : ''}
                          </span>

                          {/* Lado Inferior */}
                          <div className={`absolute bottom-0 left-0 right-0 h-2.5 rounded-b transition-all ${
                            bottom ? 'bg-emerald-600 shadow-xs' : 'bg-slate-200'
                          }`} />
                          <span className={`absolute -bottom-4 text-[9px] font-black uppercase ${bottom ? 'text-emerald-700' : 'text-slate-400'}`}>
                            {cut.lengthCm}cm {bottom ? '(Canto)' : ''}
                          </span>

                          {/* Lado Izquierdo */}
                          <div className={`absolute top-0 bottom-0 left-0 w-2.5 rounded-l transition-all ${
                            left ? 'bg-blue-600 shadow-xs' : 'bg-slate-200'
                          }`} />
                          <span className={`absolute -left-7 text-[9px] font-black uppercase -rotate-90 ${left ? 'text-blue-700' : 'text-slate-400'}`}>
                            {cut.widthCm}cm
                          </span>

                          {/* Lado Derecho */}
                          <div className={`absolute top-0 bottom-0 right-0 w-2.5 rounded-r transition-all ${
                            right ? 'bg-blue-600 shadow-xs' : 'bg-slate-200'
                          }`} />
                          <span className={`absolute -right-7 text-[9px] font-black uppercase rotate-90 ${right ? 'text-blue-700' : 'text-slate-400'}`}>
                            {cut.widthCm}cm
                          </span>

                          <span className="text-xs font-black text-black text-center px-2">
                            {cut.name}
                          </span>
                        </div>
                      </div>

                    </div>

                    {/* BOTÓN INTERACTIVO DE CHECKLIST [✓ Listo / Canteado] */}
                    <div className="pt-2 border-t-2 border-slate-200">
                      <button
                        type="button"
                        onClick={() => togglePieceEdgeBanded(cut.id)}
                        className={`w-full py-3.5 px-4 rounded-2xl font-black text-sm flex items-center justify-center gap-2 transition-all shadow-md cursor-pointer ${
                          isBanded
                            ? 'bg-emerald-600 hover:bg-emerald-700 text-white border-2 border-emerald-800 ring-2 ring-emerald-400/30'
                            : 'bg-black hover:bg-slate-800 text-white border-2 border-black'
                        }`}
                      >
                        {isBanded ? (
                          <>
                            <CheckCircle2 className="w-5 h-5 text-white" />
                            <span>✓ Listo / Pieza Canteada</span>
                          </>
                        ) : (
                          <>
                            <Tag className="w-5 h-5 text-amber-400" />
                            <span>Marcar como Canteada</span>
                          </>
                        )}
                      </button>
                    </div>

                  </div>
                );
              })}
            </div>
          )}

        </div>
      )}

      {/* Modal de Proyectos Guardados (Cambiar Proyecto en Módulo 3) */}
      {showProjectModal && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-3xl w-full max-h-[85vh] overflow-hidden border-4 border-amber-800 flex flex-col shadow-2xl">
            <div className="bg-amber-950 text-white p-6 border-b-4 border-amber-600 flex items-center justify-between">
              <h3 className="text-xl sm:text-2xl font-black flex items-center gap-3">
                <Layers className="w-7 h-7 text-amber-400" />
                SELECCIONAR PROYECTO PARA MÓDULO 3
              </h3>
              <button
                type="button"
                onClick={() => setShowProjectModal(false)}
                className="bg-amber-800 text-white px-4 py-2 rounded-xl font-black hover:bg-amber-700 cursor-pointer"
              >
                ✕ CERRAR
              </button>
            </div>

            <div className="p-6 overflow-y-auto space-y-4 flex-1">
              {projects.length === 0 ? (
                <p className="text-center text-xl font-bold text-slate-500 py-10">
                  No hay proyectos guardados todavía.
                </p>
              ) : (
                projects.map((proj, projIdx) => {
                  const isCurrent = proj.id === selectedProjectId;
                  const totalPieces = (proj.cuts || []).reduce((sum, c) => sum + (c.quantity || 1), 0);
                  const unitsCount = proj.furnitureUnits?.length || 1;
                  const edgePiecesCount = (proj.cuts || []).filter(hasAnyEdgeBanding).reduce((sum, c) => sum + (c.quantity || 1), 0);

                  return (
                    <div
                      key={`modal-proj-item-${proj.id}-${projIdx}`}
                      className={`p-5 rounded-2xl border-3 transition flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 ${
                        isCurrent
                          ? 'border-amber-600 bg-amber-50 ring-2 ring-amber-500/30'
                          : 'border-slate-300 bg-white hover:border-amber-400 hover:bg-amber-50/20'
                      }`}
                    >
                      <div className="flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="bg-amber-800 text-white text-xs font-black px-3 py-1 rounded-full uppercase">
                            {proj.category || 'Mueble'}
                          </span>
                          {isCurrent && (
                            <span className="bg-emerald-600 text-white text-xs font-black px-2.5 py-0.5 rounded-full flex items-center gap-1">
                              <Check className="w-3.5 h-3.5" /> PROYECTO ACTUAL
                            </span>
                          )}
                        </div>
                        <h4 className="text-xl sm:text-2xl font-black text-slate-900 mt-1">{proj.name}</h4>
                        <p className="text-sm font-bold text-slate-600">
                          Cliente: {proj.clientName || 'General'} • {unitsCount} {unitsCount === 1 ? 'mueble' : 'muebles'} • {totalPieces} piezas totales
                        </p>
                        <p className="text-xs font-semibold text-amber-900 mt-1">
                          Material: {proj.materialType} ({proj.thicknessMm}mm) • {edgePiecesCount} piezas con cubrecanto
                        </p>
                      </div>

                      <div className="flex items-center gap-3 w-full sm:w-auto">
                        <button
                          type="button"
                          onClick={() => {
                            handleProjectChange(proj.id);
                            setShowProjectModal(false);
                          }}
                          className={`w-full sm:w-auto font-black px-5 py-3 rounded-xl border-2 flex items-center justify-center gap-2 cursor-pointer text-sm shadow-md transition ${
                            isCurrent
                              ? 'bg-slate-800 text-white border-slate-900 opacity-80'
                              : 'bg-amber-600 hover:bg-amber-700 text-white border-amber-900 hover:scale-[1.02]'
                          }`}
                        >
                          {isCurrent ? 'ACTIVO AHORA' : 'CARGAR EN MÓDULO 3'}
                        </button>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      )}

      {/* Modal de Lista de Cubrecanto en PDF */}
      {activeProject && (
        <EdgeBandingPdfModal
          isOpen={showEdgeBandingPdfModal}
          onClose={() => setShowEdgeBandingPdfModal(false)}
          project={activeProject}
          selectedUnitId={selectedUnitId}
        />
      )}

    </div>
  );
};

/**
 * =========================================================================
 * COMPONENTE VISUAL CROQUIS BLUEPRINT SVG (ALTO CONTRASTE & COLORES VIVOS)
 * =========================================================================
 */
interface BlueprintProps {
  category: FurnitureCategory;
  cuts: WoodCut[];
  dimensions: { height: number; width: number; depth: number; thickness: number };
  mode: 'armado' | 'explotado';
  hoveredPieceId: string | null;
  selectedPieceId: string | null;
  onSelectPiece: (id: string) => void;
}

const FurnitureBlueprintSVG: React.FC<BlueprintProps> = ({
  category,
  cuts,
  dimensions,
  mode,
  hoveredPieceId,
  selectedPieceId,
  onSelectPiece
}) => {
  // Detect pieces by name or category
  const lateralIzq = cuts.find(c => (c.name || '').toLowerCase().includes('izq') || c.category === 'lateral');
  const lateralDer = cuts.find(c => (c.name || '').toLowerCase().includes('der') || (c.category === 'lateral' && c.id !== lateralIzq?.id));
  const piso = cuts.find(c => ((c.name || '').toLowerCase().includes('piso') || (c.name || '').toLowerCase().includes('base')) && !(c.name || '').toLowerCase().includes('caj'));
  
  // Amarres / Listones Superiores
  const amarres = cuts.filter(c => 
    (c.name || '').toLowerCase().includes('amarre') || 
    (c.name || '').toLowerCase().includes('liston') || 
    (c.name || '').toLowerCase().includes('listón') || 
    (c.name || '').toLowerCase().includes('travesaño') ||
    (c.name || '').toLowerCase().includes('travesano') ||
    c.category === 'amarre' ||
    c.category === 'liston' ||
    c.category === 'travesaño'
  );
  const amarreFrontal = amarres.find(c => (c.name || '').toLowerCase().includes('front') || (c.name || '').toLowerCase().includes('delant')) || amarres[0];
  const amarrePosterior = amarres.find(c => ((c.name || '').toLowerCase().includes('post') || (c.name || '').toLowerCase().includes('tras')) && c.id !== amarreFrontal?.id) || amarres[1] || amarres[0];

  // Techo / Tapa sólida
  const techo = cuts.find(c => 
    ((c.name || '').toLowerCase().includes('techo') || (c.name || '').toLowerCase().includes('tapa')) && 
    !(c.name || '').toLowerCase().includes('caj') && 
    !amarres.some(a => a.id === c.id)
  );

  const hasAmarres = amarres.length > 0 || (!techo && (
    category === 'gabinete_inferior' || 
    category.includes('inferior') || 
    category.includes('cocina_bajo') || 
    category.includes('vanitory') || 
    category.includes('cajonera')
  ));

  const repisas = cuts.filter(c => (c.name || '').toLowerCase().includes('repisa') || (c.name || '').toLowerCase().includes('entrepaño') || c.category === 'repisa');
  const fondo = cuts.find(c => (c.name || '').toLowerCase().includes('fondo') && !(c.name || '').toLowerCase().includes('caj') && c.category !== 'fondo_cajon');
  const puertas = cuts.filter(c => ((c.name || '').toLowerCase().includes('puerta') || c.category === 'puerta') && !(c.name || '').toLowerCase().includes('caj'));

  // Piezas de Cajón
  const frentesCajon = cuts.filter(c => 
    ((c.name || '').toLowerCase().includes('frente') && ((c.name || '').toLowerCase().includes('caj') || c.category === 'frente_cajon')) || 
    c.category === 'frente_cajon'
  );
  const costadosCajon = cuts.filter(c => 
    ((c.name || '').toLowerCase().includes('costado') || (c.name || '').toLowerCase().includes('lateral') || (c.name || '').toLowerCase().includes('lado')) && 
    ((c.name || '').toLowerCase().includes('caj') || c.category === 'lateral_cajon')
  );
  const contrafrentesCajon = cuts.filter(c => 
    (c.name || '').toLowerCase().includes('contrafrente') || 
    ((c.name || '').toLowerCase().includes('traser') && (c.name || '').toLowerCase().includes('caj')) || 
    c.category === 'trasera_cajon'
  );
  const fondosCajon = cuts.filter(c => 
    (c.name || '').toLowerCase().includes('fondo') && ((c.name || '').toLowerCase().includes('caj') || c.category === 'fondo_cajon')
  );

  const hasDrawers = frentesCajon.length > 0 || costadosCajon.length > 0 || contrafrentesCajon.length > 0 || category.includes('cajon') || category === 'cajonera' || cuts.some(c => (c.name || '').toLowerCase().includes('caj'));
  const drawerCount = Math.max(1, frentesCajon.length || (cuts.some(c => (c.name || '').toLowerCase().includes('caj')) ? 2 : 1));

  const isExploded = mode === 'explotado';
  const offset = isExploded ? 34 : 0;

  // Alturas relativas para correderas de cajón dentro del gabinete
  const slideYPositions = useMemo(() => {
    if (drawerCount === 1) return [130];
    if (drawerCount === 2) return [95, 175];
    if (drawerCount === 3) return [80, 135, 190];
    return [70, 110, 155, 200];
  }, [drawerCount]);

  const svgViewBox = hasDrawers ? "0 0 560 540" : "0 0 540 330";
  const svgMaxHeight = hasDrawers ? "max-h-[500px]" : "max-h-[320px]";

  return (
    <svg viewBox={svgViewBox} className={`w-full h-full ${svgMaxHeight} select-none bg-white`}>
      <defs>
        {/* Glow filter for active selection */}
        <filter id="pieceGlowLight" x="-10%" y="-10%" width="120%" height="120%">
          <feDropShadow dx="0" dy="0" stdDeviation="4" floodColor="#000000" floodOpacity="0.6" />
        </filter>
        <marker id="arrowBlack" markerWidth="6" markerHeight="6" refX="5" refY="3" orient="auto">
          <path d="M 0 0 L 6 3 L 0 6 z" fill="#000000" />
        </marker>
        <marker id="arrowOrange" markerWidth="6" markerHeight="6" refX="5" refY="3" orient="auto">
          <path d="M 0 0 L 6 3 L 0 6 z" fill="#ea580c" />
        </marker>
        <marker id="arrowBlue" markerWidth="6" markerHeight="6" refX="5" refY="3" orient="auto">
          <path d="M 0 0 L 6 3 L 0 6 z" fill="#1d4ed8" />
        </marker>
      </defs>

      {/* Grid de fondo técnico suave para taller */}
      <pattern id="lightGrid" width="20" height="20" patternUnits="userSpaceOnUse">
        <path d="M 20 0 L 0 0 0 20" fill="none" stroke="#e2e8f0" strokeWidth="1" />
      </pattern>
      <rect width="560" height={hasDrawers ? 540 : 330} fill="url(#lightGrid)" />

      {/* ========================================================================= */}
      {/* 1. FONDO MDF 3MM (PÚRPURA / MORADO #7c3aed)                                */}
      {/* ========================================================================= */}
      <g 
        className="cursor-pointer transition-transform"
        onClick={() => fondo && onSelectPiece(fondo.id)}
      >
        <rect
          x={140}
          y={40 - (isExploded ? 25 : 0)}
          width={240}
          height={200}
          fill="#7c3aed"
          fillOpacity={isExploded ? 0.9 : 0.35}
          stroke="#000000"
          strokeWidth={hoveredPieceId === fondo?.id ? 4 : 2.5}
          strokeDasharray={isExploded ? 'none' : '5,3'}
          rx="4"
          filter={hoveredPieceId === fondo?.id ? 'url(#pieceGlowLight)' : undefined}
        />
        {/* Etiqueta de Fondo MDF en caja de alto contraste */}
        <g transform={`translate(260, ${60 - (isExploded ? 25 : 0)})`}>
          <rect x="-85" y="-12" width="170" height="18" fill="#ffffff" stroke="#000000" strokeWidth="1.5" rx="4" />
          <text 
            x="0" 
            y="1" 
            fill="#000000" 
            fontSize="10.5" 
            fontWeight="900" 
            textAnchor="middle"
          >
            Fondo MDF 3mm (Ranura 7mm)
          </text>
        </g>
      </g>

      {/* ========================================================================= */}
      {/* 2. LATERAL IZQUIERDO (AZUL REY #1d4ed8 con borde negro)                   */}
      {/* ========================================================================= */}
      <g 
        className="cursor-pointer"
        onClick={() => lateralIzq && onSelectPiece(lateralIzq.id)}
      >
        <rect
          x={140 - offset}
          y={40}
          width={20}
          height={200}
          fill="#1d4ed8"
          stroke="#000000"
          strokeWidth={hoveredPieceId === lateralIzq?.id ? 4 : 2.5}
          rx="3"
          filter={hoveredPieceId === lateralIzq?.id ? 'url(#pieceGlowLight)' : undefined}
        />
        {/* Ranura visible en lateral posterior */}
        <line
          x1={154 - offset}
          y1={46}
          x2={154 - offset}
          y2={234}
          stroke="#ffffff"
          strokeWidth="3"
          strokeDasharray="4,2"
        />
        {/* Etiqueta Lateral Izquierdo */}
        <g transform={`translate(${130 - offset}, 145)`}>
          <rect x="-85" y="-12" width="80" height="18" fill="#ffffff" stroke="#000000" strokeWidth="1.5" rx="4" />
          <text 
            x="-45" 
            y="1" 
            fill="#000000" 
            fontSize="10" 
            fontWeight="900" 
            textAnchor="middle"
          >
            Lateral Izq
          </text>
        </g>
        {/* Flecha de atornillado Spax */}
        <path d={`M ${105 - offset} 48 L ${135 - offset} 48`} stroke="#000000" strokeWidth="2.5" markerEnd="url(#arrowBlack)" />
        <path d={`M ${105 - offset} 232 L ${135 - offset} 232`} stroke="#000000" strokeWidth="2.5" markerEnd="url(#arrowBlack)" />
      </g>

      {/* ========================================================================= */}
      {/* 3. LATERAL DERECHO (AZUL REY #1d4ed8 con borde negro)                     */}
      {/* ========================================================================= */}
      <g 
        className="cursor-pointer"
        onClick={() => lateralDer && onSelectPiece(lateralDer.id)}
      >
        <rect
          x={360 + offset}
          y={40}
          width={20}
          height={200}
          fill="#1d4ed8"
          stroke="#000000"
          strokeWidth={hoveredPieceId === lateralDer?.id ? 4 : 2.5}
          rx="3"
          filter={hoveredPieceId === lateralDer?.id ? 'url(#pieceGlowLight)' : undefined}
        />
        {/* Ranura visible */}
        <line
          x1={366 + offset}
          y1={46}
          x2={366 + offset}
          y2={234}
          stroke="#ffffff"
          strokeWidth="3"
          strokeDasharray="4,2"
        />
        {/* Etiqueta Lateral Derecho */}
        <g transform={`translate(${385 + offset}, 145)`}>
          <rect x="5" y="-12" width="82" height="18" fill="#ffffff" stroke="#000000" strokeWidth="1.5" rx="4" />
          <text 
            x="46" 
            y="1" 
            fill="#000000" 
            fontSize="10" 
            fontWeight="900" 
            textAnchor="middle"
          >
            Lateral Der
          </text>
        </g>
        {/* Flechas de atornillado */}
        <path d={`M ${415 + offset} 48 L ${385 + offset} 48`} stroke="#000000" strokeWidth="2.5" markerEnd="url(#arrowBlack)" />
        <path d={`M ${415 + offset} 232 L ${385 + offset} 232`} stroke="#000000" strokeWidth="2.5" markerEnd="url(#arrowBlack)" />
      </g>

      {/* ========================================================================= */}
      {/* 4. ESTRUCTURA SUPERIOR: AMARRES (LISTONES) O TECHO COMPLETO                */}
      {/* ========================================================================= */}
      {hasAmarres ? (
        <g>
          {/* AMARRE FRONTAL (Naranja #ea580c) */}
          <g 
            className="cursor-pointer"
            onClick={() => amarreFrontal && onSelectPiece(amarreFrontal.id)}
          >
            <rect
              x={160}
              y={40 - offset - (isExploded ? 10 : 0)}
              width={200}
              height={16}
              fill="#ea580c"
              stroke="#000000"
              strokeWidth={hoveredPieceId === amarreFrontal?.id ? 4 : 2.5}
              rx="3"
              filter={hoveredPieceId === amarreFrontal?.id ? 'url(#pieceGlowLight)' : undefined}
            />
            {/* Etiqueta Amarre Frontal */}
            <g transform={`translate(260, ${28 - offset - (isExploded ? 10 : 0)})`}>
              <rect x="-85" y="-12" width="170" height="18" fill="#ffffff" stroke="#000000" strokeWidth="1.5" rx="4" />
              <text 
                x="0" 
                y="1" 
                fill="#000000" 
                fontSize="9.5" 
                fontWeight="900" 
                textAnchor="middle"
              >
                Amarre / Listón Frontal (Tira Sup.)
              </text>
            </g>
            {/* Flecha de fijación superior hacia cubierta */}
            <path d={`M 260 ${40 - offset - (isExploded ? 10 : 0)} L 260 ${20 - offset - (isExploded ? 10 : 0)}`} stroke="#ea580c" strokeWidth="2.5" markerEnd="url(#arrowOrange)" />
            <text x="260" y={14 - offset - (isExploded ? 10 : 0)} fill="#ea580c" fontSize="8.5" fontWeight="900" textAnchor="middle">
              ▲ Hacia Cubierta
            </text>
          </g>

          {/* AMARRE POSTERIOR (Naranja #ea580c con achurado/profundidad) */}
          <g 
            className="cursor-pointer"
            onClick={() => amarrePosterior && onSelectPiece(amarrePosterior.id)}
          >
            <rect
              x={160}
              y={isExploded ? (40 - offset + 22) : 58}
              width={200}
              height={14}
              fill="#ea580c"
              fillOpacity={isExploded ? 0.95 : 0.75}
              stroke="#000000"
              strokeWidth={hoveredPieceId === amarrePosterior?.id ? 4 : 2.5}
              strokeDasharray={isExploded ? 'none' : '4,2'}
              rx="3"
              filter={hoveredPieceId === amarrePosterior?.id ? 'url(#pieceGlowLight)' : undefined}
            />
            {/* Etiqueta Amarre Posterior */}
            <g transform={`translate(260, ${isExploded ? (40 - offset + 22 + 7) : 65})`}>
              <rect x="-80" y="-8" width="160" height="16" fill="#ffffff" stroke="#000000" strokeWidth="1.2" rx="3" />
              <text 
                x="0" 
                y="3" 
                fill="#000000" 
                fontSize="9" 
                fontWeight="900" 
                textAnchor="middle"
              >
                Amarre Posterior (Fijación Muro)
              </text>
            </g>
          </g>
        </g>
      ) : (
        /* TECHO COMPLETO / TAPA SUPERIOR (NARANJA VIBRANTE #ea580c) */
        <g 
          className="cursor-pointer"
          onClick={() => techo && onSelectPiece(techo.id)}
        >
          <rect
            x={160}
            y={40 - offset}
            width={200}
            height={18}
            fill="#ea580c"
            stroke="#000000"
            strokeWidth={hoveredPieceId === techo?.id ? 4 : 2.5}
            rx="3"
            filter={hoveredPieceId === techo?.id ? 'url(#pieceGlowLight)' : undefined}
          />
          {/* Etiqueta Techo */}
          <g transform={`translate(260, ${30 - offset})`}>
            <rect x="-70" y="-12" width="140" height="18" fill="#ffffff" stroke="#000000" strokeWidth="1.5" rx="4" />
            <text 
              x="0" 
              y="1" 
              fill="#000000" 
              fontSize="10" 
              fontWeight="900" 
              textAnchor="middle"
            >
              Techo / Tapa Superior
            </text>
          </g>
        </g>
      )}

      {/* ========================================================================= */}
      {/* 5. PISO / BASE INFERIOR (NARANJA VIBRANTE #ea580c con borde negro)         */}
      {/* ========================================================================= */}
      <g 
        className="cursor-pointer"
        onClick={() => piso && onSelectPiece(piso.id)}
      >
        <rect
          x={160}
          y={222 + offset}
          width={200}
          height={18}
          fill="#ea580c"
          stroke="#000000"
          strokeWidth={hoveredPieceId === piso?.id ? 4 : 2.5}
          rx="3"
          filter={hoveredPieceId === piso?.id ? 'url(#pieceGlowLight)' : undefined}
        />
        {/* Etiqueta Piso */}
        <g transform={`translate(260, ${258 + offset})`}>
          <rect x="-65" y="-12" width="130" height="18" fill="#ffffff" stroke="#000000" strokeWidth="1.5" rx="4" />
          <text 
            x="0" 
            y="1" 
            fill="#000000" 
            fontSize="10" 
            fontWeight="900" 
            textAnchor="middle"
          >
            Piso / Base Inferior
          </text>
        </g>
      </g>

      {/* ========================================================================= */}
      {/* 6. CORREDERAS TELESCÓPICAS EN COSTADOS INTERIORES (SI LLEVA CAJONES)      */}
      {/* ========================================================================= */}
      {hasDrawers && (
        <g>
          {slideYPositions.map((slideY, idx) => (
            <g key={`slide-${idx}`}>
              {/* Eje / Guía horizontal punteada */}
              <line
                x1={160}
                y1={slideY}
                x2={360}
                y2={slideY}
                stroke="#64748b"
                strokeWidth="1.5"
                strokeDasharray="4,3"
              />

              {/* Riel metálico en lateral Izquierdo interior */}
              <rect
                x={160}
                y={slideY - 4}
                width={45}
                height={8}
                fill="#475569"
                stroke="#000000"
                strokeWidth="1.5"
                rx="1.5"
              />
              <circle cx={168} cy={slideY} r="2" fill="#ffffff" stroke="#000000" strokeWidth="1" />
              <circle cx={195} cy={slideY} r="2" fill="#ffffff" stroke="#000000" strokeWidth="1" />

              {/* Riel metálico en lateral Derecho interior */}
              <rect
                x={315}
                y={slideY - 4}
                width={45}
                height={8}
                fill="#475569"
                stroke="#000000"
                strokeWidth="1.5"
                rx="1.5"
              />
              <circle cx={323} cy={slideY} r="2" fill="#ffffff" stroke="#000000" strokeWidth="1" />
              <circle cx={352} cy={slideY} r="2" fill="#ffffff" stroke="#000000" strokeWidth="1" />

              {/* Caja envolvente simulada del cajón */}
              <rect
                x={172}
                y={slideY - 18}
                width={176}
                height={34}
                fill="#d97706"
                fillOpacity={0.12}
                stroke="#d97706"
                strokeWidth="1.5"
                strokeDasharray="3,2"
                rx="2"
              />
            </g>
          ))}

          {/* Etiqueta de Correderas Telescópicas en el gabinete */}
          <g transform={`translate(260, ${slideYPositions[0] - 24})`}>
            <rect x="-105" y="-9" width="210" height="18" fill="#ffffff" stroke="#000000" strokeWidth="1.5" rx="4" />
            <text 
              x="0" 
              y="3" 
              fill="#000000" 
              fontSize="9" 
              fontWeight="900" 
              textAnchor="middle"
            >
              🔩 Correderas H45 (Eje 37mm • Holgura 12.7mm [1/2″])
            </text>
          </g>
        </g>
      )}

      {/* ========================================================================= */}
      {/* 7. ENTREPAÑOS / REPISAS (VERDE ESMERALDA #059669 con borde negro)         */}
      {/* ========================================================================= */}
      {!hasDrawers && repisas.length > 0 && (
        <g 
          className="cursor-pointer"
          onClick={() => onSelectPiece(repisas[0].id)}
        >
          <rect
            x={162}
            y={130}
            width={196}
            height={16}
            fill="#059669"
            stroke="#000000"
            strokeWidth={hoveredPieceId === repisas[0]?.id ? 4 : 2.5}
            rx="2"
            filter={hoveredPieceId === repisas[0]?.id ? 'url(#pieceGlowLight)' : undefined}
          />
          {/* Pernos soporte en extremos */}
          <circle cx={160} cy={138} r="4" fill="#000000" />
          <circle cx={360} cy={138} r="4" fill="#000000" />
          {/* Etiqueta Repisa */}
          <g transform="translate(260, 138)">
            <rect x="-85" y="-10" width="170" height="18" fill="#ffffff" stroke="#000000" strokeWidth="1.5" rx="4" />
            <text 
              x="0" 
              y="3" 
              fill="#000000" 
              fontSize="9.5" 
              fontWeight="900" 
              textAnchor="middle"
            >
              Entrepaño / Repisa (Pernos Ø5mm)
            </text>
          </g>
        </g>
      )}

      {/* ========================================================================= */}
      {/* 8. PUERTAS BATIENTES (AMARILLO / ÁMBAR #d97706 con borde negro)           */}
      {/* ========================================================================= */}
      {!hasDrawers && puertas.length > 0 && (
        <g 
          className="cursor-pointer"
          onClick={() => onSelectPiece(puertas[0].id)}
        >
          {puertas.length === 1 ? (
            <rect
              x={146}
              y={44}
              width={228}
              height={192}
              fill="#d97706"
              fillOpacity={0.6}
              stroke="#000000"
              strokeWidth={hoveredPieceId === puertas[0]?.id ? 4 : 2.5}
              strokeDasharray="5,3"
              rx="4"
            />
          ) : (
            <>
              {/* Puerta Izq */}
              <rect
                x={144}
                y={44}
                width={112}
                height={192}
                fill="#d97706"
                fillOpacity={0.55}
                stroke="#000000"
                strokeWidth="2.5"
                strokeDasharray="4,3"
                rx="3"
              />
              {/* Puerta Der */}
              <rect
                x={264}
                y={44}
                width={112}
                height={192}
                fill="#d97706"
                fillOpacity={0.55}
                stroke="#000000"
                strokeWidth="2.5"
                strokeDasharray="4,3"
                rx="3"
              />
              {/* Cazoletas Ø35mm con centro */}
              <circle cx={152} cy={70} r="7" fill="#ffffff" stroke="#000000" strokeWidth="2" />
              <circle cx={152} cy={70} r="2" fill="#000000" />
              <circle cx={152} cy={210} r="7" fill="#ffffff" stroke="#000000" strokeWidth="2" />
              <circle cx={152} cy={210} r="2" fill="#000000" />
              <circle cx={368} cy={70} r="7" fill="#ffffff" stroke="#000000" strokeWidth="2" />
              <circle cx={368} cy={70} r="2" fill="#000000" />
              <circle cx={368} cy={210} r="7" fill="#ffffff" stroke="#000000" strokeWidth="2" />
              <circle cx={368} cy={210} r="2" fill="#000000" />
            </>
          )}
          {/* Etiqueta Puertas */}
          <g transform="translate(260, 185)">
            <rect x="-80" y="-12" width="160" height="20" fill="#ffffff" stroke="#000000" strokeWidth="1.5" rx="4" />
            <text 
              x="0" 
              y="2" 
              fill="#000000" 
              fontSize="10" 
              fontWeight="900" 
              textAnchor="middle"
            >
              Puertas (Cazoleta Ø35mm)
            </text>
          </g>
        </g>
      )}

      {/* Escuadra 90° Marker en negro y rojo en el gabinete principal */}
      <g>
        <path d="M 160 220 L 160 204 L 176 204" fill="none" stroke="#dc2626" strokeWidth="2.5" />
        <circle cx={168} cy={212} r="2" fill="#dc2626" />
        <text x={182} y={216} fill="#dc2626" fontSize="10" fontWeight="900">90°</text>
      </g>

      {/* ========================================================================= */}
      {/* 9. VISTA EXPLOSIONADA SECUNDARIA DE CAJÓN (SI EL MUEBLE LLEVA CAJONES)     */}
      {/* ========================================================================= */}
      {hasDrawers && (
        <g transform="translate(0, 275)">
          {/* Separador Técnico y Cabecera de Sección de Cajón */}
          <line x1="20" y1="0" x2="540" y2="0" stroke="#000000" strokeWidth="2.5" strokeDasharray="6,3" />
          
          <g transform="translate(280, 0)">
            <rect x="-155" y="-12" width="310" height="22" fill="#000000" rx="6" />
            <text 
              x="0" 
              y="3" 
              fill="#ffffff" 
              fontSize="10.5" 
              fontWeight="900" 
              textAnchor="middle"
              letterSpacing="0.5"
            >
              💥 DESPIECE Y ARMADO DE CAJÓN (Caja + Frente)
            </text>
          </g>

          {/* Subtítulo y holgura clave */}
          <text x="280" y="24" fill="#000000" fontSize="10" fontWeight="900" textAnchor="middle">
            📏 Holgura corredera: 12.7 mm (1/2″) por lado • Ancho Caja = Ancho Int. - 25.4 mm
          </text>

          {/* A. FRENTE EXTERIOR DEL CAJÓN (ÁMBAR #d97706 - TAPA VISTA) */}
          <g 
            className="cursor-pointer"
            onClick={() => frentesCajon[0] && onSelectPiece(frentesCajon[0].id)}
          >
            <rect
              x={35 - (isExploded ? 15 : 0)}
              y={42}
              width={75}
              height={140}
              fill="#d97706"
              stroke="#000000"
              strokeWidth={hoveredPieceId === frentesCajon[0]?.id ? 4 : 2.5}
              rx="4"
              filter={hoveredPieceId === frentesCajon[0]?.id ? 'url(#pieceGlowLight)' : undefined}
            />
            {/* Jaladera Frontal */}
            <rect x={40 - (isExploded ? 15 : 0)} y={105} width={10} height={18} fill="#000000" rx="3" />
            <circle cx={45 - (isExploded ? 15 : 0)} cy={114} r="2" fill="#ffffff" />
            {/* Etiqueta Frente Exterior */}
            <g transform={`translate(${72 - (isExploded ? 15 : 0)}, 60)`}>
              <rect x="-35" y="-9" width="70" height="30" fill="#ffffff" stroke="#000000" strokeWidth="1.2" rx="3" />
              <text x="0" y="3" fill="#000000" fontSize="8.5" fontWeight="900" textAnchor="middle">Frente</text>
              <text x="0" y="14" fill="#000000" fontSize="8" fontWeight="900" textAnchor="middle">Exterior</text>
            </g>
            {/* Flecha de unión de frente hacia la caja */}
            <path d={`M ${115 - (isExploded ? 15 : 0)} 112 L ${145} 112`} stroke="#000000" strokeWidth="2.5" strokeDasharray="3,2" markerEnd="url(#arrowBlack)" />
            <text x="130" y="104" fill="#000000" fontSize="7.5" fontWeight="900" textAnchor="middle">Tornillos 4×30</text>
          </g>

          {/* B. COSTADO IZQUIERDO DE CAJÓN (AZUL REY #1d4ed8) */}
          <g 
            className="cursor-pointer"
            onClick={() => costadosCajon[0] && onSelectPiece(costadosCajon[0].id)}
          >
            <rect
              x={160 - (isExploded ? 20 : 0)}
              y={55}
              width={14}
              height={125}
              fill="#1d4ed8"
              stroke="#000000"
              strokeWidth={hoveredPieceId === costadosCajon[0]?.id ? 4 : 2.5}
              rx="2"
              filter={hoveredPieceId === costadosCajon[0]?.id ? 'url(#pieceGlowLight)' : undefined}
            />
            {/* Ranura inferior a 12mm de la base */}
            <line
              x1={168 - (isExploded ? 20 : 0)}
              y1={60}
              x2={168 - (isExploded ? 20 : 0)}
              y2={175}
              stroke="#ffffff"
              strokeWidth="2.5"
              strokeDasharray="3,2"
            />
            {/* Corredera exterior en costado izq */}
            <rect x={144 - (isExploded ? 20 : 0)} y={105} width={14} height={26} fill="#475569" stroke="#000000" strokeWidth="1.5" rx="2" />
            {/* Etiqueta Costado Izq */}
            <g transform={`translate(${167 - (isExploded ? 20 : 0)}, 42)`}>
              <rect x="-35" y="-8" width="70" height="15" fill="#ffffff" stroke="#000000" strokeWidth="1.2" rx="3" />
              <text x="0" y="3" fill="#000000" fontSize="8" fontWeight="900" textAnchor="middle">Costado Izq</text>
            </g>
          </g>

          {/* C. COSTADO DERECHO DE CAJÓN (AZUL REY #1d4ed8) */}
          <g 
            className="cursor-pointer"
            onClick={() => (costadosCajon[1] || costadosCajon[0]) && onSelectPiece((costadosCajon[1] || costadosCajon[0]).id)}
          >
            <rect
              x={385 + (isExploded ? 20 : 0)}
              y={55}
              width={14}
              height={125}
              fill="#1d4ed8"
              stroke="#000000"
              strokeWidth={hoveredPieceId === (costadosCajon[1] || costadosCajon[0])?.id ? 4 : 2.5}
              rx="2"
              filter={hoveredPieceId === (costadosCajon[1] || costadosCajon[0])?.id ? 'url(#pieceGlowLight)' : undefined}
            />
            {/* Ranura inferior */}
            <line
              x1={389 + (isExploded ? 20 : 0)}
              y1={60}
              x2={389 + (isExploded ? 20 : 0)}
              y2={175}
              stroke="#ffffff"
              strokeWidth="2.5"
              strokeDasharray="3,2"
            />
            {/* Corredera exterior en costado der */}
            <rect x={401 + (isExploded ? 20 : 0)} y={105} width={14} height={26} fill="#475569" stroke="#000000" strokeWidth="1.5" rx="2" />
            {/* Etiqueta Costado Der */}
            <g transform={`translate(${392 + (isExploded ? 20 : 0)}, 42)`}>
              <rect x="-35" y="-8" width="70" height="15" fill="#ffffff" stroke="#000000" strokeWidth="1.2" rx="3" />
              <text x="0" y="3" fill="#000000" fontSize="8" fontWeight="900" textAnchor="middle">Costado Der</text>
            </g>
          </g>

          {/* D. CONTRAFRENTE DELANTERO (NARANJA #ea580c) */}
          <g 
            className="cursor-pointer"
            onClick={() => contrafrentesCajon[0] && onSelectPiece(contrafrentesCajon[0].id)}
          >
            <rect
              x={176}
              y={55 - (isExploded ? 16 : 0)}
              width={206}
              height={15}
              fill="#ea580c"
              stroke="#000000"
              strokeWidth={hoveredPieceId === contrafrentesCajon[0]?.id ? 4 : 2.5}
              rx="2"
              filter={hoveredPieceId === contrafrentesCajon[0]?.id ? 'url(#pieceGlowLight)' : undefined}
            />
            <g transform={`translate(280, ${55 - (isExploded ? 16 : 0) + 7})`}>
              <rect x="-60" y="-7" width="120" height="14" fill="#ffffff" stroke="#000000" strokeWidth="1" rx="3" />
              <text x="0" y="3" fill="#000000" fontSize="8" fontWeight="900" textAnchor="middle">Contrafrente Delantero</text>
            </g>
          </g>

          {/* E. CONTRAFRENTE TRASERO (NARANJA #ea580c) */}
          <g 
            className="cursor-pointer"
            onClick={() => (contrafrentesCajon[1] || contrafrentesCajon[0]) && onSelectPiece((contrafrentesCajon[1] || contrafrentesCajon[0]).id)}
          >
            <rect
              x={176}
              y={165 + (isExploded ? 16 : 0)}
              width={206}
              height={15}
              fill="#ea580c"
              stroke="#000000"
              strokeWidth={hoveredPieceId === (contrafrentesCajon[1] || contrafrentesCajon[0])?.id ? 4 : 2.5}
              rx="2"
              filter={hoveredPieceId === (contrafrentesCajon[1] || contrafrentesCajon[0])?.id ? 'url(#pieceGlowLight)' : undefined}
            />
            <g transform={`translate(280, ${165 + (isExploded ? 16 : 0) + 7})`}>
              <rect x="-55" y="-7" width="110" height="14" fill="#ffffff" stroke="#000000" strokeWidth="1" rx="3" />
              <text x="0" y="3" fill="#000000" fontSize="8" fontWeight="900" textAnchor="middle">Contrafrente Trasero</text>
            </g>
          </g>

          {/* F. FONDO DE CAJÓN MDF 3MM (PÚRPURA #7c3aed) */}
          <g 
            className="cursor-pointer"
            onClick={() => fondosCajon[0] && onSelectPiece(fondosCajon[0].id)}
          >
            <rect
              x={174}
              y={72}
              width={210}
              height={90}
              fill="#7c3aed"
              fillOpacity={isExploded ? 0.85 : 0.4}
              stroke="#000000"
              strokeWidth={hoveredPieceId === fondosCajon[0]?.id ? 4 : 2.5}
              strokeDasharray={isExploded ? 'none' : '4,2'}
              rx="3"
              filter={hoveredPieceId === fondosCajon[0]?.id ? 'url(#pieceGlowLight)' : undefined}
            />
            <g transform="translate(280, 117)">
              <rect x="-85" y="-9" width="170" height="18" fill="#ffffff" stroke="#000000" strokeWidth="1.5" rx="4" />
              <text x="0" y="3" fill="#000000" fontSize="9" fontWeight="900" textAnchor="middle">
                Fondo MDF 3mm (Ranura a 12mm)
              </text>
            </g>
          </g>

          {/* Cotas de holgura de correderas */}
          <g transform="translate(280, 205)">
            <text x="0" y="0" fill="#000000" fontSize="9.5" fontWeight="900" textAnchor="middle">
              🔩 Spax 3.5×35mm para caja • Tornillos 4×30mm fijan frente desde interior • Ranura prof. 6mm
            </text>
          </g>
        </g>
      )}

      {/* Indicador de Canto Frontal en texto negro */}
      <text x={260} y={hasDrawers ? 525 : 312} fill="#000000" fontSize="11" fontWeight="900" textAnchor="middle">
        🟢 Cantos frontales canteados • Cara frontal hacia el instalador
      </text>

    </svg>
  );
};
