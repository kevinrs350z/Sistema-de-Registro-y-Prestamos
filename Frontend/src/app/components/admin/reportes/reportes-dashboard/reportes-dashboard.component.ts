import {
  Component,
  OnInit,
  OnDestroy,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { Chart } from 'chart.js/auto';
import { ExportButtonsComponent } from '../export-buttons/export-buttons.component';
import { DashboardReportesService } from '../../../../services/reportes/dashboard-reportes.service';
import { ExportService } from '../../../../services/export.service';

@Component({
  selector: 'app-reportes-dashboard',
  standalone: true,
  templateUrl: './reportes-dashboard.component.html',
  styleUrls: ['./reportes-dashboard.component.css'],
  imports: [CommonModule, ExportButtonsComponent],
})
export class ReportesDashboardComponent implements OnInit, OnDestroy {

  today = new Date();
  mensaje: string | null = null;

  kpis = [
    { label: 'Préstamos del mes', value: 0, detail: '' },
    { label: 'Equipos disponibles', value: 0 },
    { label: 'Usuarios activos', value: 0 },
    { label: 'Sanciones activas', value: 0 }
  ];

  resumenUso = { interno: 0, externo: 0 };

  sanciones = 0;
  rechazos = 0;

  topAlumnos: any[] = [];

  private chartSolicitudesDia?: Chart;
  private chartUsoGlobal?: Chart;
  private chartTopCategorias?: Chart;
  private chartSancionesRechazos?: Chart;
  private chartTopAlumnos?: Chart;

  constructor(
    private dashboardService: DashboardReportesService,
    private exportService: ExportService
  ) {}

  ngOnInit(): void {
    this.cargarKPIs();
    this.cargarSolicitudesPorDia();
    this.cargarUsoGlobal();
    this.cargarTopCategorias();
    this.cargarSancionesYRechazos();
    this.cargarTopAlumnos();
  }

  ngOnDestroy(): void {
    this.chartSolicitudesDia?.destroy();
    this.chartUsoGlobal?.destroy();
    this.chartTopCategorias?.destroy();
    this.chartSancionesRechazos?.destroy();
    this.chartTopAlumnos?.destroy();
  }

  private mostrarMensaje(texto: string) {
    this.mensaje = texto;
    setTimeout(() => this.mensaje = null, 3000);
  }

  //-----------------------------
  //   🚀 CARGA DE DATOS
  //-----------------------------

  private cargarKPIs() {
    this.dashboardService.getKPIsDashboard().subscribe({
      next: (data) => {
        this.kpis[0].value = data.prestamosMes ?? 0;
        this.kpis[1].value = data.equiposDisponibles ?? 0;
        this.kpis[2].value = data.usuariosActivos ?? 0;
        this.kpis[3].value = data.sancionesActivas ?? 0;

        if (data.prestamosMesAnterior != null) {
          const diff = data.prestamosMes - data.prestamosMesAnterior;
          const signo = diff > 0 ? '+' : '';
          this.kpis[0].detail = `${signo}${diff} vs mes anterior`;
        }
      },
      error: () => this.mostrarMensaje('No se pudieron cargar los KPIs.')
    });
  }

  private cargarSolicitudesPorDia() {
    this.dashboardService.getSolicitudesPorDia().subscribe({
      next: (data) => {
        const labels = data.map((x: any) => x.fecha);
        const valores = data.map((x: any) => x.total);

        this.chartSolicitudesDia?.destroy();
        this.chartSolicitudesDia = new Chart('chartSolicitudesDia', {
          type: 'line',
          data: {
            labels,
            datasets: [{
              label: 'Solicitudes',
              data: valores,
              borderColor: '#0d6efd',
              backgroundColor: 'rgba(13,110,253,0.15)',
              tension: 0.3,
              fill: true
            }]
          },
          options: { responsive: true, maintainAspectRatio: false }
        });
      },
      error: () => this.mostrarMensaje('Error al cargar solicitudes por día.')
    });
  }

  private cargarUsoGlobal() {
    this.dashboardService.getUsoInternoExternoGlobal().subscribe({
      next: (data) => {
        let interno = 0, externo = 0;

        data.forEach((x: any) => {
          if ((x.tipo || '').toLowerCase().includes('intern')) interno = x.total;
          else externo = x.total;
        });

        this.resumenUso = { interno, externo };

        this.chartUsoGlobal?.destroy();
        this.chartUsoGlobal = new Chart('chartUsoGlobal', {
          type: 'doughnut',
          data: {
            labels: ['Interno', 'Externo'],
            datasets: [{ data: [interno, externo], backgroundColor: ['#0d6efd', '#ff7675'] }]
          },
          options: { responsive: true, maintainAspectRatio: false }
        });
      },
      error: () => this.mostrarMensaje('Error al cargar uso global.')
    });
  }

  private cargarTopCategorias() {
    this.dashboardService.getTopCategorias().subscribe({
      next: (data) => {
        const labels = data.map((x: any) => x.categoria);
        const valores = data.map((x: any) => x.total_solicitudes);

        this.chartTopCategorias?.destroy();
        this.chartTopCategorias = new Chart('chartTopCategorias', {
          type: 'bar',
          data: {
            labels,
            datasets: [{ data: valores, backgroundColor: '#1f78ff' }]
          },
          options: { responsive: true, maintainAspectRatio: false }
        });
      },
      error: () => this.mostrarMensaje('Error al cargar categorías.')
    });
  }

  private cargarSancionesYRechazos() {
    this.dashboardService.getSancionesYRechazosGlobal().subscribe({
      next: (data) => {
        this.sanciones = data.total_sanciones ?? 0;
        this.rechazos = data.total_rechazos ?? 0;

        this.chartSancionesRechazos?.destroy();
        this.chartSancionesRechazos = new Chart('chartSancionesRechazos', {
          type: 'bar',
          data: {
            labels: ['Sanciones', 'Rechazos'],
            datasets: [{ data: [this.sanciones, this.rechazos], backgroundColor: ['#e74c3c', '#f1c40f'] }]
          },
          options: { responsive: true, maintainAspectRatio: false }
        });
      },
      error: () => this.mostrarMensaje('Error al cargar sanciones.')
    });
  }

  private cargarTopAlumnos() {
    this.dashboardService.getTopAlumnos().subscribe({
      next: (data) => {
        this.topAlumnos = data || [];

        const labels = this.topAlumnos.map((x: any) => x.nombre);
        const valores = this.topAlumnos.map((x: any) => x.total_solicitudes);

        this.chartTopAlumnos?.destroy();
        this.chartTopAlumnos = new Chart('chartTopAlumnos', {
          type: 'bar',
          data: {
            labels,
            datasets: [{ data: valores, backgroundColor: '#6c5ce7' }]
          },
          options: { responsive: true, maintainAspectRatio: false }
        });
      },
      error: () => this.mostrarMensaje('Error al cargar top alumnos.')
    });
  }

  //-----------------------------
  //   📄 EXPORTAR PDF
  //-----------------------------
  exportarPDF() {
    this.exportService
      .exportarPDF('contenidoPDFDashboard', 'Dashboard_UTA.pdf')
      .then(() => this.mostrarMensaje('PDF generado correctamente.'))
      .catch(() => this.mostrarMensaje('Error al generar PDF.'));
  }

  //-----------------------------
  //   📊 EXPORTAR EXCEL
  //-----------------------------
  exportarExcel() {

    const sheets = [
      {
        name: 'KPIs',
        data: this.kpis.map(k => ({
          Indicador: k.label,
          Valor: k.value,
          Detalle: k.detail ?? ''
        }))
      },
      {
        name: 'Uso_Interno_Externo',
        data: [
          { Tipo: 'Interno', Total: this.resumenUso.interno },
          { Tipo: 'Externo', Total: this.resumenUso.externo }
        ]
      },
      {
        name: 'Sanciones_Rechazos',
        data: [
          { Tipo: 'Sanciones', Total: this.sanciones },
          { Tipo: 'Rechazos', Total: this.rechazos }
        ]
      },
      {
        name: 'Top_Alumnos',
        data: this.topAlumnos.map((a, idx) => ({
          Rank: idx + 1,
          Nombre: a.nombre,
          Email: a.email,
          Solicitudes: a.total_solicitudes
        }))
      }
    ];

    this.exportService.exportarExcel(sheets, `Dashboard_UTA_${Date.now()}.xlsx`)
      .then(() => this.mostrarMensaje('Excel exportado correctamente.'))
      .catch(() => this.mostrarMensaje('Ocurrió un error al exportar el Excel.'));
  }

}
