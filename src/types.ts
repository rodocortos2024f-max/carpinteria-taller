export type ViewMode = 'login' | 'menu' | 'project' | 'optimizer' | 'assembly' | 'budget' | 'offcuts' | 'admin' | 'superadmin';

export type UserRole = 'superadmin' | 'maestro' | 'operario' | 'ayudante' | 'administrador' | 'MAESTRO' | 'OPERARIO';

export type TenantLicensePlan = 'mensual' | 'anual' | 'vitalicia' | 'demo';

export type TenantLicenseStatus = 'activa' | 'prueba' | 'suspendida' | 'vencida';

export interface WorkshopUserAccount {
  id: string;
  name: string;
  email: string;
  password?: string;
  role: 'maestro' | 'operario';
  lastLogin?: string;
}

export interface WorkshopTenant {
  id: string;
  name: string;
  ownerName: string;
  tradeName?: string;
  taxId?: string;
  phone: string;
  city: string;
  address?: string;
  licensePlan: TenantLicensePlan;
  status: TenantLicenseStatus;
  estado?: 'activo' | 'suspendido' | 'vencido' | 'prueba' | string;
  licenseExpiry: string; // YYYY-MM-DD
  createdAt: string;
  lastAccess: string;
  masterAccount: WorkshopUserAccount;
  operatorAccount?: WorkshopUserAccount;
  maestro?: {
    id?: string;
    name?: string;
    email: string;
    password?: string;
    role: 'MAESTRO' | 'maestro' | string;
  };
  operario?: {
    id?: string;
    name?: string;
    email: string;
    password?: string;
    role: 'OPERARIO' | 'operario' | string;
  } | null;
  activeProjectsCount?: number;
  totalProjectsCount?: number;
  monthlyStats?: {
    month: string;
    projectsCount: number;
    cutsCount: number;
  }[];
  customNotes?: string;
}

export type FurnitureCategory = 'gabinete' | 'closet' | 'librero' | 'escritorio' | 'mesa' | 'personalizado';

export interface EdgeBanding {
  top?: boolean;    // Largo 1
  bottom?: boolean; // Largo 2
  left?: boolean;   // Ancho 1
  right?: boolean;  // Ancho 2
}

export interface WoodCut {
  id: string;
  furnitureId?: string;
  furnitureName?: string;
  name: string;
  lengthCm: number;
  widthCm: number;
  quantity: number;
  completedQuantity?: number;
  notes?: string;
  completed: boolean;
  category: 'lateral' | 'repisa' | 'puerta' | 'fondo' | 'piso' | 'techo' | 'frente_cajon' | 'amarre' | 'liston' | 'travesaño' | 'lateral_cajon' | 'trasera_cajon' | 'fondo_cajon' | 'division' | 'zocalo' | 'otro';
  edges?: EdgeBanding;
  materialType?: string;
  thicknessMm?: number;
  sourceOffcutId?: string;
  sourceOffcutLabel?: string;
}

export interface FurnitureUnit {
  id: string;
  name: string;
  category: FurnitureCategory;
  heightCm: number;
  widthCm: number;
  depthCm: number;
  thicknessMm: number;
  materialType: string;
  notes?: string;
  cuts: WoodCut[];
}

export interface Project {
  id: string;
  name: string;
  clientName?: string;
  category: FurnitureCategory;
  totalHeightCm: number;
  totalWidthCm: number;
  totalDepthCm: number;
  materialType: string;
  thicknessMm: number;
  createdAt: string;
  cuts: WoodCut[];
  furnitureUnits?: FurnitureUnit[];
  notes?: string;
  status: 'en_diseño' | 'en_corte' | 'completado';
}

export interface OffcutItem {
  id: string;
  materialType: string;
  thicknessMm: number;
  lengthCm: number;
  widthCm: number;
  location: string;
  status: 'disponible' | 'reservado' | 'usado';
  dateAdded: string;
  notes?: string;
}

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  tenantId?: string;
  tenantName?: string;
  photoUrl?: string;
  isFirebaseConfigured?: boolean;
  lastLogin?: string;
}

export interface AppActivityLog {
  id: string;
  timestamp: string;
  user: string;
  action: string;
  details: string;
}

// ================= MODULE 2 OPTIMIZER & CUTTING TYPES =================

export type PrimaryCutDirection = 'largo' | 'ancho';

export interface CuttingConfig {
  primaryCutDirection: PrimaryCutDirection;
  sheetLengthCm: number; // default 244
  sheetWidthCm: number;  // default 122
  sawKerfMm: number;      // default 3
  allowRotation: boolean; // default true
  trimMarginCm: number;   // default 0
  materialType?: string;
  thicknessMm?: number;
}

export interface PlacedPiece {
  id: string;
  pieceId: string;
  name: string;
  furnitureName?: string;
  x: number; // Posición X en tablero (cm)
  y: number; // Posición Y en tablero (cm)
  lengthCm: number; // Dimensión en eje largo del tablero
  widthCm: number;  // Dimensión en eje ancho del tablero
  originalLength: number;
  originalWidth: number;
  rotated: boolean;
  category: string;
  edges?: EdgeBanding;
  color?: string;
  boardIndex?: number;
  stripId?: string;
}

export interface GeneratedOffcut {
  id: string;
  x: number;
  y: number;
  lengthCm: number;
  widthCm: number;
  isUsable: boolean;
}

export interface FenceStepPieceRef {
  placedPieceId: string;
  name: string;
  furnitureName?: string;
  lengthCm: number;
  widthCm: number;
  boardIndex: number;
}

export interface IndividualPieceCut {
  placedPieceId: string;
  name: string;
  furnitureName?: string;
  cutMeasureCm: number; // Medida de corte a lo ancho para separar la pieza
  lengthCm: number;
  widthCm: number;
  originalLength: number;
  originalWidth: number;
  rotated: boolean;
  edges?: EdgeBanding;
  boardIndex: number;
  stripId: string;
  pencilMark?: string; // e.g. "T-1" o "T-2"
}

export interface StripCuttingStep {
  stepNumber: number;
  stripId: string;
  pencilMark: string; // e.g. "T-1", "T-2" para marcar a lápiz en el taller
  boardIndex: number;
  stripIndex: number;
  direction: PrimaryCutDirection; // 'largo' (longitudinal) | 'ancho' (transversal)
  fenceMeasureCm: number; // Medida de la regla de sierra
  stripLengthCm: number;
  stripWidthCm: number;
  // Fase A (Corte de Tira)
  phaseATitle: string;
  phaseADescription: string;
  // Fase B (Cortes Transversales Individuales)
  phaseBTitle: string;
  phaseBDescription: string;
  individualCuts: IndividualPieceCut[];
  targetPieceIds: string[];
}

export interface FenceGroupedStep {
  fenceMeasureCm: number;
  direction: PrimaryCutDirection;
  totalStrips: number;
  boardIndexes: number[];
  strips: StripCuttingStep[];
}

export interface CuttingStep {
  stepNumber: number;
  boardIndex: number;
  type: 'rip' | 'cross' | 'trim';
  title: string;
  description: string;
  measureCm: number;
  pieceName?: string;
  completed: boolean;
  furnitureName?: string;
  targetPieceIds?: string[];
  boardIndexes?: number[];
  resultingPieces?: FenceStepPieceRef[];
}

export interface OptimizedBoard {
  boardIndex: number;
  sheetLengthCm: number;
  sheetWidthCm: number;
  placedPieces: PlacedPiece[];
  usedAreaSqCm: number;
  totalAreaSqCm: number;
  efficiencyPercent: number;
  wastePercent: number;
  offcuts: GeneratedOffcut[];
  cuttingSteps: CuttingStep[];
  stripSteps: StripCuttingStep[];
}

export interface OptimizationResult {
  boards: OptimizedBoard[];
  totalSheets: number;
  totalPieces: number;
  totalPlacedPieces: number;
  totalUsedAreaSqM: number;
  totalSheetAreaSqM: number;
  overallEfficiencyPercent: number;
  overallWastePercent: number;
  totalLinearCutMeters: number;
  unplacedPieces: WoodCut[];
  usableOffcuts: GeneratedOffcut[];
  masterStripSteps: StripCuttingStep[];
  fenceGroupedSteps: FenceGroupedStep[];
}

// ================= MODULE 3 ASSEMBLY & WORKSHOP TYPES =================

export type AssemblyStepCategory = 
  | 'mecanizado'
  | 'estructura'
  | 'fondo'
  | 'herrajes'
  | 'puertas'
  | 'ajuste_final';

export interface AssemblyStep {
  id: string;
  stepNumber: number;
  title: string;
  category: AssemblyStepCategory;
  description: string;
  piecesInvolved: string[];
  hardwareNeeded: string[];
  toolsNeeded: string[];
  workshopTip: string;
  diagramType: 'machining' | 'frame_start' | 'frame_complete' | 'back_panel' | 'fittings' | 'doors' | 'squaring';
  completed: boolean;
}

export interface HardwareItem {
  id: string;
  name: string;
  specs: string;
  quantity: number;
  category: 'tornilleria' | 'bisagras' | 'correderas' | 'tarugos' | 'soportes' | 'tiradores' | 'fijaciones';
  notes?: string;
  checked: boolean;
}

export interface PieceVerificationStatus {
  pieceId: string;
  name: string;
  furnitureName?: string;
  dimensions: string;
  dimensionVerified: boolean;
  edgeBandingVerified: boolean;
  squareVerified: boolean;
  machiningDone: boolean;
  notes?: string;
}

// ================= MODULE 4 BUDGET & QUOTATION TYPES =================

export type BudgetItemCategory = 
  | 'tablero' 
  | 'cubrecanto' 
  | 'corredera' 
  | 'bisagra' 
  | 'herraje' 
  | 'consumible' 
  | 'servicio' 
  | 'personalizado';

export interface BudgetItem {
  id: string;
  category: BudgetItemCategory;
  name: string;
  description?: string;
  quantity: number;
  unit: string;
  unitPrice: number;
  totalPrice: number;
  isAutoCalculated?: boolean;
  included: boolean;
}

export interface CatalogMaterialItem {
  id: string;
  name: string;
  category: BudgetItemCategory;
  unit: string;
  unitPrice: number;
  description?: string;
  thicknessMm?: number;
  code?: string;
  isDefault?: boolean;
  brand?: string;
}

export interface QuotationServiceItem {
  id: string;
  name: string;
  description?: string;
  type: 'included' | 'additional'; // 'included' = muestra "Incluido" sin sumar extra al precio base | 'additional' = suma monto extra al precio total
  amount?: number;
  active: boolean; // para mostrar u ocultar en el PDF / WhatsApp
  isDefault?: boolean;
}

export interface BudgetConfig {
  currencySymbol: string;
  laborType: 'percent' | 'fixed';
  laborValue: number; // % o monto fijo
  profitMarginPercent: number; // % de ganancia
  overheadCost: number; // Consumibles / tornillería / pegamentos
  transportCost: number; // Flete
  installationCost: number; // Montaje en obra
  taxPercent: number; // IVA %
  applyTax: boolean;
  discountPercent: number; // Descuento %
  workshopName: string;
  workshopPhone: string;
  workshopEmail: string;
  workshopAddress: string;
  clientName: string;
  clientPhone: string;
  clientAddress: string;
  validityDays: number;
  estimatedDeliveryDays: number;
  paymentTerms: string;
  warrantyTerms: string;
  notes: string;
  hasWarranty?: boolean;
  warrantyPeriod?: string; // '3_meses' | '6_meses' | '12_meses' | '24_meses' | 'personalizado'
  customWarrantyMonths?: number;
  customWarrantyText?: string;
  servicesList?: QuotationServiceItem[];
}

export interface TenantUsageRanking {
  id: string;
  name: string;
  owner: string;
  city: string;
  plan: TenantLicensePlan;
  status: TenantLicenseStatus;
  lastAccess: string;
  activeProjects: number;
  totalProjects: number;
  cutsVolume: number;
}

export interface GlobalPlatformStats {
  totalTenants: number;
  activeTenants: number;
  suspendedTenants: number;
  totalProjects: number;
  totalActiveProjects: number;
  totalCuts: number;
  monthlyTrends: {
    month: string;
    monthLabel: string;
    projectsCount: number;
    cutsCount: number;
    activeTenantsCount: number;
  }[];
  tenantsUsageRanking: TenantUsageRanking[];
}
