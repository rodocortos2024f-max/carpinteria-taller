import React from 'react';
import { getBoardMaterialTags, MaterialTagOption, getStoredMaterialsCatalog } from '../utils/materialsCatalog';
import { Tag, Sparkles } from 'lucide-react';

interface MaterialTagSelectorProps {
  selectedMaterial: string;
  selectedThickness?: number;
  onSelectMaterial: (materialName: string, thicknessMm: number) => void;
  label?: string;
  sublabel?: string;
  compact?: boolean;
  showAllOption?: boolean;
  onSelectAll?: () => void;
  isAllSelected?: boolean;
}

export const MaterialTagSelector: React.FC<MaterialTagSelectorProps> = ({
  selectedMaterial,
  selectedThickness,
  onSelectMaterial,
  label = 'Etiquetas Oficiales de Material (Catálogo Base):',
  sublabel = 'Seleccione una etiqueta para sincronizar tipo de madera y espesor exacto',
  compact = false,
  showAllOption = false,
  onSelectAll,
  isAllSelected = false
}) => {
  const catalog = getStoredMaterialsCatalog();
  const tags = getBoardMaterialTags(catalog);

  return (
    <div className={`space-y-2 ${compact ? 'text-xs' : 'text-sm'}`}>
      {(label || sublabel) && (
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
          {label && (
            <label className="font-black text-slate-800 flex items-center gap-1.5 text-xs uppercase tracking-wider">
              <Tag className="w-3.5 h-3.5 text-emerald-700" />
              <span>{label}</span>
            </label>
          )}
          {sublabel && (
            <span className="text-[11px] text-slate-500 font-semibold">
              {sublabel}
            </span>
          )}
        </div>
      )}

      {/* Badges / Chips list */}
      <div className="flex flex-wrap items-center gap-1.5">
        {showAllOption && onSelectAll && (
          <button
            type="button"
            onClick={onSelectAll}
            className={`px-3 py-1.5 rounded-xl text-xs font-black border transition-all flex items-center gap-1 cursor-pointer shadow-sm ${
              isAllSelected
                ? 'bg-slate-900 text-white border-slate-950 ring-2 ring-emerald-500'
                : 'bg-slate-100 text-slate-700 border-slate-300 hover:bg-slate-200'
            }`}
          >
            <span>📦</span>
            <span>Todos los materiales</span>
          </button>
        )}

        {tags.map((tag) => {
          // Check if this tag matches selectedMaterial and thickness
          const isSelected = !isAllSelected && (
            (selectedMaterial.toLowerCase().includes(tag.baseName.toLowerCase()) || 
             tag.name.toLowerCase().includes(selectedMaterial.toLowerCase()) ||
             selectedMaterial.toLowerCase() === tag.name.toLowerCase()) &&
            (selectedThickness === undefined || selectedThickness === tag.thicknessMm)
          );

          return (
            <button
              key={tag.id}
              type="button"
              onClick={() => onSelectMaterial(tag.baseName, tag.thicknessMm)}
              className={`px-2.5 py-1.5 rounded-xl text-xs font-black border transition-all flex items-center gap-1.5 cursor-pointer shadow-sm ${
                isSelected
                  ? 'bg-emerald-800 text-white border-emerald-950 ring-2 ring-emerald-400 shadow-md scale-105'
                  : `${tag.colorBadge} border`
              }`}
              title={`${tag.name} - ${tag.brand || 'Catálogo Oficial'} ($${tag.unitPrice}/hoja)`}
            >
              <span>{tag.icon}</span>
              <span>{tag.name}</span>
              {isSelected && (
                <span className="bg-emerald-400 text-emerald-950 text-[10px] px-1 py-0.2 rounded-full font-black ml-0.5">
                  ✓
                </span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
};
