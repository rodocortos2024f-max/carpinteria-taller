import { OptimizationResult, OptimizedBoard, FenceGroupedStep, StripCuttingStep, EdgeBanding, WoodCut, Project } from '../types';
// @ts-ignore
import html2pdf from 'html2pdf.js';

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

export interface DirectPdfOptions {
  filename?: string;
  marginMm?: number | [number, number, number, number];
  orientation?: 'portrait' | 'landscape';
  format?: 'letter' | 'a4';
  scale?: number;
}

/**
 * Sanitiza cualquier texto CSS reemplazando funciones de color modernas no soportadas por html2canvas
 * como oklch(...), oklab(...), color-mix(...) y variables dinámicas por valores estándar RGB/HEX.
 */
export function sanitizeCssColors(cssText: string): string {
  if (!cssText) return cssText;
  return cssText
    .replace(/oklch\([^)]+\)/gi, (match) => {
      const lower = match.toLowerCase();
      if (lower.includes('1 ') || lower.includes('0.9') || lower.includes('100%') || lower.includes('95%') || lower.includes('98%')) return '#ffffff';
      if (lower.includes('0 ') || lower.includes('0.1') || lower.includes('0.05') || lower.includes('10%')) return '#0f172a';
      if (lower.includes('emerald') || lower.includes('150') || lower.includes('160')) return '#059669';
      return '#334155';
    })
    .replace(/oklab\([^)]+\)/gi, (match) => {
      const lower = match.toLowerCase();
      if (lower.includes('1 ') || lower.includes('0.9') || lower.includes('100%')) return '#ffffff';
      if (lower.includes('0 ') || lower.includes('0.1')) return '#0f172a';
      return '#334155';
    })
    .replace(/color-mix\([^)]+\)/gi, '#1e293b')
    .replace(/lab\([^)]+\)/gi, '#334155')
    .replace(/lch\([^)]+\)/gi, '#334155');
}

/**
 * Descarga directamente un elemento del DOM como archivo PDF de alta resolución,
 * forzando un esquema de impresión de alto contraste en blanco y negro puro,
 * eliminando fondos oscuros, incompatibilidades de color CSS (oklab / oklch)
 * e ignorando todos los elementos interactivos (.no-print, .no-pdf, etc.)
 */
export async function downloadElementAsPdf(
  element: HTMLElement,
  options: DirectPdfOptions = {}
): Promise<void> {
  const filename = options.filename || 'documento.pdf';
  const orientation = options.orientation || 'portrait';
  const format = options.format || 'letter';
  const margin = options.marginMm !== undefined ? options.marginMm : [6, 6, 6, 6];

  // 1. Esperar a que las fuentes y recursos gráficos estén 100% listos y estabilizados
  if (typeof document !== 'undefined' && 'fonts' in document && document.fonts?.ready) {
    try {
      await document.fonts.ready;
    } catch {
      // ignore
    }
  }
  await new Promise(resolve => setTimeout(resolve, 200));

  const opt = {
    margin: margin,
    filename: filename,
    image: { type: 'jpeg', quality: 0.98 },
    html2canvas: {
      scale: options.scale || 2,
      useCORS: true,
      letterRendering: true,
      logging: false,
      backgroundColor: '#ffffff',
      onclone: (clonedDoc: Document) => {
        try {
          // 1. Desactivar modo oscuro y forzar fondo blanco en HTML y Body
          clonedDoc.documentElement.classList.remove('dark');
          clonedDoc.body.classList.remove('dark');
          clonedDoc.documentElement.style.backgroundColor = '#ffffff';
          clonedDoc.documentElement.style.colorScheme = 'light';
          clonedDoc.body.style.backgroundColor = '#ffffff';
          clonedDoc.body.style.color = '#0f172a';

          // 2. Sanitizar todas las etiquetas <style> para remover oklch / oklab que inyecta Tailwind v4
          const styleTags = clonedDoc.querySelectorAll('style');
          styleTags.forEach(styleTag => {
            if (styleTag.textContent) {
              styleTag.textContent = sanitizeCssColors(styleTag.textContent);
            }
          });

          // 3. Sanitizar hojas de estilo o remover estilos externos problemáticos
          const linkTags = clonedDoc.querySelectorAll('link[rel="stylesheet"]');
          linkTags.forEach(link => {
            try {
              const href = link.getAttribute('href') || '';
              if (href.includes('fonts.googleapis') === false) {
                // mantener fuentes pero aislar reglas
              }
            } catch (e) {
              // ignore
            }
          });

          // 4. Localizar el contenedor clonado y remover transformaciones (zoom, scale, overflow)
          const targetIds = ['quotation-print-sheet', 'edgebanding-print-sheet', 'area-impresion-pdf', 'workshop-print-sheet'];
          targetIds.forEach(id => {
            const targetEl = clonedDoc.getElementById(id);
            if (targetEl) {
              targetEl.style.transform = 'none';
              targetEl.style.transformOrigin = 'unset';
              targetEl.style.backgroundColor = '#ffffff';
              targetEl.style.color = '#0f172a';
              targetEl.style.boxShadow = 'none';
              targetEl.style.border = 'none';
              targetEl.style.borderRadius = '0';
              targetEl.style.width = '100%';
              targetEl.style.maxWidth = '100%';
              targetEl.style.margin = '0';
              targetEl.style.padding = '16px';
              targetEl.style.overflow = 'visible';
              targetEl.style.height = 'auto';
              targetEl.style.maxHeight = 'none';
            }
          });

          // 5. Eliminar explícitamente elementos ignorados
          const ignoredElements = clonedDoc.querySelectorAll(
            '.no-print, .no-pdf, .no-print-modal, [data-no-print="true"], [data-html2canvas-ignore="true"]'
          );
          ignoredElements.forEach(el => el.remove());

          // 6. Convertir inputs a texto plano para evitar artefactos de renderizado de inputs
          const inputs = clonedDoc.querySelectorAll('input');
          inputs.forEach(inputEl => {
            if (inputEl.type === 'checkbox' || inputEl.type === 'radio') {
              inputEl.remove();
              return;
            }
            const textSpan = clonedDoc.createElement('span');
            textSpan.textContent = inputEl.value;
            textSpan.className = inputEl.className || '';
            textSpan.style.color = '#000000';
            textSpan.style.fontWeight = 'bold';
            textSpan.style.fontSize = 'inherit';
            textSpan.style.lineHeight = '1.5';
            textSpan.style.display = 'inline-block';
            textSpan.style.backgroundColor = 'transparent';
            textSpan.style.border = 'none';
            inputEl.parentNode?.replaceChild(textSpan, inputEl);
          });

          // 7. Recorrer todos los elementos para eliminar overflow hidden, alturas fijas y forzar esquema limpio
          const allElements = clonedDoc.querySelectorAll('*');
          allElements.forEach((el) => {
            const htmlEl = el as HTMLElement;
            if (!htmlEl || !htmlEl.style) return;

            // Eliminar overflow oculto y alturas fijas restrictivas
            htmlEl.style.overflow = 'visible';
            if (htmlEl.style.maxHeight && htmlEl.style.maxHeight !== 'none') {
              htmlEl.style.maxHeight = 'none';
            }

            // Sanitizar atributo style inline
            const styleAttr = htmlEl.getAttribute('style');
            if (styleAttr && (styleAttr.includes('oklch') || styleAttr.includes('oklab') || styleAttr.includes('color-mix') || styleAttr.includes('lab') || styleAttr.includes('lch'))) {
              htmlEl.setAttribute('style', sanitizeCssColors(styleAttr));
            }

            const className = htmlEl.className || '';
            const classStr = typeof className === 'string' ? className : '';

            // A. Convertir bloques oscuros a tarjetas claras con fondo blanco y borde limpio
            if (
              classStr.includes('bg-slate-900') ||
              classStr.includes('bg-slate-950') ||
              classStr.includes('bg-emerald-950') ||
              classStr.includes('bg-emerald-900') ||
              classStr.includes('bg-slate-800')
            ) {
              htmlEl.style.backgroundColor = '#ffffff';
              htmlEl.style.borderColor = '#cbd5e1';
              htmlEl.style.color = '#000000';
            }

            // B. Convertir textos blancos o claros a negro
            if (
              classStr.includes('text-white') ||
              classStr.includes('text-slate-100') ||
              classStr.includes('text-slate-200') ||
              classStr.includes('text-slate-300') ||
              classStr.includes('text-emerald-100') ||
              classStr.includes('text-emerald-200') ||
              classStr.includes('text-emerald-300') ||
              classStr.includes('text-amber-200') ||
              classStr.includes('text-amber-300')
            ) {
              htmlEl.style.color = '#000000';
            }

            // C. Encabezados de tabla
            if (htmlEl.tagName === 'TH') {
              htmlEl.style.backgroundColor = '#f8fafc';
              htmlEl.style.color = '#000000';
              htmlEl.style.borderColor = '#cbd5e1';
              htmlEl.style.borderWidth = '1px';
              htmlEl.style.borderStyle = 'solid';
              htmlEl.style.paddingTop = '10px';
              htmlEl.style.paddingBottom = '10px';
              htmlEl.style.lineHeight = '1.4';
            }

            // D. Celdas de tabla
            if (htmlEl.tagName === 'TD') {
              htmlEl.style.backgroundColor = '#ffffff';
              htmlEl.style.color = '#000000';
              htmlEl.style.borderColor = '#e2e8f0';
              htmlEl.style.borderWidth = '1px';
              htmlEl.style.borderStyle = 'solid';
              htmlEl.style.paddingTop = '10px';
              htmlEl.style.paddingBottom = '10px';
              htmlEl.style.lineHeight = '1.4';
            }
          });

          // 8. Inyectar hoja de estilo de reseteo con colores HEX y alto contraste garantizados
          const overrideStyle = clonedDoc.createElement('style');
          overrideStyle.id = 'pdf-forced-print-styles';
          overrideStyle.textContent = `
            * {
              box-sizing: border-box !important;
              -webkit-print-color-adjust: exact !important;
              print-color-adjust: exact !important;
              color-scheme: light !important;
              overflow: visible !important;
            }
            html, body {
              background-color: #ffffff !important;
              color: #000000 !important;
              font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif !important;
            }
            body, .pdf-root, #area-impresion-pdf, #quotation-print-sheet, #edgebanding-print-sheet, #workshop-print-sheet {
              background-color: #ffffff !important;
              color: #000000 !important;
              box-shadow: none !important;
              border: none !important;
              height: auto !important;
              max-height: none !important;
              padding: 12px !important;
            }
            h1, h2, h3, h4, h5, h6, p, span, div, strong, b, label {
              color: #000000 !important;
              line-height: 1.5 !important;
            }
            table {
              background-color: #ffffff !important;
              border-collapse: collapse !important;
              width: 100% !important;
              border: 1px solid #cbd5e1 !important;
              height: auto !important;
            }
            tr {
              height: auto !important;
              max-height: none !important;
              background-color: #ffffff !important;
            }
            thead th, th {
              background-color: #f8fafc !important;
              color: #000000 !important;
              font-weight: 800 !important;
              border: 1px solid #cbd5e1 !important;
              padding: 10px 8px !important;
              line-height: 1.4 !important;
            }
            tbody td, td {
              background-color: #ffffff !important;
              color: #000000 !important;
              border: 1px solid #e2e8f0 !important;
              padding: 10px 8px !important;
              line-height: 1.4 !important;
            }
            tbody tr:nth-child(even) td {
              background-color: #fafbfc !important;
            }
            td span, td div {
              background-color: transparent !important;
              border-color: transparent !important;
              color: #000000 !important;
              box-shadow: none !important;
            }
            .metric-box, [class*="bg-emerald-50"], [class*="bg-slate-50"], [class*="bg-sky-50"] {
              background-color: #ffffff !important;
              border: 1px solid #cbd5e1 !important;
              color: #000000 !important;
              height: auto !important;
            }
            .edge-indicator, [class*="bg-emerald-100"], [class*="bg-teal-100"], [class*="bg-sky-100"] {
              background-color: transparent !important;
              border: none !important;
              color: #000000 !important;
              font-weight: 700 !important;
            }
            .check-square {
              width: 14px !important;
              height: 14px !important;
              border: 1.5px solid #000000 !important;
              background-color: #ffffff !important;
            }
          `;
          clonedDoc.head.appendChild(overrideStyle);
        } catch (e) {
          console.warn('Advertencia en sanitización de clone PDF:', e);
        }
      },
      ignoreElements: (el: Element) => {
        return (
          el.classList?.contains('no-print') ||
          el.classList?.contains('no-pdf') ||
          el.classList?.contains('no-print-modal') ||
          el.getAttribute('data-no-print') === 'true' ||
          el.getAttribute('data-html2canvas-ignore') === 'true'
        );
      }
    },
    jsPDF: {
      unit: 'mm',
      format: format,
      orientation: orientation,
      compress: true
    },
    pagebreak: { mode: ['avoid-all', 'css', 'legacy'] }
  };

  // @ts-ignore
  await html2pdf().set(opt).from(element).save();
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

/**
 * Imprime un documento HTML limpio a través de un iframe aislado (inmune a bloqueadores de popups)
 */
function printHtmlDocument(htmlContent: string): void {
  // Crear iframe invisible
  const iframe = document.createElement('iframe');
  iframe.style.position = 'fixed';
  iframe.style.right = '0';
  iframe.style.bottom = '0';
  iframe.style.width = '0';
  iframe.style.height = '0';
  iframe.style.border = '0';
  document.body.appendChild(iframe);

  const doc = iframe.contentWindow?.document || iframe.contentDocument;
  if (doc) {
    doc.open();
    doc.write(htmlContent);
    doc.close();

    // Esperar renderizado y ejecutar impresión nativa
    setTimeout(() => {
      try {
        iframe.contentWindow?.focus();
        iframe.contentWindow?.print();
      } catch (err) {
        console.warn('Fallo impresión desde iframe, intentando ventana nueva:', err);
        const win = window.open('', '_blank');
        if (win) {
          win.document.write(htmlContent);
          win.document.close();
          win.focus();
          setTimeout(() => win.print(), 300);
        }
      } finally {
        setTimeout(() => {
          if (iframe.parentNode) iframe.parentNode.removeChild(iframe);
        }, 3000);
      }
    }, 350);
  } else {
    // Respaldo ventana emergente
    const win = window.open('', '_blank');
    if (win) {
      win.document.write(htmlContent);
      win.document.close();
      win.focus();
      setTimeout(() => win.print(), 300);
    }
  }
}

/**
 * 1. Genera e imprime la vista limpia de PLANOS 2D DE TABLEROS (Orientación Horizontal)
 */
export function printPlanos2DPdf(params: {
  projectName: string;
  materialType: string;
  thicknessMm: number;
  sheetLengthCm: number;
  sheetWidthCm: number;
  sawKerfMm: number;
  primaryCutDirection: 'largo' | 'ancho';
  optimizationResult: OptimizationResult;
  furnitureColorMap: Record<string, FurniturePalette>;
}): void {
  const {
    projectName,
    materialType,
    thicknessMm,
    sheetLengthCm,
    sheetWidthCm,
    sawKerfMm,
    primaryCutDirection,
    optimizationResult,
    furnitureColorMap
  } = params;

  const dateStr = new Date().toLocaleDateString('es-ES', { day: '2-digit', month: 'long', year: 'numeric' });

  // Generar HTML de cada tablero
  const boardsHtml = optimizationResult.boards.map((board) => {
    // Generar piezas SVG
    const svgPieces = board.placedPieces.map((piece) => {
      const pal = furnitureColorMap[piece.furnitureName || ''] || {
        fill: '#f1f5f9',
        stroke: '#475569',
        badgeBg: '#334155',
        badgeText: '#ffffff',
        textColor: '#0f172a'
      };

      const isLarge = piece.lengthCm >= 14 && piece.widthCm >= 8;
      const isMedium = piece.lengthCm >= 8 && piece.widthCm >= 5;

      return `
        <g class="piece-group">
          <!-- Rectángulo de la pieza -->
          <rect
            x="${piece.x}"
            y="${piece.y}"
            width="${piece.lengthCm}"
            height="${piece.widthCm}"
            fill="${pal.fill}"
            stroke="${pal.stroke}"
            stroke-width="0.8"
          />
          
          <!-- Líneas de cubrecantos si aplican -->
          ${piece.edges?.top ? `<line x1="${piece.x}" y1="${piece.y}" x2="${piece.x + piece.lengthCm}" y2="${piece.y}" stroke="#059669" stroke-width="2.2"/>` : ''}
          ${piece.edges?.bottom ? `<line x1="${piece.x}" y1="${piece.y + piece.widthCm}" x2="${piece.x + piece.lengthCm}" y2="${piece.y + piece.widthCm}" stroke="#059669" stroke-width="2.2"/>` : ''}
          ${piece.edges?.left ? `<line x1="${piece.x}" y1="${piece.y}" x2="${piece.x}" y2="${piece.y + piece.widthCm}" stroke="#059669" stroke-width="2.2"/>` : ''}
          ${piece.edges?.right ? `<line x1="${piece.x + piece.lengthCm}" y1="${piece.y}" x2="${piece.x + piece.lengthCm}" y2="${piece.y + piece.widthCm}" stroke="#059669" stroke-width="2.2"/>` : ''}

          <!-- Badge con Nombre del Mueble -->
          ${isLarge ? `
            <rect
              x="${piece.x + (piece.lengthCm / 2) - Math.min(piece.lengthCm * 0.42, 24)}"
              y="${piece.y + 1.8}"
              width="${Math.min(piece.lengthCm * 0.84, 48)}"
              height="3.8"
              rx="0.8"
              fill="${pal.badgeBg}"
            />
            <text
              x="${piece.x + (piece.lengthCm / 2)}"
              y="${piece.y + 3.8}"
              text-anchor="middle"
              dominant-baseline="middle"
              font-size="2.2"
              font-weight="bold"
              fill="${pal.badgeText}"
            >[${piece.furnitureName || 'Mueble'}]</text>
          ` : ''}

          <!-- Nombre de la pieza -->
          ${isMedium ? `
            <text
              x="${piece.x + (piece.lengthCm / 2)}"
              y="${piece.y + (piece.widthCm / 2) - (isLarge ? 0.6 : 0)}"
              text-anchor="middle"
              dominant-baseline="middle"
              font-size="${isLarge ? '3.0' : '2.2'}"
              font-weight="bold"
              fill="${pal.textColor}"
            >${piece.name}</text>
            
            <text
              x="${piece.x + (piece.lengthCm / 2)}"
              y="${piece.y + (piece.widthCm / 2) + 3.2}"
              text-anchor="middle"
              dominant-baseline="middle"
              font-size="2.4"
              font-weight="bold"
              fill="#334155"
            >${piece.lengthCm} × ${piece.widthCm} cm</text>
          ` : `
            <text
              x="${piece.x + (piece.lengthCm / 2)}"
              y="${piece.y + (piece.widthCm / 2)}"
              text-anchor="middle"
              dominant-baseline="middle"
              font-size="2.0"
              font-weight="bold"
              fill="${pal.textColor}"
            >${piece.lengthCm}×${piece.widthCm}</text>
          `}
        </g>
      `;
    }).join('');

    // Sobrantes / Retazos SVG
    const svgOffcuts = board.offcuts.map((off) => `
      <g class="offcut-group">
        <rect
          x="${off.x}"
          y="${off.y}"
          width="${off.lengthCm}"
          height="${off.widthCm}"
          fill="${off.isUsable ? '#ecfdf5' : '#f8fafc'}"
          stroke="${off.isUsable ? '#10b981' : '#cbd5e1'}"
          stroke-width="0.8"
          stroke-dasharray="${off.isUsable ? '3,1.5' : '1.5,1.5'}"
        />
        ${off.lengthCm >= 16 && off.widthCm >= 10 ? `
          <text
            x="${off.x + (off.lengthCm / 2)}"
            y="${off.y + (off.widthCm / 2)}"
            text-anchor="middle"
            dominant-baseline="middle"
            font-size="2.4"
            font-weight="bold"
            fill="${off.isUsable ? '#047857' : '#94a3b8'}"
          >${off.isUsable ? '♻️ Retazo Útil' : 'Desperdicio'} (${off.lengthCm}×${off.widthCm})</text>
        ` : ''}
      </g>
    `).join('');

    // Tabla de piezas del tablero
    const piecesRows = board.placedPieces.map((p, idx) => `
      <tr>
        <td style="text-align: center; font-weight: bold;">${idx + 1}</td>
        <td><strong style="color: #0f172a;">[${p.furnitureName || 'Mueble'}]</strong> ${p.name}</td>
        <td style="text-align: center; font-weight: bold;">${p.lengthCm} × ${p.widthCm} cm</td>
        <td style="text-align: center;">${thicknessMm} mm</td>
        <td>${formatEdges(p.edges)}</td>
      </tr>
    `).join('');

    return `
      <div class="page-board">
        <div class="board-header">
          <div>
            <h2 class="board-title">Tablero #${board.boardIndex} de ${optimizationResult.totalSheets}</h2>
            <p class="board-subtitle">
              Dimensión: <strong>${board.sheetLengthCm} × ${board.sheetWidthCm} cm</strong> • 
              Aprovechamiento: <strong class="highlight">${board.efficiencyPercent}%</strong> • 
              Piezas: <strong>${board.placedPieces.length}</strong> • 
              Desperdicio: <strong>${board.wastePercent}%</strong>
            </p>
          </div>
          <div class="board-badge">
            Tablero ${board.boardIndex}/${optimizationResult.totalSheets}
          </div>
        </div>

        <!-- Diagrama SVG 2D Vectorial -->
        <div class="svg-container">
          <svg
            viewBox="0 0 ${board.sheetLengthCm} ${board.sheetWidthCm}"
            preserveAspectRatio="xMidYMid meet"
            class="board-svg"
          >
            <!-- Fondo del tablero -->
            <rect
              x="0"
              y="0"
              width="${board.sheetLengthCm}"
              height="${board.sheetWidthCm}"
              fill="#ffffff"
              stroke="#0f172a"
              stroke-width="1.2"
            />
            
            ${svgOffcuts}
            ${svgPieces}
          </svg>
        </div>

        <!-- Tabla de Despiece del Tablero -->
        <div class="table-section">
          <h3 class="table-title">Lista de Piezas en este Tablero:</h3>
          <table class="data-table">
            <thead>
              <tr>
                <th style="width: 40px;">#</th>
                <th>Mueble / Nombre de Pieza</th>
                <th style="width: 140px;">Medida (Largo × Ancho)</th>
                <th style="width: 90px;">Espesor</th>
                <th>Cantos a Aplicar</th>
              </tr>
            </thead>
            <tbody>
              ${piecesRows}
            </tbody>
          </table>
        </div>
      </div>
    `;
  }).join('');

  // Leyenda de colores por mueble
  const legendHtml = Object.entries(furnitureColorMap).map(([fName, pal]) => `
    <span class="legend-item" style="background-color: ${pal.fill}; border-color: ${pal.stroke}; color: ${pal.textColor};">
      <span class="legend-dot" style="background-color: ${pal.badgeBg};"></span>
      <strong>${fName}</strong>
    </span>
  `).join('');

  const fullHtml = `
    <!DOCTYPE html>
    <html lang="es">
    <head>
      <meta charset="UTF-8">
      <title>Planos 2D - ${projectName}</title>
      <style>
        @page {
          size: letter landscape;
          margin: 8mm 10mm;
        }
        * {
          box-sizing: border-box;
          margin: 0;
          padding: 0;
        }
        body {
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
          color: #0f172a;
          background-color: #ffffff;
          -webkit-print-color-adjust: exact;
          print-color-adjust: exact;
        }
        .main-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          border-bottom: 2px solid #0f172a;
          padding-bottom: 8px;
          margin-bottom: 12px;
        }
        .main-title {
          font-size: 20px;
          font-weight: 900;
          text-transform: uppercase;
          letter-spacing: -0.5px;
          color: #0f172a;
        }
        .meta-text {
          font-size: 11px;
          color: #334155;
          margin-top: 2px;
        }
        .meta-text strong {
          color: #0f172a;
        }
        .header-right {
          text-align: right;
          font-size: 10px;
          color: #475569;
        }
        .legend-bar {
          display: flex;
          flex-wrap: wrap;
          align-items: center;
          gap: 6px;
          margin-bottom: 12px;
          padding: 6px 10px;
          background-color: #f8fafc;
          border: 1px solid #e2e8f0;
          border-radius: 6px;
        }
        .legend-title {
          font-size: 10px;
          font-weight: 900;
          text-transform: uppercase;
          color: #0f172a;
          margin-right: 4px;
        }
        .legend-item {
          display: inline-flex;
          align-items: center;
          gap: 4px;
          font-size: 10px;
          padding: 2px 8px;
          border-radius: 4px;
          border: 1px solid #cbd5e1;
        }
        .legend-dot {
          width: 8px;
          height: 8px;
          border-radius: 50%;
        }
        .page-board {
          page-break-after: always;
          break-after: page;
          padding-bottom: 10px;
        }
        .page-board:last-child {
          page-break-after: avoid;
          break-after: avoid;
        }
        .board-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          background-color: #f1f5f9;
          border: 1px solid #cbd5e1;
          border-radius: 6px;
          padding: 6px 12px;
          margin-bottom: 8px;
        }
        .board-title {
          font-size: 14px;
          font-weight: 800;
          color: #0f172a;
        }
        .board-subtitle {
          font-size: 10px;
          color: #475569;
        }
        .highlight {
          color: #047857;
        }
        .board-badge {
          font-size: 11px;
          font-weight: 900;
          background-color: #0f172a;
          color: #ffffff;
          padding: 3px 8px;
          border-radius: 4px;
        }
        .svg-container {
          width: 100%;
          border: 1.5px solid #334155;
          border-radius: 6px;
          background-color: #ffffff;
          padding: 4px;
          margin-bottom: 8px;
          max-height: 380px;
          display: flex;
          justify-content: center;
        }
        .board-svg {
          width: 100%;
          height: auto;
          max-height: 370px;
        }
        .table-section {
          margin-top: 6px;
        }
        .table-title {
          font-size: 10px;
          font-weight: 800;
          text-transform: uppercase;
          color: #334155;
          margin-bottom: 4px;
        }
        .data-table {
          width: 100%;
          border-collapse: collapse;
          font-size: 9.5px;
        }
        .data-table th, .data-table td {
          border: 1px solid #cbd5e1;
          padding: 4px 6px;
          text-align: left;
        }
        .data-table th {
          background-color: #e2e8f0;
          font-weight: 800;
          color: #0f172a;
        }
        .data-table tr:nth-child(even) {
          background-color: #f8fafc;
        }
      </style>
    </head>
    <body>
      <div class="main-header">
        <div>
          <h1 class="main-title">Planos 2D de Tableros — Hoja de Taller</h1>
          <p class="meta-text">
            Proyecto: <strong>${projectName}</strong> • 
            Material: <strong>${materialType} (${thicknessMm} mm)</strong> • 
            Tablero: <strong>${sheetLengthCm} × ${sheetWidthCm} cm</strong> • 
            Sierra: <strong>${sawKerfMm} mm</strong> • 
            Corte Primario: <strong>${primaryCutDirection === 'largo' ? 'A lo Largo' : 'A lo Ancho'}</strong>
          </p>
        </div>
        <div class="header-right">
          <div>Fecha: <strong>${dateStr}</strong></div>
          <div>Total: <strong>${optimizationResult.totalSheets} Tableros</strong> • <strong>${optimizationResult.totalPieces} Piezas</strong></div>
          <div>Aprovechamiento Global: <strong>${optimizationResult.overallEfficiencyPercent}%</strong></div>
        </div>
      </div>

      <div class="legend-bar">
        <span class="legend-title">Código de Muebles:</span>
        ${legendHtml}
      </div>

      ${boardsHtml}
    </body>
    </html>
  `;

  printHtmlDocument(fullHtml);
}

/**
 * 2. Genera e imprime la vista limpia de GUÍA DE CORTE PASO A PASO (Orientación Vertical)
 */
export function printGuiaCortePdf(params: {
  projectName: string;
  materialType: string;
  thicknessMm: number;
  sheetLengthCm: number;
  sheetWidthCm: number;
  sawKerfMm: number;
  primaryCutDirection: 'largo' | 'ancho';
  totalSheets: number;
  totalPieces: number;
  fenceGroupedSteps: FenceGroupedStep[];
  furnitureColorMap: Record<string, FurniturePalette>;
}): void {
  const {
    projectName,
    materialType,
    thicknessMm,
    sheetLengthCm,
    sheetWidthCm,
    sawKerfMm,
    primaryCutDirection,
    totalSheets,
    totalPieces,
    fenceGroupedSteps,
    furnitureColorMap
  } = params;

  const dateStr = new Date().toLocaleDateString('es-ES', { day: '2-digit', month: 'long', year: 'numeric' });

  // Generar grupos de regla de corte
  const groupsHtml = fenceGroupedSteps.map((group, gIdx) => {
    const stripsDetailsHtml = group.strips.map((step) => {
      const cutsRows = step.individualCuts.map((cut, cIdx) => {
        const pal = furnitureColorMap[cut.furnitureName || ''] || {
          badgeBg: '#334155',
          badgeText: '#ffffff',
          fill: '#f1f5f9',
          textColor: '#0f172a'
        };

        return `
          <tr>
            <td style="text-align: center; width: 40px; font-weight: bold;">${cIdx + 1}</td>
            <td style="width: 110px; font-weight: 800; font-size: 11px; color: #047857; text-align: center;">
              ${cut.cutMeasureCm} cm
            </td>
            <td>
              <span class="mueble-tag" style="background-color: ${pal.badgeBg}; color: ${pal.badgeText};">
                [${cut.furnitureName || 'Mueble'}]
              </span>
              <strong style="color: #0f172a; margin-left: 4px;">${cut.name}</strong>
            </td>
            <td style="text-align: center; font-size: 10px;">${cut.lengthCm} × ${cut.widthCm} cm</td>
            <td style="font-size: 9.5px;">${formatEdges(cut.edges)}</td>
            <td style="text-align: center; width: 40px;">
              <span class="checkbox-box"></span>
            </td>
          </tr>
        `;
      }).join('');

      return `
        <div class="strip-block">
          <div class="strip-header">
            <div class="strip-title">
              <span class="pencil-badge">Marca a Lápiz: ${step.pencilMark}</span>
              <span>Extraer en Tablero <strong>#${step.boardIndex}</strong></span>
              <span class="strip-dim">(Dimensión de Tira: <strong>${step.stripLengthCm} × ${step.stripWidthCm} cm</strong>)</span>
            </div>
            <span class="strip-total-pieces">${step.individualCuts.length} ${step.individualCuts.length === 1 ? 'Pieza' : 'Piezas'}</span>
          </div>

          <table class="cuts-table">
            <thead>
              <tr>
                <th>#</th>
                <th>Tope de Sierra (Medida)</th>
                <th>Mueble y Pieza</th>
                <th>Medida Final</th>
                <th>Cantos</th>
                <th>Listo</th>
              </tr>
            </thead>
            <tbody>
              ${cutsRows}
            </tbody>
          </table>
        </div>
      `;
    }).join('');

    return `
      <div class="fence-group">
        <div class="fence-banner">
          <div class="fence-left">
            <span class="step-num">PASO ${gIdx + 1}</span>
            <span class="fence-main-text">Ajustar Regla de Sierra a: <strong class="fence-measure">${group.fenceMeasureCm} cm</strong></span>
          </div>
          <div class="fence-right">
            <span>${group.totalStrips} ${group.totalStrips === 1 ? 'Tira' : 'Tiras'} en total</span>
          </div>
        </div>

        <div class="strips-wrapper">
          ${stripsDetailsHtml}
        </div>
      </div>
    `;
  }).join('');

  const fullHtml = `
    <!DOCTYPE html>
    <html lang="es">
    <head>
      <meta charset="UTF-8">
      <title>Guía de Corte - ${projectName}</title>
      <style>
        @page {
          size: letter portrait;
          margin: 10mm 12mm;
        }
        * {
          box-sizing: border-box;
          margin: 0;
          padding: 0;
        }
        body {
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
          color: #0f172a;
          background-color: #ffffff;
          -webkit-print-color-adjust: exact;
          print-color-adjust: exact;
          font-size: 11px;
        }
        .main-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          border-bottom: 2.5px solid #0f172a;
          padding-bottom: 8px;
          margin-bottom: 12px;
        }
        .main-title {
          font-size: 18px;
          font-weight: 900;
          text-transform: uppercase;
          letter-spacing: -0.3px;
          color: #0f172a;
        }
        .meta-text {
          font-size: 10.5px;
          color: #334155;
          margin-top: 2px;
        }
        .meta-text strong {
          color: #0f172a;
        }
        .header-right {
          text-align: right;
          font-size: 10px;
          color: #475569;
        }
        .instructions-box {
          background-color: #fffbeb;
          border: 1.5px solid #fde68a;
          border-radius: 6px;
          padding: 8px 12px;
          margin-bottom: 12px;
          font-size: 10px;
          color: #78350f;
          display: flex;
          justify-content: space-between;
        }
        .fence-group {
          margin-bottom: 14px;
          page-break-inside: avoid;
          break-inside: avoid;
          border: 1.5px solid #cbd5e1;
          border-radius: 8px;
          overflow: hidden;
        }
        .fence-banner {
          background-color: #0f172a;
          color: #ffffff;
          padding: 8px 12px;
          display: flex;
          justify-content: space-between;
          align-items: center;
        }
        .step-num {
          background-color: #f59e0b;
          color: #78350f;
          font-weight: 900;
          font-size: 10px;
          padding: 2px 6px;
          border-radius: 4px;
          margin-right: 8px;
        }
        .fence-main-text {
          font-size: 12px;
          font-weight: 700;
        }
        .fence-measure {
          font-size: 15px;
          font-weight: 900;
          color: #fbbf24;
          text-decoration: underline;
        }
        .fence-right {
          font-size: 11px;
          font-weight: 800;
          color: #e2e8f0;
        }
        .strips-wrapper {
          padding: 8px;
          background-color: #ffffff;
        }
        .strip-block {
          margin-bottom: 10px;
          border: 1px solid #e2e8f0;
          border-radius: 6px;
          overflow: hidden;
        }
        .strip-block:last-child {
          margin-bottom: 0;
        }
        .strip-header {
          background-color: #f8fafc;
          border-bottom: 1px solid #e2e8f0;
          padding: 5px 10px;
          display: flex;
          justify-content: space-between;
          align-items: center;
          font-size: 10.5px;
        }
        .pencil-badge {
          background-color: #e0f2fe;
          color: #0369a1;
          font-weight: 900;
          padding: 2px 6px;
          border-radius: 4px;
          border: 1px solid #bae6fd;
          margin-right: 6px;
        }
        .strip-dim {
          color: #64748b;
          font-size: 10px;
          margin-left: 6px;
        }
        .strip-total-pieces {
          font-weight: 800;
          color: #334155;
          font-size: 10px;
        }
        .cuts-table {
          width: 100%;
          border-collapse: collapse;
          font-size: 10px;
        }
        .cuts-table th, .cuts-table td {
          border: 1px solid #e2e8f0;
          padding: 4px 8px;
          text-align: left;
        }
        .cuts-table th {
          background-color: #f1f5f9;
          font-weight: 800;
          color: #334155;
          font-size: 9.5px;
          text-transform: uppercase;
        }
        .mueble-tag {
          font-size: 9px;
          font-weight: 900;
          padding: 1.5px 5px;
          border-radius: 3px;
          display: inline-block;
        }
        .checkbox-box {
          display: inline-block;
          width: 14px;
          height: 14px;
          border: 1.5px solid #475569;
          border-radius: 3px;
        }
      </style>
    </head>
    <body>
      <div class="main-header">
        <div>
          <h1 class="main-title">Guía de Corte Paso a Paso — Secuencia Maestra</h1>
          <p class="meta-text">
            Proyecto: <strong>${projectName}</strong> • 
            Material: <strong>${materialType} (${thicknessMm} mm)</strong> • 
            Tablero: <strong>${sheetLengthCm} × ${sheetWidthCm} cm</strong> • 
            Sierra: <strong>${sawKerfMm} mm</strong> • 
            Corte Primario: <strong>${primaryCutDirection === 'largo' ? 'Longitudinal (A lo largo)' : 'Transversal (A lo ancho)'}</strong>
          </p>
        </div>
        <div class="header-right">
          <div>Fecha: <strong>${dateStr}</strong></div>
          <div>Total: <strong>${totalSheets} ${totalSheets === 1 ? 'Tablero' : 'Tableros'}</strong> • <strong>${totalPieces} Piezas</strong></div>
        </div>
      </div>

      <div class="instructions-box">
        <span>⚙️ <strong>Modo Taller:</strong> Ajusta la regla de sierra al valor indicado en cada paso y corta todas las tiras juntas antes de pasar a la siguiente medida.</span>
        <span>✏️ Marca con lápiz cada tira (ej. <strong>T-1</strong>) para no confundir las piezas.</span>
      </div>

      ${groupsHtml}
    </body>
    </html>
  `;

  printHtmlDocument(fullHtml);
}

// Aliases para compatibilidad directa
export const downloadPlanos2DPdf = printPlanos2DPdf;
export const downloadGuiaCortePdf = printGuiaCortePdf;

/**
 * 3. Genera e imprime la LISTA DE CUBRECANTO / CANTEADO EXCLUSIVA
 * Incluye únicamente las piezas que efectivamente llevan cubrecanto.
 */
export function printEdgeBandingListPdf(params: {
  projectName: string;
  clientName?: string;
  materialType: string;
  thicknessMm: number;
  cuts: WoodCut[];
  furnitureUnits?: any[];
}): void {
  const { projectName, clientName, materialType, thicknessMm, cuts, furnitureUnits = [] } = params;
  const dateStr = new Date().toLocaleDateString('es-ES', { day: '2-digit', month: 'long', year: 'numeric' });

  // Filtrar ÚNICAMENTE las piezas que llevan al menos 1 lado de cubrecanto
  const edgeCuts = cuts.filter(c => {
    const e = c.edges;
    return !!(e && (e.top || e.bottom || e.left || e.right));
  });

  // Calcular métricas
  let totalBandedMeters = 0;
  let totalPiecesCount = 0;

  const rowsHtml = edgeCuts.map((cut, idx) => {
    const e = cut.edges || {};
    const qty = cut.quantity || 1;
    totalPiecesCount += qty;

    const l1 = !!e.top;
    const l2 = !!e.bottom;
    const a1 = !!e.left;
    const a2 = !!e.right;

    let pieceMeters = 0;
    if (l1) pieceMeters += cut.lengthCm / 100;
    if (l2) pieceMeters += cut.lengthCm / 100;
    if (a1) pieceMeters += cut.widthCm / 100;
    if (a2) pieceMeters += cut.widthCm / 100;

    const rowTotalMeters = pieceMeters * qty;
    totalBandedMeters += rowTotalMeters;

    // Obtener nombre de mueble
    let furnName = cut.furnitureName || 'Mueble General';
    if (cut.furnitureId && furnitureUnits.length > 0) {
      const u = furnitureUnits.find(unit => unit.id === cut.furnitureId);
      if (u) furnName = u.name;
    }

    const edgeTypeStr = cut.thicknessMm && cut.thicknessMm >= 18 ? 'PVC 2.0 mm / Tono Melamina' : 'PVC 0.45 mm Estándar';

    return `
      <tr>
        <td style="text-align: center; font-weight: bold; color: #000000;">${idx + 1}</td>
        <td style="font-weight: 700; color: #000000;">
          ${furnName}
        </td>
        <td style="font-weight: 800; color: #000000;">${cut.name}</td>
        <td style="font-weight: bold; color: #000000; text-align: center;">
          ${cut.lengthCm} × ${cut.widthCm} cm
        </td>
        <td style="text-align: center; font-weight: 900; font-size: 11px; background-color: #ffffff; color: #000000;">
          ${qty}
        </td>
        <td style="text-align: center; color: #000000;">
          ${l1 ? `<span style="font-weight: 700; color: #000000;">✓ ${cut.lengthCm} cm</span>` : '<span style="color: #64748b;">—</span>'}
        </td>
        <td style="text-align: center; color: #000000;">
          ${l2 ? `<span style="font-weight: 700; color: #000000;">✓ ${cut.lengthCm} cm</span>` : '<span style="color: #64748b;">—</span>'}
        </td>
        <td style="text-align: center; color: #000000;">
          ${a1 ? `<span style="font-weight: 700; color: #000000;">✓ ${cut.widthCm} cm</span>` : '<span style="color: #64748b;">—</span>'}
        </td>
        <td style="text-align: center; color: #000000;">
          ${a2 ? `<span style="font-weight: 700; color: #000000;">✓ ${cut.widthCm} cm</span>` : '<span style="color: #64748b;">—</span>'}
        </td>
        <td style="font-size: 9px; color: #000000;">${edgeTypeStr}</td>
        <td style="text-align: right; font-weight: 800; color: #000000;">
          ${rowTotalMeters.toFixed(2)} m
        </td>
        <td style="text-align: center;">
          <div class="checkbox-box"></div>
        </td>
      </tr>
    `;
  }).join('');

  const metersWithWaste = Math.round(totalBandedMeters * 1.10 * 10) / 10;

  const fullHtml = `
    <!DOCTYPE html>
    <html lang="es">
    <head>
      <meta charset="UTF-8">
      <title>Lista de Cubrecanto — ${projectName}</title>
      <style>
        @page {
          size: letter portrait;
          margin: 8mm;
        }
        * {
          box-sizing: border-box;
          -webkit-print-color-adjust: exact !important;
          print-color-adjust: exact !important;
        }
        body {
          font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Arial, sans-serif;
          margin: 0;
          padding: 10px;
          background-color: #ffffff;
          color: #0f172a;
          font-size: 10px;
        }
        .main-header {
          border-bottom: 2.5px solid #047857;
          padding-bottom: 8px;
          margin-bottom: 10px;
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
        }
        .main-title {
          font-size: 18px;
          font-weight: 900;
          color: #064e3b;
          text-transform: uppercase;
          margin: 0 0 4px 0;
        }
        .meta-text {
          font-size: 10.5px;
          color: #334155;
          margin: 0;
        }
        .meta-text strong {
          color: #0f172a;
        }
        .header-right {
          text-align: right;
          font-size: 10px;
          color: #475569;
        }
        .summary-bar {
          background-color: #f0fdf4;
          border: 1.5px solid #86efac;
          border-radius: 8px;
          padding: 8px 12px;
          margin-bottom: 12px;
          display: flex;
          justify-content: space-between;
          align-items: center;
          font-size: 11px;
        }
        .summary-metric {
          display: flex;
          align-items: center;
          gap: 6px;
        }
        .summary-val {
          font-weight: 900;
          color: #065f46;
          font-size: 13px;
        }
        table {
          width: 100%;
          border-collapse: collapse;
          font-size: 9.5px;
          margin-bottom: 10px;
        }
        th, td {
          border: 1px solid #cbd5e1;
          padding: 4.5px 6px;
          text-align: left;
        }
        th {
          background-color: #f1f5f9;
          font-weight: 900;
          color: #1e293b;
          font-size: 9px;
          text-transform: uppercase;
        }
        .furniture-pill {
          background-color: #e0f2fe;
          color: #0369a1;
          font-weight: 900;
          font-size: 8.5px;
          padding: 2px 5px;
          border-radius: 4px;
          border: 1px solid #bae6fd;
          display: inline-block;
        }
        .edge-tag {
          font-size: 8.5px;
          font-weight: 800;
          padding: 1.5px 4px;
          border-radius: 3px;
          display: inline-block;
        }
        .edge-on {
          background-color: #dcfce7;
          color: #166534;
          border: 1px solid #86efac;
        }
        .edge-off {
          color: #94a3b8;
        }
        .checkbox-box {
          display: inline-block;
          width: 13px;
          height: 13px;
          border: 1.5px solid #475569;
          border-radius: 3px;
        }
        .footer-notes {
          font-size: 9px;
          color: #64748b;
          margin-top: 10px;
          border-top: 1px dashed #cbd5e1;
          padding-top: 6px;
          display: flex;
          justify-content: space-between;
        }
      </style>
    </head>
    <body>
      <div class="main-header">
        <div>
          <h1 class="main-title">Hoja Técnica de Canteado / Cubrecanto 🏷️</h1>
          <p class="meta-text">
            Proyecto: <strong>${projectName}</strong> ${clientName ? `• Cliente: <strong>${clientName}</strong>` : ''} • 
            Material: <strong>${materialType} (${thicknessMm} mm)</strong>
          </p>
        </div>
        <div class="header-right">
          <div>Fecha: <strong>${dateStr}</strong></div>
          <div>Piezas con Canto: <strong>${totalPiecesCount} piezas</strong> (${edgeCuts.length} líneas)</div>
        </div>
      </div>

      <div class="summary-bar">
        <div class="summary-metric">
          <span>🏷️ Total Cinta Neta:</span>
          <span class="summary-val">${totalBandedMeters.toFixed(1)} m</span>
        </div>
        <div class="summary-metric">
          <span>📦 Cinta Recomendada (+10% Taller):</span>
          <span class="summary-val">${metersWithWaste} m</span>
        </div>
        <div class="summary-metric">
          <span>🧩 Piezas a Enchapar:</span>
          <span class="summary-val">${totalPiecesCount} piezas</span>
        </div>
      </div>

      <table>
        <thead>
          <tr>
            <th style="width: 25px; text-align: center;">#</th>
            <th>Mueble</th>
            <th>Pieza</th>
            <th style="text-align: center;">Medidas (cm)</th>
            <th style="width: 32px; text-align: center;">Cant.</th>
            <th style="text-align: center;">Largo 1 (L1)</th>
            <th style="text-align: center;">Largo 2 (L2)</th>
            <th style="text-align: center;">Ancho 1 (A1)</th>
            <th style="text-align: center;">Ancho 2 (A2)</th>
            <th>Tipo Cubrecanto</th>
            <th style="text-align: right;">Total (m)</th>
            <th style="width: 28px; text-align: center;">Listo</th>
          </tr>
        </thead>
        <tbody>
          ${rowsHtml || '<tr><td colspan="12" style="text-align:center; padding: 20px;">No se encontraron piezas con cubrecanto configurado.</td></tr>'}
        </tbody>
      </table>

      <div class="footer-notes">
        <span>* L1 y L2 corresponden a las aristas a lo largo (Longitudinal); A1 y A2 a las aristas a lo ancho (Transversal).</span>
        <span>Estación de Canteado — Documento Técnico de Taller</span>
      </div>
    </body>
    </html>
  `;

  printHtmlDocument(fullHtml);
}

