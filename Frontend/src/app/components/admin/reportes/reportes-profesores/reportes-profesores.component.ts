import { Component, OnInit, AfterViewInit, OnDestroy } from "@angular/core";
import { CommonModule } from "@angular/common";
import * as echarts from "echarts";
import { ReportesProfesoresService } from "../../../../services/reportes/reportes-profesores.service";

@Component({
  selector: "app-reportes-profesores",
  standalone: true,
  imports: [CommonModule],
  templateUrl: "./reportes-profesores.component.html",
  styleUrls: ["./reportes-profesores.component.css"], // 👈 OBLIGATORIO (plural)
})
export class ReportesProfesoresComponent
  implements OnInit, AfterViewInit, OnDestroy {

  // =========================
  // TABLA
  // =========================
  equiposProfesor: any[] = [];

  currentPage = 1;
  pageSize = 10;
  totalPages = 1;
  pages: number[] = [];

  // =========================
  // CHARTS
  // =========================
  chartPrestamos!: echarts.ECharts;
  chartTendencia!: echarts.ECharts;

  constructor(private reportesService: ReportesProfesoresService) {}

  // =============================================================
  // CICLO DE VIDA
  // =============================================================
  ngOnInit(): void {
    // SOLO tabla
    this.loadEquiposProfesor();
  }

  ngAfterViewInit(): void {
    // 1️⃣ Inicializar gráficos (DOM ya existe)
    this.initPrestamoChart();
    this.initTendenciaChart();

    // 2️⃣ Cargar datos
    this.loadGraficoPrestamos();
    this.loadGraficoTendencia();
  }

  ngOnDestroy(): void {
    if (this.chartPrestamos) this.chartPrestamos.dispose();
    if (this.chartTendencia) this.chartTendencia.dispose();
  }

  // =============================================================
  // TABLA – Equipos por profesor
  // =============================================================
  loadEquiposProfesor(): void {
    this.reportesService
      .getEquiposPorProfesor(this.currentPage, this.pageSize)
      .subscribe((res) => {
        this.equiposProfesor = res.data ?? [];
        this.totalPages = res.totalPages ?? 1;
        this.updatePagination();
      });
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

    window.addEventListener("resize", () =>
      this.chartPrestamos.resize()
    );
  }

  loadGraficoPrestamos(): void {
    this.reportesService.getPrestamosPorProfesor().subscribe((data) => {
      const profesores = data.map((x: any) => x.profesor);
      const totales = data.map((x: any) => x.total);

      this.setPrestamoChartOptions(profesores, totales);
    });
  }

  setPrestamoChartOptions(
    profesores: string[],
    totales: number[]
  ): void {
    if (!this.chartPrestamos) return;

    this.chartPrestamos.setOption(
      {
        yAxis: { data: profesores },
        series: [{ data: totales }],
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

    window.addEventListener("resize", () =>
      this.chartTendencia.resize()
    );
  }

  loadGraficoTendencia(): void {
    this.reportesService.getTendenciaPrestamos().subscribe((res) => {
      this.setTendenciaChartOptions(res.meses, res.series);
    });
  }

  setTendenciaChartOptions(meses: string[], series: any[]): void {
    if (!this.chartTendencia) return;

    this.chartTendencia.setOption(
      {
        xAxis: { data: meses },
        series,
        legend: { data: series.map((s) => s.name) },
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
    console.log("Exportando profesores a PDF...");
  }

  onExportExcel(): void {
    console.log("Exportando profesores a Excel...");
  }
}
