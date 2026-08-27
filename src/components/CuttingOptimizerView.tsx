import React, { useState, useMemo, useEffect } from 'react';
import { 
  WoodCut, 
  CuttingConfig, 
  PrimaryCutDirection, 
  OptimizationResult, 
  OffcutItem, 
  PlacedPiece, 
  StripCuttingStep, 
  IndividualPieceCut,
  FenceGroupedStep
} from '../types';
import { optimizeCuttingLayout } from '../utils/cuttingOptimizer';
import { speakCutDetails } from '../utils/cutCalculator';
import { 
  getProjectCutPieces, 
  saveProjectCutPieces, 
  getProjectCutStrips, 
  saveProjectCutStrips, 
  getProjectCutOffcuts, 
  saveProjectCutOffcuts,
  resetProjectProductionProgress 
} from '../utils/productionProgress';
import { PdfPreviewModal } from './PdfPreviewModal';
import { 
  ArrowLeft, Sliders, Ruler, Layers, 
  Volume2, Printer, Check, Save, 
  RotateCw, ArrowRightLeft, CheckCircle, Award,
  X, Scissors, Play, CheckCircle2, Clock,
  FileText, Download, Loader2, Eye, Box,
  Layers2, Package, Sparkles, Lightbulb,
  Warehouse, MapPin, RotateCcw, AlertTriangle,
  ClipboardList
} from 'lucide-react';

// Palette definition for Furniture Color Coding
export interface FurniturePalette {
  id: string;
  fill: string;
  fillHover: string;
  stroke: string;
  badgeBg: string;
  badgeText: string;
  textColor: string;
  lightBg: string;
  accentDot: string;
  name: string;
}

export const FURNITURE_PALETTES: FurniturePalette[] = [
  {
    id: 'green',
    fill: '#dcfce7', // emerald-100
    fillHover: '#bbf7d0',
    stroke: '#16a34a', // emerald-600
    badgeBg: '#15803d', // emerald-700
    badgeText: '#ffffff',
    textColor: '#14532d',
    lightBg: 'bg-emerald-100 text-emerald-950 border-emerald-400',
    accentDot: 'bg-emerald-500',
    name: 'Verde Taller'
  },
  {
    id: 'orange',
    fill: '#ffedd5', // orange-100
    fillHover: '#fed7aa',
    stroke: '#ea580c', // orange-600
    badgeBg: '#c2410c', // orange-700
    badgeText: '#ffffff',
    textColor: '#7c2d12',
    lightBg: 'bg-orange-100 text-orange-950 border-orange-400',
    accentDot: 'bg-orange-500',
    name: 'Naranja Cálido'
  },
  {
    id: 'blue',
    fill: '#e0e7ff', // indigo-100
    fillHover: '#c7d2fe',
    stroke: '#4f46e5', // indigo-600
    badgeBg: '#3730a3', // indigo-700
    badgeText: '#ffffff',
    textColor: '#312e81',
    lightBg: 'bg-indigo-100 text-indigo-950 border-indigo-400',
    accentDot: 'bg-indigo-500',
    name: 'Azul Índigo'
  },
  {
    id: 'pink',
    fill: '#fce7f3', // pink-100
    fillHover: '#fbcfe8',
    stroke: '#db2777', // pink-600
    badgeBg: '#9d174d', // pink-700
    badgeText: '#ffffff',
    textColor: '#831843',
    lightBg: 'bg-pink-100 text-pink-950 border-pink-400',
    accentDot: 'bg-pink-500',
    name: 'Rosa Magenta'
  },
  {
    id: 'teal',
    fill: '#ccfbf1', // teal-100
    fillHover: '#99f6e4',
    stroke: '#0d9488', // teal-600
    badgeBg: '#115e59', // teal-700
    badgeText: '#ffffff',
    textColor: '#134e4a',
    lightBg: 'bg-teal-100 text-teal-950 border-teal-400',
    accentDot: 'bg-teal-500',
    name: 'Turquesa'
  },
  {
    id: 'purple',
    fill: '#f3e8ff', // purple-100
    fillHover: '#e9d5ff',
    stroke: '#9333ea', // purple-600
    badgeBg: '#6b21a8', // purple-700
    badgeText: '#ffffff',
    textColor: '#581c87',
    lightBg: 'bg-purple-100 text-purple-950 border-purple-400',
    accentDot: 'bg-purple-500',
    name: 'Púrpura'
  },
  {
    id: 'yellow',
    fill: '#fef9c3', // yellow-100
    fillHover: '#fef08a',
    stroke: '#ca8a04', // yellow-600
    badgeBg: '#854d0e', // yellow-700
    badgeText: '#ffffff',
    textColor: '#713f12',
    lightBg: 'bg-yellow-100 text-yellow-950 border-yellow-400',
    accentDot: 'bg-yellow-500',
    name: 'Ámbar Sol'
  },
  {
    id: 'cyan',
    fill: '#e0f2fe', // sky-100
    fillHover: '#bae6fd',
    stroke: '#0284c7', // sky-600
    badgeBg: '#0369a1', // sky-700
    badgeText: '#ffffff',
    textColor: '#0c4a6e',
    lightBg: 'bg-sky-100 text-sky-950 border-sky-400',
    accentDot: 'bg-sky-500',
    name: 'Celeste'
  }
];

export interface MaterialGroup {
  key: string;
  materialType: string;
  thicknessMm: number;
  displayName: string;
  cuts: WoodCut[];
  totalPieces: number;
}

interface MaterialConfigState {
  primaryCutDirection: PrimaryCutDirection;
  sheetLengthCm: number;
  sheetWidthCm: number;
  sawKerfMm: number;
  allowRotation: boolean;
  trimMarginCm: number;
}

interface CuttingOptimizerViewProps {
  cuts: WoodCut[];
  projectName: string;
  projectId?: string;
  materialType: string;
  thicknessMm: number;
  offcuts?: OffcutItem[];
  onUpdateOffcut?: (offcut: OffcutItem) => void;
  onUpdateOffcutStatus?: (id: string, status: 'disponible' | 'reservado' | 'usado') => void;
  onDeleteOffcut?: (id: string) => void;
  onBackToProject: () => void;
  onSaveOffcut?: (offcut: OffcutItem) => void;
  onNavigateToAssembly?: () => void;
  onResetProjectProgress?: (projectId: string) => void;
}

export interface AssignedOffcutData {
  pieceId: string;
  pieceName: string;
  furnitureName: string;
  offcutId: string;
  offcutNumber: number;
  offcutLabel: string;
  materialType: string;
  thicknessMm: number;
  originalLengthCm: number;
  originalWidthCm: number;
  usedLengthCm: number;
  usedWidthCm: number;
  remainingLengthCm: number;
  remainingWidthCm: number;
  cutDirection?: 'longitudinal' | 'transversal';
  action: 'save_remaining' | 'discard_remaining';
  date: string;
}

export interface RemnantCutStrategy {
  id: 'longitudinal' | 'transversal';
  name: string;
  description: string;
  primaryL: number;
  primaryW: number;
  secondaryL: number;
  secondaryW: number;
  primaryArea: number;
  isRecommended: boolean;
}

/**
 * Matemática de corte realista para retazos:
 * Calcula el sobrante remanente rectangular continuo según el sentido de corte de la sierra
 * (Corte a lo largo/longitudinal vs Corte a lo ancho/transversal).
 */
export function computeRealisticRemnants(
  offcutLength: number,
  offcutWidth: number,
  pieceLength: number,
  pieceWidth: number
): {
  longitudinal: RemnantCutStrategy;
  transversal: RemnantCutStrategy;
  recommended: RemnantCutStrategy;
} {
  const offL = Number(offcutLength) || 0;
  const offW = Number(offcutWidth) || 0;
  const pL = Number(pieceLength) || 0;
  const pW = Number(pieceWidth) || 0;

  // 1. Corte Longitudinal (Rip Cut a lo largo del retazo: disco corre todo offL a distancia pW)
  // El retazo remanente principal corre todo el largo offL y tiene ancho (offW - pW)
  const longPrimaryL = Number(offL.toFixed(1));
  const longPrimaryW = Math.max(0, Number((offW - pW).toFixed(1)));
  const longSecondaryL = Math.max(0, Number((offL - pL).toFixed(1)));
  const longSecondaryW = Number(pW.toFixed(1));
  const longArea = Number((longPrimaryL * longPrimaryW).toFixed(1));

  // 2. Corte Transversal (Cross Cut a lo ancho del retazo: disco corre todo offW a distancia pL)
  // El retazo remanente principal tiene largo (offL - pL) y ancho offW
  const transPrimaryL = Math.max(0, Number((offL - pL).toFixed(1)));
  const transPrimaryW = Number(offW.toFixed(1));
  const transSecondaryL = Number(pL.toFixed(1));
  const transSecondaryW = Math.max(0, Number((offW - pW).toFixed(1)));
  const transArea = Number((transPrimaryL * transPrimaryW).toFixed(1));

  const isLongitudinalBetter = longArea >= transArea;

  const longitudinal: RemnantCutStrategy = {
    id: 'longitudinal',
    name: 'Corte a lo largo (Longitudinal)',
    description: `Corte continuo por el lado de ${offL} cm. Sobrante principal útil: ${longPrimaryL} × ${longPrimaryW} cm (${longArea} cm²).`,
    primaryL: longPrimaryL,
    primaryW: longPrimaryW,
    secondaryL: longSecondaryL,
    secondaryW: longSecondaryW,
    primaryArea: longArea,
    isRecommended: isLongitudinalBetter
  };

  const transversal: RemnantCutStrategy = {
    id: 'transversal',
    name: 'Corte a lo ancho (Transversal)',
    description: `Corte continuo por el lado de ${offW} cm. Sobrante principal útil: ${transPrimaryL} × ${transPrimaryW} cm (${transArea} cm²).`,
    primaryL: transPrimaryL,
    primaryW: transPrimaryW,
    secondaryL: transSecondaryL,
    secondaryW: transSecondaryW,
    primaryArea: transArea,
    isRecommended: !isLongitudinalBetter
  };

  return {
    longitudinal,
    transversal,
    recommended: isLongitudinalBetter ? longitudinal : transversal
  };
}

export interface AssignModalState {
  offcut: OffcutItem;
  offcutNumber: number;
  offcutLabel: string;
  cut: WoodCut;
  fitsDirect: boolean;
  fitsRotated: boolean;
  usedL: number;
  usedW: number;
  strategies: {
    longitudinal: RemnantCutStrategy;
    transversal: RemnantCutStrategy;
    recommended: RemnantCutStrategy;
  };
  selectedStrategyId: 'longitudinal' | 'transversal';
  remainingL: number;
  remainingW: number;
  selectedAction: 'save_remaining' | 'discard_remaining';
}

/**
 * Helper to reliably resolve material and thickness for each piece in a project
 */
export function resolveCutMaterial(cut: WoodCut, defaultMat: string, defaultThick: number): { material: string; thickness: number } {
  if (cut.materialType && cut.thicknessMm) {
    return { material: cut.materialType, thickness: cut.thicknessMm };
  }
  if (cut.notes) {
    const matMatch = cut.notes.match(/Material:\s*([^•\n,]+)/i);
    if (matMatch && matMatch[1].trim()) {
      const extractedMat = matMatch[1].trim();
      const is3mm = cut.category === 'fondo' || cut.category === 'fondo_cajon' || extractedMat.toLowerCase().includes('3mm') || cut.name.toLowerCase().includes('3mm');
      return { material: extractedMat, thickness: is3mm ? 3 : (cut.thicknessMm || defaultThick) };
    }
  }
  if (cut.category === 'fondo' || cut.category === 'fondo_cajon' || cut.name.toLowerCase().includes('fondo') || cut.name.toLowerCase().includes('3mm')) {
    return { material: 'MDF 3mm Blanco', thickness: 3 };
  }
  return {
    material: cut.materialType || defaultMat || 'Melamina 15mm',
    thickness: cut.thicknessMm || defaultThick || 15
  };
}

export const CuttingOptimizerView: React.FC<CuttingOptimizerViewProps> = ({
  cuts: initialCuts,
  projectName,
  projectId = '',
  materialType: defaultMaterialType,
  thicknessMm: defaultThicknessMm,
  offcuts: initialOffcuts,
  onUpdateOffcut,
  onUpdateOffcutStatus,
  onDeleteOffcut,
  onBackToProject,
  onSaveOffcut,
  onNavigateToAssembly,
  onResetProjectProgress
}) => {
  // Effective Project ID Key for persistence
  const effectiveProjId = projectId || projectName || 'default_proj';
  // Current Stage: 'config' (Pantalla de parámetros) | 'result' (Mapa y Guía de corte)
  const [currentStage, setCurrentStage] = useState<'config' | 'result'>('config');

  // Manual cuts override list (e.g. rotation overrides or board transfers)
  const [localCuts, setLocalCuts] = useState<WoodCut[]>(initialCuts);

  // Sync initial cuts
  useEffect(() => {
    setLocalCuts(initialCuts);
  }, [initialCuts]);

  // =========================================================================
  // ALMACÉN DE PEDACERÍA / RETAZOS DISPONIBLES EN TALLER
  // =========================================================================
  const [warehouseOffcuts, setWarehouseOffcuts] = useState<OffcutItem[]>(() => {
    if (initialOffcuts && initialOffcuts.length > 0) return initialOffcuts;
    const saved = localStorage.getItem('carpinteria_offcuts');
    return saved ? JSON.parse(saved) : [];
  });

  useEffect(() => {
    if (initialOffcuts) {
      setWarehouseOffcuts(initialOffcuts);
    }
  }, [initialOffcuts]);

  useEffect(() => {
    const handleStorageChange = () => {
      const saved = localStorage.getItem('carpinteria_offcuts');
      if (saved) {
        setWarehouseOffcuts(JSON.parse(saved));
      }
    };
    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  // Retazos asignados en la sesión del proyecto actual
  const [assignedOffcuts, setAssignedOffcuts] = useState<Record<string, AssignedOffcutData>>(() => {
    try {
      const saved = localStorage.getItem(`carpinteria_assigned_offcuts_${projectName}`);
      if (saved) return JSON.parse(saved);
      const globalSaved = localStorage.getItem('carpinteria_assigned_offcuts');
      return globalSaved ? JSON.parse(globalSaved) : {};
    } catch (e) {
      return {};
    }
  });

  const saveAssignedOffcuts = (map: Record<string, AssignedOffcutData>) => {
    setAssignedOffcuts(map);
    try {
      localStorage.setItem(`carpinteria_assigned_offcuts_${projectName}`, JSON.stringify(map));
      localStorage.setItem('carpinteria_assigned_offcuts', JSON.stringify(map));
    } catch (e) {
      console.error(e);
    }
  };

  // Estado del Modal de Asignación Individual y Decisión de Sobrante
  const [assignModalData, setAssignModalData] = useState<AssignModalState | null>(null);

  // =========================================================================
  // 1. MATERIAL & THICKNESS GROUPING ENGINE (REQUERIMIENTO 1)
  // Quita las piezas asignadas a retazos del plano 2D de tableros nuevos para ahorrar compras
  // =========================================================================
  const materialGroups: MaterialGroup[] = useMemo(() => {
    const map = new Map<string, { materialType: string; thicknessMm: number; cuts: WoodCut[] }>();
    
    // Contar cuántas piezas están asignadas a retazos
    const assignedCountsByPieceId = Object.values(assignedOffcuts).reduce((acc, curr: any) => {
      if (curr && curr.pieceId) {
        acc[curr.pieceId] = (acc[curr.pieceId] || 0) + 1;
      }
      return acc;
    }, {} as Record<string, number>);

    localCuts.forEach(cut => {
      const { material, thickness } = resolveCutMaterial(cut, defaultMaterialType, defaultThicknessMm);
      const key = `${material}__${thickness}`;
      if (!map.has(key)) {
        map.set(key, { materialType: material, thicknessMm: thickness, cuts: [] });
      }

      const assignedCount = assignedCountsByPieceId[cut.id] || 0;
      const remainingQty = Math.max(0, (cut.quantity || 1) - assignedCount);

      if (remainingQty > 0) {
        map.get(key)!.cuts.push({
          ...cut,
          quantity: remainingQty,
          materialType: material,
          thicknessMm: thickness
        });
      }
    });

    if (map.size === 0) {
      const key = `${defaultMaterialType}__${defaultThicknessMm}`;
      map.set(key, { materialType: defaultMaterialType, thicknessMm: defaultThicknessMm, cuts: [] });
    }

    return Array.from(map.entries()).map(([key, data]) => {
      const totalPieces = data.cuts.reduce((sum, c) => sum + (c.quantity || 1), 0);
      return {
        key,
        materialType: data.materialType,
        thicknessMm: data.thicknessMm,
        displayName: `${data.materialType} (${data.thicknessMm} mm)`,
        cuts: data.cuts,
        totalPieces
      };
    });
  }, [localCuts, defaultMaterialType, defaultThicknessMm, assignedOffcuts]);

  // Selected Material Tab Key (REQUERIMIENTO 2)
  const [selectedMaterialKey, setSelectedMaterialKey] = useState<string>('');

  // Active Material Group
  const activeGroup = useMemo<MaterialGroup>(() => {
    return materialGroups.find(g => g.key === selectedMaterialKey) || materialGroups[0] || {
      key: `${defaultMaterialType}__${defaultThicknessMm}`,
      materialType: defaultMaterialType,
      thicknessMm: defaultThicknessMm,
      displayName: `${defaultMaterialType} (${defaultThicknessMm} mm)`,
      cuts: [],
      totalPieces: 0
    };
  }, [materialGroups, selectedMaterialKey, defaultMaterialType, defaultThicknessMm]);

  // Ensure selectedMaterialKey is valid
  useEffect(() => {
    if (!materialGroups.some(g => g.key === selectedMaterialKey)) {
      if (materialGroups.length > 0) {
        setSelectedMaterialKey(materialGroups[0].key);
      }
    }
  }, [materialGroups, selectedMaterialKey]);

  // Per-Material Configuration State (remembers settings per material)
  const [materialConfigs, setMaterialConfigs] = useState<Record<string, MaterialConfigState>>({});

  // Active Material Config
  const activeConfig = useMemo<CuttingConfig>(() => {
    const custom = materialConfigs[activeGroup.key] || {
      primaryCutDirection: 'largo',
      sheetLengthCm: 244,
      sheetWidthCm: 122,
      sawKerfMm: 3,
      allowRotation: true,
      trimMarginCm: 0
    };
    return {
      ...custom,
      materialType: activeGroup.materialType,
      thicknessMm: activeGroup.thicknessMm
    };
  }, [materialConfigs, activeGroup]);

  // Helper to update active material config
  const updateActiveConfig = (patch: Partial<MaterialConfigState>) => {
    setMaterialConfigs(prev => ({
      ...prev,
      [activeGroup.key]: {
        primaryCutDirection: activeConfig.primaryCutDirection,
        sheetLengthCm: activeConfig.sheetLengthCm,
        sheetWidthCm: activeConfig.sheetWidthCm,
        sawKerfMm: activeConfig.sawKerfMm,
        allowRotation: activeConfig.allowRotation,
        trimMarginCm: activeConfig.trimMarginCm,
        ...prev[activeGroup.key],
        ...patch
      }
    }));
  };

  // =========================================================================
  // INDEPENDENT OPTIMIZATION FOR ALL MATERIAL GROUPS
  // =========================================================================
  const materialOptimizations = useMemo<Record<string, OptimizationResult>>(() => {
    const res: Record<string, OptimizationResult> = {};
    materialGroups.forEach(grp => {
      const cfg = materialConfigs[grp.key] || {
        primaryCutDirection: 'largo',
        sheetLengthCm: 244,
        sheetWidthCm: 122,
        sawKerfMm: 3,
        allowRotation: true,
        trimMarginCm: 0
      };
      res[grp.key] = optimizeCuttingLayout(grp.cuts, {
        ...cfg,
        materialType: grp.materialType,
        thicknessMm: grp.thicknessMm
      });
    });
    return res;
  }, [materialGroups, materialConfigs]);

  // Active Optimization Result (Strictly for the active material tab)
  const activeOptimizationResult: OptimizationResult = useMemo(() => {
    return materialOptimizations[activeGroup.key] || optimizeCuttingLayout(activeGroup.cuts, activeConfig);
  }, [materialOptimizations, activeGroup, activeConfig]);

  // =========================================================================
  // REQUERIMIENTO 3: INDICADOR Y RESUMEN DE HOJAS TOTALES DEL PROYECTO
  // =========================================================================
  const globalSummary = useMemo(() => {
    let grandTotalSheets = 0;
    let grandTotalPieces = 0;
    let grandTotalPlaced = 0;
    let grandTotalLinearCutM = 0;

    const materialsList = materialGroups.map(grp => {
      const opt = materialOptimizations[grp.key];
      const sheets = opt ? opt.totalSheets : 0;
      const pieces = grp.totalPieces;
      const efficiency = opt ? opt.overallEfficiencyPercent : 0;
      const cfg = materialConfigs[grp.key] || { sheetLengthCm: 244, sheetWidthCm: 122 };

      grandTotalSheets += sheets;
      grandTotalPieces += pieces;
      if (opt) {
        grandTotalPlaced += opt.totalPlacedPieces;
        grandTotalLinearCutM += opt.totalLinearCutMeters;
      }

      return {
        key: grp.key,
        materialType: grp.materialType,
        thicknessMm: grp.thicknessMm,
        displayName: grp.displayName,
        sheets,
        pieces,
        efficiency,
        sheetLengthCm: cfg.sheetLengthCm || 244,
        sheetWidthCm: cfg.sheetWidthCm || 122
      };
    });

    return {
      grandTotalSheets,
      grandTotalPieces,
      grandTotalPlaced,
      grandTotalLinearCutM: Number(grandTotalLinearCutM.toFixed(1)),
      materialsList
    };
  }, [materialGroups, materialOptimizations, materialConfigs]);

  // Active Board in results viewer
  const [selectedBoardIndex, setSelectedBoardIndex] = useState<number>(1);

  // Reset selected board if out of range on material switch
  useEffect(() => {
    if (selectedBoardIndex > activeOptimizationResult.totalSheets) {
      setSelectedBoardIndex(1);
    }
  }, [activeOptimizationResult.totalSheets, selectedBoardIndex]);

  // Selected piece in 2D layout for inspections / manual adjustments
  const [selectedPieceId, setSelectedPieceId] = useState<string | null>(null);

  // 1. FASE A: Tiras cortadas (stripId -> boolean) - Persistente por proyecto
  const [cutStripIds, setCutStripIds] = useState<Record<string, boolean>>(() => {
    return getProjectCutStrips(effectiveProjId);
  });

  // 2. FASE B: Piezas individuales cortadas a lo ancho (placedPieceId -> boolean) - Persistente por proyecto
  const [cutPieceIds, setCutPieceIds] = useState<Record<string, boolean>>(() => {
    return getProjectCutPieces(effectiveProjId);
  });

  // 3. PASO 1 PRIORITARIO: Piezas cortadas de Pedacería / Retazos de Almacén - Persistente por proyecto
  const [cutOffcutPieceIds, setCutOffcutPieceIds] = useState<Record<string, boolean>>(() => {
    return getProjectCutOffcuts(effectiveProjId);
  });

  // Sincronizar estado si cambia el proyecto activo
  useEffect(() => {
    setCutStripIds(getProjectCutStrips(effectiveProjId));
    setCutPieceIds(getProjectCutPieces(effectiveProjId));
    setCutOffcutPieceIds(getProjectCutOffcuts(effectiveProjId));
  }, [effectiveProjId]);

  const toggleCutOffcutPiece = (offcutId: string) => {
    setCutOffcutPieceIds(prev => {
      const next = { ...prev, [offcutId]: !prev[offcutId] };
      saveProjectCutOffcuts(effectiveProjId, next);
      return next;
    });
  };

  // Switch to manually unlock/bypass step 2 gating if desired
  const [bypassOffcutsLock, setBypassOffcutsLock] = useState<boolean>(false);

  // Toast / notification banner for saved offcut
  const [savedOffcutToast, setSavedOffcutToast] = useState<{ show: boolean; msg: string }>({ show: false, msg: '' });

  // Furniture completion notification banner
  const [completedFurnitureToast, setCompletedFurnitureToast] = useState<string | null>(null);

  // Set of celebrated furniture names
  const [celebratedFurnitureNames, setCelebratedFurnitureNames] = useState<string[]>([]);

  // In-App PDF Preview Modal State
  const [pdfPreviewModalMode, setPdfPreviewModalMode] = useState<'planos' | 'guia' | null>(null);

  // Master Strip Steps & Fence Grouped Steps for the active material
  const masterStripSteps: StripCuttingStep[] = activeOptimizationResult.masterStripSteps;
  const fenceGroupedSteps: FenceGroupedStep[] = activeOptimizationResult.fenceGroupedSteps || [];

  // Active Board
  const activeBoard = activeOptimizationResult.boards.find(b => b.boardIndex === selectedBoardIndex) || activeOptimizationResult.boards[0];

  // All placed pieces across boards of current material
  const allPlacedPieces: PlacedPiece[] = useMemo(() => {
    return activeOptimizationResult.boards.flatMap(b => b.placedPieces);
  }, [activeOptimizationResult.boards]);

  // Map piece ID to its Strip Step information
  const pieceToStepMap = useMemo(() => {
    const map = new Map<string, { step: StripCuttingStep; individualCut?: IndividualPieceCut }>();
    masterStripSteps.forEach(step => {
      step.individualCuts.forEach(c => {
        map.set(c.placedPieceId, { step, individualCut: c });
      });
    });
    return map;
  }, [masterStripSteps]);

  // Selected piece object
  const selectedPiece = useMemo(() => {
    if (!selectedPieceId) return null;
    return allPlacedPieces.find(p => p.id === selectedPieceId) || null;
  }, [selectedPieceId, allPlacedPieces]);

  // Total pieces progress calculation for current material (Fase B)
  const totalPiecesCount = allPlacedPieces.length;
  const cutPiecesCount = allPlacedPieces.filter(p => cutPieceIds[p.id]).length;
  const progressPercent = totalPiecesCount > 0 ? Math.round((cutPiecesCount / totalPiecesCount) * 100) : 0;

  // Track completion of pieces by furniture
  const furnitureProgress = useMemo<Record<string, { total: number; cut: number }>>(() => {
    const map: Record<string, { total: number; cut: number }> = {};
    allPlacedPieces.forEach(p => {
      const fName = p.furnitureName || 'Mueble General';
      if (!map[fName]) map[fName] = { total: 0, cut: 0 };
      map[fName].total++;
      if (cutPieceIds[p.id]) {
        map[fName].cut++;
      }
    });
    return map;
  }, [allPlacedPieces, cutPieceIds]);

  // Map unique furniture names to distinct, fixed color palettes
  const furnitureColorMap = useMemo<Record<string, FurniturePalette>>(() => {
    const uniqueNames: string[] = [];
    localCuts.forEach(c => {
      const fName = c.furnitureName || 'Mueble General';
      if (!uniqueNames.includes(fName)) uniqueNames.push(fName);
    });

    const map: Record<string, FurniturePalette> = {};
    uniqueNames.forEach((name, idx) => {
      map[name] = FURNITURE_PALETTES[idx % FURNITURE_PALETTES.length];
    });
    return map;
  }, [localCuts]);

  // Check if any furniture just reached 100%
  const celebratedSetRef = React.useRef<Set<string>>(new Set());

  useEffect(() => {
    (Object.entries(furnitureProgress) as [string, { total: number; cut: number }][]).forEach(([fName, stat]) => {
      const isComplete = stat.total > 0 && stat.cut === stat.total;
      
      if (isComplete && !celebratedSetRef.current.has(fName)) {
        celebratedSetRef.current.add(fName);
        setCompletedFurnitureToast(fName);
      } else if (!isComplete && celebratedSetRef.current.has(fName)) {
        celebratedSetRef.current.delete(fName);
      }
    });
  }, [furnitureProgress]);

  // Auto-dismiss completed furniture toast after 6 seconds
  useEffect(() => {
    if (completedFurnitureToast) {
      const timer = setTimeout(() => {
        setCompletedFurnitureToast(null);
      }, 6000);
      return () => clearTimeout(timer);
    }
  }, [completedFurnitureToast]);

  // Workshop Voice readout
  const speakStep = (text: string) => {
    speakCutDetails(text);
  };

  // Toggle Strip Cut status (Fase A)
  const toggleStripCut = (stripId: string) => {
    setCutStripIds(prev => {
      const next = {
        ...prev,
        [stripId]: !prev[stripId]
      };
      saveProjectCutStrips(effectiveProjId, next);
      return next;
    });
  };

  // Toggle Individual Piece Cut status (Fase B)
  const togglePieceCut = (pieceId: string, parentStripId?: string) => {
    setCutPieceIds(prev => {
      const nextStatus = !prev[pieceId];
      if (nextStatus && parentStripId) {
        setCutStripIds(sPrev => {
          const sNext = { ...sPrev, [parentStripId]: true };
          saveProjectCutStrips(effectiveProjId, sNext);
          return sNext;
        });
      }
      const next = {
        ...prev,
        [pieceId]: nextStatus
      };
      saveProjectCutPieces(effectiveProjId, next);
      return next;
    });
  };

  // Toggle all pieces in a strip
  const toggleAllPiecesInStrip = (step: StripCuttingStep) => {
    const allCurrentlyCut = step.individualCuts.every(c => cutPieceIds[c.placedPieceId]);
    const newStatus = !allCurrentlyCut;

    setCutStripIds(prev => {
      const sNext = { ...prev, [step.stripId]: true };
      saveProjectCutStrips(effectiveProjId, sNext);
      return sNext;
    });

    setCutPieceIds(prev => {
      const next = { ...prev };
      step.individualCuts.forEach(c => {
        next[c.placedPieceId] = newStatus;
      });
      saveProjectCutPieces(effectiveProjId, next);
      return next;
    });
  };

  // Reset production progress for this project
  const handleResetProductionProgress = () => {
    const confirmReset = window.confirm(
      `¿Deseas reiniciar todo el progreso de producción (cortes marcados, retazos y canteado) del proyecto "${projectName}"? Esta acción desmarcará las piezas para volver a empezar desde cero.`
    );
    if (!confirmReset) return;

    resetProjectProductionProgress(effectiveProjId);
    setCutStripIds({});
    setCutPieceIds({});
    setCutOffcutPieceIds({});
    if (onResetProjectProgress && projectId) {
      onResetProjectProgress(projectId);
    }
    speakCutDetails(`Progreso de producción reiniciado para ${projectName}. Todas las piezas están listas para cortar.`);
  };

  // Manual rotation of a piece (swap length and width in local cuts)
  const handleRotateSelectedPiece = () => {
    if (!selectedPiece) return;
    setLocalCuts(prev => prev.map(c => {
      if (c.id === selectedPiece.pieceId) {
        return {
          ...c,
          lengthCm: c.widthCm,
          widthCm: c.lengthCm
        };
      }
      return c;
    }));
  };

  // Move piece to change packing priority
  const handleReorderPiece = () => {
    if (!selectedPiece) return;
    setLocalCuts(prev => {
      const idx = prev.findIndex(c => c.id === selectedPiece.pieceId);
      if (idx === -1) return prev;
      const copy = [...prev];
      const [item] = copy.splice(idx, 1);
      copy.unshift(item);
      return copy;
    });
  };

  // Save offcut to inventory
  const handleSaveOffcutToInventory = (length: number, width: number) => {
    if (onSaveOffcut) {
      const newOffcut: OffcutItem = {
        id: 'off_' + Math.random().toString(36).substring(2, 7),
        materialType: activeGroup.materialType,
        thicknessMm: activeGroup.thicknessMm,
        lengthCm: length,
        widthCm: width,
        location: 'Taller - Sobrantes',
        status: 'disponible',
        dateAdded: new Date().toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: 'numeric' }),
        notes: `Sobrante del proyecto: ${projectName} (${activeGroup.materialType})`
      };
      onSaveOffcut(newOffcut);
      setSavedOffcutToast({
        show: true,
        msg: `✅ Retazo de ${length} × ${width} cm (${activeGroup.materialType}) guardado con éxito en el Almacén de Pedacería.`
      });
      setTimeout(() => {
        setSavedOffcutToast({ show: false, msg: '' });
      }, 4500);
    }
  };

  // =========================================================================
  // DETECCIÓN AUTOMÁTICA DE PEDACERÍA / RETAZOS DEL ALMACÉN (REQUERIMIENTO 3)
  // =========================================================================
  const matchingOffcuts = useMemo(() => {
    if (!activeGroup) return [];

    const norm = (s: string) => (s || '').toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").trim().replace(/\s+/g, ' ');
    const activeMatNorm = norm(activeGroup.materialType);
    const activeThick = Number(activeGroup.thicknessMm) || 15;

    const matchingList: {
      offcut: OffcutItem;
      offcutNumber: number;
      offcutLabel: string;
      isAssignedToThisProject: boolean;
      assignedInfo?: AssignedOffcutData;
      candidates: {
        cut: WoodCut;
        fitsDirect: boolean;
        fitsRotated: boolean;
        usedL: number;
        usedW: number;
        remainingL: number;
        remainingW: number;
        areaEfficiency: number;
      }[];
    }[] = [];

    // Filtrar retazos compatibles de almacén (disponibles o asignados a este proyecto)
    const compatibleOffcuts = warehouseOffcuts.filter(off => {
      const isAssigned = !!assignedOffcuts[off.id];
      if (off.status !== 'disponible' && !isAssigned) return false;

      const offMatNorm = norm(off.materialType);
      const isMatMatch = offMatNorm === activeMatNorm || 
                         offMatNorm.includes(activeMatNorm) || 
                         activeMatNorm.includes(offMatNorm);
      const isThickMatch = Math.abs(Number(off.thicknessMm) - activeThick) <= 1;

      return isMatMatch && isThickMatch;
    });

    compatibleOffcuts.forEach((off, idx) => {
      const isAssigned = !!assignedOffcuts[off.id];
      const offcutNumber = idx + 1;
      const offcutLabel = `RETAZO #${offcutNumber} (${off.lengthCm} × ${off.widthCm} cm)`;

      const offL = Number(off.lengthCm) || 0;
      const offW = Number(off.widthCm) || 0;
      const offArea = offL * offW;
      if (offArea <= 0) return;

      const candidates: {
        cut: WoodCut;
        fitsDirect: boolean;
        fitsRotated: boolean;
        usedL: number;
        usedW: number;
        remainingL: number;
        remainingW: number;
        areaEfficiency: number;
      }[] = [];

      // Buscar qué piezas del proyecto pueden cortarse de este retazo
      localCuts.forEach(cut => {
        const { material, thickness } = resolveCutMaterial(cut, defaultMaterialType, defaultThicknessMm);
        const normCutMat = norm(material);
        if (normCutMat !== activeMatNorm && !normCutMat.includes(activeMatNorm) && !activeMatNorm.includes(normCutMat)) return;
        if (Math.abs(Number(thickness) - activeThick) > 1) return;

        const pL = Number(cut.lengthCm) || 0;
        const pW = Number(cut.widthCm) || 0;
        if (pL <= 0 || pW <= 0) return;

        const fitsDirect = pL <= offL && pW <= offW;
        const fitsRotated = activeConfig.allowRotation && pW <= offL && pL <= offW;

        if (fitsDirect || fitsRotated) {
          const usedL = fitsDirect ? pL : pW;
          const usedW = fitsDirect ? pW : pL;
          const pieceArea = pL * pW;
          const areaEfficiency = Math.round((pieceArea / offArea) * 100);

          // Cálculo óptimo realista de remanente rectangular según sentido de corte
          const realistic = computeRealisticRemnants(offL, offW, usedL, usedW);
          const remainingL = realistic.recommended.primaryL;
          const remainingW = realistic.recommended.primaryW;

          candidates.push({
            cut,
            fitsDirect,
            fitsRotated: !fitsDirect && fitsRotated,
            usedL,
            usedW,
            remainingL,
            remainingW,
            areaEfficiency
          });
        }
      });

      if (candidates.length > 0 || isAssigned) {
        matchingList.push({
          offcut: off,
          offcutNumber,
          offcutLabel,
          isAssignedToThisProject: isAssigned,
          assignedInfo: assignedOffcuts[off.id],
          candidates
        });
      }
    });

    return matchingList;
  }, [activeGroup, warehouseOffcuts, assignedOffcuts, localCuts, defaultMaterialType, defaultThicknessMm, activeConfig.allowRotation]);

  // Apertura del modal de asignación y cálculo de remanente
  const handleOpenAssignModal = (
    offcut: OffcutItem, 
    offcutNumber: number, 
    offcutLabel: string, 
    candidate: { cut: WoodCut; fitsDirect: boolean; fitsRotated: boolean; usedL: number; usedW: number; remainingL: number; remainingW: number }
  ) => {
    const strategies = computeRealisticRemnants(offcut.lengthCm, offcut.widthCm, candidate.usedL, candidate.usedW);
    const defaultStrat = strategies.recommended;

    setAssignModalData({
      offcut,
      offcutNumber,
      offcutLabel,
      cut: candidate.cut,
      fitsDirect: candidate.fitsDirect,
      fitsRotated: candidate.fitsRotated,
      usedL: candidate.usedL,
      usedW: candidate.usedW,
      strategies,
      selectedStrategyId: defaultStrat.id,
      remainingL: defaultStrat.primaryL,
      remainingW: defaultStrat.primaryW,
      selectedAction: 'save_remaining'
    });
  };

  // Confirmar corte y actualización de sobrante en el almacén
  const handleConfirmAssignOffcut = () => {
    if (!assignModalData) return;
    const {
      offcut,
      offcutNumber,
      offcutLabel,
      cut,
      usedL,
      usedW,
      remainingL,
      remainingW,
      selectedStrategyId,
      selectedAction
    } = assignModalData;

    const record: AssignedOffcutData = {
      pieceId: cut.id,
      pieceName: cut.name,
      furnitureName: cut.furnitureName || activeGroup.displayName,
      offcutId: offcut.id,
      offcutNumber,
      offcutLabel,
      materialType: offcut.materialType,
      thicknessMm: offcut.thicknessMm,
      originalLengthCm: offcut.lengthCm,
      originalWidthCm: offcut.widthCm,
      usedLengthCm: usedL,
      usedWidthCm: usedW,
      remainingLengthCm: remainingL,
      remainingWidthCm: remainingW,
      cutDirection: selectedStrategyId,
      action: selectedAction,
      date: new Date().toISOString()
    };

    // Guardar asignación
    const updatedAssigned = {
      ...assignedOffcuts,
      [offcut.id]: record
    };
    saveAssignedOffcuts(updatedAssigned);

    // Actualizar Almacén / Inventario
    if (selectedAction === 'save_remaining' && remainingL > 0 && remainingW > 0) {
      const updatedOffcut: OffcutItem = {
        ...offcut,
        lengthCm: remainingL,
        widthCm: remainingW,
        status: 'disponible',
        notes: `Sobrante remanente tras cortar "${cut.name}" (${cut.lengthCm}×${cut.widthCm}cm) para proyecto ${projectName}.`
      };

      if (onUpdateOffcut) {
        onUpdateOffcut(updatedOffcut);
      }
      const updatedWarehouse = warehouseOffcuts.map(o => o.id === offcut.id ? updatedOffcut : o);
      setWarehouseOffcuts(updatedWarehouse);
      localStorage.setItem('carpinteria_offcuts', JSON.stringify(updatedWarehouse));
    } else {
      // Marcar usado / descartado
      if (onUpdateOffcutStatus) {
        onUpdateOffcutStatus(offcut.id, 'usado');
      }
      const updatedWarehouse = warehouseOffcuts.map(o => o.id === offcut.id ? { ...o, status: 'usado' as const } : o);
      setWarehouseOffcuts(updatedWarehouse);
      localStorage.setItem('carpinteria_offcuts', JSON.stringify(updatedWarehouse));
    }

    // Actualizar etiquetas en proyecto en localStorage para módulo 3
    try {
      const savedProjectsStr = localStorage.getItem('carpinteria_projects');
      if (savedProjectsStr) {
        const savedProjects = JSON.parse(savedProjectsStr);
        const projIndex = savedProjects.findIndex((p: any) => p.name === projectName);
        if (projIndex !== -1) {
          const proj = savedProjects[projIndex];
          if (proj.furnitureUnits) {
            proj.furnitureUnits.forEach((u: any) => {
              u.cuts?.forEach((c: any) => {
                if (c.id === cut.id) {
                  c.sourceOffcutId = offcut.id;
                  c.sourceOffcutLabel = offcutLabel;
                }
              });
            });
          }
          if (proj.cuts) {
            proj.cuts.forEach((c: any) => {
              if (c.id === cut.id) {
                c.sourceOffcutId = offcut.id;
                c.sourceOffcutLabel = offcutLabel;
              }
            });
          }
          localStorage.setItem('carpinteria_projects', JSON.stringify(savedProjects));
        }
      }
    } catch (e) {
      console.error(e);
    }

    setSavedOffcutToast({
      show: true,
      msg: `💡 ¡Pieza "${cut.name}" asignada a ${offcutLabel}! Remanente (${remainingL}×${remainingW}cm) ${selectedAction === 'save_remaining' ? 'guardado en Almacén' : 'desechado'}. La pieza se ha retirado de los tableros nuevos.`
    });
    setTimeout(() => setSavedOffcutToast({ show: false, msg: '' }), 5000);

    setAssignModalData(null);
  };

  // Liberar retazo y restaurar dimensiones en el almacén
  const handleUnassignOffcut = (offcutId: string) => {
    const record = assignedOffcuts[offcutId];
    const updatedMap = { ...assignedOffcuts };
    delete updatedMap[offcutId];
    saveAssignedOffcuts(updatedMap);

    const origLength = record?.originalLengthCm || 0;
    const origWidth = record?.originalWidthCm || 0;

    const targetOffcut = warehouseOffcuts.find(o => o.id === offcutId);
    if (targetOffcut) {
      const restoredOffcut: OffcutItem = {
        ...targetOffcut,
        lengthCm: origLength > 0 ? origLength : targetOffcut.lengthCm,
        widthCm: origWidth > 0 ? origWidth : targetOffcut.widthCm,
        status: 'disponible'
      };

      if (onUpdateOffcut) {
        onUpdateOffcut(restoredOffcut);
      } else if (onUpdateOffcutStatus) {
        onUpdateOffcutStatus(offcutId, 'disponible');
      }

      const updatedWarehouse = warehouseOffcuts.map(o => o.id === offcutId ? restoredOffcut : o);
      setWarehouseOffcuts(updatedWarehouse);
      localStorage.setItem('carpinteria_offcuts', JSON.stringify(updatedWarehouse));
    }

    // Limpiar etiquetas del corte en proyecto
    try {
      const savedProjectsStr = localStorage.getItem('carpinteria_projects');
      if (savedProjectsStr) {
        const savedProjects = JSON.parse(savedProjectsStr);
        const projIndex = savedProjects.findIndex((p: any) => p.name === projectName);
        if (projIndex !== -1) {
          const proj = savedProjects[projIndex];
          if (proj.furnitureUnits) {
            proj.furnitureUnits.forEach((u: any) => {
              u.cuts?.forEach((c: any) => {
                if (c.id === record?.pieceId) {
                  delete c.sourceOffcutId;
                  delete c.sourceOffcutLabel;
                }
              });
            });
          }
          if (proj.cuts) {
            proj.cuts.forEach((c: any) => {
              if (c.id === record?.pieceId) {
                delete c.sourceOffcutId;
                delete c.sourceOffcutLabel;
              }
            });
          }
          localStorage.setItem('carpinteria_projects', JSON.stringify(savedProjects));
        }
      }
    } catch (e) {
      console.error(e);
    }

    setSavedOffcutToast({
      show: true,
      msg: `🔄 ${record?.offcutLabel || 'Retazo'} devuelto al almacén (${origLength}×${origWidth}cm). La pieza ha regresado al plano 2D de tableros nuevos.`
    });
    setTimeout(() => setSavedOffcutToast({ show: false, msg: '' }), 4500);
  };

  // PDF Preview modals
  const handleOpenPlanosPdfModal = () => {
    setPdfPreviewModalMode('planos');
  };

  const handleOpenGuiaPdfModal = () => {
    setPdfPreviewModalMode('guia');
  };

  // Lista de piezas asignadas a pedacería de almacén para este material / proyecto
  const projectAssignedOffcuts = useMemo(() => {
    if (!activeGroup) return [];
    const norm = (s: string) => (s || '').toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").trim().replace(/\s+/g, ' ');
    const activeMatNorm = norm(activeGroup.materialType);
    const activeThick = Number(activeGroup.thicknessMm) || 15;

    return Object.values(assignedOffcuts).filter((record: any) => {
      if (!record || !record.offcutId) return false;
      const recMatNorm = norm(record.materialType || '');
      const isMatMatch = !record.materialType || recMatNorm === activeMatNorm || recMatNorm.includes(activeMatNorm) || activeMatNorm.includes(recMatNorm);
      const isThickMatch = !record.thicknessMm || Math.abs(Number(record.thicknessMm) - activeThick) <= 1;
      return isMatMatch && isThickMatch;
    }) as AssignedOffcutData[];
  }, [assignedOffcuts, activeGroup]);

  const offcutsTotalCount = projectAssignedOffcuts.length;
  const offcutsCompletedCount = projectAssignedOffcuts.filter(rec => cutOffcutPieceIds[rec.offcutId]).length;
  const allOffcutPiecesCut = offcutsTotalCount > 0 && offcutsCompletedCount === offcutsTotalCount;
  const isHojasCompletasLocked = offcutsTotalCount > 0 && !allOffcutPiecesCut && !bypassOffcutsLock;

  return (
    <div className="max-w-7xl mx-auto p-4 sm:p-6 space-y-6">

      {/* Toast Notification: Saved Offcut */}
      {savedOffcutToast.show && (
        <div className="fixed top-6 right-6 z-50 bg-emerald-600 text-white font-black px-6 py-4 rounded-2xl shadow-2xl border-2 border-emerald-300 flex items-center gap-3 animate-bounce">
          <CheckCircle className="w-6 h-6 text-emerald-200" />
          <span className="text-sm sm:text-base">{savedOffcutToast.msg}</span>
          <button 
            onClick={() => setSavedOffcutToast({ show: false, msg: '' })}
            className="ml-2 bg-emerald-700 hover:bg-emerald-800 p-1 rounded-lg text-xs"
          >
            ✕
          </button>
        </div>
      )}

      {/* Toast Notification: Completed Furniture */}
      {completedFurnitureToast && (
        <div className="fixed top-20 right-6 z-50 bg-gradient-to-r from-amber-600 via-orange-600 to-amber-700 text-white font-black px-6 py-4 rounded-2xl shadow-2xl border-3 border-amber-300 flex items-center gap-3 animate-fadeIn">
          <Award className="w-8 h-8 text-amber-200 animate-pulse" />
          <div>
            <div className="text-xs uppercase tracking-wider text-amber-200">¡Hito de Fabricación!</div>
            <span className="text-sm sm:text-base">🎉 ¡Has completado el 100% de las piezas de <b>{completedFurnitureToast}</b>!</span>
          </div>
          <button 
            onClick={() => setCompletedFurnitureToast(null)}
            className="ml-3 bg-amber-900/60 hover:bg-amber-900 p-1.5 rounded-lg text-xs"
          >
            ✕
          </button>
        </div>
      )}

      {/* Main Header bar */}
      <div className="bg-amber-950 text-white rounded-3xl p-6 sm:p-8 shadow-2xl border-4 border-amber-600 flex flex-col md:flex-row md:items-center justify-between gap-6 no-print">
        <div className="flex items-center gap-4">
          <button
            onClick={onBackToProject}
            className="bg-amber-800 hover:bg-amber-700 text-white p-3.5 rounded-2xl border-2 border-amber-600 transition cursor-pointer shadow-md flex items-center gap-2 font-bold"
            title="Volver al Despiece de Muebles"
          >
            <ArrowLeft className="w-6 h-6 text-amber-300" />
            <span className="hidden sm:inline">Despiece</span>
          </button>
          <div>
            <div className="flex items-center gap-2">
              <span className="bg-orange-500 text-white text-xs font-black px-2.5 py-0.5 rounded-full uppercase tracking-wider">
                Módulo 2
              </span>
              <span className="text-xs font-bold text-amber-300">
                {materialGroups.length} Material(es) Detectado(s)
              </span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
              Optimizador y Guía de Corte
            </h2>
            <p className="text-amber-200 text-sm font-semibold">
              Proyecto: <span className="text-white font-extrabold">{projectName}</span> — {globalSummary.grandTotalPieces} piezas totales en {globalSummary.grandTotalSheets} {globalSummary.grandTotalSheets === 1 ? 'Hoja' : 'Hojas'}
            </p>
          </div>
        </div>

        {/* Stage Toggle buttons */}
        <div className="flex items-center gap-2 bg-amber-900/80 p-1.5 rounded-2xl border border-amber-700">
          <button
            onClick={() => setCurrentStage('config')}
            className={`px-4 py-2.5 rounded-xl font-black text-sm transition cursor-pointer flex items-center gap-2 ${
              currentStage === 'config'
                ? 'bg-amber-500 text-amber-950 shadow-lg'
                : 'text-amber-200 hover:text-white'
            }`}
          >
            <Sliders className="w-4 h-4" />
            1. Parámetros de Corte
          </button>
          <button
            onClick={() => setCurrentStage('result')}
            className={`px-4 py-2.5 rounded-xl font-black text-sm transition cursor-pointer flex items-center gap-2 ${
              currentStage === 'result'
                ? 'bg-emerald-500 text-emerald-950 shadow-lg'
                : 'text-amber-200 hover:text-white'
            }`}
          >
            <Ruler className="w-4 h-4" />
            2. Mapa y Guía ({activeOptimizationResult.totalSheets} {activeOptimizationResult.totalSheets === 1 ? 'Tablero' : 'Tableros'})
          </button>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* REQUERIMIENTO 3: RESUMEN GENERAL DE HOJAS TOTALES POR MATERIAL            */}
      {/* ========================================================================= */}
      <div className="bg-gradient-to-r from-slate-900 via-amber-950 to-slate-900 text-white rounded-3xl p-5 sm:p-6 border-4 border-amber-500 shadow-2xl space-y-4 no-print">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-amber-800/80 pb-3">
          <div className="flex items-center gap-3">
            <span className="w-10 h-10 rounded-2xl bg-amber-500 text-amber-950 flex items-center justify-center text-xl font-black shadow-md">
              🗂️
            </span>
            <div>
              <h3 className="text-lg sm:text-xl font-black text-white tracking-tight flex items-center gap-2">
                <span>Resumen de Hojas Totales Requeridas por Material</span>
                <Sparkles className="w-4 h-4 text-amber-300" />
              </h3>
              <p className="text-xs font-semibold text-amber-200/90">
                Cálculo global estricto: Cada material y espesor se optimiza en sus propias láminas independientes.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0 self-start sm:self-center">
            <span className="bg-emerald-500 text-slate-950 text-xs sm:text-sm font-black px-3.5 py-1.5 rounded-xl border-2 border-emerald-300 shadow-md">
              📦 Total Proyecto: {globalSummary.grandTotalSheets} {globalSummary.grandTotalSheets === 1 ? 'Hoja' : 'Hojas'}
            </span>
          </div>
        </div>

        {/* Material Summary Cards Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {globalSummary.materialsList.map((mat) => {
            const isSelected = mat.key === activeGroup.key;
            const isMdf = mat.thicknessMm <= 3 || mat.materialType.toLowerCase().includes('mdf') || mat.materialType.toLowerCase().includes('fondo');

            return (
              <div
                key={mat.key}
                onClick={() => {
                  setSelectedMaterialKey(mat.key);
                  setSelectedBoardIndex(1);
                  setSelectedPieceId(null);
                }}
                className={`p-4 rounded-2xl border-2 transition-all cursor-pointer flex items-center justify-between gap-3 ${
                  isSelected
                    ? 'bg-amber-800/90 border-amber-300 shadow-lg ring-2 ring-amber-400 scale-[1.02]'
                    : 'bg-slate-800/70 border-slate-700 hover:bg-slate-800 hover:border-amber-400/60'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className={`w-11 h-11 rounded-xl flex items-center justify-center text-xl font-black border ${
                    isSelected ? 'bg-amber-400 text-amber-950 border-amber-200' : 'bg-slate-700 text-amber-300 border-slate-600'
                  }`}>
                    {isMdf ? '📄' : '🪵'}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-black text-white">
                        {mat.materialType}
                      </span>
                      <span className="text-[11px] font-black bg-amber-400/20 text-amber-300 border border-amber-400/40 px-1.5 py-0.2 rounded">
                        {mat.thicknessMm} mm
                      </span>
                    </div>
                    <p className="text-xs font-bold text-slate-300 mt-0.5">
                      {mat.pieces} {mat.pieces === 1 ? 'pieza' : 'piezas'} • {mat.sheetLengthCm}×{mat.sheetWidthCm} cm
                    </p>
                  </div>
                </div>

                <div className="text-right shrink-0">
                  <span className={`text-base font-black px-2.5 py-1 rounded-xl border ${
                    isSelected ? 'bg-amber-300 text-amber-950 border-amber-100' : 'bg-slate-700 text-white border-slate-600'
                  }`}>
                    {mat.sheets} {mat.sheets === 1 ? 'Hoja' : 'Hojas'}
                  </span>
                  <span className="text-[10px] font-bold text-amber-200/80 block mt-1">
                    {mat.efficiency}% uso
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* ========================================================================= */}
      {/* REQUERIMIENTO 2: SELECTOR DE PESTAÑAS POR MATERIAL (TABS)                */}
      {/* ========================================================================= */}
      <div className="bg-white rounded-3xl p-4 sm:p-5 border-4 border-amber-900/20 shadow-xl space-y-3 no-print">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <Layers2 className="w-5 h-5 text-amber-700" />
            <span className="text-sm font-black text-slate-900 uppercase tracking-wider">
              Pestañas de Materiales del Proyecto:
            </span>
          </div>
          <span className="text-xs font-bold text-slate-500">
            Haz clic en una pestaña para ver el plano y lista de piezas correspondientes:
          </span>
        </div>

        <div className="flex items-center gap-2.5 overflow-x-auto pb-2">
          {materialGroups.map((grp, grpIdx) => {
            const isSelected = grp.key === activeGroup.key;
            const opt = materialOptimizations[grp.key];
            const sheetsCount = opt ? opt.totalSheets : 1;
            const isMdf = grp.thicknessMm <= 3 || grp.materialType.toLowerCase().includes('mdf');

            return (
              <button
                key={`opt-mat-grp-${grp.key}-${grpIdx}`}
                type="button"
                onClick={() => {
                  setSelectedMaterialKey(grp.key);
                  setSelectedBoardIndex(1);
                  setSelectedPieceId(null);
                }}
                className={`px-5 py-3 rounded-2xl font-black text-sm sm:text-base transition-all shrink-0 border-3 cursor-pointer flex items-center gap-3 ${
                  isSelected
                    ? 'bg-gradient-to-r from-amber-700 via-amber-800 to-amber-900 text-white border-amber-950 shadow-xl ring-4 ring-amber-400/40 scale-105'
                    : 'bg-white text-slate-700 border-slate-300 hover:border-amber-500 hover:bg-amber-50'
                }`}
              >
                <span className="text-lg">{isMdf ? '📄' : '🪵'}</span>
                <div className="text-left">
                  <div className="flex items-center gap-2">
                    <span>{grp.materialType}</span>
                    <span className={`text-xs px-2 py-0.5 rounded-lg border font-black ${
                      isSelected ? 'bg-amber-600 text-amber-100 border-amber-400' : 'bg-slate-100 text-slate-700 border-slate-300'
                    }`}>
                      {grp.thicknessMm} mm
                    </span>
                  </div>
                  <span className={`text-xs font-bold block ${isSelected ? 'text-amber-200' : 'text-slate-500'}`}>
                    {grp.totalPieces} piezas • <b className={isSelected ? 'text-amber-300' : 'text-amber-800'}>{sheetsCount} {sheetsCount === 1 ? 'Hoja' : 'Hojas'}</b>
                  </span>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* ========================================================================= */}
      {/* REQUERIMIENTO 3: DETECCIÓN AUTOMÁTICA DE PEDACERÍA / RETAZOS DEL ALMACÉN   */}
      {/* ========================================================================= */}
      <div className="bg-gradient-to-br from-amber-50/80 via-white to-amber-100/50 rounded-3xl p-5 sm:p-6 border-4 border-amber-500 shadow-xl space-y-4 no-print">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-amber-200 pb-3">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-amber-500 text-amber-950 flex items-center justify-center text-2xl font-black shadow-md border-2 border-amber-300 shrink-0">
              💡
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="bg-amber-600 text-white text-[10px] sm:text-xs font-black px-2.5 py-0.5 rounded-full uppercase tracking-wider">
                  Inventario Inteligente Conectado
                </span>
                <span className="text-xs font-black text-amber-900 bg-amber-200/80 border border-amber-300 px-2 py-0.5 rounded-md">
                  {activeGroup.displayName}
                </span>
              </div>
              <h3 className="text-lg sm:text-xl font-black text-slate-900 tracking-tight mt-0.5">
                Retazos/Sobrantes Aprovechables del Almacén
              </h3>
              <p className="text-xs sm:text-sm font-bold text-amber-950 mt-0.5">
                👉 Elige cuál de estos sobrantes guardados en tu almacén prefieres ocupar para estas piezas.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {matchingOffcuts.length > 0 ? (
              <span className="bg-emerald-600 text-white text-xs sm:text-sm font-black px-3.5 py-1.5 rounded-xl border-2 border-emerald-400 shadow-md flex items-center gap-1.5 animate-pulse">
                <Sparkles className="w-4 h-4" />
                <span>{matchingOffcuts.length} {matchingOffcuts.length === 1 ? 'Retazo Compatible' : 'Retazos Compatibles'}</span>
              </span>
            ) : (
              <span className="bg-slate-200 text-slate-700 text-xs font-bold px-3 py-1 rounded-xl border border-slate-300">
                0 Retazos compatibles
              </span>
            )}
          </div>
        </div>

        {matchingOffcuts.length > 0 ? (
          <div className="space-y-4">
            <div className="bg-emerald-50 border-2 border-emerald-300 rounded-2xl p-3.5 flex items-center justify-between gap-3">
              <div className="flex items-center gap-2.5">
                <span className="text-xl">✨</span>
                <p className="text-xs sm:text-sm font-bold text-emerald-950">
                  <b>¡Ahorro de Material Detectado!</b> Tienes <b>{matchingOffcuts.length}</b> retazo(s) compatible(s) en almacén para <b>{activeGroup.displayName}</b>. Las piezas que asignes a retazos se retirarán automáticamente del plano 2D de tableros nuevos.
                </p>
              </div>
              {Object.keys(assignedOffcuts).length > 0 && (
                <span className="bg-emerald-700 text-white font-black text-xs px-3 py-1.5 rounded-xl shrink-0">
                  {Object.keys(assignedOffcuts).length} {Object.keys(assignedOffcuts).length === 1 ? 'Pieza asignada' : 'Piezas asignadas'}
                </span>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {matchingOffcuts.map(({ offcut, offcutNumber, offcutLabel, isAssignedToThisProject, assignedInfo, candidates }) => (
                <div 
                  key={`match-off-${offcut.id}`}
                  className={`rounded-2xl p-4.5 border-3 transition-all space-y-3.5 ${
                    isAssignedToThisProject
                      ? 'bg-emerald-50/95 border-emerald-500 shadow-lg ring-2 ring-emerald-400/50'
                      : 'bg-white border-amber-400 shadow-md hover:border-amber-600'
                  }`}
                >
                  {/* Encabezado del Retazo con Identificación Clara */}
                  <div className="flex items-start justify-between gap-2 border-b border-amber-200 pb-2.5">
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-xs sm:text-sm font-black text-amber-950 bg-amber-300 px-2.5 py-0.5 rounded-md border border-amber-400 shadow-xs">
                          {offcutLabel}
                        </span>
                        <span className="text-xs font-bold text-slate-600 flex items-center gap-1 bg-slate-100 px-2 py-0.5 rounded border border-slate-300">
                          <MapPin className="w-3.5 h-3.5 text-amber-700" />
                          {offcut.location || 'Taller'}
                        </span>
                      </div>
                      <h4 className="text-lg font-black text-slate-900 mt-1.5 tracking-tight">
                        📏 {offcut.lengthCm} × {offcut.widthCm} cm <span className="text-xs text-slate-600 font-bold">({offcut.thicknessMm} mm)</span>
                      </h4>
                    </div>

                    {isAssignedToThisProject ? (
                      <span className="bg-emerald-600 text-white text-[11px] font-black px-3 py-1 rounded-xl border border-emerald-300 flex items-center gap-1 shadow-xs">
                        <Check className="w-3.5 h-3.5 stroke-[3]" />
                        ASIGNADO
                      </span>
                    ) : (
                      <span className="bg-amber-100 text-amber-900 border border-amber-300 text-[11px] font-black px-2.5 py-1 rounded-xl">
                        En Almacén
                      </span>
                    )}
                  </div>

                  {/* Detalle de Asignación actual si existe */}
                  {isAssignedToThisProject && assignedInfo && (
                    <div className="bg-emerald-100/90 rounded-2xl p-3.5 border-2 border-emerald-300 flex items-center justify-between gap-3 shadow-xs">
                      <div>
                        <div className="flex items-center gap-1.5 text-[10px] font-black uppercase text-emerald-900 mb-0.5">
                          <span>📦</span>
                          <span>Pieza Cortada de este Retazo:</span>
                        </div>
                        <p className="text-sm font-black text-emerald-950">
                          {assignedInfo.pieceName} <span className="font-semibold text-xs text-emerald-800">({assignedInfo.furnitureName})</span>
                        </p>
                        <p className="text-[11px] font-bold text-emerald-900 mt-0.5">
                          Corte: {assignedInfo.usedLengthCm}×{assignedInfo.usedWidthCm} cm • Remanente: {assignedInfo.remainingLengthCm}×{assignedInfo.remainingWidthCm} cm ({assignedInfo.action === 'save_remaining' ? 'Guardado en Almacén' : 'Desechado'})
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleUnassignOffcut(offcut.id)}
                        className="bg-white hover:bg-rose-50 text-rose-700 border-2 border-rose-300 hover:border-rose-500 text-xs font-black px-3 py-2 rounded-xl transition cursor-pointer flex items-center gap-1.5 shadow-xs shrink-0"
                        title="Liberar retazo y devolver al almacén"
                      >
                        <RotateCcw className="w-3.5 h-3.5" />
                        <span>Liberar</span>
                      </button>
                    </div>
                  )}

                  {/* Piezas del proyecto que calzan */}
                  {!isAssignedToThisProject && (
                    <div className="space-y-2">
                      <span className="text-[11px] font-black uppercase tracking-wider text-slate-800 block">
                        Piezas que puedes cortar de este retazo:
                      </span>

                      <div className="space-y-2 max-h-52 overflow-y-auto pr-1">
                        {candidates.map((cand, candIdx) => (
                          <div 
                            key={`cand-${offcut.id}-${cand.cut.id}-${candIdx}`}
                            className="bg-amber-50/80 hover:bg-amber-100/90 rounded-2xl p-3 border border-amber-200 flex items-center justify-between gap-2 text-xs transition"
                          >
                            <div className="min-w-0 flex-1">
                              <div className="flex items-center gap-1.5 flex-wrap">
                                <span className="font-black text-slate-900">
                                  🧩 {cand.cut.name}
                                </span>
                                {cand.cut.furnitureName && (
                                  <span className="text-[10px] font-bold bg-amber-200/90 text-amber-900 px-1.5 py-0.2 rounded">
                                    {cand.cut.furnitureName}
                                  </span>
                                )}
                                {cand.fitsRotated && (
                                  <span className="text-[10px] font-bold text-indigo-700 bg-indigo-100 px-1.5 py-0.2 rounded flex items-center gap-0.5">
                                    <RotateCw className="w-3 h-3" /> 90°
                                  </span>
                                )}
                              </div>
                              <p className="text-[11px] font-semibold text-slate-700 mt-1">
                                Medida: <b className="text-black">{cand.cut.lengthCm} × {cand.cut.widthCm} cm</b> • Remanente: ~<b className="text-emerald-800">{cand.remainingL}×{cand.remainingW} cm</b>
                              </p>
                            </div>

                            <button
                              type="button"
                              onClick={() => handleOpenAssignModal(offcut, offcutNumber, offcutLabel, cand)}
                              className="bg-emerald-600 hover:bg-emerald-700 text-white font-black px-3.5 py-2 rounded-xl border border-emerald-800 text-xs shadow-md transition cursor-pointer flex items-center gap-1.5 shrink-0"
                              title="Seleccionar para cortar de este retazo y decidir destino del sobrante"
                            >
                              <Scissors className="w-3.5 h-3.5" />
                              <span>Cortar</span>
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="bg-white rounded-2xl p-4 border-2 border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-slate-600">
            <div className="flex items-center gap-3">
              <span className="text-xl">ℹ️</span>
              <p className="font-semibold text-slate-700">
                No hay retazos guardados en almacén con dimensiones suficientes para las piezas de <b>{activeGroup.displayName}</b>. Todas las piezas se optimizarán en hojas estándar nuevas de <b>{activeConfig.sheetLengthCm}×{activeConfig.sheetWidthCm} cm</b>.
              </p>
            </div>
            {warehouseOffcuts.length > 0 && (
              <span className="text-[11px] font-bold text-slate-500 italic shrink-0">
                ({warehouseOffcuts.length} retazos en total de otros materiales/medidas)
              </span>
            )}
          </div>
        )}
      </div>

      {/* GLOBAL WORKSHOP PROGRESS BAR (Only in 'result' stage) */}
      {currentStage === 'result' && (
        <div className="bg-white rounded-3xl p-5 sm:p-6 border-4 border-amber-900/20 shadow-xl no-print space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div className="flex items-center gap-3">
              <span className="w-10 h-10 rounded-2xl bg-emerald-100 text-emerald-800 flex items-center justify-center text-xl font-black border-2 border-emerald-300">
                📊
              </span>
              <div>
                <h4 className="text-lg font-black text-slate-900">
                  Progreso de Cortes en: <span className="text-amber-800">{activeGroup.displayName}</span>
                </h4>
                <p className="text-xs font-bold text-slate-600">
                  {cutPiecesCount} de {totalPiecesCount} piezas terminadas ({progressPercent}%) • Suma únicamente piezas cortadas en la <b className="text-emerald-800">Fase B</b>
                </p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              {(Object.entries(furnitureProgress) as [string, { total: number; cut: number }][]).map(([fName, stat], statIdx) => {
                const isComplete = stat.total > 0 && stat.cut === stat.total;
                return (
                  <span
                    key={`opt-stat-${fName}-${statIdx}`}
                    className={`text-xs font-black px-3 py-1 rounded-xl border flex items-center gap-1.5 ${
                      isComplete
                        ? 'bg-emerald-100 text-emerald-900 border-emerald-400 font-extrabold'
                        : 'bg-slate-100 text-slate-700 border-slate-300'
                    }`}
                  >
                    {isComplete && <Check className="w-3.5 h-3.5 text-emerald-700 stroke-[3]" />}
                    {fName}: {stat.cut}/{stat.total}
                  </span>
                );
              })}

              <button
                type="button"
                onClick={handleResetProductionProgress}
                className="text-xs font-bold text-rose-700 hover:text-rose-900 bg-rose-50 hover:bg-rose-100 border border-rose-200 px-2.5 py-1 rounded-xl transition-all flex items-center gap-1 cursor-pointer"
                title="Reiniciar piezas cortadas y progreso de este proyecto"
              >
                <RotateCcw className="w-3.5 h-3.5 text-rose-600" />
                <span>Reiniciar Progreso</span>
              </button>
            </div>
          </div>

          {/* Big Progress Bar */}
          <div className="w-full h-5 bg-slate-200 rounded-full overflow-hidden p-0.5 border border-slate-300 shadow-inner">
            <div
              className="h-full bg-gradient-to-r from-emerald-500 via-teal-500 to-emerald-600 rounded-full transition-all duration-500 flex items-center justify-end pr-2"
              style={{ width: `${Math.max(progressPercent, 4)}%` }}
            >
              <span className="text-[10px] font-black text-white drop-shadow">
                {progressPercent}%
              </span>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* STAGE 1: PANTALLA DE CONFIGURACIÓN PREVIA DE CORTE (PARÁMETROS)          */}
      {/* ========================================================================= */}
      {currentStage === 'config' && (
        <div className="bg-white rounded-3xl border-4 border-amber-900/20 shadow-2xl p-6 sm:p-8 space-y-8 animate-fadeIn">
          
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-4">
            <div>
              <div className="flex items-center gap-2">
                <span className="bg-orange-500 text-white text-xs font-black px-3 py-1 rounded-full uppercase tracking-wider">
                  Configuración Específica
                </span>
                <span className="text-sm font-black text-amber-900 bg-amber-100 border border-amber-300 px-3 py-0.5 rounded-full">
                  Material Activo: {activeGroup.displayName}
                </span>
              </div>
              <h3 className="text-2xl sm:text-4xl font-black text-slate-900 mt-2">
                Parámetros de Corte para {activeGroup.materialType} ({activeGroup.thicknessMm}mm)
              </h3>
              <p className="text-slate-600 font-bold text-base mt-1">
                Ajusta las medidas de la lámina base y el sentido de corte para este material:
              </p>
            </div>
          </div>

          {/* 1. PRIMARY CUT DIRECTION (TWO BIG VISUAL BUTTONS) */}
          <div className="space-y-4">
            <label className="block text-xl font-black text-slate-900">
              🪚 ¿Cómo deseas empezar a cortar las láminas de {activeGroup.materialType}?
            </label>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              
              {/* Option 1: A lo largo */}
              <button
                type="button"
                onClick={() => updateActiveConfig({ primaryCutDirection: 'largo' })}
                className={`p-6 sm:p-8 rounded-3xl border-4 text-left transition-all relative overflow-hidden flex flex-col justify-between cursor-pointer ${
                  activeConfig.primaryCutDirection === 'largo'
                    ? 'border-emerald-600 bg-emerald-50/70 shadow-2xl ring-4 ring-emerald-400/40 scale-[1.01]'
                    : 'border-slate-300 bg-white hover:border-amber-500 hover:bg-amber-50/30'
                }`}
              >
                {activeConfig.primaryCutDirection === 'largo' && (
                  <div className="absolute top-4 right-4 bg-emerald-600 text-white p-2 rounded-full shadow-lg">
                    <Check className="w-6 h-6 stroke-[3]" />
                  </div>
                )}

                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    <span className="text-4xl">📐</span>
                    <div>
                      <h4 className="text-2xl sm:text-3xl font-black text-slate-900">
                        A lo largo
                      </h4>
                      <p className="text-xs sm:text-sm font-black text-emerald-800">
                        (Cortes paralelos al lado de {activeConfig.sheetLengthCm} cm)
                      </p>
                    </div>
                  </div>

                  <p className="text-sm font-bold text-slate-700 leading-relaxed">
                    Divide el tablero primero en <b>tiras largas longitudinales</b>. Ideal para piezas de gran longitud y corte continuo.
                  </p>

                  <div className="w-full h-32 bg-amber-100 rounded-2xl border-2 border-amber-400 p-2 flex flex-col justify-between shadow-inner">
                    <div className="text-[10px] font-bold text-slate-600">
                      Tablero {activeConfig.sheetLengthCm} × {activeConfig.sheetWidthCm} cm
                    </div>
                    <div className="space-y-1.5">
                      <div className="w-full h-5 bg-emerald-400 border border-emerald-700 rounded flex items-center px-2 text-[10px] font-black text-emerald-950">
                        ━━ Tira 1 Longitudinal ({activeConfig.sheetLengthCm} cm) ━━
                      </div>
                      <div className="w-full h-5 bg-emerald-300 border border-emerald-700 rounded flex items-center px-2 text-[10px] font-black text-emerald-950">
                        ━━ Tira 2 Longitudinal ({activeConfig.sheetLengthCm} cm) ━━
                      </div>
                      <div className="w-full h-5 bg-emerald-200 border border-emerald-700 rounded flex items-center px-2 text-[10px] font-black text-emerald-950">
                        ━━ Tira 3 Longitudinal ({activeConfig.sheetLengthCm} cm) ━━
                      </div>
                    </div>
                    <div className="text-[10px] font-bold text-slate-600 text-right">
                      ► Cortes horizontales continuos
                    </div>
                  </div>
                </div>
              </button>

              {/* Option 2: A lo ancho */}
              <button
                type="button"
                onClick={() => updateActiveConfig({ primaryCutDirection: 'ancho' })}
                className={`p-6 sm:p-8 rounded-3xl border-4 text-left transition-all relative overflow-hidden flex flex-col justify-between cursor-pointer ${
                  activeConfig.primaryCutDirection === 'ancho'
                    ? 'border-emerald-600 bg-emerald-50/70 shadow-2xl ring-4 ring-emerald-400/40 scale-[1.01]'
                    : 'border-slate-300 bg-white hover:border-amber-500 hover:bg-amber-50/30'
                }`}
              >
                {activeConfig.primaryCutDirection === 'ancho' && (
                  <div className="absolute top-4 right-4 bg-emerald-600 text-white p-2 rounded-full shadow-lg">
                    <Check className="w-6 h-6 stroke-[3]" />
                  </div>
                )}

                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    <span className="text-4xl">📏</span>
                    <div>
                      <h4 className="text-2xl sm:text-3xl font-black text-slate-900">
                        A lo ancho
                      </h4>
                      <p className="text-xs sm:text-sm font-black text-emerald-800">
                        (Cortes paralelos al lado de {activeConfig.sheetWidthCm} cm)
                      </p>
                    </div>
                  </div>

                  <p className="text-sm font-bold text-slate-700 leading-relaxed">
                    Troza el tablero primero en <b>bloques transversales</b> de menor tamaño. Muy cómodo para talleres pequeños y fondos.
                  </p>

                  <div className="w-full h-32 bg-amber-100 rounded-2xl border-2 border-amber-400 p-2 flex flex-col justify-between shadow-inner">
                    <div className="text-[10px] font-bold text-slate-600">
                      Tablero {activeConfig.sheetLengthCm} × {activeConfig.sheetWidthCm} cm
                    </div>
                    <div className="flex gap-2 h-14">
                      <div className="w-1/3 bg-blue-300 border border-blue-700 rounded flex items-center justify-center text-[10px] font-black text-blue-950 text-center p-1">
                        Bloque 1 ({activeConfig.sheetWidthCm} cm)
                      </div>
                      <div className="w-1/3 bg-blue-400 border border-blue-700 rounded flex items-center justify-center text-[10px] font-black text-blue-950 text-center p-1">
                        Bloque 2 ({activeConfig.sheetWidthCm} cm)
                      </div>
                      <div className="w-1/3 bg-blue-300 border border-blue-700 rounded flex items-center justify-center text-[10px] font-black text-blue-950 text-center p-1">
                        Bloque 3 ({activeConfig.sheetWidthCm} cm)
                      </div>
                    </div>
                    <div className="text-[10px] font-bold text-slate-600 text-right">
                      ▲ Cortes transversales
                    </div>
                  </div>
                </div>
              </button>

            </div>
          </div>

          <hr className="border-slate-200" />

          {/* 2. Parameters (Sheet dimensions & kerf) */}
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <span className="w-9 h-9 rounded-2xl bg-amber-600 text-white font-black flex items-center justify-center text-lg shadow">
                2
              </span>
              <h3 className="text-2xl sm:text-3xl font-black text-slate-900">
                Parámetros de Hoja y Sierra para {activeGroup.materialType}
              </h3>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              
              {/* Medidas Hoja Base */}
              <div className="space-y-2 bg-amber-50/60 p-5 rounded-2xl border-2 border-amber-200">
                <label className="block text-base font-black text-slate-900">
                  📐 Medidas de la Lámina Base:
                </label>
                
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <span className="text-xs font-black text-blue-700 uppercase">Largo (cm):</span>
                    <input
                      type="number"
                      step="1"
                      min="50"
                      max="500"
                      value={activeConfig.sheetLengthCm === 0 ? '' : activeConfig.sheetLengthCm}
                      onChange={(e) => updateActiveConfig({ sheetLengthCm: e.target.value === '' ? 0 : Number(e.target.value) })}
                      onFocus={(e) => e.target.select()}
                      onClick={(e) => (e.target as HTMLInputElement).select()}
                      className="w-full text-xl font-black p-3 rounded-xl border-2 border-blue-400 bg-white text-blue-900 text-center focus:border-blue-600 outline-none"
                    />
                  </div>
                  <div>
                    <span className="text-xs font-black text-orange-700 uppercase">Ancho (cm):</span>
                    <input
                      type="number"
                      step="1"
                      min="50"
                      max="500"
                      value={activeConfig.sheetWidthCm === 0 ? '' : activeConfig.sheetWidthCm}
                      onChange={(e) => updateActiveConfig({ sheetWidthCm: e.target.value === '' ? 0 : Number(e.target.value) })}
                      onFocus={(e) => e.target.select()}
                      onClick={(e) => (e.target as HTMLInputElement).select()}
                      className="w-full text-xl font-black p-3 rounded-xl border-2 border-orange-400 bg-white text-orange-900 text-center focus:border-orange-600 outline-none"
                    />
                  </div>
                </div>

                <div className="flex flex-wrap gap-1.5 pt-2">
                  <button
                    type="button"
                    onClick={() => updateActiveConfig({ sheetLengthCm: 244, sheetWidthCm: 122 })}
                    className={`text-xs font-black px-2.5 py-1 rounded-lg border transition ${
                      activeConfig.sheetLengthCm === 244 && activeConfig.sheetWidthCm === 122
                        ? 'bg-amber-700 text-white border-amber-950'
                        : 'bg-white text-slate-700 border-slate-300 hover:bg-amber-100'
                    }`}
                  >
                    244 × 122 cm (Estándar)
                  </button>
                  <button
                    type="button"
                    onClick={() => updateActiveConfig({ sheetLengthCm: 244, sheetWidthCm: 183 })}
                    className={`text-xs font-black px-2.5 py-1 rounded-lg border transition ${
                      activeConfig.sheetLengthCm === 244 && activeConfig.sheetWidthCm === 183
                        ? 'bg-amber-700 text-white border-amber-950'
                        : 'bg-white text-slate-700 border-slate-300 hover:bg-amber-100'
                    }`}
                  >
                    244 × 183 cm (Jumbo)
                  </button>
                </div>
              </div>

              {/* Grosor del Disco / Sierra (Kerf) */}
              <div className="space-y-2 bg-amber-50/60 p-5 rounded-2xl border-2 border-amber-200">
                <label className="block text-base font-black text-slate-900">
                  🪚 Grosor del Disco / Sierra (Kerf):
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    step="0.1"
                    min="1"
                    max="10"
                    value={activeConfig.sawKerfMm === 0 ? '' : activeConfig.sawKerfMm}
                    onChange={(e) => updateActiveConfig({ sawKerfMm: e.target.value === '' ? 0 : Number(e.target.value) })}
                    onFocus={(e) => e.target.select()}
                    onClick={(e) => (e.target as HTMLInputElement).select()}
                    className="w-full text-2xl font-black p-3 rounded-xl border-2 border-amber-500 bg-white text-amber-950 text-center focus:border-amber-700 outline-none"
                  />
                  <span className="text-xl font-black text-slate-700 shrink-0">mm</span>
                </div>

                <div className="flex flex-wrap gap-1.5 pt-2">
                  {[2.4, 3.0, 3.2, 4.0].map(k => (
                    <button
                      key={k}
                      type="button"
                      onClick={() => updateActiveConfig({ sawKerfMm: k })}
                      className={`text-xs font-black px-2.5 py-1 rounded-lg border transition ${
                        activeConfig.sawKerfMm === k
                          ? 'bg-amber-700 text-white border-amber-950'
                          : 'bg-white text-slate-700 border-slate-300 hover:bg-amber-100'
                      }`}
                    >
                      {k} mm
                    </button>
                  ))}
                </div>
              </div>

              {/* Rotación y Refilado */}
              <div className="space-y-3 bg-amber-50/60 p-5 rounded-2xl border-2 border-amber-200">
                <label className="block text-base font-black text-slate-900">
                  🔄 Orientación de Veta y Refilado:
                </label>

                <label className="flex items-start gap-3 bg-white p-3 rounded-xl border-2 border-slate-300 hover:border-amber-500 cursor-pointer transition">
                  <input
                    type="checkbox"
                    checked={activeConfig.allowRotation}
                    onChange={(e) => updateActiveConfig({ allowRotation: e.target.checked })}
                    className="w-5 h-5 text-amber-600 rounded mt-0.5 cursor-pointer"
                  />
                  <div className="text-xs font-black text-slate-900 leading-snug">
                    <span>Permitir girar piezas para aprovechar madera</span>
                    <p className="text-[11px] font-normal text-slate-500 mt-0.5">
                      (Desmarcar si la madera tiene vetas fijas que no se deban rotar).
                    </p>
                  </div>
                </label>

                <div className="flex items-center justify-between gap-2 pt-1">
                  <span className="text-xs font-extrabold text-slate-700">Refilado Perimetral:</span>
                  <select
                    value={activeConfig.trimMarginCm}
                    onChange={(e) => updateActiveConfig({ trimMarginCm: Number(e.target.value) })}
                    className="text-xs font-black p-2 rounded-lg border border-slate-300 bg-white"
                  >
                    <option value={0}>0 cm (Sin refilado)</option>
                    <option value={1}>1 cm (Bordes golpeados)</option>
                    <option value={2}>2 cm (Escuadrado amplio)</option>
                  </select>
                </div>
              </div>

            </div>
          </div>

          {/* Summary Preview */}
          <div className="bg-amber-100 border-2 border-amber-300 rounded-2xl p-5 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <span className="text-3xl">📦</span>
              <div>
                <h4 className="text-lg font-black text-amber-950">
                  {activeGroup.cuts.length} Líneas de Piezas ({activeGroup.totalPieces} piezas en este material)
                </h4>
                <p className="text-sm font-bold text-amber-900">
                  Material Activo: {activeGroup.displayName} • Proyecto: {projectName}
                </p>
              </div>
            </div>
            <div className="text-right">
              <span className="text-xs font-black uppercase tracking-wider text-amber-900 block">
                Cálculo para {activeGroup.materialType}
              </span>
              <span className="text-2xl font-black text-amber-950">
                {activeOptimizationResult.totalSheets} {activeOptimizationResult.totalSheets === 1 ? 'Tablero' : 'Tableros'} ({activeOptimizationResult.overallEfficiencyPercent}% aprovecham.)
              </span>
            </div>
          </div>

          {/* Giant Continue Button */}
          <button
            type="button"
            onClick={() => setCurrentStage('result')}
            className="w-full bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-700 hover:from-emerald-500 hover:to-teal-600 text-white font-black py-6 sm:py-7 text-2xl sm:text-3xl rounded-3xl border-4 border-emerald-950 shadow-2xl hover:shadow-emerald-500/40 flex items-center justify-center gap-4 transition-all transform active:scale-[0.98] cursor-pointer"
          >
            <span>GENERAR MAPA Y GUÍA DE CORTE: {activeGroup.displayName.toUpperCase()} 📐</span>
          </button>

        </div>
      )}

      {/* ========================================================================= */}
      {/* STAGE 2: MAPA Y GUÍA DE CORTE PASO A PASO (WORKSHOP MODE)                */}
      {/* ========================================================================= */}
      {currentStage === 'result' && (
        <div className="space-y-8 animate-fadeIn">

          {/* Quick Metrics Bar */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 no-print">
            <div className="bg-white p-5 rounded-2xl border-3 border-amber-800/30 shadow-lg text-center">
              <span className="text-xs font-black text-amber-900 uppercase tracking-wider block">
                Tableros ({activeGroup.materialType})
              </span>
              <span className="text-3xl sm:text-4xl font-black text-amber-950 mt-1 block">
                {activeOptimizationResult.totalSheets}
              </span>
              <span className="text-xs font-bold text-slate-500">
                Hojas de {activeConfig.sheetLengthCm} × {activeConfig.sheetWidthCm} cm
              </span>
            </div>

            <div className="bg-white p-5 rounded-2xl border-3 border-emerald-800/30 shadow-lg text-center">
              <span className="text-xs font-black text-emerald-900 uppercase tracking-wider block">
                Aprovechamiento
              </span>
              <span className="text-3xl sm:text-4xl font-black text-emerald-700 mt-1 block">
                {activeOptimizationResult.overallEfficiencyPercent}%
              </span>
              <span className="text-xs font-bold text-slate-500">
                Desperdicio: {activeOptimizationResult.overallWastePercent}%
              </span>
            </div>

            <div className="bg-white p-5 rounded-2xl border-3 border-blue-800/30 shadow-lg text-center">
              <span className="text-xs font-black text-blue-900 uppercase tracking-wider block">
                Piezas Ubicadas
              </span>
              <span className="text-3xl sm:text-4xl font-black text-blue-800 mt-1 block">
                {activeOptimizationResult.totalPlacedPieces} / {activeOptimizationResult.totalPieces}
              </span>
              <span className="text-xs font-bold text-slate-500">
                100% de cortes resueltos
              </span>
            </div>

            <div className="bg-white p-5 rounded-2xl border-3 border-slate-300 shadow-lg text-center">
              <span className="text-xs font-black text-slate-700 uppercase tracking-wider block">
                Metros Lineales Sierra
              </span>
              <span className="text-3xl sm:text-4xl font-black text-slate-900 mt-1 block">
                {activeOptimizationResult.totalLinearCutMeters} <span className="text-xl">m</span>
              </span>
              <span className="text-xs font-bold text-slate-500">
                Kerf de corte: {activeConfig.sawKerfMm} mm
              </span>
            </div>
          </div>

          {/* Action Bar (PDF Downloads / Reconfigure) */}
          <div className="flex flex-wrap items-center justify-between gap-4 bg-amber-900 text-white p-4 rounded-2xl shadow-lg no-print">
            <div className="flex items-center gap-3">
              <span className="text-2xl">🪚</span>
              <div>
                <p className="text-base font-extrabold text-amber-100">
                  Modo Taller: <span className="text-amber-300 font-black">{activeGroup.displayName}</span> • Corte primario <span className="text-amber-300 underline font-black">{activeConfig.primaryCutDirection === 'largo' ? 'A lo largo (Longitudinal)' : 'A lo ancho (Transversal)'}</span>
                </p>
                <p className="text-xs font-semibold text-amber-200/80">
                  {activeOptimizationResult.totalSheets} Tableros optimizados • {activeOptimizationResult.totalPieces} piezas en este material
                </p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <button
                type="button"
                onClick={() => setCurrentStage('config')}
                className="bg-amber-800 hover:bg-amber-700 text-white px-3.5 py-2.5 rounded-xl text-xs sm:text-sm font-black border border-amber-600 flex items-center gap-2 cursor-pointer transition"
              >
                <Sliders className="w-4 h-4" />
                Parámetros
              </button>

              {/* Botón 1: PDF Planos 2D */}
              <button
                type="button"
                id="btn-descargar-pdf-planos"
                onClick={handleOpenPlanosPdfModal}
                className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2.5 rounded-xl text-xs sm:text-sm font-black border border-indigo-800 flex items-center gap-2 cursor-pointer transition shadow-md"
                title="Previsualizar y Guardar PDF de los Planos 2D de Tableros"
              >
                <Eye className="w-4 h-4 text-indigo-200" />
                <span>PDF Planos 2D ({activeGroup.materialType})</span>
                <Printer className="w-3.5 h-3.5 opacity-80" />
              </button>

              {/* Botón 2: PDF Guía de Corte */}
              <button
                type="button"
                id="btn-descargar-pdf-guia"
                onClick={handleOpenGuiaPdfModal}
                className="bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2.5 rounded-xl text-xs sm:text-sm font-black border border-emerald-800 flex items-center gap-2 cursor-pointer transition shadow-md"
                title="Previsualizar y Guardar PDF de la Guía de Corte Paso a Paso"
              >
                <Eye className="w-4 h-4 text-emerald-200" />
                <span>PDF Guía de Corte</span>
                <Printer className="w-3.5 h-3.5 opacity-80" />
              </button>
            </div>
          </div>

          {/* Board Selector Tabs (if multi-board in current material) */}
          {activeOptimizationResult.boards.length > 1 && (
            <div className="flex items-center gap-3 overflow-x-auto pb-2 no-print">
              <span className="text-sm font-black text-slate-800 shrink-0">
                Seleccionar Tablero ({activeGroup.materialType}):
              </span>
              {activeOptimizationResult.boards.map(b => (
                <button
                  key={b.boardIndex}
                  onClick={() => setSelectedBoardIndex(b.boardIndex)}
                  className={`px-5 py-3 rounded-2xl font-black text-base transition shrink-0 border-2 cursor-pointer ${
                    selectedBoardIndex === b.boardIndex
                      ? 'bg-amber-800 text-white border-amber-950 shadow-lg scale-105'
                      : 'bg-white text-slate-700 border-slate-300 hover:bg-amber-50'
                  }`}
                >
                  Tablero #{b.boardIndex} ({b.efficiencyPercent}% uso • {b.placedPieces.length} piezas)
                </button>
              ))}
            </div>
          )}

          {/* 2D VISUAL BOARD DIAGRAM (SVG WORKSHOP CANVAS) */}
          {activeBoard && (
            <div 
              id="contenedor-planos-2d" 
              className="bg-white rounded-3xl border-4 border-amber-900/20 shadow-2xl p-6 sm:p-8 space-y-6"
            >
              
              <div className="flex flex-col gap-4 border-b border-slate-200 pb-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="bg-amber-700 text-white text-xs font-black px-2.5 py-0.5 rounded-lg uppercase">
                        {activeGroup.displayName}
                      </span>
                    </div>
                    <h3 className="text-2xl font-black text-slate-900 flex items-center gap-3 mt-1">
                      <Layers className="w-7 h-7 text-amber-700" />
                      Plano de Corte 2D: Tablero #{activeBoard.boardIndex} de {activeOptimizationResult.totalSheets} ({activeGroup.materialType})
                    </h3>
                    <p className="text-sm font-bold text-slate-600 mt-0.5">
                      Dimensión: {activeBoard.sheetLengthCm} × {activeBoard.sheetWidthCm} cm • {activeBoard.placedPieces.length} piezas • Sincronizado en tiempo real con la Guía de Taller
                    </p>
                  </div>
                </div>

                {/* FURNITURE COLOR CODE LEGEND & WORKSHOP STATES */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 bg-amber-50/70 p-4 rounded-2xl border border-amber-200">
                  {/* Dynamic Furniture Colors */}
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-xs font-black text-amber-950 uppercase tracking-wide flex items-center gap-1.5">
                      🎨 Código por Mueble:
                    </span>
                    {(Object.entries(furnitureColorMap) as [string, FurniturePalette][]).map(([fName, pal]) => (
                      <span
                        key={fName}
                        className={`text-xs font-black px-3 py-1 rounded-xl border-2 flex items-center gap-1.5 shadow-xs transition ${pal.lightBg}`}
                      >
                        <span className={`w-3.5 h-3.5 rounded-full ${pal.accentDot} border border-white shadow-xs`} />
                        {fName}
                      </span>
                    ))}
                  </div>

                  {/* Workshop Cutting State Badges */}
                  <div className="flex flex-wrap items-center gap-2 text-xs font-black shrink-0">
                    <span className="px-2.5 py-1 rounded-lg bg-white text-slate-700 border border-slate-300">
                      Color Mueble = Pendiente
                    </span>
                    <span className="px-2.5 py-1 rounded-lg bg-sky-200 text-sky-950 border border-sky-400 font-extrabold flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5 text-sky-700" /> Tira en Proceso (Fase A)
                    </span>
                    <span className="px-2.5 py-1 rounded-lg bg-emerald-500 text-white font-extrabold shadow flex items-center gap-1">
                      <Check className="w-3.5 h-3.5 stroke-[3]" /> Pieza Cortada (Fase B)
                    </span>
                  </div>
                </div>
              </div>

              {/* 2D Interactive Board Graphic */}
              <div className="w-full overflow-x-auto p-4 bg-slate-900 rounded-2xl shadow-inner flex justify-center">
                <div className="relative min-w-[720px] max-w-[1050px] w-full aspect-[244/122] bg-amber-950/70 rounded-xl p-3 border-4 border-amber-500 shadow-2xl">
                  
                  {/* SVG Rendering Board Pieces */}
                  <svg
                    viewBox={`0 0 ${activeBoard.sheetLengthCm} ${activeBoard.sheetWidthCm}`}
                    className="w-full h-full bg-amber-100/90 rounded-lg overflow-hidden border border-amber-950"
                  >
                    {/* Background Grid Lines & Patterns */}
                    <defs>
                      <pattern id="grid" width="20" height="20" patternUnits="userSpaceOnUse">
                        <path d="M 20 0 L 0 0 0 20" fill="none" stroke="#cbd5e1" strokeWidth="0.4" />
                      </pattern>
                      <pattern id="stripInProgressPattern" width="10" height="10" patternTransform="rotate(45 0 0)" patternUnits="userSpaceOnUse">
                        <line x1="0" y1="0" x2="0" y2="10" stroke="#bae6fd" strokeWidth="2.5" />
                      </pattern>
                    </defs>
                    <rect width="100%" height="100%" fill="url(#grid)" />

                    {/* Placed Pieces */}
                    {activeBoard.placedPieces.map((piece) => {
                      const edges = piece.edges || {};
                      const isPieceCut = !!cutPieceIds[piece.id];
                      const isStripCut = !!(piece.stripId && cutStripIds[piece.stripId]);
                      const isSelected = selectedPieceId === piece.id;
                      const fPalette = furnitureColorMap[piece.furnitureName || 'Mueble General'] || FURNITURE_PALETTES[0];

                      let fillColor = fPalette.fill;
                      let strokeColor = fPalette.stroke;
                      let strokeWidth = 1.0;

                      if (isPieceCut) {
                        fillColor = '#10b981'; // Emerald 500
                        strokeColor = '#047857'; // Emerald 700
                        strokeWidth = 1.4;
                      } else if (isStripCut) {
                        fillColor = '#93c5fd'; // Blue 300 (Tira en Proceso)
                        strokeColor = fPalette.stroke;
                        strokeWidth = 1.3;
                      }

                      if (isSelected) {
                        strokeColor = '#dc2626'; // Red highlight ring
                        strokeWidth = 2.4;
                      }

                      return (
                        <g 
                          key={piece.id} 
                          className="transition-all cursor-pointer group"
                          onClick={() => {
                            setSelectedPieceId(isSelected ? null : piece.id);
                          }}
                        >
                          {/* Piece Rectangle */}
                          <rect
                            x={piece.x}
                            y={piece.y}
                            width={piece.lengthCm}
                            height={piece.widthCm}
                            fill={fillColor}
                            stroke={strokeColor}
                            strokeWidth={strokeWidth}
                            rx="0.6"
                          />

                          {/* Edge Banding Highlights */}
                          {edges.top && (
                            <line
                              x1={piece.x}
                              y1={piece.y}
                              x2={piece.x + piece.lengthCm}
                              y2={piece.y}
                              stroke="#059669"
                              strokeWidth="2.4"
                            />
                          )}
                          {edges.bottom && (
                            <line
                              x1={piece.x}
                              y1={piece.y + piece.widthCm}
                              x2={piece.x + piece.lengthCm}
                              y2={piece.y + piece.widthCm}
                              stroke="#059669"
                              strokeWidth="2.4"
                            />
                          )}
                          {edges.left && (
                            <line
                              x1={piece.x}
                              y1={piece.y}
                              x2={piece.x}
                              y2={piece.y + piece.widthCm}
                              stroke="#059669"
                              strokeWidth="2.4"
                            />
                          )}
                          {edges.right && (
                            <line
                              x1={piece.x + piece.lengthCm}
                              y1={piece.y}
                              x2={piece.x + piece.lengthCm}
                              y2={piece.y + piece.widthCm}
                              stroke="#059669"
                              strokeWidth="2.4"
                            />
                          )}

                          {/* Text Labels inside Piece */}
                          {piece.lengthCm >= 12 && piece.widthCm >= 8 && (
                            <g pointerEvents="none">
                              {/* Furniture Name Badge */}
                              {piece.lengthCm >= 18 && piece.widthCm >= 12 && (
                                <g>
                                  <rect
                                    x={piece.x + (piece.lengthCm / 2) - Math.min(piece.lengthCm * 0.42, 26)}
                                    y={piece.y + 2}
                                    width={Math.min(piece.lengthCm * 0.84, 52)}
                                    height="4.2"
                                    rx="1"
                                    fill={fPalette.badgeBg}
                                  />
                                  <text
                                    x={piece.x + (piece.lengthCm / 2)}
                                    y={piece.y + 4.2}
                                    textAnchor="middle"
                                    dominantBaseline="middle"
                                    fontSize="2.4"
                                    fontWeight="900"
                                    fill={fPalette.badgeText}
                                  >
                                    [{piece.furnitureName || 'Mueble'}]
                                  </text>
                                </g>
                              )}

                              {/* Piece Name */}
                              <text
                                x={piece.x + (piece.lengthCm / 2)}
                                y={piece.y + (piece.widthCm / 2) - 1}
                                textAnchor="middle"
                                dominantBaseline="middle"
                                fontSize="3.2"
                                fontWeight="900"
                                fill={isPieceCut ? '#ffffff' : '#0f172a'}
                              >
                                {piece.name.length > 24 ? piece.name.substring(0, 22) + '...' : piece.name}
                              </text>

                              {/* Dimensions Label */}
                              <text
                                x={piece.x + (piece.lengthCm / 2)}
                                y={piece.y + (piece.widthCm / 2) + 3.8}
                                textAnchor="middle"
                                dominantBaseline="middle"
                                fontSize="2.8"
                                fontWeight="800"
                                fill={isPieceCut ? '#f0fdf4' : '#334155'}
                              >
                                {piece.originalLength} × {piece.originalWidth} cm {piece.rotated ? '↺' : ''}
                              </text>
                            </g>
                          )}
                        </g>
                      );
                    })}

                    {/* Render Usable Offcuts Area */}
                    {activeBoard.offcuts.filter(o => o.isUsable).map(off => (
                      <g key={off.id} className="opacity-90">
                        <rect
                          x={off.x}
                          y={off.y}
                          width={off.lengthCm}
                          height={off.widthCm}
                          fill="#ecfdf5"
                          stroke="#10b981"
                          strokeWidth="0.8"
                          strokeDasharray="2 2"
                        />
                        {off.lengthCm >= 20 && off.widthCm >= 15 && (
                          <text
                            x={off.x + (off.lengthCm / 2)}
                            y={off.y + (off.widthCm / 2)}
                            textAnchor="middle"
                            dominantBaseline="middle"
                            fontSize="3.2"
                            fontWeight="900"
                            fill="#059669"
                          >
                            ♻ Retazo {off.lengthCm}×{off.widthCm} cm
                          </text>
                        )}
                      </g>
                    ))}
                  </svg>
                </div>
              </div>

              {/* RECUADRO DE INFORMACIÓN Y AJUSTES MANUALES AL TOCAR UNA PIEZA */}
              {selectedPiece && (
                <div className="bg-gradient-to-r from-amber-500/15 via-orange-500/10 to-amber-500/15 border-3 border-amber-600 rounded-3xl p-5 sm:p-6 shadow-xl animate-fadeIn space-y-4 no-print">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="flex items-start sm:items-center gap-3">
                      <div className="w-12 h-12 rounded-2xl bg-amber-600 text-white flex items-center justify-center text-2xl font-black shrink-0 shadow-md">
                        📍
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className={`text-xs font-black px-2.5 py-0.5 rounded-lg border uppercase ${furnitureColorMap[selectedPiece.furnitureName || 'Mueble General']?.lightBg || 'bg-amber-800 text-amber-100'}`}>
                            {selectedPiece.furnitureName || 'Mueble'}
                          </span>
                          <span className="text-xs font-bold text-slate-500">
                            Tablero #{selectedPiece.boardIndex || selectedBoardIndex} ({activeGroup.materialType})
                          </span>
                          {/* Visual Status Pill */}
                          {cutPieceIds[selectedPiece.id] ? (
                            <span className="bg-emerald-600 text-white text-xs font-black px-2.5 py-0.5 rounded-lg flex items-center gap-1">
                              <Check className="w-3.5 h-3.5 stroke-[3]" /> Pieza Terminada (Fase B)
                            </span>
                          ) : selectedPiece.stripId && cutStripIds[selectedPiece.stripId] ? (
                            <span className="bg-sky-600 text-white text-xs font-black px-2.5 py-0.5 rounded-lg flex items-center gap-1">
                              <Clock className="w-3.5 h-3.5" /> Tira en Proceso (Fase A lista)
                            </span>
                          ) : (
                            <span className="bg-slate-200 text-slate-700 text-xs font-black px-2.5 py-0.5 rounded-lg">
                              Pendiente de Corte
                            </span>
                          )}
                        </div>
                        <h4 className="text-xl sm:text-2xl font-black text-slate-900 mt-0.5">
                          {selectedPiece.name} — <span className="text-blue-700">{selectedPiece.originalLength} cm</span> × <span className="text-orange-700">{selectedPiece.originalWidth} cm</span>
                        </h4>
                      </div>
                    </div>

                    {/* Close Selection */}
                    <button
                      onClick={() => setSelectedPieceId(null)}
                      className="self-end sm:self-center p-2 text-slate-500 hover:text-slate-900 bg-white rounded-xl border border-slate-300 cursor-pointer"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  </div>

                  {/* Step Location & 2-Phase Controls */}
                  <div className="bg-white p-5 rounded-2xl border-2 border-amber-300 shadow-sm space-y-4">
                    {pieceToStepMap.has(selectedPiece.id) ? (
                      (() => {
                        const stepInfo = pieceToStepMap.get(selectedPiece.id)!;
                        const isStripDone = !!(selectedPiece.stripId && cutStripIds[selectedPiece.stripId]);
                        const isPieceDone = !!cutPieceIds[selectedPiece.id];

                        return (
                          <div className="space-y-3">
                            <div className="text-sm sm:text-base font-black text-slate-900 flex items-center gap-2 flex-wrap">
                              <span>📍 Ubicación en la Guía:</span>
                              <span className="text-amber-800 bg-amber-100 px-2.5 py-0.5 rounded-lg">Paso #{stepInfo.step.stepNumber}</span>
                              <span className="text-slate-700 bg-slate-100 px-2 py-0.5 rounded-lg text-xs font-black">Tablero #{stepInfo.step.boardIndex}</span>
                              <span className="text-amber-950 bg-amber-300 border border-amber-400 px-2.5 py-0.5 rounded-lg text-xs font-black">
                                ✍️ Marca de Tira: {stepInfo.step.pencilMark}
                              </span>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                              {/* Fase A Status */}
                              <div className={`p-3 rounded-xl border-2 flex items-center justify-between gap-3 ${
                                isStripDone ? 'bg-sky-50 border-sky-400' : 'bg-slate-50 border-slate-200'
                              }`}>
                                <div>
                                  <span className="text-xs font-black text-sky-900 uppercase block">Fase A (Corte de Tira):</span>
                                  <span className="text-sm font-extrabold text-slate-800">
                                    Tira a {stepInfo.step.fenceMeasureCm} cm
                                  </span>
                                </div>
                                <button
                                  type="button"
                                  onClick={() => selectedPiece.stripId && toggleStripCut(selectedPiece.stripId)}
                                  className={`px-3 py-1.5 rounded-lg text-xs font-black flex items-center gap-1 cursor-pointer transition ${
                                    isStripDone ? 'bg-sky-600 text-white' : 'bg-white border border-slate-300 text-slate-700'
                                  }`}
                                >
                                  {isStripDone ? '✓ Tira Sacada' : 'Marcar Tira'}
                                </button>
                              </div>

                              {/* Fase B Status */}
                              <div className={`p-3 rounded-xl border-2 flex items-center justify-between gap-3 ${
                                isPieceDone ? 'bg-emerald-50 border-emerald-400' : 'bg-slate-50 border-slate-200'
                              }`}>
                                <div>
                                  <span className="text-xs font-black text-emerald-900 uppercase block">Fase B (Corte Transversal):</span>
                                  <span className="text-sm font-extrabold text-slate-800">
                                    Corte a {stepInfo.individualCut?.cutMeasureCm || selectedPiece.originalLength} cm
                                  </span>
                                </div>
                                <button
                                  type="button"
                                  onClick={() => togglePieceCut(selectedPiece.id, selectedPiece.stripId)}
                                  className={`px-3 py-1.5 rounded-lg text-xs font-black flex items-center gap-1 cursor-pointer transition ${
                                    isPieceDone ? 'bg-emerald-600 text-white' : 'bg-emerald-600 text-white hover:bg-emerald-700'
                                  }`}
                                >
                                  {isPieceDone ? '✓ Pieza Terminada' : 'Marcar Pieza'}
                                </button>
                              </div>
                            </div>
                          </div>
                        );
                      })()
                    ) : (
                      <p className="text-sm font-bold text-slate-700">
                        📍 Corte directo en Tablero #{selectedPiece.boardIndex || selectedBoardIndex}
                      </p>
                    )}
                  </div>

                  {/* Quick Action Buttons: Girar 90° y Mover */}
                  <div className="flex flex-wrap items-center gap-3 pt-1">
                    <span className="text-xs font-black text-slate-700 uppercase tracking-wider">
                      Ajustes Manuales de Taller:
                    </span>
                    <button
                      type="button"
                      onClick={handleRotateSelectedPiece}
                      className="bg-purple-700 hover:bg-purple-800 text-white font-black text-xs sm:text-sm px-4 py-2.5 rounded-xl flex items-center gap-2 shadow cursor-pointer transition"
                      title="Girar 90 grados la pieza y recalcular mapa"
                    >
                      <RotateCw className="w-4 h-4" />
                      🔄 Girar 90°
                    </button>
                    <button
                      type="button"
                      onClick={handleReorderPiece}
                      className="bg-blue-700 hover:bg-blue-800 text-white font-black text-xs sm:text-sm px-4 py-2.5 rounded-xl flex items-center gap-2 shadow cursor-pointer transition"
                      title="Reordenar prioridad de empaquetado para cambiar de tablero"
                    >
                      <ArrowRightLeft className="w-4 h-4" />
                      ↔️ Mover / Reubicar en Distribución
                    </button>
                  </div>
                </div>
              )}

              {/* Usable Generated Offcuts Quick Save Buttons */}
              {activeBoard.offcuts.filter(o => o.isUsable).length > 0 && (
                <div className="bg-emerald-50 border-2 border-emerald-300 rounded-2xl p-4 flex flex-col sm:flex-row items-center justify-between gap-4 no-print">
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">📦</span>
                    <div>
                      <h4 className="text-base font-black text-emerald-950">
                        Sobrantes Aprovechables Generados en Tablero #{activeBoard.boardIndex} ({activeGroup.materialType}):
                      </h4>
                      <p className="text-xs font-bold text-emerald-800">
                        Presiona para guardar el retazo con confirmación visual directa en el inventario:
                      </p>
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    {activeBoard.offcuts.filter(o => o.isUsable).map(off => (
                      <button
                        key={off.id}
                        type="button"
                        onClick={() => handleSaveOffcutToInventory(off.lengthCm, off.widthCm)}
                        className="bg-emerald-700 hover:bg-emerald-800 text-white font-black text-xs px-4 py-2.5 rounded-xl flex items-center gap-2 shadow cursor-pointer transition transform active:scale-95"
                      >
                        <Save className="w-4 h-4 text-emerald-200" />
                        Guardar Retazo {off.lengthCm} × {off.widthCm} cm
                      </button>
                    ))}
                  </div>
                </div>
              )}

            </div>
          )}

          {/* ========================================================================= */}
          {/* GUÍA DE CORTE: AGRUPADA POR MEDIDA DE REGLA UNIFICADA                     */}
          {/* ========================================================================= */}
          <div 
            id="contenedor-guia-corte" 
            className="bg-white rounded-3xl border-4 border-amber-900/20 shadow-2xl p-6 sm:p-8 space-y-6"
          >
            
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-4">
              <div>
                <div className="flex items-center gap-2">
                  <span className="bg-amber-500 text-amber-950 text-xs font-black px-3 py-1 rounded-full uppercase tracking-wider">
                    Agrupación Inteligente de Regla
                  </span>
                  <span className="text-xs font-black text-amber-900 bg-amber-100 border border-amber-300 px-3 py-0.5 rounded-full">
                    Material: {activeGroup.displayName}
                  </span>
                </div>
                <h3 className="text-2xl sm:text-3xl font-black text-slate-900 mt-1">
                  Guía de Corte Unificada por Posición de Sierra
                </h3>
                <p className="text-sm font-bold text-slate-600 mt-0.5">
                  Ajusta la regla una sola vez y pasa todos los tableros de {activeGroup.materialType} que lleven esa misma medida.
                </p>
              </div>

              <button
                type="button"
                onClick={() => {
                  const firstGroup = fenceGroupedSteps[0];
                  if (firstGroup) {
                    speakStep(`Iniciando secuencia para ${activeGroup.materialType}. Ajusta tu regla a ${firstGroup.fenceMeasureCm} centímetros para ${firstGroup.totalStrips} tiras en total.`);
                  }
                }}
                className="bg-amber-100 hover:bg-amber-200 text-amber-950 font-black px-4 py-2.5 rounded-xl border-2 border-amber-300 flex items-center gap-2 cursor-pointer transition shadow-sm text-sm no-print"
              >
                <Volume2 className="w-5 h-5 text-amber-700" />
                Leer Secuencia en Voz Alta 🔊
              </button>
            </div>

            {/* ========================================================================= */}
            {/* 📌 PASO 1 PRIORITARIO: EXTRAER Y CORTAR PIEZAS DE PEDACERÍA EN ALMACÉN */}
            {/* ========================================================================= */}
            <div className={`rounded-3xl border-4 transition-all shadow-xl overflow-hidden print-avoid-break ${
              allOffcutPiecesCut 
                ? 'bg-emerald-50/70 border-emerald-500' 
                : offcutsTotalCount > 0
                ? 'bg-amber-50/80 border-amber-500 ring-4 ring-amber-400/30'
                : 'bg-slate-50 border-slate-300'
            }`}>
              {/* Header Paso 1 */}
              <div className="p-5 sm:p-6 bg-gradient-to-r from-amber-900 via-orange-950 to-slate-900 text-white flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                  <div className={`w-14 h-14 rounded-2xl flex items-center justify-center font-black text-2xl border-2 shadow-lg shrink-0 ${
                    allOffcutPiecesCut
                      ? 'bg-emerald-600 text-white border-emerald-300'
                      : 'bg-amber-400 text-amber-950 border-amber-200'
                  }`}>
                    {allOffcutPiecesCut ? <Check className="w-8 h-8 stroke-[3]" /> : '📌 1'}
                  </div>

                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-xs font-black bg-amber-400 text-amber-950 px-3 py-1 rounded-lg uppercase tracking-wider">
                        Paso 1 Primordial
                      </span>
                      <span className="text-xs font-extrabold text-amber-200 bg-amber-900/80 border border-amber-700/60 px-2.5 py-0.5 rounded-lg">
                        Prioridad Máxima en Taller
                      </span>
                      {allOffcutPiecesCut && (
                        <span className="text-xs font-black bg-emerald-500 text-white px-2.5 py-0.5 rounded-lg">
                          ✓ Pedacería 100% Cortada
                        </span>
                      )}
                    </div>
                    <h4 className="text-2xl sm:text-3xl font-black text-white mt-1.5 flex items-center gap-2 flex-wrap">
                      <span>📌 PASO 1: EXTRAER Y CORTAR PIEZAS DE PEDACERÍA EN ALMACÉN</span>
                    </h4>
                    <p className="text-xs sm:text-sm font-semibold text-amber-200/90 mt-0.5">
                      {offcutsTotalCount > 0
                        ? `Corta primero estas ${offcutsTotalCount} pieza(s) de tus retazos de almacén antes de iniciar en hojas completas para ahorrar material y costo.`
                        : `No hay retazos asignados para ${activeGroup.displayName}. El corte iniciará directamente en tableros completos nuevos a continuación.`}
                    </p>
                  </div>
                </div>

                {/* Header Actions */}
                {offcutsTotalCount > 0 && (
                  <div className="flex items-center gap-3 shrink-0 self-end md:self-center">
                    <div className="text-right">
                      <span className="text-[10px] font-black uppercase text-amber-300 block">Progreso Retazos</span>
                      <span className="text-xl sm:text-2xl font-black text-amber-950 bg-amber-400 px-4 py-1 rounded-xl border border-amber-200 shadow-inner block">
                        {offcutsCompletedCount} / {offcutsTotalCount}
                      </span>
                    </div>

                    <button
                      type="button"
                      onClick={() => {
                        speakStep(`Paso 1 prioritario: Tienes ${offcutsTotalCount} piezas asignadas a pedacería de almacén en ${activeGroup.materialType}. Debes cortarlas antes de pasar a los tableros nuevos.`);
                      }}
                      className="p-3 bg-slate-800 hover:bg-slate-700 text-amber-300 rounded-2xl border border-slate-700 shadow-sm transition cursor-pointer no-print"
                      title="Escuchar instrucción por voz"
                    >
                      <Volume2 className="w-5 h-5" />
                    </button>
                  </div>
                )}
              </div>

              {/* Content Paso 1 */}
              <div className="p-6 sm:p-7 space-y-4">
                {offcutsTotalCount === 0 ? (
                  <div className="bg-white p-5 rounded-2xl border border-slate-200 text-center space-y-2">
                    <span className="text-3xl block">🪵</span>
                    <h5 className="text-base font-black text-slate-800">No hay piezas asignadas a pedacería en este material</h5>
                    <p className="text-xs font-semibold text-slate-500 max-w-md mx-auto">
                      Todas las piezas de {activeGroup.displayName} se cortarán optimizadas directamente en las hojas completas del Paso 2 a continuación.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <div className="text-xs sm:text-sm font-extrabold text-amber-950 bg-amber-100/90 border border-amber-300 p-3.5 rounded-2xl flex items-center justify-between flex-wrap gap-2">
                      <span>
                        👉 <strong>Instrucción de Taller:</strong> Localiza cada retazo en tu almacén, haz el corte según las medidas y marca la casilla correspondiente.
                      </span>
                      <span className="text-xs font-bold text-amber-900 bg-amber-200/80 px-3 py-1 rounded-lg">
                        {allOffcutPiecesCut ? '🎉 ¡Todas listas para armar!' : `⏳ Faltan ${offcutsTotalCount - offcutsCompletedCount} por cortar`}
                      </span>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5 pt-1">
                      {projectAssignedOffcuts.map((record) => {
                        const isCut = !!cutOffcutPieceIds[record.offcutId];
                        return (
                          <div
                            key={record.offcutId}
                            className={`p-4 sm:p-5 rounded-2xl border-3 transition-all flex flex-col justify-between gap-3 ${
                              isCut
                                ? 'bg-emerald-50/90 border-emerald-500 shadow-sm'
                                : 'bg-white border-amber-300 hover:border-amber-400 shadow-md ring-1 ring-amber-200'
                            }`}
                          >
                            <div>
                              <div className="flex items-start justify-between gap-2">
                                <div className="flex items-center gap-2 flex-wrap">
                                  <span className="text-xs font-black bg-amber-200 text-amber-950 px-2.5 py-0.5 rounded-md border border-amber-300">
                                    {record.offcutLabel || `Retazo #${record.offcutNumber}`}
                                  </span>
                                  {record.furnitureName && (
                                    <span className="text-xs font-bold bg-slate-100 text-slate-800 px-2 py-0.5 rounded-md border border-slate-300">
                                      {record.furnitureName}
                                    </span>
                                  )}
                                  <span className="text-[11px] font-bold text-amber-900 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                                    {record.thicknessMm} mm
                                  </span>
                                </div>

                                <button
                                  type="button"
                                  onClick={() => handleUnassignOffcut(record.offcutId)}
                                  className="text-[11px] font-bold text-slate-400 hover:text-rose-600 hover:bg-rose-50 px-2 py-0.5 rounded-lg border border-transparent hover:border-rose-200 transition cursor-pointer no-print"
                                  title="Liberar retazo y devolver al almacén"
                                >
                                  Liberar ✕
                                </button>
                              </div>

                              <h5 className={`text-base sm:text-lg font-black mt-2 ${isCut ? 'line-through text-slate-500' : 'text-slate-900'}`}>
                                🧩 {record.pieceName}
                              </h5>

                              <div className="mt-2 space-y-1 text-xs font-semibold text-slate-700">
                                <p className="flex items-center gap-1.5 font-black text-slate-900">
                                  <span>📏 Medida a Cortar:</span>
                                  <span className="text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-md text-sm font-black border border-emerald-300">
                                    {record.usedLengthCm} × {record.usedWidthCm} cm
                                  </span>
                                </p>
                                <p className="text-slate-600">
                                  📐 Retazo inicial: <strong>{record.originalLengthCm} × {record.originalWidthCm} cm</strong>
                                </p>
                                <p className="text-slate-600">
                                  ✂️ Sentido: <strong>{record.cutDirection === 'longitudinal' ? 'A lo largo' : 'A lo ancho'}</strong> • Sobrante útil: <strong>{record.remainingLengthCm} × {record.remainingWidthCm} cm</strong> ({record.action === 'save_remaining' ? 'Guardado en Almacén' : 'Desechado'})
                                </p>
                              </div>
                            </div>

                            {/* Botón Interactivo Marcar como Cortada de Retazo */}
                            <div className="flex items-center justify-between gap-2 pt-2 border-t border-slate-200">
                              <button
                                type="button"
                                onClick={() => toggleCutOffcutPiece(record.offcutId)}
                                className={`flex-1 py-3 px-4 rounded-xl text-xs sm:text-sm font-black flex items-center justify-center gap-2 cursor-pointer transition shadow-sm ${
                                  isCut
                                    ? 'bg-emerald-600 hover:bg-emerald-700 text-white border-2 border-emerald-700'
                                    : 'bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-amber-950 border-2 border-amber-600 shadow-md active:scale-98'
                                }`}
                              >
                                {isCut ? (
                                  <>
                                    <Check className="w-5 h-5 stroke-[3]" />
                                    <span>[✓] Cortada de Retazo #{record.offcutNumber}</span>
                                  </>
                                ) : (
                                  <>
                                    <span className="w-4 h-4 rounded border-2 border-amber-950 inline-block bg-white/70"></span>
                                    <span>[ ] Marcar como Cortada de Retazo</span>
                                  </>
                                )}
                              </button>

                              <button
                                type="button"
                                onClick={() => {
                                  speakStep(`Pieza ${record.pieceName}, cortar a ${record.usedLengthCm} por ${record.usedWidthCm} centímetros del ${record.offcutLabel || 'retazo'}.`);
                                }}
                                className="p-2.5 text-slate-500 hover:text-amber-800 bg-slate-100 hover:bg-amber-100 rounded-xl border border-slate-300 cursor-pointer transition no-print"
                                title="Escuchar medida"
                              >
                                <Volume2 className="w-4 h-4" />
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* AVISO DE BLOQUEO PREVENTIVO PARA PASO 2 SI HAY RETAZOS PENDIENTES */}
            {isHojasCompletasLocked && (
              <div className="bg-amber-100 border-4 border-amber-500 rounded-3xl p-5 sm:p-6 text-amber-950 space-y-3 shadow-lg no-print">
                <div className="flex items-start justify-between gap-4 flex-wrap">
                  <div className="flex items-center gap-3">
                    <span className="text-3xl">🔒</span>
                    <div>
                      <h4 className="text-lg sm:text-xl font-black">
                        Paso 2 en Hojas Completas Bloqueado Preventivamente
                      </h4>
                      <p className="text-xs sm:text-sm font-bold text-amber-900 mt-0.5">
                        Debes extraer y marcar como cortadas las <strong>{offcutsTotalCount - offcutsCompletedCount} pieza(s)</strong> de pedacería en el <strong>PASO 1</strong> arriba antes de iniciar los cortes en tableros nuevos.
                      </p>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => setBypassOffcutsLock(true)}
                    className="px-4 py-2 bg-amber-950 text-white hover:bg-black font-black text-xs rounded-xl shadow cursor-pointer transition flex items-center gap-1.5"
                  >
                    <span>🔓 Omitir y Desbloquear Hojas Completas</span>
                  </button>
                </div>
              </div>
            )}

            {/* ENCABEZADO DE PASO 2: HOJAS COMPLETAS NUEVAS */}
            <div className="pt-2 border-t-2 border-slate-200">
              <div className="flex items-center gap-2">
                <span className="bg-slate-900 text-white text-xs font-black px-3 py-1 rounded-full uppercase tracking-wider">
                  Paso 2: Tableros Nuevos
                </span>
                <span className="text-xs font-black text-slate-700 bg-slate-100 border border-slate-300 px-3 py-0.5 rounded-full">
                  {fenceGroupedSteps.length} Posiciones de Regla
                </span>
              </div>
              <h3 className="text-xl sm:text-2xl font-black text-slate-900 mt-1">
                📌 PASO 2: CORTE EN HOJAS COMPLETAS (AGRUPADO POR POSICIÓN DE REGLA)
              </h3>
              <p className="text-xs sm:text-sm font-semibold text-slate-600">
                Ajusta la regla una sola vez para cada grupo de tiras y saca las piezas en serie.
              </p>
            </div>

            {/* List of Fence-Grouped Step Blocks */}
            <div className={`space-y-8 ${isHojasCompletasLocked ? 'opacity-50 pointer-events-none filter grayscale-50 select-none' : ''}`}>
              {fenceGroupedSteps.map((group, groupIdx) => {
                const allStripsInGroupCut = group.strips.every(s => cutStripIds[s.stripId]);
                const allPiecesInGroupCut = group.strips.every(s => 
                  s.individualCuts.length > 0 && s.individualCuts.every(c => cutPieceIds[c.placedPieceId])
                );

                return (
                  <div
                    key={`fence_group_${groupIdx}_${group.fenceMeasureCm}`}
                    className={`rounded-3xl border-4 transition-all shadow-xl overflow-hidden print-avoid-break ${
                      allPiecesInGroupCut
                        ? 'bg-emerald-50/70 border-emerald-500'
                        : allStripsInGroupCut
                        ? 'bg-sky-50/60 border-sky-500'
                        : 'bg-slate-50 border-amber-400/80 shadow-md'
                    }`}
                  >
                    {/* FENCE GROUP HEADER */}
                    <div className="p-5 sm:p-6 bg-gradient-to-r from-slate-900 via-slate-800 to-amber-950 text-white flex flex-col md:flex-row md:items-center justify-between gap-4">
                      <div className="flex items-center gap-4">
                        <div className={`w-14 h-14 rounded-2xl flex items-center justify-center font-black text-2xl border-2 shadow-lg ${
                          allPiecesInGroupCut
                            ? 'bg-emerald-600 text-white border-emerald-300'
                            : 'bg-amber-500 text-amber-950 border-amber-300'
                        }`}>
                          {allPiecesInGroupCut ? <Check className="w-8 h-8 stroke-[3]" /> : `🟡 ${groupIdx + 1}`}
                        </div>

                        <div>
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="text-xs font-black bg-amber-400 text-amber-950 px-3 py-1 rounded-lg uppercase tracking-wider">
                              Posición #{groupIdx + 1} de la Guía
                            </span>
                            <span className="text-xs font-extrabold text-amber-200 bg-amber-900/60 border border-amber-700/50 px-2.5 py-0.5 rounded-lg">
                              {group.direction === 'largo' ? `Cortes a lo largo (${activeConfig.sheetLengthCm} cm)` : `Cortes a lo ancho (${activeConfig.sheetWidthCm} cm)`}
                            </span>
                            {allPiecesInGroupCut && (
                              <span className="text-xs font-black bg-emerald-500 text-white px-2.5 py-0.5 rounded-lg">
                                ✓ Grupo 100% Terminado
                              </span>
                            )}
                          </div>
                          <h4 className="text-2xl sm:text-3xl font-black text-white mt-1.5 flex items-center gap-2 flex-wrap">
                            <span>🟡 AJUSTA TU REGLA A:</span>
                            <span className="text-amber-300 underline decoration-amber-400">{group.fenceMeasureCm} cm</span>
                            <span className="text-lg font-bold text-amber-200/90">
                              ({group.totalStrips} {group.totalStrips === 1 ? 'Tira en total' : 'Tiras en total'})
                            </span>
                          </h4>
                        </div>
                      </div>

                      {/* Header Actions & Big Badge */}
                      <div className="flex items-center gap-3 shrink-0 self-end md:self-center">
                        <div className="text-right">
                          <span className="text-[10px] font-black uppercase text-amber-300 block">Medida Fija de Regla</span>
                          <span className="text-2xl sm:text-3xl font-black text-amber-950 bg-amber-400 px-5 py-1.5 rounded-2xl border-2 border-amber-200 shadow-inner block">
                            {group.fenceMeasureCm} cm
                          </span>
                        </div>

                        <button
                          type="button"
                          onClick={() => speakStep(`Ajusta tu regla a ${group.fenceMeasureCm} centímetros. Pasarás ${group.totalStrips} tiras en los tableros de ${activeGroup.materialType}.`)}
                          className="p-3 bg-slate-800 hover:bg-slate-700 text-amber-300 rounded-2xl border border-slate-700 shadow-sm transition cursor-pointer no-print"
                          title="Escuchar instrucción por voz"
                        >
                          <Volume2 className="w-5 h-5" />
                        </button>
                      </div>
                    </div>

                    {/* STRIPS LIST UNDER THIS UNIFIED FENCE MEASURE */}
                    <div className="p-6 sm:p-7 space-y-6">
                      <div className="text-xs sm:text-sm font-extrabold text-slate-700 flex items-center gap-2 bg-amber-100/70 border border-amber-300/80 p-3 rounded-2xl">
                        <span className="text-base">📋</span>
                        <span>
                          Sin mover la regla de <b>{group.fenceMeasureCm} cm</b>, pasa consecutivamente los siguientes tableros y marca cada tira con lápiz para no confundirlas:
                        </span>
                      </div>

                      {group.strips.map((step) => {
                        const isStripCut = !!cutStripIds[step.stripId];
                        const allPiecesInStripCut = step.individualCuts.length > 0 && step.individualCuts.every(c => cutPieceIds[c.placedPieceId]);

                        return (
                          <div
                            key={`strip_${step.stripId}`}
                            className={`rounded-2xl border-3 transition-all shadow-md overflow-hidden print-avoid-break ${
                              allPiecesInStripCut
                                ? 'bg-emerald-50/80 border-emerald-500'
                                : isStripCut
                                ? 'bg-sky-50/70 border-sky-400'
                                : 'bg-white border-slate-300 hover:border-amber-400'
                            }`}
                          >
                            {/* STRIP SUB-HEADER */}
                            <div className="p-4 bg-slate-100/90 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                              <div className="flex items-center gap-3">
                                <span className="w-8 h-8 rounded-xl bg-slate-800 text-white font-black flex items-center justify-center text-sm">
                                  #{step.stepNumber}
                                </span>
                                <div>
                                  <div className="flex items-center gap-2 flex-wrap">
                                    <span className="text-xs font-black bg-amber-600 text-white px-2.5 py-0.5 rounded-lg uppercase">
                                      Tablero #{step.boardIndex} ({activeGroup.materialType})
                                    </span>
                                    <span className="text-xs font-extrabold text-slate-700">
                                      Tira #{step.stripIndex} ({step.stripLengthCm} × {step.stripWidthCm} cm)
                                    </span>
                                    <span className="text-xs font-black bg-amber-300 text-amber-950 border border-amber-400 px-2 py-0.5 rounded-lg">
                                      ✍️ Marca: {step.pencilMark}
                                    </span>
                                  </div>
                                </div>
                              </div>

                              <div className="text-xs font-bold text-slate-600">
                                Contiene <b>{step.individualCuts.length}</b> {step.individualCuts.length === 1 ? 'pieza requerida' : 'piezas requeridas'}
                              </div>
                            </div>

                            <div className="p-5 sm:p-6 space-y-6">
                              {/* FASE A: CORTE DE TIRA */}
                              <div className={`p-4 sm:p-5 rounded-2xl border-2 transition-all ${
                                isStripCut
                                  ? 'bg-sky-100/90 border-sky-500 shadow-sm'
                                  : 'bg-amber-50/70 border-amber-300'
                              }`}>
                                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                                  <div className="flex items-start gap-3">
                                    <span className="w-8 h-8 rounded-xl bg-sky-600 text-white font-black flex items-center justify-center text-sm shrink-0 shadow">
                                      A
                                    </span>
                                    <div>
                                      <div className="flex items-center gap-2">
                                        <span className="text-xs font-black uppercase tracking-wider text-sky-900 bg-sky-200 px-2 py-0.5 rounded">
                                          FASE A (Corte de Tira)
                                        </span>
                                        {isStripCut && (
                                          <span className="text-xs font-black text-sky-800 flex items-center gap-1">
                                            <Clock className="w-3.5 h-3.5 text-sky-600" /> Tira en proceso
                                          </span>
                                        )}
                                      </div>
                                      <h5 className="text-base sm:text-lg font-black text-slate-900 mt-1">
                                        Pasa el <b>Tablero #{step.boardIndex}</b> con la regla fija a <b>{step.fenceMeasureCm} cm</b> para sacar 1 TIRA COMPLETA.
                                      </h5>
                                      
                                      <div className="mt-2.5 inline-flex items-center gap-2 bg-amber-200/90 border-2 border-amber-400 text-amber-950 px-3.5 py-1.5 rounded-xl font-black text-xs sm:text-sm shadow-sm">
                                        <span className="text-base">✍️</span>
                                        <span>Marca a lápiz en esta tira:</span>
                                        <span className="bg-amber-950 text-amber-300 px-2 py-0.5 rounded text-xs tracking-wider">
                                          {step.pencilMark}
                                        </span>
                                        <span className="text-xs font-bold text-amber-900">(Tablero #{step.boardIndex})</span>
                                      </div>
                                    </div>
                                  </div>

                                  <button
                                    type="button"
                                    onClick={() => toggleStripCut(step.stripId)}
                                    className={`px-4 py-2.5 rounded-xl font-black text-xs sm:text-sm flex items-center gap-2 cursor-pointer transition shadow-sm shrink-0 no-print ${
                                      isStripCut
                                        ? 'bg-sky-600 hover:bg-sky-700 text-white border border-sky-800'
                                        : 'bg-white hover:bg-sky-50 text-slate-800 border-2 border-slate-300'
                                    }`}
                                  >
                                    <Check className="w-4 h-4 stroke-[3]" />
                                    {isStripCut ? `✓ Tira ${step.pencilMark} Cortada` : `Marcar Tira ${step.pencilMark} Cortada`}
                                  </button>
                                </div>
                              </div>

                              {/* FASE B: CORTES TRANSVERSALES SOBRE LA TIRA */}
                              <div className="space-y-3">
                                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-200 pb-2">
                                  <div className="flex items-center gap-2">
                                    <span className="w-7 h-7 rounded-lg bg-emerald-700 text-white font-black flex items-center justify-center text-xs shadow">
                                      B
                                    </span>
                                    <div>
                                      <h5 className="text-sm sm:text-base font-black text-slate-900">
                                        ✂️ Cortes a lo ancho sobre la Tira {step.pencilMark} (Regla de {step.fenceMeasureCm} cm):
                                      </h5>
                                      <p className="text-xs font-bold text-slate-500">
                                        De la tira recién cortada y marcada con lápiz, realiza los siguientes cortes a lo ancho:
                                      </p>
                                    </div>
                                  </div>

                                  <button
                                    type="button"
                                    onClick={() => toggleAllPiecesInStrip(step)}
                                    className="text-xs font-black text-emerald-800 hover:text-emerald-950 bg-emerald-100 hover:bg-emerald-200 px-3 py-1 rounded-xl border border-emerald-300 transition cursor-pointer self-start sm:self-center no-print"
                                  >
                                    {allPiecesInStripCut ? 'Desmarcar Piezas' : `✓ Marcar Todas las de Tira ${step.pencilMark}`}
                                  </button>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                  {step.individualCuts.map((cut, idx) => {
                                    const isPieceDone = !!cutPieceIds[cut.placedPieceId];
                                    const fPalette = furnitureColorMap[cut.furnitureName || 'Mueble General'] || FURNITURE_PALETTES[0];

                                    return (
                                      <div
                                        key={cut.placedPieceId}
                                        onClick={() => togglePieceCut(cut.placedPieceId, step.stripId)}
                                        className={`p-3.5 rounded-2xl border-2 transition-all cursor-pointer flex items-center justify-between gap-3 ${
                                          isPieceDone
                                            ? 'bg-emerald-100/90 border-emerald-500 shadow-sm'
                                            : 'bg-white border-slate-300 hover:border-emerald-500 hover:bg-emerald-50/40 shadow-sm'
                                        }`}
                                      >
                                        <div className="flex items-start gap-3">
                                          <div className={`w-7 h-7 rounded-xl flex items-center justify-center font-black text-xs border-2 shrink-0 mt-0.5 ${
                                            isPieceDone
                                              ? 'bg-emerald-600 text-white border-emerald-800'
                                              : 'bg-slate-100 text-slate-500 border-slate-300'
                                          }`}>
                                            {isPieceDone ? <Check className="w-4 h-4 stroke-[3]" /> : idx + 1}
                                          </div>

                                          <div>
                                            <div className="flex items-center gap-1.5 flex-wrap">
                                              <span className={`text-[11px] font-black px-2 py-0.5 rounded border ${fPalette.lightBg}`}>
                                                {cut.furnitureName || 'Mueble'}
                                              </span>
                                              <span className="text-[11px] font-extrabold text-blue-800 bg-blue-100 px-2 py-0.5 rounded">
                                                📐 Corte a {cut.cutMeasureCm} cm
                                              </span>
                                              <span className="text-[10px] font-bold text-amber-900 bg-amber-200 px-1.5 py-0.5 rounded">
                                                {cut.pencilMark || step.pencilMark}
                                              </span>
                                            </div>

                                            <h6 className={`text-sm sm:text-base font-black mt-1 ${isPieceDone ? 'line-through text-slate-500' : 'text-slate-900'}`}>
                                              {cut.name}
                                            </h6>
                                            <p className="text-xs font-bold text-slate-600">
                                              Sale: <span className="text-blue-700 font-extrabold">{cut.originalLength}</span> × <span className="text-orange-700 font-extrabold">{cut.originalWidth}</span> cm {cut.rotated ? '(↺90°)' : ''}
                                            </p>
                                          </div>
                                        </div>

                                        <div className="flex items-center gap-2 shrink-0 no-print">
                                          <button
                                            type="button"
                                            onClick={(e) => {
                                              e.stopPropagation();
                                              speakStep(`Corte a ${cut.cutMeasureCm} centímetros en la tira ${step.pencilMark}. Sale ${cut.name} de ${cut.originalLength} por ${cut.originalWidth} centímetros para ${cut.furnitureName || 'el mueble'}.`);
                                            }}
                                            className="p-2 text-slate-500 hover:text-amber-800 bg-slate-100 hover:bg-amber-100 rounded-xl border border-slate-300 cursor-pointer transition"
                                            title="Escuchar medida"
                                          >
                                            <Volume2 className="w-4 h-4" />
                                          </button>
                                        </div>
                                      </div>
                                    );
                                  })}
                                </div>
                              </div>

                            </div>
                          </div>
                        );
                      })}
                    </div>

                  </div>
                );
              })}
            </div>

            {/* Transition to Module 3: Assembly */}
            {onNavigateToAssembly && (
              <div className="pt-4 no-print">
                <button
                  type="button"
                  onClick={onNavigateToAssembly}
                  className="w-full bg-gradient-to-r from-amber-600 via-orange-600 to-amber-700 hover:from-amber-500 hover:to-orange-500 text-white font-black py-6 px-6 text-xl sm:text-2xl rounded-3xl border-4 border-amber-950 shadow-2xl hover:shadow-orange-500/40 flex items-center justify-center gap-4 transition-all transform hover:-translate-y-1 active:scale-[0.98] cursor-pointer ring-4 ring-amber-400/40"
                >
                  <span className="text-3xl">🔨</span>
                  <div className="text-left">
                    <div className="text-xs uppercase font-extrabold text-amber-200">Siguiente Fase del Taller</div>
                    <div className="text-xl sm:text-2xl font-black">Proceder al Proceso de Armado (Módulo 3) ➔</div>
                  </div>
                </button>
              </div>
            )}

          </div>

        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL DE ASIGNACIÓN INDIVIDUAL Y RECALCULO DE SOBRANTE REMANENTE (REQ 2) */}
      {/* ========================================================================= */}
      {assignModalData && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs no-print">
          <div className="bg-white rounded-3xl max-w-xl w-full border-4 border-amber-500 shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            {/* Header del Modal */}
            <div className="bg-gradient-to-r from-amber-700 via-amber-800 to-amber-900 text-white p-5 sm:p-6 flex items-start justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-amber-400 text-amber-950 flex items-center justify-center text-2xl font-black shadow-md shrink-0">
                  ✂️
                </div>
                <div>
                  <span className="text-xs font-black uppercase tracking-wider text-amber-200 bg-amber-950/50 px-2.5 py-0.5 rounded-full border border-amber-400/40">
                    Corte de Retazo / Sobrante
                  </span>
                  <h3 className="text-lg sm:text-xl font-black mt-1">
                    {assignModalData.offcutLabel}
                  </h3>
                  <p className="text-xs text-amber-200/90 font-semibold">
                    {assignModalData.offcut.materialType} • {assignModalData.offcut.thicknessMm} mm
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setAssignModalData(null)}
                className="text-amber-200 hover:text-white bg-amber-950/40 hover:bg-amber-950/80 p-2 rounded-xl border border-amber-500/30 transition cursor-pointer"
              >
                ✕
              </button>
            </div>

            {/* Contenido del Modal */}
            <div className="p-5 sm:p-6 space-y-5 max-h-[80vh] overflow-y-auto">
              {/* Información de la Pieza */}
              <div className="bg-amber-50/80 rounded-2xl p-4 border-2 border-amber-300 space-y-2">
                <span className="text-[11px] font-black uppercase text-amber-900 block">
                  Pieza a Fabricar de este Retazo:
                </span>
                <div className="flex items-center justify-between gap-2 flex-wrap">
                  <div className="flex items-center gap-2">
                    <span className="text-base font-black text-slate-900">
                      🧩 {assignModalData.cut.name}
                    </span>
                    {assignModalData.cut.furnitureName && (
                      <span className="text-xs font-bold bg-amber-200 text-amber-950 px-2 py-0.5 rounded-md border border-amber-300">
                        {assignModalData.cut.furnitureName}
                      </span>
                    )}
                  </div>
                  <span className="text-sm font-black text-slate-900 bg-white px-3 py-1 rounded-xl border border-amber-300">
                    {assignModalData.cut.lengthCm} × {assignModalData.cut.widthCm} cm
                  </span>
                </div>
                {assignModalData.fitsRotated && (
                  <p className="text-xs font-bold text-indigo-700 flex items-center gap-1">
                    <RotateCw className="w-3.5 h-3.5" /> Se corta rotada 90° para optimizar el encaje.
                  </p>
                )}
              </div>

              {/* Comparación Visual y Cálculo del Sobrante Remanente con Selección de Eje de Corte */}
              <div className="bg-slate-50 rounded-2xl p-4 border-2 border-slate-200 space-y-4">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-xs font-black uppercase tracking-wider text-slate-800 block">
                    📐 Matemática de Corte y Sentido de la Sierra:
                  </span>
                  <span className="text-[11px] font-bold text-slate-500">
                    Retazo Inicial: {assignModalData.offcut.lengthCm} × {assignModalData.offcut.widthCm} cm
                  </span>
                </div>

                {/* Selector de Estrategia de Corte: Longitudinal vs Transversal */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {/* Opción Longitudinal (A lo largo) */}
                  {(() => {
                    const strat = assignModalData.strategies.longitudinal;
                    const isSelected = assignModalData.selectedStrategyId === 'longitudinal';
                    return (
                      <div
                        onClick={() => setAssignModalData(prev => prev ? {
                          ...prev,
                          selectedStrategyId: 'longitudinal',
                          remainingL: strat.primaryL,
                          remainingW: strat.primaryW
                        } : null)}
                        className={`p-3.5 rounded-2xl border-2 cursor-pointer transition flex flex-col justify-between ${
                          isSelected 
                            ? 'bg-amber-50/90 border-amber-500 shadow-md ring-2 ring-amber-400/30' 
                            : 'bg-white border-slate-200 hover:border-amber-300'
                        }`}
                      >
                        <div>
                          <div className="flex items-center justify-between gap-1 mb-1">
                            <span className="text-xs font-black text-slate-900 flex items-center gap-1.5">
                              <span>📏</span> Corte a lo largo
                            </span>
                            {strat.isRecommended && (
                              <span className="text-[9px] font-black uppercase bg-emerald-600 text-white px-1.5 py-0.5 rounded">
                                Mayor Área
                              </span>
                            )}
                          </div>
                          <p className="text-[11px] text-slate-600 font-semibold leading-tight mb-2">
                            Disco recorre el lado de {assignModalData.offcut.lengthCm} cm:
                          </p>
                          <div className="bg-slate-100 rounded-lg p-2 text-center text-xs font-black text-slate-900 border border-slate-200">
                            Sobrante Útil: <span className="text-emerald-700 text-sm">{strat.primaryL} × {strat.primaryW} cm</span>
                            <div className="text-[10px] font-bold text-slate-500 mt-0.5">
                              ({strat.primaryArea} cm² utilizables)
                            </div>
                          </div>
                        </div>

                        <div className="text-[10px] text-slate-500 font-medium mt-2 pt-2 border-t border-slate-200/80">
                          Fórmula: {assignModalData.offcut.lengthCm} × ({assignModalData.offcut.widthCm} - {assignModalData.usedW}) = {strat.primaryL} × {strat.primaryW} cm
                        </div>
                      </div>
                    );
                  })()}

                  {/* Opción Transversal (A lo ancho) */}
                  {(() => {
                    const strat = assignModalData.strategies.transversal;
                    const isSelected = assignModalData.selectedStrategyId === 'transversal';
                    return (
                      <div
                        onClick={() => setAssignModalData(prev => prev ? {
                          ...prev,
                          selectedStrategyId: 'transversal',
                          remainingL: strat.primaryL,
                          remainingW: strat.primaryW
                        } : null)}
                        className={`p-3.5 rounded-2xl border-2 cursor-pointer transition flex flex-col justify-between ${
                          isSelected 
                            ? 'bg-amber-50/90 border-amber-500 shadow-md ring-2 ring-amber-400/30' 
                            : 'bg-white border-slate-200 hover:border-amber-300'
                        }`}
                      >
                        <div>
                          <div className="flex items-center justify-between gap-1 mb-1">
                            <span className="text-xs font-black text-slate-900 flex items-center gap-1.5">
                              <span>📐</span> Corte a lo ancho
                            </span>
                            {strat.isRecommended && (
                              <span className="text-[9px] font-black uppercase bg-emerald-600 text-white px-1.5 py-0.5 rounded">
                                Mayor Área
                              </span>
                            )}
                          </div>
                          <p className="text-[11px] text-slate-600 font-semibold leading-tight mb-2">
                            Disco recorre el lado de {assignModalData.offcut.widthCm} cm:
                          </p>
                          <div className="bg-slate-100 rounded-lg p-2 text-center text-xs font-black text-slate-900 border border-slate-200">
                            Sobrante Útil: <span className="text-emerald-700 text-sm">{strat.primaryL} × {strat.primaryW} cm</span>
                            <div className="text-[10px] font-bold text-slate-500 mt-0.5">
                              ({strat.primaryArea} cm² utilizables)
                            </div>
                          </div>
                        </div>

                        <div className="text-[10px] text-slate-500 font-medium mt-2 pt-2 border-t border-slate-200/80">
                          Fórmula: ({assignModalData.offcut.lengthCm} - {assignModalData.usedL}) × {assignModalData.offcut.widthCm} = {strat.primaryL} × {strat.primaryW} cm
                        </div>
                      </div>
                    );
                  })()}
                </div>

                {/* Resumen del Sobrante Seleccionado */}
                <div className="grid grid-cols-3 gap-2 text-center text-xs pt-1">
                  <div className="bg-white p-3 rounded-xl border border-slate-200 shadow-2xs">
                    <span className="text-[10px] font-bold text-slate-500 block uppercase">Retazo Inicial</span>
                    <span className="text-sm font-black text-slate-900 mt-1 block">
                      {assignModalData.offcut.lengthCm} × {assignModalData.offcut.widthCm} cm
                    </span>
                  </div>

                  <div className="bg-amber-100/60 p-3 rounded-xl border border-amber-300 shadow-2xs">
                    <span className="text-[10px] font-bold text-amber-800 block uppercase">Medida Usada</span>
                    <span className="text-sm font-black text-amber-950 mt-1 block">
                      {assignModalData.usedL} × {assignModalData.usedW} cm
                    </span>
                  </div>

                  <div className="bg-emerald-100/80 p-3 rounded-xl border-2 border-emerald-400 shadow-2xs">
                    <span className="text-[10px] font-bold text-emerald-800 block uppercase">Sobrante a Registrar</span>
                    <span className="text-sm font-black text-emerald-950 mt-1 block">
                      {assignModalData.remainingL} × {assignModalData.remainingW} cm
                    </span>
                  </div>
                </div>

                <div className="bg-emerald-50 rounded-xl p-3 border border-emerald-300 text-xs text-emerald-950 font-semibold flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-emerald-700 shrink-0" />
                  <span>
                    El remanente útil continuo que se registrará es de <b>{assignModalData.remainingL} × {assignModalData.remainingW} cm</b> ({assignModalData.offcut.thicknessMm} mm).
                  </span>
                </div>
              </div>

              {/* Selección de Acción sobre el Sobrante Remanente */}
              <div className="space-y-3">
                <label className="text-xs font-black uppercase tracking-wider text-slate-800 block">
                  ¿Qué deseas hacer con el sobrante remanente?
                </label>

                <div className="space-y-2.5">
                  {/* Opción 1: Guardar Sobrante en Almacén */}
                  <label
                    onClick={() => setAssignModalData(prev => prev ? { ...prev, selectedAction: 'save_remaining' } : null)}
                    className={`p-4 rounded-2xl border-3 flex items-start gap-3 cursor-pointer transition ${
                      assignModalData.selectedAction === 'save_remaining'
                        ? 'bg-emerald-50 border-emerald-600 shadow-md ring-2 ring-emerald-400/40'
                        : 'bg-white border-slate-200 hover:border-slate-300 hover:bg-slate-50'
                    }`}
                  >
                    <input
                      type="radio"
                      name="offcut_action"
                      checked={assignModalData.selectedAction === 'save_remaining'}
                      onChange={() => {}}
                      className="mt-1 w-4 h-4 text-emerald-600 focus:ring-emerald-500 shrink-0"
                    />
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-black text-emerald-950">
                          [✓] Guardar el sobrante actualizado en Almacén
                        </span>
                        <span className="bg-emerald-600 text-white text-[10px] font-black px-2 py-0.2 rounded-full uppercase">
                          Recomendado
                        </span>
                      </div>
                      <p className="text-xs font-semibold text-emerald-900 mt-1">
                        El retazo en tu inventario de Almacén se actualizará automáticamente a <b>{assignModalData.remainingL} × {assignModalData.remainingW} cm</b> para aprovecharlo en futuros proyectos.
                      </p>
                    </div>
                  </label>

                  {/* Opción 2: Desechar Sobrante */}
                  <label
                    onClick={() => setAssignModalData(prev => prev ? { ...prev, selectedAction: 'discard_remaining' } : null)}
                    className={`p-4 rounded-2xl border-3 flex items-start gap-3 cursor-pointer transition ${
                      assignModalData.selectedAction === 'discard_remaining'
                        ? 'bg-rose-50 border-rose-600 shadow-md ring-2 ring-rose-400/40'
                        : 'bg-white border-slate-200 hover:border-slate-300 hover:bg-slate-50'
                    }`}
                  >
                    <input
                      type="radio"
                      name="offcut_action"
                      checked={assignModalData.selectedAction === 'discard_remaining'}
                      onChange={() => {}}
                      className="mt-1 w-4 h-4 text-rose-600 focus:ring-rose-500 shrink-0"
                    />
                    <div>
                      <span className="text-sm font-black text-rose-950">
                        [✕] Desechar sobrante restante
                      </span>
                      <p className="text-xs font-semibold text-rose-900 mt-1">
                        El retazo se marcará como usado/consumido totalmente y no se conservará pedacería restante en el inventario.
                      </p>
                    </div>
                  </label>
                </div>
              </div>
            </div>

            {/* Footer de Acciones */}
            <div className="bg-slate-100 p-4 sm:p-5 border-t border-slate-200 flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => setAssignModalData(null)}
                className="px-5 py-2.5 rounded-xl font-bold text-xs sm:text-sm text-slate-700 bg-white hover:bg-slate-200 border border-slate-300 cursor-pointer transition"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleConfirmAssignOffcut}
                className="px-6 py-2.5 rounded-xl font-black text-xs sm:text-sm text-white bg-gradient-to-r from-emerald-600 to-teal-700 hover:from-emerald-500 hover:to-teal-600 border-2 border-emerald-800 shadow-lg cursor-pointer transition flex items-center gap-2"
              >
                <Check className="w-4 h-4 stroke-[3]" />
                <span>Confirmar Corte y Asignación</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Embebido de Previsualización y Descarga/Impresión de PDF */}
      <PdfPreviewModal
        isOpen={!!pdfPreviewModalMode}
        mode={pdfPreviewModalMode}
        onClose={() => setPdfPreviewModalMode(null)}
        projectName={projectName}
        materialType={activeGroup.materialType}
        thicknessMm={activeGroup.thicknessMm}
        sheetLengthCm={activeConfig.sheetLengthCm}
        sheetWidthCm={activeConfig.sheetWidthCm}
        sawKerfMm={activeConfig.sawKerfMm}
        primaryCutDirection={activeConfig.primaryCutDirection}
        optimizationResult={activeOptimizationResult}
        furnitureColorMap={furnitureColorMap}
        assignedOffcuts={projectAssignedOffcuts}
      />

    </div>
  );
};
