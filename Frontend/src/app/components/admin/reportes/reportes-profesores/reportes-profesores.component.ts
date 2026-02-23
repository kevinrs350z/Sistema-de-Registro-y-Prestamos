import { Component, OnInit, OnDestroy, ViewChild, ElementRef, AfterViewInit } from "@angular/core";
import { CommonModule } from "@angular/common";
import { FormsModule } from "@angular/forms";
import { Subject, takeUntil } from "rxjs";
import { Chart, registerables } from "chart.js";
import { ReportesProfesoresService } from "../../../../services/reportes/reportes-profesores.service";
import { ExportService, ReporteData } from "../../../../services/export.service";
import { ExportButtonsComponent } from "../export-buttons/export-buttons.component";
import { ReportFiltersComponent } from "../report-filters/report-filters.component";
import { ReportFiltersService, ReportFilter } from "../../../../services/report-filters.service";

Chart.register(...registerables);

@Component({
  selector: "app-reportes-profesores",
  standalone: true,
  imports: [CommonModule, ExportButtonsComponent, FormsModule, ReportFiltersComponent],
  templateUrl: "./reportes-profesores.component.html",
  styleUrls: ["./reportes-profesores.component.css"],
})
export class ReportesProfesoresComponent
  implements OnInit, AfterViewInit, OnDestroy {

  // Subject para cleanup
  private destroy$ = new Subject<void>();

  // Filtro centralizado actual
  currentFilter: ReportFilter | null = null;

  // =========================
  // TABLA
  // =========================
  equiposProfesor: any[] = [];
    fechaInicio: string = '';
    fechaFin: string = '';
    periodo: string = 'dias';

  currentPage = 1;
  pageSize = 10;
  totalPages = 1;
  pages: number[] = [];

  // Loading flags
  loadingPrestamos = true;
  loadingTendencia = true;
  loadingEquipos = true;

  // Error states
  errorPrestamos: string | null = null;
  errorTendencia: string | null = null;
  errorEquipos: string | null = null;

  // =========================
  // CHARTS (Chart.js)
  // =========================
  private chartPrestamos: Chart | null = null;
  private chartTendencia: Chart | null = null;

  prestamosPorProfesorData: { profesor: string; total: number }[] = [];
  tendenciaMeses: string[] = [];
  tendenciaSeries: any[] = [];

  constructor(
    private reportesService: ReportesProfesoresService,
    private exportService: ExportService,
    private filterService: ReportFiltersService
  ) {}

  // =============================================================
  // CICLO DE VIDA
  // =============================================================
  ngOnInit(): void {
    // Suscribirse a cambios del filtro centralizado
    this.filterService.filter$
      .pipe(takeUntil(this.destroy$))
      .subscribe((filter: ReportFilter) => {
        this.currentFilter = filter;
        this.cargarTodosLosDatos();
      });
  }

  ngAfterViewInit(): void {
    // Los gráficos se inicializarán cuando lleguen los datos
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
    
    if (this.chartPrestamos) {
      this.chartPrestamos.destroy();
      this.chartPrestamos = null;
    }
    if (this.chartTendencia) {
      this.chartTendencia.destroy();
      this.chartTendencia = null;
    }
  }

  // =============================================================
  // CARGA CENTRALIZADA DE DATOS
  // =============================================================
  cargarTodosLosDatos(): void {
    this.cargarGraficoPrestamos();
    this.cargarGraficoTendencia();
    this.cargarEquiposProfesor();
  }

    filtrarPorFecha() {
      let rango = '';
      if (this.fechaInicio && this.fechaFin) {
        rango = `Del ${this.fechaInicio} al ${this.fechaFin}`;
      } else {
        rango = 'Sin filtro';
      }
      // Aquí deberías recargar los datos usando el filtro
      // Ejemplo: this.reportesService.getProfesores(this.fechaInicio, this.fechaFin, this.periodo).subscribe(...)
      // Mostrar mensaje de filtro aplicado
      // this.mostrarMensaje('Filtro aplicado.');
    }
  // =============================================================
  // TABLA – Equipos por profesor
  // =============================================================
  cargarEquiposProfesor(): void {
    if (!this.currentFilter) return;
    
    this.loadingEquipos = true;
    this.errorEquipos = null;
    
    this.reportesService
      .getEquiposPorProfesorWithFilter(this.currentFilter, this.currentPage, this.pageSize)
      .subscribe({
        next: (res) => {
          this.equiposProfesor = res.data ?? [];
          this.totalPages = res.totalPages ?? 1;
          this.updatePagination();
          this.loadingEquipos = false;
        },
        error: (err) => {
          this.equiposProfesor = [];
          this.loadingEquipos = false;
          this.errorEquipos = 'Error al cargar equipos por profesor';
          console.error('Error equipos profesor:', err);
        }
      });
  }

  // Método legacy para compatibilidad
  loadEquiposProfesor(): void {
    this.cargarEquiposProfesor();
  }

  updatePagination(): void {
    this.pages = Array.from(
      { length: this.totalPages },
      (_, i) => i + 1
    );
  }

  prevPage(): void {
    if (this.currentPage > 1) {
      this.currentPage--;
      this.loadEquiposProfesor();
    }
  }

  nextPage(): void {
    if (this.currentPage < this.totalPages) {
      this.currentPage++;
      this.loadEquiposProfesor();
    }
  }

  goToPage(page: number): void {
    this.currentPage = page;
    this.loadEquiposProfesor();
  }

  // =============================================================
  // GRÁFICO 1 – PRÉSTAMOS POR PROFESOR (Chart.js horizontal bar)
  // =============================================================
  private renderPrestamoChart(profesores: string[], totales: number[]): void {
    const canvas = document.getElementById("profesorPrestamoChart") as HTMLCanvasElement;
    if (!canvas) return;

    if (this.chartPrestamos) {
      this.chartPrestamos.destroy();
      this.chartPrestamos = null;
    }

    // Top 12
    const limit = 12;
    const slicedProfesores = profesores.slice(0, limit);
    const slicedTotales = totales.slice(0, limit);

    this.chartPrestamos = new Chart(canvas, {
      type: 'bar',
      data: {
        labels: slicedProfesores,
        datasets: [{
          label: 'Préstamos',
          data: slicedTotales,
          backgroundColor: 'rgba(99, 102, 241, 0.8)',
          borderColor: 'rgba(99, 102, 241, 1)',
          borderWidth: 1,
          borderRadius: 8
        }]
      },
      options: {
        indexAxis: 'y',
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: false },
          tooltip: { mode: 'index', intersect: false }
        },
        scales: {
          x: { beginAtZero: true, grid: { display: false } },
          y: { grid: { display: false } }
        }
      }
    });
  }

  cargarGraficoPrestamos(): void {
    if (!this.currentFilter) return;
    
    this.loadingPrestamos = true;
    this.errorPrestamos = null;
    
    this.reportesService.getPrestamosPorProfesorWithFilter(this.currentFilter).subscribe({
      next: (data) => {
        const safe = Array.isArray(data) ? data : [];
        const profesores = safe.map((x: any) => x.profesor);
        const totales = safe.map((x: any) => x.total);

        this.prestamosPorProfesorData = safe.map((x: any) => ({
          profesor: x.profesor,
          total: Number(x.total ?? 0)
        }));

        this.loadingPrestamos = false;

        requestAnimationFrame(() => {
          this.renderPrestamoChart(profesores, totales);
        });
      },
      error: (err) => {
        this.loadingPrestamos = false;
        this.prestamosPorProfesorData = [];
        this.errorPrestamos = 'Error al cargar préstamos por profesor';
        console.error('Error préstamos profesor:', err);
      }
    });
  }

  // Método legacy para compatibilidad
  loadGraficoPrestamos(): void {
    this.cargarGraficoPrestamos();
  }

  // =============================================================
  // GRÁFICO 2 – TENDENCIA TEMPORAL (Chart.js multi-line)
  // =============================================================
  private renderTendenciaChart(meses: string[], series: any[]): void {
    const canvas = document.getElementById("profesorTendenciaChart") as HTMLCanvasElement;
    if (!canvas) return;

    if (this.chartTendencia) {
      this.chartTendencia.destroy();
      this.chartTendencia = null;
    }

    const colors = ['#6366f1', '#f59e0b', '#10b981', '#ef4444', '#3b82f6', '#8b5cf6'];
    
    // Top 6 series by total
    const seriesWithTotal = (series || [])
      .filter((s: any) => s && Array.isArray(s.data))
      .map((s: any) => ({
        ...s,
        _total: (s.data || []).reduce((a: number, b: number) => a + b, 0),
      }));
    seriesWithTotal.sort((a: any, b: any) => b._total - a._total);
    const topSeries = seriesWithTotal.slice(0, 6);

    const datasets = topSeries.map((s: any, i: number) => ({
      label: s.name ?? 'Serie',
      data: [...s.data],
      borderColor: colors[i % colors.length],
      backgroundColor: colors[i % colors.length] + '20',
      tension: 0.3,
      fill: false,
      pointRadius: 3,
      pointHoverRadius: 5
    }));

    this.chartTendencia = new Chart(canvas, {
      type: 'line',
      data: {
        labels: meses || [],
        datasets
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            position: 'top',
            labels: { font: { size: 11 }, usePointStyle: true }
          },
          tooltip: { mode: 'index', intersect: false }
        },
        scales: {
          x: { grid: { display: false } },
          y: { beginAtZero: true }
        },
        interaction: { mode: 'nearest', axis: 'x', intersect: false }
      }
    });
  }

  cargarGraficoTendencia(): void {
    if (!this.currentFilter) return;
    
    this.loadingTendencia = true;
    this.errorTendencia = null;
    
    this.reportesService.getTendenciaPrestamosWithFilter(this.currentFilter).subscribe({
      next: (res) => {
        this.tendenciaMeses = Array.isArray(res?.meses) ? res.meses : [];
        this.tendenciaSeries = Array.isArray(res?.series) ? res.series : [];
        this.loadingTendencia = false;
        requestAnimationFrame(() => {
          this.renderTendenciaChart(this.tendenciaMeses, this.tendenciaSeries);
        });
      },
      error: (err) => {
        this.loadingTendencia = false;
        this.tendenciaMeses = [];
        this.tendenciaSeries = [];
        this.errorTendencia = 'Error al cargar tendencia de préstamos';
        console.error('Error tendencia:', err);
      }
    });
  }

  // Método legacy para compatibilidad
  loadGraficoTendencia(): void {
    this.cargarGraficoTendencia();
  }

  // =============================================================
  // UTILIDADES
  // =============================================================
  getEquipoIconClass(equipo: string): string {
    const iconMap: { [key: string]: string } = {
      Laptop: "bi-laptop",
      Proyector: "bi-projector",
      Cámara: "bi-camera-video",
      Micrófono: "bi-mic",
      Tablet: "bi-tablet",
    };
    return iconMap[equipo] || "bi-box";
  }

  getProgressPercent(total: number): number {
    const max = 50;
    return Math.min((total / max) * 100, 100);
  }

  // =============================================================
  // EXPORTACIÓN
  // =============================================================
  onExportPDF(): void {
    const reporteData: ReporteData = {
      titulo: 'Reporte de Profesores',
      subtitulo: 'Estadísticas de préstamos y equipos por docente',
      fechaGeneracion: new Date(),
      usuario: '—',
      periodo: 'Últimos 12 meses',
      secciones: [
        {
          tipo: 'tabla',
          titulo: 'Préstamos por Profesor',
          subtitulo: 'Ranking de solicitudes por docente',
          datos: {
            columnas: ['Profesor', 'Total Préstamos'],
            filas: this.prestamosPorProfesorData.map(p => [p.profesor, p.total]),
            anchos: ['*', 120]
          }
        },
        {
          tipo: 'tabla',
          titulo: 'Equipos más Utilizados por Profesor',
          subtitulo: 'Detalle de solicitudes por docente',
          datos: {
            columnas: ['Profesor', 'Equipo', 'Total Solicitudes'],
            filas: this.equiposProfesor.map(e => [e.profesor, e.equipo, e.total]),
            anchos: ['*', '*', 100]
          }
        }
      ]
    };

    this.exportService.exportarPDFInstitucional(reporteData, 'Reporte_Profesores_UTA.pdf');
  }

  onExportExcel(): void {
    const sheets = [
      {
        name: 'Prestamos_Profesor',
        data: this.prestamosPorProfesorData.length
          ? this.prestamosPorProfesorData.map((p) => ({
              Profesor: p.profesor,
              Total: p.total
            }))
          : [{ Mensaje: 'No hay datos disponibles' }]
      },
      {
        name: 'Tendencia',
        data: this.tendenciaMeses.length && this.tendenciaSeries.length
          ? this.tendenciaMeses.map((mes, idx) => {
              const row: any = { Mes: mes };
              this.tendenciaSeries.forEach((s: any) => {
                row[s.name ?? 'Serie'] = s.data?.[idx] ?? 0;
              });
              return row;
            })
          : [{ Mensaje: 'No hay datos disponibles' }]
      },
      {
        name: 'Equipos_Profesor',
        data: this.equiposProfesor.length
          ? this.equiposProfesor.map((e: any) => ({
              Profesor: e.profesor,
              Equipo: e.equipo,
              Total: e.total
            }))
          : [{ Mensaje: 'No hay datos disponibles' }]
      }
    ];

    this.exportService.exportarExcel(sheets, `Reporte_Profesores_UTA_${Date.now()}.xlsx`);
  }
}
