import React from 'react';
import { 
  OptimizationResult, 
  FenceGroupedStep, 
  EdgeBanding, 
  PlacedPiece,
  GeneratedOffcut
} from '../types';
import { Printer, X, Download, FileText, Scissors, Check, ZoomIn, ZoomOut, Loader2 } from 'lucide-react';
import { downloadElementAsPdf } from '../utils/pdfExport';

export interface FurniturePalette {
  id: string;
  fill: string;
  fillHover: string;
  stroke: string;
  badgeBg: string;
  badgeText: string;
  textColor: string;
  lightBg: string;
  accentDot: string;
  name: string;
}

interface PdfPreviewModalProps {
  isOpen: boolean;
  mode: 'planos' | 'guia' | null;
  onClose: () => void;
  projectName: string;
  materialType: string;
  thicknessMm: number;
  sheetLengthCm: number;
  sheetWidthCm: number;
  sawKerfMm: number;
  primaryCutDirection: 'largo' | 'ancho';
  optimizationResult: OptimizationResult;
  furnitureColorMap: Record<string, FurniturePalette>;
  assignedOffcuts?: any[];
}

function formatEdges(edges?: EdgeBanding): string {
  if (!edges) return 'Sin cantos';
  const list: string[] = [];
  if (edges.top) list.push('Largo 1');
  if (edges.bottom) list.push('Largo 2');
  if (edges.left) list.push('Ancho 1');
  if (edges.right) list.push('Ancho 2');
  return list.length > 0 ? list.join(', ') : 'Sin cantos';
}

export const PdfPreviewModal: React.FC<PdfPreviewModalProps> = ({
  isOpen,
  mode,
  onClose,
  projectName,
  materialType,
  thicknessMm,
  sheetLengthCm,
  sheetWidthCm,
  sawKerfMm,
  primaryCutDirection,
  optimizationResult,
  furnitureColorMap,
  assignedOffcuts = []
}) => {
  const [zoom, setZoom] = React.useState<number>(100);
  const [printSuccess, setPrintSuccess] = React.useState<boolean>(false);
  const [isDownloadingPdf, setIsDownloadingPdf] = React.useState<boolean>(false);

  if (!isOpen || !mode) return null;

  const dateStr = new Date().toLocaleDateString('es-ES', { 
    day: '2-digit', 
    month: 'long', 
    year: 'numeric' 
  });

  const handleDownloadDirectPdf = async () => {
    const el = document.getElementById('area-impresion-pdf');
    if (!el) {
      window.print();
      return;
    }
    try {
      setIsDownloadingPdf(true);
      const cleanProjectName = (projectName || 'Proyecto').replace(/[^a-zA-Z0-9áéíóúÁÉÍÓÚñÑ_-]/g, '_');
      const filename = `${mode === 'planos' ? 'Planos_2D' : 'Guia_Corte'}_${cleanProjectName}_${new Date().toISOString().slice(0, 10)}.pdf`;
      
      await downloadElementAsPdf(el, {
        filename,
        orientation: mode === 'planos' ? 'landscape' : 'portrait',
        format: 'letter',
        marginMm: [6, 6, 6, 6],
        scale: 2
      });
      setPrintSuccess(true);
      setTimeout(() => setPrintSuccess(false), 3000);
    } catch (err) {
      console.error('Error in direct PDF generation:', err);
      window.print();
    } finally {
      setIsDownloadingPdf(false);
    }
  };

  const handlePrintOrSavePdf = () => {
    setPrintSuccess(true);
    setTimeout(() => {
      window.print();
    }, 150);
    setTimeout(() => setPrintSuccess(false), 4000);
  };

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-slate-900/80 backdrop-blur-sm overflow-hidden animate-fadeIn">
      
      {/* CSS para aislar la hoja en la impresión nativa */}
      <style>{`
        @media print {
          body * {
            visibility: hidden !important;
          }
          #area-impresion-pdf, #area-impresion-pdf * {
            visibility: visible !important;
          }
          #area-impresion-pdf {
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
            size: ${mode === 'planos' ? 'letter landscape' : 'letter portrait'};
            margin: 6mm;
          }
          .page-break-board {
            page-break-after: always;
            break-after: page;
          }
        }
      `}</style>

      {/* Barra de herramientas superior del modal (no se imprime) */}
      <div className="no-print-modal bg-slate-900 border-b border-slate-700 px-4 py-3 flex flex-wrap items-center justify-between gap-4 shadow-xl z-20 text-white">
        <div className="flex items-center gap-3">
          {mode === 'planos' ? (
            <div className="bg-indigo-600 p-2 rounded-xl text-white">
              <FileText className="w-5 h-5" />
            </div>
          ) : (
            <div className="bg-emerald-600 p-2 rounded-xl text-white">
              <Scissors className="w-5 h-5" />
            </div>
          )}
          <div>
            <h3 className="text-base sm:text-lg font-black text-white flex items-center gap-2">
              <span>Vista Previa de Documento PDF:</span>
              <span className="text-amber-400">
                {mode === 'planos' ? 'Planos 2D de Tableros' : 'Guía de Corte Paso a Paso'}
              </span>
            </h3>
            <p className="text-xs font-semibold text-slate-300">
              Proyecto: <strong className="text-white">{projectName}</strong> • {materialType} ({thicknessMm} mm) • Formato Carta listo para guardar o imprimir
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 sm:gap-3">
          {/* Controles de Zoom para previsualización */}
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
            id="btn-descargar-pdf-directo"
            onClick={handleDownloadDirectPdf}
            disabled={isDownloadingPdf}
            className="bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white font-black px-4 py-2.5 rounded-xl shadow-lg border-2 border-emerald-400 flex items-center gap-2 text-xs sm:text-sm cursor-pointer transition transform active:scale-95"
            title="Genera y descarga directamente el archivo PDF de alta resolución"
          >
            {isDownloadingPdf ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin text-white" />
                <span>Generando PDF...</span>
              </>
            ) : printSuccess ? (
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
            onClick={handlePrintOrSavePdf}
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

      {/* Contenedor desplazable con la hoja de previsualización */}
      <div className="flex-1 overflow-y-auto p-4 sm:p-8 flex justify-center bg-slate-950/60">
        <div 
          id="area-impresion-pdf"
          style={{ transform: `scale(${zoom / 100})`, transformOrigin: 'top center' }}
          className={`bg-white text-slate-900 shadow-2xl rounded-2xl p-6 sm:p-10 transition-transform duration-150 ${
            mode === 'planos' ? 'w-full max-w-6xl' : 'w-full max-w-4xl'
          }`}
        >
          {/* ========================================================================= */}
          {/* VISTA 1: PLANOS 2D DE TABLEROS (LANDSCAPE)                                */}
          {/* ========================================================================= */}
          {mode === 'planos' && (
            <div className="space-y-8">
              {/* Encabezado Principal */}
              <div className="border-b-2 border-slate-900 pb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h1 className="text-2xl sm:text-3xl font-black text-slate-950 tracking-tight uppercase">
                    Planos 2D de Tableros — Hoja de Taller
                  </h1>
                  <p className="text-xs sm:text-sm font-bold text-slate-700 mt-1">
                    Proyecto: <span className="text-slate-950 font-extrabold">{projectName}</span> • 
                    Material: <span className="text-slate-950 font-extrabold">{materialType} ({thicknessMm} mm)</span> • 
                    Tablero: <span className="text-slate-950 font-extrabold">{sheetLengthCm} × {sheetWidthCm} cm</span> • 
                    Sierra: <span className="text-slate-950 font-extrabold">{sawKerfMm} mm</span> • 
                    Corte Primario: <span className="text-slate-950 font-extrabold">{primaryCutDirection === 'largo' ? 'A lo Largo' : 'A lo Ancho'}</span>
                  </p>
                </div>
                <div className="text-right text-xs font-bold text-slate-600 shrink-0">
                  <div>Fecha: <strong className="text-slate-900">{dateStr}</strong></div>
                  <div>Total: <strong className="text-slate-900">{optimizationResult.totalSheets} Tableros</strong> • <strong className="text-slate-900">{optimizationResult.totalPieces} Piezas</strong></div>
                  <div className="text-emerald-700 font-extrabold">Aprovechamiento Global: {optimizationResult.overallEfficiencyPercent}%</div>
                </div>
              </div>

              {/* Leyenda de Muebles */}
              <div className="bg-slate-50 border border-slate-300 rounded-xl p-3 flex flex-wrap items-center gap-2">
                <span className="text-xs font-black uppercase text-slate-900 tracking-wide mr-2">
                  🎨 Código de Muebles:
                </span>
                {(Object.entries(furnitureColorMap) as [string, FurniturePalette][]).map(([fName, pal]) => (
                  <span
                    key={fName}
                    style={{ backgroundColor: pal.fill, borderColor: pal.stroke, color: pal.textColor }}
                    className="text-xs font-black px-2.5 py-1 rounded-lg border flex items-center gap-1.5 shadow-xs"
                  >
                    <span 
                      style={{ backgroundColor: pal.badgeBg }} 
                      className="w-2.5 h-2.5 rounded-full" 
                    />
                    {fName}
                  </span>
                ))}
              </div>

              {/* Tableros Vectoriales */}
              {optimizationResult.boards.map((board) => (
                <div key={board.boardIndex} className="page-break-board space-y-4 pt-4 border-t border-slate-200 first:border-t-0 first:pt-0">
                  <div className="bg-slate-100 border border-slate-300 rounded-xl p-3 flex items-center justify-between">
                    <div>
                      <h2 className="text-lg font-black text-slate-900">
                        Tablero #{board.boardIndex} de {optimizationResult.totalSheets}
                      </h2>
                      <p className="text-xs font-bold text-slate-600">
                        Dimensión: {board.sheetLengthCm} × {board.sheetWidthCm} cm • 
                        Aprovechamiento: <strong className="text-emerald-700">{board.efficiencyPercent}%</strong> • 
                        Piezas: <strong>{board.placedPieces.length}</strong> • 
                        Desperdicio: <strong>{board.wastePercent}%</strong>
                      </p>
                    </div>
                    <span className="bg-slate-900 text-white text-xs font-black px-3 py-1.5 rounded-lg">
                      Tablero {board.boardIndex}/{optimizationResult.totalSheets}
                    </span>
                  </div>

                  {/* SVG Vectorial */}
                  <div className="w-full border-2 border-slate-800 rounded-xl bg-white p-2 flex justify-center shadow-xs">
                    <svg
                      viewBox={`0 0 ${board.sheetLengthCm} ${board.sheetWidthCm}`}
                      preserveAspectRatio="xMidYMid meet"
                      className="w-full h-auto max-h-[420px]"
                    >
                      {/* Fondo del tablero */}
                      <rect
                        x={0}
                        y={0}
                        width={board.sheetLengthCm}
                        height={board.sheetWidthCm}
                        fill="#ffffff"
                        stroke="#0f172a"
                        strokeWidth="1.2"
                      />

                      {/* Sobrantes / Retazos */}
                      {board.offcuts.map((off, oIdx) => (
                        <g key={off.id || oIdx}>
                          <rect
                            x={off.x}
                            y={off.y}
                            width={off.lengthCm}
                            height={off.widthCm}
                            fill={off.isUsable ? '#ecfdf5' : '#f8fafc'}
                            stroke={off.isUsable ? '#10b981' : '#cbd5e1'}
                            strokeWidth="0.8"
                            strokeDasharray={off.isUsable ? '3,1.5' : '1.5,1.5'}
                          />
                          {off.lengthCm >= 16 && off.widthCm >= 10 && (
                            <text
                              x={off.x + (off.lengthCm / 2)}
                              y={off.y + (off.widthCm / 2)}
                              textAnchor="middle"
                              dominantBaseline="middle"
                              fontSize="2.4"
                              fontWeight="bold"
                              fill={off.isUsable ? '#047857' : '#94a3b8'}
                            >
                              {off.isUsable ? '♻️ Retazo Útil' : 'Desperdicio'} ({off.lengthCm}×{off.widthCm})
                            </text>
                          )}
                        </g>
                      ))}

                      {/* Piezas Ubicadas */}
                      {board.placedPieces.map((piece) => {
                        const pal = furnitureColorMap[piece.furnitureName || ''] || {
                          fill: '#f1f5f9',
                          stroke: '#475569',
                          badgeBg: '#334155',
                          badgeText: '#ffffff',
                          textColor: '#0f172a'
                        };

                        const isLarge = piece.lengthCm >= 14 && piece.widthCm >= 8;
                        const isMedium = piece.lengthCm >= 8 && piece.widthCm >= 5;

                        return (
                          <g key={piece.id}>
                            <rect
                              x={piece.x}
                              y={piece.y}
                              width={piece.lengthCm}
                              height={piece.widthCm}
                              fill={pal.fill}
                              stroke={pal.stroke}
                              strokeWidth="0.8"
                            />

                            {/* Líneas de cubrecantos */}
                            {piece.edges?.top && <line x1={piece.x} y1={piece.y} x2={piece.x + piece.lengthCm} y2={piece.y} stroke="#059669" strokeWidth="2.2" />}
                            {piece.edges?.bottom && <line x1={piece.x} y1={piece.y + piece.widthCm} x2={piece.x + piece.lengthCm} y2={piece.y + piece.widthCm} stroke="#059669" strokeWidth="2.2" />}
                            {piece.edges?.left && <line x1={piece.x} y1={piece.y} x2={piece.x} y2={piece.y + piece.widthCm} stroke="#059669" strokeWidth="2.2" />}
                            {piece.edges?.right && <line x1={piece.x + piece.lengthCm} y1={piece.y} x2={piece.x + piece.lengthCm} y2={piece.y + piece.widthCm} stroke="#059669" strokeWidth="2.2" />}

                            {/* Badge Mueble */}
                            {isLarge && (
                              <>
                                <rect
                                  x={piece.x + (piece.lengthCm / 2) - Math.min(piece.lengthCm * 0.42, 24)}
                                  y={piece.y + 1.8}
                                  width={Math.min(piece.lengthCm * 0.84, 48)}
                                  height="3.8"
                                  rx="0.8"
                                  fill={pal.badgeBg}
                                />
                                <text
                                  x={piece.x + (piece.lengthCm / 2)}
                                  y={piece.y + 3.8}
                                  textAnchor="middle"
                                  dominantBaseline="middle"
                                  fontSize="2.2"
                                  fontWeight="bold"
                                  fill={pal.badgeText}
                                >
                                  [{piece.furnitureName || 'Mueble'}]
                                </text>
                              </>
                            )}

                            {/* Nombre de la pieza y medida */}
                            {isMedium ? (
                              <>
                                <text
                                  x={piece.x + (piece.lengthCm / 2)}
                                  y={piece.y + (piece.widthCm / 2) - (isLarge ? 0.6 : 0)}
                                  textAnchor="middle"
                                  dominantBaseline="middle"
                                  fontSize={isLarge ? '3.0' : '2.2'}
                                  fontWeight="bold"
                                  fill={pal.textColor}
                                >
                                  {piece.name}
                                </text>
                                <text
                                  x={piece.x + (piece.lengthCm / 2)}
                                  y={piece.y + (piece.widthCm / 2) + 3.2}
                                  textAnchor="middle"
                                  dominantBaseline="middle"
                                  fontSize="2.4"
                                  fontWeight="bold"
                                  fill="#334155"
                                >
                                  {piece.lengthCm} × {piece.widthCm} cm
                                </text>
                              </>
                            ) : (
                              <text
                                x={piece.x + (piece.lengthCm / 2)}
                                y={piece.y + (piece.widthCm / 2)}
                                textAnchor="middle"
                                dominantBaseline="middle"
                                fontSize="2.0"
                                fontWeight="bold"
                                fill={pal.textColor}
                              >
                                {piece.lengthCm}×{piece.widthCm}
                              </text>
                            )}
                          </g>
                        );
                      })}
                    </svg>
                  </div>

                  {/* Tabla de Piezas: Fondo Blanco Puro y Alto Contraste para Máxima Legibilidad */}
                  <div className="mt-3">
                    <h3 className="text-xs font-black uppercase text-slate-900 mb-2">
                      Lista de Piezas en este Tablero:
                    </h3>
                    <table className="w-full text-xs border-collapse border border-slate-400 bg-white">
                      <thead>
                        <tr className="bg-slate-100 text-slate-950 font-black border-b-2 border-slate-400">
                          <th className="border border-slate-300 p-2.5 text-center w-12 text-slate-950">#</th>
                          <th className="border border-slate-300 p-2.5 text-left text-slate-950">Mueble / Nombre de Pieza</th>
                          <th className="border border-slate-300 p-2.5 text-center w-36 text-slate-950">Medida (Largo × Ancho)</th>
                          <th className="border border-slate-300 p-2.5 text-center w-24 text-slate-950">Espesor</th>
                          <th className="border border-slate-300 p-2.5 text-left text-slate-950">Cantos a Aplicar</th>
                        </tr>
                      </thead>
                      <tbody className="bg-white">
                        {board.placedPieces.map((p, pIdx) => (
                          <tr key={p.id} className="bg-white border-b border-slate-300 hover:bg-slate-50">
                            <td className="border border-slate-300 p-2.5 text-center font-black text-slate-950 bg-slate-50/70">
                              {pIdx + 1}
                            </td>
                            <td className="border border-slate-300 p-2.5 bg-white text-slate-950">
                              <strong className="text-blue-900 font-extrabold mr-1.5">
                                [{p.furnitureName || 'Mueble'}]
                              </strong> 
                              <span className="font-bold text-slate-950">{p.name}</span>
                            </td>
                            <td className="border border-slate-300 p-2.5 text-center font-black text-slate-950 bg-white">
                              {p.lengthCm} × {p.widthCm} cm
                            </td>
                            <td className="border border-slate-300 p-2.5 text-center font-bold text-slate-950 bg-white">
                              {thicknessMm} mm
                            </td>
                            <td className="border border-slate-300 p-2.5 font-semibold text-slate-950 bg-white">
                              {formatEdges(p.edges)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* ========================================================================= */}
          {/* VISTA 2: GUÍA DE CORTE PASO A PASO (PORTRAIT)                             */}
          {/* ========================================================================= */}
          {mode === 'guia' && (
            <div className="space-y-6">
              {/* Encabezado Principal */}
              <div className="border-b-2 border-slate-900 pb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h1 className="text-2xl sm:text-3xl font-black text-slate-950 tracking-tight uppercase">
                    Guía de Corte Paso a Paso — Secuencia Maestra
                  </h1>
                  <p className="text-xs sm:text-sm font-bold text-slate-700 mt-1">
                    Proyecto: <span className="text-slate-950 font-extrabold">{projectName}</span> • 
                    Material: <span className="text-slate-950 font-extrabold">{materialType} ({thicknessMm} mm)</span> • 
                    Tablero: <span className="text-slate-950 font-extrabold">{sheetLengthCm} × {sheetWidthCm} cm</span> • 
                    Sierra: <span className="text-slate-950 font-extrabold">{sawKerfMm} mm</span>
                  </p>
                </div>
                <div className="text-right text-xs font-bold text-slate-600 shrink-0">
                  <div>Fecha: <strong className="text-slate-900">{dateStr}</strong></div>
                  <div>Total: <strong className="text-slate-900">{optimizationResult.totalSheets} Tableros</strong> • <strong className="text-slate-900">{optimizationResult.totalPieces} Piezas</strong></div>
                </div>
              </div>

              {/* Caja de Instrucciones */}
              <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 text-xs font-bold text-amber-900 flex items-center justify-between">
                <span>⚙️ <strong>Modo Taller:</strong> Ajusta la regla de sierra al valor indicado y corta todas las tiras agrupadas antes de mover la regla.</span>
                <span>✏️ Marca con lápiz cada tira (ej. <strong>T-1</strong>).</span>
              </div>

              {/* PASO 1 PRIORITARIO: PEDACERÍA DE ALMACÉN (SI EXISTE) */}
              {assignedOffcuts && assignedOffcuts.length > 0 && (
                <div className="border-2 border-amber-800 rounded-xl overflow-hidden shadow-xs">
                  <div className="bg-amber-900 text-white p-3 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <span className="bg-amber-400 text-amber-950 font-black text-xs px-2.5 py-1 rounded-md">
                        PASO 1 PRIMORDIAL
                      </span>
                      <span className="text-sm font-bold">
                        📌 Extraer y Cortar Piezas de Pedacería en Almacén ({assignedOffcuts.length} piezas)
                      </span>
                    </div>
                    <span className="text-xs font-black text-amber-200">
                      Prioridad Máxima
                    </span>
                  </div>

                  <div className="p-3 bg-white space-y-2">
                    <table className="w-full text-xs border-collapse border border-slate-300">
                      <thead>
                        <tr className="bg-amber-100 text-slate-900 font-black">
                          <th className="border border-slate-300 p-2 text-center w-10">#</th>
                          <th className="border border-slate-300 p-2 text-left">Mueble / Pieza</th>
                          <th className="border border-slate-300 p-2 text-center w-28">Medida Pieza</th>
                          <th className="border border-slate-300 p-2 text-left">Retazo Origen</th>
                          <th className="border border-slate-300 p-2 text-left">Sentido y Remanente</th>
                        </tr>
                      </thead>
                      <tbody>
                        {assignedOffcuts.map((off, oIdx) => (
                          <tr key={off.offcutId || oIdx} className="border-b border-slate-200">
                            <td className="border border-slate-300 p-2 text-center font-bold">{oIdx + 1}</td>
                            <td className="border border-slate-300 p-2">
                              <strong>[{off.furnitureName || 'Mueble'}]</strong> {off.pieceName}
                            </td>
                            <td className="border border-slate-300 p-2 text-center font-black text-blue-900">
                              {off.usedLengthCm} × {off.usedWidthCm} cm
                            </td>
                            <td className="border border-slate-300 p-2 text-slate-700 font-semibold">
                              {off.offcutLabel || `Retazo #${off.offcutNumber}`} ({off.originalLengthCm} × {off.originalWidthCm} cm)
                            </td>
                            <td className="border border-slate-300 p-2 text-slate-700 text-[11px]">
                              {off.cutDirection === 'longitudinal' ? 'Longitudinal' : 'Transversal'} • Sobrante: {off.remainingLengthCm} × {off.remainingWidthCm} cm
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* Grupos de Regla en Hojas Nuevas */}
              {optimizationResult.fenceGroupedSteps.map((group, gIdx) => (
                <div key={gIdx} className="border-2 border-slate-800 rounded-xl overflow-hidden shadow-xs">
                  {/* Banner de Posición de Regla */}
                  <div className="bg-slate-900 text-white p-3 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <span className="bg-amber-400 text-amber-950 font-black text-xs px-2.5 py-1 rounded-md">
                        {assignedOffcuts && assignedOffcuts.length > 0 ? `PASO 2.${gIdx + 1}` : `PASO ${gIdx + 1}`}
                      </span>
                      <span className="text-sm font-bold">
                        Ajustar Regla de Sierra a: <strong className="text-amber-300 text-base underline">{group.fenceMeasureCm} cm</strong>
                      </span>
                    </div>
                    <span className="text-xs font-black text-slate-300">
                      {group.totalStrips} {group.totalStrips === 1 ? 'Tira' : 'Tiras'} en total
                    </span>
                  </div>

                  {/* Tiras y Cortes */}
                  <div className="p-3 space-y-3 bg-white">
                    {group.strips.map((step, sIdx) => (
                      <div key={step.stripId || sIdx} className="border border-slate-200 rounded-lg overflow-hidden">
                        <div className="bg-slate-50 px-3 py-2 border-b border-slate-200 flex items-center justify-between text-xs">
                          <div className="flex items-center gap-2">
                            <span className="bg-sky-100 text-sky-900 font-black px-2 py-0.5 rounded border border-sky-300">
                              Marca: {step.pencilMark}
                            </span>
                            <span className="font-bold text-slate-800">
                              Extraer en Tablero #{step.boardIndex}
                            </span>
                            <span className="text-slate-500 font-semibold">
                              (Tira: {step.stripLengthCm} × {step.stripWidthCm} cm)
                            </span>
                          </div>
                          <span className="font-bold text-slate-700">
                            {step.individualCuts.length} {step.individualCuts.length === 1 ? 'Pieza' : 'Piezas'}
                          </span>
                        </div>

                        {/* Tabla de Cortes de la Tira: Fondo Blanco y Texto Nítido */}
                        <table className="w-full text-xs border-collapse border border-slate-300 bg-white">
                          <thead>
                            <tr className="bg-slate-100 text-slate-950 font-black border-b-2 border-slate-300 text-left">
                              <th className="p-2.5 border border-slate-300 w-12 text-center text-slate-950">#</th>
                              <th className="p-2.5 border border-slate-300 w-40 text-slate-950">Tope de Sierra (Medida)</th>
                              <th className="p-2.5 border border-slate-300 text-slate-950">Mueble y Pieza</th>
                              <th className="p-2.5 border border-slate-300 w-36 text-center text-slate-950">Medida Final</th>
                              <th className="p-2.5 border border-slate-300 text-slate-950">Cantos</th>
                              <th className="p-2.5 border border-slate-300 w-14 text-center text-slate-950">Listo</th>
                            </tr>
                          </thead>
                          <tbody className="bg-white">
                            {step.individualCuts.map((cut, cIdx) => {
                              const pal = furnitureColorMap[cut.furnitureName || ''] || {
                                badgeBg: '#334155',
                                badgeText: '#ffffff'
                              };

                              return (
                                <tr key={cIdx} className="bg-white border-b border-slate-300 hover:bg-slate-50">
                                  <td className="p-2.5 border border-slate-300 text-center font-black text-slate-950 bg-slate-50/70">{cIdx + 1}</td>
                                  <td className="p-2.5 border border-slate-300 font-black text-emerald-800 text-sm bg-white">
                                    {cut.cutMeasureCm} cm
                                  </td>
                                  <td className="p-2.5 border border-slate-300 bg-white">
                                    <span 
                                      style={{ backgroundColor: pal.badgeBg, color: pal.badgeText }}
                                      className="text-[10px] font-black px-1.5 py-0.5 rounded mr-1.5 inline-block"
                                    >
                                      [{cut.furnitureName || 'Mueble'}]
                                    </span>
                                    <strong className="text-slate-950 font-bold">{cut.name}</strong>
                                  </td>
                                  <td className="p-2.5 border border-slate-300 text-center font-black text-slate-950 bg-white">
                                    {cut.lengthCm} × {cut.widthCm} cm
                                  </td>
                                  <td className="p-2.5 border border-slate-300 text-slate-950 font-semibold bg-white">{formatEdges(cut.edges)}</td>
                                  <td className="p-2.5 border border-slate-300 text-center bg-white">
                                    <div className="w-4 h-4 border-2 border-slate-800 rounded mx-auto" />
                                  </td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

