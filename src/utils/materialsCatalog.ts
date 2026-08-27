import { CatalogMaterialItem, BudgetItemCategory } from '../types';

export const DEFAULT_MATERIALS_CATALOG: CatalogMaterialItem[] = [
  // 1. TABLEROS Y PLACAS (Hojas estándar 2.44 × 1.22 m)
  {
    id: 'mat_mel_blanca_15',
    name: 'Melamina Blanca Estándar 15mm',
    category: 'tablero',
    unit: 'hojas',
    unitPrice: 850,
    description: 'Tablero MDP/MDF 2.44 × 1.22 m con recubrimiento melamínico blanco 2 caras',
    thicknessMm: 15,
    isDefault: true,
    brand: 'Arauco / Masisa'
  },
  {
    id: 'mat_mel_blanca_18',
    name: 'Melamina Blanca Estándar 18mm',
    category: 'tablero',
    unit: 'hojas',
    unitPrice: 980,
    description: 'Tablero MDP/MDF 2.44 × 1.22 m melamina blanca uso rudo y cubiertas',
    thicknessMm: 18,
    isDefault: true,
    brand: 'Arauco / Masisa'
  },
  {
    id: 'mat_mel_diseno_15',
    name: 'Melamina Texturizada / Vetas Madera 15mm',
    category: 'tablero',
    unit: 'hojas',
    unitPrice: 1150,
    description: 'Tablero texturizado poro/madera (Roble, Nogal, Parota, Teca, Humo) 2.44 × 1.22 m',
    thicknessMm: 15,
    isDefault: true,
    brand: 'FunderMax / Vesto'
  },
  {
    id: 'mat_mel_diseno_18',
    name: 'Melamina Texturizada / Vetas Madera 18mm',
    category: 'tablero',
    unit: 'hojas',
    unitPrice: 1280,
    description: 'Tablero texturizado alta gama 18mm 2.44 × 1.22 m para frentes y cubiertas',
    thicknessMm: 18,
    isDefault: true,
    brand: 'FunderMax / Vesto'
  },
  {
    id: 'mat_mdf_crudo_15',
    name: 'MDF Crudo 15mm',
    category: 'tablero',
    unit: 'hojas',
    unitPrice: 680,
    description: 'Tablero de fibra de densidad media para laquear o pintar 2.44 × 1.22 m',
    thicknessMm: 15,
    isDefault: true,
    brand: 'Trupan / Duraplay'
  },
  {
    id: 'mat_mdf_crudo_18',
    name: 'MDF Crudo 18mm',
    category: 'tablero',
    unit: 'hojas',
    unitPrice: 790,
    description: 'Tablero de fibra de densidad media 18mm 2.44 × 1.22 m',
    thicknessMm: 18,
    isDefault: true,
    brand: 'Trupan / Duraplay'
  },
  {
    id: 'mat_mdf_fondo_3_blanco',
    name: 'MDF Blanco Fondo 3mm (Durolac / Fondos)',
    category: 'tablero',
    unit: 'hojas',
    unitPrice: 320,
    description: 'Panel delgado 3mm para fondos de muebles y traseras de cajones 2.44 × 1.22 m',
    thicknessMm: 3,
    isDefault: true,
    brand: 'Masisa'
  },
  {
    id: 'mat_mdf_fondo_3_crudo',
    name: 'MDF Crudo Fondo 3mm',
    category: 'tablero',
    unit: 'hojas',
    unitPrice: 220,
    description: 'Panel de fibra 3mm para fondos y fondos de cajón 2.44 × 1.22 m',
    thicknessMm: 3,
    isDefault: true,
    brand: 'Genérico'
  },
  {
    id: 'mat_triplay_pino_15',
    name: 'Triplay de Pino Primera 15mm',
    category: 'tablero',
    unit: 'hojas',
    unitPrice: 920,
    description: 'Madera contrachapada de pino calidad BC / Primera 2.44 × 1.22 m',
    thicknessMm: 15,
    isDefault: true,
    brand: 'Nacional'
  },
  {
    id: 'mat_triplay_pino_18',
    name: 'Triplay de Pino Primera 18mm',
    category: 'tablero',
    unit: 'hojas',
    unitPrice: 1180,
    description: 'Madera contrachapada de pino reforzada 2.44 × 1.22 m',
    thicknessMm: 18,
    isDefault: true,
    brand: 'Nacional'
  },

  // 2. CUBRECANTOS
  {
    id: 'canto_pvc_delgado_19',
    name: 'Cubrecanto PVC Delgado 0.45mm (Ancho 19mm)',
    category: 'cubrecanto',
    unit: 'metros',
    unitPrice: 12,
    description: 'Canto termoplástico estándar para cantos ocultos y costados',
    isDefault: true,
    brand: 'Cantisa / Rehau'
  },
  {
    id: 'canto_pvc_grueso_2mm',
    name: 'Cubrecanto PVC Grueso 2.0mm Alto Impacto (19mm)',
    category: 'cubrecanto',
    unit: 'metros',
    unitPrice: 28,
    description: 'Canto redondeado antichoque para puertas y frentes de uso rudo',
    isDefault: true,
    brand: 'Rehau / Cantisa'
  },
  {
    id: 'canto_melaminico_pre',
    name: 'Cubrecanto Melamínico Pre-encolado 19mm',
    category: 'cubrecanto',
    unit: 'metros',
    unitPrice: 9,
    description: 'Canto con adhesivo termofusible aplicable con plancha de calor',
    isDefault: true,
    brand: 'Genérico'
  },

  // 3. CORREDERAS DE CAJONES
  {
    id: 'corr_telescopica_normal_45',
    name: 'Correderas Telescópicas Reforzadas 45cm (Juego Par)',
    category: 'corredera',
    unit: 'pares',
    unitPrice: 160,
    description: 'Par de correderas balero de acero extensión total capacidad 35kg',
    isDefault: true,
    brand: 'Ducasse / Handy Home'
  },
  {
    id: 'corr_telescopica_soft_45',
    name: 'Correderas Telescópicas Cierre Suave (Soft-Close) 45cm',
    category: 'corredera',
    unit: 'pares',
    unitPrice: 220,
    description: 'Corredera balero con amortiguador hidráulico integrado de cierre silencioso',
    isDefault: true,
    brand: 'Ducasse / Hettich'
  },
  {
    id: 'corr_oculta_soft_close',
    name: 'Correderas Ocultas Bajo Cajón Cierre Suave 45/50cm',
    category: 'corredera',
    unit: 'pares',
    unitPrice: 380,
    description: 'Sistema bajo fondo invisible con regulación 3D y desacople rápido',
    isDefault: true,
    brand: 'Blum / DTC'
  },

  // 4. BISAGRAS CAZOLETA
  {
    id: 'bisagra_cazoleta_soft_recta',
    name: 'Bisagra Cazoleta Recta Cierre Suave 35mm',
    category: 'bisagra',
    unit: 'unidades',
    unitPrice: 45,
    description: 'Bisagra con pistón hidráulico y base desmontable clip-on',
    isDefault: true,
    brand: 'DTC / Handy Home'
  },
  {
    id: 'bisagra_cazoleta_soft_curva',
    name: 'Bisagra Cazoleta Semicurva / Curva Cierre Suave 35mm',
    category: 'bisagra',
    unit: 'unidades',
    unitPrice: 48,
    description: 'Para montajes intermedios o interiores con amortiguador',
    isDefault: true,
    brand: 'DTC / Handy Home'
  },
  {
    id: 'bisagra_cazoleta_estandar',
    name: 'Bisagra Cazoleta Estándar (Sin amortiguador) 35mm',
    category: 'bisagra',
    unit: 'unidades',
    unitPrice: 25,
    description: 'Bisagra tradicional resorte mecánico básico',
    isDefault: true,
    brand: 'Genérico'
  },

  // 5. HERRAJES & TIRADORES
  {
    id: 'herraje_jaladera_aluminio_barra',
    name: 'Jaladera / Tirador Barra Tubular Aluminio 128mm',
    category: 'herraje',
    unit: 'unidades',
    unitPrice: 65,
    description: 'Tirador moderno acabado cepillado mate con tornillos incluidos',
    isDefault: true,
    brand: 'Handy Home'
  },
  {
    id: 'herraje_perfil_gola',
    name: 'Jaladera Perfil de Aluminio Tipo Gola / J (Tira 3m)',
    category: 'herraje',
    unit: 'unidades',
    unitPrice: 190,
    description: 'Perfil embutido corrido para muebles minimalistas sin manijas frontales',
    isDefault: true,
    brand: 'Ducasse'
  },
  {
    id: 'herraje_boton_perilla',
    name: 'Perilla / Botón Metálico Minimalista',
    category: 'herraje',
    unit: 'unidades',
    unitPrice: 35,
    description: 'Botón cilíndrico / cónico para puertas auxiliares',
    isDefault: true,
    brand: 'Handy Home'
  },
  {
    id: 'herraje_piston_gas',
    name: 'Pistón a Gas para Puertas Elevables (80N / 100N)',
    category: 'herraje',
    unit: 'unidades',
    unitPrice: 95,
    description: 'Brazo neumático para gabinetes superiores horizontales',
    isDefault: true,
    brand: 'Handy Home'
  },
  {
    id: 'herraje_patas_niveladoras',
    name: 'Patas Niveladoras Plásticas Ocultas para Zócalo (Juego 4u)',
    category: 'herraje',
    unit: 'paquete',
    unitPrice: 110,
    description: 'Regulables en altura con clips de sujeción para faldón zócalo',
    isDefault: true,
    brand: 'Hettich'
  },

  // 6. CONSUMIBLES & FIJACIONES
  {
    id: 'cons_tornillos_spax_4x50',
    name: 'Tornillos Soberbios / Spax 4 × 50 mm (Caja 500u)',
    category: 'consumible',
    unit: 'paquete',
    unitPrice: 180,
    description: 'Tornillos autorroscantes bicromatados cabeza avellanada',
    isDefault: true,
    brand: 'Spax / Fiero'
  },
  {
    id: 'cons_tornillos_35x16',
    name: 'Tornillos para Herrajes 3.5 × 16 mm (Caja 1000u)',
    category: 'consumible',
    unit: 'paquete',
    unitPrice: 130,
    description: 'Para fijar bisagras, correderas y escuadras sin perforar al otro lado',
    isDefault: true,
    brand: 'Fiero'
  },
  {
    id: 'cons_pegamento_contacto_1l',
    name: 'Pegamento de Contacto Profesional 1 Litro',
    category: 'consumible',
    unit: 'unidades',
    unitPrice: 165,
    description: 'Adhesivo de contacto de alto agarre para laminados y cantos',
    isDefault: true,
    brand: 'Resistol / 5000'
  },
  {
    id: 'cons_adhesivo_pva_madera',
    name: 'Adhesivo PVA Blanco para Madera 1 Litro',
    category: 'consumible',
    unit: 'unidades',
    unitPrice: 140,
    description: 'Pegamento vinílico D3 resistente a la humedad para espigas y ranuras',
    isDefault: true,
    brand: 'Resistol 850 / Titebond'
  },
  {
    id: 'cons_tapatornillos_adhesivos',
    name: 'Tapatornillos Autoadhesivos Melamínicos (Pliego 54u)',
    category: 'consumible',
    unit: 'paquete',
    unitPrice: 40,
    description: 'Tapas circulares adhesivas del mismo color de la melamina',
    isDefault: true,
    brand: 'Cantisa'
  },
  {
    id: 'cons_tarugos_madera_8x30',
    name: 'Tarugos / Espigas de Madera Estriada 8 × 30 mm (100u)',
    category: 'consumible',
    unit: 'paquete',
    unitPrice: 60,
    description: 'Espigas de haya prensada calibradas para ensamble',
    isDefault: true,
    brand: 'Genérico'
  }
];

const STORAGE_KEY = 'carpinteria_materials_catalog_v1';

/**
 * Deduplica un catálogo de materiales asegurando IDs únicos y evitando duplicados exactos
 */
export function deduplicateCatalog(items: CatalogMaterialItem[]): CatalogMaterialItem[] {
  if (!Array.isArray(items)) return [];
  const seenIds = new Set<string>();
  const seenKeys = new Set<string>();
  const result: CatalogMaterialItem[] = [];

  for (let index = 0; index < items.length; index++) {
    const item = items[index];
    if (!item || !item.name) continue;

    // Normalizar clave única por categoría, nombre limpio y espesor
    const normName = cleanMaterialName(item.name).toLowerCase().trim();
    const key = `${item.category}_${normName}_${item.thicknessMm || 0}`;

    // Asegurar que el ID sea único
    let uniqueId = item.id;
    if (!uniqueId || seenIds.has(uniqueId)) {
      uniqueId = `${item.id || 'mat'}_${index}_${Math.random().toString(36).substring(2, 6)}`;
    }

    if (!seenKeys.has(key)) {
      seenKeys.add(key);
      seenIds.add(uniqueId);
      result.push({
        ...item,
        id: uniqueId,
        name: item.name.trim()
      });
    }
  }

  return result;
}

/**
 * Obtiene el catálogo de materiales guardado en localStorage o el inicial por defecto, garantizando cero duplicados
 */
export function getStoredMaterialsCatalog(): CatalogMaterialItem[] {
  if (typeof window === 'undefined') return deduplicateCatalog(DEFAULT_MATERIALS_CATALOG);
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      if (Array.isArray(parsed) && parsed.length > 0) {
        const cleaned = deduplicateCatalog(parsed);
        return cleaned;
      }
    }
  } catch (e) {
    console.error('Error al leer catálogo de materiales:', e);
  }
  return deduplicateCatalog(DEFAULT_MATERIALS_CATALOG);
}

/**
 * Guarda el catálogo de materiales en localStorage y notifica a toda la aplicación
 */
export function saveMaterialsCatalog(catalog: CatalogMaterialItem[]): void {
  if (typeof window === 'undefined') return;
  try {
    const deduplicated = deduplicateCatalog(catalog);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(deduplicated));
    window.dispatchEvent(new CustomEvent('materialsCatalogChanged', { detail: deduplicated }));
  } catch (e) {
    console.error('Error al guardar catálogo de materiales:', e);
  }
}

/**
 * Elimina un material del Catálogo Maestro y sincroniza automáticamente todos los módulos
 */
export function deleteMaterialFromCatalog(itemId: string): CatalogMaterialItem[] {
  const current = getStoredMaterialsCatalog();
  const updated = current.filter(item => item.id !== itemId);
  saveMaterialsCatalog(updated);
  return updated;
}

/**
 * Restablece el catálogo a los valores de fábrica
 */
export function resetMaterialsCatalogToDefaults(): CatalogMaterialItem[] {
  const defaults = deduplicateCatalog(DEFAULT_MATERIALS_CATALOG);
  saveMaterialsCatalog(defaults);
  return defaults;
}

/**
 * Limpia y estandariza el nombre de un material/insumo eliminando prefijos como "Tablero" o "Hojas"
 * y formateando el espesor de forma limpia (ej. "Melamina Blanca 15mm", "MDF 3mm", "Triplay Pino 15mm").
 */
export function cleanMaterialName(name: string, thickness?: number): string {
  if (!name) return thickness ? `Material Estándar ${thickness}mm` : 'Material Estándar';

  let cleaned = name.trim();

  // Eliminar prefijos repetitivos como "Tablero", "tablero", "Hojas de", "Placa de", "Lámina de"
  cleaned = cleaned.replace(/^(tablero|tableros|hojas?\s+de|placas?\s+de|l[áa]minas?\s+de)\s+/i, '');
  
  // Limpiar paréntesis redundantes como "(15mm)" o "(15 mm)"
  cleaned = cleaned.replace(/\s*\(\s*(\d+(?:\.\d+)?)\s*mm\s*\)/i, ' $1mm');
  
  // Limpiar descripciones entre paréntesis largas como "(Durolac / Fondos)" o "(Arauco / Masisa)"
  cleaned = cleaned.replace(/\s*\([^)]*\)/g, '').trim();

  // Si se proporciona un espesor y el nombre aún no incluye el sufijo "Xmm"
  if (thickness && !/\b\d+(?:\.\d+)?\s*mm\b/i.test(cleaned)) {
    cleaned = `${cleaned} ${thickness}mm`;
  }

  // Normalizar dobles espacios
  cleaned = cleaned.replace(/\s+/g, ' ').trim();

  return cleaned;
}

export interface MaterialTagOption {
  id: string;
  name: string;          // Nombre completo limpio ej. "Melamina Blanca 15mm"
  baseName: string;      // Nombre base ej. "Melamina Blanca"
  thicknessMm: number;   // Espesor en mm ej. 15
  unitPrice: number;     // Precio por hoja en el catálogo
  unit: string;          // Unidad ej. "hojas"
  brand?: string;        // Marca sugerida
  icon: string;          // Emoji distintivo
  colorBadge: string;    // Clases tailwind de color para badges
}

/**
 * Retorna la lista oficial de etiquetas (tags) de tableros del catálogo maestro
 */
export function getBoardMaterialTags(catalog: CatalogMaterialItem[] = getStoredMaterialsCatalog()): MaterialTagOption[] {
  const boardItems = catalog.filter(item => item.category === 'tablero');
  
  return boardItems.map(item => {
    const thick = item.thicknessMm || 15;
    const clean = cleanMaterialName(item.name, thick);
    
    // Asignar color según el tipo de tablero
    let colorBadge = 'bg-amber-100 text-amber-900 border-amber-300 hover:bg-amber-200';
    let icon = '🪵';
    const lower = item.name.toLowerCase();

    if (lower.includes('blanca')) {
      colorBadge = 'bg-slate-100 text-slate-900 border-slate-300 hover:bg-slate-200';
      icon = '⚪';
    } else if (lower.includes('texturiz') || lower.includes('madera') || lower.includes('nogal') || lower.includes('roble') || lower.includes('parota')) {
      colorBadge = 'bg-amber-100 text-amber-950 border-amber-400 hover:bg-amber-200';
      icon = '🪵';
    } else if (lower.includes('fondo') || thick <= 4) {
      colorBadge = 'bg-blue-100 text-blue-950 border-blue-300 hover:bg-blue-200';
      icon = '📄';
    } else if (lower.includes('mdf')) {
      colorBadge = 'bg-orange-100 text-orange-950 border-orange-300 hover:bg-orange-200';
      icon = '🟤';
    } else if (lower.includes('triplay') || lower.includes('pino')) {
      colorBadge = 'bg-emerald-100 text-emerald-950 border-emerald-300 hover:bg-emerald-200';
      icon = '🌲';
    }

    // Extraer baseName sin espesor
    const baseName = clean.replace(/\s*\b\d+(?:\.\d+)?\s*mm\b/i, '').trim();

    return {
      id: item.id,
      name: clean,
      baseName: baseName || item.name,
      thicknessMm: thick,
      unitPrice: item.unitPrice,
      unit: item.unit || 'hojas',
      brand: item.brand,
      icon,
      colorBadge
    };
  });
}

/**
 * Retorna la lista única de nombres de materiales de tablero disponibles en el catálogo maestro.
 * Se alimenta EXCLUSIVAMENTE de los ítems existentes en el catálogo maestro. Si un material
 * se elimina del catálogo, desaparecerá automáticamente de esta lista.
 */
export function getAvailableBoardMaterialNames(catalog: CatalogMaterialItem[] = getStoredMaterialsCatalog()): string[] {
  const boardItems = catalog.filter(item => item.category === 'tablero');
  const namesSet = new Set<string>();

  boardItems.forEach(item => {
    // Limpiar el nombre quitando el espesor final si lo tiene para agruparlo en el selector de tipo
    const baseName = item.name
      .replace(/\s*\b\d+(?:\.\d+)?\s*mm\b/i, '')
      .replace(/\s*\([^)]*\)/g, '')
      .replace(/^(tablero|tableros|hojas?\s+de|placas?\s+de|l[áa]minas?\s+de)\s+/i, '')
      .trim();

    if (baseName && baseName.length > 1) {
      namesSet.add(baseName);
    } else if (item.name && item.name.trim().length > 1) {
      namesSet.add(item.name.trim());
    }
  });

  const list = Array.from(namesSet);
  return list.length > 0 ? list : ['Melamina Blanca', 'MDF Comercial', 'Triplay Pino'];
}

/**
 * Retorna la lista ordenada y desduplicada de espesores (mm) disponibles en el catálogo maestro.
 */
export function getAvailableThicknesses(catalog: CatalogMaterialItem[] = getStoredMaterialsCatalog()): number[] {
  const thickSet = new Set<number>();
  
  // Extraer espesores de los tableros registrados
  catalog.filter(i => i.category === 'tablero' && i.thicknessMm).forEach(i => {
    if (i.thicknessMm && i.thicknessMm > 0) {
      thickSet.add(i.thicknessMm);
    }
  });

  // Espesores estándar base si la lista está vacía
  if (thickSet.size === 0) {
    [3, 6, 12, 15, 18, 25].forEach(t => thickSet.add(t));
  }

  return Array.from(thickSet).sort((a, b) => a - b);
}

/**
 * Registra automáticamente un nuevo material en el Catálogo Maestro de materiales.
 * Si ya existe, actualiza o no duplica; si no existe, lo agrega a la categoría 'tablero'.
 * Guarda en localStorage y dispara el evento 'materialsCatalogChanged' para sincronización inmediata en toda la app.
 */
export function registerNewMaterialInCatalog(
  materialName: string,
  thicknessMm: number = 15,
  unitPrice: number = 850,
  unit: string = 'hojas'
): CatalogMaterialItem {
  const catalog = getStoredMaterialsCatalog();
  const trimmedName = materialName.trim();
  const cleanName = cleanMaterialName(trimmedName, thicknessMm);

  // Buscar si ya existe un material con el mismo nombre y espesor
  const existingIndex = catalog.findIndex(
    item => (item.name.toLowerCase() === cleanName.toLowerCase() || 
             item.name.toLowerCase() === trimmedName.toLowerCase()) &&
            item.category === 'tablero'
  );

  let targetItem: CatalogMaterialItem;

  if (existingIndex >= 0) {
    targetItem = catalog[existingIndex];
  } else {
    targetItem = {
      id: `mat_custom_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      name: cleanName,
      category: 'tablero',
      unit: unit || 'hojas',
      unitPrice: unitPrice > 0 ? unitPrice : 850,
      description: `Material registrado desde el taller / despiece (${thicknessMm}mm)`,
      thicknessMm: thicknessMm || 15,
      isDefault: false,
      brand: 'Taller'
    };
    catalog.push(targetItem);
    saveMaterialsCatalog(catalog);
  }

  // Notificar a toda la ventana para que los componentes suscritos se actualicen reactivamente
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('materialsCatalogChanged', { detail: targetItem }));
  }

  return targetItem;
}

/**
 * Retorna los nombres de materiales únicos de tableros para selectores
 */
export function getStandardBoardMaterialsList(catalog: CatalogMaterialItem[] = getStoredMaterialsCatalog()): {
  name: string;
  thicknesses: number[];
  defaultThickness: number;
}[] {
  const tags = getBoardMaterialTags(catalog);
  const grouped: Record<string, { thicknesses: Set<number>; defaultThickness: number }> = {};

  tags.forEach(t => {
    if (!grouped[t.baseName]) {
      grouped[t.baseName] = { thicknesses: new Set(), defaultThickness: t.thicknessMm };
    }
    grouped[t.baseName].thicknesses.add(t.thicknessMm);
  });

  return Object.entries(grouped).map(([name, data]) => ({
    name,
    thicknesses: Array.from(data.thicknesses).sort((a, b) => a - b),
    defaultThickness: data.defaultThickness
  }));
}

/**
 * Busca el precio de un ítem en el catálogo según nombre, categoría o espesor
 */
export function findCatalogPrice(
  name: string,
  category: BudgetItemCategory,
  thicknessMm?: number,
  catalog: CatalogMaterialItem[] = getStoredMaterialsCatalog()
): number | null {
  const cleanName = name.toLowerCase();

  // 1. Coincidencia exacta por nombre
  const exactMatch = catalog.find(
    item => item.name.toLowerCase() === cleanName && item.category === category
  );
  if (exactMatch) return exactMatch.unitPrice;

  // 2. Si es tablero, buscar por espesor y material
  if (category === 'tablero') {
    if (thicknessMm && thicknessMm <= 4) {
      const mdfFondo = catalog.find(i => i.category === 'tablero' && i.thicknessMm === 3 && i.name.toLowerCase().includes('blanco'));
      if (mdfFondo) return mdfFondo.unitPrice;
    }
    if (cleanName.includes('textur') || cleanName.includes('nogal') || cleanName.includes('roble') || cleanName.includes('parota') || cleanName.includes('diseño')) {
      const thickTarget = (thicknessMm && thicknessMm >= 17) ? 18 : 15;
      const texturMatch = catalog.find(i => i.category === 'tablero' && i.thicknessMm === thickTarget && i.name.toLowerCase().includes('texturiz'));
      if (texturMatch) return texturMatch.unitPrice;
    }
    if (cleanName.includes('mdf') && !cleanName.includes('fondo')) {
      const thickTarget = (thicknessMm && thicknessMm >= 17) ? 18 : 15;
      const mdfMatch = catalog.find(i => i.category === 'tablero' && i.thicknessMm === thickTarget && i.name.toLowerCase().includes('mdf crudo'));
      if (mdfMatch) return mdfMatch.unitPrice;
    }
    if (cleanName.includes('triplay') || cleanName.includes('pino')) {
      const thickTarget = (thicknessMm && thicknessMm >= 17) ? 18 : 15;
      const triplayMatch = catalog.find(i => i.category === 'tablero' && i.thicknessMm === thickTarget && i.name.toLowerCase().includes('triplay'));
      if (triplayMatch) return triplayMatch.unitPrice;
    }
    // Melamina Blanca genérica
    const thickTarget = (thicknessMm && thicknessMm >= 17) ? 18 : 15;
    const melMatch = catalog.find(i => i.category === 'tablero' && i.thicknessMm === thickTarget && i.name.toLowerCase().includes('blanca'));
    if (melMatch) return melMatch.unitPrice;
  }

  // 3. Si es cubrecanto
  if (category === 'cubrecanto') {
    if (cleanName.includes('grueso') || cleanName.includes('2mm') || cleanName.includes('impacto')) {
      const thickEdge = catalog.find(i => i.category === 'cubrecanto' && i.name.toLowerCase().includes('grueso'));
      if (thickEdge) return thickEdge.unitPrice;
    }
    const defaultEdge = catalog.find(i => i.category === 'cubrecanto' && i.name.toLowerCase().includes('delgado'));
    if (defaultEdge) return defaultEdge.unitPrice;
  }

  // 4. Si es corredera
  if (category === 'corredera') {
    if (cleanName.includes('suave') || cleanName.includes('soft') || cleanName.includes('amortiguad')) {
      const soft = catalog.find(i => i.category === 'corredera' && i.name.toLowerCase().includes('suave'));
      if (soft) return soft.unitPrice;
    }
    if (cleanName.includes('oculta')) {
      const hidden = catalog.find(i => i.category === 'corredera' && i.name.toLowerCase().includes('oculta'));
      if (hidden) return hidden.unitPrice;
    }
    const normal = catalog.find(i => i.category === 'corredera');
    if (normal) return normal.unitPrice;
  }

  // 5. Si es bisagra
  if (category === 'bisagra') {
    if (cleanName.includes('suave') || cleanName.includes('cazoleta')) {
      const softHinge = catalog.find(i => i.category === 'bisagra' && i.name.toLowerCase().includes('suave'));
      if (softHinge) return softHinge.unitPrice;
    }
    const stdHinge = catalog.find(i => i.category === 'bisagra');
    if (stdHinge) return stdHinge.unitPrice;
  }

  // 6. Si es tirador / herraje
  if (category === 'herraje') {
    if (cleanName.includes('gola') || cleanName.includes('perfil')) {
      const gola = catalog.find(i => i.name.toLowerCase().includes('gola'));
      if (gola) return gola.unitPrice;
    }
    const handle = catalog.find(i => i.category === 'herraje' && i.name.toLowerCase().includes('barra'));
    if (handle) return handle.unitPrice;
  }

  // 7. Consumibles
  if (category === 'consumible') {
    if (cleanName.includes('tornillo') || cleanName.includes('spax')) {
      const screws = catalog.find(i => i.name.toLowerCase().includes('spax'));
      if (screws) return screws.unitPrice;
    }
  }

  return null;
}
