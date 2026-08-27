import React, { useState } from 'react';
import { Project, WoodCut, EdgeBanding } from '../types';
import { Printer, X, Download, Check, ZoomIn, ZoomOut, Loader2, Tag, Layers, CheckSquare } from 'lucide-react';
import { downloadElementAsPdf } from '../utils/pdfExport';

interface EdgeBandingPdfModalProps {
  isOpen: boolean;
  onClose: () => void;
  project: Project;
  selectedUnitId?: string;
}

export const EdgeBandingPdfModal: React.FC<EdgeBandingPdfModalProps> = ({
  isOpen,
  onClose,
  project,
  selectedUnitId = 'all'
}) => {
  const [zoom, setZoom] = useState<number>(100);
  const [isDownloadingPdf, setIsDownloadingPdf] = useState<boolean>(false);
  const [downloadSuccess, setDownloadSuccess] = useState<boolean>(false);

  if (!isOpen || !project) return null;

  const dateStr = new Date().toLocaleDateString('es-ES', { 
    day: '2-digit', 
    month: 'long', 
    year: 'numeric' 
  });

  // Obtener todas las piezas del proyecto o del mueble seleccionado
  let cutsPool: (WoodCut & { displayFurnitureName?: string })[] = [];

  if (project.furnitureUnits && project.furnitureUnits.length > 0) {
    if (selectedUnitId !== 'all') {
      const uIndex = project.furnitureUnits.findIndex(u => u.id === selectedUnitId);
      const unit = uIndex >= 0 ? project.furnitureUnits[uIndex] : undefined;
      if (unit) {
        const letter = String.fromCharCode(65 + uIndex);
        const furnName = unit.name.toLowerCase().startsWith('mueble') ? unit.name : `Mueble ${letter}: ${unit.name}`;
        cutsPool = unit.cuts.map(c => ({
          ...c,
          displayFurnitureName: furnName
        }));
      }
    } else {
      cutsPool = project.furnitureUnits.flatMap((unit, idx) => {
        const letter = String.fromCharCode(65 + idx);
        const furnName = unit.name.toLowerCase().startsWith('mueble') ? unit.name : `Mueble ${letter}: ${unit.name}`;
        return unit.cuts.map(c => ({
          ...c,
          displayFurnitureName: furnName
        }));
      });
    }
  } else {
    cutsPool = (project.cuts || []).map(c => ({
      ...c,
      displayFurnitureName: c.furnitureName || project.name
    }));
  }

  // Filtrar ÚNICAMENTE las piezas que llevan al menos un lado de cubrecanto
  const edgeCuts = cutsPool.filter(c => {
    const e = c.edges;
    return !!(e && (e.top || e.bottom || e.left || e.right));
  });

  // Métricas de canteado
  let totalBandedMeters = 0;
  let totalBandedPieces = 0;

  edgeCuts.forEach(cut => {
    const e = cut.edges || {};
    const qty = cut.quantity || 1;
    totalBandedPieces += qty;

    let pieceMeters = 0;
    if (e.top) pieceMeters += cut.lengthCm / 100;
    if (e.bottom) pieceMeters += cut.lengthCm / 100;
    if (e.left) pieceMeters += cut.widthCm / 100;
    if (e.right) pieceMeters += cut.widthCm / 100;

    totalBandedMeters += pieceMeters * qty;
  });

  const metersWithWaste = Math.round(totalBandedMeters * 1.10 * 10) / 10;

  // Descargar PDF Directo
  const handleDownloadDirectPdf = async () => {
    const el = document.getElementById('edgebanding-print-sheet');
    if (!el) {
      window.print();
      return;
    }
    try {
      setIsDownloadingPdf(true);
      const cleanProjectName = (project.name || 'Proyecto').replace(/[^a-zA-Z0-9áéíóúÁÉÍÓÚñÑ_-]/g, '_');
      const filename = `Lista_Cubrecanto_${cleanProjectName}_${new Date().toISOString().slice(0, 10)}.pdf`;

      await downloadElementAsPdf(el, {
        filename,
        orientation: 'portrait',
        format: 'letter',
        marginMm: [6, 8, 6, 8],
        scale: 2
      });
      setDownloadSuccess(true);
      setTimeout(() => setDownloadSuccess(false), 3500);
    } catch (err) {
      console.error('Error al generar PDF de cubrecanto:', err);
      window.print();
    } finally {
      setIsDownloadingPdf(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-slate-900/80 backdrop-blur-sm overflow-hidden animate-fadeIn">
      {/* Estilos para impresión nativa */}
      <style>{`
        @media print {
          body * {
            visibility: hidden !important;
          }
          #edgebanding-print-sheet, #edgebanding-print-sheet * {
            visibility: visible !important;
          }
          #edgebanding-print-sheet {
            position: absolute !important;
            left: 0 !important;
            top: 0 !important;
            width: 100% !important;
            margin: 0 !important;
            padding: 5mm !important;
            background: #ffffff !important;
            box-shadow: none !important;
            border: none !important;
            transform: none !important;
          }
          .no-print-modal {
            display: none !important;
          }
          @page {
            size: letter portrait;
            margin: 8mm;
          }
        }
      `}</style>

      {/* Barra superior de herramientas (no imprimible) */}
      <div className="no-print-modal bg-slate-900 border-b border-slate-700 px-4 py-3 flex flex-wrap items-center justify-between gap-4 shadow-xl z-20 text-white">
        <div className="flex items-center gap-3">
          <div className="bg-emerald-600 p-2 rounded-xl text-white">
            <Tag className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base sm:text-lg font-black text-white flex items-center gap-2">
              <span>Vista Previa:</span>
              <span className="text-emerald-400">📄 Lista de Cubrecanto / Canteado (PDF)</span>
            </h3>
            <p className="text-xs font-semibold text-slate-300">
              Proyecto: <strong className="text-white">{project.name}</strong> • Solo piezas con canteado activo • Formato Carta
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 sm:gap-3">
          {/* Zoom */}
          <div className="hidden md:flex items-center bg-slate-800 rounded-xl p-1 border border-slate-700 text-xs font-bold text-slate-300">
            <button 
              type="button" 
              onClick={() => setZoom(z => Math.max(60, z - 10))}
              className="p-1.5 hover:bg-slate-700 rounded-lg cursor-pointer transition"
              title="Reducir zoom"
            >
              <ZoomOut className="w-3.5 h-3.5" />
            </button>
            <span className="px-2">{zoom}%</span>
            <button 
              type="button" 
              onClick={() => setZoom(z => Math.min(150, z + 10))}
              className="p-1.5 hover:bg-slate-700 rounded-lg cursor-pointer transition"
              title="Aumentar zoom"
            >
              <ZoomIn className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Botón Descargar PDF Directo */}
          <button
            type="button"
            id="btn-descargar-pdf-cubrecanto"
            onClick={handleDownloadDirectPdf}
            disabled={isDownloadingPdf}
            className="bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white font-black px-4 py-2.5 rounded-xl border border-emerald-400 shadow-md flex items-center gap-2 text-xs sm:text-sm cursor-pointer transition transform active:scale-95"
            title="Descargar archivo PDF directo listo para imprimir o enviar al taller"
          >
            {isDownloadingPdf ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin text-white" />
                <span>Generando PDF...</span>
              </>
            ) : downloadSuccess ? (
              <>
                <Check className="w-4 h-4 text-emerald-200" />
                <span>¡PDF Descargado!</span>
              </>
            ) : (
              <>
                <Download className="w-4 h-4" />
                <span>Descargar PDF</span>
              </>
            )}
          </button>

          {/* Botón Imprimir Nativo */}
          <button
            type="button"
            onClick={handlePrint}
            className="bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white font-black px-3.5 py-2.5 rounded-xl border border-slate-600 flex items-center gap-1.5 text-xs sm:text-sm cursor-pointer transition"
            title="Imprimir directamente"
          >
            <Printer className="w-4 h-4 text-emerald-400" />
            <span className="hidden sm:inline">Imprimir</span>
          </button>

          {/* Botón Cerrar */}
          <button
            type="button"
            onClick={onClose}
            className="bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white font-black px-3.5 py-2.5 rounded-xl border border-slate-600 flex items-center gap-1.5 text-xs sm:text-sm cursor-pointer transition"
          >
            <X className="w-4 h-4" />
            <span>Cerrar</span>
          </button>
        </div>
      </div>

      {/* Contenedor con la hoja de previsualización (Fondo blanco sólido, alto contraste) */}
      <div className="flex-1 overflow-y-auto p-4 sm:p-8 flex justify-center bg-slate-950/70">
        <div 
          id="edgebanding-print-sheet"
          style={{ transform: `scale(${zoom / 100})`, transformOrigin: 'top center' }}
          className="bg-white text-slate-900 shadow-2xl rounded-2xl p-6 sm:p-10 w-full max-w-4xl transition-transform duration-150 font-sans space-y-6"
        >
          {/* Encabezado Principal */}
          <div className="border-b-4 border-emerald-800 pb-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-2xl">🏷️</span>
                <h1 className="text-2xl sm:text-3xl font-black text-slate-950 tracking-tight uppercase">
                  Lista Técnica de Cubrecanto
                </h1>
              </div>
              <p className="text-xs sm:text-sm font-bold text-slate-700 mt-1">
                Proyecto: <span className="text-slate-950 font-extrabold">{project.name}</span>
                {project.clientName && <> • Cliente: <span className="text-slate-950 font-extrabold">{project.clientName}</span></>}
                {' '}• Material: <span className="text-slate-950 font-extrabold">{project.materialType} ({project.thicknessMm} mm)</span>
              </p>
            </div>
            <div className="text-right text-xs font-bold text-slate-600 shrink-0">
              <div>Fecha: <strong className="text-slate-900">{dateStr}</strong></div>
              <div>Piezas a Enchapar: <strong className="text-emerald-800">{totalBandedPieces} piezas</strong> ({edgeCuts.length} renglones)</div>
              <div className="text-slate-500 text-[11px]">Estación de Canteadora / Taller</div>
            </div>
          </div>

          {/* Banner de Métricas y Cinta Requerida */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 bg-white border border-slate-300 rounded-2xl p-4">
            <div className="text-center sm:text-left bg-white p-3.5 rounded-xl border border-slate-300 shadow-2xs">
              <span className="text-[10px] font-black uppercase tracking-wider text-slate-700 block leading-snug">
                Total Cinta Neta
              </span>
              <span className="text-2xl font-black text-slate-950 mt-1 block leading-normal">
                {totalBandedMeters.toFixed(1)} <span className="text-sm font-bold">metros</span>
              </span>
              <span className="text-[11px] font-semibold text-slate-600 block mt-0.5 leading-snug">
                Suma exacta de aristas
              </span>
            </div>

            <div className="text-center sm:text-left bg-white p-3.5 rounded-xl border border-slate-300 shadow-2xs">
              <span className="text-[10px] font-black uppercase tracking-wider text-slate-700 block leading-snug">
                Cinta Sugerida (+10% Desperdicio)
              </span>
              <span className="text-2xl font-black text-slate-950 mt-1 block leading-normal">
                {metersWithWaste} <span className="text-sm font-bold">metros</span>
              </span>
              <span className="text-[11px] font-semibold text-slate-600 block mt-0.5 leading-snug">
                Margen de cabezales y esquinas
              </span>
            </div>

            <div className="text-center sm:text-left bg-white p-3.5 rounded-xl border border-slate-300 shadow-2xs">
              <span className="text-[10px] font-black uppercase tracking-wider text-slate-700 block leading-snug">
                Piezas a Cantear
              </span>
              <span className="text-2xl font-black text-slate-950 mt-1 block leading-normal">
                {totalBandedPieces} <span className="text-sm font-bold">piezas</span>
              </span>
              <span className="text-[11px] font-semibold text-slate-600 block mt-0.5 leading-snug">
                Exclusivo piezas con canto
              </span>
            </div>
          </div>

          {/* Tabla de Piezas */}
          {edgeCuts.length === 0 ? (
            <div className="bg-slate-50 border-2 border-dashed border-slate-300 rounded-2xl p-8 text-center space-y-2">
              <p className="text-base font-black text-slate-800">
                No hay piezas con cubrecanto en este proyecto / filtro.
              </p>
              <p className="text-xs text-slate-500">
                Todas las piezas están configuradas como cortes limpios sin canto.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto rounded-xl border-2 border-slate-300 shadow-sm">
              <table className="w-full text-left text-xs border-collapse bg-white">
                <thead>
                  <tr className="bg-slate-100 border-b-2 border-slate-300 text-[10px] font-black uppercase text-slate-800 tracking-wider">
                    <th className="py-3 px-3 text-center w-8">#</th>
                    <th className="py-3 px-3">Mueble / Unidad</th>
                    <th className="py-3 px-3">Pieza</th>
                    <th className="py-3 px-3 text-center">Medidas (cm)</th>
                    <th className="py-3 px-2 text-center w-12">Cant.</th>
                    <th className="py-3 px-2 text-center">Largo 1 (L1)</th>
                    <th className="py-3 px-2 text-center">Largo 2 (L2)</th>
                    <th className="py-3 px-2 text-center">Ancho 1 (A1)</th>
                    <th className="py-3 px-2 text-center">Ancho 2 (A2)</th>
                    <th className="py-3 px-3">Tipo / Color</th>
                    <th className="py-3 px-3 text-right">Metros</th>
                    <th className="py-3 px-2 text-center w-10">Listo</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 font-medium text-slate-900">
                  {edgeCuts.map((cut, idx) => {
                    const e = cut.edges || {};
                    const qty = cut.quantity || 1;

                    const l1 = !!e.top;
                    const l2 = !!e.bottom;
                    const a1 = !!e.left;
                    const a2 = !!e.right;

                    let pieceMeters = 0;
                    if (l1) pieceMeters += cut.lengthCm / 100;
                    if (l2) pieceMeters += cut.lengthCm / 100;
                    if (a1) pieceMeters += cut.widthCm / 100;
                    if (a2) pieceMeters += cut.widthCm / 100;

                    const rowMeters = pieceMeters * qty;
                    const edgeType = cut.thicknessMm && cut.thicknessMm >= 18 ? 'PVC 2.0 mm' : 'PVC 0.45 mm';

                    return (
                      <tr key={cut.id || idx} className="hover:bg-slate-50 leading-relaxed">
                        <td className="py-3 px-3 text-center font-bold text-slate-500">{idx + 1}</td>
                        <td className="py-3 px-3 font-bold text-slate-950 text-xs">
                          {cut.displayFurnitureName || 'Mueble'}
                        </td>
                        <td className="py-3 px-3 font-extrabold text-slate-950">
                          {cut.name}
                        </td>
                        <td className="py-3 px-3 text-center font-bold text-slate-800 whitespace-nowrap">
                          {cut.lengthCm} × {cut.widthCm} cm
                        </td>
                        <td className="py-3 px-2 text-center font-black bg-slate-50 text-slate-950 text-sm">
                          {qty}
                        </td>
                        <td className="py-3 px-2 text-center">
                          {l1 ? (
                            <span className="text-slate-950 font-bold text-[11px] whitespace-nowrap">
                              ✓ {cut.lengthCm} cm
                            </span>
                          ) : (
                            <span className="text-slate-400 text-xs font-bold">—</span>
                          )}
                        </td>
                        <td className="py-3 px-2 text-center">
                          {l2 ? (
                            <span className="text-slate-950 font-bold text-[11px] whitespace-nowrap">
                              ✓ {cut.lengthCm} cm
                            </span>
                          ) : (
                            <span className="text-slate-400 text-xs font-bold">—</span>
                          )}
                        </td>
                        <td className="py-3 px-2 text-center">
                          {a1 ? (
                            <span className="text-slate-950 font-bold text-[11px] whitespace-nowrap">
                              ✓ {cut.widthCm} cm
                            </span>
                          ) : (
                            <span className="text-slate-400 text-xs font-bold">—</span>
                          )}
                        </td>
                        <td className="py-3 px-2 text-center">
                          {a2 ? (
                            <span className="text-slate-950 font-bold text-[11px] whitespace-nowrap">
                              ✓ {cut.widthCm} cm
                            </span>
                          ) : (
                            <span className="text-slate-400 text-xs font-bold">—</span>
                          )}
                        </td>
                        <td className="py-3 px-3 text-[11px] font-semibold text-slate-700 whitespace-nowrap">
                          {edgeType}
                        </td>
                        <td className="py-3 px-3 text-right font-black text-emerald-800 whitespace-nowrap">
                          {rowMeters.toFixed(2)} m
                        </td>
                        <td className="py-3 px-2 text-center">
                          <div className="w-4 h-4 border-2 border-slate-500 rounded mx-auto bg-white"></div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}

          {/* Notas y Convenciones de Taller */}
          <div className="bg-slate-50 border border-slate-300 rounded-xl p-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-[11px] text-slate-700">
            <div>
              <strong>Convención de Aristas:</strong> L1 y L2 = Lados a lo largo ({project.cuts?.[0]?.lengthCm || 80}cm); A1 y A2 = Lados a lo ancho ({project.cuts?.[0]?.widthCm || 45}cm).
            </div>
            <div className="text-right font-bold text-slate-500">
              Control de Calidad en Canteado ✓
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
