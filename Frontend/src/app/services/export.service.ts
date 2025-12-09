import { Injectable } from '@angular/core';
import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';
import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';

@Injectable({
  providedIn: 'root'
})
export class ExportService {

  /* ============================================================
     EXPORTAR PDF (Promesa para usar .then() / .catch())
  ============================================================ */
  exportarPDF(elementId: string, fileName: string = 'Reporte.pdf'): Promise<void> {
    return new Promise(async (resolve, reject) => {
      try {
        const contenido = document.getElementById(elementId);

        if (!contenido) {
          console.error('Elemento no encontrado:', elementId);
          return reject('Elemento no encontrado');
        }

        const canvas = await html2canvas(contenido, { scale: 3 });
        const imgData = canvas.toDataURL('image/png');

        const pdf = new jsPDF('p', 'mm', 'a4');
        const imgWidth = 210;
        const imgHeight = (canvas.height * imgWidth) / canvas.width;

        pdf.addImage(imgData, 'PNG', 0, 0, imgWidth, imgHeight);
        pdf.save(fileName);

        resolve();
      } catch (err) {
        console.error('Error al exportar PDF:', err);
        reject(err);
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
