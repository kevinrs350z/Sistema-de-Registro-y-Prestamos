import { Injectable } from '@angular/core';
import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';

import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';

@Injectable({
  providedIn: 'root'
})
export class ExportService {


  async exportarPDF(elementId: string, fileName: string = 'Reporte.pdf') {
    const contenido = document.getElementById(elementId);

    if (!contenido) {
      console.error('Elemento no encontrado:', elementId);
      return;
    }

    const canvas = await html2canvas(contenido, { scale: 3 });
    const imgData = canvas.toDataURL('image/png');

    const pdf = new jsPDF('p', 'mm', 'a4');
    const imgWidth = 210;
    const imgHeight = (canvas.height * imgWidth) / canvas.width;

    pdf.addImage(imgData, 'PNG', 0, 0, imgWidth, imgHeight);
    pdf.save(fileName);
  }

  
  exportarExcel(sheetData: {name: string, data: any[]}[], fileName = 'Reporte.xlsx') {
    const wb = XLSX.utils.book_new();

    sheetData.forEach(sheet => {
      const ws = XLSX.utils.json_to_sheet(
        sheet.data.length ? sheet.data : [{ Mensaje: 'No hay datos disponibles' }]
      );
      XLSX.utils.book_append_sheet(wb, ws, sheet.name);
    });

    const buffer = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
    saveAs(new Blob([buffer]), fileName);
  }
}
