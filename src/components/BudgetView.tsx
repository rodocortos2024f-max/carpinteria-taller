import React, { useState, useMemo, useEffect, useRef } from 'react';
import { 
  Project, 
  WoodCut, 
  BudgetItem, 
  BudgetConfig, 
  BudgetItemCategory,
  CatalogMaterialItem,
  QuotationServiceItem
} from '../types';
import { optimizeCuttingLayout } from '../utils/cuttingOptimizer';
import { 
  getStoredMaterialsCatalog, 
  saveMaterialsCatalog, 
  resetMaterialsCatalogToDefaults, 
  findCatalogPrice,
  cleanMaterialName,
  getBoardMaterialTags
} from '../utils/materialsCatalog';
import { CatalogAdminModal } from './CatalogAdminModal';
import { AddBudgetItemModal } from './AddBudgetItemModal';
import { 
  DollarSign, 
  FileText, 
  Printer, 
  Plus, 
  Trash2, 
  Layers, 
  Tag, 
  Truck, 
  Wrench, 
  Check, 
  Download, 
  X, 
  Percent, 
  ShieldCheck, 
  Phone, 
  Mail, 
  MapPin, 
  User, 
  Calendar, 
  ArrowRight, 
  Box, 
  Sparkles, 
  HelpCircle, 
  RotateCcw,
  Eye,
  Sliders,
  Scissors,
  CheckCircle2,
  FolderOpen,
  BookOpen,
  BookmarkPlus,
  Send,
  ToggleLeft,
  ToggleRight,
  Edit3,
  Shield,
  ShieldOff,
  Loader2
} from 'lucide-react';
import { downloadElementAsPdf } from '../utils/pdfExport';

interface BudgetViewProps {
  projects: Project[];
  activeProjectId?: string;
  onBackToMenu: () => void;
  onNavigateToOptimizer?: (cuts: WoodCut[], material: string, thickness: number, projectName: string) => void;
  onNavigateToProject?: () => void;
  onNavigateToAssembly?: (projectId?: string) => void;
  onSelectProject?: (projectId: string) => void;
}

export const getWarrantyLabel = (period?: string, customText?: string): string => {
  switch (period) {
    case '3_meses':
      return '3 meses';
    case '6_meses':
      return '6 meses';
    case '12_meses':
      return '12 meses';
    case '24_meses':
      return '24 meses';
    case 'personalizado':
      return customText?.trim() || '12 meses';
    default:
      return '12 meses';
  }
};

export const DEFAULT_QUOTATION_SERVICES: QuotationServiceItem[] = [
  {
    id: 'srv-1',
    name: 'Fabricación completa de muebles a medida',
    description: 'Corte de precisión, canteado y ensamble de carpintería fina',
    type: 'included',
    active: true,
    isDefault: true
  },
  {
    id: 'srv-2',
    name: 'Tableros, cubrecantos y herrajes de primera calidad',
    description: 'Materiales certificados de alta resistencia y durabilidad',
    type: 'included',
    active: true,
    isDefault: true
  },
  {
    id: 'srv-3',
    name: 'Flete y transporte al domicilio del cliente',
    description: 'Traslado seguro con protección acolchada hasta el sitio de obra',
    type: 'included',
    active: true,
    isDefault: true
  },
  {
    id: 'srv-4',
    name: 'Montaje, nivelación y anclaje profesional en obra',
    description: 'Fijación segura a muros y calibración fina de puertas y correderas',
    type: 'included',
    active: true,
    isDefault: true
  },
  {
    id: 'srv-5',
    name: 'Garantía por escrito de taller por 12 meses',
    description: 'Cobertura directa contra desajustes o defectos de fabricación',
    type: 'included',
    active: true,
    isDefault: true
  }
];

const DEFAULT_CONFIG: BudgetConfig = {
  currencySymbol: '$',
  laborType: 'percent',
  laborValue: 40, // 40% sobre materiales
  profitMarginPercent: 20, // 20% ganancia
  overheadCost: 350, // Consumibles / tornillería / adhesivo
  transportCost: 400, // Flete
  installationCost: 600, // Instalación y armado en obra
  taxPercent: 16,
  applyTax: false,
  discountPercent: 0,
  workshopName: 'Carpintería & Taller Profesional',
  workshopPhone: '+52 55 1234 5678',
  workshopEmail: 'taller@carpinteria.com',
  workshopAddress: 'Av. Maestros Carpinteros #100',
  clientName: '',
  clientPhone: '',
  clientAddress: '',
  validityDays: 15,
  estimatedDeliveryDays: 12,
  paymentTerms: '60% de anticipo para compra de materiales y 40% contra entrega e instalación conforme.',
  warrantyTerms: '12 meses de garantía contra defectos de fabricación y desajuste de herrajes.',
  notes: 'Incluye nivelación de muebles, fijación a muros y limpieza posterior al montaje.',
  hasWarranty: true,
  warrantyPeriod: '12_meses',
  customWarrantyMonths: 12,
  customWarrantyText: '12 meses',
  servicesList: DEFAULT_QUOTATION_SERVICES
};

export const BudgetView: React.FC<BudgetViewProps> = ({
  projects,
  activeProjectId,
  onBackToMenu,
  onNavigateToOptimizer,
  onNavigateToProject,
  onNavigateToAssembly,
  onSelectProject
}) => {
  // Selector de Proyecto Activo
  const [selectedProjectId, setSelectedProjectId] = useState<string>(() => {
    if (activeProjectId && projects.some(p => p.id === activeProjectId)) return activeProjectId;
    return projects[0]?.id || '';
  });

  const [showProjectModal, setShowProjectModal] = useState<boolean>(false);
  const [showPdfModal, setShowPdfModal] = useState<boolean>(false);
  const [quotePresentationMode, setQuotePresentationMode] = useState<'commercial' | 'detailed'>('commercial');

  const projectsRef = React.useRef(projects);
  projectsRef.current = projects;

  // Sincronizar selectedProjectId cuando cambie la prop activeProjectId
  useEffect(() => {
    if (activeProjectId && projectsRef.current.some(p => p.id === activeProjectId)) {
      setSelectedProjectId(activeProjectId);
    }
  }, [activeProjectId]);

  const activeProject = projects.find(p => p.id === selectedProjectId) || projects[0];

  const handleProjectChange = (newProjId: string) => {
    setSelectedProjectId(newProjId);
    if (onSelectProject) {
      onSelectProject(newProjId);
    }
  };

  // Configuración de Presupuesto
  const [config, setConfig] = useState<BudgetConfig>(() => {
    const saved = localStorage.getItem(`carpinteria_budget_config_${selectedProjectId}`);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        return { 
          ...DEFAULT_CONFIG, 
          ...parsed,
          hasWarranty: parsed.hasWarranty !== undefined ? parsed.hasWarranty : true,
          warrantyPeriod: parsed.warrantyPeriod || '12_meses',
          customWarrantyMonths: parsed.customWarrantyMonths || 12,
          customWarrantyText: parsed.customWarrantyText || '12 meses',
          servicesList: parsed.servicesList && parsed.servicesList.length > 0 
            ? parsed.servicesList 
            : DEFAULT_QUOTATION_SERVICES
        };
      } catch (e) {
        // fallback
      }
    }
    return {
      ...DEFAULT_CONFIG,
      clientName: activeProject?.clientName || '',
      hasWarranty: true,
      warrantyPeriod: '12_meses',
      customWarrantyMonths: 12,
      customWarrantyText: '12 meses',
      servicesList: DEFAULT_QUOTATION_SERVICES
    };
  });

  // Estado para edición interactiva de servicios en la vista previa
  const servicesList: QuotationServiceItem[] = useMemo(() => {
    if (config.servicesList && config.servicesList.length > 0) {
      return config.servicesList;
    }
    return DEFAULT_QUOTATION_SERVICES;
  }, [config.servicesList]);

  // Manejadores del Editor Dinámico de Servicios
  const handleToggleService = (id: string) => {
    setConfig(prev => {
      const currentList = prev.servicesList || DEFAULT_QUOTATION_SERVICES;
      const target = currentList.find(s => s.id === id);
      const isWarrantyItem = target && (target.id === 'srv-5' || target.name.toLowerCase().includes('garantía'));
      
      const updated = currentList.map(s => s.id === id ? { ...s, active: !s.active } : s);
      return { 
        ...prev, 
        servicesList: updated,
        hasWarranty: isWarrantyItem ? !target.active : prev.hasWarranty
      };
    });
  };

  const handleUpdateServiceName = (id: string, newName: string) => {
    setConfig(prev => {
      const currentList = prev.servicesList || DEFAULT_QUOTATION_SERVICES;
      const updated = currentList.map(s => s.id === id ? { ...s, name: newName } : s);
      return { ...prev, servicesList: updated };
    });
  };

  const handleToggleServiceType = (id: string) => {
    setConfig(prev => {
      const currentList = prev.servicesList || DEFAULT_QUOTATION_SERVICES;
      const updated = currentList.map(s => {
        if (s.id === id) {
          const nextType: 'included' | 'additional' = s.type === 'included' ? 'additional' : 'included';
          return { ...s, type: nextType, amount: nextType === 'additional' ? (s.amount || 500) : 0 };
        }
        return s;
      });
      return { ...prev, servicesList: updated };
    });
  };

  const handleUpdateServiceAmount = (id: string, amount: number) => {
    setConfig(prev => {
      const currentList = prev.servicesList || DEFAULT_QUOTATION_SERVICES;
      const updated = currentList.map(s => s.id === id ? { ...s, amount: Math.max(0, amount) } : s);
      return { ...prev, servicesList: updated };
    });
  };

  const handleDeleteService = (id: string) => {
    setConfig(prev => {
      const currentList = prev.servicesList || DEFAULT_QUOTATION_SERVICES;
      const target = currentList.find(s => s.id === id);
      const isWarrantyItem = target && (target.id === 'srv-5' || target.name.toLowerCase().includes('garantía'));
      const updated = currentList.filter(s => s.id !== id);
      return { 
        ...prev, 
        servicesList: updated,
        hasWarranty: isWarrantyItem ? false : prev.hasWarranty
      };
    });
  };

  const handleAddCustomService = () => {
    const newService: QuotationServiceItem = {
      id: `srv-${Date.now()}`,
      name: 'Nuevo Servicio / Concepto Personalizado',
      type: 'included',
      amount: 0,
      active: true
    };
    setConfig(prev => ({
      ...prev,
      servicesList: [...(prev.servicesList || DEFAULT_QUOTATION_SERVICES), newService]
    }));
  };

  const handleResetServicesToDefault = () => {
    const label = getWarrantyLabel(config.warrantyPeriod || '12_meses', config.customWarrantyText);
    const defaultServices = DEFAULT_QUOTATION_SERVICES.map(s => {
      if (s.id === 'srv-5') {
        return {
          ...s,
          name: `Garantía por escrito de taller por ${label}`,
          active: config.hasWarranty !== false
        };
      }
      return s;
    });
    setConfig(prev => ({
      ...prev,
      servicesList: defaultServices
    }));
  };

  // Manejadores sincronizados de Garantía Dinámica
  const handleToggleWarranty = (enable: boolean) => {
    setConfig(prev => {
      const currentPeriod = prev.warrantyPeriod || '12_meses';
      const label = getWarrantyLabel(currentPeriod, prev.customWarrantyText);
      const serviceName = `Garantía por escrito de taller por ${label}`;
      const warrantyTerms = `${label} de garantía contra defectos de fabricación y desajuste de herrajes.`;

      let currentList = prev.servicesList || DEFAULT_QUOTATION_SERVICES;
      const warrantyIndex = currentList.findIndex(s => s.id === 'srv-5' || s.name.toLowerCase().includes('garantía'));

      let updatedList = [...currentList];
      if (enable) {
        if (warrantyIndex >= 0) {
          updatedList[warrantyIndex] = {
            ...updatedList[warrantyIndex],
            name: serviceName,
            active: true
          };
        } else {
          updatedList.push({
            id: 'srv-5',
            name: serviceName,
            description: 'Cobertura directa contra desajustes o defectos de fabricación',
            type: 'included',
            amount: 0,
            active: true,
            isDefault: true
          });
        }
      } else {
        if (warrantyIndex >= 0) {
          updatedList[warrantyIndex] = {
            ...updatedList[warrantyIndex],
            active: false
          };
        }
      }

      return {
        ...prev,
        hasWarranty: enable,
        warrantyTerms: enable ? (prev.warrantyTerms || warrantyTerms) : prev.warrantyTerms,
        servicesList: updatedList
      };
    });
  };

  const handleUpdateWarrantyPeriod = (newPeriod: string) => {
    setConfig(prev => {
      const label = getWarrantyLabel(newPeriod, prev.customWarrantyText);
      const serviceName = `Garantía por escrito de taller por ${label}`;
      const warrantyTerms = `${label} de garantía contra defectos de fabricación y desajuste de herrajes.`;

      let currentList = prev.servicesList || DEFAULT_QUOTATION_SERVICES;
      const warrantyIndex = currentList.findIndex(s => s.id === 'srv-5' || s.name.toLowerCase().includes('garantía'));

      let updatedList = [...currentList];
      if (warrantyIndex >= 0) {
        updatedList[warrantyIndex] = {
          ...updatedList[warrantyIndex],
          name: serviceName,
          active: true
        };
      } else {
        updatedList.push({
          id: 'srv-5',
          name: serviceName,
          description: 'Cobertura directa contra desajustes o defectos de fabricación',
          type: 'included',
          amount: 0,
          active: true,
          isDefault: true
        });
      }

      return {
        ...prev,
        hasWarranty: true,
        warrantyPeriod: newPeriod,
        warrantyTerms,
        servicesList: updatedList
      };
    });
  };

  const handleUpdateCustomWarrantyText = (customText: string) => {
    setConfig(prev => {
      const label = customText.trim() || '12 meses';
      const serviceName = `Garantía por escrito de taller por ${label}`;
      const warrantyTerms = `${label} de garantía contra defectos de fabricación y desajuste de herrajes.`;

      let currentList = prev.servicesList || DEFAULT_QUOTATION_SERVICES;
      const warrantyIndex = currentList.findIndex(s => s.id === 'srv-5' || s.name.toLowerCase().includes('garantía'));

      let updatedList = [...currentList];
      if (warrantyIndex >= 0 && prev.warrantyPeriod === 'personalizado') {
        updatedList[warrantyIndex] = {
          ...updatedList[warrantyIndex],
          name: serviceName,
          active: true
        };
      }

      return {
        ...prev,
        customWarrantyText: customText,
        customWarrantyMonths: parseInt(customText) || prev.customWarrantyMonths || 12,
        warrantyTerms: prev.warrantyPeriod === 'personalizado' ? warrantyTerms : prev.warrantyTerms,
        servicesList: updatedList
      };
    });
  };

  // Estado para la descarga directa de PDF
  const [isGeneratingPdf, setIsGeneratingPdf] = useState<boolean>(false);
  const [pdfSuccessMessage, setPdfSuccessMessage] = useState<string | null>(null);

  const handleDownloadQuotationPdf = async () => {
    const sheetElement = document.getElementById('quotation-print-sheet');
    if (!sheetElement) {
      window.print();
      return;
    }
    try {
      setIsGeneratingPdf(true);
      const clientSlug = (config.clientName || activeProject?.clientName || activeProject?.name || 'Cliente')
        .replace(/[^a-zA-Z0-9áéíóúÁÉÍÓÚñÑ_-]/g, '_');
      const filename = `Cotizacion_${clientSlug}_${new Date().toISOString().slice(0, 10)}.pdf`;

      await downloadElementAsPdf(sheetElement, {
        filename,
        orientation: 'portrait',
        format: 'letter',
        marginMm: [6, 8, 6, 8],
        scale: 2
      });
      setPdfSuccessMessage('¡PDF descargado con éxito!');
      setTimeout(() => setPdfSuccessMessage(null), 3500);
    } catch (err) {
      console.error('Error generating quotation PDF directly:', err);
      window.print();
    } finally {
      setIsGeneratingPdf(false);
    }
  };

  // Guardar configuración al cambiar
  useEffect(() => {
    if (selectedProjectId) {
      localStorage.setItem(`carpinteria_budget_config_${selectedProjectId}`, JSON.stringify(config));
    }
  }, [config, selectedProjectId]);

  // Actualizar nombre de cliente si el proyecto activo cambia
  useEffect(() => {
    if (activeProject?.clientName && !config.clientName) {
      setConfig(prev => ({ ...prev, clientName: activeProject.clientName || '' }));
    }
  }, [activeProject?.id, activeProject?.clientName, config.clientName]);

  // Catálogo General de Insumos y Precios Base
  const [catalog, setCatalog] = useState<CatalogMaterialItem[]>(() => getStoredMaterialsCatalog());
  const [isCatalogModalOpen, setIsCatalogModalOpen] = useState<boolean>(false);
  const [isAddInsumoModalOpen, setIsAddInsumoModalOpen] = useState<boolean>(false);

  // Items de presupuesto (Materiales, Herrajes, Insumos)
  const [items, setItems] = useState<BudgetItem[]>([]);

  // Guardar catálogo al actualizarlo
  const handleSaveCatalog = (updatedCatalog: CatalogMaterialItem[]) => {
    setCatalog(updatedCatalog);
    saveMaterialsCatalog(updatedCatalog);
  };

  // Restablecer catálogo a fábrica
  const handleResetCatalog = () => {
    const defaults = resetMaterialsCatalogToDefaults();
    setCatalog(defaults);
  };

  // Aplicar precios del catálogo general al presupuesto actual
  const handleApplyCatalogPricesToBudget = () => {
    const updated = items.map(item => {
      const catPrice = findCatalogPrice(item.name, item.category, undefined, catalog);
      if (catPrice !== null && catPrice > 0) {
        const qty = Number(item.quantity) || 0;
        return {
          ...item,
          unitPrice: catPrice,
          totalPrice: Math.round(qty * catPrice)
        };
      }
      return item;
    });
    setItems(updated);
    saveItemsToStorage(updated);
  };

  // Función para autocalcular los items basados en el proyecto activo
  const calculateAutoItems = (project: Project): BudgetItem[] => {
    if (!project) return [];

    const cuts = project.cuts || [];
    const autoItems: BudgetItem[] = [];

    // 1. TABLEROS / HOJAS DE MADERA (Agrupados por Material y Espesor)
    const materialGroups: Record<string, { material: string; thickness: number; cuts: WoodCut[] }> = {};
    
    cuts.forEach(cut => {
      const mat = cut.materialType || project.materialType || 'Melamina Estándar';
      const thick = cut.thicknessMm || project.thicknessMm || 15;
      const key = `${mat}_${thick}`;
      if (!materialGroups[key]) {
        materialGroups[key] = { material: mat, thickness: thick, cuts: [] };
      }
      materialGroups[key].cuts.push(cut);
    });

    Object.entries(materialGroups).forEach(([key, group], idx) => {
      // Calcular hojas usando el optimizador de corte
      let totalSheets = 1;
      try {
        const optResult = optimizeCuttingLayout(group.cuts, {
          primaryCutDirection: 'largo',
          sheetLengthCm: 244,
          sheetWidthCm: 122,
          sawKerfMm: 3,
          allowRotation: true,
          trimMarginCm: 1,
          materialType: group.material,
          thicknessMm: group.thickness
        });
        totalSheets = Math.max(1, optResult.totalSheets || 1);
      } catch (err) {
        // Fallback por área estimada con 20% de merma
        const totalAreaSqM = group.cuts.reduce((sum, c) => sum + ((c.lengthCm * c.widthCm * (c.quantity || 1)) / 10000), 0);
        const sheetAreaSqM = (2.44 * 1.22);
        totalSheets = Math.max(1, Math.ceil((totalAreaSqM * 1.25) / sheetAreaSqM));
      }

      // Precios base estimados según catálogo maestro
      const cleanName = cleanMaterialName(group.material, group.thickness);
      const catalogSheetPrice = findCatalogPrice(cleanName, 'tablero', group.thickness, catalog) || 
                                findCatalogPrice(group.material, 'tablero', group.thickness, catalog) ||
                                findCatalogPrice(`Tablero ${group.material}`, 'tablero', group.thickness, catalog);
      let defaultPricePerSheet = catalogSheetPrice || 850;
      if (!catalogSheetPrice) {
        if (group.thickness <= 6) defaultPricePerSheet = 320; // MDF Fondo
        else if (group.thickness >= 18) defaultPricePerSheet = 980;
      }

      autoItems.push({
        id: `tablero_${idx}_${Date.now()}`,
        category: 'tablero',
        name: cleanName,
        description: `Hojas estándar de 2.44 × 1.22 m para ${group.cuts.length} piezas`,
        quantity: totalSheets,
        unit: 'hojas',
        unitPrice: defaultPricePerSheet,
        totalPrice: totalSheets * defaultPricePerSheet,
        isAutoCalculated: true,
        included: true
      });
    });

    // 2. CUBRECANTO (Metros lineales totales calculados)
    let totalEdgeLinearMeters = 0;
    cuts.forEach(cut => {
      const qty = cut.quantity || 1;
      const edges = cut.edges || {};
      let pieceMeters = 0;
      if (edges.top) pieceMeters += cut.lengthCm / 100;
      if (edges.bottom) pieceMeters += cut.lengthCm / 100;
      if (edges.left) pieceMeters += cut.widthCm / 100;
      if (edges.right) pieceMeters += cut.widthCm / 100;
      totalEdgeLinearMeters += pieceMeters * qty;
    });

    // Añadir 10% de merma para cortes e ingletes
    const edgeMetersWithWaste = Math.ceil(totalEdgeLinearMeters * 1.10);
    if (edgeMetersWithWaste > 0) {
      const edgePrice = findCatalogPrice('Cubrecanto PVC Delgado', 'cubrecanto', undefined, catalog) || 12;
      autoItems.push({
        id: `cubrecanto_${Date.now()}`,
        category: 'cubrecanto',
        name: `Cubrecanto PVC / Melamínico (${project.thicknessMm || 15}mm)`,
        description: `${totalEdgeLinearMeters.toFixed(1)} m netos + 10% merma de aplicación`,
        quantity: edgeMetersWithWaste,
        unit: 'metros',
        unitPrice: edgePrice,
        totalPrice: edgeMetersWithWaste * edgePrice,
        isAutoCalculated: true,
        included: true
      });
    }

    // 3. CORREDERAS DE CAJONES (Contar cajones)
    let totalDrawers = 0;
    cuts.forEach(cut => {
      const isDrawerFront = cut.category === 'frente_cajon' || cut.name.toLowerCase().includes('frente caj');
      if (isDrawerFront) {
        totalDrawers += (cut.quantity || 1);
      }
    });

    // Si no encontró por frente_cajon, buscar por laterales / 2
    if (totalDrawers === 0) {
      let drawerSides = 0;
      cuts.forEach(cut => {
        if (cut.category === 'lateral_cajon' || cut.name.toLowerCase().includes('lateral caj')) {
          drawerSides += (cut.quantity || 1);
        }
      });
      if (drawerSides > 0) {
        totalDrawers = Math.ceil(drawerSides / 2);
      }
    }

    if (totalDrawers > 0) {
      const slidePrice = findCatalogPrice('Correderas Telescópicas Reforzadas', 'corredera', undefined, catalog) || 160;
      autoItems.push({
        id: `correderas_${Date.now()}`,
        category: 'corredera',
        name: `Correderas Telescópicas Reforzadas`,
        description: `Juegos de correderas para ${totalDrawers} cajones`,
        quantity: totalDrawers,
        unit: 'pares',
        unitPrice: slidePrice,
        totalPrice: totalDrawers * slidePrice,
        isAutoCalculated: true,
        included: true
      });
    }

    // 4. BISAGRAS CAZOLETA (Contar puertas)
    let totalDoors = 0;
    cuts.forEach(cut => {
      const isDoor = cut.category === 'puerta' || cut.name.toLowerCase().includes('puerta');
      if (isDoor) {
        totalDoors += (cut.quantity || 1);
      }
    });

    if (totalDoors > 0) {
      // 2 bisagras por puerta estándar
      const totalHinges = totalDoors * 2;
      const hingePrice = findCatalogPrice('Bisagra Cazoleta Cierre Suave', 'bisagra', undefined, catalog) || 45;
      autoItems.push({
        id: `bisagras_${Date.now()}`,
        category: 'bisagra',
        name: `Bisagras Cazoleta Cierre Suave (35mm)`,
        description: `2 bisagras por puerta para ${totalDoors} puertas`,
        quantity: totalHinges,
        unit: 'unidades',
        unitPrice: hingePrice,
        totalPrice: totalHinges * hingePrice,
        isAutoCalculated: true,
        included: true
      });
    }

    // 5. JALADERAS / TIRADORES
    const totalHandles = totalDrawers + totalDoors;
    if (totalHandles > 0) {
      const handlePrice = findCatalogPrice('Jaladera / Tirador Barra Aluminio', 'herraje', undefined, catalog) || 65;
      autoItems.push({
        id: `tiradores_${Date.now()}`,
        category: 'herraje',
        name: `Jaladeras / Tiradores de Aluminio`,
        description: `Para ${totalDrawers} cajones y ${totalDoors} puertas`,
        quantity: totalHandles,
        unit: 'unidades',
        unitPrice: handlePrice,
        totalPrice: totalHandles * handlePrice,
        isAutoCalculated: true,
        included: true
      });
    }

    // 6. TORNILLERÍA Y PEGAMENOS
    const screwPrice = findCatalogPrice('Tornillos Soberbios / Spax', 'consumible', undefined, catalog) || 180;
    autoItems.push({
      id: `tornilleria_${Date.now()}`,
      category: 'consumible',
      name: `Tornillos Soberbios / Spax + Tapatornillos`,
      description: `Tornillos de 4x50mm, 3.5x16mm, tarugos y tapas adhesivas`,
      quantity: 1,
      unit: 'paquete',
      unitPrice: screwPrice,
      totalPrice: screwPrice,
      isAutoCalculated: true,
      included: true
    });

    return autoItems;
  };

  // Cargar items iniciales o guardados
  useEffect(() => {
    if (!activeProject) return;

    const savedKey = `carpinteria_budget_items_${activeProject.id}`;
    const saved = localStorage.getItem(savedKey);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          const cleanedItems = parsed.map(item => ({
            ...item,
            name: item.category === 'tablero' ? cleanMaterialName(item.name) : item.name
          }));
          setItems(cleanedItems);
          return;
        }
      } catch (e) {
        // fallback
      }
    }

    // Autocalcular si no hay guardados
    const freshItems = calculateAutoItems(activeProject);
    setItems(freshItems);
  }, [activeProject?.id]);

  // Guardar items en localStorage al cambiar
  const saveItemsToStorage = (updatedItems: BudgetItem[]) => {
    const targetId = activeProject?.id || selectedProjectId;
    if (targetId) {
      localStorage.setItem(`carpinteria_budget_items_${targetId}`, JSON.stringify(updatedItems));
    }
  };

  // Recalcular items automáticamente
  const handleRecalculateAuto = () => {
    if (!activeProject) return;
    const fresh = calculateAutoItems(activeProject);
    setItems(fresh);
    saveItemsToStorage(fresh);
  };

  // Modificar item
  const handleUpdateItem = (id: string, field: keyof BudgetItem, value: any) => {
    const updated = items.map(item => {
      if (item.id === id) {
        const updatedItem = { ...item, [field]: value };
        if (field === 'quantity' || field === 'unitPrice') {
          updatedItem.totalPrice = Math.round((Number(updatedItem.quantity) || 0) * (Number(updatedItem.unitPrice) || 0));
        }
        return updatedItem;
      }
      return item;
    });
    setItems(updated);
    saveItemsToStorage(updated);
  };

  // Eliminar item inmediatamente del estado local y localStorage
  const handleDeleteItem = (id: string) => {
    const updated = items.filter(i => i.id !== id);
    setItems(updated);
    saveItemsToStorage(updated);
  };

  // Añadir item desde modal
  const handleAddItemFromModal = (newItem: BudgetItem, saveToCatalog?: CatalogMaterialItem) => {
    const updated = [...items, newItem];
    setItems(updated);
    saveItemsToStorage(updated);

    if (saveToCatalog) {
      const exists = catalog.some(c => c.name.toLowerCase() === saveToCatalog.name.toLowerCase() && c.category === saveToCatalog.category);
      if (!exists) {
        const newCat = [saveToCatalog, ...catalog];
        handleSaveCatalog(newCat);
      }
    }
  };

  // Guardar item individual de la tabla en el catálogo maestro
  const handleSaveItemToCatalog = (item: BudgetItem) => {
    const newItem: CatalogMaterialItem = {
      id: `mat_${Date.now()}`,
      name: item.name,
      category: item.category,
      unit: item.unit,
      unitPrice: item.unitPrice,
      description: item.description,
      isDefault: false
    };
    const exists = catalog.some(c => c.name.toLowerCase() === item.name.toLowerCase());
    let newCat: CatalogMaterialItem[];
    if (exists) {
      newCat = catalog.map(c => c.name.toLowerCase() === item.name.toLowerCase() ? { ...c, unitPrice: item.unitPrice, unit: item.unit } : c);
    } else {
      newCat = [newItem, ...catalog];
    }
    handleSaveCatalog(newCat);
    alert(`✓ "${item.name}" guardado exitosamente en el Catálogo General de Precios.`);
  };

  // ================= CÁLCULOS FINANCIEROS Y TOTALES =================
  const financialSummary = useMemo(() => {
    // 1. Costo directo de materiales incluidos
    const materialsCost = items
      .filter(i => i.included)
      .reduce((sum, i) => sum + (i.totalPrice || 0), 0);

    // 2. Mano de Obra
    let laborCost = 0;
    if (config.laborType === 'percent') {
      laborCost = Math.round(materialsCost * (config.laborValue / 100));
    } else {
      laborCost = Math.round(Number(config.laborValue) || 0);
    }

    // 3. Gastos Operativos y Logística
    const overhead = Number(config.overheadCost) || 0;
    const transport = Number(config.transportCost) || 0;
    const installation = Number(config.installationCost) || 0;
    const directProductionCost = materialsCost + laborCost + overhead + transport + installation;

    // 4. Margen de Utilidad / Ganancia del Taller
    const profitMargin = Math.round(directProductionCost * ((Number(config.profitMarginPercent) || 0) / 100));
    
    // Subtotal antes de servicios adicionales y descuento
    const subtotalBeforeAdditional = directProductionCost + profitMargin;

    // 4.5. Servicios y Conceptos Adicionales Activos
    const activeAdditionalServicesAmount = (config.servicesList || DEFAULT_QUOTATION_SERVICES)
      .filter(s => s.active && s.type === 'additional')
      .reduce((sum, s) => sum + (Number(s.amount) || 0), 0);

    const subtotalBeforeDiscount = subtotalBeforeAdditional + activeAdditionalServicesAmount;

    // 5. Descuento
    const discountAmount = Math.round(subtotalBeforeDiscount * ((Number(config.discountPercent) || 0) / 100));
    const subtotalAfterDiscount = subtotalBeforeDiscount - discountAmount;

    // 6. Impuestos (IVA)
    const taxAmount = config.applyTax ? Math.round(subtotalAfterDiscount * ((Number(config.taxPercent) || 0) / 100)) : 0;

    // 7. Gran Total
    const grandTotal = subtotalAfterDiscount + taxAmount;

    // 8. Anticipo (60%) y Saldo (40%)
    const advancePayment = Math.round(grandTotal * 0.60);
    const balancePayment = grandTotal - advancePayment;

    return {
      materialsCost,
      laborCost,
      overhead,
      transport,
      installation,
      directProductionCost,
      profitMargin,
      activeAdditionalServicesAmount,
      subtotalBeforeDiscount,
      discountAmount,
      subtotalAfterDiscount,
      taxAmount,
      grandTotal,
      advancePayment,
      balancePayment
    };
  }, [items, config]);

  // Generador de Mensaje Formal para WhatsApp con Servicios Activos
  const handleSendWhatsApp = () => {
    const clientName = config.clientName ? `Hola *${config.clientName}*,` : 'Estimado cliente,';
    const activeServices = (config.servicesList || DEFAULT_QUOTATION_SERVICES).filter(s => s.active);

    const servicesText = activeServices.length > 0 
      ? activeServices.map((s, idx) => {
          if (s.type === 'additional' && (s.amount || 0) > 0) {
            return `  • ${s.name}: *+${config.currencySymbol} ${s.amount?.toLocaleString()}*`;
          }
          return `  • ${s.name}: *(Incluido)*`;
        }).join('\n')
      : '  • Fabricación, flete, armado e instalación profesional a medida.';

    const furnitureText = furnitureUnitsList.map(f => `  🪚 *${f.name}* (${f.dimensions})`).join('\n');

    const message = `${clientName} le compartimos el presupuesto formal para su proyecto:

📐 *PROYECTO: ${activeProject?.name || 'Muebles a Medida'}*
${furnitureText}

✨ *SERVICIOS INCLUIDOS Y CONDICIONES:*
${servicesText}

💰 *INVERSIÓN TOTAL:*
💵 *PRECIO FINAL: ${config.currencySymbol} ${financialSummary.grandTotal.toLocaleString()}* ${config.applyTax ? `(IVA ${config.taxPercent}% incluido)` : ''}
💳 *Anticipo (60%):* ${config.currencySymbol} ${financialSummary.advancePayment.toLocaleString()}
📦 *Contra Entrega (40%):* ${config.currencySymbol} ${financialSummary.balancePayment.toLocaleString()}

⏱️ *Tiempo estimado de entrega:* ${config.estimatedDeliveryDays} días hábiles${config.hasWarranty !== false ? `\n🛡️ *Garantía:* ${config.warrantyTerms || `${getWarrantyLabel(config.warrantyPeriod, config.customWarrantyText)} directa de taller`}` : ''}

_Emitido por: ${config.workshopName} | Tel: ${config.workshopPhone}_`;

    const encodedMessage = encodeURIComponent(message);
    const phone = config.clientPhone ? config.clientPhone.replace(/\D/g, '') : '';
    const whatsappUrl = phone 
      ? `https://api.whatsapp.com/send?phone=${phone}&text=${encodedMessage}`
      : `https://api.whatsapp.com/send?text=${encodedMessage}`;

    window.open(whatsappUrl, '_blank');
  };

  // Lista descriptiva de muebles para el reporte/cotización
  const furnitureUnitsList = useMemo(() => {
    if (!activeProject) return [];
    if (activeProject.furnitureUnits && activeProject.furnitureUnits.length > 0) {
      return activeProject.furnitureUnits.map((unit, idx) => {
        const letter = String.fromCharCode(65 + idx);
        const name = unit.name.toLowerCase().startsWith('mueble') ? unit.name : `Mueble ${letter}: ${unit.name}`;
        const totalPieces = unit.cuts.reduce((sum, c) => sum + (c.quantity || 1), 0);
        return {
          name,
          category: unit.category || 'Mueble',
          dimensions: `${unit.heightCm} cm Alto × ${unit.widthCm} cm Ancho × ${unit.depthCm} cm Prof.`,
          material: `${unit.materialType || activeProject.materialType} (${unit.thicknessMm || activeProject.thicknessMm}mm)`,
          totalPieces,
          notes: unit.notes
        };
      });
    }
    return [{
      name: activeProject.name,
      category: activeProject.category || 'Mueble',
      dimensions: `${activeProject.totalHeightCm} cm Alto × ${activeProject.totalWidthCm} cm Ancho × ${activeProject.totalDepthCm} cm Prof.`,
      material: `${activeProject.materialType} (${activeProject.thicknessMm}mm)`,
      totalPieces: (activeProject.cuts || []).reduce((sum, c) => sum + (c.quantity || 1), 0),
      notes: activeProject.notes
    }];
  }, [activeProject]);

  // Helper para imprimir PDF
  const handlePrintQuote = () => {
    window.print();
  };

  return (
    <div className="max-w-7xl mx-auto p-4 sm:p-6 lg:p-8 space-y-8">
      
      {/* ========================================================================= */}
      {/* HEADER DE MÓDULO 4                                                        */}
      {/* ========================================================================= */}
      <div className="bg-emerald-950 text-white rounded-3xl p-6 sm:p-8 border-4 border-emerald-600 shadow-2xl flex flex-col md:flex-row items-center justify-between gap-6 no-print">
        <div className="flex items-center gap-5 text-center sm:text-left">
          <div className="w-16 h-16 sm:w-20 sm:h-20 bg-emerald-600 text-white rounded-3xl flex items-center justify-center font-black text-3xl sm:text-4xl shadow-lg border-2 border-emerald-300 shrink-0">
            💵
          </div>
          <div>
            <div className="flex items-center gap-2 justify-center sm:justify-start">
              <span className="bg-emerald-500 text-emerald-950 text-xs font-black uppercase px-2.5 py-0.5 rounded-full">
                Módulo 4
              </span>
              <span className="text-emerald-200 text-xs font-bold">
                Costos, Presupuestos & Catálogo General
              </span>
            </div>
            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-black text-white tracking-tight mt-0.5">
              Cotización y Catálogo de Precios
            </h2>
            <p className="text-sm sm:text-base font-semibold text-emerald-200 mt-1">
              Cálculo automatizado de tableros, cubrecanto, herrajes, mano de obra, catálogo de precios e informe en PDF.
            </p>
          </div>
        </div>

        {/* Acciones de Navegación Rápida */}
        <div className="flex items-center gap-2.5 flex-wrap justify-center md:justify-end">
          {onNavigateToProject && (
            <button
              type="button"
              onClick={onNavigateToProject}
              className="bg-emerald-900 hover:bg-emerald-800 text-white font-bold px-3.5 py-2.5 rounded-xl border border-emerald-700 flex items-center gap-1.5 text-xs shadow-md transition cursor-pointer"
            >
              <span>🪚</span>
              <span>Módulo 1: Despiece</span>
            </button>
          )}

          {onNavigateToOptimizer && (
            <button
              type="button"
              onClick={() => onNavigateToOptimizer(
                activeProject?.cuts || [],
                activeProject?.materialType || 'Melamina Blanca',
                activeProject?.thicknessMm || 15,
                activeProject?.name || 'Proyecto'
              )}
              className="bg-emerald-900 hover:bg-emerald-800 text-white font-bold px-3.5 py-2.5 rounded-xl border border-emerald-700 flex items-center gap-1.5 text-xs shadow-md transition cursor-pointer"
            >
              <span>✂️</span>
              <span>Módulo 2: Corte</span>
            </button>
          )}

          {onNavigateToAssembly && (
            <button
              type="button"
              onClick={() => onNavigateToAssembly(activeProject?.id)}
              className="bg-emerald-900 hover:bg-emerald-800 text-white font-bold px-3.5 py-2.5 rounded-xl border border-emerald-700 flex items-center gap-1.5 text-xs shadow-md transition cursor-pointer"
            >
              <span>🔨</span>
              <span>Módulo 3: Armado</span>
            </button>
          )}

          <button
            type="button"
            onClick={() => setIsCatalogModalOpen(true)}
            className="bg-teal-800 hover:bg-teal-700 text-white font-black px-3.5 py-2.5 rounded-xl border-2 border-teal-500 flex items-center gap-1.5 text-xs shadow-md transition cursor-pointer"
            title="Administrar Catálogo General de Precios e Insumos"
          >
            <BookOpen className="w-4 h-4 text-teal-300" />
            <span>📚 Catálogo de Precios</span>
          </button>

          <button
            type="button"
            onClick={onBackToMenu}
            className="bg-amber-800 hover:bg-amber-700 text-white font-black px-4 py-2.5 rounded-xl border-2 border-amber-600 flex items-center gap-2 text-xs sm:text-sm shadow-md transition cursor-pointer"
          >
            <span>🏠 Menú</span>
          </button>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* BARRA SELECTORA GENERAL DE PROYECTO ACTIVO                                */}
      {/* ========================================================================= */}
      <div className="bg-white rounded-3xl p-4 sm:p-5 border-4 border-emerald-900/20 shadow-xl flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4 no-print">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-emerald-950 text-emerald-300 flex items-center justify-center font-black text-xl shadow-md border-2 border-emerald-600 shrink-0">
            📂
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="bg-emerald-100 text-emerald-950 text-[10px] font-black uppercase px-2 py-0.5 rounded-md border border-emerald-300">
                PROYECTO A COTIZAR
              </span>
              <span className="text-slate-500 text-xs font-bold">
                {projects.length} {projects.length === 1 ? 'proyecto registrado' : 'proyectos registrados'}
              </span>
            </div>
            <h3 className="text-lg sm:text-xl font-black text-slate-900 leading-tight mt-0.5">
              {activeProject?.name || 'Seleccione un Proyecto'}
            </h3>
          </div>
        </div>

        {/* Dropdown Selector General + Botón Modal */}
        <div className="flex items-center gap-2.5 flex-1 md:max-w-xl justify-end">
          <div className="relative flex-1">
            <select
              value={selectedProjectId}
              onChange={(e) => handleProjectChange(e.target.value)}
              className="w-full bg-slate-100 hover:bg-slate-200 text-black font-black text-xs sm:text-sm py-3 px-3.5 rounded-2xl border-3 border-emerald-600 focus:outline-none focus:ring-3 focus:ring-emerald-500/40 cursor-pointer shadow-sm"
            >
              {projects.map((proj, projIdx) => {
                const totalPieces = (proj.cuts || []).reduce((sum, c) => sum + (c.quantity || 1), 0);
                const unitsCount = proj.furnitureUnits?.length || 1;
                return (
                  <option key={`budget-proj-opt-${proj.id}-${projIdx}`} value={proj.id} className="text-black font-bold">
                    📁 {proj.name} {proj.clientName ? `• Cliente: ${proj.clientName}` : ''} ({totalPieces} piezas • {unitsCount} {unitsCount === 1 ? 'mueble' : 'muebles'})
                  </option>
                );
              })}
            </select>
          </div>

          <button
            type="button"
            onClick={() => setShowProjectModal(true)}
            className="bg-emerald-700 hover:bg-emerald-800 text-white font-black text-xs sm:text-sm px-4 py-3 rounded-2xl border-2 border-emerald-950 flex items-center gap-2 transition cursor-pointer shadow-md shrink-0"
            title="Ver todos los proyectos"
          >
            <Layers className="w-4 h-4 text-emerald-200" />
            <span className="hidden sm:inline">PROYECTOS ({projects.length})</span>
          </button>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* BOTÓN DESTACADO: VISTA PREVIA Y DESCARGA DE COTIZACIÓN PDF                */}
      {/* ========================================================================= */}
      <div className="bg-gradient-to-r from-emerald-700 via-emerald-800 to-teal-900 rounded-3xl p-5 sm:p-6 text-white shadow-2xl border-4 border-emerald-950 flex flex-col sm:flex-row items-center justify-between gap-4 no-print">
        <div className="flex items-center gap-4 text-center sm:text-left">
          <div className="w-14 h-14 rounded-2xl bg-white text-emerald-800 flex items-center justify-center text-3xl shadow-lg shrink-0">
            📄
          </div>
          <div>
            <h3 className="text-xl sm:text-2xl font-black tracking-tight">
              Cotización Formal para el Cliente
            </h3>
            <p className="text-xs sm:text-sm font-semibold text-emerald-100 mt-0.5">
              Genera el documento en PDF con membrete del taller, desglose de muebles, condiciones y firma.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3 w-full sm:w-auto justify-end">
          <button
            type="button"
            onClick={() => setShowPdfModal(true)}
            className="w-full sm:w-auto bg-amber-400 hover:bg-amber-300 text-amber-950 font-black text-sm sm:text-base px-6 py-3.5 rounded-2xl shadow-xl border-3 border-amber-600 flex items-center justify-center gap-2.5 transition transform active:scale-95 cursor-pointer"
          >
            <FileText className="w-5 h-5" />
            <span>📄 VISTA PREVIA & PDF COTIZACIÓN</span>
          </button>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* GRID PRINCIPAL: 2 COLUMNAS (TABLA DE INSUMOS + CONFIGURACIÓN & TOTALES)    */}
      {/* ========================================================================= */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start no-print">
        
        {/* COLUMNA IZQUIERDA (8 COLS): TABLA DE MATERIALES E INSUMOS */}
        <div className="lg:col-span-8 space-y-6">
          
          <div className="bg-white rounded-3xl p-5 sm:p-6 border-4 border-emerald-900/10 shadow-xl space-y-5">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b-2 border-slate-200 pb-4">
              <div>
                <div className="flex items-center gap-2">
                  <span className="bg-emerald-100 text-emerald-900 text-[10px] font-black uppercase px-2.5 py-0.5 rounded-md">
                    Insumos & Materiales
                  </span>
                  <span className="text-xs font-bold text-slate-500">
                    {items.filter(i => i.included).length} items activos
                  </span>
                </div>
                <h3 className="text-xl sm:text-2xl font-black text-slate-900 mt-1">
                  1. Desglose de Materiales y Herrajes
                </h3>
              </div>

              <div className="flex items-center gap-2 flex-wrap">
                <button
                  type="button"
                  onClick={handleRecalculateAuto}
                  className="bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold px-3 py-2 rounded-xl text-xs flex items-center gap-1.5 border border-slate-300 transition cursor-pointer"
                  title="Recalcular tableros y metros desde los cortes del proyecto"
                >
                  <RotateCcw className="w-3.5 h-3.5 text-emerald-700" />
                  <span>Recalcular</span>
                </button>

                <button
                  type="button"
                  onClick={handleApplyCatalogPricesToBudget}
                  className="bg-teal-50 hover:bg-teal-100 text-teal-950 font-black px-3 py-2 rounded-xl text-xs flex items-center gap-1.5 border border-teal-300 transition cursor-pointer"
                  title="Actualizar los precios unitarios de esta tabla con los precios vigentes del Catálogo"
                >
                  <Sparkles className="w-3.5 h-3.5 text-teal-600" />
                  <span>Sincronizar Catálogo</span>
                </button>

                <button
                  type="button"
                  onClick={() => setIsCatalogModalOpen(true)}
                  className="bg-teal-700 hover:bg-teal-800 text-white font-black px-3 py-2 rounded-xl text-xs flex items-center gap-1.5 border border-teal-900 transition cursor-pointer shadow-sm"
                  title="Administrar el Catálogo de Precios Maestro"
                >
                  <BookOpen className="w-3.5 h-3.5 text-teal-200" />
                  <span>📚 Catálogo</span>
                </button>

                <button
                  type="button"
                  onClick={() => setIsAddInsumoModalOpen(true)}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white font-black px-3.5 py-2 rounded-xl text-xs flex items-center gap-1.5 border border-emerald-800 transition cursor-pointer shadow-sm"
                >
                  <Plus className="w-4 h-4" />
                  <span>+ Agregar Insumo</span>
                </button>
              </div>
            </div>

            {/* Lista de Insumos */}
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse min-w-[650px]">
                <thead>
                  <tr className="bg-slate-900 text-white text-xs font-black uppercase tracking-wider">
                    <th className="p-3 rounded-l-xl w-10 text-center">Inc.</th>
                    <th className="p-3">Insumo / Concepto</th>
                    <th className="p-3 w-28 text-center">Cantidad</th>
                    <th className="p-3 w-24 text-center">Unidad</th>
                    <th className="p-3 w-32 text-right">Precio Unit. ({config.currencySymbol})</th>
                    <th className="p-3 w-32 text-right">Total ({config.currencySymbol})</th>
                    <th className="p-3 rounded-r-xl w-16 text-center">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 text-sm">
                  {items.map((item, itemIdx) => {
                    const isBoard = item.category === 'tablero';
                    const isEdge = item.category === 'cubrecanto';
                    const isSlide = item.category === 'corredera';

                    return (
                      <tr 
                        key={`budget-item-row-${item.id}-${itemIdx}`} 
                        className={`hover:bg-slate-50 transition ${!item.included ? 'opacity-40 bg-slate-100' : ''}`}
                      >
                        {/* Checkbox Incluido */}
                        <td className="p-3 text-center">
                          <input
                            type="checkbox"
                            checked={item.included}
                            onChange={(e) => handleUpdateItem(item.id, 'included', e.target.checked)}
                            className="w-5 h-5 accent-emerald-600 rounded cursor-pointer"
                          />
                        </td>

                        {/* Nombre y Descripción */}
                        <td className="p-3">
                          <div className="flex items-start gap-2">
                            <span className={`text-base shrink-0 mt-0.5 ${
                              isBoard ? 'text-amber-700' : isEdge ? 'text-blue-600' : isSlide ? 'text-purple-600' : 'text-slate-600'
                            }`}>
                              {isBoard ? '🪵' : isEdge ? '🏷️' : isSlide ? '📏' : '🔩'}
                            </span>
                            <div className="flex-1 space-y-0.5">
                              <input
                                type="text"
                                value={item.name}
                                onChange={(e) => handleUpdateItem(item.id, 'name', e.target.value)}
                                className="w-full font-bold text-slate-900 bg-transparent border-b border-transparent hover:border-slate-300 focus:border-emerald-600 focus:outline-none text-sm px-1 py-0.5 rounded"
                              />
                              <input
                                type="text"
                                value={item.description || ''}
                                onChange={(e) => handleUpdateItem(item.id, 'description', e.target.value)}
                                placeholder="Detalles o especificaciones..."
                                className="w-full text-xs text-slate-500 bg-transparent border-b border-transparent hover:border-slate-300 focus:border-emerald-600 focus:outline-none px-1"
                              />
                            </div>
                          </div>
                        </td>

                        {/* Cantidad */}
                        <td className="p-3 text-center">
                          <input
                            type="number"
                            min="1"
                            step="any"
                            value={item.quantity === 0 ? '' : item.quantity}
                            onChange={(e) => handleUpdateItem(item.id, 'quantity', e.target.value === '' ? 0 : parseFloat(e.target.value) || 0)}
                            onFocus={(e) => e.target.select()}
                            onClick={(e) => (e.target as HTMLInputElement).select()}
                            className="w-20 text-center font-black text-slate-900 bg-slate-100 rounded-xl border border-slate-300 py-1.5 px-2 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                          />
                        </td>

                        {/* Unidad */}
                        <td className="p-3 text-center">
                          <input
                            type="text"
                            value={item.unit}
                            onChange={(e) => handleUpdateItem(item.id, 'unit', e.target.value)}
                            className="w-20 text-center text-xs font-bold text-slate-600 bg-slate-100 rounded-xl border border-slate-300 py-1.5 px-1 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                          />
                        </td>

                        {/* Precio Unitario */}
                        <td className="p-3 text-right">
                          <div className="flex items-center justify-end gap-1">
                            <span className="text-xs font-bold text-slate-500">{config.currencySymbol}</span>
                            <input
                              type="number"
                              min="0"
                              step="any"
                              value={item.unitPrice === 0 ? '' : item.unitPrice}
                              onChange={(e) => handleUpdateItem(item.id, 'unitPrice', e.target.value === '' ? 0 : parseFloat(e.target.value) || 0)}
                              onFocus={(e) => e.target.select()}
                              onClick={(e) => (e.target as HTMLInputElement).select()}
                              className="w-24 text-right font-black text-slate-900 bg-slate-100 rounded-xl border border-slate-300 py-1.5 px-2 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                            />
                          </div>
                        </td>

                        {/* Total Fila */}
                        <td className="p-3 text-right font-black text-slate-950 text-base">
                          {config.currencySymbol} {item.totalPrice.toLocaleString()}
                        </td>

                        {/* Botones Acciones */}
                        <td className="p-3 text-center">
                          <div className="flex items-center justify-center gap-1">
                            <button
                              type="button"
                              onClick={() => handleSaveItemToCatalog(item)}
                              className="text-slate-400 hover:text-teal-700 p-1.5 rounded-lg hover:bg-teal-50 transition cursor-pointer"
                              title="Guardar o actualizar precio en el Catálogo General"
                            >
                              <BookmarkPlus className="w-4 h-4" />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDeleteItem(item.id)}
                              className="text-slate-400 hover:text-rose-600 p-1.5 rounded-lg hover:bg-rose-50 transition cursor-pointer"
                              title="Eliminar insumo"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Subtotal de Materiales */}
            <div className="bg-emerald-50 rounded-2xl p-4 border-2 border-emerald-200 flex items-center justify-between">
              <div>
                <p className="text-xs font-black uppercase tracking-wider text-emerald-900">
                  Subtotal Directo de Insumos & Materiales:
                </p>
                <p className="text-xs font-medium text-emerald-700">
                  Tableros, cantos, correderas, bisagras y consumibles seleccionados
                </p>
              </div>
              <p className="text-2xl font-black text-emerald-950">
                {config.currencySymbol} {financialSummary.materialsCost.toLocaleString()}
              </p>
            </div>

          </div>

          {/* DATOS DEL CLIENTE Y DEL TALLER */}
          <div className="bg-white rounded-3xl p-5 sm:p-6 border-4 border-emerald-900/10 shadow-xl space-y-4">
            <div className="border-b-2 border-slate-200 pb-3 flex items-center justify-between">
              <h3 className="text-xl font-black text-slate-900 flex items-center gap-2">
                <User className="w-5 h-5 text-emerald-700" />
                Datos para la Cotización (Cliente & Taller)
              </h3>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Cliente */}
              <div className="space-y-3 bg-slate-50 p-4 rounded-2xl border border-slate-200">
                <p className="text-xs font-black text-emerald-900 uppercase">Información del Cliente</p>
                <div>
                  <label className="text-xs font-bold text-slate-700">Nombre del Cliente:</label>
                  <input
                    type="text"
                    value={config.clientName}
                    onChange={(e) => setConfig({ ...config, clientName: e.target.value })}
                    placeholder="Ej. Ing. Roberto Mendoza"
                    className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 font-bold text-sm text-slate-900 mt-1 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-700">Teléfono / WhatsApp:</label>
                  <input
                    type="text"
                    value={config.clientPhone}
                    onChange={(e) => setConfig({ ...config, clientPhone: e.target.value })}
                    placeholder="Ej. +52 55 9876 5432"
                    className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 font-bold text-sm text-slate-900 mt-1 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-700">Dirección de Instalación:</label>
                  <input
                    type="text"
                    value={config.clientAddress}
                    onChange={(e) => setConfig({ ...config, clientAddress: e.target.value })}
                    placeholder="Ej. Col. Nápoles, CDMX"
                    className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 font-bold text-sm text-slate-900 mt-1 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  />
                </div>
              </div>

              {/* Taller */}
              <div className="space-y-3 bg-slate-50 p-4 rounded-2xl border border-slate-200">
                <p className="text-xs font-black text-emerald-900 uppercase">Membrete del Taller / Carpintero</p>
                <div>
                  <label className="text-xs font-bold text-slate-700">Nombre del Taller:</label>
                  <input
                    type="text"
                    value={config.workshopName}
                    onChange={(e) => setConfig({ ...config, workshopName: e.target.value })}
                    className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 font-bold text-sm text-slate-900 mt-1 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-700">Teléfono de Contacto:</label>
                  <input
                    type="text"
                    value={config.workshopPhone}
                    onChange={(e) => setConfig({ ...config, workshopPhone: e.target.value })}
                    className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 font-bold text-sm text-slate-900 mt-1 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-700">Correo Electrónico:</label>
                  <input
                    type="text"
                    value={config.workshopEmail}
                    onChange={(e) => setConfig({ ...config, workshopEmail: e.target.value })}
                    className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 font-bold text-sm text-slate-900 mt-1 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  />
                </div>
              </div>
            </div>

            {/* Condiciones Comerciales */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
              <div>
                <label className="text-xs font-bold text-slate-700">Días de Validez de la Oferta:</label>
                <input
                  type="number"
                  value={config.validityDays === 0 ? '' : config.validityDays}
                  onChange={(e) => setConfig({ ...config, validityDays: e.target.value === '' ? 0 : parseInt(e.target.value) || 0 })}
                  onFocus={(e) => e.target.select()}
                  onClick={(e) => (e.target as HTMLInputElement).select()}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 font-bold text-sm text-slate-900 mt-1 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                />
              </div>
              <div>
                <label className="text-xs font-bold text-slate-700">Plazo de Entrega (Días Hábiles):</label>
                <input
                  type="number"
                  value={config.estimatedDeliveryDays === 0 ? '' : config.estimatedDeliveryDays}
                  onChange={(e) => setConfig({ ...config, estimatedDeliveryDays: e.target.value === '' ? 0 : parseInt(e.target.value) || 0 })}
                  onFocus={(e) => e.target.select()}
                  onClick={(e) => (e.target as HTMLInputElement).select()}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 font-bold text-sm text-slate-900 mt-1 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                />
              </div>
            </div>

            {/* CONFIGURACIÓN DINÁMICA DE GARANTÍA */}
            <div className="bg-slate-50 border-2 border-slate-200 rounded-2xl p-4 space-y-3 mt-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className={`p-2 rounded-xl ${config.hasWarranty !== false ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-200 text-slate-500'}`}>
                    <Shield className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="text-xs font-black uppercase tracking-wider text-slate-900">
                      Garantía de Taller
                    </h4>
                    <p className="text-[11px] font-semibold text-slate-500">
                      {config.hasWarranty !== false 
                        ? `Activa (${getWarrantyLabel(config.warrantyPeriod, config.customWarrantyText)})` 
                        : 'Desactivada (Oculta en servicios y pie de página)'}
                    </p>
                  </div>
                </div>

                {/* Switch Activación */}
                <button
                  type="button"
                  onClick={() => handleToggleWarranty(config.hasWarranty === false)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-black transition cursor-pointer ${
                    config.hasWarranty !== false
                      ? 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-sm'
                      : 'bg-slate-200 hover:bg-slate-300 text-slate-700'
                  }`}
                >
                  {config.hasWarranty !== false ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-200" />
                      <span>Garantía Activa</span>
                    </>
                  ) : (
                    <>
                      <ShieldOff className="w-3.5 h-3.5 text-slate-500" />
                      <span>Sin Garantía</span>
                    </>
                  )}
                </button>
              </div>

              {config.hasWarranty !== false && (
                <div className="space-y-3 pt-2 border-t border-slate-200 animate-fadeIn">
                  <div>
                    <label className="text-xs font-bold text-slate-700 block mb-1.5">
                      Plazo de Cobertura:
                    </label>
                    <div className="grid grid-cols-2 sm:grid-cols-5 gap-1.5">
                      {[
                        { id: '3_meses', label: '3 meses' },
                        { id: '6_meses', label: '6 meses' },
                        { id: '12_meses', label: '12 meses' },
                        { id: '24_meses', label: '24 meses' },
                        { id: 'personalizado', label: 'Otro' }
                      ].map(p => (
                        <button
                          key={p.id}
                          type="button"
                          onClick={() => handleUpdateWarrantyPeriod(p.id)}
                          className={`px-2 py-1.5 rounded-xl text-xs font-bold transition text-center cursor-pointer ${
                            (config.warrantyPeriod || '12_meses') === p.id
                              ? 'bg-emerald-700 text-white shadow-sm ring-2 ring-emerald-500'
                              : 'bg-white text-slate-700 border border-slate-300 hover:bg-slate-100'
                          }`}
                        >
                          {p.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {config.warrantyPeriod === 'personalizado' && (
                    <div>
                      <label className="text-xs font-bold text-slate-700">Tiempo Personalizado:</label>
                      <input
                        type="text"
                        value={config.customWarrantyText || ''}
                        onChange={(e) => handleUpdateCustomWarrantyText(e.target.value)}
                        placeholder="ej. 18 meses, 3 años, 5 años..."
                        className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 font-bold text-sm text-slate-900 mt-1 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                      />
                    </div>
                  )}

                  <div>
                    <label className="text-xs font-bold text-slate-700">Términos de la Garantía:</label>
                    <textarea
                      rows={2}
                      value={config.warrantyTerms}
                      onChange={(e) => setConfig({ ...config, warrantyTerms: e.target.value })}
                      className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 font-medium text-xs text-slate-900 mt-1 focus:ring-2 focus:ring-emerald-500 focus:outline-none resize-none"
                      placeholder="Términos y condiciones de cobertura..."
                    />
                  </div>
                </div>
              )}
            </div>

          </div>

        </div>

        {/* COLUMNA DERECHA (4 COLS): MANO DE OBRA, GANANCIA Y TOTALES */}
        <div className="lg:col-span-4 space-y-6">
          
          {/* Tarjeta de Mano de Obra y Costos Operativos */}
          <div className="bg-white rounded-3xl p-5 sm:p-6 border-4 border-emerald-900/10 shadow-xl space-y-5">
            <div className="border-b-2 border-slate-200 pb-3">
              <span className="bg-amber-100 text-amber-950 text-[10px] font-black uppercase px-2.5 py-0.5 rounded-md">
                Costos & Utilidad
              </span>
              <h3 className="text-xl font-black text-slate-900 mt-1">
                2. Mano de Obra & Gastos
              </h3>
            </div>

            {/* Selector de Mano de Obra */}
            <div className="space-y-3 bg-slate-50 p-4 rounded-2xl border border-slate-200">
              <div className="flex items-center justify-between">
                <label className="text-xs font-black text-slate-800 uppercase flex items-center gap-1.5">
                  <Wrench className="w-4 h-4 text-emerald-700" />
                  Mano de Obra (Fabricación):
                </label>
                <div className="flex items-center gap-1 bg-slate-200 p-0.5 rounded-lg text-xs font-bold">
                  <button
                    type="button"
                    onClick={() => setConfig({ ...config, laborType: 'percent' })}
                    className={`px-2 py-0.5 rounded ${config.laborType === 'percent' ? 'bg-emerald-700 text-white font-black' : 'text-slate-700'}`}
                  >
                    %
                  </button>
                  <button
                    type="button"
                    onClick={() => setConfig({ ...config, laborType: 'fixed' })}
                    className={`px-2 py-0.5 rounded ${config.laborType === 'fixed' ? 'bg-emerald-700 text-white font-black' : 'text-slate-700'}`}
                  >
                    $ Fijo
                  </button>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="number"
                  min="0"
                  step="any"
                  value={config.laborValue === 0 ? '' : config.laborValue}
                  onChange={(e) => setConfig({ ...config, laborValue: e.target.value === '' ? 0 : parseFloat(e.target.value) || 0 })}
                  onFocus={(e) => e.target.select()}
                  onClick={(e) => (e.target as HTMLInputElement).select()}
                  className="w-full bg-white font-black text-base text-slate-900 border-2 border-emerald-600 rounded-xl px-3 py-2 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                />
                <span className="text-sm font-black text-slate-700 shrink-0">
                  {config.laborType === 'percent' ? '% sobre mat.' : config.currencySymbol}
                </span>
              </div>
              <p className="text-xs font-semibold text-emerald-800 text-right">
                = {config.currencySymbol} {financialSummary.laborCost.toLocaleString()}
              </p>
            </div>

            {/* Margen de Ganancia */}
            <div className="space-y-2 bg-slate-50 p-4 rounded-2xl border border-slate-200">
              <div className="flex items-center justify-between">
                <label className="text-xs font-black text-slate-800 uppercase flex items-center gap-1.5">
                  <DollarSign className="w-4 h-4 text-emerald-700" />
                  Margen de Ganancia Taller:
                </label>
                <span className="text-xs font-bold text-emerald-800">
                  {config.profitMarginPercent}%
                </span>
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  min="0"
                  step="any"
                  value={config.profitMarginPercent === 0 ? '' : config.profitMarginPercent}
                  onChange={(e) => setConfig({ ...config, profitMarginPercent: e.target.value === '' ? 0 : parseFloat(e.target.value) || 0 })}
                  onFocus={(e) => e.target.select()}
                  onClick={(e) => (e.target as HTMLInputElement).select()}
                  className="w-full bg-white font-black text-base text-slate-900 border-2 border-slate-300 rounded-xl px-3 py-2 focus:border-emerald-600 focus:outline-none"
                />
                <span className="text-sm font-black text-slate-700 shrink-0">% Utilidad</span>
              </div>
              <p className="text-xs font-semibold text-emerald-800 text-right">
                = {config.currencySymbol} {financialSummary.profitMargin.toLocaleString()}
              </p>
            </div>

            {/* Flete, Montaje y Consumibles */}
            <div className="space-y-3 pt-1">
              <div>
                <label className="text-xs font-bold text-slate-700 flex items-center gap-1">
                  <Truck className="w-3.5 h-3.5 text-slate-600" />
                  Flete y Transporte ({config.currencySymbol}):
                </label>
                <input
                  type="number"
                  min="0"
                  step="any"
                  value={config.transportCost === 0 ? '' : config.transportCost}
                  onChange={(e) => setConfig({ ...config, transportCost: e.target.value === '' ? 0 : parseFloat(e.target.value) || 0 })}
                  onFocus={(e) => e.target.select()}
                  onClick={(e) => (e.target as HTMLInputElement).select()}
                  className="w-full bg-slate-50 font-bold text-slate-900 border border-slate-300 rounded-xl px-3 py-2 mt-1 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 flex items-center gap-1">
                  <Wrench className="w-3.5 h-3.5 text-slate-600" />
                  Montaje e Instalación en Obra ({config.currencySymbol}):
                </label>
                <input
                  type="number"
                  min="0"
                  step="any"
                  value={config.installationCost === 0 ? '' : config.installationCost}
                  onChange={(e) => setConfig({ ...config, installationCost: e.target.value === '' ? 0 : parseFloat(e.target.value) || 0 })}
                  onFocus={(e) => e.target.select()}
                  onClick={(e) => (e.target as HTMLInputElement).select()}
                  className="w-full bg-slate-50 font-bold text-slate-900 border border-slate-300 rounded-xl px-3 py-2 mt-1 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 flex items-center gap-1">
                  <Box className="w-3.5 h-3.5 text-slate-600" />
                  Consumibles & Desgaste ({config.currencySymbol}):
                </label>
                <input
                  type="number"
                  min="0"
                  step="any"
                  value={config.overheadCost === 0 ? '' : config.overheadCost}
                  onChange={(e) => setConfig({ ...config, overheadCost: e.target.value === '' ? 0 : parseFloat(e.target.value) || 0 })}
                  onFocus={(e) => e.target.select()}
                  onClick={(e) => (e.target as HTMLInputElement).select()}
                  className="w-full bg-slate-50 font-bold text-slate-900 border border-slate-300 rounded-xl px-3 py-2 mt-1 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                />
              </div>
            </div>

            {/* Impuestos y Descuento */}
            <div className="pt-2 border-t border-slate-200 space-y-3">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-slate-800 flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={config.applyTax}
                    onChange={(e) => setConfig({ ...config, applyTax: e.target.checked })}
                    className="w-4 h-4 accent-emerald-600 rounded"
                  />
                  <span>Aplicar Impuesto (IVA) ({config.taxPercent}%)</span>
                </label>
                {config.applyTax && (
                  <input
                    type="number"
                    value={config.taxPercent === 0 ? '' : config.taxPercent}
                    onChange={(e) => setConfig({ ...config, taxPercent: e.target.value === '' ? 0 : parseFloat(e.target.value) || 0 })}
                    onFocus={(e) => e.target.select()}
                    onClick={(e) => (e.target as HTMLInputElement).select()}
                    className="w-16 text-center font-bold text-xs bg-slate-100 rounded border border-slate-300 py-1 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  />
                )}
              </div>

              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-700">Descuento Comercial (%):</span>
                <input
                  type="number"
                  min="0"
                  max="100"
                  value={config.discountPercent === 0 ? '' : config.discountPercent}
                  onChange={(e) => setConfig({ ...config, discountPercent: e.target.value === '' ? 0 : parseFloat(e.target.value) || 0 })}
                  onFocus={(e) => e.target.select()}
                  onClick={(e) => (e.target as HTMLInputElement).select()}
                  className="w-20 text-center font-bold text-xs bg-slate-100 rounded border border-slate-300 py-1 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                />
              </div>
            </div>

          </div>

          {/* RESUMEN FINANCIERO Y GRAN TOTAL */}
          <div className="bg-slate-900 text-white rounded-3xl p-6 border-4 border-slate-800 shadow-2xl space-y-4">
            <div className="border-b border-slate-700 pb-3">
              <span className="bg-emerald-500 text-emerald-950 text-[10px] font-black uppercase px-2 py-0.5 rounded-md">
                Resumen de Cotización
              </span>
              <h3 className="text-xl font-black text-white mt-1">
                Total Presupuestado
              </h3>
            </div>

            <div className="space-y-2 text-xs">
              <div className="flex justify-between text-slate-300">
                <span>Materiales e Insumos:</span>
                <span className="font-bold text-white">{config.currencySymbol} {financialSummary.materialsCost.toLocaleString()}</span>
              </div>
              <div className="flex justify-between text-slate-300">
                <span>Mano de Obra:</span>
                <span className="font-bold text-white">{config.currencySymbol} {financialSummary.laborCost.toLocaleString()}</span>
              </div>
              <div className="flex justify-between text-slate-300">
                <span>Flete & Instalación:</span>
                <span className="font-bold text-white">{config.currencySymbol} {(financialSummary.transport + financialSummary.installation).toLocaleString()}</span>
              </div>
              <div className="flex justify-between text-slate-300">
                <span>Consumibles & Varios:</span>
                <span className="font-bold text-white">{config.currencySymbol} {financialSummary.overhead.toLocaleString()}</span>
              </div>
              <div className="flex justify-between text-emerald-400 font-bold">
                <span>Ganancia Taller ({config.profitMarginPercent}%):</span>
                <span>+{config.currencySymbol} {financialSummary.profitMargin.toLocaleString()}</span>
              </div>

              {financialSummary.discountAmount > 0 && (
                <div className="flex justify-between text-rose-400 font-bold">
                  <span>Descuento ({config.discountPercent}%):</span>
                  <span>-{config.currencySymbol} {financialSummary.discountAmount.toLocaleString()}</span>
                </div>
              )}

              {config.applyTax && (
                <div className="flex justify-between text-slate-300">
                  <span>IVA ({config.taxPercent}%):</span>
                  <span className="font-bold text-white">+{config.currencySymbol} {financialSummary.taxAmount.toLocaleString()}</span>
                </div>
              )}
            </div>

            {/* Gran Total */}
            <div className="bg-emerald-950/80 rounded-2xl p-4 border-2 border-emerald-500 text-center space-y-1">
              <p className="text-xs font-black uppercase tracking-widest text-emerald-300">
                PRECIO FINAL AL CLIENTE:
              </p>
              <p className="text-3xl sm:text-4xl font-black text-white tracking-tight">
                {config.currencySymbol} {financialSummary.grandTotal.toLocaleString()}
              </p>
            </div>

            {/* Condiciones de Pago */}
            <div className="grid grid-cols-2 gap-2 text-center text-xs">
              <div className="bg-slate-800 p-2.5 rounded-xl border border-slate-700">
                <p className="text-[10px] font-bold text-slate-400 uppercase">Anticipo (60%)</p>
                <p className="text-sm font-black text-amber-400">{config.currencySymbol} {financialSummary.advancePayment.toLocaleString()}</p>
              </div>
              <div className="bg-slate-800 p-2.5 rounded-xl border border-slate-700">
                <p className="text-[10px] font-bold text-slate-400 uppercase">Contra Entrega (40%)</p>
                <p className="text-sm font-black text-emerald-400">{config.currencySymbol} {financialSummary.balancePayment.toLocaleString()}</p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setShowPdfModal(true)}
              className="w-full bg-emerald-500 hover:bg-emerald-400 text-emerald-950 font-black text-sm py-3.5 rounded-xl shadow-lg flex items-center justify-center gap-2 transition cursor-pointer"
            >
              <FileText className="w-4 h-4" />
              <span>VER COTIZACIÓN CLIENTE</span>
            </button>

          </div>

        </div>

      </div>

      {/* ========================================================================= */}
      {/* MODAL DE VISTA PREVIA & DESCARGA DE COTIZACIÓN PDF (IMPRIMIBLE)           */}
      {/* ========================================================================= */}
      {showPdfModal && (
        <div className="fixed inset-0 bg-slate-950/85 backdrop-blur-md z-50 flex items-center justify-center p-2 sm:p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-4xl w-full max-h-[92vh] overflow-y-auto border-4 border-emerald-800 flex flex-col shadow-2xl my-auto">
            
            {/* Cabecera del Modal (No se imprime) */}
            <div className="bg-emerald-950 text-white p-4 sm:p-5 border-b-4 border-emerald-600 flex flex-wrap items-center justify-between gap-3 sticky top-0 z-10 no-print">
              <div className="flex items-center gap-3">
                <FileText className="w-6 h-6 text-emerald-400" />
                <div>
                  <h3 className="text-lg sm:text-xl font-black">
                    DOCUMENTO DE COTIZACIÓN PROFESIONAL
                  </h3>
                  <p className="text-xs text-emerald-200">
                    Listo para exportar a PDF o enviar al cliente
                  </p>
                </div>
              </div>

              {/* Botones de Control */}
              <div className="flex items-center gap-2 flex-wrap">
                {/* Selector de Modo de Presentación */}
                <div className="flex items-center bg-emerald-900 rounded-xl p-1 border border-emerald-700 text-xs font-bold">
                  <button
                    type="button"
                    onClick={() => setQuotePresentationMode('commercial')}
                    className={`px-3 py-1 rounded-lg transition cursor-pointer ${
                      quotePresentationMode === 'commercial' ? 'bg-emerald-500 text-emerald-950 font-black' : 'text-emerald-200'
                    }`}
                  >
                    Resumen Comercial
                  </button>
                  <button
                    type="button"
                    onClick={() => setQuotePresentationMode('detailed')}
                    className={`px-3 py-1 rounded-lg transition cursor-pointer ${
                      quotePresentationMode === 'detailed' ? 'bg-emerald-500 text-emerald-950 font-black' : 'text-emerald-200'
                    }`}
                  >
                    Desglose Insumos
                  </button>
                </div>

                {/* Botón WhatsApp */}
                <button
                  type="button"
                  onClick={handleSendWhatsApp}
                  className="bg-emerald-600 hover:bg-emerald-500 text-white font-black px-3.5 py-2 rounded-xl text-xs sm:text-sm flex items-center gap-1.5 shadow-md cursor-pointer transition"
                  title="Enviar cotización con servicios activos por WhatsApp"
                >
                  <Send className="w-4 h-4" />
                  <span>WhatsApp</span>
                </button>

                {/* Botón Descargar PDF Directo */}
                <button
                  type="button"
                  id="btn-descargar-cotizacion-pdf"
                  onClick={handleDownloadQuotationPdf}
                  disabled={isGeneratingPdf}
                  className="bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white font-black px-4 py-2 rounded-xl text-xs sm:text-sm flex items-center gap-1.5 shadow-md cursor-pointer transition transform active:scale-95 border-2 border-emerald-400"
                  title="Genera y descarga directamente el archivo PDF formal y limpio listo para el cliente"
                >
                  {isGeneratingPdf ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin text-white" />
                      <span>Generando PDF...</span>
                    </>
                  ) : pdfSuccessMessage ? (
                    <>
                      <Check className="w-4 h-4 text-emerald-200" />
                      <span>¡PDF Descargado!</span>
                    </>
                  ) : (
                    <>
                      <Download className="w-4 h-4" />
                      <span>Descargar PDF</span>
                    </>
                  )}
                </button>

                {/* Botón Imprimir Nativo */}
                <button
                  type="button"
                  onClick={handlePrintQuote}
                  className="bg-amber-400 hover:bg-amber-300 text-amber-950 font-black px-3.5 py-2 rounded-xl text-xs sm:text-sm flex items-center gap-1.5 shadow-md cursor-pointer transition"
                  title="Imprimir directamente desde el navegador"
                >
                  <Printer className="w-4 h-4" />
                  <span className="hidden sm:inline">Imprimir</span>
                </button>

                {/* Botón Cerrar */}
                <button
                  type="button"
                  onClick={() => setShowPdfModal(false)}
                  className="bg-rose-700 hover:bg-rose-800 text-white font-black px-3.5 py-2 rounded-xl text-xs sm:text-sm cursor-pointer"
                  title="Cerrar vista previa"
                >
                  ✕
                </button>
              </div>
            </div>

            {/* CUERPO DE LA COTIZACIÓN FORMAL (HOJA A4 IMPRIMIBLE) */}
            <div id="quotation-print-sheet" className="p-6 sm:p-10 text-slate-900 space-y-8 bg-white font-sans">
              
              {/* Encabezado del Taller / Membrete */}
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between border-b-4 border-emerald-800 pb-6 gap-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="text-3xl">🪚</span>
                    <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-slate-900">
                      {config.workshopName}
                    </h1>
                  </div>
                  <p className="text-xs sm:text-sm font-semibold text-slate-600">
                    Diseño, Fabricación & Instalación de Muebles a Medida
                  </p>
                  <div className="flex items-center gap-4 text-xs text-slate-500 pt-1 flex-wrap">
                    <span className="flex items-center gap-1">
                      <Phone className="w-3.5 h-3.5 text-emerald-700" /> {config.workshopPhone}
                    </span>
                    <span className="flex items-center gap-1">
                      <Mail className="w-3.5 h-3.5 text-emerald-700" /> {config.workshopEmail}
                    </span>
                    <span className="flex items-center gap-1">
                      <MapPin className="w-3.5 h-3.5 text-emerald-700" /> {config.workshopAddress}
                    </span>
                  </div>
                </div>

                <div className="bg-emerald-50 border-2 border-emerald-300 rounded-2xl p-4 text-right sm:min-w-[200px] shrink-0">
                  <span className="bg-emerald-800 text-white text-[10px] font-black uppercase px-2 py-0.5 rounded">
                    COTIZACIÓN FORMAL
                  </span>
                  <p className="text-lg font-black text-emerald-950 mt-1">
                    COT-{new Date().getFullYear()}-{activeProject?.id.slice(-4).toUpperCase() || '001'}
                  </p>
                  <p className="text-xs font-bold text-slate-600">
                    Fecha: {new Date().toLocaleDateString('es-ES', { day: '2-digit', month: 'long', year: 'numeric' })}
                  </p>
                  <p className="text-xs text-slate-500">
                    Validez: {config.validityDays} días
                  </p>
                </div>
              </div>

              {/* Datos del Cliente y Proyecto */}
              <div className="bg-slate-50 rounded-2xl p-5 border border-slate-200 grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-xs font-black uppercase tracking-wider text-slate-500">Cliente:</p>
                  <p className="text-base font-black text-slate-900">{config.clientName || activeProject?.clientName || 'Cliente Particular'}</p>
                  {config.clientPhone && <p className="text-xs text-slate-600">Tel: {config.clientPhone}</p>}
                  {config.clientAddress && <p className="text-xs text-slate-600">Instalación: {config.clientAddress}</p>}
                </div>
                <div>
                  <p className="text-xs font-black uppercase tracking-wider text-slate-500">Proyecto:</p>
                  <p className="text-base font-black text-emerald-900">{activeProject?.name}</p>
                  <p className="text-xs text-slate-600">
                    Material: {activeProject?.materialType} ({activeProject?.thicknessMm}mm)
                  </p>
                  <p className="text-xs text-slate-600">
                    Plazo de Fabricación: {config.estimatedDeliveryDays} días hábiles
                  </p>
                </div>
              </div>

              {/* LISTA DESCRIPTIVA DE MUEBLES A FABRICAR */}
              <div className="space-y-3">
                <h3 className="text-base font-black uppercase tracking-wider text-slate-900 border-b-2 border-slate-300 pb-1 flex items-center gap-2">
                  <Box className="w-4 h-4 text-emerald-800" />
                  Descripción de Muebles a Fabricar
                </h3>

                <div className="overflow-x-auto rounded-xl border border-slate-300">
                  <table className="w-full text-left border-collapse text-sm bg-white">
                    <thead>
                      <tr className="bg-slate-100 text-slate-900 border-b-2 border-slate-300 text-xs font-black uppercase tracking-wider">
                        <th className="py-3 px-3 w-12 text-center">#</th>
                        <th className="py-3 px-3">Mueble / Unidad</th>
                        <th className="py-3 px-3">Dimensiones (Alto × Ancho × Prof.)</th>
                        <th className="py-3 px-3">Material & Acabado</th>
                        <th className="py-3 px-3 text-center">Piezas</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200 leading-relaxed">
                      {furnitureUnitsList.map((unit, idx) => (
                        <tr key={idx} className="hover:bg-slate-50">
                          <td className="py-3 px-3 text-center font-bold text-slate-500">{idx + 1}</td>
                          <td className="py-3 px-3 font-bold text-slate-900">
                            {unit.name}
                            {unit.notes && <p className="text-xs text-slate-500 font-normal mt-0.5 leading-normal">{unit.notes}</p>}
                          </td>
                          <td className="py-3 px-3 font-semibold text-slate-700">{unit.dimensions}</td>
                          <td className="py-3 px-3 text-slate-700">{unit.material}</td>
                          <td className="py-3 px-3 text-center font-bold text-slate-800">{unit.totalPieces}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* PRESENTACIÓN COMERCIAL vs DESGLOSE DETALLADO */}
              {quotePresentationMode === 'detailed' ? (
                /* MODO DESGLOSE DE INSUMOS */
                <div className="space-y-3">
                  <h3 className="text-base font-black uppercase tracking-wider text-slate-900 border-b-2 border-slate-300 pb-1">
                    Desglose de Materiales e Insumos
                  </h3>
                  <div className="overflow-x-auto rounded-xl border border-slate-300">
                    <table className="w-full text-left border-collapse text-xs bg-white">
                      <thead>
                        <tr className="bg-slate-100 text-slate-800 font-bold border-b border-slate-300 uppercase tracking-wider text-[11px]">
                          <th className="py-3 px-3">Concepto</th>
                          <th className="py-3 px-3 text-center">Cant.</th>
                          <th className="py-3 px-3 text-center">Unidad</th>
                          <th className="py-3 px-3 text-right">P. Unitario</th>
                          <th className="py-3 px-3 text-right">Importe</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-200 leading-relaxed">
                        {items.filter(i => i.included).map((item, idx) => (
                          <tr key={idx}>
                            <td className="py-3 px-3 font-medium">
                              <span className="font-bold text-slate-900">{item.name}</span>
                              {item.description && <span className="text-slate-500 block text-[11px] mt-0.5 leading-normal">{item.description}</span>}
                            </td>
                            <td className="py-3 px-3 text-center font-bold">{item.quantity}</td>
                            <td className="py-3 px-3 text-center text-slate-600">{item.unit}</td>
                            <td className="py-3 px-3 text-right">{config.currencySymbol} {item.unitPrice.toLocaleString()}</td>
                            <td className="py-3 px-3 text-right font-bold">{config.currencySymbol} {item.totalPrice.toLocaleString()}</td>
                          </tr>
                        ))}
                        <tr className="bg-slate-50">
                          <td colSpan={4} className="py-3 px-3 font-bold text-right text-slate-700">Mano de Obra, Armado & Montaje:</td>
                          <td className="py-3 px-3 text-right font-bold">{config.currencySymbol} {(financialSummary.laborCost + financialSummary.installation).toLocaleString()}</td>
                        </tr>
                        <tr className="bg-slate-50">
                          <td colSpan={4} className="py-3 px-3 font-bold text-right text-slate-700">Flete & Logística:</td>
                          <td className="py-3 px-3 text-right font-bold">{config.currencySymbol} {financialSummary.transport.toLocaleString()}</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>
              ) : (
                /* MODO RESUMEN COMERCIAL CON EDITOR DINÁMICO DE SERVICIOS */
                <div className="space-y-4">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b-2 border-slate-300 pb-2 gap-2">
                    <h3 className="text-base font-black uppercase tracking-wider text-slate-900 flex items-center gap-2">
                      <span>Resumen de Inversión y Servicios Incluidos</span>
                    </h3>

                    {/* Barra de Control Rápido de Garantía y Servicios (no se imprime) */}
                    <div className="no-print flex flex-wrap items-center gap-2" data-html2canvas-ignore="true">
                      {/* Control Rápido de Garantía */}
                      <div className="flex items-center gap-1.5 bg-emerald-50 border border-emerald-300 px-2 py-1 rounded-xl">
                        <button
                          type="button"
                          onClick={() => handleToggleWarranty(config.hasWarranty === false)}
                          className={`flex items-center gap-1 px-2 py-0.5 rounded-lg text-xs font-black transition cursor-pointer ${
                            config.hasWarranty !== false
                              ? 'bg-emerald-700 text-white shadow-2xs'
                              : 'bg-slate-300 text-slate-700 hover:bg-slate-400'
                          }`}
                          title="Activar o desactivar garantía en esta cotización"
                        >
                          <Shield className="w-3.5 h-3.5" />
                          <span>{config.hasWarranty !== false ? 'Garantía: SÍ' : 'Garantía: NO'}</span>
                        </button>

                        {config.hasWarranty !== false && (
                          <div className="flex items-center gap-1">
                            {[
                              { id: '3_meses', label: '3m' },
                              { id: '6_meses', label: '6m' },
                              { id: '12_meses', label: '12m' },
                              { id: '24_meses', label: '24m' },
                              { id: 'personalizado', label: 'Otro' }
                            ].map(p => (
                              <button
                                key={p.id}
                                type="button"
                                onClick={() => handleUpdateWarrantyPeriod(p.id)}
                                className={`px-1.5 py-0.5 rounded text-[11px] font-bold transition cursor-pointer ${
                                  (config.warrantyPeriod || '12_meses') === p.id
                                    ? 'bg-emerald-600 text-white font-black'
                                    : 'bg-white text-slate-700 hover:bg-emerald-100 border border-emerald-200'
                                }`}
                                title={`Garantía de ${p.label}`}
                              >
                                {p.label}
                              </button>
                            ))}
                          </div>
                        )}
                      </div>

                      {/* Botones Agregar / Restablecer */}
                      <button
                        type="button"
                        onClick={handleAddCustomService}
                        className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs px-2.5 py-1 rounded-lg flex items-center gap-1 shadow-sm transition cursor-pointer"
                        title="Añadir una nueva línea personalizada de servicio"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>+ Servicio</span>
                      </button>
                      <button
                        type="button"
                        onClick={handleResetServicesToDefault}
                        className="text-slate-500 hover:text-slate-800 text-xs p-1 transition cursor-pointer"
                        title="Restablecer servicios sugeridos"
                      >
                        <RotateCcw className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  <div className="bg-white rounded-xl border border-slate-200 divide-y divide-slate-200 text-sm overflow-visible">
                    {servicesList.map((service, idx) => {
                      return (
                        <div 
                          key={service.id}
                          className={`flex flex-col sm:flex-row sm:items-center justify-between gap-3 py-3 px-3.5 transition leading-relaxed ${
                            service.active 
                              ? 'bg-white text-slate-950' 
                              : 'bg-slate-50/60 opacity-50 no-print'
                          }`}
                          data-html2canvas-ignore={!service.active ? 'true' : undefined}
                        >
                          {/* Izquierda: Checkbox de activación + Texto editable */}
                          <div className="flex items-center gap-3 flex-1 min-w-0">
                            {/* Checkbox de Visibilidad (oculto en impresión) */}
                            <label className="no-print cursor-pointer flex items-center shrink-0" data-html2canvas-ignore="true">
                              <input
                                type="checkbox"
                                checked={service.active}
                                onChange={() => handleToggleService(service.id)}
                                className="w-4 h-4 text-emerald-600 rounded focus:ring-emerald-500 cursor-pointer accent-emerald-600"
                                title={service.active ? 'Ocultar concepto de la cotización' : 'Mostrar concepto en la cotización'}
                              />
                            </label>

                            {/* Número y Nombre del Servicio */}
                            <div className="flex-1 flex items-center gap-2 min-w-0">
                              <span className="font-bold text-slate-700 text-xs shrink-0">{idx + 1}.</span>
                              {/* Texto visible estático para impresión / PDF */}
                              <span className="hidden print:inline-block font-bold text-slate-950 text-sm leading-relaxed">
                                {service.name}
                              </span>
                              {/* Input interactivo en pantalla */}
                              <input
                                type="text"
                                value={service.name}
                                onChange={(e) => handleUpdateServiceName(service.id, e.target.value)}
                                className={`w-full font-bold text-slate-950 text-sm bg-transparent border-0 border-b border-transparent hover:border-slate-300 focus:border-emerald-500 focus:outline-none px-1 py-1 rounded transition leading-relaxed print:hidden ${
                                  !service.active ? 'line-through text-slate-400' : ''
                                }`}
                                placeholder="Nombre del concepto o servicio..."
                              />
                            </div>
                          </div>

                          {/* Derecha: Selector de Tipo (Incluido vs Valor Adicional) + Monto + Botón Eliminar */}
                          <div className="flex items-center gap-2 justify-end shrink-0 pl-6 sm:pl-0">
                            {/* Selector Incluido / Adicional (no se imprime) */}
                            <button
                              type="button"
                              onClick={() => handleToggleServiceType(service.id)}
                              className={`no-print text-xs font-black px-2.5 py-1 rounded-lg border transition cursor-pointer ${
                                service.type === 'included'
                                  ? 'bg-emerald-100 text-emerald-900 border-emerald-300 hover:bg-emerald-200'
                                  : 'bg-amber-100 text-amber-950 border-amber-300 hover:bg-amber-200'
                              }`}
                              data-html2canvas-ignore="true"
                              title="Haz clic para alternar entre 'Incluido' y 'Costo Adicional'"
                            >
                              {service.type === 'included' ? '✓ Incluido' : '+$ Adicional'}
                            </button>

                            {/* Valor Visible para Impresión / Exportación */}
                            {service.type === 'included' ? (
                              <span className="font-black text-slate-950 text-xs sm:text-sm px-2 whitespace-nowrap">
                                Incluido
                              </span>
                            ) : (
                              <div className="flex items-center gap-1">
                                <span className="font-bold text-amber-800 text-xs">{config.currencySymbol}</span>
                                {/* Texto estático para impresión / PDF */}
                                <span className="hidden print:inline-block font-black text-right text-slate-950 text-xs sm:text-sm px-1">
                                  {Number(service.amount || 0).toLocaleString()}
                                </span>
                                {/* Input para interacción */}
                                <input
                                  type="number"
                                  value={service.amount || 0}
                                  onChange={(e) => handleUpdateServiceAmount(service.id, Number(e.target.value))}
                                  className="w-24 font-black text-right text-slate-950 text-xs sm:text-sm bg-white border border-slate-300 rounded px-2 py-1 focus:border-amber-500 print:hidden"
                                  min={0}
                                  step={50}
                                />
                              </div>
                            )}

                            {/* Botón Basura para eliminar fila (no-print) */}
                            <button
                              type="button"
                              onClick={() => handleDeleteService(service.id)}
                              className="no-print p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded transition cursor-pointer"
                              data-html2canvas-ignore="true"
                              title="Eliminar este concepto"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      );
                    })}

                    {servicesList.filter(s => s.active).length === 0 && (
                      <p className="text-xs text-slate-500 text-center py-4 italic">
                        No hay servicios activos visibles. Usa los controles para activar conceptos.
                      </p>
                    )}
                  </div>
                </div>
              )}

              {/* CUADRO DE TOTALES (Esquema de Alto Contraste para Impresión y PDF) */}
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white text-slate-950 rounded-2xl p-6 border-2 border-emerald-700 shadow-sm">
                <div className="space-y-1">
                  <p className="text-xs uppercase font-black text-emerald-800">Condiciones de Pago:</p>
                  <p className="text-sm font-bold text-slate-900">{config.paymentTerms}</p>
                  <p className="text-xs text-slate-700 mt-1">
                    * Anticipo 60%: <strong className="text-slate-950 font-black">{config.currencySymbol} {financialSummary.advancePayment.toLocaleString()}</strong> | Saldo 40%: <strong className="text-emerald-800 font-black">{config.currencySymbol} {financialSummary.balancePayment.toLocaleString()}</strong>
                  </p>
                </div>

                <div className="text-right sm:min-w-[220px]">
                  <p className="text-xs font-black uppercase tracking-widest text-emerald-800">PRECIO TOTAL:</p>
                  <p className="text-3xl sm:text-4xl font-black text-slate-950 tracking-tight">
                    {config.currencySymbol} {financialSummary.grandTotal.toLocaleString()}
                  </p>
                  {config.applyTax && <p className="text-[11px] font-bold text-slate-600">IVA incluido ({config.taxPercent}%)</p>}
                </div>
              </div>

              {/* TÉRMINOS Y FIRMAS */}
              <div className="pt-4 border-t-2 border-slate-300 space-y-6 text-xs text-slate-600">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Garantía Dinámica: Se oculta por completo si está desactivada */}
                  {config.hasWarranty !== false && (
                    <div className="bg-emerald-50/50 p-3 rounded-xl border border-emerald-200/60">
                      <p className="font-bold text-slate-900 flex items-center gap-1.5">
                        <Shield className="w-3.5 h-3.5 text-emerald-700" />
                        <span>Garantía de Taller ({getWarrantyLabel(config.warrantyPeriod, config.customWarrantyText)}):</span>
                      </p>
                      <p className="text-slate-700 mt-0.5">{config.warrantyTerms}</p>
                    </div>
                  )}

                  <div className={config.hasWarranty === false ? 'sm:col-span-2' : ''}>
                    <p className="font-bold text-slate-800">Notas de Instalación:</p>
                    <p className="text-slate-700 mt-0.5">{config.notes}</p>
                  </div>
                </div>

                {/* Espacio de Firmas */}
                <div className="grid grid-cols-2 gap-12 pt-8 text-center">
                  <div className="border-t border-slate-400 pt-2">
                    <p className="font-bold text-slate-900">{config.workshopName}</p>
                    <p className="text-[10px] text-slate-500">Maestro Carpintero / Fabricante</p>
                  </div>
                  <div className="border-t border-slate-400 pt-2">
                    <p className="font-bold text-slate-900">{config.clientName || 'Firma del Cliente'}</p>
                    <p className="text-[10px] text-slate-500">Aceptación y Conformidad</p>
                  </div>
                </div>
              </div>

            </div>

          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL DE PROYECTOS GUARDADOS                                              */}
      {/* ========================================================================= */}
      {showProjectModal && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-3xl w-full max-h-[85vh] overflow-hidden border-4 border-emerald-800 flex flex-col shadow-2xl">
            <div className="bg-emerald-950 text-white p-6 border-b-4 border-emerald-600 flex items-center justify-between">
              <h3 className="text-xl sm:text-2xl font-black flex items-center gap-3">
                <Layers className="w-7 h-7 text-emerald-400" />
                SELECCIONAR PROYECTO PARA COTIZAR
              </h3>
              <button
                type="button"
                onClick={() => setShowProjectModal(false)}
                className="bg-emerald-800 text-white px-4 py-2 rounded-xl font-black hover:bg-emerald-700 cursor-pointer"
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

                  return (
                    <div
                      key={`modal-proj-opt-${proj.id}-${projIdx}`}
                      className={`p-5 rounded-2xl border-3 transition flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 ${
                        isCurrent
                          ? 'border-emerald-600 bg-emerald-50 ring-2 ring-emerald-500/30'
                          : 'border-slate-300 bg-white hover:border-emerald-400 hover:bg-emerald-50/20'
                      }`}
                    >
                      <div className="flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="bg-emerald-800 text-white text-xs font-black px-3 py-1 rounded-full uppercase">
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
                        <p className="text-xs font-semibold text-emerald-900 mt-1">
                          Material: {proj.materialType} ({proj.thicknessMm}mm)
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
                              : 'bg-emerald-600 hover:bg-emerald-700 text-white border-emerald-900 hover:scale-[1.02]'
                          }`}
                        >
                          {isCurrent ? 'ACTIVO AHORA' : 'CARGAR EN MÓDULO 4'}
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

      {/* ========================================================================= */}
      {/* MODAL DE ADMINISTRACIÓN DEL CATÁLOGO DE PRECIOS                           */}
      {/* ========================================================================= */}
      {isCatalogModalOpen && (
        <CatalogAdminModal
          isOpen={isCatalogModalOpen}
          catalog={catalog}
          onClose={() => setIsCatalogModalOpen(false)}
          onSaveCatalog={handleSaveCatalog}
          onResetCatalog={handleResetCatalog}
          onResetDefaults={handleResetCatalog}
          onApplyPricesToCurrentBudget={handleApplyCatalogPricesToBudget}
          currencySymbol={config.currencySymbol}
        />
      )}

      {/* ========================================================================= */}
      {/* MODAL DE AGREGAR INSUMO / ITEM AL PRESUPUESTO                             */}
      {/* ========================================================================= */}
      {isAddInsumoModalOpen && (
        <AddBudgetItemModal
          isOpen={isAddInsumoModalOpen}
          catalog={catalog}
          onClose={() => setIsAddInsumoModalOpen(false)}
          onAddItem={handleAddItemFromModal}
          currencySymbol={config.currencySymbol}
        />
      )}

    </div>
  );
};
