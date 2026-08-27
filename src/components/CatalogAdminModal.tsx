import React, { useState, useMemo } from 'react';
import { CatalogMaterialItem, BudgetItemCategory } from '../types';
import { 
  BookOpen, 
  Search, 
  Plus, 
  Trash2, 
  Edit2, 
  Save, 
  RotateCcw, 
  X, 
  Check, 
  DollarSign, 
  Sparkles, 
  Tag, 
  Layers, 
  AlertCircle,
  ArrowRight,
  Filter
} from 'lucide-react';

interface CatalogAdminModalProps {
  isOpen?: boolean;
  onClose: () => void;
  catalog: CatalogMaterialItem[];
  currencySymbol: string;
  onSaveCatalog: (updatedCatalog: CatalogMaterialItem[]) => void;
  onResetCatalog?: () => void;
  onResetDefaults?: () => void;
  onApplyPricesToCurrentBudget?: () => void;
}

export const CatalogAdminModal: React.FC<CatalogAdminModalProps> = ({
  isOpen = true,
  onClose,
  catalog,
  currencySymbol,
  onSaveCatalog,
  onResetCatalog,
  onResetDefaults,
  onApplyPricesToCurrentBudget
}) => {
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [selectedCategory, setSelectedCategory] = useState<string>('todos');
  const [editingItemId, setEditingItemId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<Partial<CatalogMaterialItem>>({});
  
  // Estado para formulario de nuevo insumo
  const [isAddingNew, setIsAddingNew] = useState<boolean>(false);
  const [newItemForm, setNewItemForm] = useState<Omit<CatalogMaterialItem, 'id'>>({
    name: '',
    category: 'herraje',
    unit: 'unidades',
    unitPrice: 100,
    description: '',
    brand: ''
  });

  const [notification, setNotification] = useState<string | null>(null);

  const showTempNotification = (msg: string) => {
    setNotification(msg);
    setTimeout(() => setNotification(null), 3500);
  };

  const categoriesList: { id: string; label: string; icon: string }[] = [
    { id: 'todos', label: 'Todos', icon: '📦' },
    { id: 'tablero', label: 'Tableros / Hojas', icon: '🪵' },
    { id: 'cubrecanto', label: 'Cubrecantos', icon: '🏷️' },
    { id: 'corredera', label: 'Correderas', icon: '📏' },
    { id: 'bisagra', label: 'Bisagras', icon: '🚪' },
    { id: 'herraje', label: 'Herrajes & Jaladeras', icon: '🔩' },
    { id: 'consumible', label: 'Consumibles & Pegamento', icon: '🧪' },
    { id: 'servicio', label: 'Servicios', icon: '🛠️' }
  ];

  // Restablecer catálogo
  const handleReset = () => {
    if (confirm('¿Restablecer todo el catálogo a los precios y materiales sugeridos de fábrica? (No se perderán tus proyectos existentes)')) {
      if (onResetCatalog) {
        onResetCatalog();
      } else if (onResetDefaults) {
        onResetDefaults();
      }
      showTempNotification('✓ Catálogo restablecido a valores de fábrica');
    }
  };

  if (isOpen === false) return null;

  // Filtrado de items
  const filteredCatalog = useMemo(() => {
    return catalog.filter(item => {
      const matchesSearch = item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (item.description && item.description.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (item.brand && item.brand.toLowerCase().includes(searchTerm.toLowerCase()));
      
      const matchesCat = selectedCategory === 'todos' || item.category === selectedCategory;
      return matchesSearch && matchesCat;
    });
  }, [catalog, searchTerm, selectedCategory]);

  if (!isOpen) return null;

  // Manejo de edición rápida de precio
  const handleQuickPriceChange = (id: string, newPrice: number) => {
    const updated = catalog.map(item => {
      if (item.id === id) {
        return { ...item, unitPrice: Math.max(0, newPrice) };
      }
      return item;
    });
    onSaveCatalog(updated);
  };

  // Iniciar edición completa
  const handleStartEdit = (item: CatalogMaterialItem) => {
    setEditingItemId(item.id);
    setEditForm({ ...item });
  };

  // Guardar edición completa
  const handleSaveEdit = () => {
    if (!editingItemId || !editForm.name) return;
    const updated = catalog.map(item => {
      if (item.id === editingItemId) {
        return {
          ...item,
          ...editForm,
          unitPrice: Math.max(0, Number(editForm.unitPrice) || 0)
        } as CatalogMaterialItem;
      }
      return item;
    });
    onSaveCatalog(updated);
    setEditingItemId(null);
    setEditForm({});
    showTempNotification('✓ Insumo actualizado en el catálogo');
  };

  // Eliminar insumo inmediatamente del estado local y localStorage
  const handleDeleteItem = (id: string, name: string) => {
    const updated = catalog.filter(item => item.id !== id);
    onSaveCatalog(updated);
    showTempNotification(`✓ Insumo "${name}" eliminado del catálogo`);
  };

  // Crear nuevo insumo
  const handleCreateNewItem = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newItemForm.name.trim()) return;

    const newItem: CatalogMaterialItem = {
      id: `mat_custom_${Date.now()}`,
      name: newItemForm.name.trim(),
      category: newItemForm.category,
      unit: newItemForm.unit.trim() || 'unidades',
      unitPrice: Math.max(0, Number(newItemForm.unitPrice) || 0),
      description: newItemForm.description?.trim() || '',
      brand: newItemForm.brand?.trim() || '',
      isDefault: false
    };

    const updated = [newItem, ...catalog];
    onSaveCatalog(updated);
    setIsAddingNew(false);
    setNewItemForm({
      name: '',
      category: 'herraje',
      unit: 'unidades',
      unitPrice: 100,
      description: '',
      brand: ''
    });
    showTempNotification('✓ Nuevo insumo guardado en el Catálogo Maestro');
  };

  return (
    <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md z-50 flex items-center justify-center p-3 sm:p-5">
      <div className="bg-white rounded-3xl max-w-5xl w-full max-h-[90vh] overflow-hidden border-4 border-emerald-800 flex flex-col shadow-2xl animate-in fade-in zoom-in duration-200">
        
        {/* HEADER MODAL */}
        <div className="bg-emerald-950 text-white p-5 sm:p-6 border-b-4 border-emerald-600 flex items-center justify-between gap-4 shrink-0">
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 bg-emerald-600 text-white rounded-2xl flex items-center justify-center text-2xl font-black shadow-lg border border-emerald-400 shrink-0">
              📚
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="bg-emerald-500 text-emerald-950 text-[10px] font-black uppercase px-2 py-0.5 rounded-full">
                  Base de Datos Global
                </span>
                <span className="text-emerald-300 text-xs font-bold">
                  {catalog.length} insumos registrados
                </span>
              </div>
              <h3 className="text-xl sm:text-2xl font-black text-white tracking-tight">
                Catálogo General de Insumos & Precios Base
              </h3>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="bg-emerald-900 hover:bg-emerald-800 text-white font-bold p-2.5 rounded-xl border border-emerald-700 transition cursor-pointer"
            title="Cerrar ventana"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* NOTIFICACIÓN FLOTANTE */}
        {notification && (
          <div className="bg-emerald-600 text-white px-4 py-2.5 text-center text-xs sm:text-sm font-black flex items-center justify-center gap-2 shadow-inner">
            <Check className="w-4 h-4" />
            <span>{notification}</span>
          </div>
        )}

        {/* BARRA DE HERRAMIENTAS Y BÚSQUEDA */}
        <div className="p-4 sm:p-6 border-b border-slate-200 bg-slate-50 space-y-4 shrink-0">
          <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
            {/* Buscador */}
            <div className="relative flex-1">
              <Search className="w-5 h-5 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Buscar por material, herraje, marca o especificación..."
                className="w-full bg-white border-2 border-slate-300 rounded-2xl pl-10 pr-4 py-2.5 font-bold text-sm text-slate-900 focus:border-emerald-600 focus:ring-2 focus:ring-emerald-500/20 focus:outline-none"
              />
              {searchTerm && (
                <button
                  type="button"
                  onClick={() => setSearchTerm('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>

            {/* Acciones Rápidas */}
            <div className="flex items-center gap-2 flex-wrap">
              <button
                type="button"
                onClick={() => setIsAddingNew(true)}
                className="bg-emerald-600 hover:bg-emerald-700 text-white font-black px-4 py-2.5 rounded-2xl text-xs sm:text-sm flex items-center gap-2 shadow-md border-2 border-emerald-800 transition cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>+ Nuevo Insumo al Catálogo</span>
              </button>

              {onApplyPricesToCurrentBudget && (
                <button
                  type="button"
                  onClick={() => {
                    onApplyPricesToCurrentBudget();
                    showTempNotification('✓ Precios del catálogo aplicados al presupuesto actual');
                  }}
                  className="bg-teal-700 hover:bg-teal-800 text-white font-bold px-3.5 py-2.5 rounded-2xl text-xs flex items-center gap-1.5 border border-teal-900 transition cursor-pointer shadow-sm"
                  title="Actualizar los precios del presupuesto actual con los valores de este catálogo"
                >
                  <Sparkles className="w-3.5 h-3.5 text-teal-300" />
                  <span>Aplicar a Este Presupuesto</span>
                </button>
              )}

              <button
                type="button"
                onClick={handleReset}
                className="bg-slate-200 hover:bg-slate-300 text-slate-700 font-bold px-3 py-2.5 rounded-2xl text-xs flex items-center gap-1 border border-slate-300 transition cursor-pointer"
                title="Restablecer a valores de fábrica"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Restablecer</span>
              </button>
            </div>
          </div>

          {/* Categorías Pills */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs no-scrollbar">
            {categoriesList.map(cat => (
              <button
                key={cat.id}
                type="button"
                onClick={() => setSelectedCategory(cat.id)}
                className={`px-3 py-1.5 rounded-xl font-black whitespace-nowrap flex items-center gap-1.5 transition cursor-pointer ${
                  selectedCategory === cat.id
                    ? 'bg-emerald-800 text-white shadow-sm ring-2 ring-emerald-500'
                    : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-100'
                }`}
              >
                <span>{cat.icon}</span>
                <span>{cat.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* CONTENIDO SCROLLEABLE */}
        <div className="p-4 sm:p-6 overflow-y-auto flex-1 space-y-4">
          
          {/* FORMULARIO DE CREACIÓN DE NUEVO INSUMO (SI ESTÁ ACTIVO) */}
          {isAddingNew && (
            <form onSubmit={handleCreateNewItem} className="bg-emerald-50 border-3 border-emerald-600 rounded-3xl p-5 sm:p-6 shadow-md space-y-4 animate-in slide-in-from-top-4 duration-150">
              <div className="flex items-center justify-between border-b border-emerald-200 pb-3">
                <h4 className="text-base font-black text-emerald-950 flex items-center gap-2">
                  <Plus className="w-5 h-5 text-emerald-700" />
                  Registrar Nuevo Insumo en el Catálogo Maestro
                </h4>
                <button
                  type="button"
                  onClick={() => setIsAddingNew(false)}
                  className="text-slate-500 hover:text-rose-600 font-bold text-xs"
                >
                  ✕ Cancelar
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-12 gap-3.5 text-xs">
                <div className="sm:col-span-6">
                  <label className="font-bold text-slate-700 block mb-1">Nombre del Material / Insumo *</label>
                  <input
                    type="text"
                    required
                    value={newItemForm.name}
                    onChange={(e) => setNewItemForm({ ...newItemForm, name: e.target.value })}
                    placeholder="Ej. Melamina Teka Ártico 18mm, Bisagra Push-to-Open..."
                    className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 font-bold text-slate-900 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  />
                </div>

                <div className="sm:col-span-3">
                  <label className="font-bold text-slate-700 block mb-1">Categoría</label>
                  <select
                    value={newItemForm.category}
                    onChange={(e) => setNewItemForm({ ...newItemForm, category: e.target.value as BudgetItemCategory })}
                    className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 font-bold text-slate-900 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  >
                    <option value="tablero">🪵 Tablero / Placa</option>
                    <option value="cubrecanto">🏷️ Cubrecanto</option>
                    <option value="corredera">📏 Corredera</option>
                    <option value="bisagra">🚪 Bisagra</option>
                    <option value="herraje">🔩 Herraje / Jaladera</option>
                    <option value="consumible">🧪 Consumible / Pegamento</option>
                    <option value="servicio">🛠️ Servicio</option>
                  </select>
                </div>

                <div className="sm:col-span-3">
                  <label className="font-bold text-slate-700 block mb-1">Marca / Proveedor</label>
                  <input
                    type="text"
                    value={newItemForm.brand}
                    onChange={(e) => setNewItemForm({ ...newItemForm, brand: e.target.value })}
                    placeholder="Ej. Blum, Masisa, Spax..."
                    className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 font-bold text-slate-900 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  />
                </div>

                <div className="sm:col-span-4">
                  <label className="font-bold text-slate-700 block mb-1">Unidad de Medida</label>
                  <input
                    type="text"
                    value={newItemForm.unit}
                    onChange={(e) => setNewItemForm({ ...newItemForm, unit: e.target.value })}
                    placeholder="hojas, metros, pares, unidades, paquete..."
                    className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 font-bold text-slate-900 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  />
                </div>

                <div className="sm:col-span-4">
                  <label className="font-bold text-slate-700 block mb-1">Precio Unitario Sugerido ({currencySymbol}) *</label>
                  <input
                    type="number"
                    min="0"
                    step="any"
                    required
                    value={newItemForm.unitPrice === 0 ? '' : newItemForm.unitPrice}
                    onChange={(e) => setNewItemForm({ ...newItemForm, unitPrice: e.target.value === '' ? 0 : parseFloat(e.target.value) || 0 })}
                    onFocus={(e) => e.target.select()}
                    onClick={(e) => (e.target as HTMLInputElement).select()}
                    className="w-full bg-white border-2 border-emerald-600 rounded-xl px-3 py-2 font-black text-slate-900 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  />
                </div>

                <div className="sm:col-span-4 flex items-end">
                  <button
                    type="submit"
                    className="w-full bg-emerald-700 hover:bg-emerald-800 text-white font-black py-2.5 px-4 rounded-xl shadow-md border-2 border-emerald-950 transition cursor-pointer"
                  >
                    💾 Guardar en Catálogo
                  </button>
                </div>

                <div className="sm:col-span-12">
                  <label className="font-bold text-slate-700 block mb-1">Descripción / Especificación Técnica</label>
                  <input
                    type="text"
                    value={newItemForm.description}
                    onChange={(e) => setNewItemForm({ ...newItemForm, description: e.target.value })}
                    placeholder="Detalles de dimensiones, calibre, capacidad de carga..."
                    className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-slate-800 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  />
                </div>
              </div>
            </form>
          )}

          {/* TABLA PRINCIPAL DE INSUMOS DEL CATÁLOGO */}
          {filteredCatalog.length === 0 ? (
            <div className="text-center py-12 bg-slate-50 rounded-2xl border-2 border-dashed border-slate-300">
              <p className="text-slate-500 font-bold text-sm">
                No se encontraron insumos que coincidan con la búsqueda o categoría.
              </p>
              <button
                type="button"
                onClick={() => { setSearchTerm(''); setSelectedCategory('todos'); }}
                className="mt-3 text-xs font-black text-emerald-800 underline hover:text-emerald-900"
              >
                Limpiar filtros
              </button>
            </div>
          ) : (
            <div className="overflow-x-auto border border-slate-200 rounded-2xl">
              <table className="w-full text-left border-collapse text-xs sm:text-sm">
                <thead>
                  <tr className="bg-slate-900 text-white text-xs font-black uppercase tracking-wider">
                    <th className="p-3 w-12 text-center">Tipo</th>
                    <th className="p-3">Insumo & Especificación</th>
                    <th className="p-3 w-28 text-center">Unidad</th>
                    <th className="p-3 w-40 text-right">Precio Base ({currencySymbol})</th>
                    <th className="p-3 w-28 text-center">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {filteredCatalog.map((item, itemIdx) => {
                    const isEditing = editingItemId === item.id;
                    const catIcon = categoriesList.find(c => c.id === item.category)?.icon || '📦';

                    return (
                      <tr key={`cat-item-${item.id}-${itemIdx}`} className="hover:bg-slate-50 transition">
                        {/* Icono Tipo */}
                        <td className="p-3 text-center text-lg">{catIcon}</td>

                        {/* Nombre y Detalles */}
                        <td className="p-3">
                          {isEditing ? (
                            <div className="space-y-1.5">
                              <input
                                type="text"
                                value={editForm.name || ''}
                                onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                                className="w-full bg-white border border-slate-300 rounded-lg px-2 py-1 font-bold text-xs"
                              />
                              <input
                                type="text"
                                value={editForm.description || ''}
                                onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                                placeholder="Descripción..."
                                className="w-full bg-white border border-slate-300 rounded-lg px-2 py-1 text-[11px] text-slate-600"
                              />
                            </div>
                          ) : (
                            <div>
                              <div className="flex items-center gap-2">
                                <span className="font-black text-slate-900 text-xs sm:text-sm">{item.name}</span>
                                {item.brand && (
                                  <span className="bg-slate-100 text-slate-600 text-[10px] font-bold px-1.5 py-0.5 rounded border border-slate-200">
                                    {item.brand}
                                  </span>
                                )}
                              </div>
                              {item.description && (
                                <p className="text-[11px] text-slate-500 mt-0.5">{item.description}</p>
                              )}
                            </div>
                          )}
                        </td>

                        {/* Unidad */}
                        <td className="p-3 text-center">
                          {isEditing ? (
                            <input
                              type="text"
                              value={editForm.unit || ''}
                              onChange={(e) => setEditForm({ ...editForm, unit: e.target.value })}
                              className="w-20 text-center bg-white border border-slate-300 rounded-lg px-1 py-1 font-bold text-xs"
                            />
                          ) : (
                            <span className="bg-slate-100 text-slate-700 text-xs font-semibold px-2 py-1 rounded-md border border-slate-200">
                              {item.unit}
                            </span>
                          )}
                        </td>

                        {/* Precio Unitario */}
                        <td className="p-3 text-right">
                          <div className="flex items-center justify-end gap-1">
                            <span className="text-xs font-bold text-slate-500">{currencySymbol}</span>
                            <input
                              type="number"
                              min="0"
                              step="any"
                              value={(isEditing ? (editForm.unitPrice ?? 0) : item.unitPrice) === 0 ? '' : (isEditing ? (editForm.unitPrice ?? 0) : item.unitPrice)}
                              onChange={(e) => {
                                const val = e.target.value === '' ? 0 : parseFloat(e.target.value) || 0;
                                if (isEditing) {
                                  setEditForm({ ...editForm, unitPrice: val });
                                } else {
                                  handleQuickPriceChange(item.id, val);
                                }
                              }}
                              onFocus={(e) => e.target.select()}
                              onClick={(e) => (e.target as HTMLInputElement).select()}
                              className="w-24 text-right font-black text-emerald-950 bg-emerald-50/50 hover:bg-emerald-50 rounded-xl border border-emerald-300 py-1 px-2 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                            />
                          </div>
                        </td>

                        {/* Acciones */}
                        <td className="p-3 text-center">
                          <div className="flex items-center justify-center gap-1">
                            {isEditing ? (
                              <>
                                <button
                                  type="button"
                                  onClick={handleSaveEdit}
                                  className="bg-emerald-600 hover:bg-emerald-700 text-white p-1.5 rounded-lg transition"
                                  title="Guardar cambios"
                                >
                                  <Save className="w-4 h-4" />
                                </button>
                                <button
                                  type="button"
                                  onClick={() => { setEditingItemId(null); setEditForm({}); }}
                                  className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg"
                                  title="Cancelar"
                                >
                                  <X className="w-4 h-4" />
                                </button>
                              </>
                            ) : (
                              <>
                                <button
                                  type="button"
                                  onClick={() => handleStartEdit(item)}
                                  className="text-slate-500 hover:text-emerald-700 p-1.5 rounded-lg hover:bg-emerald-50 transition"
                                  title="Editar detalles completos"
                                >
                                  <Edit2 className="w-4 h-4" />
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleDeleteItem(item.id, item.name)}
                                  className="text-slate-400 hover:text-rose-600 p-1.5 rounded-lg hover:bg-rose-50 transition"
                                  title="Eliminar insumo"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}

        </div>

        {/* FOOTER MODAL */}
        <div className="bg-slate-100 p-4 sm:p-5 border-t border-slate-300 flex flex-col sm:flex-row items-center justify-between gap-3 shrink-0">
          <p className="text-xs font-semibold text-slate-600 text-center sm:text-left">
            💡 Los cambios se guardan automáticamente en la memoria del taller para futuros presupuestos.
          </p>
          <button
            type="button"
            onClick={onClose}
            className="w-full sm:w-auto bg-slate-900 hover:bg-slate-800 text-white font-black px-6 py-2.5 rounded-xl border border-slate-950 transition cursor-pointer text-xs sm:text-sm"
          >
            Aceptar & Cerrar Catálogo
          </button>
        </div>

      </div>
    </div>
  );
};
