import React, { useState, useEffect } from 'react';
import { OffcutItem } from '../types';
import { 
  getAvailableBoardMaterialNames, 
  getAvailableThicknesses, 
  registerNewMaterialInCatalog 
} from '../utils/materialsCatalog';
import { Package, Plus, Trash2, ArrowLeft, Search, MapPin, CheckCircle2, AlertTriangle, Sparkles, Filter } from 'lucide-react';

interface OffcutsViewProps {
  offcuts: OffcutItem[];
  onAddOffcut: (item: OffcutItem) => void;
  onUpdateOffcutStatus: (id: string, status: 'disponible' | 'reservado' | 'usado') => void;
  onDeleteOffcut: (id: string) => void;
  onBackToMenu: () => void;
}

export const OffcutsView: React.FC<OffcutsViewProps> = ({
  offcuts,
  onAddOffcut,
  onUpdateOffcutStatus,
  onDeleteOffcut,
  onBackToMenu
}) => {
  // Available materials & thicknesses dynamically loaded from Master Catalog
  const [availableMaterials, setAvailableMaterials] = useState<string[]>(() => getAvailableBoardMaterialNames());
  const [availableThicknesses, setAvailableThicknesses] = useState<number[]>(() => getAvailableThicknesses());

  // Form State
  const [materialType, setMaterialType] = useState(() => getAvailableBoardMaterialNames()[0] || 'Melamina Blanca');
  const [thicknessMm, setThicknessMm] = useState<number>(15);
  const [lengthCm, setLengthCm] = useState<number>(100);
  const [widthCm, setWidthCm] = useState<number>(40);
  const [location, setLocation] = useState('Estante A - Taller');
  const [notes, setNotes] = useState('Borde limpio sin despostillar');

  // Modal State for adding new custom material
  const [showAddMaterialModal, setShowAddMaterialModal] = useState(false);
  const [newMaterialInput, setNewMaterialInput] = useState('');

  // Search/Filter State
  const [searchTerm, setSearchTerm] = useState('');
  const [filterMaterial, setFilterMaterial] = useState('todos');

  // Synchronize with Master Catalog changes live
  useEffect(() => {
    const handleCatalogUpdate = () => {
      setAvailableMaterials(getAvailableBoardMaterialNames());
      setAvailableThicknesses(getAvailableThicknesses());
    };

    window.addEventListener('materialsCatalogChanged', handleCatalogUpdate);
    window.addEventListener('storage', handleCatalogUpdate);
    return () => {
      window.removeEventListener('materialsCatalogChanged', handleCatalogUpdate);
      window.removeEventListener('storage', handleCatalogUpdate);
    };
  }, []);

  const handleCreateOffcut = (e: React.FormEvent) => {
    e.preventDefault();
    const newItem: OffcutItem = {
      id: 'off_' + Math.random().toString(36).substring(2, 8),
      materialType,
      thicknessMm,
      lengthCm,
      widthCm,
      location,
      status: 'disponible',
      dateAdded: new Date().toISOString().split('T')[0],
      notes
    };
    onAddOffcut(newItem);
    setNotes('');
  };

  const handleSaveCustomMaterial = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = newMaterialInput.trim();
    if (!trimmed) return;

    // Register into Master Catalog automatically
    registerNewMaterialInCatalog(trimmed, thicknessMm || 15);
    
    if (!availableMaterials.includes(trimmed)) {
      setAvailableMaterials(prev => [...prev, trimmed]);
    }
    setMaterialType(trimmed);
    setNewMaterialInput('');
    setShowAddMaterialModal(false);
  };

  const filteredOffcuts = offcuts.filter(item => {
    const matchesSearch = item.materialType.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.location.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (item.notes && item.notes.toLowerCase().includes(searchTerm.toLowerCase()));
    
    const matchesMat = filterMaterial === 'todos' || item.materialType === filterMaterial;
    return matchesSearch && matchesMat;
  });

  return (
    <div className="max-w-7xl mx-auto p-4 sm:p-6 lg:p-8 space-y-8">
      
      {/* Navigation Header */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-white p-5 rounded-3xl border-4 border-emerald-800/20 shadow-lg">
        <button
          onClick={onBackToMenu}
          className="w-full sm:w-auto bg-slate-800 hover:bg-slate-900 text-white font-black text-lg px-6 py-3 rounded-2xl flex items-center justify-center gap-3 border-2 border-slate-700 transition cursor-pointer"
        >
          <ArrowLeft className="w-6 h-6 text-emerald-400" />
          VOLVER AL MENÚ
        </button>

        <div className="text-center sm:text-right">
          <h2 className="text-2xl sm:text-3xl font-black text-emerald-950 flex items-center justify-center sm:justify-end gap-2">
            <span>📦</span> REVISAR PEDACERÍA / RETAZOS
          </h2>
          <p className="text-sm sm:text-base font-bold text-slate-600">
            Inventario de trozos y sobrantes de madera aprovechables en el taller
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* FORM COLUMN: Register New Offcut */}
        <div className="lg:col-span-5 bg-white p-6 sm:p-8 rounded-3xl border-4 border-emerald-800/20 shadow-xl space-y-6">
          <div className="bg-emerald-900 text-white p-4 rounded-2xl border-2 border-emerald-600 text-center">
            <h3 className="text-2xl font-black flex items-center justify-center gap-2">
              <Plus className="w-7 h-7 text-emerald-300" />
              REGISTRAR NUEVO RETAZO
            </h3>
            <p className="text-xs text-emerald-200 font-bold uppercase mt-0.5">
              Guarde sobrantes útiles para no desperdiciar madera
            </p>
          </div>

          <form onSubmit={handleCreateOffcut} className="space-y-5">
            
            {/* Material */}
            <div>
              <label className="block text-lg font-black text-slate-900 mb-1">
                Tipo de Material:
              </label>
              <select
                value={materialType}
                onChange={(e) => {
                  if (e.target.value === '__ADD_NEW_MATERIAL__') {
                    setShowAddMaterialModal(true);
                  } else {
                    setMaterialType(e.target.value);
                  }
                }}
                className="w-full text-xl font-black p-3.5 rounded-xl border-3 border-slate-300 bg-emerald-50 text-emerald-950 cursor-pointer"
              >
                {availableMaterials.map((mat, idx) => (
                  <option key={`offcut-mat-opt-${mat}-${idx}`} value={mat}>{mat}</option>
                ))}
                <option value="__ADD_NEW_MATERIAL__" className="text-amber-900 font-black bg-amber-100">
                  ➕ Agregar nuevo material...
                </option>
              </select>
            </div>

            {/* Thickness */}
            <div>
              <label className="block text-lg font-black text-slate-900 mb-1">
                Espesor / Grosor (mm):
              </label>
              <select
                value={thicknessMm}
                onChange={(e) => setThicknessMm(Number(e.target.value))}
                className="w-full text-xl font-black p-3.5 rounded-xl border-3 border-slate-300 bg-white cursor-pointer"
              >
                {availableThicknesses.map((th, idx) => (
                  <option key={`offcut-th-opt-${th}-${idx}`} value={th}>{th} mm</option>
                ))}
              </select>
            </div>

            {/* Dimensions */}
            <div className="grid grid-cols-2 gap-4 bg-emerald-50/80 p-4 rounded-2xl border-2 border-emerald-200">
              <div>
                <label className="block text-base font-extrabold text-emerald-950 mb-1 text-center">
                  LARGO (cm)
                </label>
                <input
                  type="number"
                  step="0.5"
                  min="1"
                  value={lengthCm === 0 ? '' : lengthCm}
                  onChange={(e) => setLengthCm(e.target.value === '' ? 0 : Number(e.target.value))}
                  onFocus={(e) => e.target.select()}
                  onClick={(e) => (e.target as HTMLInputElement).select()}
                  required
                  className="w-full text-2xl font-black p-3 rounded-xl border-3 border-emerald-400 text-center bg-white text-slate-900 focus:border-emerald-600 outline-none"
                />
              </div>

              <div>
                <label className="block text-base font-extrabold text-emerald-950 mb-1 text-center">
                  ANCHO (cm)
                </label>
                <input
                  type="number"
                  step="0.5"
                  min="1"
                  value={widthCm === 0 ? '' : widthCm}
                  onChange={(e) => setWidthCm(e.target.value === '' ? 0 : Number(e.target.value))}
                  onFocus={(e) => e.target.select()}
                  onClick={(e) => (e.target as HTMLInputElement).select()}
                  required
                  className="w-full text-2xl font-black p-3 rounded-xl border-3 border-emerald-400 text-center bg-white text-slate-900 focus:border-emerald-600 outline-none"
                />
              </div>
            </div>

            {/* Location in workshop */}
            <div>
              <label className="block text-lg font-black text-slate-900 mb-1 flex items-center gap-2">
                <MapPin className="w-5 h-5 text-emerald-700" />
                Ubicación en Taller:
              </label>
              <input
                type="text"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder="Ej: Estante B, Detrás de la sierra..."
                required
                className="w-full text-lg font-extrabold p-3.5 rounded-xl border-3 border-slate-300 bg-slate-50"
              />
            </div>

            {/* Notes */}
            <div>
              <label className="block text-lg font-black text-slate-900 mb-1">
                Notas / Condición del canto:
              </label>
              <input
                type="text"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Detalles útiles"
                className="w-full text-base font-bold p-3 rounded-xl border-2 border-slate-300 bg-slate-50"
              />
            </div>

            {/* Save Button */}
            <button
              type="submit"
              className="w-full btn-giant bg-emerald-600 hover:bg-emerald-700 text-white border-2 border-emerald-950 shadow-xl py-5 text-2xl font-black rounded-2xl cursor-pointer"
            >
              <Package className="w-8 h-8 text-emerald-200" />
              GUARDAR RETAZO EN ALMACÉN
            </button>

          </form>
        </div>

        {/* LIST COLUMN: Inventory Grid & Filters */}
        <div className="lg:col-span-7 space-y-6">
          
          {/* Filter Bar */}
          <div className="bg-white p-5 rounded-3xl border-4 border-emerald-800/20 shadow-lg">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="relative w-full sm:w-1/2">
                <Search className="w-6 h-6 text-emerald-700 absolute left-4 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Buscar ubicación o nota..."
                  className="w-full text-lg font-bold pl-12 pr-4 py-3 rounded-xl border-3 border-slate-300 focus:border-emerald-600 bg-slate-50"
                />
              </div>

              <div className="w-full sm:w-1/2">
                <select
                  value={filterMaterial}
                  onChange={(e) => setFilterMaterial(e.target.value)}
                  className="w-full text-lg font-bold p-3 rounded-xl border-3 border-slate-300 bg-emerald-50 text-emerald-950 cursor-pointer"
                >
                  <option value="todos">📦 Todos los materiales</option>
                  {Array.from(new Set([...availableMaterials, ...offcuts.map(o => o.materialType)])).map((mat, idx) => (
                    <option key={`offcut-filter-mat-${mat}-${idx}`} value={mat}>{mat}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Offcuts List Grid */}
          <div className="space-y-4">
            {filteredOffcuts.length === 0 ? (
              <div className="bg-white p-12 text-center rounded-3xl border-4 border-slate-200 space-y-3">
                <p className="text-4xl">📦</p>
                <p className="text-2xl font-black text-slate-800">No se encontraron retazos en este filtro.</p>
                <p className="text-base text-slate-600 font-bold">Añada sobrantes desde el formulario de la izquierda.</p>
              </div>
            ) : (
              filteredOffcuts.map((item, itemIdx) => (
                <div
                  key={`offcut-card-${item.id}-${itemIdx}`}
                  className={`p-6 rounded-3xl border-4 shadow-lg transition flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6 ${
                    item.status === 'disponible'
                      ? 'bg-white border-emerald-400'
                      : item.status === 'reservado'
                      ? 'bg-amber-50 border-amber-400'
                      : 'bg-slate-100 border-slate-300 opacity-70'
                  }`}
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-3">
                      <span className={`text-xs font-black px-3 py-1 rounded-full uppercase tracking-wide ${
                        item.status === 'disponible'
                          ? 'bg-emerald-600 text-white'
                          : item.status === 'reservado'
                          ? 'bg-amber-600 text-white'
                          : 'bg-slate-600 text-white'
                      }`}>
                        {item.status.toUpperCase()}
                      </span>
                      <span className="text-sm font-extrabold text-slate-600">
                        Añadido: {item.dateAdded}
                      </span>
                    </div>

                    <h4 className="text-2xl font-black text-slate-950 mt-1">
                      {item.materialType} ({item.thicknessMm}mm)
                    </h4>

                    <p className="text-xl font-black text-emerald-900 bg-emerald-100 px-3 py-1 rounded-xl inline-block border border-emerald-300">
                      📏 DIMENSIÓN: {item.lengthCm} cm × {item.widthCm} cm
                    </p>

                    <p className="text-base font-bold text-slate-700 flex items-center gap-2 mt-1">
                      <MapPin className="w-5 h-5 text-emerald-700 shrink-0" />
                      Ubicación: <span className="font-black text-slate-900">{item.location}</span>
                    </p>

                    {item.notes && (
                      <p className="text-sm font-semibold text-slate-600 italic">
                        "{item.notes}"
                      </p>
                    )}
                  </div>

                  {/* Actions Bar */}
                  <div className="flex sm:flex-col items-center gap-3 w-full sm:w-auto border-t sm:border-t-0 pt-3 sm:pt-0 border-slate-200">
                    
                    <select
                      value={item.status}
                      onChange={(e) => onUpdateOffcutStatus(item.id, e.target.value as any)}
                      className="bg-slate-900 text-white font-black text-base px-4 py-2.5 rounded-xl border-2 border-slate-700 cursor-pointer"
                    >
                      <option value="disponible">🟢 DISPONIBLE</option>
                      <option value="reservado">🟡 RESERVADO</option>
                      <option value="usado">⚪ MARCAR USADO</option>
                    </select>

                    <button
                      onClick={() => onDeleteOffcut(item.id)}
                      className="p-2.5 text-rose-600 hover:bg-rose-100 rounded-xl border border-rose-200 font-bold"
                      title="Eliminar retazo"
                    >
                      <Trash2 className="w-6 h-6" />
                    </button>

                  </div>

                </div>
              ))
            )}
          </div>

        </div>

      </div>

      {/* Modal for Adding New Material from Offcuts View */}
      {showAddMaterialModal && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full border-4 border-emerald-800 shadow-2xl overflow-hidden p-6 space-y-6">
            <div className="bg-emerald-950 text-white p-4 -m-6 mb-2 border-b-4 border-emerald-600 flex items-center justify-between">
              <h3 className="text-xl font-black flex items-center gap-2">
                <Plus className="w-6 h-6 text-emerald-400" />
                AGREGAR NUEVO MATERIAL AL CATÁLOGO
              </h3>
              <button
                onClick={() => setShowAddMaterialModal(false)}
                className="bg-emerald-800 text-white font-black px-3 py-1.5 rounded-lg text-sm cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveCustomMaterial} className="space-y-4 pt-2">
              <div>
                <label className="block text-base font-black text-slate-900 mb-2">
                  Nombre del Nuevo Material:
                </label>
                <input
                  type="text"
                  placeholder="Ej. Triplay Caobilla 15mm"
                  value={newMaterialInput}
                  onChange={(e) => setNewMaterialInput(e.target.value)}
                  required
                  className="w-full text-xl font-black p-4 rounded-2xl border-2 border-slate-600 bg-white text-black focus:border-emerald-600 outline-none"
                />
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddMaterialModal(false)}
                  className="flex-1 bg-slate-200 hover:bg-slate-300 text-slate-800 font-extrabold py-3 rounded-xl border border-slate-400 cursor-pointer"
                >
                  CANCELAR
                </button>
                <button
                  type="submit"
                  className="flex-1 bg-emerald-700 hover:bg-emerald-800 text-white font-black py-3 rounded-xl border-2 border-emerald-950 shadow-lg cursor-pointer"
                >
                  GUARDAR Y REGISTRAR
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
