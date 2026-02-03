import { Component, OnInit, AfterViewInit, OnDestroy } from "@angular/core";
import { CommonModule } from "@angular/common";
import { FormsModule } from "@angular/forms";
import { Subject, takeUntil } from "rxjs";
import * as echarts from "echarts";
import { ReportesProfesoresService } from "../../../../services/reportes/reportes-profesores.service";
import { ExportService, ReporteData } from "../../../../services/export.service";
import { ExportButtonsComponent } from "../export-buttons/export-buttons.component";
import { ReportFiltersComponent } from "../report-filters/report-filters.component";
import { ReportFiltersService, ReportFilter } from "../../../../services/report-filters.service";

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
  // CHARTS
  // =========================
  chartPrestamos!: echarts.ECharts;
  chartTendencia!: echarts.ECharts;

  prestamosPorProfesorData: { profesor: string; total: number }[] = [];
  tendenciaMeses: string[] = [];
  tendenciaSeries: any[] = [];

  // Resize handlers so we can remove listeners later
  private onResizePrestamos = () => { if (this.chartPrestamos) this.chartPrestamos.resize(); };
  private onResizeTendencia = () => { if (this.chartTendencia) this.chartTendencia.resize(); };

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
      this.chartPrestamos.dispose();
      window.removeEventListener('resize', this.onResizePrestamos);
    }
    if (this.chartTendencia) {
      this.chartTendencia.dispose();
      window.removeEventListener('resize', this.onResizeTendencia);
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
  // GRÁFICO 1 – PRÉSTAMOS POR PROFESOR
  // =============================================================
  initPrestamoChart(): void {
    const dom = document.getElementById("profesorPrestamoChart");
    if (!dom) return;

    echarts.dispose(dom);
    this.chartPrestamos = echarts.init(dom);

    this.chartPrestamos.setOption({
      tooltip: { trigger: "axis", axisPointer: { type: "shadow" } },
      grid: { left: "4%", right: "4%", bottom: "4%", containLabel: true },
      xAxis: { type: "value" },
      yAxis: { type: "category", data: [] },
      series: [
        {
          name: "Préstamos",
          type: "bar",
          data: [],
          barWidth: 18,
          itemStyle: {
            color: new echarts.graphic.LinearGradient(0, 0, 1, 0, [
              { offset: 0, color: "#6366f1" },
              { offset: 1, color: "#818cf8" },
            ]),
            borderRadius: [0, 8, 8, 0],
          },
        },
      ],
    });

    window.addEventListener('resize', this.onResizePrestamos);
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
          this.initPrestamoChart();
          this.setPrestamoChartOptions(profesores, totales);
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

  setPrestamoChartOptions(
    profesores: string[],
    totales: number[]
  ): void {
    if (!this.chartPrestamos) return;

    // Limitar a los top 12 para evitar overplotting
    const limit = 12;
    const slicedProfesores = profesores.slice(0, limit);
    const slicedTotales = totales.slice(0, limit);

    this.chartPrestamos.setOption(
      {
        yAxis: { data: slicedProfesores },
        series: [{ data: slicedTotales }],
      },
      { notMerge: true }
    );
  }

  // =============================================================
  // GRÁFICO 2 – TENDENCIA TEMPORAL
  // =============================================================
  initTendenciaChart(): void {
    const dom = document.getElementById("profesorTendenciaChart");
    if (!dom) return;

    echarts.dispose(dom);
    this.chartTendencia = echarts.init(dom);

    this.chartTendencia.setOption({
      tooltip: { trigger: "axis" },
      legend: {
        type: "scroll",
        top: 10,
        textStyle: { fontSize: 11 },
      },
      grid: {
        left: "6%",
        right: "4%",
        bottom: "8%",
        top: "25%",
        containLabel: true,
      },
      xAxis: { type: "category", data: [] },
      yAxis: { type: "value" },
      series: [],
    });

    window.addEventListener('resize', this.onResizeTendencia);
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
          this.initTendenciaChart();
          this.setTendenciaChartOptions(this.tendenciaMeses, this.tendenciaSeries);
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

  setTendenciaChartOptions(meses: string[], series: any[]): void {
    if (!this.chartTendencia) return;

    const maxSeries = 6;

    const sanitizedSeries = (series || [])
      .filter((s: any) => s && Array.isArray(s.data))
      .map((s: any) => ({
        name: s.name ?? 'Serie',
        type: s.type ?? 'line',
        smooth: s.smooth ?? true,
        data: [...s.data],
        yAxisIndex: s.yAxisIndex ?? 0
      }));

    const seriesWithTotal = sanitizedSeries.map((s: any) => ({
      ...s,
      _total: (s.data || []).reduce((a: number, b: number) => a + b, 0),
    }));

    seriesWithTotal.sort((a: any, b: any) => b._total - a._total);
    const topSeries = seriesWithTotal.slice(0, maxSeries).map((s: any) => {
      const copy = { ...s };
      delete copy._total;
      return copy;
    });

    const legendData = topSeries.map((s: any) => s.name ?? 'Serie');

    this.chartTendencia.setOption(
      {
        xAxis: { data: meses || [] },
        yAxis: { type: 'value' },
        series: topSeries,
        legend: { data: legendData },
      },
      { notMerge: true }
    );
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
