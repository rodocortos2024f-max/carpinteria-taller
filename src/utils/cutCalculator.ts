import { WoodCut, FurnitureCategory } from '../types';

export function calculateFurnitureCuts(
  category: FurnitureCategory,
  heightCm: number,
  widthCm: number,
  depthCm: number,
  thicknessMm: number,
  materialName: string
): WoodCut[] {
  const t = thicknessMm / 10; // convert mm to cm
  const cuts: WoodCut[] = [];

  switch (category) {
    case 'gabinete': {
      // 2 Laterales (Alto x Profundidad)
      cuts.push({
        id: 'c_' + Math.random().toString(36).substring(2, 7),
        name: 'Laterales Izquierdo y Derecho',
        lengthCm: Number(heightCm.toFixed(1)),
        widthCm: Number(depthCm.toFixed(1)),
        quantity: 2,
        completedQuantity: 0,
        completed: false,
        category: 'lateral',
        notes: `Canto frontal cubierto (${thicknessMm}mm)`
      });

      // Piso e Interior Techo (Ancho total - 2 * Grosor, x Profundidad)
      const internalWidth = widthCm - (2 * t);
      cuts.push({
        id: 'c_' + Math.random().toString(36).substring(2, 7),
        name: 'Piso Inferior y Techo Superior',
        lengthCm: Number(internalWidth.toFixed(1)),
        widthCm: Number(depthCm.toFixed(1)),
        quantity: 2,
        completedQuantity: 0,
        completed: false,
        category: 'piso',
        notes: 'Va entre los dos laterales'
      });

      // Repisas Interiores (Ancho interno - 0.4cm para ajuste holgado, x Profundidad - 2cm)
      const shelfWidth = internalWidth - 0.4;
      const shelfDepth = depthCm - 2;
      cuts.push({
        id: 'c_' + Math.random().toString(36).substring(2, 7),
        name: 'Repisas Mobilis / Estantes',
        lengthCm: Number(shelfWidth.toFixed(1)),
        widthCm: Number(shelfDepth.toFixed(1)),
        quantity: 2,
        completedQuantity: 0,
        completed: false,
        category: 'repisa',
        notes: 'Ajustable con pernos de repisa'
      });

      // Puertas Batientes (2 piezas: Alto - 0.5cm luz, Ancho / 2 - 0.3cm luz)
      const doorHeight = heightCm - 0.5;
      const doorWidth = (widthCm / 2) - 0.3;
      cuts.push({
        id: 'c_' + Math.random().toString(36).substring(2, 7),
        name: 'Puertas Frontales (Par)',
        lengthCm: Number(doorHeight.toFixed(1)),
        widthCm: Number(doorWidth.toFixed(1)),
        quantity: 2,
        completedQuantity: 0,
        completed: false,
        category: 'puerta',
        notes: 'Descuento de 3mm de holgura por puerta'
      });

      // Fondo Respaldo (Alto - 2cm, Ancho - 2cm)
      cuts.push({
        id: 'c_' + Math.random().toString(36).substring(2, 7),
        name: 'Fondo Respaldo (MDF 3mm)',
        lengthCm: Number((heightCm - 1.5).toFixed(1)),
        widthCm: Number((widthCm - 1.5).toFixed(1)),
        quantity: 1,
        completedQuantity: 0,
        completed: false,
        category: 'fondo',
        notes: 'Encajonado o clavado por detrás'
      });
      break;
    }

    case 'closet': {
      // Costados Exteriores
      cuts.push({
        id: 'c_' + Math.random().toString(36).substring(2, 7),
        name: 'Costados Exteriores Principales',
        lengthCm: Number(heightCm.toFixed(1)),
        widthCm: Number(depthCm.toFixed(1)),
        quantity: 2,
        completedQuantity: 0,
        completed: false,
        category: 'lateral',
        notes: 'Con chaflán para zócalo/soclo de 8cm'
      });

      // Techo y Piso Base
      const internalWidth = widthCm - (2 * t);
      cuts.push({
        id: 'c_' + Math.random().toString(36).substring(2, 7),
        name: 'Base Inferior y Tapa Techo',
        lengthCm: Number(internalWidth.toFixed(1)),
        widthCm: Number(depthCm.toFixed(1)),
        quantity: 2,
        completedQuantity: 0,
        completed: false,
        category: 'piso',
        notes: 'Soporte estructural'
      });

      // Division Vertical Central
      const internalHeight = heightCm - (2 * t) - 8; // Restando zocalo
      cuts.push({
        id: 'c_' + Math.random().toString(36).substring(2, 7),
        name: 'Divisoria Vertical Central',
        lengthCm: Number(internalHeight.toFixed(1)),
        widthCm: Number((depthCm - 2).toFixed(1)),
        quantity: 1,
        completedQuantity: 0,
        completed: false,
        category: 'lateral',
        notes: 'Divide cuerpo izquierdo y derecho'
      });

      // Repisas para Roperos (4 piezas)
      const sideShelfWidth = (internalWidth - t) / 2;
      cuts.push({
        id: 'c_' + Math.random().toString(36).substring(2, 7),
        name: 'Repisas Ropa Doblada',
        lengthCm: Number((sideShelfWidth - 0.3).toFixed(1)),
        widthCm: Number((depthCm - 4).toFixed(1)),
        quantity: 4,
        completedQuantity: 0,
        completed: false,
        category: 'repisa',
        notes: '2 para cada lado del ropero'
      });

      // Puertas Grandes Closet
      const doorHeight = heightCm - 8.5; // Resta soclo y luz
      const doorWidth = (widthCm / 2) - 0.3;
      cuts.push({
        id: 'c_' + Math.random().toString(36).substring(2, 7),
        name: 'Puertas de Closet Batientes',
        lengthCm: Number(doorHeight.toFixed(1)),
        widthCm: Number(doorWidth.toFixed(1)),
        quantity: 2,
        completedQuantity: 0,
        completed: false,
        category: 'puerta',
        notes: 'Enchapado de canto PVC en los 4 bordes'
      });
      break;
    }

    case 'librero': {
      // Costados Laterales
      cuts.push({
        id: 'c_' + Math.random().toString(36).substring(2, 7),
        name: 'Costados Verticales Librero',
        lengthCm: Number(heightCm.toFixed(1)),
        widthCm: Number(depthCm.toFixed(1)),
        quantity: 2,
        completedQuantity: 0,
        completed: false,
        category: 'lateral',
        notes: 'Mecanizado con perforaciones para repisas'
      });

      // Base Inferior y Techo
      const internalWidth = widthCm - (2 * t);
      cuts.push({
        id: 'c_' + Math.random().toString(36).substring(2, 7),
        name: 'Base Inferior y Cornisa Techo',
        lengthCm: Number(internalWidth.toFixed(1)),
        widthCm: Number(depthCm.toFixed(1)),
        quantity: 2,
        completedQuantity: 0,
        completed: false,
        category: 'piso',
        notes: 'Estructura rígida'
      });

      // Repisas para Libros (4 repisas gruesas)
      cuts.push({
        id: 'c_' + Math.random().toString(36).substring(2, 7),
        name: 'Repisas Reforzadas Libros',
        lengthCm: Number((internalWidth - 0.2).toFixed(1)),
        widthCm: Number((depthCm - 1).toFixed(1)),
        quantity: 4,
        completedQuantity: 0,
        completed: false,
        category: 'repisa',
        notes: 'Soporta hasta 30kg de carga distribuida'
      });

      // Respaldo
      cuts.push({
        id: 'c_' + Math.random().toString(36).substring(2, 7),
        name: 'Fondo Librero (MDF 3mm/5mm)',
        lengthCm: Number((heightCm - 1).toFixed(1)),
        widthCm: Number((widthCm - 1).toFixed(1)),
        quantity: 1,
        completedQuantity: 0,
        completed: false,
        category: 'fondo',
        notes: 'Brinda escuadra perfecta al mueble'
      });
      break;
    }

    case 'escritorio':
    case 'mesa': {
      // Cubierta / Tapa Superior
      cuts.push({
        id: 'c_' + Math.random().toString(36).substring(2, 7),
        name: 'Cubierta / Tapa Principal Desk',
        lengthCm: Number(widthCm.toFixed(1)),
        widthCm: Number(depthCm.toFixed(1)),
        quantity: 1,
        completedQuantity: 0,
        completed: false,
        category: 'puerta',
        notes: 'Canto grueso de 2mm en contorno'
      });

      // Laterales Soporte o Patas de Madera
      cuts.push({
        id: 'c_' + Math.random().toString(36).substring(2, 7),
        name: 'Patas / Costados de Apoyo',
        lengthCm: Number((heightCm - t).toFixed(1)),
        widthCm: Number((depthCm - 5).toFixed(1)),
        quantity: 2,
        completedQuantity: 0,
        completed: false,
        category: 'lateral',
        notes: 'Con niveladores inferiores'
      });

      // Faldón de Amarre / Refuerzo Trasero
      cuts.push({
        id: 'c_' + Math.random().toString(36).substring(2, 7),
        name: 'Faldón Amarre Trasero',
        lengthCm: Number((widthCm - (2 * t)).toFixed(1)),
        widthCm: 25,
        quantity: 1,
        completedQuantity: 0,
        completed: false,
        category: 'otro',
        notes: 'Oculta cables y amarra estructura'
      });

      // Cajón Frontal si tiene profundidad suficiente
      cuts.push({
        id: 'c_' + Math.random().toString(36).substring(2, 7),
        name: 'Frente de Cajón',
        lengthCm: Number((widthCm - 10).toFixed(1)),
        widthCm: 16,
        quantity: 1,
        completedQuantity: 0,
        completed: false,
        category: 'frente_cajon',
        notes: 'Espacio para correderas telescópicas'
      });
      break;
    }

    case 'personalizado':
    default: { // Personalizado
      // Genera automáticamente las 4 piezas base: Costados, Techo y Piso
      cuts.push({
        id: 'c_' + Math.random().toString(36).substring(2, 7),
        name: 'Costado Izquierdo',
        lengthCm: Number(heightCm.toFixed(1)),
        widthCm: Number(depthCm.toFixed(1)),
        quantity: 1,
        completedQuantity: 0,
        completed: false,
        category: 'lateral',
        notes: 'Costado lateral izquierdo',
        edges: { top: false, bottom: false, left: false, right: false }
      });

      cuts.push({
        id: 'c_' + Math.random().toString(36).substring(2, 7),
        name: 'Costado Derecho',
        lengthCm: Number(heightCm.toFixed(1)),
        widthCm: Number(depthCm.toFixed(1)),
        quantity: 1,
        completedQuantity: 0,
        completed: false,
        category: 'lateral',
        notes: 'Costado lateral derecho',
        edges: { top: false, bottom: false, left: false, right: false }
      });

      const internalW = widthCm - (2 * t);

      cuts.push({
        id: 'c_' + Math.random().toString(36).substring(2, 7),
        name: 'Piso',
        lengthCm: Number(internalW.toFixed(1)),
        widthCm: Number(depthCm.toFixed(1)),
        quantity: 1,
        completedQuantity: 0,
        completed: false,
        category: 'piso',
        notes: 'Base inferior del armazón',
        edges: { top: false, bottom: false, left: false, right: false }
      });

      cuts.push({
        id: 'c_' + Math.random().toString(36).substring(2, 7),
        name: 'Techo',
        lengthCm: Number(internalW.toFixed(1)),
        widthCm: Number(depthCm.toFixed(1)),
        quantity: 1,
        completedQuantity: 0,
        completed: false,
        category: 'techo',
        notes: 'Cubierta superior del armazón',
        edges: { top: false, bottom: false, left: false, right: false }
      });
      break;
    }
  }

  return cuts.map(c => {
    const isMdfBack = c.category === 'fondo' || c.category === 'fondo_cajon' || c.name.toLowerCase().includes('fondo') || c.name.toLowerCase().includes('3mm');
    return {
      ...c,
      materialType: c.materialType || (isMdfBack ? 'MDF 3mm Blanco' : materialName),
      thicknessMm: c.thicknessMm || (isMdfBack ? 3 : thicknessMm)
    };
  });
}

/**
 * Key used in localStorage for voice confirmation preference
 */
export const VOICE_AUDIO_STORAGE_KEY = 'carpinteria_voice_audio_enabled';

/**
 * Check if workshop voice confirmation alerts are enabled
 */
export function isVoiceAudioEnabled(): boolean {
  if (typeof window === 'undefined') return true;
  try {
    const saved = localStorage.getItem(VOICE_AUDIO_STORAGE_KEY);
    return saved === null ? true : saved === 'true';
  } catch {
    return true;
  }
}

/**
 * Update workshop voice confirmation alerts preference
 */
export function setVoiceAudioEnabled(enabled: boolean): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(VOICE_AUDIO_STORAGE_KEY, enabled ? 'true' : 'false');
    if (!enabled && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
    // Dispatch custom event for real-time reactivity across components
    window.dispatchEvent(new CustomEvent('carpinteria_voice_audio_change', { detail: { enabled } }));
  } catch (err) {
    console.error('Error saving voice audio preference:', err);
  }
}

/**
 * Toggle workshop voice confirmation alerts
 */
export function toggleVoiceAudio(): boolean {
  const current = isVoiceAudioEnabled();
  const next = !current;
  setVoiceAudioEnabled(next);
  return next;
}

/**
 * Text-to-Speech in Spanish helper for accessibility in noisy workshops
 */
export function speakCutDetails(text: string) {
  if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
    return;
  }

  // Pre-validation: do not speak if audio is disabled by the user
  if (!isVoiceAudioEnabled()) {
    try {
      window.speechSynthesis.cancel();
    } catch {}
    return;
  }

  try {
    window.speechSynthesis.cancel(); // cancel previous active voice
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'es-MX';
    utterance.rate = 0.92; // Slightly slower pace for clear listening in a workshop
    utterance.pitch = 1.0;
    window.speechSynthesis.speak(utterance);
  } catch (e) {
    console.warn('Speech synthesis error:', e);
  }
}
