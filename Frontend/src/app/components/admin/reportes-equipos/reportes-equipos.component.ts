import { Component, OnInit, OnDestroy, inject } from '@angular/core';
import { Chart } from 'chart.js/auto';
import { ReportesService } from '../../../services/reportes.service';
import { CommonModule, DatePipe } from '@angular/common';
import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';

/* ============================================================
   PLUGIN BARRAS REDONDEADAS CON SOMBRA
============================================================= */
Chart.register({
  id: 'roundedBars',
  beforeDraw(chart) {
    const ctx = chart.ctx;
    chart.data.datasets.forEach((dataset: any, i: number) => {
      const meta = chart.getDatasetMeta(i);
      meta.data.forEach((bar: any) => {
        const { x, y, base, width } = bar;

        ctx.save();
        ctx.fillStyle = dataset.backgroundColor;
        ctx.shadowColor = 'rgba(0,0,0,0.15)';
        ctx.shadowBlur = 8;
        ctx.shadowOffsetY = 4;

        ctx.beginPath();
        ctx.roundRect(x - width / 2, y, width, base - y, 12);
        ctx.fill();
        ctx.restore();
      });
    });
  }
});

/* ============================================================
   CONFIG GLOBAL CHART JS
============================================================= */
Chart.defaults.color = '#444';
Chart.defaults.font.family = "'Inter', sans-serif";
Chart.defaults.plugins.legend.display = false;

@Component({
  selector: 'app-reportes-equipos',
  standalone: true,
  templateUrl: './reportes-equipos.component.html',
  styleUrls: ['./reportes-equipos.component.css'],
  imports: [CommonModule, DatePipe],
  providers: [DatePipe]
})
export class ReportesEquiposComponent implements OnInit, OnDestroy {

  // === Inyección de DatePipe ===
  private datePipe = inject(DatePipe);

  // === Variables disponibles en HTML ===
  sanciones = 0;
  rechazos = 0;
  equiposBaja: any[] = [];
  today = new Date();
  mensaje: string | null = null;

  // === Gráficos ===
  private chartEquipos!: Chart;
  private chartUso!: Chart;
  private chartSanciones!: Chart;

  constructor(private reportesService: ReportesService) {}

  ngOnInit(): void {
    this.cargarEquiposMasSolicitados();
    this.cargarUsoInternoExterno();
    this.cargarSancionesYRechazos();
    this.cargarEquiposDadoDeBaja();
  }

  ngOnDestroy(): void {
    this.chartEquipos?.destroy();
    this.chartUso?.destroy();
    this.chartSanciones?.destroy();
  }

  /* ============================================================
     ANIMACIONES
  ============================================================= */
  private animationConfig: any = {
    duration: 1000,
    easing: "easeOutQuart",
    delay: (ctx: any) => ctx.dataIndex * 120
  };

  mostrarMensaje(texto: string) {
    this.mensaje = texto;
    setTimeout(() => (this.mensaje = null), 3000);
  }

  /* ============================================================
     GRAFICO 1 – Equipos más solicitados
  ============================================================= */
  cargarEquiposMasSolicitados() {
    this.reportesService.getEquiposMasSolicitados().subscribe((data) => {
      const labels = data.map((x: any) => x.equipo);
      const valores = data.map((x: any) => x.total_solicitudes);

      this.chartEquipos?.destroy();

      this.chartEquipos = new Chart('graficoEquipos', {
        type: 'bar',
        data: {
          labels,
          datasets: [
            {
              label: 'Solicitudes',
              data: valores,
              backgroundColor: '#1f78ff'
            }
          ]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          animation: this.animationConfig,
          scales: { y: { beginAtZero: true } }
        }
      });
    });
  }

  /* ============================================================
     GRAFICO 2 – Pie interno/externo
  ============================================================= */
  cargarUsoInternoExterno() {
    this.reportesService.getUsoInternoExterno().subscribe((data) => {
      const labels = data.map((x: any) => x.tipo);
      const valores = data.map((x: any) => x.total);

      this.chartUso?.destroy();

      this.chartUso = new Chart('graficoUso', {
        type: 'pie',
        data: {
          labels,
          datasets: [
            {
              data: valores,
              backgroundColor: ['#1f78ff', '#ff5757']
            }
          ]
        },
        options: {
          responsive: true,
          animation: this.animationConfig,
          plugins: { legend: { position: 'bottom' } }
        }
      });
    });
  }

  /* ============================================================
     GRAFICO 3 – Sanciones y Rechazos
  ============================================================= */
  cargarSancionesYRechazos() {
    this.reportesService.getSancionesYRechazos().subscribe((data) => {
      this.sanciones = data.total_sanciones;
      this.rechazos = data.total_rechazos;

      this.chartSanciones?.destroy();

      this.chartSanciones = new Chart('graficoSanciones', {
        type: 'bar',
        data: {
          labels: ['Sanciones', 'Rechazos'],
          datasets: [
            {
              data: [this.sanciones, this.rechazos],
              backgroundColor: ['#ff3b3b', '#f1c40f']
            }
          ]
        },
        options: {
          responsive: true,
          animation: this.animationConfig,
          scales: { y: { beginAtZero: true } }
        }
      });
    });
  }

  /* ============================================================
     TABLA – Equipos dados de baja
  ============================================================= */
  cargarEquiposDadoDeBaja() {
    this.reportesService.getEquiposDadoDeBaja().subscribe((data) => {
      this.equiposBaja = data;
    });
  }

/* ============================================================
   EXPORTAR EXCEL – TODA LA INFORMACIÓN DEL DASHBOARD
============================================================= */
exportarExcel() {

  const wb = XLSX.utils.book_new();

  /* ---------------------- HOJA 1 ---------------------- */
  const dataSolicitados = this.chartEquipos?.data?.labels?.map((label: any, i: number) => ({
    Equipo: label,
    Solicitudes: (this.chartEquipos.data.datasets[0].data as number[])[i]
  })) || [];

  const ws1 = XLSX.utils.json_to_sheet(dataSolicitados.length ? dataSolicitados : [{ Mensaje: "No hay datos disponibles" }]);
  XLSX.utils.book_append_sheet(wb, ws1, 'Equipos_Solicitados');


  /* ---------------------- HOJA 2 ---------------------- */
  const dataUso = this.chartUso?.data?.labels?.map((label: any, i: number) => ({
    Tipo: label,
    Total: (this.chartUso.data.datasets[0].data as number[])[i]
  })) || [];

  const ws2 = XLSX.utils.json_to_sheet(dataUso.length ? dataUso : [{ Mensaje: "No hay datos disponibles" }]);
  XLSX.utils.book_append_sheet(wb, ws2, 'Uso_Interno_vs_Externo');


  /* ---------------------- HOJA 3 ---------------------- */
  const dataDisciplina = [
    { Tipo: 'Sanciones', Total: this.sanciones },
    { Tipo: 'Rechazos', Total: this.rechazos }
  ];

  const ws3 = XLSX.utils.json_to_sheet(dataDisciplina);
  XLSX.utils.book_append_sheet(wb, ws3, 'Sanciones_Rechazos');


  /* ---------------------- HOJA 4 ---------------------- */
  const dataBaja = this.equiposBaja.map((x) => ({
    ID: x.id,
    Código: x.codigo,
    Tipo: x.tipo,
    Estado: x.estado,
    Fecha: this.datePipe.transform(x.created_at, 'dd/MM/yyyy')
  }));

  const ws4 = XLSX.utils.json_to_sheet(
    dataBaja.length ? dataBaja : [{ Mensaje: "No hay equipos dados de baja" }]
  );

  XLSX.utils.book_append_sheet(wb, ws4, 'Equipos_Baja');


  /* ---------------------- EXPORTAR ---------------------- */
  const buffer = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
  saveAs(new Blob([buffer]), `Dashboard_UTA_${Date.now()}.xlsx`);

  this.mostrarMensaje("Excel exportado correctamente.");
}


  /* ============================================================
     EXPORTAR PDF – FORMATO PROFESIONAL POWER BI
  ============================================================= */
  exportarPDF() {
    const contenido = document.getElementById('contenidoPDF');

    if (!contenido) {
      this.mostrarMensaje("No se encontró el contenido para exportar.");
      return;
    }

    html2canvas(contenido, { scale: 3 }).then((canvas) => {
      const imgData = canvas.toDataURL('image/png');

      const pdf = new jsPDF('p', 'mm', 'a4');
      const imgWidth = 210;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;

      pdf.addImage(imgData, 'PNG', 0, 0, imgWidth, imgHeight);
      pdf.save('Dashboard_UTA.pdf');
    });

    this.mostrarMensaje("PDF generado correctamente.");
  }
}
