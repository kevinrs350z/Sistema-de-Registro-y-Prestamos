import { Injectable } from '@angular/core';
import pdfMake from 'pdfmake/build/pdfmake';
import pdfFonts from 'pdfmake/build/vfs_fonts';
import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';

// Asignar fuentes a pdfMake
(pdfMake as any).vfs = (pdfFonts as any).pdfMake?.vfs || pdfFonts;

/** Interfaz para datos de reporte */
export interface ReporteData {
  titulo: string;
  subtitulo?: string;
  fechaGeneracion?: Date;
  usuario?: string;
  periodo?: string;
  codigoDocumento?: string;
  secciones: SeccionReporte[];
}

export interface SeccionReporte {
  tipo: 'kpis' | 'tabla' | 'texto' | 'espacio';
  titulo?: string;
  subtitulo?: string;
  datos?: any;
}

export interface KpiItem {
  label: string;
  valor: string | number;
  color?: string;
}

export interface TablaData {
  columnas: string[];
  filas: (string | number)[][];
  anchos?: (string | number)[];
}

@Injectable({
  providedIn: 'root'
})
export class ExportService {

  private logoBase64: string | null = null;
  private watermarkBase64: string | null = null;

  // Escudo UTA en base64 
  private readonly ESCUDO_UTA_BASE64 = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAMgAAADICAYAAACtWK6eAAAACXBIWXMAAAsTAAALEwEAmpwYAAAF0WlUWHRYTUw6Y29tLmFkb2JlLnhtcAAAAAAAPD94cGFja2V0IGJlZ2luPSLvu78iIGlkPSJXNU0wTXBDZWhpSHpyZVN6TlRjemtjOWQiPz4gPHg6eG1wbWV0YSB4bWxuczp4PSJhZG9iZTpuczptZXRhLyIgeDp4bXB0az0iQWRvYmUgWE1QIENvcmUgNS42LWMxNDUgNzkuMTYzNDk5LCAyMDE4LzA4LzEzLTE2OjQwOjIyICAgICAgICAiPiA8cmRmOlJERiB4bWxuczpyZGY9Imh0dHA6Ly93d3cudzMub3JnLzE5OTkvMDIvMjItcmRmLXN5bnRheC1ucyMiPiA8cmRmOkRlc2NyaXB0aW9uIHJkZjphYm91dD0iIiB4bWxuczp4bXA9Imh0dHA6Ly9ucy5hZG9iZS5jb20veGFwLzEuMC8iIHhtbG5zOmRjPSJodHRwOi8vcHVybC5vcmcvZGMvZWxlbWVudHMvMS4xLyIgeG1sbnM6cGhvdG9zaG9wPSJodHRwOi8vbnMuYWRvYmUuY29tL3Bob3Rvc2hvcC8xLjAvIiB4bWxuczp4bXBNTT0iaHR0cDovL25zLmFkb2JlLmNvbS94YXAvMS4wL21tLyIgeG1sbnM6c3RFdnQ9Imh0dHA6Ly9ucy5hZG9iZS5jb20veGFwLzEuMC9zVHlwZS9SZXNvdXJjZUV2ZW50IyIgeG1wOkNyZWF0b3JUb29sPSJBZG9iZSBQaG90b3Nob3AgQ0MgMjAxOSAoV2luZG93cykiIHhtcDpDcmVhdGVEYXRlPSIyMDI0LTAxLTE1VDEwOjAwOjAwLTA1OjAwIiB4bXA6TW9kaWZ5RGF0ZT0iMjAyNC0wMS0xNVQxMDowMDowMC0wNTowMCIgeG1wOk1ldGFkYXRhRGF0ZT0iMjAyNC0wMS0xNVQxMDowMDowMC0wNTowMCIgZGM6Zm9ybWF0PSJpbWFnZS9wbmciIHBob3Rvc2hvcDpDb2xvck1vZGU9IjMiIHBob3Rvc2hvcDpJQ0NQcm9maWxlPSJzUkdCIElFQzYxOTY2LTIuMSIgeG1wTU06SW5zdGFuY2VJRD0ieG1wLmlpZDowMDAwMDAwMC0wMDAw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';

  constructor() {
    this.precargarImagenes();
  }

  private async cargarImagenComoBase64(ruta: string): Promise<string | null> {
    try {
      const response = await fetch(ruta);
      if (!response.ok) return null;
      
      const blob = await response.blob();
      // Verificar que sea una imagen válida
      if (!blob.type.startsWith('image/')) return null;
      
      return await new Promise((resolve) => {
        const reader = new FileReader();
        reader.onload = () => {
          const result = reader.result as string;
          // Verificar que sea un dataURL válido
          if (result && result.startsWith('data:image/')) {
            resolve(result);
          } else {
            resolve(null);
          }
        };
        reader.onerror = () => resolve(null);
        reader.readAsDataURL(blob);
      });
    } catch {
      return null;
    }
  }

  private async precargarImagenes(): Promise<void> {
    const [logo, watermark] = await Promise.all([
      this.cargarImagenComoBase64('assets/logo-uta.png'),
      this.cargarImagenComoBase64('assets/escudo-uta.png')
    ]);

    this.logoBase64 = logo;
    // Prioridad: escudo-uta.png > logo-uta.png > escudo embebido
    this.watermarkBase64 = watermark || logo || this.ESCUDO_UTA_BASE64;
  }

  private generarCodigoDocumento(): string {
    const now = new Date();
    const year = now.getFullYear();
    const seq = Math.floor(Math.random() * 900000) + 100000;
    return `RPT.REG.N° ${year}${seq}`;
  }

  private formatearFecha(fecha: Date): string {
    const opciones: Intl.DateTimeFormatOptions = { 
      day: '2-digit', 
      month: 'long', 
      year: 'numeric' 
    };
    return fecha.toLocaleDateString('es-CL', opciones);
  }

  /* ============================================================
     EXPORTAR PDF INSTITUCIONAL (Formato UTA Oficial)
  ============================================================ */
  exportarPDFInstitucional(data: ReporteData, fileName: string = 'Reporte_UTA.pdf'): Promise<void> {
    return new Promise(async (resolve, reject) => {
      try {
        const now = data.fechaGeneracion || new Date();
        const codigo = data.codigoDocumento || this.generarCodigoDocumento();

        // Asegurar que logo y watermark estén cargados
        if (!this.logoBase64 || !this.watermarkBase64) {
          await this.precargarImagenes();
        }
        
        // Colores institucionales UTA
        const azulUTA = '#003366';
        const grisTexto = '#333333';
        const grisClaro = '#666666';
        const lineaAzul = '#1a5276';
        const bordeGris = '#4a4a4a';
        const bordeGrisClaro = '#7a7a7a';
        const fondoPapel = '#f6f1e4'; // marfil/beige claro

        // Capturar watermark válido
        const watermarkImg = this.watermarkBase64 && this.watermarkBase64.startsWith('data:image/')
          ? this.watermarkBase64
          : null;

        // Construcción del documento
        const content: any[] = [];

        // Marca de agua (colocada primero para quedar detrás del contenido)
        if (watermarkImg) {
          content.push({
            image: watermarkImg,
            width: 240,
            opacity: 0.1,
            absolutePosition: { x: 185, y: 255 }
          });
        }

        // ═══════════════════════════════════════════════════════════
        // HEADER INSTITUCIONAL (estilo certificado oficial)
        // ═══════════════════════════════════════════════════════════
        content.push({
          columns: [
            {
              stack: [
                { text: 'UNIVERSIDAD DE TARAPACÁ', fontSize: 9, bold: true, color: azulUTA },
                { text: 'ARICA - CHILE', fontSize: 8, color: grisClaro },
                { text: 'REGISTRADURÍA', fontSize: 7, color: grisClaro }
              ],
              width: 'auto'
            },
            { text: 'CERTIFICADO', alignment: 'center', color: '#666', opacity: 0, width: '*' },
            {
              stack: [
                { text: `C.A.R. REG.N° ${codigo}`, fontSize: 8, bold: true, color: grisTexto, alignment: 'right' },
                { text: `Fecha: ${this.formatearFecha(now)}`, fontSize: 7, color: grisClaro, alignment: 'right' }
              ],
              width: 'auto'
            }
          ],
          margin: [0, 0, 0, 12]
        });

        // Línea divisoria azul institucional
        content.push({
          canvas: [
            { type: 'line', x1: 0, y1: 0, x2: 515, y2: 0, lineWidth: 1.5, lineColor: lineaAzul }
          ],
          margin: [0, 0, 0, 16]
        });

        // ═══════════════════════════════════════════════════════════
        // TÍTULO DEL REPORTE
        // ═══════════════════════════════════════════════════════════
        content.push({
          text: data.titulo.toUpperCase(),
          fontSize: 16,
          bold: true,
          color: azulUTA,
          alignment: 'center',
          margin: [0, 0, 0, 8]
        });

        if (data.subtitulo) {
          content.push({
            text: data.subtitulo,
            fontSize: 11,
            color: grisClaro,
            alignment: 'center',
            margin: [0, 0, 0, 20]
          });
        }

        // Información del documento (alineada a la izquierda para estilo oficio)
        const infoItems: any[] = [];
        if (data.usuario) {
          infoItems.push({ text: `Usuario: ${data.usuario}`, fontSize: 9, color: grisTexto });
        }
        if (data.periodo) {
          infoItems.push({ text: `Período: ${data.periodo}`, fontSize: 9, color: grisTexto });
        }

        if (infoItems.length > 0) {
          content.push({
            stack: infoItems,
            margin: [0, 0, 0, 18]
          });
        }

        // ═══════════════════════════════════════════════════════════
        // SECCIONES DEL REPORTE
        // ═══════════════════════════════════════════════════════════
        for (const seccion of data.secciones) {
          switch (seccion.tipo) {
            case 'kpis':
              content.push(this.generarSeccionKPIs(seccion, azulUTA, grisTexto));
              break;
            case 'tabla':
              content.push(this.generarSeccionTabla(seccion, azulUTA, grisTexto, lineaAzul));
              break;
            case 'texto':
              content.push(this.generarSeccionTexto(seccion, grisTexto));
              break;
            case 'espacio':
              content.push({ text: '', margin: [0, 15, 0, 0] });
              break;
          }
        }

        // ═══════════════════════════════════════════════════════════
        // FOOTER INSTITUCIONAL
        // ═══════════════════════════════════════════════════════════
        content.push({ text: '', margin: [0, 24, 0, 0] });
        
        content.push({
          text: 'Documento generado electrónicamente - Sistema de Préstamo de Equipos UTA',
          fontSize: 7,
          color: grisClaro,
          alignment: 'center',
          margin: [0, 0, 0, 12]
        });

        // Firmas estilo certificado
        content.push({
          columns: [
            {
              stack: [
                { canvas: [{ type: 'line', x1: 0, y1: 0, x2: 150, y2: 0, lineWidth: 0.8, lineColor: grisTexto }] },
                { text: 'ADMINISTRADOR DEL SISTEMA', fontSize: 9, bold: true, color: grisTexto, margin: [0, 4, 0, 0] },
                { text: 'Departamento de Diseño Multimedia', fontSize: 7.5, color: grisClaro }
              ],
              width: '*',
              alignment: 'center'
            },
            {
              stack: [
                { canvas: [{ type: 'line', x1: 0, y1: 0, x2: 150, y2: 0, lineWidth: 0.8, lineColor: grisTexto }] },
                { text: 'ENCARGADO DE EQUIPOS', fontSize: 9, bold: true, color: grisTexto, margin: [0, 4, 0, 0] },
                { text: 'Universidad de Tarapacá', fontSize: 7.5, color: grisClaro }
              ],
              width: '*',
              alignment: 'center'
            }
          ],
          margin: [30, 0, 30, 0]
        });

        // Definición del documento
        const docDefinition: any = {
          pageSize: 'LETTER',
          pageMargins: [40, 36, 40, 60],
          background: () => ({
            canvas: [
              // Marco exterior fino
              { type: 'rect', x: 18, y: 18, w: 579, h: 756, lineWidth: 1.1, lineColor: bordeGris, color: fondoPapel },
              // Marco interior suave
              { type: 'rect', x: 24, y: 24, w: 567, h: 744, lineWidth: 0.8, lineColor: bordeGrisClaro }
            ]
          }),
          defaultStyle: { font: 'Roboto', fontSize: 10 },
          content: content,
          footer: (currentPage: number, pageCount: number) => ({
            columns: [
              { text: 'Sistema de Registro y Préstamo de Equipos – Universidad de Tarapacá', fontSize: 8, color: grisClaro, margin: [40, 0, 0, 0] },
              { text: `Página ${currentPage} de ${pageCount}`, fontSize: 8, color: grisClaro, alignment: 'right', margin: [0, 0, 40, 0] }
            ],
            margin: [0, 10, 0, 0]
          }),
          styles: {
            seccionTitulo: { fontSize: 12, bold: true, color: azulUTA, margin: [0, 15, 0, 8] },
            seccionSubtitulo: { fontSize: 9, color: grisClaro, margin: [0, 0, 0, 10] }
          }
        };

        pdfMake.createPdf(docDefinition).download(fileName, () => resolve());

      } catch (err) {
        console.error('Error al exportar PDF institucional:', err);
        reject(err);
      }
    });
  }

  private generarSeccionKPIs(seccion: SeccionReporte, azulUTA: string, grisTexto: string): any {
    const kpis: KpiItem[] = seccion.datos || [];
    const resultado: any[] = [];

    if (seccion.titulo) {
      resultado.push({ text: seccion.titulo, style: 'seccionTitulo' });
    }

    const kpiColumns = kpis.map((kpi, index) => {
      const colores = ['#1a5276', '#148f77', '#b9770e', '#922b21'];
      const color = kpi.color || colores[index % colores.length];
      
      return {
        stack: [
          { text: String(kpi.valor), fontSize: 20, bold: true, color: color, alignment: 'center' },
          { text: kpi.label, fontSize: 9, color: grisTexto, alignment: 'center', margin: [0, 4, 0, 0] }
        ],
        width: '*',
        margin: [5, 8, 5, 8]
      };
    });

    resultado.push({
      table: {
        widths: kpis.map(() => '*'),
        body: [[...kpiColumns.map(col => ({ ...col, border: [false, false, false, false] }))]]
      },
      layout: {
        hLineWidth: () => 0,
        vLineWidth: () => 0,
        paddingLeft: () => 8,
        paddingRight: () => 8,
        paddingTop: () => 10,
        paddingBottom: () => 10
      },
      margin: [0, 0, 0, 15]
    });

    return { stack: resultado };
  }

  private generarSeccionTabla(seccion: SeccionReporte, azulUTA: string, grisTexto: string, lineaAzul: string): any {
    const tabla: TablaData = seccion.datos || { columnas: [], filas: [] };
    const resultado: any[] = [];

    if (seccion.titulo) {
      resultado.push({ text: seccion.titulo, style: 'seccionTitulo' });
    }
    if (seccion.subtitulo) {
      resultado.push({ text: seccion.subtitulo, style: 'seccionSubtitulo' });
    }

    // Header de tabla
    const headerRow = tabla.columnas.map(col => ({
      text: col,
      fontSize: 9,
      bold: true,
      color: '#ffffff',
      fillColor: azulUTA,
      margin: [6, 8, 6, 8]
    }));

    // Filas de datos
    const dataRows = tabla.filas.map((fila, index) => 
      fila.map(celda => ({
        text: String(celda),
        fontSize: 9,
        color: grisTexto,
        fillColor: index % 2 === 0 ? '#f8f9fa' : '#ffffff',
        margin: [6, 6, 6, 6]
      }))
    );

    const anchos = tabla.anchos || tabla.columnas.map(() => '*');

    resultado.push({
      table: {
        headerRows: 1,
        widths: anchos,
        body: [headerRow, ...dataRows]
      },
      layout: {
        hLineWidth: (i: number, node: any) => (i === 0 || i === 1 || i === node.table.body.length) ? 1 : 0.5,
        vLineWidth: () => 0.5,
        hLineColor: (i: number) => i === 1 ? lineaAzul : '#e0e0e0',
        vLineColor: () => '#e0e0e0',
        paddingLeft: () => 0,
        paddingRight: () => 0,
        paddingTop: () => 0,
        paddingBottom: () => 0
      },
      margin: [0, 0, 0, 20]
    });

    return { stack: resultado };
  }

  private generarSeccionTexto(seccion: SeccionReporte, grisTexto: string): any {
    const resultado: any[] = [];
    
    if (seccion.titulo) {
      resultado.push({ text: seccion.titulo, style: 'seccionTitulo' });
    }

    if (seccion.datos) {
      resultado.push({
        text: seccion.datos,
        fontSize: 10,
        color: grisTexto,
        alignment: 'justify',
        margin: [0, 0, 0, 15]
      });
    }

    return { stack: resultado };
  }

  /* ============================================================
     EXPORTAR PDF SIMPLE (Captura de pantalla - método legacy)
  ============================================================ */
  async exportarPDFCaptura(elementId: string, titulo: string, fileName: string = 'Reporte.pdf'): Promise<void> {
    const html2canvas = (await import('html2canvas')).default;
    
    return new Promise(async (resolve, reject) => {
      let contenido: HTMLElement | null = null;
      try {
        contenido = document.getElementById(elementId);
        if (!contenido) {
          return reject('Elemento no encontrado');
        }

        contenido.classList.add('pdf-export');
        await new Promise(r => setTimeout(r, 300));

        const canvas = await html2canvas(contenido, {
          scale: 2,
          backgroundColor: '#ffffff',
          useCORS: true,
          logging: false
        });

        const imgData = canvas.toDataURL('image/jpeg', 0.95);
        const imgWidth = 515;
        const imgHeight = (canvas.height * imgWidth) / canvas.width;

        const now = new Date();
        const codigo = this.generarCodigoDocumento();
        const azulUTA = '#003366';
        const grisClaro = '#666666';

        const content: any[] = [];

        // Header
        const headerColumns: any[] = [];
        if (this.logoBase64) {
          headerColumns.push({ image: this.logoBase64, width: 50, margin: [0, 0, 10, 0] });
        }
        headerColumns.push({
          stack: [
            { text: 'UNIVERSIDAD DE TARAPACÁ', fontSize: 12, bold: true, color: azulUTA },
            { text: 'Sistema de Préstamo de Equipos', fontSize: 9, color: grisClaro }
          ],
          width: '*'
        });
        headerColumns.push({
          text: codigo,
          fontSize: 8,
          color: grisClaro,
          alignment: 'right',
          width: 'auto'
        });

        content.push({ columns: headerColumns, margin: [0, 0, 0, 10] });
        content.push({
          canvas: [{ type: 'line', x1: 0, y1: 0, x2: 515, y2: 0, lineWidth: 1.5, lineColor: azulUTA }],
          margin: [0, 0, 0, 15]
        });

        content.push({
          text: titulo.toUpperCase(),
          fontSize: 14,
          bold: true,
          color: azulUTA,
          alignment: 'center',
          margin: [0, 0, 0, 15]
        });

        // Imagen capturada
        content.push({
          image: imgData,
          width: imgWidth,
          height: Math.min(imgHeight, 600)
        });

        const docDefinition: any = {
          pageSize: 'LETTER',
          pageMargins: [40, 40, 40, 50],
          content: content,
          footer: (currentPage: number, pageCount: number) => ({
            columns: [
              { text: `Generado: ${this.formatearFecha(now)}`, fontSize: 8, color: grisClaro, margin: [40, 0, 0, 0] },
              { text: `Página ${currentPage} de ${pageCount}`, fontSize: 8, color: grisClaro, alignment: 'right', margin: [0, 0, 40, 0] }
            ]
          })
        };

        pdfMake.createPdf(docDefinition).download(fileName, () => resolve());

      } catch (err) {
        reject(err);
      } finally {
        contenido?.classList.remove('pdf-export');
      }
    });
  }

  /* ============================================================
     EXPORTAR EXCEL (Ahora también devuelve Promesa)
  ============================================================ */
  exportarExcel(
    sheetData: { name: string; data: any[] }[],
    fileName = 'Reporte.xlsx'
  ): Promise<void> {
    return new Promise((resolve, reject) => {
      try {
        const wb = XLSX.utils.book_new();

        sheetData.forEach(sheet => {
          const ws = XLSX.utils.json_to_sheet(
            sheet.data.length ? sheet.data : [{ Mensaje: 'No hay datos disponibles' }]
          );
          XLSX.utils.book_append_sheet(wb, ws, sheet.name);
        });

        const buffer = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
        saveAs(new Blob([buffer]), fileName);

        resolve();
      } catch (err) {
        console.error('Error al exportar Excel:', err);
        reject(err);
      }
    });
  }

}
