import React from 'react';
import { WoodCut, EdgeBanding } from '../types';
import { Check } from 'lucide-react';

interface EdgeBandingVisualProps {
  cut: WoodCut;
  onToggleEdge: (cutId: string, edge: 'top' | 'bottom' | 'left' | 'right') => void;
}

export const EdgeBandingVisual: React.FC<EdgeBandingVisualProps> = ({
  cut,
  onToggleEdge
}) => {
  const edges: EdgeBanding = cut.edges || {};

  const isTopActive = !!edges.top;
  const isBottomActive = !!edges.bottom;
  const isLeftActive = !!edges.left;
  const isRightActive = !!edges.right;

  return (
    <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-slate-200">
      <span className="text-xs font-black text-amber-950 uppercase tracking-wider shrink-0 mr-1">
        Cubrecanto:
      </span>
      <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
        {/* SUPERIOR (Largo - Color Azul) */}
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onToggleEdge(cut.id, 'top');
          }}
          className={`py-1.5 px-3 rounded-lg text-xs font-black transition cursor-pointer flex items-center gap-1 border-2 ${
            isTopActive
              ? 'bg-emerald-600 hover:bg-emerald-700 text-white border-emerald-800 shadow-sm'
              : 'bg-white hover:bg-blue-50 text-blue-600 border-blue-300'
          }`}
        >
          {isTopActive && <Check className="w-3.5 h-3.5" />}
          Superior
        </button>

        {/* INFERIOR (Largo - Color Azul) */}
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onToggleEdge(cut.id, 'bottom');
          }}
          className={`py-1.5 px-3 rounded-lg text-xs font-black transition cursor-pointer flex items-center gap-1 border-2 ${
            isBottomActive
              ? 'bg-emerald-600 hover:bg-emerald-700 text-white border-emerald-800 shadow-sm'
              : 'bg-white hover:bg-blue-50 text-blue-600 border-blue-300'
          }`}
        >
          {isBottomActive && <Check className="w-3.5 h-3.5" />}
          Inferior
        </button>

        {/* IZQ (Ancho - Color Naranja) */}
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onToggleEdge(cut.id, 'left');
          }}
          className={`py-1.5 px-3 rounded-lg text-xs font-black transition cursor-pointer flex items-center gap-1 border-2 ${
            isLeftActive
              ? 'bg-emerald-600 hover:bg-emerald-700 text-white border-emerald-800 shadow-sm'
              : 'bg-white hover:bg-orange-50 text-orange-600 border-orange-300'
          }`}
        >
          {isLeftActive && <Check className="w-3.5 h-3.5" />}
          Izq
        </button>

        {/* DER (Ancho - Color Naranja) */}
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onToggleEdge(cut.id, 'right');
          }}
          className={`py-1.5 px-3 rounded-lg text-xs font-black transition cursor-pointer flex items-center gap-1 border-2 ${
            isRightActive
              ? 'bg-emerald-600 hover:bg-emerald-700 text-white border-emerald-800 shadow-sm'
              : 'bg-white hover:bg-orange-50 text-orange-600 border-orange-300'
          }`}
        >
          {isRightActive && <Check className="w-3.5 h-3.5" />}
          Der
        </button>
      </div>
    </div>
  );
};
