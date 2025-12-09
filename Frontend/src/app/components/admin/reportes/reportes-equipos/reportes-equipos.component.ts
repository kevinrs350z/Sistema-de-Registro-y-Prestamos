import { Component, OnInit, OnDestroy, inject } from '@angular/core';
import { Chart } from 'chart.js/auto';
import { ReportesService } from '../../../../services/reportes.service';
import { CommonModule, DatePipe } from '@angular/common';
import { ExportButtonsComponent } from '../export-buttons/export-buttons.component';
import { ExportService } from '../../../../services/export.service';

/* ============================================================
   PLUGIN BARRAS REDONDEADAS CON SOMBRA
============================================================= */
Chart.register({
  id: 'roundedBars',
  beforeDraw(chart) {
    const ctx = chart.ctx;
    chart.data.datasets.forEach((dataset: any) => {
      const meta = chart.getDatasetMeta(0);
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
  imports: [CommonModule, DatePipe, ExportButtonsComponent],
  providers: [DatePipe]
})
export class ReportesEquiposComponent implements OnInit, OnDestroy {

  tituloActual = 'Estadísticas de equipos';

  sanciones = 0;
  rechazos = 0;
  equiposBaja: any[] = [];
  today = new Date();
  mensaje: string | null = null;

  private datePipe = inject(DatePipe);

  private chartEquipos!: Chart;
  private chartUso!: Chart;
  private chartSanciones!: Chart;

  constructor(
    private reportesService: ReportesService,
    private exportService: ExportService
  ) {}

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
    easing: 'easeOutQuart',
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
          datasets: [{ data: valores, backgroundColor: '#1f78ff' }]
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
          datasets: [{ data: valores, backgroundColor: ['#1f78ff', '#ff5757'] }]
        },
        options: {
          responsive: true,
          animation: this.animationConfig,
          plugins: { legend: { display: true, position: 'bottom' } }
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
          datasets: [{ data: [this.sanciones, this.rechazos], backgroundColor: ['#ff3b3b', '#f1c40f'] }]
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
     EXPORTAR EXCEL (USANDO SERVICIO)
  ============================================================= */
  exportExcel() {
    const sheets = [
      {
        name: 'Equipos_Solicitados',
        data: this.chartEquipos?.data?.labels?.map((label: any, i: number) => ({
          Equipo: label,
          Solicitudes: (this.chartEquipos.data.datasets[0].data as number[])[i]
        })) || []
      },
      {
        name: 'Uso_Interno_vs_Externo',
        data: this.chartUso?.data?.labels?.map((label: any, i: number) => ({
          Tipo: label,
          Total: (this.chartUso.data.datasets[0].data as number[])[i]
        })) || []
      },
      {
        name: 'Sanciones_Rechazos',
        data: [
          { Tipo: 'Sanciones', Total: this.sanciones },
          { Tipo: 'Rechazos', Total: this.rechazos }
        ]
      },
      {
        name: 'Equipos_Baja',
        data: this.equiposBaja.map((x) => ({
          ID: x.id,
          Código: x.codigo,
          Tipo: x.tipo,
          Estado: x.estado,
          Fecha: this.datePipe.transform(x.created_at, 'dd/MM/yyyy')
        }))
      }
    ];

    this.exportService.exportarExcel(sheets, 'Reporte_Equipos.xlsx');
    this.mostrarMensaje('Excel exportado correctamente.');
  }

  /* ============================================================
     EXPORTAR PDF (USANDO SERVICIO)
  ============================================================= */
  exportarPDF() {
    this.exportService.exportarPDF('contenidoPDF', 'Reporte_Equipos_UTA.pdf');
    this.mostrarMensaje('PDF generado correctamente.');
  }
}
