import {
  Component,
  OnDestroy,
  OnInit,
  ViewChild,
  ElementRef
} from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { Chart } from 'chart.js/auto';
import { ExportButtonsComponent } from '../export-buttons/export-buttons.component';
import { ExportService, ReporteData } from '../../../../services/export.service';
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
  universidad = 'Universidad de Tarapacá';
  departamento = 'Departamento de Diseño Multimedia';
  reporteTitulo = 'Reporte de Alumnos';
  rangoFechas = 'Últimos 12 meses';
  usuarioGenera = '—';
  fechaGeneracion = new Date();

  // Canvas refs
  @ViewChild('evolucionPrestamosCanvas') evolucionPrestamosCanvas?: ElementRef<HTMLCanvasElement>;
  @ViewChild('sancionesNivelCanvas') sancionesNivelCanvas?: ElementRef<HTMLCanvasElement>;
  @ViewChild('topAlumnosCanvas') topAlumnosCanvas?: ElementRef<HTMLCanvasElement>;

  // KPIs
  kpis: KpiAlumno[] = [
    { label: 'Alumnos con préstamos', value: 0 },
    { label: 'Préstamos promedio por alumno', value: 0 },
    { label: 'Alumnos con sanciones', value: 0 },
    { label: 'Nuevos alumnos este semestre', value: 0 }
  ];

  // Charts
  private chartSancionesNivel?: Chart;
  private chartEvolucionPrestamos?: Chart;
  private chartTopAlumnos?: Chart;

  // Resumen sanciones
  resumenSanciones = { total: 0, leves: 0, medias: 0, graves: 0 };

  // Ranking alumnos
  topAlumnos: AlumnoRanking[] = [];

  constructor(
    private alumnosService: ReportesAlumnosService,
    private exportService: ExportService
  ) {}
  
   fechaInicio: string = '';
   fechaFin: string = '';
   periodo: string = 'dias';

  ngOnInit(): void {
    this.cargarUsuario();
    this.cargarKPIs();
    this.cargarSancionesPorNivel();
    this.cargarEvolucionPrestamos();
    this.cargarTopAlumnos();
  }

   filtrarPorFecha() {
     let rango = '';
     if (this.fechaInicio && this.fechaFin) {
       rango = `Del ${this.fechaInicio} al ${this.fechaFin}`;
     } else {
       rango = 'Sin filtro';
     }
     // Aquí deberías recargar los datos usando el filtro
     // Ejemplo: this.reportesService.getAlumnos(this.fechaInicio, this.fechaFin, this.periodo).subscribe(...)
     // Mostrar mensaje de filtro aplicado
     // this.mostrarMensaje('Filtro aplicado.');
   }

  ngOnDestroy(): void {
    this.destroyCharts();
  }

  private destroyCharts() {
    this.chartSancionesNivel?.destroy();
    this.chartEvolucionPrestamos?.destroy();
    this.chartTopAlumnos?.destroy();

    this.chartSancionesNivel = undefined;
    this.chartEvolucionPrestamos = undefined;
    this.chartTopAlumnos = undefined;
  }

  private mostrarMensaje(texto: string) {
    this.mensaje = texto;
    setTimeout(() => (this.mensaje = null), 3000);
  }

  /* ===================== 1) KPIs ===================== */
  private cargarKPIs() {
    this.alumnosService.getKPIsAlumnos().subscribe({
      next: (data) => {
        this.kpis[0].value = data?.alumnosConPrestamos ?? 0;
        this.kpis[1].value = data?.prestamosPromedio ?? 0;
        this.kpis[2].value = data?.alumnosConSanciones ?? 0;
        this.kpis[3].value = data?.nuevosSemestre ?? 0;

        if (data?.variacionPrestamos != null) {
          const dif = Number(data.variacionPrestamos);
          const signo = dif > 0 ? '+' : '';
          this.kpis[1].detail = `${signo}${dif} vs período anterior`;
        } else {
          this.kpis[1].detail = '';
        }
      },
      error: () => this.mostrarMensaje('No se pudieron cargar los KPIs de alumnos.')
    });
  }

  /* ===================== 2) SANCIONES POR NIVEL ===================== */
  private cargarSancionesPorNivel() {
    this.alumnosService.getSancionesPorNivel().subscribe({
      next: (data) => {
        const safe = Array.isArray(data) ? data : [];

        const labels = safe.map((x: any) => x.nivel ?? 'DESCONOCIDO');
        const valores = safe.map((x: any) => Number(x.total ?? 0));

        // Resumen
        const total = valores.reduce((a: number, b: number) => a + b, 0);
        this.resumenSanciones.total = total;

        const get = (nivel: string) =>
          (safe.find((d: any) => String(d.nivel || '').toUpperCase() === nivel)?.total) ?? 0;

        this.resumenSanciones.leves = Number(get('LEVE'));
        this.resumenSanciones.medias = Number(get('MEDIA'));
        this.resumenSanciones.graves = Number(get('GRAVE'));

        this.chartSancionesNivel?.destroy();

        const canvas = this.sancionesNivelCanvas?.nativeElement;
        if (!canvas) return;

        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        this.chartSancionesNivel = new Chart(ctx, {
          type: 'doughnut',
          data: {
            labels,
            datasets: [{
              data: valores,
              backgroundColor: ['#f1c40f', '#e67e22', '#e74c3c']
            }]
          },
          options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
              legend: { position: 'bottom' }
            }
          }
        });
      },
      error: () => this.mostrarMensaje('No se pudieron cargar las sanciones por nivel.')
    });
  }

  /* ===================== 4) EVOLUCIÓN PRÉSTAMOS ===================== */
  private cargarEvolucionPrestamos() {
    this.alumnosService.getEvolucionPrestamosAlumnos().subscribe({
      next: (data) => {
        const safe = Array.isArray(data) ? data : [];

        const labels = safe.map((x: any) => x.periodo);
        const valores = safe.map((x: any) => Number(x.total_prestamos ?? x.total ?? 0));

        this.chartEvolucionPrestamos?.destroy();

        const canvas = this.evolucionPrestamosCanvas?.nativeElement;
        if (!canvas) return;

        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        this.chartEvolucionPrestamos = new Chart(ctx, {
          type: 'line',
          data: {
            labels,
            datasets: [{
              label: 'Préstamos',
              data: valores,
              borderColor: '#0d6efd',
              backgroundColor: 'rgba(13, 110, 253, 0.15)',
              tension: 0.3,
              fill: true,
              pointRadius: 3
            }]
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
        const safe = Array.isArray(data) ? data : [];

        this.topAlumnos = safe.map((a: any) => ({
          nombre: a.nombre,
          email: a.email,
          carrera: a.carrera,
          total_prestamos: Number(a.total_prestamos ?? a.total_solicitudes ?? 0),
          sanciones: Number(a.sanciones ?? 0)
        }));

        const labels = this.topAlumnos.map(a => a.nombre);
        const valores = this.topAlumnos.map(a => a.total_prestamos);

        this.chartTopAlumnos?.destroy();

        const canvas = this.topAlumnosCanvas?.nativeElement;
        if (!canvas) return;

        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        this.chartTopAlumnos = new Chart(ctx, {
          type: 'bar',
          data: {
            labels,
            datasets: [{
              label: 'Préstamos',
              data: valores,
              backgroundColor: '#6c5ce7'
            }]
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
    const reporteData: ReporteData = {
      titulo: 'Reporte de Alumnos',
      subtitulo: 'Comportamiento, sanciones y uso por carrera',
      fechaGeneracion: new Date(),
      usuario: this.usuarioGenera,
      periodo: this.rangoFechas,
      secciones: [
        {
          tipo: 'kpis',
          titulo: 'Indicadores Clave',
          datos: this.kpis.map(k => ({ label: k.label, valor: k.value }))
        },
        {
          tipo: 'tabla',
          titulo: 'Ranking de Alumnos',
          subtitulo: 'Estudiantes con mayor número de préstamos',
          datos: {
            columnas: ['#', 'Nombre', 'Email', 'Carrera', 'Préstamos', 'Sanciones'],
            filas: this.topAlumnos.map((a, idx) => [
              idx + 1,
              a.nombre,
              a.email,
              a.carrera || '—',
              a.total_prestamos,
              a.sanciones ?? 0
            ]),
            anchos: [30, '*', '*', '*', 60, 60]
          }
        },
        {
          tipo: 'tabla',
          titulo: 'Resumen de Sanciones',
          subtitulo: 'Distribución por nivel de gravedad',
          datos: {
            columnas: ['Tipo de Sanción', 'Cantidad'],
            filas: [
              ['Total sanciones', this.resumenSanciones.total],
              ['Sanciones leves', this.resumenSanciones.leves],
              ['Sanciones medias', this.resumenSanciones.medias],
              ['Sanciones graves', this.resumenSanciones.graves]
            ],
            anchos: ['*', 100]
          }
        }
      ]
    };

    this.exportService.exportarPDFInstitucional(reporteData, 'Reporte_Alumnos_UTA.pdf')
      .then(() => this.mostrarMensaje('PDF generado correctamente.'))
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
    } catch {
      this.mostrarMensaje('Ocurrió un error al exportar el Excel.');
    }
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
