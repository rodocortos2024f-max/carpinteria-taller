import { Project, OffcutItem, User, AppActivityLog } from '../types';

export const INITIAL_USER: User = {
  id: 'usr_maestro_1',
  name: 'Maestro Don José',
  email: 'jose.carpintero@taller.es',
  role: 'maestro',
  isFirebaseConfigured: false
};

export const INITIAL_PROJECTS: Project[] = [
  {
    id: 'proj_1',
    name: 'Gabinete Alto Cocina',
    clientName: 'Sra. María López',
    category: 'gabinete',
    totalHeightCm: 80,
    totalWidthCm: 60,
    totalDepthCm: 35,
    materialType: 'Melamina Blanca',
    thicknessMm: 15,
    createdAt: '2026-08-10',
    status: 'en_corte',
    notes: 'Incluye 2 repisas ajustables y bisagras cazoleta de 35mm.',
    cuts: [
      { id: 'c1', name: 'Laterales Izquierdo y Derecho', lengthCm: 80, widthCm: 35, quantity: 2, completedQuantity: 2, completed: true, category: 'lateral' },
      { id: 'c2', name: 'Piso y Techo Superior', lengthCm: 57, widthCm: 35, quantity: 2, completedQuantity: 1, completed: false, category: 'piso' },
      { id: 'c3', name: 'Repisas Interiores', lengthCm: 56.6, widthCm: 33, quantity: 2, completedQuantity: 0, completed: false, category: 'repisa' },
      { id: 'c4', name: 'Puertas Frontales', lengthCm: 79.5, widthCm: 29.5, quantity: 2, completedQuantity: 0, completed: false, category: 'puerta' },
      { id: 'c5', name: 'Fondo Respaldo (MDF 3mm)', lengthCm: 78, widthCm: 58, quantity: 1, completedQuantity: 1, completed: true, category: 'fondo' }
    ]
  },
  {
    id: 'proj_2',
    name: 'Ropero Closet 2 Cuerpos',
    clientName: 'Arq. Ramírez',
    category: 'closet',
    totalHeightCm: 190,
    totalWidthCm: 120,
    totalDepthCm: 55,
    materialType: 'Triplay Pino de 1ra',
    thicknessMm: 18,
    createdAt: '2026-08-11',
    status: 'en_diseño',
    notes: 'Barniz natural al poliuretano. Jaladeras de madera artesanales.',
    cuts: [
      { id: 'c10', name: 'Costados Principales', lengthCm: 190, widthCm: 55, quantity: 2, completedQuantity: 0, completed: false, category: 'lateral' },
      { id: 'c11', name: 'Base Inferior y Tapa', lengthCm: 116.4, widthCm: 55, quantity: 2, completedQuantity: 0, completed: false, category: 'piso' },
      { id: 'c12', name: 'Divisor Central', lengthCm: 180, widthCm: 53, quantity: 1, completedQuantity: 0, completed: false, category: 'lateral' },
      { id: 'c13', name: 'Puertas Batientes Grande', lengthCm: 185, widthCm: 59, quantity: 2, completedQuantity: 0, completed: false, category: 'puerta' },
      { id: 'c14', name: 'Estantes para Colgador', lengthCm: 57, widthCm: 52, quantity: 4, completedQuantity: 0, completed: false, category: 'repisa' }
    ]
  }
];

export const INITIAL_OFFCUTS: OffcutItem[] = [
  {
    id: 'off_1',
    materialType: 'Melamina Blanca',
    thicknessMm: 15,
    lengthCm: 110,
    widthCm: 45,
    location: 'Estante A - Nivel Superior',
    status: 'disponible',
    dateAdded: '2026-08-05',
    notes: 'Corte limpio, sin despostilladuras en cantos.'
  },
  {
    id: 'off_2',
    materialType: 'Triplay Pino de 1ra',
    thicknessMm: 18,
    lengthCm: 85,
    widthCm: 60,
    location: 'Detrás de la Sierra Banco',
    status: 'disponible',
    dateAdded: '2026-08-08',
    notes: 'Veta en sentido longitudinal de 85cm.'
  },
  {
    id: 'off_3',
    materialType: 'MDF Comercial',
    thicknessMm: 15,
    lengthCm: 120,
    widthCm: 30,
    location: 'Contenedor #2 Retazos Pequeños',
    status: 'reservado',
    dateAdded: '2026-08-09',
    notes: 'Reservado para tiras de ajuste de soclo.'
  },
  {
    id: 'off_4',
    materialType: 'Melamina Cedro / Madera',
    thicknessMm: 18,
    lengthCm: 75,
    widthCm: 50,
    location: 'Estante B - Esquina Izquierda',
    status: 'disponible',
    dateAdded: '2026-08-01',
    notes: 'Excelente estado para frentes de cajón.'
  }
];

export const INITIAL_LOGS: AppActivityLog[] = [
  {
    id: 'log_1',
    timestamp: '12 Ago 2026, 09:15',
    user: 'Maestro Don José',
    action: 'Inicio de Sesión',
    details: 'Ingresó al sistema desde la tablet de taller.'
  },
  {
    id: 'log_2',
    timestamp: '12 Ago 2026, 09:30',
    user: 'Maestro Don José',
    action: 'Creó Proyecto',
    details: 'Calculó cortes para "Gabinete Alto Cocina".'
  },
  {
    id: 'log_3',
    timestamp: '12 Ago 2026, 10:12',
    user: 'Maestro Don José',
    action: 'Registro de Retazo',
    details: 'Añadió retazo de Melamina Blanca (110x45cm) al inventario.'
  },
  {
    id: 'log_4',
    timestamp: '12 Ago 2026, 11:05',
    user: 'Don José',
    action: 'Marcó Corte Ejecutado',
    details: 'Completó los laterales izquierdo y derecho (80x35cm).'
  }
];
