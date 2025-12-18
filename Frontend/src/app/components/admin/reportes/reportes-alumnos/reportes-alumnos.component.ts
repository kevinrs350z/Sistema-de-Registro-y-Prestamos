import { Component, OnDestroy, OnInit } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { Chart } from 'chart.js/auto';
import { ExportButtonsComponent } from '../export-buttons/export-buttons.component';
import { ExportService } from '../../../../services/export.service';
import { ReportesAlumnosService } from '../../../../services/reportes/reportes-alumnos.service';

interface KpiAlumno {
  label: string;
  value: number;
  detail?: string;
}

interface AlumnoRanking {
  nombre: string;
  email: string;
  carrera?: string;
  total_prestamos: number;
  sanciones?: number;
}

@Component({
  selector: 'app-reportes-alumnos',
  standalone: true,
  imports: [CommonModule, ExportButtonsComponent],
  templateUrl: './reportes-alumnos.component.html',
  styleUrls: ['./reportes-alumnos.component.css'],
  providers: [DatePipe]
})
export class ReportesAlumnosComponent implements OnInit, OnDestroy {

  today = new Date();
  mensaje: string | null = null;

  // KPIs
  kpis: KpiAlumno[] = [
    { label: 'Alumnos con préstamos', value: 0 },
    { label: 'Préstamos promedio por alumno', value: 0 },
    { label: 'Alumnos con sanciones', value: 0 },
    { label: 'Nuevos alumnos este semestre', value: 0 }
  ];

  // Gráficos (instancias)
  private chartPrestamosCarrera?: Chart;
  private chartSancionesNivel?: Chart;
  private chartEvolucionPrestamos?: Chart;
  private chartTopAlumnos?: Chart;

  // Datos de resumen
  resumenSanciones = {
    total: 0,
    leves: 0,
    medias: 0,
    graves: 0
  };

  // Ranking de alumnos
  topAlumnos: AlumnoRanking[] = [];

  constructor(
    private alumnosService: ReportesAlumnosService,
    private exportService: ExportService
  ) {}

  ngOnInit(): void {
    this.cargarKPIs();
    this.cargarPrestamosPorCarrera();
    this.cargarSancionesPorNivel();
    this.cargarEvolucionPrestamos();
    this.cargarTopAlumnos();
  }

  ngOnDestroy(): void {
    this.chartPrestamosCarrera?.destroy();
    this.chartSancionesNivel?.destroy();
    this.chartEvolucionPrestamos?.destroy();
    this.chartTopAlumnos?.destroy();
  }

  /* ===================== UTILIDAD MENSAJE ===================== */
  private mostrarMensaje(texto: string) {
    this.mensaje = texto;
    setTimeout(() => (this.mensaje = null), 3000);
  }

  /* ===================== 1) KPIs ALUMNOS ===================== */
  private cargarKPIs() {
    this.alumnosService.getKPIsAlumnos().subscribe({
      next: (data) => {
        // ajusta los nombres a lo que devuelva tu backend
        this.kpis[0].value = data.alumnosConPrestamos ?? 0;
        this.kpis[1].value = data.prestamosPromedio ?? 0;
        this.kpis[2].value = data.alumnosConSanciones ?? 0;
        this.kpis[3].value = data.nuevosSemestre ?? 0;

        if (data.variacionPrestamos != null) {
          const dif = data.variacionPrestamos;
          const signo = dif > 0 ? '+' : '';
          this.kpis[1].detail = `${signo}${dif} vs período anterior`;
        }
      },
      error: () => this.mostrarMensaje('No se pudieron cargar los KPIs de alumnos.')
    });
  }

  /* ===================== 2) PRÉSTAMOS POR CARRERA ===================== */
  private cargarPrestamosPorCarrera() {
    this.alumnosService.getPrestamosPorCarrera().subscribe({
      next: (data) => {
        const labels = data.map((x: any) => x.carrera || 'Sin carrera');
        const valores = data.map((x: any) => x.total_prestamos || x.total || 0);

        this.chartPrestamosCarrera?.destroy();

        this.chartPrestamosCarrera = new Chart('chartPrestamosCarrera', {
          type: 'bar',
          data: {
            labels,
            datasets: [
              {
                label: 'Préstamos',
                data: valores,
                backgroundColor: '#1f78ff'
              }
            ]
          },
          options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
              x: {
                ticks: { maxRotation: 40, minRotation: 0 }
              },
              y: {
                beginAtZero: true
              }
            }
          }
        });
      },
      error: () => this.mostrarMensaje('No se pudieron cargar los préstamos por carrera.')
    });
  }

  /* ===================== 3) SANCIONES POR NIVEL ===================== */
  private cargarSancionesPorNivel() {
    this.alumnosService.getSancionesPorNivel().subscribe({
      next: (data) => {
        const labels = data.map((x: any) => x.nivel);
        const valores = data.map((x: any) => x.total);

        // Resumen rápido
        this.resumenSanciones.total = valores.reduce((a: number, b: number) => a + b, 0);
        this.resumenSanciones.leves =
          (data.find((d: any) => (d.nivel || '').toUpperCase() === 'LEVE')?.total) || 0;
        this.resumenSanciones.medias =
          (data.find((d: any) => (d.nivel || '').toUpperCase() === 'MEDIA')?.total) || 0;
        this.resumenSanciones.graves =
          (data.find((d: any) => (d.nivel || '').toUpperCase() === 'GRAVE')?.total) || 0;

        this.chartSancionesNivel?.destroy();

        this.chartSancionesNivel = new Chart('chartSancionesNivel', {
          type: 'doughnut',
          data: {
            labels,
            datasets: [
              {
                data: valores,
                backgroundColor: ['#f1c40f', '#e67e22', '#e74c3c']
              }
            ]
          },
          options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
              legend: {
                position: 'bottom'
              }
            }
          }
        });
      },
      error: () => this.mostrarMensaje('No se pudieron cargar las sanciones por nivel.')
    });
  }

  /* ===================== 4) EVOLUCIÓN PRÉSTAMOS ALUMNOS ===================== */
  private cargarEvolucionPrestamos() {
    this.alumnosService.getEvolucionPrestamosAlumnos().subscribe({
      next: (data) => {
        const labels = data.map((x: any) => x.periodo); // ej: '2025-01', '2025-02'
        const valores = data.map((x: any) => x.total_prestamos || x.total || 0);

        this.chartEvolucionPrestamos?.destroy();

        this.chartEvolucionPrestamos = new Chart('chartEvolucionPrestamos', {
          type: 'line',
          data: {
            labels,
            datasets: [
              {
                label: 'Préstamos',
                data: valores,
                borderColor: '#0d6efd',
                backgroundColor: 'rgba(13, 110, 253, 0.15)',
                tension: 0.3,
                fill: true,
                pointRadius: 3
              }
            ]
          },
          options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
              y: { beginAtZero: true }
            }
          }
        });
      },
      error: () => this.mostrarMensaje('No se pudo cargar la evolución de préstamos.')
    });
  }

  /* ===================== 5) TOP ALUMNOS ===================== */
  private cargarTopAlumnos() {
    this.alumnosService.getRankingAlumnos().subscribe({
      next: (data) => {
        this.topAlumnos = (data || []).map((a: any) => ({
          nombre: a.nombre,
          email: a.email,
          carrera: a.carrera,
          total_prestamos: a.total_prestamos ?? a.total_solicitudes ?? 0,
          sanciones: a.sanciones ?? 0
        }));

        const labels = this.topAlumnos.map(a => a.nombre);
        const valores = this.topAlumnos.map(a => a.total_prestamos);

        this.chartTopAlumnos?.destroy();

        this.chartTopAlumnos = new Chart('chartTopAlumnosAl', {
          type: 'bar',
          data: {
            labels,
            datasets: [
              {
                data: valores,
                backgroundColor: '#6c5ce7'
              }
            ]
          },
          options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
              y: { beginAtZero: true }
            }
          }
        });
      },
      error: () => this.mostrarMensaje('No se pudo cargar el ranking de alumnos.')
    });
  }

  /* ===================== EXPORTAR ===================== */
  exportarPDF() {
    this.exportService.exportarPDF('contenidoPDFAlumnos', 'Reporte_Alumnos_UTA.pdf')
      .catch(() => this.mostrarMensaje('Ocurrió un error al generar el PDF.'));
  }

  exportarExcel() {
    const sheets = [
      {
        name: 'KPIs_Alumnos',
        data: this.kpis.map(k => ({
          Indicador: k.label,
          Valor: k.value,
          Detalle: k.detail ?? ''
        }))
      },
      {
        name: 'Ranking_Alumnos',
        data: this.topAlumnos.map((a, idx) => ({
          Rank: idx + 1,
          Nombre: a.nombre,
          Email: a.email,
          Carrera: a.carrera ?? '',
          Prestamos: a.total_prestamos,
          Sanciones: a.sanciones ?? 0
        }))
      },
      {
        name: 'Resumen_Sanciones',
        data: [
          { Tipo: 'Total sanciones', Total: this.resumenSanciones.total },
          { Tipo: 'Leves', Total: this.resumenSanciones.leves },
          { Tipo: 'Medias', Total: this.resumenSanciones.medias },
          { Tipo: 'Graves', Total: this.resumenSanciones.graves }
        ]
      }
    ];

    try {
      this.exportService.exportarExcel(sheets, `Reporte_Alumnos_UTA_${Date.now()}.xlsx`);
      this.mostrarMensaje('Excel exportado correctamente.');
    } catch (error) {
      this.mostrarMensaje('Ocurrió un error al exportar el Excel.');
    }
  }
}
