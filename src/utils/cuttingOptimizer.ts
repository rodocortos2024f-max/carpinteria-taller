import { 
  WoodCut, 
  CuttingConfig, 
  OptimizationResult, 
  OptimizedBoard, 
  PlacedPiece, 
  GeneratedOffcut, 
  CuttingStep, 
  StripCuttingStep, 
  IndividualPieceCut,
  FenceGroupedStep
} from '../types';

interface FlatPiece {
  originalId: string;
  name: string;
  furnitureName?: string;
  lengthCm: number;
  widthCm: number;
  category: string;
  edges?: WoodCut['edges'];
  pieceIndex: number;
  overrideRotated?: boolean;
}

export function optimizeCuttingLayout(
  cuts: WoodCut[],
  config: CuttingConfig
): OptimizationResult {
  const {
    primaryCutDirection,
    sheetLengthCm = 244,
    sheetWidthCm = 122,
    sawKerfMm = 3,
    allowRotation = true,
    trimMarginCm = 0
  } = config;

  const kerfCm = sawKerfMm / 10;
  const usableLength = sheetLengthCm - (trimMarginCm * 2);
  const usableWidth = sheetWidthCm - (trimMarginCm * 2);

  // 1. Flatten all cuts according to their quantities
  const flatPieces: FlatPiece[] = [];
  cuts.forEach(cut => {
    for (let i = 0; i < cut.quantity; i++) {
      flatPieces.push({
        originalId: cut.id,
        name: cut.name,
        furnitureName: cut.furnitureName || 'Mueble',
        lengthCm: cut.lengthCm,
        widthCm: cut.widthCm,
        category: cut.category,
        edges: cut.edges,
        pieceIndex: i + 1
      });
    }
  });

  // Total pieces to place
  const totalPieces = flatPieces.length;

  if (totalPieces === 0) {
    return {
      boards: [],
      totalSheets: 0,
      totalPieces: 0,
      totalPlacedPieces: 0,
      totalUsedAreaSqM: 0,
      totalSheetAreaSqM: 0,
      overallEfficiencyPercent: 0,
      overallWastePercent: 0,
      totalLinearCutMeters: 0,
      unplacedPieces: [],
      usableOffcuts: [],
      masterStripSteps: [],
      fenceGroupedSteps: []
    };
  }

  // Workshop color palette for distinct visual separation
  const pieceColors = [
    '#fef3c7', '#dbeafe', '#dcfce7', '#fce7f3', '#ede9fe',
    '#ffedd5', '#e0f2fe', '#f1f5f9', '#fae8ff', '#fef9c3',
    '#cffafe', '#fee2e2', '#e0e7ff', '#ecfdf5', '#fef08a'
  ];

  // 2. Sort pieces using guillotine strip heuristic
  const remainingPieces = [...flatPieces].sort((a, b) => {
    if (primaryCutDirection === 'largo') {
      const maxDimA = Math.max(a.lengthCm, a.widthCm);
      const maxDimB = Math.max(b.lengthCm, b.widthCm);
      const minDimA = Math.min(a.lengthCm, a.widthCm);
      const minDimB = Math.min(b.lengthCm, b.widthCm);
      if (allowRotation) {
        return (maxDimB * minDimB) - (maxDimA * minDimA);
      }
      return (b.widthCm - a.widthCm) || (b.lengthCm - a.lengthCm);
    } else {
      const maxDimA = Math.max(a.lengthCm, a.widthCm);
      const maxDimB = Math.max(b.lengthCm, b.widthCm);
      if (allowRotation) {
        return (b.lengthCm * b.widthCm) - (a.lengthCm * a.widthCm);
      }
      return (b.lengthCm - a.lengthCm) || (b.widthCm - a.widthCm);
    }
  });

  const boards: OptimizedBoard[] = [];
  const unplacedFlat: FlatPiece[] = [];
  let totalLinearCutCm = 0;
  let globalStepCounter = 1;

  // Multi-board packing loop
  while (remainingPieces.length > 0) {
    const boardIndex = boards.length + 1;
    const placedOnBoard: PlacedPiece[] = [];
    const boardLegacySteps: CuttingStep[] = [];
    const boardStripSteps: StripCuttingStep[] = [];
    let stripCounterOnBoard = 1;

    if (trimMarginCm > 0) {
      boardLegacySteps.push({
        stepNumber: globalStepCounter,
        boardIndex,
        type: 'trim',
        title: 'Saneado / Refilado de Bordes',
        description: `Refilar ${trimMarginCm} cm en el contorno del Tablero #${boardIndex} para asegurar escuadra perfecta.`,
        measureCm: trimMarginCm,
        completed: false,
        boardIndexes: [boardIndex]
      });
      totalLinearCutCm += (sheetLengthCm * 2) + (sheetWidthCm * 2);
    }

    if (primaryCutDirection === 'largo') {
      // Primary cuts parallel to sheetLength (X-axis = Largo, Y-axis = Ancho)
      let currentY = trimMarginCm;

      while (currentY < usableWidth + trimMarginCm && remainingPieces.length > 0) {
        let stripPieceIdx = -1;
        let bestStripPiece: FlatPiece | null = null;
        let bestRotated = false;
        let stripWidth = 0;

        for (let i = 0; i < remainingPieces.length; i++) {
          const p = remainingPieces[i];
          if (p.widthCm <= (usableWidth + trimMarginCm - currentY) && p.lengthCm <= usableLength) {
            stripPieceIdx = i;
            bestStripPiece = p;
            bestRotated = false;
            stripWidth = p.widthCm;
            break;
          }
          if (allowRotation && p.lengthCm <= (usableWidth + trimMarginCm - currentY) && p.widthCm <= usableLength) {
            stripPieceIdx = i;
            bestStripPiece = p;
            bestRotated = true;
            stripWidth = p.lengthCm;
            break;
          }
        }

        if (!bestStripPiece || stripPieceIdx === -1) {
          break;
        }

        remainingPieces.splice(stripPieceIdx, 1);

        const stripY = currentY;
        let currentX = trimMarginCm;
        const currentStripId = `strip_${boardIndex}_${stripCounterOnBoard}`;

        const pieceLengthOnStrip = bestRotated ? bestStripPiece.widthCm : bestStripPiece.lengthCm;
        const pieceWidthOnStrip = bestRotated ? bestStripPiece.lengthCm : bestStripPiece.widthCm;
        const pieceId1 = `placed_${boardIndex}_${placedOnBoard.length + 1}`;

        const stripPieces: PlacedPiece[] = [];

        const firstPiece: PlacedPiece = {
          id: pieceId1,
          pieceId: bestStripPiece.originalId,
          name: bestStripPiece.name,
          furnitureName: bestStripPiece.furnitureName,
          x: Number(currentX.toFixed(1)),
          y: Number(stripY.toFixed(1)),
          lengthCm: Number(pieceLengthOnStrip.toFixed(1)),
          widthCm: Number(pieceWidthOnStrip.toFixed(1)),
          originalLength: bestStripPiece.lengthCm,
          originalWidth: bestStripPiece.widthCm,
          rotated: bestRotated,
          category: bestStripPiece.category,
          edges: bestStripPiece.edges,
          color: pieceColors[(placedOnBoard.length) % pieceColors.length],
          boardIndex,
          stripId: currentStripId
        };

        placedOnBoard.push(firstPiece);
        stripPieces.push(firstPiece);
        currentX += pieceLengthOnStrip + kerfCm;

        // Search more pieces in this horizontal strip
        let searchMore = true;
        while (searchMore && currentX < usableLength + trimMarginCm) {
          let nextFitIdx = -1;
          let nextRotated = false;

          for (let i = 0; i < remainingPieces.length; i++) {
            const p = remainingPieces[i];
            if (p.widthCm <= stripWidth && p.lengthCm <= (usableLength + trimMarginCm - currentX)) {
              nextFitIdx = i;
              nextRotated = false;
              break;
            }
            if (allowRotation && p.lengthCm <= stripWidth && p.widthCm <= (usableLength + trimMarginCm - currentX)) {
              nextFitIdx = i;
              nextRotated = true;
              break;
            }
          }

          if (nextFitIdx !== -1) {
            const nextPiece = remainingPieces.splice(nextFitIdx, 1)[0];
            const pLen = nextRotated ? nextPiece.widthCm : nextPiece.lengthCm;
            const pWid = nextRotated ? nextPiece.lengthCm : nextPiece.widthCm;
            const nextPieceId = `placed_${boardIndex}_${placedOnBoard.length + 1}`;

            const addedPiece: PlacedPiece = {
              id: nextPieceId,
              pieceId: nextPiece.originalId,
              name: nextPiece.name,
              furnitureName: nextPiece.furnitureName,
              x: Number(currentX.toFixed(1)),
              y: Number(stripY.toFixed(1)),
              lengthCm: Number(pLen.toFixed(1)),
              widthCm: Number(pWid.toFixed(1)),
              originalLength: nextPiece.lengthCm,
              originalWidth: nextPiece.widthCm,
              rotated: nextRotated,
              category: nextPiece.category,
              edges: nextPiece.edges,
              color: pieceColors[(placedOnBoard.length) % pieceColors.length],
              boardIndex,
              stripId: currentStripId
            };

            placedOnBoard.push(addedPiece);
            stripPieces.push(addedPiece);
            currentX += pLen + kerfCm;
          } else {
            searchMore = false;
          }
        }

        totalLinearCutCm += sheetLengthCm;
        totalLinearCutCm += stripPieces.length * stripWidth;

        const thisStripIndex = stripCounterOnBoard++;
        const pencilMark = `T-${thisStripIndex}`;

        // Build 2-Phase Strip Step
        const individualCuts: IndividualPieceCut[] = stripPieces.map(sp => ({
          placedPieceId: sp.id,
          name: sp.name,
          furnitureName: sp.furnitureName,
          cutMeasureCm: sp.lengthCm,
          lengthCm: sp.lengthCm,
          widthCm: sp.widthCm,
          originalLength: sp.originalLength,
          originalWidth: sp.originalWidth,
          rotated: sp.rotated,
          edges: sp.edges,
          boardIndex,
          stripId: currentStripId,
          pencilMark
        }));

        boardStripSteps.push({
          stepNumber: globalStepCounter++,
          stripId: currentStripId,
          pencilMark,
          boardIndex,
          stripIndex: thisStripIndex,
          direction: 'largo',
          fenceMeasureCm: stripWidth,
          stripLengthCm: sheetLengthCm,
          stripWidthCm: stripWidth,
          phaseATitle: `Ajusta la regla a ${stripWidth} cm`,
          phaseADescription: `Pasa el Tablero #${boardIndex} a lo largo (${sheetLengthCm} cm) para sacar 1 TIRA COMPLETA (${sheetLengthCm} × ${stripWidth} cm).`,
          phaseBTitle: `Cortes a lo ancho sobre la Tira ${pencilMark}`,
          phaseBDescription: `De la tira ${pencilMark} (${stripWidth} cm) recién cortada, haz los siguientes cortes transversales a lo ancho para obtener las piezas finales:`,
          individualCuts,
          targetPieceIds: stripPieces.map(sp => sp.id)
        });

        currentY += stripWidth + kerfCm;
      }

    } else {
      // Primary cuts parallel to sheetWidth (122 cm)
      let currentX = trimMarginCm;

      while (currentX < usableLength + trimMarginCm && remainingPieces.length > 0) {
        let stripPieceIdx = -1;
        let bestStripPiece: FlatPiece | null = null;
        let bestRotated = false;
        let stripLength = 0;

        for (let i = 0; i < remainingPieces.length; i++) {
          const p = remainingPieces[i];
          if (p.lengthCm <= (usableLength + trimMarginCm - currentX) && p.widthCm <= usableWidth) {
            stripPieceIdx = i;
            bestStripPiece = p;
            bestRotated = false;
            stripLength = p.lengthCm;
            break;
          }
          if (allowRotation && p.widthCm <= (usableLength + trimMarginCm - currentX) && p.lengthCm <= usableWidth) {
            stripPieceIdx = i;
            bestStripPiece = p;
            bestRotated = true;
            stripLength = p.widthCm;
            break;
          }
        }

        if (!bestStripPiece || stripPieceIdx === -1) {
          break;
        }

        remainingPieces.splice(stripPieceIdx, 1);

        const stripX = currentX;
        let currentY = trimMarginCm;
        const currentStripId = `strip_${boardIndex}_${stripCounterOnBoard}`;

        const pieceLengthOnStrip = bestRotated ? bestStripPiece.widthCm : bestStripPiece.lengthCm;
        const pieceWidthOnStrip = bestRotated ? bestStripPiece.lengthCm : bestStripPiece.widthCm;
        const pieceId1 = `placed_${boardIndex}_${placedOnBoard.length + 1}`;

        const stripPieces: PlacedPiece[] = [];

        const firstPiece: PlacedPiece = {
          id: pieceId1,
          pieceId: bestStripPiece.originalId,
          name: bestStripPiece.name,
          furnitureName: bestStripPiece.furnitureName,
          x: Number(stripX.toFixed(1)),
          y: Number(currentY.toFixed(1)),
          lengthCm: Number(pieceLengthOnStrip.toFixed(1)),
          widthCm: Number(pieceWidthOnStrip.toFixed(1)),
          originalLength: bestStripPiece.lengthCm,
          originalWidth: bestStripPiece.widthCm,
          rotated: bestRotated,
          category: bestStripPiece.category,
          edges: bestStripPiece.edges,
          color: pieceColors[(placedOnBoard.length) % pieceColors.length],
          boardIndex,
          stripId: currentStripId
        };

        placedOnBoard.push(firstPiece);
        stripPieces.push(firstPiece);
        currentY += pieceWidthOnStrip + kerfCm;

        // Try to fit more in the same cross-strip
        let searchMore = true;
        while (searchMore && currentY < usableWidth + trimMarginCm) {
          let nextFitIdx = -1;
          let nextRotated = false;

          for (let i = 0; i < remainingPieces.length; i++) {
            const p = remainingPieces[i];
            if (p.lengthCm <= stripLength && p.widthCm <= (usableWidth + trimMarginCm - currentY)) {
              nextFitIdx = i;
              nextRotated = false;
              break;
            }
            if (allowRotation && p.widthCm <= stripLength && p.lengthCm <= (usableWidth + trimMarginCm - currentY)) {
              nextFitIdx = i;
              nextRotated = true;
              break;
            }
          }

          if (nextFitIdx !== -1) {
            const nextPiece = remainingPieces.splice(nextFitIdx, 1)[0];
            const pLen = nextRotated ? nextPiece.widthCm : nextPiece.lengthCm;
            const pWid = nextRotated ? nextPiece.lengthCm : nextPiece.widthCm;
            const nextPieceId = `placed_${boardIndex}_${placedOnBoard.length + 1}`;

            const addedPiece: PlacedPiece = {
              id: nextPieceId,
              pieceId: nextPiece.originalId,
              name: nextPiece.name,
              furnitureName: nextPiece.furnitureName,
              x: Number(stripX.toFixed(1)),
              y: Number(currentY.toFixed(1)),
              lengthCm: Number(pLen.toFixed(1)),
              widthCm: Number(pWid.toFixed(1)),
              originalLength: nextPiece.lengthCm,
              originalWidth: nextPiece.widthCm,
              rotated: nextRotated,
              category: nextPiece.category,
              edges: nextPiece.edges,
              color: pieceColors[(placedOnBoard.length) % pieceColors.length],
              boardIndex,
              stripId: currentStripId
            };

            placedOnBoard.push(addedPiece);
            stripPieces.push(addedPiece);
            currentY += pWid + kerfCm;
          } else {
            searchMore = false;
          }
        }

        totalLinearCutCm += sheetWidthCm;
        totalLinearCutCm += stripPieces.length * stripLength;

        const thisStripIndex = stripCounterOnBoard++;
        const pencilMark = `T-${thisStripIndex}`;

        // Build 2-Phase Strip Step
        const individualCuts: IndividualPieceCut[] = stripPieces.map(sp => ({
          placedPieceId: sp.id,
          name: sp.name,
          furnitureName: sp.furnitureName,
          cutMeasureCm: sp.widthCm,
          lengthCm: sp.lengthCm,
          widthCm: sp.widthCm,
          originalLength: sp.originalLength,
          originalWidth: sp.originalWidth,
          rotated: sp.rotated,
          edges: sp.edges,
          boardIndex,
          stripId: currentStripId,
          pencilMark
        }));

        boardStripSteps.push({
          stepNumber: globalStepCounter++,
          stripId: currentStripId,
          pencilMark,
          boardIndex,
          stripIndex: thisStripIndex,
          direction: 'ancho',
          fenceMeasureCm: stripLength,
          stripLengthCm: stripLength,
          stripWidthCm: sheetWidthCm,
          phaseATitle: `Ajusta el tope/regla a ${stripLength} cm`,
          phaseADescription: `Pasa el Tablero #${boardIndex} a lo ancho (${sheetWidthCm} cm) para sacar 1 BLOQUE COMPLETO (${stripLength} × ${sheetWidthCm} cm).`,
          phaseBTitle: `Cortes secundarios sobre la Tira/Bloque ${pencilMark}`,
          phaseBDescription: `Del bloque ${pencilMark} (${stripLength} cm) recién cortado, haz los siguientes cortes a lo largo para obtener las piezas finales:`,
          individualCuts,
          targetPieceIds: stripPieces.map(sp => sp.id)
        });

        currentX += stripLength + kerfCm;
      }
    }

    // Calculate Board Areas
    const totalAreaSqCm = sheetLengthCm * sheetWidthCm;
    const usedAreaSqCm = placedOnBoard.reduce((acc, p) => acc + (p.lengthCm * p.widthCm), 0);
    const efficiencyPercent = totalAreaSqCm > 0 ? Number(((usedAreaSqCm / totalAreaSqCm) * 100).toFixed(1)) : 0;
    const wastePercent = Number((100 - efficiencyPercent).toFixed(1));

    // Identify usable generated offcuts (e.g. area >= 30x30 cm)
    const boardOffcuts: GeneratedOffcut[] = [];
    if (placedOnBoard.length > 0) {
      const maxX = Math.max(...placedOnBoard.map(p => p.x + p.lengthCm));
      const maxY = Math.max(...placedOnBoard.map(p => p.y + p.widthCm));

      const remLength = sheetLengthCm - maxX;
      const remWidth = sheetWidthCm - maxY;

      if (remLength >= 25 && sheetWidthCm >= 20) {
        boardOffcuts.push({
          id: `offcut_${boardIndex}_1`,
          x: Number(maxX.toFixed(1)),
          y: 0,
          lengthCm: Number(remLength.toFixed(1)),
          widthCm: sheetWidthCm,
          isUsable: remLength >= 30
        });
      }

      if (remWidth >= 25 && maxX >= 20) {
        boardOffcuts.push({
          id: `offcut_${boardIndex}_2`,
          x: 0,
          y: Number(maxY.toFixed(1)),
          lengthCm: Number(maxX.toFixed(1)),
          widthCm: Number(remWidth.toFixed(1)),
          isUsable: remWidth >= 30
        });
      }
    }

    if (placedOnBoard.length > 0) {
      boards.push({
        boardIndex,
        sheetLengthCm,
        sheetWidthCm,
        placedPieces: placedOnBoard,
        usedAreaSqCm,
        totalAreaSqCm,
        efficiencyPercent,
        wastePercent,
        offcuts: boardOffcuts,
        cuttingSteps: boardLegacySteps,
        stripSteps: boardStripSteps
      });
    } else {
      if (remainingPieces.length > 0) {
        unplacedFlat.push(...remainingPieces);
        break;
      }
    }
  }

  // Calculate totals
  const totalSheets = boards.length;
  const totalPlacedPieces = boards.reduce((acc, b) => acc + b.placedPieces.length, 0);
  const totalSheetAreaSqM = Number(((totalSheets * sheetLengthCm * sheetWidthCm) / 10000).toFixed(2));
  const totalUsedAreaSqM = Number((boards.reduce((acc, b) => acc + b.usedAreaSqCm, 0) / 10000).toFixed(2));
  const overallEfficiencyPercent = totalSheetAreaSqM > 0 
    ? Number(((totalUsedAreaSqM / totalSheetAreaSqM) * 100).toFixed(1)) 
    : 0;
  const overallWastePercent = Number((100 - overallEfficiencyPercent).toFixed(1));
  const totalLinearCutMeters = Number((totalLinearCutCm / 100).toFixed(2));

  // Collect usable offcuts
  const allUsableOffcuts = boards.flatMap(b => b.offcuts.filter(o => o.isUsable));

  // Master Strip Steps
  const masterStripSteps = boards.flatMap(b => b.stripSteps);

  // Group masterStripSteps by fence measure (Medida de Regla Unificada)
  // Preserving order of appearance of fence measures
  const fenceMap = new Map<string, FenceGroupedStep>();
  masterStripSteps.forEach(strip => {
    const key = `${strip.direction}_${strip.fenceMeasureCm}`;
    if (!fenceMap.has(key)) {
      fenceMap.set(key, {
        fenceMeasureCm: strip.fenceMeasureCm,
        direction: strip.direction,
        totalStrips: 0,
        boardIndexes: [],
        strips: []
      });
    }
    const group = fenceMap.get(key)!;
    group.totalStrips += 1;
    if (!group.boardIndexes.includes(strip.boardIndex)) {
      group.boardIndexes.push(strip.boardIndex);
    }
    group.strips.push(strip);
  });
  const fenceGroupedSteps = Array.from(fenceMap.values());

  // Map unplaced
  const unplacedOriginals: WoodCut[] = [];
  unplacedFlat.forEach(f => {
    const orig = cuts.find(c => c.id === f.originalId);
    if (orig && !unplacedOriginals.some(u => u.id === orig.id)) {
      unplacedOriginals.push(orig);
    }
  });

  return {
    boards,
    totalSheets,
    totalPieces,
    totalPlacedPieces,
    totalUsedAreaSqM,
    totalSheetAreaSqM,
    overallEfficiencyPercent,
    overallWastePercent,
    totalLinearCutMeters,
    unplacedPieces: unplacedOriginals,
    usableOffcuts: allUsableOffcuts,
    masterStripSteps,
    fenceGroupedSteps
  };
}

/**
 * Builds Master Fence (Regla de Sierra) grouped steps across boards.
 */
export function buildMasterFenceSequence(boards: OptimizedBoard[]): CuttingStep[] {
  const rawSteps = boards.flatMap(b => b.cuttingSteps);
  return rawSteps;
}
