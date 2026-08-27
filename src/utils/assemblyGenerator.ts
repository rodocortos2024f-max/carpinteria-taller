import { WoodCut, FurnitureCategory, AssemblyStep, HardwareItem, PieceVerificationStatus } from '../types';

/**
 * Generates technical step-by-step assembly sequence tailored to the furniture type and dimensions
 */
export function generateAssemblySteps(
  furnitureName: string,
  category: FurnitureCategory,
  heightCm: number,
  widthCm: number,
  depthCm: number,
  thicknessMm: number,
  cuts: WoodCut[]
): AssemblyStep[] {
  const steps: AssemblyStep[] = [];

  const hasDoors = cuts.some(c => c.category === 'puerta');
  const hasShelves = cuts.some(c => c.category === 'repisa');
  const hasBack = cuts.some(c => c.category === 'fondo');

  // STEP 1: Pre-machining & Drill Layout
  steps.push({
    id: 'step_1',
    stepNumber: 1,
    title: 'Mecanizados Previos y Perforaciones en Mesa',
    category: 'mecanizado',
    description: `Antes de iniciar el armado en escuadra, realiza los mecanizados en plano sobre las piezas individuales:
1. Ranura para fondo MDF (profundidad 7 mm, espesor 4 mm, a 20 mm del borde posterior) en Laterales, Piso y Techo.
2. Perforaciones para cazoletas de 35 mm en las puertas (centro a 21.5 mm del borde, a 90 mm de los extremos).
3. Pretaladrado avellanado con broca de 3 mm en cantos/caras para tornillos 4x50 mm a 37 mm y 50 mm de las esquinas.`,
    piecesInvolved: ['Laterales Izquierdo y Derecho', 'Piso Inferior', 'Techo Superior', ...(hasDoors ? ['Puertas Frontales'] : [])],
    hardwareNeeded: ['Broca avellanadora 3.5mm', 'Broca Forstner 35mm', 'Disco de sierra / Fresa ranuradora 4mm'],
    toolsNeeded: ['Taladro de banco / inalámbrico', 'Guía de perforación / Plantilla', 'Flexómetro', 'Escuadra combinada'],
    workshopTip: '¡Consejo del Maestro!: Marca siempre con lápiz blando una "X" en la cara oculta (no vista) de cada pieza antes de perforar o ranurar para evitar confusiones de mano izquierda/derecha.',
    diagramType: 'machining',
    completed: false
  });

  // STEP 2: Frame Assembly (Casco Principal - Piso + Lateral)
  steps.push({
    id: 'step_2',
    stepNumber: 2,
    title: 'Ensamble de Base y Primer Lateral (Ángulo 90°)',
    category: 'estructura',
    description: `Fija el Piso Inferior contra el Lateral Izquierdo:
1. Coloca el Lateral Izquierdo apoyado sobre el banco con el canto frontal al ras.
2. Presenta el Piso Inferior perpendicularmente (a 90°) asegurando que las ranuras de fondo coincidan en profundidad y distancia.
3. Aplica prensa de esquina a 90° y atornilla 2 tornillos Spax 4.0 x 50 mm avellanados.`,
    piecesInvolved: ['Lateral Izquierdo', 'Piso Inferior'],
    hardwareNeeded: ['2 Tornillos autorroscantes 4.0 x 50 mm (o taquetes con cola)'],
    toolsNeeded: ['Prensa de esquina 90°', 'Atornillador punta PZ2', 'Prensa rápida de barra'],
    workshopTip: '¡Atención!: Comprueba con la escuadra de precisión antes de dar el torque final de apriete para evitar descuadres en el mueble terminado.',
    diagramType: 'frame_start',
    completed: false
  });

  // STEP 3: Top Panel Installation (Techo Superior)
  steps.push({
    id: 'step_3',
    stepNumber: 3,
    title: 'Fijación de Techo Superior y Segundo Lateral (Casco Completo)',
    category: 'estructura',
    description: `Completa la estructura en "C" y cierra el armazón:
1. Une el Techo Superior al Lateral Izquierdo fijándolo con 2 tornillos 4.0 x 50 mm.
2. Presenta el Lateral Derecho sobre el conjunto alineando los cantos frontales y ranuras.
3. Atornilla el Lateral Derecho al Piso y Techo (4 tornillos 4.0 x 50 mm).`,
    piecesInvolved: ['Techo Superior', 'Lateral Derecho', 'Piso Inferior'],
    hardwareNeeded: ['6 Tornillos autorroscantes 4.0 x 50 mm'],
    toolsNeeded: ['Atornillador inalámbrico', 'Prensas de sargento (mínimo 2)', 'Mazo de goma'],
    workshopTip: 'Mantén las ranuras del fondo perfectamente alineadas en todo el perímetro interior del armazón.',
    diagramType: 'frame_complete',
    completed: false
  });

  // STEP 4: Back Panel MDF insertion & Squaring
  if (hasBack) {
    steps.push({
      id: 'step_4',
      stepNumber: 4,
      title: 'Inserción de Fondo MDF y Verificación de Escuadra Diagonal',
      category: 'fondo',
      description: `Cuadratura perfecta y rigidez estructural:
1. Desliza el panel de Fondo MDF 3mm por la ranura posterior hasta hacer tope en el piso.
2. MIDE LAS DOS DIAGONALES CON EL FLEXÓMETRO (Esquina A-D vs Esquina B-C). Deben medir exactamente los mismos milímetros.
3. Si hay diferencia de más de 1 mm, presiona la esquina más larga hasta igualar y fija el fondo con clavos de tope / grapas o tornillos traseros 3.5 x 16 mm.`,
      piecesInvolved: ['Fondo Respaldo (MDF 3mm/6mm)', 'Casco del Mueble'],
      hardwareNeeded: ['Clavos de tope con arandela o Tornillos traseros 3.5 x 16 mm (12 a 16 uds)'],
      toolsNeeded: ['Flexómetro de taller', 'Martillo de carpintero / Grapadora neumática'],
      workshopTip: '¡Regla de Oro!: El fondo clavado es el elemento que mantiene el mueble a 90° de por vida. ¡Nunca avances a las puertas sin igualar las dos diagonales!',
      diagramType: 'back_panel',
      completed: false
    });
  }

  // STEP 5: Shelves & Hardware fittings
  if (hasShelves) {
    steps.push({
      id: 'step_5',
      stepNumber: hasBack ? 5 : 4,
      title: 'Colocación de Soportes y Repisas Interiores',
      category: 'herrajes',
      description: `Instalación de divisiones y accesorios:
1. Introduce los pernos o soportes niquelados de 5 mm en los orificios pre-taladrados a la altura deseada.
2. Coloca las Repisas Interiores asegurando que el canto cubierto mire hacia el frente del mueble.
3. Verifica que la repisa asiente firme sin balanceo en los 4 apoyos.`,
      piecesInvolved: ['Repisas Interiores', 'Casco del Mueble'],
      hardwareNeeded: ['Soportes metálicos niquelados de 5mm (4 uds por repisa)'],
      toolsNeeded: ['Guía de profundidad', 'Nivel de burbuja'],
      workshopTip: 'Si la repisa entra muy justa, lija ligeramente los cantos no vistos (0.5 mm) para evitar raspar el interior de los laterales.',
      diagramType: 'fittings',
      completed: false
    });
  }

  // STEP 6: Doors & 35mm Cup Hinges
  if (hasDoors) {
    const stepNum = steps.length + 1;
    steps.push({
      id: `step_${stepNum}`,
      stepNumber: stepNum,
      title: 'Instalación de Bisagras Cazoleta 35mm y Montaje de Puertas',
      category: 'puertas',
      description: `Montaje de puertas y fijación a laterales:
1. Inserta las cazoletas de 35 mm en las puertas, alinea el brazo a 90° con la escuadra y atornilla con 2 tornillos 3.5 x 15 mm por bisagra.
2. Marca en los laterales la línea a 37 mm del borde frontal y fija las bases de las bisagras.
3. Engancha los brazos de las bisagras a las bases (sistema clip o tornillo).`,
      piecesInvolved: ['Puertas Frontales', 'Lateral Izquierdo / Derecho'],
      hardwareNeeded: ['Bisagras cazoleta 35mm (rectas/semicodo)', 'Tornillos para bisagra 3.5 x 15 mm'],
      toolsNeeded: ['Atornillador punta PH2 / PZ2', 'Escuadra pequeña'],
      workshopTip: 'Utiliza calzas de 2 mm de espesor bajo la puerta mientras atornillas las bases para dejar la luz inferior requerida.',
      diagramType: 'doors',
      completed: false
    });
  }

  // STEP FINAL: 3D Hinge Regulation, Leveling & Final Touch-up
  const finalStepNum = steps.length + 1;
  steps.push({
    id: `step_${finalStepNum}`,
    stepNumber: finalStepNum,
    title: 'Regulación 3D de Puertas, Nivelación y Limpieza Final',
    category: 'ajuste_final',
    description: `Ajuste fino de precisión de taller:
1. Tornillo de Regulación Lateral (A): Ajusta la luz entre puertas o el solape contra el lateral.
2. Tornillo de Regulación en Profundidad (B): Ajusta el plano de la puerta contra el armazón (luz de 1.5 mm).
3. Tornillo de Regulación en Altura (C): Nivelación superior de puertas.
4. Instala topes de silicona amortiguadores en las esquinas internas de las puertas y limpia restos de viruta con paño y limpiador suave.`,
    piecesInvolved: ['Mueble Completo', ...(hasDoors ? ['Puertas'] : [])],
    hardwareNeeded: ['Topes de silicona amortiguadores adhesivos (2 por puerta)', 'Tapas embellecedoras de tornillos'],
    toolsNeeded: ['Destornillador manual PZ2', 'Nivel de mano', 'Paño de microfibra'],
    workshopTip: 'Realiza el ajuste fino de bisagras con destornillador manual para no desgastar ni forzar la rosca de regulación.',
    diagramType: 'squaring',
    completed: false
  });

  return steps;
}

/**
 * Calculates full hardware bill of materials for this furniture piece
 */
export function generateHardwareList(
  category: FurnitureCategory,
  heightCm: number,
  widthCm: number,
  depthCm: number,
  thicknessMm: number,
  cuts: WoodCut[]
): HardwareItem[] {
  const hardware: HardwareItem[] = [];

  const doorCount = cuts.filter(c => c.category === 'puerta').reduce((sum, c) => sum + c.quantity, 0);
  const shelfCount = cuts.filter(c => c.category === 'repisa').reduce((sum, c) => sum + c.quantity, 0);
  const hasBack = cuts.some(c => c.category === 'fondo');

  // 1. Structure Screws
  const structureScrewQty = Math.max(12, Math.ceil((cuts.length * 2.5) / 4) * 4);
  hardware.push({
    id: 'hw_spax_50',
    name: 'Tornillos Estructurales Autorroscantes',
    specs: '4.0 × 50 mm (Punta PZ2 / Spax para madera/melamina)',
    quantity: structureScrewQty,
    category: 'tornilleria',
    notes: 'Para ensamble de laterales, piso y techo. Pretaladrar con 3mm.',
    checked: false
  });

  // 2. Hardware mounting screws
  const hwScrewQty = (doorCount * 4) + (hasBack ? 16 : 0) + 8;
  hardware.push({
    id: 'hw_spax_15',
    name: 'Tornillos de Fijación para Herrajes',
    specs: '3.5 × 15 mm o 3.5 × 16 mm (Cabeza gota de sebo / avellanada)',
    quantity: hwScrewQty,
    category: 'tornilleria',
    notes: 'Para fijar cazoletas de bisagra, bases y traseras.',
    checked: false
  });

  // 3. Hinges (if doors exist)
  if (doorCount > 0) {
    // 2 hinges per door up to 100cm height, 3 for 100-160cm, 4 for >160cm
    const hingesPerDoor = heightCm > 160 ? 4 : heightCm > 100 ? 3 : 2;
    const totalHinges = doorCount * hingesPerDoor;

    hardware.push({
      id: 'hw_hinge_35',
      name: 'Bisagras Bidimensionales Cazoleta 35mm',
      specs: 'Cazoleta Ø35mm con base clip (Recta para parche / solape)',
      quantity: totalHinges,
      category: 'bisagras',
      notes: `${hingesPerDoor} bisagras por puerta. Profundidad cazoleta 11.5mm.`,
      checked: false
    });

    hardware.push({
      id: 'hw_dampers',
      name: 'Topes de Silicona Amortiguadores',
      specs: 'Gotas transparentes autoadhesivas Ø8mm',
      quantity: doorCount * 2,
      category: 'fijaciones',
      notes: 'Colocar en esquina superior e inferior interna de puertas.',
      checked: false
    });

    hardware.push({
      id: 'hw_handles',
      name: 'Jaladeras / Tiradores de Mueble',
      specs: 'Tirador de perfil o barra metálica + Tornillos M4 × 22mm',
      quantity: doorCount,
      category: 'tiradores',
      notes: 'Instalar a 50mm del borde y altura ergonómica.',
      checked: false
    });
  }

  // 4. Shelf Supports (if shelves exist)
  if (shelfCount > 0) {
    hardware.push({
      id: 'hw_shelf_pins',
      name: 'Soportes / Pernos para Repisas',
      specs: 'Pernos niquelados con vástago de Ø5 mm',
      quantity: shelfCount * 4,
      category: 'soportes',
      notes: '4 soportes por cada repisa interior.',
      checked: false
    });
  }

  // 5. Back panel fasteners
  if (hasBack) {
    hardware.push({
      id: 'hw_back_nails',
      name: 'Clavos con Tope / Grapas de Fondo',
      specs: 'Clavos con arandela de plástico 1.5 × 20 mm',
      quantity: 20,
      category: 'fijaciones',
      notes: 'Para fijar y escuadrar el MDF de 3mm o 6mm en la trasera.',
      checked: false
    });
  }

  // 6. Screw Caps
  hardware.push({
    id: 'hw_screw_caps',
    name: 'Tapas Embellecedoras Adhesivas para Tornillo',
    specs: `Ø12mm color coincidente con melamina (${thicknessMm}mm)`,
    quantity: structureScrewQty,
    category: 'fijaciones',
    notes: 'Ocultar las cabezas de tornillo avellanadas en caras exteriores.',
    checked: false
  });

  return hardware;
}

/**
 * Generates workbench intake piece checklist
 */
export function generateVerificationPieces(cuts: WoodCut[], furnitureName: string): PieceVerificationStatus[] {
  const list: PieceVerificationStatus[] = [];

  cuts.forEach(c => {
    for (let i = 1; i <= c.quantity; i++) {
      const isMulti = c.quantity > 1;
      list.push({
        pieceId: `${c.id}_item_${i}`,
        name: isMulti ? `${c.name} (#${i})` : c.name,
        furnitureName: c.furnitureName || furnitureName,
        dimensions: `${c.lengthCm} × ${c.widthCm} cm`,
        dimensionVerified: c.completed || false,
        edgeBandingVerified: false,
        squareVerified: false,
        machiningDone: false,
        notes: c.notes
      });
    }
  });

  return list;
}
