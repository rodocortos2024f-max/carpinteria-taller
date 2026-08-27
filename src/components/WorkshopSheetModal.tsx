import React from 'react';
import { 
  Project, 
  WoodCut, 
  OptimizationResult, 
  PlacedPiece,
  GeneratedOffcut,
  EdgeBanding,
  FurnitureUnit
} from '../types';
import { Printer, X, Download, FileText, Scissors, Check, ZoomIn, ZoomOut, Wrench, Box, Layers, AlertTriangle, Loader2 } from 'lucide-react';
import { FurniturePalette } from './PdfPreviewModal';
import { downloadElementAsPdf } from '../utils/pdfExport';

interface WorkshopSheetModalProps {
  isOpen: boolean;
  onClose: () => void;
  project: Project;
  materialType?: string;
  thicknessMm?: number;
  sheetLengthCm?: number;
  sheetWidthCm?: number;
  sawKerfMm?: number;
  primaryCutDirection?: 'largo' | 'ancho';
  optimizationResult?: OptimizationResult | null;
  furnitureColorMap?: Record<string, FurniturePalette>;
  assignedOffcuts?: any[];
}

function formatEdgeBanding(edges?: EdgeBanding): string {
  if (!edges) return 'Sin cantos';
  const parts: string[] = [];
  if (edges.top) parts.push('L1 (Largo)');
  if (edges.bottom) parts.push('L2 (Largo)');
  if (edges.left) parts.push('A1 (Ancho)');
  if (edges.right) parts.push('A2 (Ancho)');
  return parts.length > 0 ? parts.join(', ') : 'Sin cantos';
}

export const WorkshopSheetModal: React.FC<WorkshopSheetModalProps> = ({
  isOpen,
  onClose,
  project,
  materialType = project.materialType || 'Melamina',
  thicknessMm = project.thicknessMm || 15,
  sheetLengthCm = 244,
  sheetWidthCm = 122,
  sawKerfMm = 3,
  primaryCutDirection = 'largo',
  optimizationResult,
  furnitureColorMap = {},
  assignedOffcuts = []
}) => {
  const [zoom, setZoom] = React.useState<number>(100);
  const [printSuccess, setPrintSuccess] = React.useState<boolean>(false);
  const [isDownloadingPdf, setIsDownloadingPdf] = React.useState<boolean>(false);

  if (!isOpen) return null;

  const dateStr = new Date().toLocaleDateString('es-ES', { 
    day: '2-digit', 
    month: 'long', 
    year: 'numeric' 
  });

  const handleDownloadPdf = async () => {
    const el = document.getElementById('area-taller-impresion');
    if (!el) {
      window.print();
      return;
    }
    try {
      setIsDownloadingPdf(true);
      const cleanProjectName = (project.name || 'Proyecto').replace(/[^a-zA-Z0-9áéíóúÁÉÍÓÚñÑ_-]/g, '_');
      const filename = `Hoja_Taller_${cleanProjectName}_${new Date().toISOString().slice(0, 10)}.pdf`;
      
      await downloadElementAsPdf(el, {
        filename,
        orientation: 'portrait',
        format: 'letter',
        marginMm: [6, 6, 6, 6],
        scale: 2
      });
      setPrintSuccess(true);
      setTimeout(() => setPrintSuccess(false), 3000);
    } catch (err) {
      console.error('Error generating direct workshop PDF:', err);
      window.print();
    } finally {
      setIsDownloadingPdf(false);
    }
  };

  const handlePrint = () => {
    setPrintSuccess(true);
    setTimeout(() => {
      window.print();
    }, 150);
    setTimeout(() => setPrintSuccess(false), 4000);
  };

  const totalCutsCount = (project.cuts || []).reduce((acc, c) => acc + (c.quantity || 1), 0);
  const furnitureList = project.furnitureUnits && project.furnitureUnits.length > 0
    ? project.furnitureUnits
    : [{
        id: 'main',
        name: project.name,
        category: project.category,
        heightCm: project.totalHeightCm,
        widthCm: project.totalWidthCm,
        depthCm: project.totalDepthCm,
        thicknessMm: project.thicknessMm,
        materialType: project.materialType,
        notes: project.notes,
        cuts: project.cuts || []
      } as FurnitureUnit];

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-slate-950/85 backdrop-blur-sm overflow-hidden animate-fadeIn">
      
      {/* CSS para aislar la hoja en la impresión nativa sin precios */}
      <style>{`
        @media print {
          body * {
            visibility: hidden !important;
          }
          #area-taller-impresion, #area-taller-impresion * {
            visibility: visible !important;
          }
          #area-taller-impresion {
            position: absolute !important;
            left: 0 !important;
            top: 0 !important;
            width: 100% !important;
            margin: 0 !important;
            padding: 4mm !important;
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
            margin: 6mm;
          }
          .page-break-board {
            page-break-after: always;
            break-after: page;
          }
        }
      `}</style>

      {/* Barra de herramientas superior */}
      <div className="no-print-modal bg-slate-900 border-b border-slate-700 px-4 py-3 flex flex-wrap items-center justify-between gap-4 shadow-xl z-20 text-white">
        <div className="flex items-center gap-3">
          <div className="bg-amber-500 text-slate-950 p-2 rounded-xl font-black">
            <Wrench className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base sm:text-lg font-black text-white flex items-center gap-2">
              <span>HOJA DE TRABAJO PARA TALLER (OPERARIO / CHALÁN)</span>
              <span className="text-xs bg-amber-400 text-amber-950 px-2 py-0.5 rounded font-black uppercase">
                Sin Precios
              </span>
            </h3>
            <p className="text-xs font-semibold text-slate-300">
              Proyecto: <strong className="text-white">{project.name}</strong> • Planos 2D, Despiece, Canteado y Retazos de Almacén
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 sm:gap-3">
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
            id="btn-descargar-hoja-pdf-directo"
            onClick={handleDownloadPdf}
            disabled={isDownloadingPdf}
            className="bg-amber-400 hover:bg-amber-300 disabled:opacity-50 text-amber-950 font-black px-4 py-2.5 rounded-xl shadow-lg border-2 border-amber-500 flex items-center gap-2 text-xs sm:text-sm cursor-pointer transition transform active:scale-95"
            title="Genera y descarga directamente el archivo PDF limpio para taller"
          >
            {isDownloadingPdf ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin text-amber-900" />
                <span>Generando PDF...</span>
              </>
            ) : printSuccess ? (
              <>
                <Check className="w-4 h-4 text-emerald-800" />
                <span>¡PDF Descargado!</span>
              </>
            ) : (
              <>
                <Download className="w-4 h-4" />
                <span>📋 Descargar Hoja de Taller (PDF)</span>
              </>
            )}
          </button>

          {/* Botón Imprimir Físico */}
          <button
            type="button"
            onClick={handlePrint}
            className="bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white font-black px-3.5 py-2.5 rounded-xl border border-slate-600 flex items-center gap-1.5 text-xs sm:text-sm cursor-pointer transition"
            title="Imprimir directamente en impresora conectada"
          >
            <Printer className="w-4 h-4 text-amber-400" />
            <span className="hidden sm:inline">Imprimir</span>
          </button>

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

      {/* Contenedor imprimible */}
      <div className="flex-1 overflow-y-auto p-4 sm:p-8 flex justify-center bg-slate-950/60">
        <div 
          id="area-taller-impresion"
          style={{ transform: `scale(${zoom / 100})`, transformOrigin: 'top center' }}
          className="bg-white text-slate-900 shadow-2xl rounded-2xl p-6 sm:p-10 transition-transform duration-150 w-full max-w-4xl space-y-6"
        >
          {/* Cabecera Técnica de Taller */}
          <div className="border-b-4 border-amber-800 pb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <span className="bg-amber-900 text-amber-200 text-xs font-black px-2.5 py-0.5 rounded uppercase">
                  Hoja Técnica de Producción
                </span>
                <span className="text-xs font-bold text-slate-500">Uso Exclusivo de Taller</span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-black text-slate-950 tracking-tight mt-1 uppercase">
                {project.name}
              </h1>
              <p className="text-xs sm:text-sm font-bold text-slate-700 mt-0.5">
                Material: <strong className="text-slate-950">{materialType} ({thicknessMm} mm)</strong> • 
                Tableros: <strong className="text-slate-950">{sheetLengthCm} × {sheetWidthCm} cm</strong> (Sierra {sawKerfMm} mm)
              </p>
            </div>

            <div className="text-right text-xs font-bold text-slate-700 shrink-0 bg-amber-50 p-3 rounded-xl border border-amber-300">
              <div>Fecha: <strong className="text-slate-900">{dateStr}</strong></div>
              <div>Total Piezas: <strong className="text-amber-900 text-sm font-black">{totalCutsCount} piezas</strong></div>
              {optimizationResult && (
                <div>Hojas Nuevas: <strong className="text-slate-900">{optimizationResult.totalSheets} tableros</strong></div>
              )}
            </div>
          </div>

          {/* 1. SECCIÓN RETAZOS / PEDACERÍA A EXTRAER DE ALMACÉN */}
          {assignedOffcuts && assignedOffcuts.length > 0 && (
            <div className="border-2 border-amber-600 rounded-2xl p-4 bg-amber-50/70 space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-sm sm:text-base font-black text-amber-950 flex items-center gap-2 uppercase">
                  <span>📌 PASO 1: EXTRAER Y CORTAR DE PEDACERÍA EN ALMACÉN</span>
                </h3>
                <span className="text-xs font-black bg-amber-300 text-amber-950 px-2 py-0.5 rounded">
                  {assignedOffcuts.length} piezas de retazo
                </span>
              </div>
              <p className="text-xs text-amber-900 font-semibold">
                Busca estos retazos en el almacén antes de cortar las hojas completas:
              </p>

              <table className="w-full text-xs border-collapse border border-amber-300 bg-white">
                <thead>
                  <tr className="bg-amber-200 text-amber-950 font-black">
                    <th className="p-2 border border-amber-300 text-center w-8">#</th>
                    <th className="p-2 border border-amber-300 text-left">Mueble / Pieza</th>
                    <th className="p-2 border border-amber-300 text-center w-28">Medida Pieza</th>
                    <th className="p-2 border border-amber-300 text-left">Retazo de Origen</th>
                    <th className="p-2 border border-amber-300 text-left">Sentido y Remanente</th>
                  </tr>
                </thead>
                <tbody>
                  {assignedOffcuts.map((off, idx) => (
                    <tr key={off.offcutId || idx} className="border-b border-amber-200">
                      <td className="p-2 border border-amber-300 text-center font-bold">{idx + 1}</td>
                      <td className="p-2 border border-amber-300 font-bold">
                        [{off.furnitureName || 'Mueble'}] {off.pieceName}
                      </td>
                      <td className="p-2 border border-amber-300 text-center font-black text-emerald-800 bg-emerald-50">
                        {off.usedLengthCm} × {off.usedWidthCm} cm
                      </td>
                      <td className="p-2 border border-amber-300 font-semibold text-slate-700">
                        {off.offcutLabel || `Retazo #${off.offcutNumber}`} ({off.originalLengthCm} × {off.originalWidthCm} cm)
                      </td>
                      <td className="p-2 border border-amber-300 text-[11px] text-slate-600">
                        {off.cutDirection === 'longitudinal' ? 'A lo largo' : 'A lo ancho'} • Sobrante: {off.remainingLengthCm} × {off.remainingWidthCm} cm
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* 2. PLANOS 2D DE TABLEROS EN MINIATURA TÉCNICA */}
          {optimizationResult && optimizationResult.boards && optimizationResult.boards.length > 0 && (
            <div className="space-y-4">
              <h3 className="text-sm sm:text-base font-black text-slate-900 flex items-center gap-2 uppercase border-b-2 border-slate-300 pb-1">
                <span>📐 PLANOS DE CORTE EN TABLEROS NUEVOS ({optimizationResult.totalSheets} HOJAS)</span>
              </h3>

              <div className="space-y-4">
                {optimizationResult.boards.map((board) => (
                  <div key={board.boardIndex} className="border-2 border-slate-400 rounded-xl p-3 bg-slate-50 space-y-2">
                    <div className="flex items-center justify-between text-xs font-black">
                      <span className="bg-slate-900 text-white px-2.5 py-0.5 rounded">
                        TABLERO #{board.boardIndex + 1} ({board.sheetLengthCm} × {board.sheetWidthCm} cm)
                      </span>
                      <span className="text-slate-700">
                        {board.placedPieces.length} piezas • Rendimiento: {board.efficiencyPercent}%
                      </span>
                    </div>

                    {/* Canvas SVG del Tablero */}
                    <div className="w-full bg-white border border-slate-300 rounded-lg p-2 overflow-hidden">
                      <svg
                        viewBox={`0 0 ${board.sheetLengthCm} ${board.sheetWidthCm}`}
                        className="w-full max-h-56 bg-amber-50/40 border border-slate-400"
                        style={{ aspectRatio: `${board.sheetLengthCm} / ${board.sheetWidthCm}` }}
                      >
                        {/* Tablero Base */}
                        <rect
                          x="0"
                          y="0"
                          width={board.sheetLengthCm}
                          height={board.sheetWidthCm}
                          fill="#fef3c7"
                          stroke="#78350f"
                          strokeWidth="0.8"
                        />

                        {/* Piezas Ubicadas */}
                        {board.placedPieces.map((piece, pIdx) => {
                          const pal = piece.furnitureName && furnitureColorMap[piece.furnitureName] 
                            ? furnitureColorMap[piece.furnitureName] 
                            : null;
                          const fillColor = pal ? pal.fill : '#e0e7ff';
                          const strokeColor = pal ? pal.stroke : '#3730a3';

                          return (
                            <g key={piece.id || pIdx}>
                              <rect
                                x={piece.x}
                                y={piece.y}
                                width={piece.lengthCm}
                                height={piece.widthCm}
                                fill={fillColor}
                                stroke={strokeColor}
                                strokeWidth="0.5"
                              />
                              <text
                                x={piece.x + piece.lengthCm / 2}
                                y={piece.y + piece.widthCm / 2 - 1}
                                fontSize={Math.min(5, piece.widthCm / 3, piece.lengthCm / 8)}
                                fontWeight="bold"
                                fill="#0f172a"
                                textAnchor="middle"
                                dominantBaseline="middle"
                              >
                                {piece.name}
                              </text>
                              <text
                                x={piece.x + piece.lengthCm / 2}
                                y={piece.y + piece.widthCm / 2 + 3.5}
                                fontSize={Math.min(4, piece.widthCm / 4, piece.lengthCm / 10)}
                                fill="#334155"
                                textAnchor="middle"
                                dominantBaseline="middle"
                              >
                                {piece.originalLength}×{piece.originalWidth}
                              </text>
                            </g>
                          );
                        })}

                        {/* Sobrantes Útiles */}
                        {board.offcuts && board.offcuts.filter(o => o.isUsable).map((off, oIdx) => (
                          <rect
                            key={off.id || oIdx}
                            x={off.x}
                            y={off.y}
                            width={off.lengthCm}
                            height={off.widthCm}
                            fill="#dcfce7"
                            stroke="#16a34a"
                            strokeWidth="0.5"
                            strokeDasharray="2,2"
                          />
                        ))}
                      </svg>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 3. DESPIECE DETALLADO POR MUEBLE CON ETIQUETAS DE CUBRECANTO */}
          <div className="space-y-4 pt-2">
            <h3 className="text-sm sm:text-base font-black text-slate-900 flex items-center gap-2 uppercase border-b-2 border-slate-300 pb-1">
              <span>📋 LISTA DE DESPIECE Y ETIQUETAS DE CUBRECANTO POR MUEBLE</span>
            </h3>

            {furnitureList.map((unit, uIdx) => (
              <div key={unit.id || uIdx} className="border border-slate-300 rounded-xl overflow-hidden">
                <div className="bg-slate-900 text-white p-2.5 flex items-center justify-between text-xs font-black">
                  <span>
                    Mueble {String.fromCharCode(65 + uIdx)}: {unit.name} ({unit.heightCm} × {unit.widthCm} × {unit.depthCm} cm)
                  </span>
                  <span className="text-slate-300">
                    {unit.cuts.reduce((s, c) => s + (c.quantity || 1), 0)} piezas
                  </span>
                </div>

                <table className="w-full text-xs border-collapse">
                  <thead>
                    <tr className="bg-slate-100 text-slate-800 font-bold border-b border-slate-300">
                      <th className="p-2 text-center w-8">#</th>
                      <th className="p-2 text-left">Pieza</th>
                      <th className="p-2 text-center w-28">Medidas (Largo × Ancho)</th>
                      <th className="p-2 text-center w-12">Cant.</th>
                      <th className="p-2 text-left">Cubrecanto (Cantos a enchapar)</th>
                      <th className="p-2 text-left">Notas / Ubicación</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200">
                    {unit.cuts.map((cut, cIdx) => (
                      <tr key={cut.id || cIdx} className="hover:bg-slate-50">
                        <td className="p-2 text-center font-bold text-slate-500">{cIdx + 1}</td>
                        <td className="p-2 font-bold text-slate-900">{cut.name}</td>
                        <td className="p-2 text-center font-extrabold text-blue-900 bg-blue-50/50">
                          {cut.lengthCm} × {cut.widthCm} cm
                        </td>
                        <td className="p-2 text-center font-black">{cut.quantity || 1}</td>
                        <td className="p-2 text-slate-700">
                          {formatEdgeBanding(cut.edges)}
                        </td>
                        <td className="p-2 text-slate-500 text-[11px]">
                          {cut.notes || '-'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ))}
          </div>

          {/* Firmas de Control de Calidad */}
          <div className="pt-6 border-t-2 border-slate-300 grid grid-cols-2 gap-8 text-xs text-slate-600 text-center">
            <div className="border-t border-slate-400 pt-2">
              <p className="font-bold text-slate-900">Operario de Sierra / Corte</p>
              <p className="text-[10px] text-slate-500">Verificación de dimensiones y escuadras</p>
            </div>
            <div className="border-t border-slate-400 pt-2">
              <p className="font-bold text-slate-900">Armador / Maestro de Taller</p>
              <p className="text-[10px] text-slate-500">Recepción de piezas y verificación de cantos</p>
            </div>
          </div>

        </div>
      </div>

    </div>
  );
};
