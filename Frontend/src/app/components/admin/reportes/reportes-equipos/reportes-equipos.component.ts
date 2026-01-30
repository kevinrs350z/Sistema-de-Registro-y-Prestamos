import { Component, OnInit, OnDestroy, inject } from '@angular/core';
import { Chart } from 'chart.js/auto';
import { ReportesService } from '../../../../services/reportes.service';
import { CommonModule, DatePipe } from '@angular/common';
import { ExportButtonsComponent } from '../export-buttons/export-buttons.component';
import { ExportService, ReporteData } from '../../../../services/export.service';

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
  fechaInicio: string = '';
  fechaFin: string = '';
  periodo: string = 'dias';

  tituloActual = 'Estadísticas de equipos';

  sanciones = 0;
  rechazos = 0;
  equiposBaja: any[] = [];
  disponibilidadEquipos: any[] = [];
  equiposCriticos: any[] = [];
  disponibilidadPage = 1;
  disponibilidadPageSize = 8;
  today = new Date();
  mensaje: string | null = null;
  universidad = 'Universidad de Tarapacá';
  departamento = 'Departamento de Diseño Multimedia';
  reporteTitulo = 'Reporte de Equipos';
  rangoFechas = 'Últimos 12 meses';
  usuarioGenera = '—';
  fechaGeneracion = new Date();

  private datePipe = inject(DatePipe);

  private chartEquipos!: Chart;
  private chartUso!: Chart;
  private chartSanciones!: Chart;

  constructor(
    private reportesService: ReportesService,
    private exportService: ExportService
  ) {}

  ngOnInit(): void {
    this.cargarUsuario();
    this.cargarEquiposMasSolicitados();
    this.cargarUsoInternoExterno();
    this.cargarSancionesYRechazos();
    this.cargarEquiposDadoDeBaja();
    this.cargarDisponibilidad();
    this.cargarEquiposCriticos();
  }

    filtrarPorFecha() {
      // Aquí deberías llamar al backend con los parámetros de fecha y periodo
      // Por ahora, solo actualiza el rango mostrado
      let rango = '';
      if (this.fechaInicio && this.fechaFin) {
        rango = `Del ${this.datePipe.transform(this.fechaInicio, 'dd/MM/yyyy')} al ${this.datePipe.transform(this.fechaFin, 'dd/MM/yyyy')}`;
      } else {
        rango = 'Sin filtro';
      }
      this.rangoFechas = rango + (this.periodo ? ` (${this.periodo})` : '');
      // Aquí deberías recargar los datos usando el filtro
      // Ejemplo: this.reportesService.getEquiposMasSolicitados(this.fechaInicio, this.fechaFin, this.periodo).subscribe(...)
      this.mostrarMensaje('Filtro aplicado.');
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

      const canvas = document.getElementById('graficoEquipos') as HTMLCanvasElement | null;
      const ctx = canvas?.getContext('2d');
      if (!ctx) return;

      const grad = ctx.createLinearGradient(0, 0, 0, 240);
      grad.addColorStop(0, '#3b82f6');
      grad.addColorStop(1, '#60a5fa');

      this.chartEquipos = new Chart(ctx, {
        type: 'bar',
        data: {
          labels,
          datasets: [{
            data: valores,
            backgroundColor: grad,
            borderRadius: 10,
            borderSkipped: false,
            barThickness: 22
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          animation: { ...this.animationConfig, duration: 900 },
          scales: {
            x: { grid: { display: false } },
            y: { beginAtZero: true, grid: { color: 'rgba(15,23,42,0.06)' } }
          },
          plugins: { legend: { display: false } }
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

      const canvas = document.getElementById('graficoUso') as HTMLCanvasElement | null;
      const ctx = canvas?.getContext('2d');
      if (!ctx) return;

      this.chartUso = new Chart(ctx, {
        type: 'pie',
        data: {
          labels,
          datasets: [{
            data: valores,
            backgroundColor: ['#3b82f6', '#ef4444'],
            borderColor: '#ffffff',
            borderWidth: 2
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          animation: { ...this.animationConfig, duration: 800 },
          plugins: {
            legend: {
              display: true,
              position: 'bottom',
              labels: { boxWidth: 12, usePointStyle: true }
            }
          }
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

      const canvas = document.getElementById('graficoSanciones') as HTMLCanvasElement | null;
      const ctx = canvas?.getContext('2d');
      if (!ctx) return;

      this.chartSanciones = new Chart(ctx, {
        type: 'bar',
        data: {
          labels: ['Sanciones', 'Rechazos'],
          datasets: [{
            data: [this.sanciones, this.rechazos],
            backgroundColor: ['#ef4444', '#f59e0b'],
            borderRadius: 10,
            borderSkipped: false,
            barThickness: 26
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          animation: { ...this.animationConfig, duration: 850 },
          scales: {
            x: { grid: { display: false } },
            y: { beginAtZero: true, grid: { color: 'rgba(15,23,42,0.06)' } }
          }
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

  cargarDisponibilidad() {
    this.reportesService.getDisponibilidadEquipos().subscribe((data) => {
      this.disponibilidadEquipos = data || [];
      const totalPages = this.disponibilidadTotalPages;
      if (this.disponibilidadPage > totalPages) {
        this.disponibilidadPage = totalPages;
      }
    }, (err) => {
      console.error('Error cargando disponibilidad:', err);
    });
  }

  get disponibilidadTotalPages(): number {
    return Math.max(1, Math.ceil(this.disponibilidadEquipos.length / this.disponibilidadPageSize));
  }

  get disponibilidadPaginada(): any[] {
    const start = (this.disponibilidadPage - 1) * this.disponibilidadPageSize;
    return this.disponibilidadEquipos.slice(start, start + this.disponibilidadPageSize);
  }

  cambiarPaginaDisponibilidad(delta: number) {
    const next = this.disponibilidadPage + delta;
    if (next < 1 || next > this.disponibilidadTotalPages) return;
    this.disponibilidadPage = next;
  }

  cargarEquiposCriticos() {
    this.reportesService.getEquiposCriticos().subscribe((data) => {
      this.equiposCriticos = data || [];
    }, (err) => {
      console.error('Error cargando equipos críticos:', err);
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
    const reporteData: ReporteData = {
      titulo: 'Reporte de Equipos',
      subtitulo: 'Estadísticas del Sistema de Préstamos de Equipos',
      fechaGeneracion: new Date(),
      usuario: this.usuarioGenera,
      periodo: this.rangoFechas,
      secciones: [
        {
          tipo: 'kpis',
          titulo: 'Indicadores Disciplinarios',
          datos: [
            { label: 'Sanciones', valor: this.sanciones },
            { label: 'Rechazos', valor: this.rechazos }
          ]
        },
        {
          tipo: 'tabla',
          titulo: 'Disponibilidad de Equipos',
          subtitulo: 'Estado actual por equipo',
          datos: {
            columnas: ['Código', 'Tipo', 'Estado', 'Ubicación', 'Último Evento'],
            filas: this.disponibilidadEquipos.map(d => [
              d.codigo,
              d.tipo,
              d.estado,
              d.ubicacion,
              this.datePipe.transform(d.ultimo_evento, 'dd/MM HH:mm') || '—'
            ]),
            anchos: [80, '*', 80, '*', 90]
          }
        },
        {
          tipo: 'tabla',
          titulo: 'Equipos Críticos / Bloqueados',
          subtitulo: 'Equipos que requieren atención operativa',
          datos: {
            columnas: ['Código', 'Tipo', 'Estado', 'Observación'],
            filas: this.equiposCriticos.map(c => [
              c.codigo,
              c.tipo,
              c.estado,
              c.observacion || 'Sin detalle'
            ]),
            anchos: [80, '*', 100, '*']
          }
        }
      ]
    };

    this.exportService.exportarPDFInstitucional(reporteData, 'Reporte_Equipos_UTA.pdf')
      .then(() => this.mostrarMensaje('PDF generado correctamente.'))
      .catch(() => this.mostrarMensaje('Ocurrió un error al generar el PDF.'));
  }

  private cargarUsuario(): void {
    try {
      const raw = localStorage.getItem('user');
      if (!raw) return;
      const u = JSON.parse(raw);
      this.usuarioGenera = u?.nombre || u?.email || '—';
    } catch {
      this.usuarioGenera = '—';
    }
  }
}
