import React, { useState, useEffect, useMemo, useRef } from 'react';
import { Project, WoodCut, FurnitureCategory, FurnitureUnit, User } from '../types';
import { calculateFurnitureCuts, speakCutDetails } from '../utils/cutCalculator';
import { EdgeBandingVisual } from './EdgeBandingVisual';
import { 
  getAvailableBoardMaterialNames, 
  getAvailableThicknesses, 
  registerNewMaterialInCatalog 
} from '../utils/materialsCatalog';
import { 
  getProjectProductionStats, 
  resetProjectProductionProgress 
} from '../utils/productionProgress';
import { 
  Volume2, Printer, Plus, Trash2, CheckCircle, Save, ArrowLeft, Ruler, 
  Layers, Scissors, Package, Edit3, Check, PlusCircle, Hammer, RotateCcw,
  Sparkles, CheckCheck, Lock, ShieldAlert
} from 'lucide-react';

interface ProjectsViewProps {
  projects: Project[];
  activeProjectId?: string | null;
  currentUser?: User | null;
  onSelectProject?: (id: string) => void;
  onSaveProject: (project: Project) => void;
  onDeleteProject: (id: string) => void;
  onBackToMenu: () => void;
  onProceedToOptimizer?: (cuts: WoodCut[], material: string, thickness: number, projectName: string) => void;
  onNavigateToAssembly?: (projectId?: string) => void;
}

export const ProjectsView: React.FC<ProjectsViewProps> = ({
  projects,
  activeProjectId,
  currentUser,
  onSelectProject,
  onSaveProject,
  onDeleteProject,
  onBackToMenu,
  onProceedToOptimizer,
  onNavigateToAssembly
}) => {
  const isReadOnly = currentUser?.role === 'operario' || currentUser?.role === 'ayudante';

  // Determine initial project
  const initialProject = projects.find(p => p.id === activeProjectId) || projects[0];

  // Main Project Info State
  const [currentProjectId, setCurrentProjectId] = useState<string>(() => initialProject?.id || 'proj_1');
  const [projectName, setProjectName] = useState(() => initialProject?.name || 'Proyecto Cocina / Taller');
  const [clientName, setClientName] = useState(() => initialProject?.clientName || 'Cliente Taller');
  const [notes, setNotes] = useState(() => initialProject?.notes || 'Verificar cantos y ajuste en sierra.');

  // Available Materials List with custom material capability - dynamically loaded from Master Catalog
  const [availableMaterials, setAvailableMaterials] = useState<string[]>(() => getAvailableBoardMaterialNames());
  const [showAddMaterialModal, setShowAddMaterialModal] = useState(false);
  const [newMaterialInput, setNewMaterialInput] = useState('');

  // Available Thicknesses List with custom thickness capability - dynamically loaded from Master Catalog
  const [availableThicknesses, setAvailableThicknesses] = useState<number[]>(() => getAvailableThicknesses());
  const [showAddThicknessModal, setShowAddThicknessModal] = useState(false);
  const [newThicknessInput, setNewThicknessInput] = useState<string>('');

  // Listen to Master Catalog updates across views / modules
  useEffect(() => {
    const handleCatalogUpdate = () => {
      setAvailableMaterials(getAvailableBoardMaterialNames());
      setAvailableThicknesses(getAvailableThicknesses());
    };

    window.addEventListener('materialsCatalogChanged', handleCatalogUpdate);
    window.addEventListener('storage', handleCatalogUpdate);
    return () => {
      window.removeEventListener('materialsCatalogChanged', handleCatalogUpdate);
      window.removeEventListener('storage', handleCatalogUpdate);
    };
  }, []);

  // Multi-Furniture Units State
  const [furnitureUnits, setFurnitureUnits] = useState<FurnitureUnit[]>(() => {
    if (initialProject?.furnitureUnits && initialProject.furnitureUnits.length > 0) {
      return initialProject.furnitureUnits;
    }
    if (initialProject?.cuts && initialProject.cuts.length > 0) {
      return [{
        id: 'unit_1',
        name: initialProject.name || 'Mueble A',
        category: initialProject.category || 'gabinete',
        heightCm: initialProject.totalHeightCm || 80,
        widthCm: initialProject.totalWidthCm || 60,
        depthCm: initialProject.totalDepthCm || 40,
        thicknessMm: initialProject.thicknessMm || 15,
        materialType: initialProject.materialType || 'Melamina Blanca',
        cuts: initialProject.cuts.map(c => ({
          ...c,
          furnitureId: 'unit_1',
          furnitureName: initialProject.name || 'Mueble A'
        }))
      }];
    }
    return [
      {
        id: 'unit_1',
        name: 'Mueble A',
        category: 'gabinete',
        heightCm: 90,
        widthCm: 80,
        depthCm: 40,
        thicknessMm: 15,
        materialType: 'Melamina Blanca',
        cuts: calculateFurnitureCuts('gabinete', 90, 80, 40, 15, 'Melamina Blanca')
      }
    ];
  });

  const [activeUnitId, setActiveUnitId] = useState<string>(() => {
    if (initialProject?.furnitureUnits && initialProject.furnitureUnits.length > 0) {
      return initialProject.furnitureUnits[0].id;
    }
    return 'unit_1';
  });

  const [showSavedModal, setShowSavedModal] = useState(false);
  const [isVoiceActive, setIsVoiceActive] = useState(false);
  const [lastSavedTimestamp, setLastSavedTimestamp] = useState<string>('');
  const [savedSuccessFlash, setSavedSuccessFlash] = useState(false);

  const projectsRef = useRef(projects);
  projectsRef.current = projects;
  const isExternalSyncRef = useRef(false);
  const lastSavedSignatureRef = useRef<string>('');

  // Sync state when activeProjectId prop changes from outside
  useEffect(() => {
    if (activeProjectId && activeProjectId !== currentProjectId) {
      const targetProj = projectsRef.current.find(p => p.id === activeProjectId);
      if (targetProj) {
        isExternalSyncRef.current = true;
        setCurrentProjectId(targetProj.id);
        setProjectName(targetProj.name);
        setClientName(targetProj.clientName || '');
        setNotes(targetProj.notes || '');
        if (targetProj.furnitureUnits && targetProj.furnitureUnits.length > 0) {
          setFurnitureUnits(targetProj.furnitureUnits);
          setActiveUnitId(targetProj.furnitureUnits[0].id);
        } else if (targetProj.cuts && targetProj.cuts.length > 0) {
          const singleUnit: FurnitureUnit = {
            id: 'unit_1',
            name: targetProj.name || 'Mueble A',
            category: targetProj.category || 'gabinete',
            heightCm: targetProj.totalHeightCm || 80,
            widthCm: targetProj.totalWidthCm || 60,
            depthCm: targetProj.totalDepthCm || 40,
            thicknessMm: targetProj.thicknessMm || 15,
            materialType: targetProj.materialType || 'Melamina Blanca',
            cuts: targetProj.cuts.map(c => ({
              ...c,
              furnitureId: 'unit_1',
              furnitureName: targetProj.name || 'Mueble A'
            }))
          };
          setFurnitureUnits([singleUnit]);
          setActiveUnitId(singleUnit.id);
        }
      }
    }
  }, [activeProjectId, currentProjectId]);

  // Real-Time Auto-Save Effect (Triggered on user changes to units, project info, or cuts)
  const isFirstMountRef = useRef(true);
  useEffect(() => {
    if (isFirstMountRef.current) {
      isFirstMountRef.current = false;
      return;
    }

    if (isExternalSyncRef.current) {
      isExternalSyncRef.current = false;
      return;
    }

    if (isReadOnly) {
      return;
    }

    const allCutsList = furnitureUnits.flatMap(u => u.cuts.map(c => ({
      ...c,
      furnitureId: c.furnitureId || u.id,
      furnitureName: c.furnitureName || u.name,
      materialType: c.materialType || u.materialType || 'Melamina Blanca',
      thicknessMm: c.thicknessMm || u.thicknessMm || 15
    })));

    const activeUnitObj = furnitureUnits.find(u => u.id === activeUnitId) || furnitureUnits[0];

    const projectToSave: Project = {
      id: currentProjectId || 'proj_1',
      name: projectName.trim() || 'Proyecto de Carpintería',
      clientName: clientName.trim(),
      category: activeUnitObj?.category || 'gabinete',
      totalHeightCm: activeUnitObj?.heightCm || 80,
      totalWidthCm: activeUnitObj?.widthCm || 60,
      totalDepthCm: activeUnitObj?.depthCm || 40,
      materialType: activeUnitObj?.materialType || 'Melamina Blanca',
      thicknessMm: activeUnitObj?.thicknessMm || 15,
      createdAt: projectsRef.current.find(p => p.id === currentProjectId)?.createdAt || new Date().toISOString().split('T')[0],
      cuts: allCutsList,
      furnitureUnits: furnitureUnits,
      notes: notes,
      status: allCutsList.length > 0 && allCutsList.every(c => c.completed) ? 'completado' : 'en_corte'
    };

    const signature = JSON.stringify(projectToSave);
    if (signature === lastSavedSignatureRef.current) {
      return;
    }
    lastSavedSignatureRef.current = signature;

    onSaveProject(projectToSave);
    const now = new Date();
    setLastSavedTimestamp(now.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit', second: '2-digit' }));
  }, [furnitureUnits, projectName, clientName, notes, currentProjectId, activeUnitId, isReadOnly]);

  // Custom Extra Cut Form State (Mandatory Quantity field)
  const [customName, setCustomName] = useState('');
  const [customQty, setCustomQty] = useState<string | number>(1);
  const [customLength, setCustomLength] = useState<string | number>(50);
  const [customWidth, setCustomWidth] = useState<string | number>(30);
  const [customCategory, setCustomCategory] = useState<WoodCut['category']>('otro');

  // Drawer Assistant Modal State
  const [showDrawerModal, setShowDrawerModal] = useState(false);
  const [includeDrawerFront, setIncludeDrawerFront] = useState(true);
  const [drawerWidth, setDrawerWidth] = useState<number | string>(50);
  const [drawerHeight, setDrawerHeight] = useState<number | string>(15);
  const [drawerDepth, setDrawerDepth] = useState<number | string>(45);
  const [drawerQty, setDrawerQty] = useState<number | string>(1);
  const [drawerFrontWidth, setDrawerFrontWidth] = useState<number | string>(53);
  const [drawerFrontHeight, setDrawerFrontHeight] = useState<number | string>(15);
  const [drawerBoxMaterial, setDrawerBoxMaterial] = useState<string>('Melamina Blanca');
  const [drawerBoxThickness, setDrawerBoxThickness] = useState<number>(15);
  const [drawerFrontMaterial, setDrawerFrontMaterial] = useState<string>('Melamina Blanca');
  const [drawerFrontThickness, setDrawerFrontThickness] = useState<number>(15);
  const [drawerBottomMaterial, setDrawerBottomMaterial] = useState<string>('MDF 3mm Blanco');
  const [drawerBottomThickness, setDrawerBottomThickness] = useState<number>(3);

  // Mini-form state for creating new material from drawer assistant
  const [drawerTargetField, setDrawerTargetField] = useState<'box' | 'front' | 'bottom' | null>(null);
  const [drawerNewMatName, setDrawerNewMatName] = useState('');
  const [drawerNewMatThickness, setDrawerNewMatThickness] = useState<number | string>(15);

  // Get current active furniture unit
  const activeUnit = furnitureUnits.find(u => u.id === activeUnitId) || furnitureUnits[0];

  // Helper to update active furniture unit
  const updateActiveUnit = (fields: Partial<FurnitureUnit>) => {
    setFurnitureUnits(prev => prev.map(unit => {
      if (unit.id !== activeUnit.id) return unit;
      const updated = { ...unit, ...fields };
      return updated;
    }));
  };

  // Handler to recalculate cuts for current active furniture unit
  const handleRecalculateUnit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const newCuts = calculateFurnitureCuts(
      activeUnit.category,
      activeUnit.heightCm,
      activeUnit.widthCm,
      activeUnit.depthCm,
      activeUnit.thicknessMm,
      activeUnit.materialType
    );
    updateActiveUnit({ cuts: newCuts });
    speakCutDetails(`Calculado ${activeUnit.name}. Total ${newCuts.length} tipos de piezas.`);
  };

  // Helper to generate next alphabetical letter name (A, B, C, ... Z, AA, AB...)
  const getFurnitureLetter = (index: number): string => {
    let letter = '';
    while (index >= 0) {
      letter = String.fromCharCode((index % 26) + 65) + letter;
      index = Math.floor(index / 26) - 1;
    }
    return letter;
  };

  // Add a new Furniture Unit to project ("➕ Agregar otro mueble a este proyecto")
  const handleAddFurnitureUnit = () => {
    const newId = 'unit_' + Math.random().toString(36).substring(2, 7);
    const nextLetter = getFurnitureLetter(furnitureUnits.length); // A, B, C, D...
    const newUnit: FurnitureUnit = {
      id: newId,
      name: `Mueble ${nextLetter}`,
      category: 'gabinete',
      heightCm: 80,
      widthCm: 60,
      depthCm: 40,
      thicknessMm: 15,
      materialType: availableMaterials[0],
      cuts: calculateFurnitureCuts('gabinete', 80, 60, 40, 15, availableMaterials[0])
    };
    setFurnitureUnits(prev => [...prev, newUnit]);
    setActiveUnitId(newId);
    speakCutDetails(`Agregado ${newUnit.name} al proyecto.`);
  };

  // Save new material created from Drawer Assistant
  const handleSaveDrawerNewMaterial = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = drawerNewMatName.trim();
    const thickVal = Number(drawerNewMatThickness);
    if (!trimmed || !thickVal || thickVal <= 0) return;

    // Register automatically in Master Catalog
    registerNewMaterialInCatalog(trimmed, thickVal);

    // Save to local availableMaterials
    if (!availableMaterials.includes(trimmed)) {
      setAvailableMaterials(prev => [...prev, trimmed]);
    }
    // Save to local availableThicknesses
    if (!availableThicknesses.includes(thickVal)) {
      setAvailableThicknesses(prev => [...prev, thickVal].sort((a, b) => a - b));
    }

    // Set value in selected drawer field
    if (drawerTargetField === 'box') {
      setDrawerBoxMaterial(trimmed);
      setDrawerBoxThickness(thickVal);
    } else if (drawerTargetField === 'front') {
      setDrawerFrontMaterial(trimmed);
      setDrawerFrontThickness(thickVal);
    } else if (drawerTargetField === 'bottom') {
      setDrawerBottomMaterial(trimmed);
      setDrawerBottomThickness(thickVal);
    }

    // Reset mini-form
    setDrawerTargetField(null);
    setDrawerNewMatName('');
    setDrawerNewMatThickness(15);
  };

  // Delete a furniture unit
  const handleDeleteFurnitureUnit = (unitId: string) => {
    if (furnitureUnits.length <= 1) return;
    const filtered = furnitureUnits.filter(u => u.id !== unitId);
    setFurnitureUnits(filtered);
    if (activeUnitId === unitId && filtered.length > 0) {
      setActiveUnitId(filtered[0].id);
    }
  };

  // Save new custom material from dropdown
  const handleSaveCustomMaterial = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMaterialInput.trim()) return;
    const trimmed = newMaterialInput.trim();
    
    // Register automatically in Master Catalog
    registerNewMaterialInCatalog(trimmed, activeUnit.thicknessMm || 15);

    if (!availableMaterials.includes(trimmed)) {
      setAvailableMaterials(prev => [...prev, trimmed]);
    }
    updateActiveUnit({ materialType: trimmed });
    setNewMaterialInput('');
    setShowAddMaterialModal(false);
  };

  // Save new custom thickness from dropdown
  const handleSaveCustomThickness = (e: React.FormEvent) => {
    e.preventDefault();
    const val = Number(newThicknessInput);
    if (!val || val <= 0) return;
    if (!availableThicknesses.includes(val)) {
      setAvailableThicknesses(prev => [...prev, val].sort((a, b) => a - b));
    }
    updateActiveUnit({ thicknessMm: val });
    setNewThicknessInput('');
    setShowAddThicknessModal(false);
  };

  // Auto-calculate suggested dimensions when a piece category/role is selected
  const handleCategoryChange = (newCat: WoodCut['category']) => {
    setCustomCategory(newCat);
    const thicknessCm = (activeUnit.thicknessMm || 15) / 10;
    const unitW = activeUnit.widthCm || 80;
    const unitH = activeUnit.heightCm || 90;
    const unitD = activeUnit.depthCm || 40;

    switch (newCat) {
      case 'amarre':
        // Amarre / Listón: Largo = (Ancho Mueble - 2x Espesor), Ancho = 10cm
        setCustomLength(Number((unitW - (2 * thicknessCm)).toFixed(1)));
        setCustomWidth(10);
        if (!customName || customName.startsWith('Pieza') || customName.startsWith('Amarre') || customName.startsWith('Entrepaño') || customName.startsWith('Repisa') || customName.startsWith('División') || customName.startsWith('Zócalo')) {
          setCustomName('Amarre Superior');
        }
        break;
      case 'repisa':
        // Entrepaño / Repisa: Largo = (Ancho Mueble - 2x Espesor), Ancho = (Fondo Mueble - 2cm)
        setCustomLength(Number((unitW - (2 * thicknessCm)).toFixed(1)));
        setCustomWidth(Number(Math.max(5, unitD - 2).toFixed(1)));
        if (!customName || customName.startsWith('Pieza') || customName.startsWith('Amarre') || customName.startsWith('Entrepaño') || customName.startsWith('Repisa') || customName.startsWith('División') || customName.startsWith('Zócalo')) {
          setCustomName('Entrepaño Interior');
        }
        break;
      case 'division':
        // División Interior: Largo = (Alto Mueble - 2x Espesor), Ancho = (Fondo Mueble - 1.5cm)
        setCustomLength(Number((unitH - (2 * thicknessCm)).toFixed(1)));
        setCustomWidth(Number(Math.max(5, unitD - 1.5).toFixed(1)));
        if (!customName || customName.startsWith('Pieza') || customName.startsWith('Amarre') || customName.startsWith('Entrepaño') || customName.startsWith('Repisa') || customName.startsWith('División') || customName.startsWith('Zócalo')) {
          setCustomName('División Vertical');
        }
        break;
      case 'zocalo':
        // Zócalo: Largo = (Ancho Mueble), Ancho = 10cm
        setCustomLength(Number(unitW.toFixed(1)));
        setCustomWidth(10);
        if (!customName || customName.startsWith('Pieza') || customName.startsWith('Amarre') || customName.startsWith('Entrepaño') || customName.startsWith('Repisa') || customName.startsWith('División') || customName.startsWith('Zócalo')) {
          setCustomName('Zócalo / Rodapié');
        }
        break;
      case 'lateral':
        setCustomLength(Number(unitH.toFixed(1)));
        setCustomWidth(Number(unitD.toFixed(1)));
        if (!customName || customName.startsWith('Pieza') || customName.startsWith('Costado')) {
          setCustomName('Costado / Lateral');
        }
        break;
      case 'piso':
        setCustomLength(Number((unitW - (2 * thicknessCm)).toFixed(1)));
        setCustomWidth(Number(unitD.toFixed(1)));
        if (!customName || customName.startsWith('Pieza') || customName.startsWith('Piso') || customName.startsWith('Base')) {
          setCustomName('Piso / Base');
        }
        break;
      case 'techo':
        setCustomLength(Number((unitW - (2 * thicknessCm)).toFixed(1)));
        setCustomWidth(Number(unitD.toFixed(1)));
        if (!customName || customName.startsWith('Pieza') || customName.startsWith('Techo') || customName.startsWith('Tapa')) {
          setCustomName('Techo / Tapa Superior');
        }
        break;
      case 'fondo':
        setCustomLength(Number(unitH.toFixed(1)));
        setCustomWidth(Number(unitW.toFixed(1)));
        if (!customName || customName.startsWith('Pieza') || customName.startsWith('Fondo')) {
          setCustomName('Fondo MDF 3mm');
        }
        break;
      case 'puerta':
        setCustomLength(Number((unitH - 0.4).toFixed(1)));
        setCustomWidth(Number(((unitW / 2) - 0.3).toFixed(1)));
        if (!customName || customName.startsWith('Pieza') || customName.startsWith('Puerta')) {
          setCustomName('Puerta Batiente');
        }
        break;
      case 'frente_cajon':
        setCustomLength(Number((unitW - 0.4).toFixed(1)));
        setCustomWidth(15);
        if (!customName || customName.startsWith('Pieza') || customName.startsWith('Frente')) {
          setCustomName('Frente de Cajón');
        }
        break;
      case 'lateral_cajon':
        setCustomLength(Number((unitD - 5).toFixed(1)));
        setCustomWidth(13);
        if (!customName || customName.startsWith('Pieza') || customName.startsWith('Costado')) {
          setCustomName('Costado de Cajón');
        }
        break;
      case 'trasera_cajon':
        setCustomLength(Number((unitW - 2.6 - (2 * thicknessCm)).toFixed(1)));
        setCustomWidth(13);
        if (!customName || customName.startsWith('Pieza') || customName.startsWith('Contrafrente')) {
          setCustomName('Contrafrente Cajón');
        }
        break;
      case 'fondo_cajon':
        setCustomLength(Number((unitD - 5).toFixed(1)));
        setCustomWidth(Number((unitW - 2.6).toFixed(1)));
        if (!customName || customName.startsWith('Pieza') || customName.startsWith('Fondo')) {
          setCustomName('Fondo Cajón MDF 3mm');
        }
        break;
      default:
        break;
    }
  };

  // Add custom extra piece to current active furniture unit
  const handleAddCustomCut = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customName.trim()) return;
    const qty = Math.max(1, Number(customQty) || 1);
    const isFondo = customCategory === 'fondo' || customCategory === 'fondo_cajon';
    const newCut: WoodCut = {
      id: 'custom_' + Math.random().toString(36).substring(2, 7),
      furnitureId: activeUnit.id,
      furnitureName: activeUnit.name,
      name: customName.trim(),
      lengthCm: Number(customLength) || 1,
      widthCm: Number(customWidth) || 1,
      quantity: qty,
      completedQuantity: 0,
      completed: false,
      category: customCategory || 'otro',
      materialType: isFondo ? 'MDF 3mm Blanco' : activeUnit.materialType,
      thicknessMm: isFondo ? 3 : activeUnit.thicknessMm,
      notes: `Pieza manual (${customCategory})`,
      edges: { top: false, bottom: false, left: false, right: false }
    };

    updateActiveUnit({ cuts: [...activeUnit.cuts, newCut] });
    setCustomName('');
    setCustomQty(1);
    speakCutDetails(`Agregada pieza ${customName}, cantidad ${qty}.`);
  };

  // Quick Drawer Generator Handler (Descuento de 2.6cm en ancho total para correderas telescópicas)
  const handleAddDrawerCuts = (e: React.FormEvent) => {
    e.preventDefault();
    const w = Number(drawerWidth) || 50;
    const h = Number(drawerHeight) || 15;
    const d = Number(drawerDepth) || 45;
    const q = Math.max(1, Number(drawerQty) || 1);
    const fw = Number(drawerFrontWidth) || Number((w + 2 * ((activeUnit.thicknessMm || 15) / 10)).toFixed(1));
    const fh = Number(drawerFrontHeight) || h;
    const boxMat = drawerBoxMaterial || activeUnit.materialType;
    const boxThick = drawerBoxThickness || activeUnit.thicknessMm || 15;
    const frontMat = drawerFrontMaterial || activeUnit.materialType;
    const frontThick = drawerFrontThickness || activeUnit.thicknessMm || 15;
    const bottomMat = drawerBottomMaterial || 'MDF 3mm Blanco';
    const bottomThick = drawerBottomThickness || 3;

    // Descuento exacto de 2.6cm (1.3cm por corredera a cada lado)
    const drawerInteriorWidth = Number((w - 2.6).toFixed(1));
    const subFrontWidth = Number((drawerInteriorWidth - (2 * (boxThick / 10))).toFixed(1));
    const drawerBottomWidth = Number((drawerInteriorWidth - 0.2).toFixed(1));
    const drawerBottomDepth = Number((d - 0.2).toFixed(1));

    const drawerCuts: WoodCut[] = [];

    // 1. Frente de Cajón Exterior / Vista (solo si está marcado)
    if (includeDrawerFront) {
      drawerCuts.push({
        id: 'drw_front_' + Math.random().toString(36).substring(2, 7),
        furnitureId: activeUnit.id,
        furnitureName: activeUnit.name,
        name: 'Frente de Cajón (Vista)',
        lengthCm: fw,
        widthCm: fh,
        quantity: q,
        completedQuantity: 0,
        completed: false,
        category: 'frente_cajon',
        materialType: frontMat,
        thicknessMm: frontThick,
        notes: `Material: ${frontMat} (${frontThick}mm) • Frente exterior (${fw} × ${fh} cm)`,
        edges: { top: true, bottom: true, left: true, right: true }
      });
    }

    // 2. Costados / Laterales de Cajón (2 piezas por cajón)
    drawerCuts.push({
      id: 'drw_sides_' + Math.random().toString(36).substring(2, 7),
      furnitureId: activeUnit.id,
      furnitureName: activeUnit.name,
      name: 'Costados de Cajón',
      lengthCm: d,
      widthCm: Number((h - 2).toFixed(1)), // 2cm menor que el frente de vista
      quantity: q * 2,
      completedQuantity: 0,
      completed: false,
      category: 'lateral_cajon',
      materialType: boxMat,
      thicknessMm: boxThick,
      notes: `Material: ${boxMat} (${boxThick}mm) • 2.6cm holgura corredera`,
      edges: { top: true, bottom: false, left: false, right: false }
    });

    // 3. Contrafrente y Trasera de Cajón (2 piezas por cajón)
    drawerCuts.push({
      id: 'drw_rear_' + Math.random().toString(36).substring(2, 7),
      furnitureId: activeUnit.id,
      furnitureName: activeUnit.name,
      name: 'Contrafrente / Trasera Cajón',
      lengthCm: Math.max(5, subFrontWidth),
      widthCm: Number((h - 2).toFixed(1)),
      quantity: q * 2,
      completedQuantity: 0,
      completed: false,
      category: 'trasera_cajon',
      materialType: boxMat,
      thicknessMm: boxThick,
      notes: `Material: ${boxMat} (${boxThick}mm) • Reducción entre costados`,
      edges: { top: true, bottom: false, left: false, right: false }
    });

    // 4. Fondo de Cajón en MDF / Fondo
    drawerCuts.push({
      id: 'drw_bot_' + Math.random().toString(36).substring(2, 7),
      furnitureId: activeUnit.id,
      furnitureName: activeUnit.name,
      name: `Fondo de Cajón ${bottomThick}mm`,
      lengthCm: Math.max(5, drawerBottomDepth),
      widthCm: Math.max(5, drawerBottomWidth),
      quantity: q,
      completedQuantity: 0,
      completed: false,
      category: 'fondo_cajon',
      materialType: bottomMat,
      thicknessMm: bottomThick,
      notes: `Material: ${bottomMat} (${bottomThick}mm) • Fondo deslizable ranurado`,
      edges: { top: false, bottom: false, left: false, right: false }
    });

    updateActiveUnit({ cuts: [...activeUnit.cuts, ...drawerCuts] });
    setShowDrawerModal(false);
    speakCutDetails(
      includeDrawerFront
        ? `Agregado ${q} cajón completo con frente exterior en ${frontMat} y caja en ${boxMat}.`
        : `Agregado ${q} cajón interior sin frente, caja en ${boxMat}.`
    );
  };

  // Toggle cut completed
  const handleToggleCut = (unitId: string, cutId: string) => {
    setFurnitureUnits(prev => prev.map(unit => {
      if (unit.id !== unitId) return unit;
      return {
        ...unit,
        cuts: unit.cuts.map(cut => {
          if (cut.id !== cutId) return cut;
          const nextVal = !cut.completed;
          if (nextVal) {
            speakCutDetails(`Corte listo: ${cut.name}. Largo ${cut.lengthCm} por ancho ${cut.widthCm} cm.`);
          }
          return { ...cut, completed: nextVal, completedQuantity: nextVal ? cut.quantity : 0 };
        })
      };
    }));
  };

  // Toggle edge banding (cubrecanto) on a cut
  const handleToggleEdge = (cutId: string, edge: 'top' | 'bottom' | 'left' | 'right') => {
    setFurnitureUnits(prev => prev.map(unit => ({
      ...unit,
      cuts: unit.cuts.map(cut => {
        if (cut.id !== cutId) return cut;
        const currentEdges = cut.edges || {};
        return {
          ...cut,
          edges: {
            ...currentEdges,
            [edge]: !currentEdges[edge]
          }
        };
      })
    })));
  };

  // Delete cut item
  const handleDeleteCut = (unitId: string, cutId: string) => {
    setFurnitureUnits(prev => prev.map(unit => {
      if (unit.id !== unitId) return unit;
      return {
        ...unit,
        cuts: unit.cuts.filter(c => c.id !== cutId)
      };
    }));
  };

  // Speak whole project cut list
  const handleSpeakAllCuts = () => {
    setIsVoiceActive(true);
    let textToSpeak = `Proyecto ${projectName}. Contiene ${furnitureUnits.length} muebles. `;
    furnitureUnits.forEach((u, uIdx) => {
      textToSpeak += `Mueble ${uIdx + 1}: ${u.name}. `;
      u.cuts.forEach((c, cIdx) => {
        textToSpeak += `Pieza ${cIdx + 1}: ${c.quantity} de ${c.name}, largo ${c.lengthCm} cm por ancho ${c.widthCm} cm. `;
      });
    });
    speakCutDetails(textToSpeak);
    setTimeout(() => setIsVoiceActive(false), 6000);
  };

  // Save project to overall app state
  const handleSaveCurrentProject = (speak: boolean = true) => {
    const allCuts = furnitureUnits.flatMap(u => u.cuts.map(c => ({
      ...c,
      furnitureId: c.furnitureId || u.id,
      furnitureName: c.furnitureName || u.name,
      materialType: c.materialType || u.materialType || 'Melamina Blanca',
      thicknessMm: c.thicknessMm || u.thicknessMm || 15
    })));

    const activeUnitObj = furnitureUnits.find(u => u.id === activeUnitId) || furnitureUnits[0];

    const projectToSave: Project = {
      id: currentProjectId || 'proj_1',
      name: projectName.trim() || 'Proyecto de Carpintería',
      clientName: clientName.trim(),
      category: activeUnitObj?.category || 'gabinete',
      totalHeightCm: activeUnitObj?.heightCm || 80,
      totalWidthCm: activeUnitObj?.widthCm || 60,
      totalDepthCm: activeUnitObj?.depthCm || 40,
      materialType: activeUnitObj?.materialType || 'Melamina Blanca',
      thicknessMm: activeUnitObj?.thicknessMm || 15,
      createdAt: projects.find(p => p.id === currentProjectId)?.createdAt || new Date().toISOString().split('T')[0],
      cuts: allCuts,
      furnitureUnits: furnitureUnits,
      notes: notes,
      status: allCuts.length > 0 && allCuts.every(c => c.completed) ? 'completado' : 'en_corte'
    };

    onSaveProject(projectToSave);
    setSavedSuccessFlash(true);
    setTimeout(() => setSavedSuccessFlash(false), 3000);
    const now = new Date();
    setLastSavedTimestamp(now.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit', second: '2-digit' }));
    if (speak) {
      speakCutDetails(`Proyecto ${projectName} guardado correctamente.`);
    }
  };

  // Load project from history
  const handleLoadProject = (proj: Project) => {
    setCurrentProjectId(proj.id);
    setProjectName(proj.name);
    setClientName(proj.clientName || '');
    setNotes(proj.notes || '');

    if (onSelectProject) {
      onSelectProject(proj.id);
    }

    if (proj.furnitureUnits && proj.furnitureUnits.length > 0) {
      setFurnitureUnits(proj.furnitureUnits);
      setActiveUnitId(proj.furnitureUnits[0].id);
    } else {
      const singleUnit: FurnitureUnit = {
        id: 'unit_loaded_1',
        name: proj.name || 'Mueble A',
        category: proj.category || 'gabinete',
        heightCm: proj.totalHeightCm || 80,
        widthCm: proj.totalWidthCm || 60,
        depthCm: proj.totalDepthCm || 40,
        thicknessMm: proj.thicknessMm || 15,
        materialType: proj.materialType || 'Melamina Blanca',
        cuts: (proj.cuts || []).map(c => ({
          ...c,
          furnitureId: 'unit_loaded_1',
          furnitureName: proj.name || 'Mueble A'
        }))
      };
      setFurnitureUnits([singleUnit]);
      setActiveUnitId(singleUnit.id);
    }
    setShowSavedModal(false);
  };

  // Calculate total cubrecanto meters across all furniture units
  const totalCubrecantoMeters = furnitureUnits.reduce((sumProject, unit) => {
    const unitMeters = unit.cuts.reduce((sumCuts, cut) => {
      const edges = cut.edges || {};
      const topCm = edges.top ? cut.lengthCm : 0;
      const bottomCm = edges.bottom ? cut.lengthCm : 0;
      const leftCm = edges.left ? cut.widthCm : 0;
      const rightCm = edges.right ? cut.widthCm : 0;
      return sumCuts + (((topCm + bottomCm + leftCm + rightCm) * cut.quantity) / 100);
    }, 0);
    return sumProject + unitMeters;
  }, 0);

  // Overall Cuts count and Production Stats
  const allCuts = useMemo(() => {
    return furnitureUnits.flatMap(u => u.cuts);
  }, [furnitureUnits]);
  
  // Real-time production stats from Module 2 (Cuts & Offcuts) and Module 3 (Edgebanding & Assembly)
  const [productionStats, setProductionStats] = useState(() => {
    return getProjectProductionStats(currentProjectId || 'proj_1', allCuts);
  });

  const cutsCount = useMemo(() => {
    return furnitureUnits.reduce((acc, u) => acc + u.cuts.length, 0);
  }, [furnitureUnits]);

  // Re-fetch production stats when cuts or project change or when production event occurs
  useEffect(() => {
    const updateStats = () => {
      setProductionStats(getProjectProductionStats(currentProjectId || 'proj_1', allCuts));
    };
    updateStats();
    window.addEventListener('carpinteria_production_progress_change', updateStats);
    window.addEventListener('storage', updateStats);
    return () => {
      window.removeEventListener('carpinteria_production_progress_change', updateStats);
      window.removeEventListener('storage', updateStats);
    };
  }, [currentProjectId, cutsCount]);

  const handleResetProduction = () => {
    const confirmReset = window.confirm(
      `¿Deseas reiniciar todo el progreso de producción (cortes, retazos de almacén, canteado y ensamble) del proyecto "${projectName}"? Esta acción restablecerá el estado a 0% para comenzar la jornada de nuevo.`
    );
    if (!confirmReset) return;

    resetProjectProductionProgress(currentProjectId || 'proj_1');
    setProductionStats(getProjectProductionStats(currentProjectId || 'proj_1', allCuts));
    speakCutDetails(`Progreso de producción reiniciado a cero para ${projectName}.`);
  };

  return (
    <div className="max-w-7xl mx-auto p-4 sm:p-6 lg:p-8 space-y-8">
      
      {/* 🔒 BANNER DE MODO SOLO LECTURA PARA OPERARIO / CHALÁN */}
      {isReadOnly && (
        <div className="bg-gradient-to-r from-orange-100 via-amber-100 to-orange-100 border-4 border-orange-400 p-5 sm:p-6 rounded-3xl shadow-lg flex flex-col sm:flex-row items-center gap-4 text-orange-950 no-print">
          <div className="w-14 h-14 rounded-2xl bg-orange-500 text-white flex items-center justify-center font-black text-3xl shadow shrink-0 border-2 border-orange-300">
            🔒
          </div>
          <div className="text-center sm:text-left">
            <h3 className="text-xl sm:text-2xl font-black text-orange-950 flex items-center justify-center sm:justify-start gap-2">
              Modo Operario / Chalán (Solo Lectura)
            </h3>
            <p className="text-sm sm:text-base font-bold text-orange-900">
              Tienes autorización para consultar las medidas, despiece y piezas para corte y armado. La modificación de dimensiones, creación de nuevos muebles y guardado de proyectos están protegidos y reservados al Maestro de Taller.
            </p>
          </div>
        </div>
      )}

      {/* Top Header Navigation */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-white p-5 rounded-3xl border-4 border-amber-800/20 shadow-lg no-print">
        <button
          onClick={onBackToMenu}
          className="w-full sm:w-auto bg-slate-800 hover:bg-slate-900 text-white font-black text-lg px-6 py-3 rounded-2xl flex items-center justify-center gap-3 border-2 border-slate-700 transition cursor-pointer"
        >
          <ArrowLeft className="w-6 h-6 text-amber-400" />
          VOLVER AL MENÚ
        </button>

        <div className="text-center sm:text-right">
          <h2 className="text-2xl sm:text-3xl font-black text-amber-950">
            📐 PROYECTOS Y CALCULADORA DE CORTES
          </h2>
          <p className="text-sm sm:text-base font-bold text-slate-600">
            Agregue muebles al proyecto, configure medidas y marque cubrecantos interactivos
          </p>
        </div>

        <button
          onClick={() => setShowSavedModal(true)}
          className="w-full sm:w-auto bg-amber-600 hover:bg-amber-700 text-white font-black text-lg px-6 py-3 rounded-2xl flex items-center justify-center gap-2 border-2 border-amber-800 transition cursor-pointer shadow-md"
        >
          <Layers className="w-6 h-6 text-amber-200" />
          PROYECTOS GUARDADOS ({projects.length})
        </button>
      </div>

      {/* 📊 RESUMEN VISUAL DE AVANCE DE PRODUCCIÓN EN TALLER (MÓDULOS 2 Y 3) */}
      <div className="bg-white rounded-3xl p-5 sm:p-6 border-4 border-amber-900/20 shadow-xl space-y-4 no-print">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 border-b border-slate-200 pb-3">
          <div className="flex items-center gap-3">
            <span className="w-10 h-10 rounded-2xl bg-amber-100 text-amber-900 flex items-center justify-center text-xl font-black border-2 border-amber-300">
              📊
            </span>
            <div>
              <h3 className="text-lg sm:text-xl font-black text-slate-900 flex items-center gap-2">
                Estado y Avance de Producción
                <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-700 border border-slate-300">
                  {projectName}
                </span>
              </h3>
              <p className="text-xs font-bold text-slate-500">
                Progreso sincronizado en tiempo real de cortes (Módulo 2), canteado y ensamble (Módulo 3)
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleResetProduction}
              className="text-xs font-bold text-rose-700 hover:text-rose-900 bg-rose-50 hover:bg-rose-100 border border-rose-200 px-3 py-1.5 rounded-xl transition-all flex items-center gap-1.5 cursor-pointer shadow-xs"
              title="Reiniciar todo el progreso de producción para este proyecto"
            >
              <RotateCcw className="w-3.5 h-3.5 text-rose-600" />
              <span>Reiniciar Progreso de Producción</span>
            </button>
          </div>
        </div>

        {/* Progress Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          
          {/* 1. Módulo 2: Cortes */}
          <div className="bg-slate-50 p-4 rounded-2xl border-2 border-slate-200 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-black text-slate-700 flex items-center gap-1.5">
                <Scissors className="w-4 h-4 text-emerald-600" />
                Cortes (Módulo 2)
              </span>
              <span className="text-xs font-black text-emerald-700">
                {productionStats.cuts.percentage}%
              </span>
            </div>
            <div className="w-full h-3 bg-slate-200 rounded-full overflow-hidden">
              <div
                className="h-full bg-emerald-500 rounded-full transition-all duration-500"
                style={{ width: `${productionStats.cuts.percentage}%` }}
              />
            </div>
            <div className="flex justify-between text-[11px] font-bold text-slate-600">
              <span>{productionStats.cuts.completed} de {productionStats.cuts.total} piezas cortadas</span>
              <span>{productionStats.cuts.pending} pendientes</span>
            </div>
          </div>

          {/* 2. Módulo 3: Cubrecanto / Canteado */}
          <div className="bg-slate-50 p-4 rounded-2xl border-2 border-slate-200 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-black text-slate-700 flex items-center gap-1.5">
                <Ruler className="w-4 h-4 text-sky-600" />
                Canteado (Módulo 3)
              </span>
              <span className="text-xs font-black text-sky-700">
                {productionStats.edgeBanding.percentage}%
              </span>
            </div>
            <div className="w-full h-3 bg-slate-200 rounded-full overflow-hidden">
              <div
                className="h-full bg-sky-500 rounded-full transition-all duration-500"
                style={{ width: `${productionStats.edgeBanding.percentage}%` }}
              />
            </div>
            <div className="flex justify-between text-[11px] font-bold text-slate-600">
              <span>{productionStats.edgeBanding.completed} de {productionStats.edgeBanding.total} piezas canteadas</span>
              <span>{productionStats.edgeBanding.pending} pendientes</span>
            </div>
          </div>

          {/* 3. Módulo 3: Ensamble / Armado */}
          <div className="bg-slate-50 p-4 rounded-2xl border-2 border-slate-200 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-black text-slate-700 flex items-center gap-1.5">
                <Hammer className="w-4 h-4 text-amber-600" />
                Armado (Módulo 3)
              </span>
              <span className="text-xs font-black text-amber-700">
                {productionStats.assembly.percentage}%
              </span>
            </div>
            <div className="w-full h-3 bg-slate-200 rounded-full overflow-hidden">
              <div
                className="h-full bg-amber-500 rounded-full transition-all duration-500"
                style={{ width: `${productionStats.assembly.percentage}%` }}
              />
            </div>
            <div className="flex justify-between text-[11px] font-bold text-slate-600">
              <span>{productionStats.assembly.completed} de {productionStats.assembly.total} piezas armadas</span>
              <span>{productionStats.assembly.pending} pendientes</span>
            </div>
          </div>

        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* LEFT COLUMN: Project & Furniture Units Form */}
        <div className="lg:col-span-5 bg-white p-6 sm:p-8 rounded-3xl border-4 border-amber-800/20 shadow-xl space-y-6 no-print">
          
          {/* General Project Name & Client */}
          <div className="bg-amber-950 text-white p-5 rounded-2xl border-2 border-amber-600 space-y-3">
            <h3 className="text-2xl font-black text-amber-400 flex items-center gap-2">
              <Package className="w-7 h-7" />
              DATOS DEL PROYECTO
            </h3>

            <div>
              <label className="block text-sm font-bold text-amber-200 mb-1">
                Nombre del Proyecto General:
              </label>
              <input
                type="text"
                value={projectName}
                disabled={isReadOnly}
                onChange={(e) => setProjectName(e.target.value)}
                required
                className={`w-full text-xl font-black p-3 rounded-xl border-2 border-slate-600 outline-none ${
                  isReadOnly ? 'bg-slate-200 text-slate-700 cursor-not-allowed opacity-80' : 'bg-white text-black focus:border-amber-400'
                }`}
              />
            </div>

            <div>
              <label className="block text-sm font-bold text-amber-200 mb-1">
                Nombre del Cliente:
              </label>
              <input
                type="text"
                value={clientName}
                disabled={isReadOnly}
                onChange={(e) => setClientName(e.target.value)}
                placeholder="Ej. Sra. María López"
                className={`w-full text-lg font-bold p-2.5 rounded-xl border-2 border-slate-600 outline-none ${
                  isReadOnly ? 'bg-slate-200 text-slate-700 cursor-not-allowed opacity-80 placeholder:text-slate-400' : 'bg-white text-black placeholder:text-slate-500 focus:border-amber-400'
                }`}
              />
            </div>
          </div>

          {/* Furniture Selector Tabs */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-lg font-black text-slate-900">
                Muebles en este proyecto ({furnitureUnits.length}):
              </label>
            </div>

            <div className="flex flex-wrap gap-2">
              {furnitureUnits.map((u, idx) => (
                <button
                  key={`furn-unit-tab-${u.id}-${idx}`}
                  onClick={() => setActiveUnitId(u.id)}
                  className={`px-4 py-2.5 rounded-xl font-black text-base flex items-center gap-2 transition cursor-pointer border-3 ${
                    activeUnitId === u.id
                      ? 'bg-amber-600 text-white border-amber-900 shadow-md scale-105'
                      : 'bg-slate-100 text-slate-700 border-slate-300 hover:bg-amber-100'
                  }`}
                >
                  <span>🪚 {u.name}</span>
                  {!isReadOnly && furnitureUnits.length > 1 && (
                    <span
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteFurnitureUnit(u.id);
                      }}
                      className="hover:text-rose-300 text-xs font-bold px-1.5 py-0.5 rounded bg-slate-800 text-white cursor-pointer"
                      title="Eliminar este mueble"
                    >
                      ✕
                    </span>
                  )}
                </button>
              ))}
            </div>

            {/* Giant Button to Add Another Furniture Unit */}
            <button
              type="button"
              disabled={isReadOnly}
              onClick={handleAddFurnitureUnit}
              title={isReadOnly ? '🔒 Función restringida al Maestro del Taller' : 'Agregar nuevo mueble al proyecto'}
              className={`w-full btn-giant text-white border-2 border-emerald-950 shadow-xl py-4 text-xl font-black rounded-2xl flex items-center justify-center gap-3 uppercase tracking-wide transition ${
                isReadOnly
                  ? 'bg-slate-400 cursor-not-allowed opacity-60'
                  : 'bg-emerald-600 hover:bg-emerald-700 cursor-pointer'
              }`}
            >
              <PlusCircle className="w-8 h-8 text-emerald-200" />
              {isReadOnly ? '🔒 + AGREGAR MUEBLE (SOLO MAESTRO)' : '➕ AGREGAR OTRO MUEBLE A ESTE PROYECTO'}
            </button>
          </div>

          {/* Active Furniture Form */}
          <form onSubmit={handleRecalculateUnit} className="space-y-5 pt-4 border-t-4 border-slate-100">
            
            <div className="bg-amber-100/80 p-4 rounded-2xl border-2 border-amber-300">
              <label className="block text-base font-extrabold text-amber-950 mb-1">
                Nombre de este Mueble:
              </label>
              <input
                type="text"
                value={activeUnit.name}
                disabled={isReadOnly}
                onChange={(e) => updateActiveUnit({ name: e.target.value })}
                required
                className={`w-full text-xl font-black p-3 rounded-xl border-2 border-slate-600 outline-none ${
                  isReadOnly ? 'bg-slate-200 text-slate-700 cursor-not-allowed opacity-80' : 'bg-white text-black focus:border-amber-600'
                }`}
              />
            </div>

            {/* Furniture Category Selector */}
            <div>
              <label className="block text-lg font-black text-slate-900 mb-1">
                Tipo / Categoría de Mueble:
              </label>
              <select
                value={activeUnit.category}
                disabled={isReadOnly}
                onChange={(e) => {
                  const newCat = e.target.value as FurnitureCategory;
                  const newCuts = calculateFurnitureCuts(
                    newCat,
                    activeUnit.heightCm,
                    activeUnit.widthCm,
                    activeUnit.depthCm,
                    activeUnit.thicknessMm,
                    activeUnit.materialType
                  );
                  updateActiveUnit({ category: newCat, cuts: newCuts });
                }}
                className={`w-full text-xl font-black p-3.5 rounded-xl border-2 border-slate-600 outline-none ${
                  isReadOnly ? 'bg-slate-200 text-slate-700 cursor-not-allowed opacity-80' : 'bg-white text-black focus:border-amber-600 cursor-pointer'
                }`}
              >
                <option value="gabinete">🪚 Gabinete de Cocina / Alacena</option>
                <option value="closet">🚪 Ropero / Closet 2 Cuerpos</option>
                <option value="librero">📚 Librero / Estantería</option>
                <option value="escritorio">💻 Escritorio / Mesa de Trabajo</option>
                <option value="personalizado">🛠️ Mueble Personalizado (4 Piezas Base)</option>
              </select>
              {activeUnit.category === 'personalizado' && (
                <p className="text-xs font-extrabold text-amber-900 bg-amber-100 p-2 rounded-lg mt-1 border border-amber-300">
                  ℹ️ Mueble Personalizado: Armazón base de 4 piezas (Costados, Techo y Piso).
                </p>
              )}
            </div>

            {/* Overall Dimensions Grid */}
            <div className="grid grid-cols-3 gap-3 bg-amber-50/80 p-4 rounded-2xl border-2 border-amber-200">
              
              <div className="min-w-[80px]">
                <label className="block text-base font-extrabold text-amber-950 mb-1 text-center">
                  ALTO (cm)
                </label>
                <input
                  type="number"
                  step="0.1"
                  min="1"
                  disabled={isReadOnly}
                  value={activeUnit.heightCm === 0 ? '' : activeUnit.heightCm}
                  onChange={(e) => updateActiveUnit({ heightCm: e.target.value === '' ? 0 : Number(e.target.value) })}
                  onFocus={(e) => e.target.select()}
                  onClick={(e) => (e.target as HTMLInputElement).select()}
                  className={`w-full min-w-[80px] text-2xl font-black p-3 rounded-xl border-2 border-slate-600 text-center outline-none ${
                    isReadOnly ? 'bg-slate-200 text-slate-700 cursor-not-allowed opacity-80' : 'bg-white text-black focus:border-amber-600'
                  }`}
                />
              </div>

              <div className="min-w-[80px]">
                <label className="block text-base font-extrabold text-amber-950 mb-1 text-center">
                  ANCHO (cm)
                </label>
                <input
                  type="number"
                  step="0.1"
                  min="1"
                  disabled={isReadOnly}
                  value={activeUnit.widthCm === 0 ? '' : activeUnit.widthCm}
                  onChange={(e) => updateActiveUnit({ widthCm: e.target.value === '' ? 0 : Number(e.target.value) })}
                  onFocus={(e) => e.target.select()}
                  onClick={(e) => (e.target as HTMLInputElement).select()}
                  className={`w-full min-w-[80px] text-2xl font-black p-3 rounded-xl border-2 border-slate-600 text-center outline-none ${
                    isReadOnly ? 'bg-slate-200 text-slate-700 cursor-not-allowed opacity-80' : 'bg-white text-black focus:border-amber-600'
                  }`}
                />
              </div>

              <div className="min-w-[80px]">
                <label className="block text-base font-extrabold text-amber-950 mb-1 text-center">
                  FONDO (cm)
                </label>
                <input
                  type="number"
                  step="0.1"
                  min="1"
                  disabled={isReadOnly}
                  value={activeUnit.depthCm === 0 ? '' : activeUnit.depthCm}
                  onChange={(e) => updateActiveUnit({ depthCm: e.target.value === '' ? 0 : Number(e.target.value) })}
                  onFocus={(e) => e.target.select()}
                  onClick={(e) => (e.target as HTMLInputElement).select()}
                  className={`w-full min-w-[80px] text-2xl font-black p-3 rounded-xl border-2 border-slate-600 text-center outline-none ${
                    isReadOnly ? 'bg-slate-200 text-slate-700 cursor-not-allowed opacity-80' : 'bg-white text-black focus:border-amber-600'
                  }`}
                />
              </div>

            </div>

            {/* Material & Thickness with "+ Agregar" options */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-lg font-black text-slate-900 mb-1">
                  Espesor Madera:
                </label>
                <select
                  value={activeUnit.thicknessMm}
                  disabled={isReadOnly}
                  onChange={(e) => {
                    if (e.target.value === '__ADD_NEW_THICKNESS__') {
                      setShowAddThicknessModal(true);
                    } else {
                      updateActiveUnit({ thicknessMm: Number(e.target.value) });
                    }
                  }}
                  className={`w-full text-xl font-black p-3.5 rounded-xl border-3 border-slate-300 ${
                    isReadOnly ? 'bg-slate-200 text-slate-700 cursor-not-allowed opacity-80' : 'bg-white text-slate-900 cursor-pointer'
                  }`}
                >
                  {availableThicknesses.map((th, thIdx) => (
                    <option key={`thick-opt-${th}-${thIdx}`} value={th}>{th} mm</option>
                  ))}
                  {!isReadOnly && (
                    <option value="__ADD_NEW_THICKNESS__">➕ Agregar nuevo espesor...</option>
                  )}
                </select>
              </div>

              <div>
                <label className="block text-lg font-black text-slate-900 mb-1">
                  Material:
                </label>
                <select
                  value={activeUnit.materialType}
                  disabled={isReadOnly}
                  onChange={(e) => {
                    if (e.target.value === '__ADD_NEW_MATERIAL__') {
                      setShowAddMaterialModal(true);
                    } else {
                      updateActiveUnit({ materialType: e.target.value });
                    }
                  }}
                  className={`w-full text-xl font-black p-3.5 rounded-xl border-3 border-slate-300 ${
                    isReadOnly ? 'bg-slate-200 text-slate-700 cursor-not-allowed opacity-80' : 'bg-white text-slate-900 cursor-pointer'
                  }`}
                >
                  {availableMaterials.map((mat, matIdx) => (
                    <option key={`mat-opt-${mat}-${matIdx}`} value={mat}>{mat}</option>
                  ))}
                  {!isReadOnly && (
                    <option value="__ADD_NEW_MATERIAL__">➕ Agregar nuevo material...</option>
                  )}
                </select>
              </div>
            </div>

            {/* Calculate Action Button */}
            <button
              type="submit"
              disabled={isReadOnly}
              title={isReadOnly ? '🔒 Solo el Maestro puede recalcular dimensiones' : 'Recalcular despiece'}
              className={`w-full text-white font-black py-4 text-xl rounded-2xl border-2 border-amber-950 shadow-lg flex items-center justify-center gap-2 transition ${
                isReadOnly
                  ? 'bg-slate-400 cursor-not-allowed opacity-60'
                  : 'bg-amber-700 hover:bg-amber-800 cursor-pointer'
              }`}
            >
              <Ruler className="w-6 h-6 text-amber-300" />
              {isReadOnly ? '🔒 RECALCULO BLOQUEADO (SOLO MAESTRO)' : 'RECALCULAR CORTES DE ESTE MUEBLE'}
            </button>
          </form>

          {/* Save Overall Project Button & Auto-Save Status */}
          <div className="pt-4 border-t-2 border-slate-200 space-y-2">
            <button
              type="button"
              disabled={isReadOnly}
              onClick={() => handleSaveCurrentProject(true)}
              title={isReadOnly ? '🔒 Guardado bloqueado para Operario' : 'Guardar proyecto'}
              className={`w-full font-black text-xl sm:text-2xl py-4 sm:py-5 rounded-2xl border-2 shadow-xl flex items-center justify-center gap-3 uppercase tracking-wider transition-all duration-200 ${
                isReadOnly
                  ? 'bg-slate-400 border-slate-600 text-slate-100 cursor-not-allowed opacity-60'
                  : savedSuccessFlash 
                  ? 'bg-emerald-700 border-emerald-950 text-white scale-[1.02] ring-4 ring-emerald-400 cursor-pointer' 
                  : 'bg-emerald-600 hover:bg-emerald-700 text-white border-emerald-900 cursor-pointer'
              }`}
            >
              {isReadOnly ? (
                <>
                  <span>🔒 GUARDAR BLOQUEADO (SOLO MAESTRO)</span>
                </>
              ) : savedSuccessFlash ? (
                <>
                  <Check className="w-8 h-8 text-emerald-200 animate-bounce" />
                  <span>✓ ¡PROYECTO GUARDADO Y SINCRONIZADO!</span>
                </>
              ) : (
                <>
                  <Save className="w-8 h-8 text-emerald-200" />
                  <span>GUARDAR ESTE PROYECTO</span>
                </>
              )}
            </button>

            <div className="flex items-center justify-center gap-2 bg-emerald-50 text-emerald-900 border-2 border-emerald-300 px-3 py-1.5 rounded-xl text-xs font-black">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse shrink-0" />
              <span>{isReadOnly ? 'Modo Consulta (Solo Lectura) Activo' : 'Autoguardado en tiempo real activo'}</span>
              {!isReadOnly && lastSavedTimestamp && <span className="text-emerald-700 font-bold">({lastSavedTimestamp})</span>}
            </div>
          </div>

        </div>

        {/* RIGHT COLUMN: Grouped Cut Lists by Furniture Unit with Interactive Cubrecanto */}
        <div className="lg:col-span-7 space-y-6">
          
          {/* Progress Header & Accessibility Audio Controls */}
          <div className="bg-amber-950 text-white p-6 rounded-3xl border-4 border-amber-600 shadow-xl flex flex-col sm:flex-row items-center justify-between gap-6">
            <div>
              <div className="flex items-center gap-3">
                <span className="text-3xl">📋</span>
                <h3 className="text-2xl sm:text-3xl font-black text-white">
                  LISTA DE CORTES Y CUBRECANTO
                </h3>
              </div>
              <p className="text-amber-200 font-bold mt-1 text-base sm:text-lg">
                Proyecto: <span className="text-amber-400 underline">{projectName}</span> ({productionStats.cuts.completed} de {productionStats.cuts.total} piezas cortadas)
              </p>
              
              {/* Giant Progress Bar */}
              <div className="w-full bg-amber-900/80 rounded-full h-5 mt-3 border-2 border-amber-600 overflow-hidden">
                <div 
                  className="bg-emerald-500 h-full transition-all duration-300 font-bold text-xs text-slate-950 text-center leading-none flex items-center justify-center"
                  style={{ width: `${productionStats.cuts.percentage}%` }}
                >
                  {productionStats.cuts.percentage}%
                </div>
              </div>
            </div>

            <div className="flex sm:flex-col gap-3 w-full sm:w-auto no-print">
              <button
                onClick={handleSpeakAllCuts}
                className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white font-black px-4 py-3 rounded-2xl border-2 border-indigo-400 flex items-center justify-center gap-2 text-base shadow-lg cursor-pointer"
                title="Escuchar cortes en altavoz"
              >
                <Volume2 className={`w-6 h-6 text-indigo-200 ${isVoiceActive ? 'animate-bounce' : ''}`} />
                <span>Escuchar en Voz Alta</span>
              </button>

              <button
                onClick={() => window.print()}
                className="flex-1 bg-slate-800 hover:bg-slate-900 text-white font-black px-4 py-3 rounded-2xl border-2 border-slate-600 flex items-center justify-center gap-2 text-base shadow-lg cursor-pointer"
              >
                <Printer className="w-6 h-6 text-amber-300" />
                <span>Imprimir Hoja</span>
              </button>
            </div>
          </div>

          {/* TOTAL CUBRECANTO SUMMARY BANNER */}
          <div className="bg-amber-600 text-amber-950 p-5 rounded-3xl border-4 border-amber-900 shadow-xl flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-amber-950 text-amber-300 rounded-2xl text-3xl font-black shrink-0">
                🎗️
              </div>
              <div>
                <span className="text-xs font-black uppercase tracking-wider bg-amber-900 text-amber-100 px-3 py-1 rounded-full">
                  Resumen de Cinta Cubrecanto
                </span>
                <h4 className="text-2xl sm:text-3xl font-black text-amber-950 mt-1">
                  {totalCubrecantoMeters.toFixed(2)} Metros Requeridos
                </h4>
                <p className="text-sm font-extrabold text-amber-900">
                  Sugerencia: Comprar {(totalCubrecantoMeters * 1.1).toFixed(1)} metros (considera 10% de desperdicio).
                </p>
              </div>
            </div>

            <div className="bg-amber-950 text-amber-300 px-5 py-3 rounded-2xl text-center border-2 border-amber-400">
              <span className="text-xs font-bold uppercase text-amber-200">Total Proyecto</span>
              <p className="text-3xl font-black">{totalCubrecantoMeters.toFixed(1)} m</p>
            </div>
          </div>

          {/* Grouped Cut Lists for each Furniture Unit */}
          <div className="space-y-8">
            {furnitureUnits.map((unit, unitIdx) => (
              <div 
                key={`proj-unit-card-${unit.id}-${unitIdx}`}
                className={`bg-white rounded-3xl border-4 transition-all shadow-xl p-4 sm:p-6 space-y-4 ${
                  activeUnitId === unit.id ? 'border-amber-600 ring-4 ring-amber-200' : 'border-slate-300'
                }`}
              >
                
                {/* Furniture Unit Header */}
                <div className="bg-gradient-to-r from-amber-950 to-amber-900 text-white p-4 sm:p-5 rounded-2xl border-2 border-amber-600 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="bg-amber-500 text-amber-950 text-xs font-black px-3 py-1 rounded-full uppercase">
                        {unit.category}
                      </span>
                      <span className="bg-amber-800 text-amber-200 text-xs font-bold px-3 py-1 rounded-full">
                        {unit.materialType} ({unit.thicknessMm}mm)
                      </span>
                    </div>
                    <h3 className="text-2xl sm:text-3xl font-black text-white mt-1">
                      📦 {unit.name}
                    </h3>
                    <p className="text-sm font-bold text-amber-200">
                      Dimensiones: {unit.heightCm}cm Alto × {unit.widthCm}cm Ancho × {unit.depthCm}cm Fondo
                    </p>
                  </div>

                  <div className="flex items-center gap-2 flex-wrap">
                    <button
                      type="button"
                      disabled={isReadOnly}
                      onClick={() => {
                        const interiorW = Number((unit.widthCm - 2 * (unit.thicknessMm / 10)).toFixed(1));
                        const defaultH = 15;
                        const suggestedFw = Number((interiorW + 2 * (unit.thicknessMm / 10)).toFixed(1)); // unit.widthCm
                        setActiveUnitId(unit.id);
                        setDrawerWidth(interiorW);
                        setDrawerHeight(defaultH);
                        setDrawerDepth(Number((unit.depthCm - 5).toFixed(1)));
                        setDrawerQty(1);
                        setDrawerFrontWidth(suggestedFw);
                        setDrawerFrontHeight(defaultH);
                        setDrawerBoxMaterial(unit.materialType);
                        setDrawerBoxThickness(unit.thicknessMm || 15);
                        setDrawerFrontMaterial(unit.materialType);
                        setDrawerFrontThickness(unit.thicknessMm || 15);
                        setDrawerBottomMaterial('MDF 3mm Blanco');
                        setDrawerBottomThickness(3);
                        setDrawerTargetField(null);
                        setIncludeDrawerFront(true);
                        setShowDrawerModal(true);
                      }}
                      className={`px-4 py-2 rounded-xl text-sm font-black border-2 transition flex items-center gap-1.5 shadow-md ${
                        isReadOnly
                          ? 'bg-slate-300 text-slate-500 border-slate-400 cursor-not-allowed opacity-60'
                          : 'bg-amber-500 hover:bg-amber-400 text-amber-950 border-amber-300 cursor-pointer'
                      }`}
                      title={isReadOnly ? '🔒 Asistente de cajón protegido para Maestro' : 'Asistente para añadir cajón completo con correderas'}
                    >
                      <PlusCircle className="w-4 h-4 text-amber-950" />
                      + Agregar Cajón
                    </button>

                    <button
                      onClick={() => setActiveUnitId(unit.id)}
                      className={`px-4 py-2 rounded-xl text-sm font-black transition cursor-pointer border-2 ${
                        activeUnitId === unit.id
                          ? 'bg-amber-400 text-amber-950 border-amber-200'
                          : 'bg-amber-800 hover:bg-amber-700 text-white border-amber-600'
                      }`}
                    >
                      {activeUnitId === unit.id ? '✓ Mueble Activo' : 'Seleccionar Mueble'}
                    </button>
                  </div>
                </div>

                {/* Cut Items for this unit */}
                {unit.cuts.length === 0 ? (
                  <div className="bg-amber-50 p-6 rounded-2xl border-2 border-dashed border-amber-300 text-center">
                    <p className="text-lg font-black text-amber-950">
                      Aún no hay piezas registradas en este mueble.
                    </p>
                    <p className="text-sm font-bold text-amber-800 mt-1">
                      Utilice el formulario de abajo para agregar las piezas extras que necesite.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-6">
                    {unit.cuts.map((cut, idx) => (
                      <div
                        key={`unit-cut-${unit.id}-${cut.id || idx}-${idx}`}
                        className={`p-5 rounded-2xl border-4 transition-all space-y-4 ${
                          cut.completed
                            ? 'bg-emerald-50 border-emerald-500 text-emerald-950'
                            : 'bg-slate-50 border-slate-300 hover:border-amber-500 text-slate-900 shadow-md'
                        }`}
                      >
                        {/* Cut Title & Status Checkbox */}
                        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                          <div className="flex items-center gap-4">
                            <button
                              type="button"
                              onClick={() => handleToggleCut(unit.id, cut.id)}
                              className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 border-3 text-2xl font-black cursor-pointer ${
                                cut.completed
                                  ? 'bg-emerald-600 border-emerald-800 text-white'
                                  : 'bg-white border-amber-600 text-amber-800'
                              }`}
                            >
                              {cut.completed ? <Check className="w-8 h-8" /> : idx + 1}
                            </button>

                            <div>
                              <h4 className={`text-xl sm:text-2xl font-black ${cut.completed ? 'line-through text-emerald-900' : 'text-slate-900'}`}>
                                {cut.name}
                              </h4>
                              <p className="text-sm font-bold text-slate-600">
                                {cut.notes || 'Pieza de ensamble'}
                              </p>
                            </div>
                          </div>

                          <div className="flex items-center justify-between sm:justify-end gap-4 w-full sm:w-auto">
                            <div className="text-right">
                              <span className="text-2xl font-black bg-white px-3.5 py-1.5 rounded-xl border-2 border-slate-300 inline-block shadow-inner">
                                <span className="text-blue-600 font-black">{cut.lengthCm}</span>
                                <span className="text-slate-400 font-bold mx-1.5">×</span>
                                <span className="text-orange-600 font-black">{cut.widthCm}</span>
                                <span className="text-sm font-bold text-slate-600 ml-1.5">cm</span>
                              </span>
                              <p className="text-base font-black text-amber-900 mt-1">
                                CANTIDAD: <span className="text-xl text-amber-950 font-black">{cut.quantity}</span> Piezas
                              </p>
                            </div>

                            {!isReadOnly && (
                              <button
                                onClick={() => handleDeleteCut(unit.id, cut.id)}
                                className="p-2.5 text-rose-600 hover:bg-rose-100 rounded-xl no-print cursor-pointer"
                                title="Eliminar esta pieza"
                              >
                                <Trash2 className="w-6 h-6" />
                              </button>
                            )}
                          </div>
                        </div>

                        {/* Interactive Visual Edge Banding Representation */}
                        <EdgeBandingVisual
                          cut={cut}
                          onToggleEdge={handleToggleEdge}
                        />

                      </div>
                    ))}
                  </div>
                )}

                {/* Add Custom Piece Form for THIS active furniture unit (Disabled in Read-Only Mode) */}
                {activeUnitId === unit.id && (
                  isReadOnly ? (
                    <div className="mt-6 p-4 rounded-2xl bg-amber-100/50 border-2 border-amber-300 text-amber-950 font-bold text-sm text-center flex items-center justify-center gap-2">
                      <span>🔒 La edición, eliminación y adición de piezas está restringida al Maestro del Taller.</span>
                    </div>
                  ) : (
                    <form onSubmit={handleAddCustomCut} className="mt-6 pt-4 border-t-4 border-slate-200 bg-amber-50/80 p-5 rounded-2xl no-print space-y-3">
                      <h5 className="text-xl font-black text-amber-950 flex items-center gap-2">
                        <Plus className="w-6 h-6 text-amber-700" />
                        Agregar pieza extra manual a "{unit.name}":
                      </h5>
                      
                      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-12 gap-3">
                        
                        {/* Name */}
                        <div className="md:col-span-3">
                          <label className="block text-xs font-black text-slate-900 uppercase mb-1">
                            Nombre de Pieza:
                          </label>
                          <input
                            type="text"
                            placeholder="Ej. Amarre Superior Frontal"
                            value={customName}
                            onChange={(e) => setCustomName(e.target.value)}
                            onFocus={(e) => e.target.select()}
                            onClick={(e) => (e.target as HTMLInputElement).select()}
                            required
                            className="w-full text-base font-black p-3 rounded-xl border-2 border-slate-600 bg-white text-black focus:border-amber-600 outline-none"
                          />
                        </div>

                        {/* Piece Role / Category Selector */}
                        <div className="md:col-span-3">
                          <label className="block text-xs font-black text-slate-900 uppercase mb-1">
                            Tipo / Rol de Pieza:
                          </label>
                          <select
                            value={customCategory}
                            onChange={(e) => handleCategoryChange(e.target.value as WoodCut['category'])}
                            className="w-full text-sm font-black p-3 rounded-xl border-2 border-slate-600 bg-white text-black focus:border-amber-700 outline-none cursor-pointer"
                          >
                            <option value="amarre">🔩 Amarre / Listón Superior</option>
                            <option value="lateral">🟦 Costado / Lateral</option>
                            <option value="piso">🟧 Piso / Base</option>
                            <option value="techo">🟧 Techo / Tapa Superior</option>
                            <option value="repisa">🟩 Entrepaño / Repisa</option>
                            <option value="division">🔲 División Interior</option>
                            <option value="frente_cajon">🟨 Frente de Cajón</option>
                            <option value="lateral_cajon">🟦 Costado de Cajón</option>
                            <option value="trasera_cajon">🟧 Contrafrente Cajón</option>
                            <option value="fondo_cajon">🟪 Fondo Cajón (MDF 3mm)</option>
                            <option value="zocalo">🪵 Zócalo / Rodapié</option>
                            <option value="fondo">🟪 Fondo MDF 3mm</option>
                            <option value="puerta">🟨 Puerta Batiente</option>
                            <option value="otro">✨ Otro / Pieza Especial</option>
                          </select>
                        </div>

                        {/* Mandatory Quantity Field */}
                        <div className="md:col-span-2 min-w-[80px]">
                          <label className="block text-xs font-black text-slate-900 uppercase mb-1 text-center">
                            Cantidad:
                          </label>
                          <input
                            type="number"
                            min="1"
                            max="999"
                            required
                            value={customQty === 0 || customQty === '' ? '' : customQty}
                            onChange={(e) => setCustomQty(e.target.value === '' ? '' : Number(e.target.value))}
                            onFocus={(e) => e.target.select()}
                            onClick={(e) => (e.target as HTMLInputElement).select()}
                            className="w-full min-w-[80px] text-lg font-black p-3 rounded-xl border-2 border-slate-600 text-center bg-white text-black focus:border-amber-700 outline-none"
                          />
                        </div>

                        {/* Length (cm) */}
                        <div className="md:col-span-2 min-w-[80px]">
                          <label className="block text-xs font-black text-slate-900 uppercase mb-1 text-center">
                            Largo (cm):
                          </label>
                          <input
                            type="number"
                            step="0.1"
                            min="0.1"
                            required
                            value={customLength === 0 || customLength === '' ? '' : customLength}
                            onChange={(e) => setCustomLength(e.target.value === '' ? '' : Number(e.target.value))}
                            onFocus={(e) => e.target.select()}
                            onClick={(e) => (e.target as HTMLInputElement).select()}
                            className="w-full min-w-[80px] text-lg font-black p-3 rounded-xl border-2 border-slate-600 text-center bg-white text-black focus:border-blue-600 outline-none"
                          />
                        </div>

                        {/* Width (cm) */}
                        <div className="md:col-span-2 min-w-[80px]">
                          <label className="block text-xs font-black text-slate-900 uppercase mb-1 text-center">
                            Ancho (cm):
                          </label>
                          <input
                            type="number"
                            step="0.1"
                            min="0.1"
                            required
                            value={customWidth === 0 || customWidth === '' ? '' : customWidth}
                            onChange={(e) => setCustomWidth(e.target.value === '' ? '' : Number(e.target.value))}
                            onFocus={(e) => e.target.select()}
                            onClick={(e) => (e.target as HTMLInputElement).select()}
                            className="w-full min-w-[80px] text-lg font-black p-3 rounded-xl border-2 border-slate-600 text-center bg-white text-black focus:border-orange-600 outline-none"
                          />
                        </div>

                        {/* Add Button */}
                        <div className="col-span-1 sm:col-span-2 md:col-span-12 flex items-center justify-end mt-1">
                          <button
                            type="submit"
                            className="w-full sm:w-auto px-6 py-3.5 bg-amber-700 hover:bg-amber-800 text-white font-black text-base rounded-xl border-2 border-amber-950 flex items-center justify-center gap-2 cursor-pointer shadow-md"
                            title="Agregar esta pieza extra"
                          >
                            <Plus className="w-5 h-5 text-amber-200" />
                            <span>AGREGAR ESTA PIEZA MANUAL</span>
                          </button>
                        </div>

                      </div>
                    </form>
                  )
                )}

              </div>
            ))}
          </div>

        </div>

      </div>

      {/* 🪚 HIGH-CONTRAST TRANSITION BUTTONS TO MODULE 2 & MODULE 3 */}
      <div className="pt-4 pb-6 grid grid-cols-1 md:grid-cols-2 gap-4">
        
        {/* Button to Module 2: Cutting Optimizer */}
        <button
          type="button"
          onClick={() => {
            handleSaveCurrentProject(false);
            const allCuts = furnitureUnits.flatMap(u => u.cuts.map(c => {
              const isFondo = c.category === 'fondo' || c.category === 'fondo_cajon' || c.name.toLowerCase().includes('fondo') || c.name.toLowerCase().includes('3mm');
              return {
                ...c,
                furnitureName: u.name,
                materialType: c.materialType || (isFondo ? 'MDF 3mm Blanco' : u.materialType),
                thicknessMm: c.thicknessMm || (isFondo ? 3 : u.thicknessMm)
              };
            }));
            if (onProceedToOptimizer) {
              onProceedToOptimizer(allCuts, activeUnit.materialType, activeUnit.thicknessMm, projectName);
            }
          }}
          className="group w-full bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-700 hover:from-emerald-500 hover:to-teal-600 text-white font-black p-6 sm:p-7 rounded-3xl border-4 border-emerald-950 shadow-2xl hover:shadow-emerald-500/40 flex flex-col sm:flex-row items-center justify-between gap-4 transition-all transform hover:-translate-y-1 active:scale-[0.98] cursor-pointer ring-4 ring-emerald-400/30"
        >
          <div className="flex items-center gap-4 text-center sm:text-left">
            <div className="w-14 h-14 sm:w-16 sm:h-16 bg-emerald-950 text-emerald-300 rounded-2xl flex items-center justify-center text-2xl sm:text-3xl shrink-0 border-2 border-emerald-300 shadow-xl group-hover:rotate-6 group-hover:scale-110 transition-transform">
              ✂️
            </div>
            <div>
              <span className="block text-xl sm:text-2xl font-black tracking-tight text-white flex items-center justify-center sm:justify-start gap-2">
                Optimizar y Cortar
                <span className="bg-orange-500 text-white text-xs font-black px-2.5 py-0.5 rounded-full uppercase">
                  Módulo 2
                </span>
              </span>
              <span className="text-xs sm:text-sm font-bold text-emerald-100 block mt-0.5">
                Diagrama 2D, orientación y guía por regla
              </span>
            </div>
          </div>
          <div className="w-10 h-10 rounded-full bg-emerald-950 text-emerald-300 flex items-center justify-center font-black text-xl shrink-0">
            ➔
          </div>
        </button>

        {/* Button to Module 3: Assembly & Hardware */}
        <button
          type="button"
          onClick={() => {
            handleSaveCurrentProject(false);
            if (onNavigateToAssembly) {
              onNavigateToAssembly(currentProjectId || activeProjectId || undefined);
            }
          }}
          className="group w-full bg-gradient-to-r from-amber-600 via-orange-600 to-amber-700 hover:from-amber-500 hover:to-orange-600 text-white font-black p-6 sm:p-7 rounded-3xl border-4 border-amber-950 shadow-2xl hover:shadow-orange-500/40 flex flex-col sm:flex-row items-center justify-between gap-4 transition-all transform hover:-translate-y-1 active:scale-[0.98] cursor-pointer ring-4 ring-amber-400/30"
        >
          <div className="flex items-center gap-4 text-center sm:text-left">
            <div className="w-14 h-14 sm:w-16 sm:h-16 bg-amber-950 text-amber-300 rounded-2xl flex items-center justify-center text-2xl sm:text-3xl shrink-0 border-2 border-amber-300 shadow-xl group-hover:rotate-6 group-hover:scale-110 transition-transform">
              🔨
            </div>
            <div>
              <span className="block text-xl sm:text-2xl font-black tracking-tight text-white flex items-center justify-center sm:justify-start gap-2">
                Proceso de Armado
                <span className="bg-amber-950 text-amber-200 text-xs font-black px-2.5 py-0.5 rounded-full uppercase">
                  Módulo 3
                </span>
              </span>
              <span className="text-xs sm:text-sm font-bold text-amber-100 block mt-0.5">
                Paso a paso, checklist, herrajes y mecanizados
              </span>
            </div>
          </div>
          <div className="w-10 h-10 rounded-full bg-amber-950 text-amber-300 flex items-center justify-center font-black text-xl shrink-0">
            ➔
          </div>
        </button>

      </div>

      {/* Modal for Adding New Custom Thickness */}
      {showAddThicknessModal && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full border-4 border-amber-800 shadow-2xl overflow-hidden p-6 space-y-6">
            <div className="bg-amber-950 text-white p-4 -m-6 mb-2 border-b-4 border-amber-600 flex items-center justify-between">
              <h3 className="text-xl font-black flex items-center gap-2">
                <Plus className="w-6 h-6 text-amber-400" />
                AGREGAR NUEVO ESPESOR DE MADERA
              </h3>
              <button
                onClick={() => setShowAddThicknessModal(false)}
                className="bg-amber-800 text-white font-black px-3 py-1.5 rounded-lg text-sm"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveCustomThickness} className="space-y-4 pt-2">
              <div>
                <label className="block text-base font-black text-slate-900 mb-2">
                  Espesor en Milímetros (mm):
                </label>
                <input
                  type="number"
                  step="0.5"
                  min="1"
                  max="100"
                  placeholder="Ej. 16, 9, 6..."
                  value={newThicknessInput}
                  onChange={(e) => setNewThicknessInput(e.target.value)}
                  onFocus={(e) => e.target.select()}
                  onClick={(e) => (e.target as HTMLInputElement).select()}
                  required
                  className="w-full text-2xl font-black p-4 rounded-2xl border-2 border-slate-600 bg-white text-black focus:border-amber-600 outline-none"
                />
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddThicknessModal(false)}
                  className="flex-1 bg-slate-200 hover:bg-slate-300 text-slate-800 font-extrabold py-3 rounded-xl border border-slate-400 cursor-pointer"
                >
                  CANCELAR
                </button>
                <button
                  type="submit"
                  className="flex-1 bg-amber-700 hover:bg-amber-800 text-white font-black py-3 rounded-xl border-2 border-amber-950 shadow-lg cursor-pointer"
                >
                  GUARDAR Y APLICAR
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal for Adding New Custom Material */}
      {showAddMaterialModal && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full border-4 border-amber-800 shadow-2xl overflow-hidden p-6 space-y-6">
            <div className="bg-amber-950 text-white p-4 -m-6 mb-2 border-b-4 border-amber-600 flex items-center justify-between">
              <h3 className="text-xl font-black flex items-center gap-2">
                <Plus className="w-6 h-6 text-amber-400" />
                AGREGAR NUEVO MATERIAL
              </h3>
              <button
                onClick={() => setShowAddMaterialModal(false)}
                className="bg-amber-800 text-white font-black px-3 py-1.5 rounded-lg text-sm cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveCustomMaterial} className="space-y-4 pt-2">
              <div>
                <label className="block text-base font-black text-slate-900 mb-2">
                  Nombre del Nuevo Material:
                </label>
                <input
                  type="text"
                  placeholder="Ej. MDF Enchapado Encino 18mm"
                  value={newMaterialInput}
                  onChange={(e) => setNewMaterialInput(e.target.value)}
                  required
                  className="w-full text-xl font-black p-4 rounded-2xl border-2 border-slate-600 bg-white text-black focus:border-amber-600 outline-none"
                />
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddMaterialModal(false)}
                  className="flex-1 bg-slate-200 hover:bg-slate-300 text-slate-800 font-extrabold py-3 rounded-xl border border-slate-400 cursor-pointer"
                >
                  CANCELAR
                </button>
                <button
                  type="submit"
                  className="flex-1 bg-amber-700 hover:bg-amber-800 text-white font-black py-3 rounded-xl border-2 border-amber-950 shadow-lg cursor-pointer"
                >
                  GUARDAR Y USAR
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal for Quick Drawer Generator */}
      {showDrawerModal && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-xl w-full border-4 border-amber-800 shadow-2xl overflow-hidden p-6 space-y-5">
            <div className="bg-amber-950 text-white p-4 -m-6 mb-2 border-b-4 border-amber-600 flex items-center justify-between">
              <h3 className="text-xl font-black flex items-center gap-2">
                <PlusCircle className="w-6 h-6 text-amber-400" />
                ASISTENTE RÁPIDO: AGREGAR CAJÓN COMPLETO
              </h3>
              <button
                onClick={() => setShowDrawerModal(false)}
                className="bg-amber-800 text-white font-black px-3 py-1.5 rounded-lg text-sm cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="bg-amber-50 border-2 border-amber-300 p-3.5 rounded-2xl text-xs font-bold text-amber-900 leading-relaxed">
              💡 <strong>Cálculo Automático de Taller:</strong> Genera las 4 partes del cajón aplicando el descuento exacto de <strong>2.6 cm</strong> de holgura para correderas telescópicas (1.3cm por lado), costados de caja 2cm más bajos y fondo en MDF 3mm.
            </div>

            <form onSubmit={handleAddDrawerCuts} className="space-y-4">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="min-w-[80px]">
                  <label className="block text-xs font-black text-slate-900 uppercase mb-1 text-center">
                    Ancho Hueco (cm):
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    min="10"
                    required
                    value={drawerWidth}
                    onChange={(e) => {
                      const val = e.target.value;
                      setDrawerWidth(val);
                      const num = Number(val);
                      if (!isNaN(num) && num > 0) {
                        const suggestedFw = Number((num + 2 * ((activeUnit.thicknessMm || 15) / 10)).toFixed(1));
                        setDrawerFrontWidth(suggestedFw);
                      }
                    }}
                    onFocus={(e) => e.target.select()}
                    onClick={(e) => (e.target as HTMLInputElement).select()}
                    className="w-full min-w-[80px] text-lg font-black p-3 rounded-xl border-2 border-slate-600 bg-white text-black text-center focus:border-amber-600 outline-none"
                  />
                </div>

                <div className="min-w-[80px]">
                  <label className="block text-xs font-black text-slate-900 uppercase mb-1 text-center">
                    Alto Frente / Caja (cm):
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    min="5"
                    required
                    value={drawerHeight}
                    onChange={(e) => {
                      const val = e.target.value;
                      setDrawerHeight(val);
                      setDrawerFrontHeight(val);
                    }}
                    onFocus={(e) => e.target.select()}
                    onClick={(e) => (e.target as HTMLInputElement).select()}
                    className="w-full min-w-[80px] text-lg font-black p-3 rounded-xl border-2 border-slate-600 bg-white text-black text-center focus:border-amber-600 outline-none"
                  />
                </div>

                <div className="min-w-[80px]">
                  <label className="block text-xs font-black text-slate-900 uppercase mb-1 text-center">
                    Profundidad (cm):
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    min="15"
                    required
                    value={drawerDepth}
                    onChange={(e) => setDrawerDepth(e.target.value)}
                    onFocus={(e) => e.target.select()}
                    onClick={(e) => (e.target as HTMLInputElement).select()}
                    className="w-full min-w-[80px] text-lg font-black p-3 rounded-xl border-2 border-slate-600 bg-white text-black text-center focus:border-amber-600 outline-none"
                  />
                </div>

                <div className="min-w-[80px]">
                  <label className="block text-xs font-black text-slate-900 uppercase mb-1 text-center">
                    Cantidad Cajones:
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="50"
                    required
                    value={drawerQty}
                    onChange={(e) => setDrawerQty(e.target.value)}
                    onFocus={(e) => e.target.select()}
                    onClick={(e) => (e.target as HTMLInputElement).select()}
                    className="w-full min-w-[80px] text-lg font-black p-3 rounded-xl border-2 border-slate-600 bg-white text-black text-center focus:border-amber-600 outline-none"
                  />
                </div>
              </div>

              {/* Checkbox para Incluir o Excluir Frente de Cajón */}
              <div className="bg-amber-50 border-2 border-amber-300 p-3.5 rounded-2xl space-y-3">
                <label className="flex items-center gap-3 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={includeDrawerFront}
                    onChange={(e) => {
                      const checked = e.target.checked;
                      setIncludeDrawerFront(checked);
                      if (checked) {
                        const num = Number(drawerWidth);
                        if (!isNaN(num) && num > 0) {
                          setDrawerFrontWidth(Number((num + 2 * ((activeUnit.thicknessMm || 15) / 10)).toFixed(1)));
                        }
                        setDrawerFrontHeight(drawerHeight);
                      }
                    }}
                    className="w-5 h-5 accent-amber-600 rounded cursor-pointer"
                  />
                  <div>
                    <span className="text-sm font-black text-slate-900 block">
                      ✓ Incluir Frente de Cajón Exterior (Vista)
                    </span>
                    <span className="text-xs text-slate-600 font-bold">
                      {includeDrawerFront
                        ? 'Genera la pieza de vista frontal con material y medidas independientes.'
                        : 'Omitir frente (solo genera la caja interior: costados, contrafrente y fondo MDF 3mm).'}
                    </span>
                  </div>
                </label>

                {/* Campos de Medida Independientes para Frente de Vista */}
                {includeDrawerFront && (
                  <div className="pt-3 border-t-2 border-amber-200 bg-amber-100/70 p-3 rounded-xl">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-black text-amber-950 uppercase tracking-wide flex items-center gap-1.5">
                        📐 Medidas Independientes del Frente de Vista:
                      </span>
                      <span className="text-[11px] font-bold text-amber-800 bg-amber-200/80 px-2 py-0.5 rounded-md">
                        Ajustable para holguras o remetidos
                      </span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-black text-slate-900 uppercase mb-1">
                          Ancho Frente Vista (cm):
                        </label>
                        <input
                          type="number"
                          step="0.1"
                          min="5"
                          required={includeDrawerFront}
                          value={drawerFrontWidth}
                          onChange={(e) => setDrawerFrontWidth(e.target.value)}
                          onFocus={(e) => e.target.select()}
                          onClick={(e) => (e.target as HTMLInputElement).select()}
                          className="w-full text-base font-black p-2.5 rounded-xl border-2 border-amber-600 bg-white text-black text-center focus:ring-2 focus:ring-amber-500 outline-none"
                        />
                        <span className="text-[11px] font-bold text-amber-900 block mt-1">
                          💡 Sugerido: {Number((Number(drawerWidth) + 2 * ((activeUnit.thicknessMm || 15) / 10)).toFixed(1))} cm (Ancho hueco + 2× espesor)
                        </span>
                      </div>

                      <div>
                        <label className="block text-xs font-black text-slate-900 uppercase mb-1">
                          Alto Frente Vista (cm):
                        </label>
                        <input
                          type="number"
                          step="0.1"
                          min="5"
                          required={includeDrawerFront}
                          value={drawerFrontHeight}
                          onChange={(e) => setDrawerFrontHeight(e.target.value)}
                          onFocus={(e) => e.target.select()}
                          onClick={(e) => (e.target as HTMLInputElement).select()}
                          className="w-full text-base font-black p-2.5 rounded-xl border-2 border-amber-600 bg-white text-black text-center focus:ring-2 focus:ring-amber-500 outline-none"
                        />
                        <span className="text-[11px] font-bold text-amber-900 block mt-1">
                          💡 Sugerido: {drawerHeight} cm (Alto del frente exterior)
                        </span>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Selectores de Materiales (2 o 3 según frente) */}
              <div className={`grid grid-cols-1 ${includeDrawerFront ? 'sm:grid-cols-3' : 'sm:grid-cols-2'} gap-3 pt-1`}>
                <div>
                  <label className="block text-xs font-black text-slate-900 uppercase mb-1">
                    a) Caja / Costados ({drawerBoxThickness}mm):
                  </label>
                  <select
                    value={drawerBoxMaterial}
                    onChange={(e) => {
                      if (e.target.value === '__ADD_NEW_DRAWER_MATERIAL__') {
                        setDrawerTargetField('box');
                        setDrawerNewMatName('');
                        setDrawerNewMatThickness(drawerBoxThickness || activeUnit.thicknessMm || 15);
                      } else {
                        setDrawerBoxMaterial(e.target.value);
                      }
                    }}
                    className="w-full text-sm font-bold p-3 rounded-xl border-2 border-slate-600 bg-white text-black outline-none cursor-pointer"
                  >
                    {(availableMaterials && availableMaterials.length > 0
                      ? availableMaterials
                      : ['Melamina Blanca', 'Triplay Pino de 1ra', 'MDF Comercial', 'Madera Sólida Pino']
                    ).map((m, mIdx) => (
                      <option key={`drawer-box-mat-${m}-${mIdx}`} value={m}>{m}</option>
                    ))}
                    <option value="__ADD_NEW_DRAWER_MATERIAL__" className="text-amber-900 font-black bg-amber-100">
                      ➕ Agregar nuevo material/espesor...
                    </option>
                  </select>
                </div>

                {includeDrawerFront && (
                  <div>
                    <label className="block text-xs font-black text-amber-950 uppercase mb-1">
                      b) Frente Vista ({drawerFrontThickness}mm):
                    </label>
                    <select
                      value={drawerFrontMaterial}
                      onChange={(e) => {
                        if (e.target.value === '__ADD_NEW_DRAWER_MATERIAL__') {
                          setDrawerTargetField('front');
                          setDrawerNewMatName('');
                          setDrawerNewMatThickness(drawerFrontThickness || activeUnit.thicknessMm || 15);
                        } else {
                          setDrawerFrontMaterial(e.target.value);
                        }
                      }}
                      className="w-full text-sm font-bold p-3 rounded-xl border-2 border-amber-600 bg-white text-black outline-none cursor-pointer"
                    >
                      {(availableMaterials && availableMaterials.length > 0
                        ? availableMaterials
                        : ['Melamina Blanca', 'Triplay Pino de 1ra', 'MDF Comercial', 'Madera Sólida Pino']
                      ).map((m, mIdx) => (
                        <option key={`drawer-front-mat-${m}-${mIdx}`} value={m}>{m}</option>
                      ))}
                      <option value="__ADD_NEW_DRAWER_MATERIAL__" className="text-amber-900 font-black bg-amber-100">
                        ➕ Agregar nuevo material/espesor...
                      </option>
                    </select>
                  </div>
                )}

                <div>
                  <label className="block text-xs font-black text-slate-900 uppercase mb-1">
                    {includeDrawerFront ? 'c)' : 'b)'} Fondo ({drawerBottomThickness}mm):
                  </label>
                  <select
                    value={drawerBottomMaterial}
                    onChange={(e) => {
                      if (e.target.value === '__ADD_NEW_DRAWER_MATERIAL__') {
                        setDrawerTargetField('bottom');
                        setDrawerNewMatName('');
                        setDrawerNewMatThickness(3);
                      } else {
                        setDrawerBottomMaterial(e.target.value);
                      }
                    }}
                    className="w-full text-sm font-bold p-3 rounded-xl border-2 border-slate-600 bg-white text-black outline-none cursor-pointer"
                  >
                    <option value="MDF 3mm Blanco">MDF 3mm Blanco</option>
                    <option value="MDF 3mm Crudo / Natural">MDF 3mm Crudo / Natural</option>
                    <option value="Triplay 3mm Pino">Triplay 3mm Pino</option>
                    <option value="MDF 3mm Negro">MDF 3mm Negro</option>
                    {availableMaterials.filter(m => !['MDF 3mm Blanco', 'MDF 3mm Crudo / Natural', 'Triplay 3mm Pino', 'MDF 3mm Negro'].includes(m)).map((m, mIdx) => (
                      <option key={`drawer-bot-mat-${m}-${mIdx}`} value={m}>{m}</option>
                    ))}
                    <option value="__ADD_NEW_DRAWER_MATERIAL__" className="text-amber-900 font-black bg-amber-100">
                      ➕ Agregar nuevo material/espesor...
                    </option>
                  </select>
                </div>
              </div>

              {/* Mini-Formulario Desplegable para Registrar Nuevo Material/Espesor */}
              {drawerTargetField && (
                <div className="bg-amber-100/90 border-2 border-amber-500 p-4 rounded-2xl space-y-3 animate-fadeIn shadow-lg">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-black text-amber-950 uppercase tracking-wide flex items-center gap-1.5">
                      <Plus className="w-4 h-4 text-amber-700" />
                      Nuevo Material para: {
                        drawerTargetField === 'box'
                          ? 'Caja / Costados'
                          : drawerTargetField === 'front'
                          ? 'Frente de Vista'
                          : 'Fondo del Cajón'
                      }
                    </span>
                    <button
                      type="button"
                      onClick={() => setDrawerTargetField(null)}
                      className="text-xs font-black text-amber-800 hover:text-amber-950 bg-amber-200 px-2 py-1 rounded cursor-pointer"
                    >
                      ✕ Cancelar
                    </button>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div className="sm:col-span-2">
                      <label className="block text-xs font-bold text-slate-800 mb-1">
                        Nombre del Material:
                      </label>
                      <input
                        type="text"
                        placeholder="Ej. Melamina Roble Sonoma"
                        value={drawerNewMatName}
                        onChange={(e) => setDrawerNewMatName(e.target.value)}
                        autoFocus
                        required
                        className="w-full text-sm font-bold p-2.5 rounded-xl border-2 border-amber-600 bg-white text-black outline-none focus:ring-2 focus:ring-amber-500"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-800 mb-1">
                        Espesor (mm):
                      </label>
                      <input
                        type="number"
                        step="0.5"
                        min="1"
                        max="60"
                        value={drawerNewMatThickness}
                        onChange={(e) => setDrawerNewMatThickness(e.target.value)}
                        required
                        className="w-full text-sm font-black p-2.5 rounded-xl border-2 border-amber-600 bg-white text-black text-center outline-none focus:ring-2 focus:ring-amber-500"
                      />
                    </div>
                  </div>

                  <div className="flex justify-end gap-2 pt-1">
                    <button
                      type="button"
                      onClick={() => setDrawerTargetField(null)}
                      className="px-3 py-2 rounded-xl text-xs font-bold bg-white text-slate-700 border border-slate-300 hover:bg-slate-50 cursor-pointer"
                    >
                      Cancelar
                    </button>
                    <button
                      type="button"
                      onClick={handleSaveDrawerNewMaterial}
                      className="px-4 py-2 rounded-xl text-xs font-black bg-amber-700 hover:bg-amber-800 text-white border border-amber-950 shadow flex items-center gap-1.5 cursor-pointer"
                    >
                      <Check className="w-4 h-4 text-amber-200" />
                      Guardar y Aplicar Material
                    </button>
                  </div>
                </div>
              )}

              <div className="flex gap-3 pt-3">
                <button
                  type="button"
                  onClick={() => setShowDrawerModal(false)}
                  className="flex-1 bg-slate-200 hover:bg-slate-300 text-slate-800 font-extrabold py-3.5 rounded-xl border border-slate-400 cursor-pointer"
                >
                  CANCELAR
                </button>
                <button
                  type="submit"
                  className="flex-1 bg-amber-600 hover:bg-amber-700 text-white font-black py-3.5 rounded-xl border-2 border-amber-950 shadow-xl flex items-center justify-center gap-2 cursor-pointer text-base"
                >
                  <PlusCircle className="w-5 h-5 text-amber-200" />
                  GENERAR Y AGREGAR PIEZAS
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Saved Projects Modal */}
      {showSavedModal && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-3xl w-full max-h-[85vh] overflow-hidden border-4 border-amber-800 flex flex-col shadow-2xl">
            <div className="bg-amber-950 text-white p-6 border-b-4 border-amber-600 flex items-center justify-between">
              <h3 className="text-2xl font-black flex items-center gap-3">
                <Layers className="w-8 h-8 text-amber-400" />
                HISTORIAL DE PROYECTOS GUARDADOS
              </h3>
              <button
                onClick={() => setShowSavedModal(false)}
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
                projects.map(proj => (
                  <div
                    key={proj.id}
                    className="p-5 rounded-2xl border-3 border-amber-200 bg-amber-50/50 hover:border-amber-600 transition flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
                  >
                    <div>
                      <span className="bg-amber-800 text-white text-xs font-black px-3 py-1 rounded-full uppercase">
                        {proj.category}
                      </span>
                      <h4 className="text-2xl font-black text-slate-900 mt-1">{proj.name}</h4>
                      <p className="text-sm font-bold text-slate-600">
                        Cliente: {proj.clientName || 'General'} | {proj.totalHeightCm}×{proj.totalWidthCm}×{proj.totalDepthCm} cm
                      </p>
                      <p className="text-xs font-semibold text-amber-900 mt-1">
                        Material: {proj.materialType} ({proj.thicknessMm}mm) - {proj.cuts.length} Piezas Totales
                      </p>
                    </div>

                    <div className="flex items-center gap-3 w-full sm:w-auto">
                      <button
                        onClick={() => handleLoadProject(proj)}
                        className="flex-1 bg-amber-600 hover:bg-amber-700 text-white font-black px-4 py-3 rounded-xl border-2 border-amber-900 flex items-center justify-center gap-2 cursor-pointer"
                      >
                        CARGAR
                      </button>

                      {!isReadOnly && (
                        <button
                          onClick={() => onDeleteProject(proj.id)}
                          className="bg-rose-100 text-rose-800 hover:bg-rose-200 p-3 rounded-xl border border-rose-300 font-bold cursor-pointer"
                          title="Eliminar proyecto"
                        >
                          <Trash2 className="w-5 h-5" />
                        </button>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
