import React, { useState, useMemo } from 'react';
import { CatalogMaterialItem, BudgetItem, BudgetItemCategory } from '../types';
import { 
  Plus, 
  Search, 
  X, 
  Check, 
  BookOpen, 
  Sparkles, 
  Tag, 
  Layers, 
  ArrowRight,
  Database,
  CheckSquare,
  Square
} from 'lucide-react';

interface AddBudgetItemModalProps {
  isOpen?: boolean;
  onClose: () => void;
  catalog: CatalogMaterialItem[];
  currencySymbol: string;
  onAddItem: (item: BudgetItem, saveToCatalog?: CatalogMaterialItem) => void;
}

export const AddBudgetItemModal: React.FC<AddBudgetItemModalProps> = ({
  isOpen = true,
  onClose,
  catalog,
  currencySymbol,
  onAddItem
}) => {
  const [activeTab, setActiveTab] = useState<'catalog' | 'custom'>('catalog');
  
  // Tab Catálogo
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [selectedCategory, setSelectedCategory] = useState<string>('todos');
  const [selectedCatalogItem, setSelectedCatalogItem] = useState<CatalogMaterialItem | null>(null);
  const [catalogQuantity, setCatalogQuantity] = useState<number>(1);
  const [catalogCustomPrice, setCatalogCustomPrice] = useState<number>(0);

  // Tab Personalizado
  const [customName, setCustomName] = useState<string>('');
  const [customCategory, setCustomCategory] = useState<BudgetItemCategory>('herraje');
  const [customQuantity, setCustomQuantity] = useState<number>(1);
  const [customUnit, setCustomUnit] = useState<string>('unidades');
  const [customUnitPrice, setCustomUnitPrice] = useState<number>(100);
  const [customDescription, setCustomDescription] = useState<string>('');
  const [saveToMasterCatalog, setSaveToMasterCatalog] = useState<boolean>(true);

  // Al seleccionar un item del catalogo
  const handleSelectCatalogItem = (item: CatalogMaterialItem) => {
    setSelectedCatalogItem(item);
    setCatalogCustomPrice(item.unitPrice);
  };

  const categoriesList: { id: string; label: string; icon: string }[] = [
    { id: 'todos', label: 'Todos', icon: '📦' },
    { id: 'tablero', label: 'Tableros', icon: '🪵' },
    { id: 'cubrecanto', label: 'Cubrecantos', icon: '🏷️' },
    { id: 'corredera', label: 'Correderas', icon: '📏' },
    { id: 'bisagra', label: 'Bisagras', icon: '🚪' },
    { id: 'herraje', label: 'Herrajes', icon: '🔩' },
    { id: 'consumible', label: 'Consumibles', icon: '🧪' },
    { id: 'servicio', label: 'Servicios', icon: '🛠️' }
  ];

  const filteredCatalog = useMemo(() => {
    return catalog.filter(item => {
      const matchesSearch = item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (item.description && item.description.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (item.brand && item.brand.toLowerCase().includes(searchTerm.toLowerCase()));
      
      const matchesCat = selectedCategory === 'todos' || item.category === selectedCategory;
      return matchesSearch && matchesCat;
    });
  }, [catalog, searchTerm, selectedCategory]);

  if (isOpen === false) return null;

  // Añadir desde catálogo
  const handleAddFromCatalog = () => {
    if (!selectedCatalogItem) return;

    const qty = Math.max(0.1, Number(catalogQuantity) || 1);
    const unitPrice = Math.max(0, Number(catalogCustomPrice) || selectedCatalogItem.unitPrice);

    const newItem: BudgetItem = {
      id: `item_${Date.now()}`,
      category: selectedCatalogItem.category,
      name: selectedCatalogItem.name,
      description: selectedCatalogItem.description || (selectedCatalogItem.brand ? `Marca: ${selectedCatalogItem.brand}` : ''),
      quantity: qty,
      unit: selectedCatalogItem.unit,
      unitPrice: unitPrice,
      totalPrice: Math.round(qty * unitPrice),
      isAutoCalculated: false,
      included: true
    };

    onAddItem(newItem);
    onClose();
  };

  // Añadir personalizado
  const handleAddCustom = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customName.trim()) return;

    const qty = Math.max(0.1, Number(customQuantity) || 1);
    const price = Math.max(0, Number(customUnitPrice) || 0);

    const newItem: BudgetItem = {
      id: `custom_${Date.now()}`,
      category: customCategory,
      name: customName.trim(),
      description: customDescription.trim(),
      quantity: qty,
      unit: customUnit.trim() || 'unidades',
      unitPrice: price,
      totalPrice: Math.round(qty * price),
      isAutoCalculated: false,
      included: true
    };

    let catalogItemToSave: CatalogMaterialItem | undefined;
    if (saveToMasterCatalog) {
      catalogItemToSave = {
        id: `mat_custom_${Date.now()}`,
        name: customName.trim(),
        category: customCategory,
        unit: customUnit.trim() || 'unidades',
        unitPrice: price,
        description: customDescription.trim(),
        isDefault: false
      };
    }

    onAddItem(newItem, catalogItemToSave);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md z-50 flex items-center justify-center p-3 sm:p-5">
      <div className="bg-white rounded-3xl max-w-4xl w-full max-h-[90vh] overflow-hidden border-4 border-emerald-800 flex flex-col shadow-2xl animate-in fade-in zoom-in duration-200">
        
        {/* HEADER */}
        <div className="bg-emerald-950 text-white p-5 border-b-4 border-emerald-600 flex items-center justify-between gap-4 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-emerald-600 text-white rounded-xl flex items-center justify-center text-xl font-black shadow-md border border-emerald-400">
              ➕
            </div>
            <div>
              <h3 className="text-lg sm:text-xl font-black text-white tracking-tight">
                Agregar Insumo o Material al Presupuesto
              </h3>
              <p className="text-xs text-emerald-200 font-semibold">
                Selecciona del catálogo de precios del taller o escribe un concepto personalizado.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="bg-emerald-900 hover:bg-emerald-800 text-white font-bold p-2 rounded-xl border border-emerald-700 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* TABS DE SELECCIÓN */}
        <div className="flex border-b border-slate-200 bg-slate-100 p-2 gap-2 shrink-0">
          <button
            type="button"
            onClick={() => setActiveTab('catalog')}
            className={`flex-1 py-2.5 px-4 rounded-xl font-black text-xs sm:text-sm flex items-center justify-center gap-2 transition cursor-pointer ${
              activeTab === 'catalog'
                ? 'bg-emerald-800 text-white shadow-md'
                : 'text-slate-700 hover:bg-slate-200'
            }`}
          >
            <BookOpen className="w-4 h-4 text-emerald-300" />
            <span>⚡ Seleccionar del Catálogo Maestro ({catalog.length})</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('custom')}
            className={`flex-1 py-2.5 px-4 rounded-xl font-black text-xs sm:text-sm flex items-center justify-center gap-2 transition cursor-pointer ${
              activeTab === 'custom'
                ? 'bg-emerald-800 text-white shadow-md'
                : 'text-slate-700 hover:bg-slate-200'
            }`}
          >
            <Plus className="w-4 h-4 text-emerald-300" />
            <span>✏️ Insumo Personalizado</span>
          </button>
        </div>

        {/* CONTENIDO DE TABS */}
        <div className="p-4 sm:p-6 overflow-y-auto flex-1">
          
          {/* TAB 1: CATÁLOGO */}
          {activeTab === 'catalog' && (
            <div className="space-y-4">
              
              {/* Buscador y Filtros */}
              <div className="space-y-3">
                <div className="relative">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder="Buscar tablero, canto, corredera, bisagra, tornillo..."
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl pl-9 pr-3 py-2 text-xs sm:text-sm font-bold text-slate-900 focus:ring-2 focus:ring-emerald-500 focus:bg-white focus:outline-none"
                  />
                </div>

                <div className="flex items-center gap-1 overflow-x-auto pb-1 text-xs no-scrollbar">
                  {categoriesList.map((cat, idx) => (
                    <button
                      key={`budget-cat-btn-${cat.id}-${idx}`}
                      type="button"
                      onClick={() => setSelectedCategory(cat.id)}
                      className={`px-2.5 py-1 rounded-lg font-bold whitespace-nowrap text-xs transition cursor-pointer ${
                        selectedCategory === cat.id
                          ? 'bg-emerald-800 text-white shadow-sm'
                          : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                      }`}
                    >
                      <span>{cat.icon} {cat.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Lista de Insumos del Catálogo */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 max-h-[38vh] overflow-y-auto pr-1">
                {filteredCatalog.map((item, itemIdx) => {
                  const isSelected = selectedCatalogItem?.id === item.id;
                  const catIcon = categoriesList.find(c => c.id === item.category)?.icon || '📦';

                  return (
                    <div
                      key={`budget-cat-item-${item.id}-${itemIdx}`}
                      onClick={() => handleSelectCatalogItem(item)}
                      className={`p-3 rounded-2xl border-2 transition text-left cursor-pointer flex items-start justify-between gap-2.5 ${
                        isSelected
                          ? 'border-emerald-600 bg-emerald-50/80 shadow-md ring-2 ring-emerald-500/20'
                          : 'border-slate-200 bg-white hover:border-emerald-400 hover:bg-slate-50'
                      }`}
                    >
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5">
                          <span className="text-base">{catIcon}</span>
                          <span className="font-bold text-xs sm:text-sm text-slate-900 truncate">
                            {item.name}
                          </span>
                        </div>
                        {item.description && (
                          <p className="text-[11px] text-slate-500 truncate mt-0.5">{item.description}</p>
                        )}
                        <div className="flex items-center gap-2 mt-1">
                          <span className="bg-slate-100 text-slate-600 text-[10px] font-bold px-1.5 py-0.5 rounded">
                            {item.unit}
                          </span>
                          {item.brand && (
                            <span className="text-[10px] text-emerald-800 font-semibold">
                              {item.brand}
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="text-right shrink-0">
                        <span className="font-black text-emerald-950 text-sm sm:text-base block">
                          {currencySymbol} {item.unitPrice.toLocaleString()}
                        </span>
                        {isSelected && (
                          <span className="bg-emerald-600 text-white text-[9px] font-black uppercase px-1.5 py-0.5 rounded-full inline-block mt-0.5">
                            ✓ ELEGIDO
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Panel de Configuración de Cantidad y Precio del ítem seleccionado */}
              {selectedCatalogItem && (
                <div className="bg-emerald-950 text-white p-4 rounded-2xl border-2 border-emerald-500 flex flex-col sm:flex-row items-center justify-between gap-4 animate-in slide-in-from-bottom-2">
                  <div className="flex-1">
                    <p className="text-xs uppercase font-bold text-emerald-300">Insumo Seleccionado:</p>
                    <h4 className="text-base font-black text-white mt-0.5">{selectedCatalogItem.name}</h4>
                    <p className="text-xs text-emerald-200">
                      Unidad: {selectedCatalogItem.unit} • Precio Catálogo: {currencySymbol} {selectedCatalogItem.unitPrice}
                    </p>
                  </div>

                  <div className="flex items-center gap-3 w-full sm:w-auto justify-end flex-wrap">
                    <div>
                      <label className="text-[10px] uppercase font-bold text-emerald-300 block">Cantidad:</label>
                      <input
                        type="number"
                        min="0.1"
                        step="any"
                        value={catalogQuantity === 0 ? '' : catalogQuantity}
                        onChange={(e) => setCatalogQuantity(e.target.value === '' ? 0 : parseFloat(e.target.value) || 0)}
                        onFocus={(e) => e.target.select()}
                        onClick={(e) => (e.target as HTMLInputElement).select()}
                        className="w-20 bg-emerald-900 border border-emerald-400 rounded-xl px-2 py-1.5 font-black text-center text-sm text-white focus:ring-2 focus:ring-amber-400 focus:outline-none"
                      />
                    </div>

                    <div>
                      <label className="text-[10px] uppercase font-bold text-emerald-300 block">P. Unitario ({currencySymbol}):</label>
                      <input
                        type="number"
                        min="0"
                        step="any"
                        value={catalogCustomPrice === 0 ? '' : catalogCustomPrice}
                        onChange={(e) => setCatalogCustomPrice(e.target.value === '' ? 0 : parseFloat(e.target.value) || 0)}
                        onFocus={(e) => e.target.select()}
                        onClick={(e) => (e.target as HTMLInputElement).select()}
                        className="w-24 bg-emerald-900 border border-emerald-400 rounded-xl px-2 py-1.5 font-black text-right text-sm text-white focus:ring-2 focus:ring-amber-400 focus:outline-none"
                      />
                    </div>

                    <div className="text-right pl-2">
                      <label className="text-[10px] uppercase font-bold text-emerald-300 block">Total:</label>
                      <span className="text-lg font-black text-amber-300">
                        {currencySymbol} {Math.round(catalogQuantity * catalogCustomPrice).toLocaleString()}
                      </span>
                    </div>

                    <button
                      type="button"
                      onClick={handleAddFromCatalog}
                      className="bg-amber-400 hover:bg-amber-300 text-amber-950 font-black px-4 py-2.5 rounded-xl shadow-md border-2 border-amber-600 flex items-center gap-1.5 text-xs sm:text-sm cursor-pointer transition"
                    >
                      <Plus className="w-4 h-4" />
                      <span>Añadir</span>
                    </button>
                  </div>
                </div>
              )}

            </div>
          )}

          {/* TAB 2: PERSONALIZADO */}
          {activeTab === 'custom' && (
            <form onSubmit={handleAddCustom} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-12 gap-3.5 text-xs">
                
                <div className="sm:col-span-8">
                  <label className="font-bold text-slate-700 block mb-1">Nombre del Insumo / Concepto *</label>
                  <input
                    type="text"
                    required
                    value={customName}
                    onChange={(e) => setCustomName(e.target.value)}
                    placeholder="Ej. Vidrio templado 6mm, Tubo ovalado closet, Kit iluminación LED..."
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 font-bold text-sm text-slate-900 focus:bg-white focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  />
                </div>

                <div className="sm:col-span-4">
                  <label className="font-bold text-slate-700 block mb-1">Categoría</label>
                  <select
                    value={customCategory}
                    onChange={(e) => setCustomCategory(e.target.value as BudgetItemCategory)}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 font-bold text-sm text-slate-900 focus:bg-white focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  >
                    <option value="tablero">🪵 Tablero / Placa</option>
                    <option value="cubrecanto">🏷️ Cubrecanto</option>
                    <option value="corredera">📏 Corredera</option>
                    <option value="bisagra">🚪 Bisagra</option>
                    <option value="herraje">🔩 Herraje / Jaladera</option>
                    <option value="consumible">🧪 Consumible / Pegamento</option>
                    <option value="servicio">🛠️ Servicio</option>
                    <option value="personalizado">✨ Personalizado</option>
                  </select>
                </div>

                <div className="sm:col-span-4">
                  <label className="font-bold text-slate-700 block mb-1">Cantidad *</label>
                  <input
                    type="number"
                    min="0.1"
                    step="any"
                    required
                    value={customQuantity === 0 ? '' : customQuantity}
                    onChange={(e) => setCustomQuantity(e.target.value === '' ? 0 : parseFloat(e.target.value) || 0)}
                    onFocus={(e) => e.target.select()}
                    onClick={(e) => (e.target as HTMLInputElement).select()}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 font-black text-sm text-slate-900 focus:bg-white focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  />
                </div>

                <div className="sm:col-span-4">
                  <label className="font-bold text-slate-700 block mb-1">Unidad de Medida</label>
                  <input
                    type="text"
                    value={customUnit}
                    onChange={(e) => setCustomUnit(e.target.value)}
                    placeholder="unidades, metros, hojas, pares, juego..."
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 font-bold text-sm text-slate-900 focus:bg-white focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  />
                </div>

                <div className="sm:col-span-4">
                  <label className="font-bold text-slate-700 block mb-1">Precio Unitario ({currencySymbol}) *</label>
                  <input
                    type="number"
                    min="0"
                    step="any"
                    required
                    value={customUnitPrice === 0 ? '' : customUnitPrice}
                    onChange={(e) => setCustomUnitPrice(e.target.value === '' ? 0 : parseFloat(e.target.value) || 0)}
                    onFocus={(e) => e.target.select()}
                    onClick={(e) => (e.target as HTMLInputElement).select()}
                    className="w-full bg-slate-50 border-2 border-emerald-600 rounded-xl px-3 py-2 font-black text-sm text-slate-900 focus:bg-white focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  />
                </div>

                <div className="sm:col-span-12">
                  <label className="font-bold text-slate-700 block mb-1">Descripción / Especificación Técnica</label>
                  <input
                    type="text"
                    value={customDescription}
                    onChange={(e) => setCustomDescription(e.target.value)}
                    placeholder="Detalles, calibre, acabado o marca del insumo..."
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-sm text-slate-800 focus:bg-white focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  />
                </div>

                {/* Opción de guardar en Catálogo General */}
                <div className="sm:col-span-12 bg-emerald-50 border-2 border-emerald-200 rounded-2xl p-4">
                  <label className="flex items-start gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={saveToMasterCatalog}
                      onChange={(e) => setSaveToMasterCatalog(e.target.checked)}
                      className="w-5 h-5 accent-emerald-700 rounded mt-0.5"
                    />
                    <div>
                      <span className="font-black text-emerald-950 text-xs sm:text-sm block">
                        [✓] Guardar también en el Catálogo General de Precios del Taller
                      </span>
                      <span className="text-[11px] text-emerald-800 font-semibold block mt-0.5">
                        Este insumo quedará disponible permanentemente en la lista maestra para futuros proyectos y cotizaciones sin tener que volver a escribirlo.
                      </span>
                    </div>
                  </label>
                </div>

              </div>

              {/* Subtotal y Botón de Envío */}
              <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-4 border-t border-slate-200">
                <div className="text-left">
                  <span className="text-xs uppercase font-bold text-slate-500">Importe Calculado:</span>
                  <p className="text-2xl font-black text-emerald-950">
                    {currencySymbol} {Math.round(customQuantity * customUnitPrice).toLocaleString()}
                  </p>
                </div>

                <button
                  type="submit"
                  className="w-full sm:w-auto bg-emerald-700 hover:bg-emerald-800 text-white font-black px-6 py-3 rounded-2xl shadow-lg border-2 border-emerald-950 flex items-center justify-center gap-2 text-sm transition cursor-pointer"
                >
                  <Plus className="w-5 h-5" />
                  <span>Añadir al Presupuesto</span>
                </button>
              </div>
            </form>
          )}

        </div>

      </div>
    </div>
  );
};
