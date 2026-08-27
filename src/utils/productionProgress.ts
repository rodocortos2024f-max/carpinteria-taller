/**
 * Production Progress Persistence Helper
 * Centralizes localStorage management for Module 2 (Cutting) and Module 3 (EdgeBanding & Assembly)
 */

export const CUTTING_PIECES_PROGRESS_KEY = 'carpinteria_cut_pieces_progress_v2';
export const CUTTING_STRIPS_PROGRESS_KEY = 'carpinteria_cut_strips_progress_v2';
export const CUTTING_OFFCUTS_PROGRESS_KEY = 'carpinteria_cut_offcuts_progress_v2';
export const ASSEMBLY_PROGRESS_KEY = 'carpinteria_assembly_progress_v2';
export const EDGEBANDING_PROGRESS_KEY = 'carpinteria_edgebanding_progress_v2';

export interface ProjectProductionProgress {
  projectId: string;
  projectName: string;
  totalPieces: number;
  cutPieces: number;
  cutPercent: number;
  totalEdgePieces: number;
  edgeBandedPieces: number;
  edgePercent: number;
  totalAssemblePieces: number;
  assembledPieces: number;
  assemblyPercent: number;
}

/**
 * Get cut pieces map for a project: { [placedPieceId or cutId]: boolean }
 */
export function getProjectCutPieces(projectId: string): Record<string, boolean> {
  if (!projectId || typeof window === 'undefined') return {};
  try {
    const raw = localStorage.getItem(CUTTING_PIECES_PROGRESS_KEY);
    if (!raw) return {};
    const map = JSON.parse(raw);
    return map[projectId] || {};
  } catch (e) {
    console.error('Error loading cut pieces progress:', e);
    return {};
  }
}

/**
 * Save cut pieces map for a project
 */
export function saveProjectCutPieces(projectId: string, pieceMap: Record<string, boolean>): void {
  if (!projectId || typeof window === 'undefined') return;
  try {
    const raw = localStorage.getItem(CUTTING_PIECES_PROGRESS_KEY);
    const map = raw ? JSON.parse(raw) : {};
    map[projectId] = pieceMap;
    localStorage.setItem(CUTTING_PIECES_PROGRESS_KEY, JSON.stringify(map));
    window.dispatchEvent(new CustomEvent('carpinteria_production_progress_change', { detail: { projectId } }));
  } catch (e) {
    console.error('Error saving cut pieces progress:', e);
  }
}

/**
 * Get cut strips map for a project
 */
export function getProjectCutStrips(projectId: string): Record<string, boolean> {
  if (!projectId || typeof window === 'undefined') return {};
  try {
    const raw = localStorage.getItem(CUTTING_STRIPS_PROGRESS_KEY);
    if (!raw) return {};
    const map = JSON.parse(raw);
    return map[projectId] || {};
  } catch (e) {
    return {};
  }
}

/**
 * Save cut strips map for a project
 */
export function saveProjectCutStrips(projectId: string, stripMap: Record<string, boolean>): void {
  if (!projectId || typeof window === 'undefined') return;
  try {
    const raw = localStorage.getItem(CUTTING_STRIPS_PROGRESS_KEY);
    const map = raw ? JSON.parse(raw) : {};
    map[projectId] = stripMap;
    localStorage.setItem(CUTTING_STRIPS_PROGRESS_KEY, JSON.stringify(map));
  } catch (e) {
    console.error('Error saving cut strips progress:', e);
  }
}

/**
 * Get cut offcuts map for a project
 */
export function getProjectCutOffcuts(projectId: string): Record<string, boolean> {
  if (!projectId || typeof window === 'undefined') return {};
  try {
    const raw = localStorage.getItem(CUTTING_OFFCUTS_PROGRESS_KEY);
    if (raw) {
      const map = JSON.parse(raw);
      if (map[projectId]) return map[projectId];
    }
    // Fallback for legacy key
    const legacy = localStorage.getItem(`carpinteria_cut_offcut_pieces_${projectId}`);
    return legacy ? JSON.parse(legacy) : {};
  } catch (e) {
    return {};
  }
}

/**
 * Save cut offcuts map for a project
 */
export function saveProjectCutOffcuts(projectId: string, offcutMap: Record<string, boolean>): void {
  if (!projectId || typeof window === 'undefined') return;
  try {
    const raw = localStorage.getItem(CUTTING_OFFCUTS_PROGRESS_KEY);
    const map = raw ? JSON.parse(raw) : {};
    map[projectId] = offcutMap;
    localStorage.setItem(CUTTING_OFFCUTS_PROGRESS_KEY, JSON.stringify(map));
    // Also save legacy key for backward compatibility
    localStorage.setItem(`carpinteria_cut_offcut_pieces_${projectId}`, JSON.stringify(offcutMap));
    window.dispatchEvent(new CustomEvent('carpinteria_production_progress_change', { detail: { projectId } }));
  } catch (e) {
    console.error('Error saving cut offcuts progress:', e);
  }
}

/**
 * Get edge banded pieces map for a project
 */
export function getProjectEdgeBanded(projectId: string): Record<string, boolean> {
  if (!projectId || typeof window === 'undefined') return {};
  try {
    const raw = localStorage.getItem(EDGEBANDING_PROGRESS_KEY);
    if (!raw) return {};
    const map = JSON.parse(raw);
    return map[projectId] || {};
  } catch (e) {
    return {};
  }
}

/**
 * Save edge banded pieces map for a project
 */
export function saveProjectEdgeBanded(projectId: string, edgeMap: Record<string, boolean>): void {
  if (!projectId || typeof window === 'undefined') return;
  try {
    const raw = localStorage.getItem(EDGEBANDING_PROGRESS_KEY);
    const map = raw ? JSON.parse(raw) : {};
    map[projectId] = edgeMap;
    localStorage.setItem(EDGEBANDING_PROGRESS_KEY, JSON.stringify(map));
    window.dispatchEvent(new CustomEvent('carpinteria_production_progress_change', { detail: { projectId } }));
  } catch (e) {
    console.error('Error saving edge banding progress:', e);
  }
}

/**
 * Get assembled pieces map for a project
 */
export function getProjectAssembled(projectId: string): Record<string, boolean> {
  if (!projectId || typeof window === 'undefined') return {};
  try {
    const raw = localStorage.getItem(ASSEMBLY_PROGRESS_KEY);
    if (!raw) return {};
    const map = JSON.parse(raw);
    return map[projectId] || {};
  } catch (e) {
    return {};
  }
}

/**
 * Save assembled pieces map for a project
 */
export function saveProjectAssembled(projectId: string, assembledMap: Record<string, boolean>): void {
  if (!projectId || typeof window === 'undefined') return;
  try {
    const raw = localStorage.getItem(ASSEMBLY_PROGRESS_KEY);
    const map = raw ? JSON.parse(raw) : {};
    map[projectId] = assembledMap;
    localStorage.setItem(ASSEMBLY_PROGRESS_KEY, JSON.stringify(map));
    window.dispatchEvent(new CustomEvent('carpinteria_production_progress_change', { detail: { projectId } }));
  } catch (e) {
    console.error('Error saving assembled progress:', e);
  }
}

/**
 * Get all projects assembled progress map
 */
export function getAllProjectsAssembled(): Record<string, Record<string, boolean>> {
  if (typeof window === 'undefined') return {};
  try {
    const raw = localStorage.getItem(ASSEMBLY_PROGRESS_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch (e) {
    return {};
  }
}

/**
 * Save all projects assembled progress map
 */
export function saveAllProjectsAssembled(map: Record<string, Record<string, boolean>>): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(ASSEMBLY_PROGRESS_KEY, JSON.stringify(map));
  } catch (e) {
    console.error('Error saving all projects assembled:', e);
  }
}

/**
 * Get all projects edge banded progress map
 */
export function getAllProjectsEdgeBanded(): Record<string, Record<string, boolean>> {
  if (typeof window === 'undefined') return {};
  try {
    const raw = localStorage.getItem(EDGEBANDING_PROGRESS_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch (e) {
    return {};
  }
}

/**
 * Save all projects edge banded progress map
 */
export function saveAllProjectsEdgeBanded(map: Record<string, Record<string, boolean>>): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(EDGEBANDING_PROGRESS_KEY, JSON.stringify(map));
  } catch (e) {
    console.error('Error saving all projects edge banded:', e);
  }
}

/**
 * Calculate comprehensive production stats for a project
 */
export function getProjectProductionStats(projectId: string, cuts: any[] = []) {
  const cutPiecesMap = getProjectCutPieces(projectId);
  const edgeMap = getProjectEdgeBanded(projectId);
  const assemblyMap = getProjectAssembled(projectId);

  const totalPieces = cuts.reduce((sum, c) => sum + (c.quantity || 1), 0);
  
  // Cut stats
  const cutCompleted = cuts.reduce((sum, c) => {
    return sum + (cutPiecesMap[c.id] || c.completed ? (c.quantity || 1) : 0);
  }, 0);
  const cutPercentage = totalPieces > 0 ? Math.round((cutCompleted / totalPieces) * 100) : 0;

  // Edgebanding stats (pieces that have edges)
  const edgeCuts = cuts.filter(c => {
    const e = c.edges;
    return !!(e && (e.top || e.bottom || e.left || e.right));
  });
  const totalEdgePieces = edgeCuts.reduce((sum, c) => sum + (c.quantity || 1), 0);
  const edgeCompleted = edgeCuts.reduce((sum, c) => {
    return sum + (edgeMap[c.id] ? (c.quantity || 1) : 0);
  }, 0);
  const edgePercentage = totalEdgePieces > 0 ? Math.round((edgeCompleted / totalEdgePieces) * 100) : 0;

  // Assembly stats
  const assemblyCompleted = cuts.reduce((sum, c) => {
    return sum + (assemblyMap[c.id] || c.completed ? (c.quantity || 1) : 0);
  }, 0);
  const assemblyPercentage = totalPieces > 0 ? Math.round((assemblyCompleted / totalPieces) * 100) : 0;

  return {
    cuts: {
      total: totalPieces,
      completed: cutCompleted,
      pending: Math.max(0, totalPieces - cutCompleted),
      percentage: cutPercentage
    },
    edgeBanding: {
      total: totalEdgePieces,
      completed: edgeCompleted,
      pending: Math.max(0, totalEdgePieces - edgeCompleted),
      percentage: edgePercentage
    },
    assembly: {
      total: totalPieces,
      completed: assemblyCompleted,
      pending: Math.max(0, totalPieces - assemblyCompleted),
      percentage: assemblyPercentage
    }
  };
}

/**
 * Reset all production progress for a project (Cuts, Offcuts, Edgebanding, Assembly)
 */
export function resetProjectProductionProgress(projectId: string): void {
  if (!projectId || typeof window === 'undefined') return;
  try {
    // 1. Reset cut pieces
    const rawCuts = localStorage.getItem(CUTTING_PIECES_PROGRESS_KEY);
    if (rawCuts) {
      const map = JSON.parse(rawCuts);
      delete map[projectId];
      localStorage.setItem(CUTTING_PIECES_PROGRESS_KEY, JSON.stringify(map));
    }

    // 2. Reset cut strips
    const rawStrips = localStorage.getItem(CUTTING_STRIPS_PROGRESS_KEY);
    if (rawStrips) {
      const map = JSON.parse(rawStrips);
      delete map[projectId];
      localStorage.setItem(CUTTING_STRIPS_PROGRESS_KEY, JSON.stringify(map));
    }

    // 3. Reset offcuts
    const rawOffcuts = localStorage.getItem(CUTTING_OFFCUTS_PROGRESS_KEY);
    if (rawOffcuts) {
      const map = JSON.parse(rawOffcuts);
      delete map[projectId];
      localStorage.setItem(CUTTING_OFFCUTS_PROGRESS_KEY, JSON.stringify(map));
    }
    localStorage.removeItem(`carpinteria_cut_offcut_pieces_${projectId}`);

    // 4. Reset edgebanding
    const rawEdge = localStorage.getItem(EDGEBANDING_PROGRESS_KEY);
    if (rawEdge) {
      const map = JSON.parse(rawEdge);
      delete map[projectId];
      localStorage.setItem(EDGEBANDING_PROGRESS_KEY, JSON.stringify(map));
    }

    // 5. Reset assembly
    const rawAssembly = localStorage.getItem(ASSEMBLY_PROGRESS_KEY);
    if (rawAssembly) {
      const map = JSON.parse(rawAssembly);
      delete map[projectId];
      localStorage.setItem(ASSEMBLY_PROGRESS_KEY, JSON.stringify(map));
    }

    window.dispatchEvent(new CustomEvent('carpinteria_production_progress_change', { detail: { projectId } }));
  } catch (e) {
    console.error('Error resetting production progress:', e);
  }
}
