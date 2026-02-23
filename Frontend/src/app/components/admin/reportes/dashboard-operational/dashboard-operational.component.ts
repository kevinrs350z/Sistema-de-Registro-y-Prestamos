import { Component, OnDestroy, OnInit, ViewChild, ElementRef, AfterViewInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Subject, takeUntil } from 'rxjs';
import * as echarts from 'echarts';
import {
  DashboardOperationalService,
  DemandTimeseriesParams,
  LoanDurationDistributionParams,
  DemandVsDurationParams,
  DemandVsStockParams,
  TopRequestedParams,
  DemandHeatmapParams,
  RejectionsAndStatusParams,
  DemandForecastParams,
  StatusFlowParams
} from '../../../../services/reportes/dashboard-operational.service';
import { ReportFiltersComponent } from '../report-filters/report-filters.component';
import { ReportFilter } from '../../../../services/report-filters.service';

@Component({
  selector: 'app-dashboard-operational',
  standalone: true,
  imports: [CommonModule, ReportFiltersComponent],
  templateUrl: './dashboard-operational.component.html',
  styleUrls: ['./dashboard-operational.component.css']
})
export class DashboardOperationalComponent implements OnInit, AfterViewInit, OnDestroy {
  @ViewChild('demandChart') demandChartRef?: ElementRef<HTMLDivElement>;
  @ViewChild('durationChart') durationChartRef?: ElementRef<HTMLDivElement>;
  @ViewChild('demandVsDurationChart') demandVsDurationChartRef?: ElementRef<HTMLDivElement>;
  @ViewChild('demandVsStockChart') demandVsStockChartRef?: ElementRef<HTMLDivElement>;
  @ViewChild('topRequestedChart') topRequestedChartRef?: ElementRef<HTMLDivElement>;
  @ViewChild('topRequestedDrillChart') topRequestedDrillChartRef?: ElementRef<HTMLDivElement>;
  @ViewChild('demandHeatmapChart') demandHeatmapChartRef?: ElementRef<HTMLDivElement>;
  @ViewChild('rejectionsStatusChart') rejectionsStatusChartRef?: ElementRef<HTMLDivElement>;
  @ViewChild('demandForecastChart') demandForecastChartRef?: ElementRef<HTMLDivElement>;
  @ViewChild('statusFlowChart') statusFlowChartRef?: ElementRef<HTMLDivElement>;

  loading = true;
  error = '';
  sinDatos = false;

  durationLoading = true;
  durationError = '';
  durationSinDatos = false;
  medianaHint = 'Usar P50 (mediana) para describir la duración típica evita sesgo por casos extremos.';

  scatterLoading = true;
  scatterError = '';
  scatterSinDatos = false;
  scatterHint = 'Interpretación: arriba-derecha = zona crítica (alta demanda + alta duración).';

  durationTipo: 'FUERA' | 'DENTRO' = 'FUERA';
  durationGroupBy: 'period' | 'categoria' | 'asignatura' = 'period';
  durationBucket: 'week' | 'month' = 'week';

  scatterTipo: 'FUERA' | 'DENTRO' = 'FUERA';
  scatterGroupBy: 'period' | 'categoria' | 'asignatura' = 'period';
  scatterBucket: 'week' | 'month' = 'week';
  scatterDurationMetric: 'p50' | 'p90' = 'p50';
  selectedScatterPoint: any | null = null;

  stockScatterLoading = true;
  stockScatterError = '';
  stockScatterSinDatos = false;
  stockScatterHint = 'Arriba-izquierda = sobrestock (redistribuir). Abajo-derecha = falta stock (comprar).';
  stockScatterTipo: 'FUERA' | 'DENTRO' = 'FUERA';
  stockScatterGroupBy: 'tipo_equipo' | 'categoria' = 'tipo_equipo';

  topRequestedLoading = true;
  topRequestedError = '';
  topRequestedSinDatos = false;
  topRequestedHint = 'Top de demanda con variación vs mes anterior. Click en barra para drill-down temporal.';
  topRequestedTipo: 'FUERA' | 'DENTRO' = 'FUERA';
  topRequestedGroupBy: 'equipo' | 'categoria' | 'asignatura' = 'equipo';
  topRequestedTopN: 10 | 20 = 10;
  topRequestedBucket: 'week' | 'month' = 'week';
  selectedTopRequested: any | null = null;

  heatmapLoading = true;
  heatmapError = '';
  heatmapSinDatos = false;
  heatmapHint = 'Detecta picos por día y bloque/hora. Activa normalización para comparar periodos de distinta duración.';
  heatmapTipo: 'FUERA' | 'DENTRO' = 'DENTRO';
  heatmapNormalizeByWeeks = true;
  heatmapPalette: 'soft' | 'intense' = 'soft';

  rejectionsStatusLoading = true;
  rejectionsStatusError = '';
  rejectionsStatusSinDatos = false;
  rejectionsStatusTipo: 'FUERA' | 'DENTRO' = 'FUERA';
  rejectionsStatusView: 'motivos' | 'estados' = 'motivos';
  rejectionsStatusHint = 'Visualiza causas de no satisfacción de demanda y estados que afectan capacidad.';
  rejectionsStatusSummary = '';
  rejectionsStatusInterpretation = '';

  forecastLoading = true;
  forecastError = '';
  forecastSinDatos = false;
  forecastTipo: 'FUERA' | 'DENTRO' = 'FUERA';
  forecastBucket: 'week' | 'month' = 'week';
  forecastHorizon = 6;
  forecastHint = 'Predicción basada en tendencia + estacionalidad simple.';
  forecastMetricsText = '';

  statusFlowLoading = true;
  statusFlowError = '';
  statusFlowSinDatos = false;
  statusFlowTipo: 'FUERA' | 'DENTRO' = 'FUERA';
  statusFlowHint = 'Muestra la ruta de solicitudes hacia estados finales y cuellos de botella operativos.';
  statusFlowSummary = '';

  /** Tipo de préstamo: FUERA = por días, DENTRO = por bloques */
  tipoSeleccionado: 'FUERA' | 'DENTRO' = 'FUERA';

  estadoSeleccionado = 'TODOS';
  readonly estadosDisponibles = [
    'TODOS',
    'PENDIENTE',
    'APROBADO',
    'PENDIENTE_ENTREGA',
    'ENTREGADO',
    'ATRASADO',
    'DEVUELTO',
    'RECHAZADO',
  ];

  currentFilter?: ReportFilter;
  private chart?: echarts.ECharts;
  private durationChart?: echarts.ECharts;
  private demandVsDurationChart?: echarts.ECharts;
  private demandVsStockChart?: echarts.ECharts;
  private topRequestedChart?: echarts.ECharts;
  private topRequestedDrillChart?: echarts.ECharts;
  private demandHeatmapChart?: echarts.ECharts;
  private rejectionsStatusChart?: echarts.ECharts;
  private demandForecastChart?: echarts.ECharts;
  private statusFlowChart?: echarts.ECharts;
  private lastChartPayload: any;
  private lastDurationPayload: any;
  private lastScatterPayload: any;
  private lastStockScatterPayload: any;
  private lastTopRequestedPayload: any;
  private lastHeatmapPayload: any;
  private lastRejectionsStatusPayload: any;
  private lastForecastPayload: any;
  private lastStatusFlowPayload: any;
  private destroy$ = new Subject<void>();
  private resizeHandler = () => {
    this.chart?.resize();
    this.durationChart?.resize();
    this.demandVsDurationChart?.resize();
    this.demandVsStockChart?.resize();
    this.topRequestedChart?.resize();
    this.topRequestedDrillChart?.resize();
    this.demandHeatmapChart?.resize();
    this.rejectionsStatusChart?.resize();
    this.demandForecastChart?.resize();
    this.statusFlowChart?.resize();
  };

  constructor(private dashboardService: DashboardOperationalService) {}

  ngOnInit(): void {
    window.addEventListener('resize', this.resizeHandler);
  }

  ngAfterViewInit(): void {
    this.initChart();
    this.initDurationChart();
    this.initDemandVsDurationChart();
    this.initDemandVsStockChart();
    this.initTopRequestedChart();
    this.initTopRequestedDrillChart();
    this.initDemandHeatmapChart();
    this.initRejectionsStatusChart();
    this.initDemandForecastChart();
    this.initStatusFlowChart();
    if (this.lastChartPayload) {
      this.renderChart(this.lastChartPayload);
    }
    if (this.lastDurationPayload) {
      this.renderDurationChart(this.lastDurationPayload);
    }
    if (this.lastScatterPayload) {
      this.renderDemandVsDurationChart(this.lastScatterPayload);
    }
    if (this.lastStockScatterPayload) {
      this.renderDemandVsStockChart(this.lastStockScatterPayload);
    }
    if (this.lastTopRequestedPayload) {
      this.renderTopRequestedChart(this.lastTopRequestedPayload);
      if (this.lastTopRequestedPayload?.drilldown) {
        this.renderTopRequestedDrillChart(this.lastTopRequestedPayload.drilldown);
      }
    }
    if (this.lastHeatmapPayload) {
      this.renderDemandHeatmapChart(this.lastHeatmapPayload);
    }
    if (this.lastRejectionsStatusPayload) {
      this.renderRejectionsStatusChart(this.lastRejectionsStatusPayload);
    }
    if (this.lastForecastPayload) {
      this.renderDemandForecastChart(this.lastForecastPayload);
    }
    if (this.lastStatusFlowPayload) {
      this.renderStatusFlowChart(this.lastStatusFlowPayload);
    }
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
    window.removeEventListener('resize', this.resizeHandler);
    this.chart?.dispose();
    this.durationChart?.dispose();
    this.demandVsDurationChart?.dispose();
    this.demandVsStockChart?.dispose();
    this.topRequestedChart?.dispose();
    this.topRequestedDrillChart?.dispose();
    this.demandHeatmapChart?.dispose();
    this.rejectionsStatusChart?.dispose();
    this.demandForecastChart?.dispose();
    this.statusFlowChart?.dispose();
  }

  onFiltersChanged(filter: ReportFilter): void {
    this.currentFilter = filter;
    this.loadDemandTimeseries();
    this.loadLoanDurationDistribution();
    this.loadDemandVsDuration();
    this.loadDemandVsStock();
    this.loadTopRequested();
    this.loadDemandHeatmap();
    this.loadRejectionsAndStatus();
    this.loadDemandForecast();
    this.loadStatusFlow();
  }

  onTipoChange(event: Event): void {
    this.tipoSeleccionado = (event.target as HTMLSelectElement).value as 'FUERA' | 'DENTRO';
    this.loadDemandTimeseries();
  }

  onEstadoChange(event: Event): void {
    this.estadoSeleccionado = (event.target as HTMLSelectElement).value || 'TODOS';
    this.loadDemandTimeseries();
    this.loadLoanDurationDistribution();
    this.loadDemandVsDuration();
    this.loadDemandVsStock();
    this.loadTopRequested();
    this.loadDemandHeatmap();
    this.loadRejectionsAndStatus();
    this.loadDemandForecast();
    this.loadStatusFlow();
  }

  onDurationTipoChange(event: Event): void {
    this.durationTipo = (event.target as HTMLSelectElement).value as 'FUERA' | 'DENTRO';
    // DENTRO no soporta agrupación por periodo
    if (this.durationTipo === 'DENTRO' && this.durationGroupBy === 'period') {
      this.durationGroupBy = 'categoria';
    }
    this.loadLoanDurationDistribution();
  }

  onDurationGroupByChange(event: Event): void {
    this.durationGroupBy = (event.target as HTMLSelectElement).value as 'period' | 'categoria' | 'asignatura';
    this.loadLoanDurationDistribution();
  }

  onDurationBucketChange(event: Event): void {
    this.durationBucket = (event.target as HTMLSelectElement).value as 'week' | 'month';
    this.loadLoanDurationDistribution();
  }

  onScatterTipoChange(event: Event): void {
    this.scatterTipo = (event.target as HTMLSelectElement).value as 'FUERA' | 'DENTRO';
    if (this.scatterTipo === 'DENTRO' && this.scatterGroupBy === 'period') {
      this.scatterGroupBy = 'categoria';
    }
    this.selectedScatterPoint = null;
    this.loadDemandVsDuration();
  }

  onScatterGroupByChange(event: Event): void {
    this.scatterGroupBy = (event.target as HTMLSelectElement).value as 'period' | 'categoria' | 'asignatura';
    this.selectedScatterPoint = null;
    this.loadDemandVsDuration();
  }

  onScatterBucketChange(event: Event): void {
    this.scatterBucket = (event.target as HTMLSelectElement).value as 'week' | 'month';
    this.selectedScatterPoint = null;
    this.loadDemandVsDuration();
  }

  onScatterDurationMetricChange(event: Event): void {
    this.scatterDurationMetric = (event.target as HTMLSelectElement).value as 'p50' | 'p90';
    this.selectedScatterPoint = null;
    this.loadDemandVsDuration();
  }

  clearScatterDrilldown(): void {
    this.selectedScatterPoint = null;
    if (this.lastScatterPayload) {
      this.renderDemandVsDurationChart(this.lastScatterPayload);
    }
  }

  onStockScatterTipoChange(event: Event): void {
    this.stockScatterTipo = (event.target as HTMLSelectElement).value as 'FUERA' | 'DENTRO';
    this.loadDemandVsStock();
  }

  onStockScatterGroupByChange(event: Event): void {
    this.stockScatterGroupBy = (event.target as HTMLSelectElement).value as 'tipo_equipo' | 'categoria';
    this.loadDemandVsStock();
  }

  onTopRequestedTipoChange(event: Event): void {
    this.topRequestedTipo = (event.target as HTMLSelectElement).value as 'FUERA' | 'DENTRO';
    this.selectedTopRequested = null;
    this.loadTopRequested();
  }

  onTopRequestedGroupByChange(event: Event): void {
    this.topRequestedGroupBy = (event.target as HTMLSelectElement).value as 'equipo' | 'categoria' | 'asignatura';
    this.selectedTopRequested = null;
    this.loadTopRequested();
  }

  onTopRequestedTopNChange(event: Event): void {
    this.topRequestedTopN = ((event.target as HTMLSelectElement).value === '20' ? 20 : 10);
    this.selectedTopRequested = null;
    this.loadTopRequested();
  }

  onTopRequestedBucketChange(event: Event): void {
    this.topRequestedBucket = (event.target as HTMLSelectElement).value as 'week' | 'month';
    if (this.selectedTopRequested?.key) {
      this.loadTopRequested(this.selectedTopRequested.key);
      return;
    }
    this.loadTopRequested();
  }

  clearTopRequestedDrilldown(): void {
    this.selectedTopRequested = null;
    this.topRequestedDrillChart?.clear();
    if (this.lastTopRequestedPayload) {
      this.renderTopRequestedChart({ ...this.lastTopRequestedPayload, drilldown: null });
    }
  }

  onHeatmapTipoChange(event: Event): void {
    this.heatmapTipo = (event.target as HTMLSelectElement).value as 'FUERA' | 'DENTRO';
    this.loadDemandHeatmap();
  }

  onHeatmapNormalizeChange(event: Event): void {
    this.heatmapNormalizeByWeeks = (event.target as HTMLInputElement).checked;
    this.loadDemandHeatmap();
  }

  onHeatmapPaletteChange(event: Event): void {
    this.heatmapPalette = (event.target as HTMLSelectElement).value as 'soft' | 'intense';
    if (this.lastHeatmapPayload) {
      this.renderDemandHeatmapChart(this.lastHeatmapPayload);
    }
  }

  onRejectionsStatusTipoChange(event: Event): void {
    this.rejectionsStatusTipo = (event.target as HTMLSelectElement).value as 'FUERA' | 'DENTRO';
    this.loadRejectionsAndStatus();
  }

  onRejectionsStatusViewChange(event: Event): void {
    this.rejectionsStatusView = (event.target as HTMLSelectElement).value as 'motivos' | 'estados';
    this.loadRejectionsAndStatus();
  }

  onForecastTipoChange(event: Event): void {
    this.forecastTipo = (event.target as HTMLSelectElement).value as 'FUERA' | 'DENTRO';
    this.loadDemandForecast();
  }

  onForecastBucketChange(event: Event): void {
    this.forecastBucket = (event.target as HTMLSelectElement).value as 'week' | 'month';
    if (this.forecastBucket === 'month' && this.forecastHorizon > 6) {
      this.forecastHorizon = 4;
    }
    this.loadDemandForecast();
  }

  onForecastHorizonChange(event: Event): void {
    this.forecastHorizon = Number((event.target as HTMLSelectElement).value || 6);
    this.loadDemandForecast();
  }

  onStatusFlowTipoChange(event: Event): void {
    this.statusFlowTipo = (event.target as HTMLSelectElement).value as 'FUERA' | 'DENTRO';
    this.loadStatusFlow();
  }

  private initChart(): void {
    const el = this.demandChartRef?.nativeElement;
    if (!el || this.chart) return;
    this.chart = echarts.init(el, undefined, { renderer: 'canvas' });
  }

  private initDurationChart(): void {
    const el = this.durationChartRef?.nativeElement;
    if (!el || this.durationChart) return;
    this.durationChart = echarts.init(el, undefined, { renderer: 'canvas' });
  }

  private initDemandVsDurationChart(): void {
    const el = this.demandVsDurationChartRef?.nativeElement;
    if (!el || this.demandVsDurationChart) return;

    this.demandVsDurationChart = echarts.init(el, undefined, { renderer: 'canvas' });
    this.demandVsDurationChart.on('click', (params: any) => {
      const point = params?.data?.point;
      if (!point) {
        return;
      }

      this.selectedScatterPoint = point;
      this.loadDemandVsDuration(point.key);
    });
  }

  private loadDemandTimeseries(): void {
    if (!this.currentFilter && this.tipoSeleccionado === 'FUERA') return;

    this.loading = true;
    this.error = '';
    this.sinDatos = false;

    const params: DemandTimeseriesParams = {
      tipo: this.tipoSeleccionado,
      categoria: this.currentFilter?.tipoEquipoId ?? null,
      asignatura: this.currentFilter?.asignaturaId ?? null,
      anioIngreso: this.currentFilter?.anioIngreso ?? null,
      estado: this.estadoSeleccionado,
    };

    // Solo FUERA necesita rango de fechas y bucket
    if (this.tipoSeleccionado === 'FUERA' && this.currentFilter) {
      params.from = this.currentFilter.from;
      params.to = this.currentFilter.to;
      params.bucket = this.mapBucket(this.currentFilter.granularity);
    }

    this.dashboardService.getDemandTimeseries(params)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (payload) => {
          this.lastChartPayload = payload;
          this.sinDatos = !payload?.hasData;
          this.renderChart(payload);
          this.loading = false;
        },
        error: () => {
          this.error = 'No se pudo cargar la información de demanda.';
          this.loading = false;
          this.chart?.clear();
        }
      });
  }

  private loadLoanDurationDistribution(): void {
    if (!this.currentFilter && this.durationTipo === 'FUERA') return;

    this.durationLoading = true;
    this.durationError = '';
    this.durationSinDatos = false;

    const params: LoanDurationDistributionParams = {
      tipo: this.durationTipo,
      groupBy: this.durationGroupBy,
      categoria: this.currentFilter?.tipoEquipoId ?? null,
      asignatura: this.currentFilter?.asignaturaId ?? null,
      anioIngreso: this.currentFilter?.anioIngreso ?? null,
      estado: this.estadoSeleccionado,
    };

    // Solo FUERA necesita fechas y bucket
    if (this.durationTipo === 'FUERA' && this.currentFilter) {
      params.from = this.currentFilter.from;
      params.to = this.currentFilter.to;
      params.bucket = this.durationBucket;
    }

    this.dashboardService.getLoanDurationDistribution(params)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (payload) => {
          this.lastDurationPayload = payload;
          this.durationSinDatos = !payload?.hasData;
          this.renderDurationChart(payload);
          this.durationLoading = false;
        },
        error: () => {
          this.durationError = 'No se pudo cargar la distribución de duración.';
          this.durationLoading = false;
          this.durationChart?.clear();
        }
      });
  }

  private loadDemandVsDuration(drillKey?: string): void {
    if (!this.currentFilter && this.scatterTipo === 'FUERA') return;

    this.scatterLoading = true;
    this.scatterError = '';
    this.scatterSinDatos = false;

    const params: DemandVsDurationParams = {
      tipo: this.scatterTipo,
      groupBy: this.scatterGroupBy,
      durationMetric: this.scatterDurationMetric,
      categoria: this.currentFilter?.tipoEquipoId ?? null,
      asignatura: this.currentFilter?.asignaturaId ?? null,
      anioIngreso: this.currentFilter?.anioIngreso ?? null,
      estado: this.estadoSeleccionado,
      drillKey: drillKey ?? null,
    };

    if (this.scatterTipo === 'FUERA' && this.currentFilter) {
      params.from = this.currentFilter.from;
      params.to = this.currentFilter.to;
      if (this.scatterGroupBy === 'period') {
        params.bucket = this.scatterBucket;
      }
    }

    this.dashboardService.getDemandVsDuration(params)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (payload) => {
          this.lastScatterPayload = payload;
          this.scatterSinDatos = !payload?.hasData;
          if (payload?.drilldown) {
            this.selectedScatterPoint = payload.drilldown;
          }
          this.renderDemandVsDurationChart(payload);
          this.scatterLoading = false;
        },
        error: () => {
          this.scatterError = 'No se pudo cargar la relación demanda vs duración.';
          this.scatterLoading = false;
          this.demandVsDurationChart?.clear();
        }
      });
  }

  /* ============================================================
   * Renderizado dual:
   *   mode === 'external' → línea temporal con dataZoom
   *   mode === 'internal' → barras por bloque horario
   * ============================================================ */
  private renderChart(payload: any): void {
    this.initChart();
    if (!this.chart) return;

    const mode: string = payload?.mode ?? 'external';

    if (mode === 'internal') {
      this.renderBlockChart(payload);
    } else {
      this.renderTimeseriesChart(payload);
    }
  }

  private renderDurationChart(payload: any): void {
    this.initDurationChart();
    if (!this.durationChart) return;

    const labels: string[] = payload?.labels ?? [];
    const boxplotData: number[][] = payload?.boxplot ?? [];
    const p90: number[] = payload?.p90 ?? [];
    const summary: any[] = payload?.summary ?? [];

    const p90Scatter = labels.map((_, index) => [index, p90[index] ?? 0]);

    const option: echarts.EChartsOption = {
      animation: true,
      animationDuration: 700,
      animationEasing: 'cubicOut',
      legend: {
        top: 8,
        data: ['Distribución (min/P25/P50/P75/max)', 'P90']
      },
      tooltip: {
        trigger: 'item',
        backgroundColor: '#1f2937',
        borderWidth: 0,
        textStyle: { color: '#fff' },
        formatter: (params: any) => {
          const index = params?.dataIndex ?? 0;
          const row = summary[index];
          if (!row) {
            return `${params?.name ?? ''}`;
          }

          const unit = payload?.meta?.unit ?? 'dias';
          const unitLabel = unit === 'minutos' ? 'min' : 'días';
          return [
            `<div style="margin-bottom:6px;font-weight:600">${row.label}</div>`,
            `Muestras: <b>${row.count}</b>`,
            `Min: <b>${row.min}</b> ${unitLabel}`,
            `P25: <b>${row.p25}</b> ${unitLabel}`,
            `P50 (mediana): <b>${row.p50}</b> ${unitLabel}`,
            `P75: <b>${row.p75}</b> ${unitLabel}`,
            `P90: <b>${row.p90}</b> ${unitLabel}`,
            `Max: <b>${row.max}</b> ${unitLabel}`
          ].join('<br/>');
        }
      },
      toolbox: {
        right: 12,
        feature: {
          dataZoom: { yAxisIndex: 'none' },
          restore: {},
          saveAsImage: { name: 'duracion-boxplot' }
        }
      },
      dataZoom: [
        { type: 'inside', xAxisIndex: 0 },
        { type: 'slider', xAxisIndex: 0, bottom: 26 },
      ],
      grid: { left: 52, right: 24, top: 56, bottom: 90 },
      xAxis: {
        type: 'category',
        data: labels,
        boundaryGap: true,
        axisLabel: { rotate: labels.length > 8 ? 25 : 0 }
      },
      yAxis: {
        type: 'value',
        name: payload?.meta?.unit === 'minutos' ? 'Duración (minutos)' : 'Duración (días)',
        min: 0,
      },
      series: [
        {
          name: 'Distribución (min/P25/P50/P75/max)',
          type: 'boxplot',
          data: boxplotData,
          itemStyle: {
            borderWidth: 1.5,
          },
          emphasis: { focus: 'series' },
        },
        {
          name: 'P90',
          type: 'scatter',
          symbolSize: 11,
          data: p90Scatter,
          emphasis: { focus: 'series' },
          z: 10,
        }
      ]
    };

    this.durationChart.setOption(option, true);
  }

  private renderDemandVsDurationChart(payload: any): void {
    this.initDemandVsDurationChart();
    if (!this.demandVsDurationChart) return;

    const points: any[] = payload?.points ?? [];
    const cutX = payload?.meta?.cutLines?.x ?? 0;
    const cutY = payload?.meta?.cutLines?.y ?? 0;
    const durationUnit = payload?.meta?.durationUnit === 'minutos' ? 'min' : 'días';
    const metricLabel = (payload?.meta?.durationMetric ?? 'p50').toUpperCase();

    const minSymbol = 10;
    const maxSymbol = 44;
    const maxSize = Math.max(1, ...points.map((point) => Number(point?.size ?? 0)));

    const scatterData = points.map((point: any) => {
      const size = Number(point?.size ?? 0);
      const scaled = minSymbol + (size / maxSize) * (maxSymbol - minSymbol);
      return {
        value: [point.x, point.y],
        symbolSize: Number.isFinite(scaled) ? scaled : minSymbol,
        point,
        itemStyle: {
          opacity: this.selectedScatterPoint && this.selectedScatterPoint.selectedKey
            ? (this.selectedScatterPoint.selectedKey === point.key ? 1 : 0.25)
            : 0.92,
        }
      };
    });

    const option: echarts.EChartsOption = {
      animation: true,
      animationDuration: 700,
      animationEasing: 'cubicOut',
      grid: { left: 58, right: 20, top: 64, bottom: 55 },
      legend: {
        top: 8,
        data: ['Puntos (segmentos)'],
      },
      tooltip: {
        trigger: 'item',
        backgroundColor: '#1f2937',
        borderWidth: 0,
        textStyle: { color: '#fff' },
        formatter: (params: any) => {
          const point = params?.data?.point;
          if (!point) return '';

          const quadrantText = payload?.meta?.quadrants?.[point.quadrant] ?? '';
          return [
            `<div style="margin-bottom:6px;font-weight:600">${point.label}</div>`,
            `Demanda (X): <b>${point.x}</b> préstamos`,
            `${metricLabel} duración (Y): <b>${point.y}</b> ${durationUnit}`,
            `Rechazo por stock (tamaño): <b>${point.stockoutRejectRate}%</b>`,
            `Cuadrante: <b>${point.quadrant.replaceAll('_', ' ')}</b>`,
            `<span style="opacity:.9">${quadrantText}</span>`,
            `<span style="opacity:.8">Click para drill-down.</span>`,
          ].join('<br/>');
        }
      },
      toolbox: {
        right: 12,
        feature: {
          restore: {},
          saveAsImage: { name: 'demanda-vs-duracion' }
        }
      },
      xAxis: {
        type: 'value',
        name: 'Demanda (# préstamos)',
        min: 0,
        splitLine: { show: true },
      },
      yAxis: {
        type: 'value',
        name: `${metricLabel} duración (${durationUnit})`,
        min: 0,
        splitLine: { show: true },
      },
      series: [
        {
          name: 'Puntos (segmentos)',
          type: 'scatter',
          data: scatterData,
          emphasis: { focus: 'series' },
          markLine: {
            symbol: ['none', 'none'],
            label: { show: true, formatter: '{b}' },
            lineStyle: { type: 'dashed', opacity: 0.75 },
            data: [
              { xAxis: cutX, name: `Corte demanda (${cutX})` },
              { yAxis: cutY, name: `Corte duración (${cutY})` },
            ]
          }
        }
      ]
    };

    this.demandVsDurationChart.setOption(option, true);
  }

  private initDemandVsStockChart(): void {
    const el = this.demandVsStockChartRef?.nativeElement;
    if (!el || this.demandVsStockChart) return;
    this.demandVsStockChart = echarts.init(el, undefined, { renderer: 'canvas' });
  }

  private initTopRequestedChart(): void {
    const el = this.topRequestedChartRef?.nativeElement;
    if (!el || this.topRequestedChart) return;

    this.topRequestedChart = echarts.init(el, undefined, { renderer: 'canvas' });
    this.topRequestedChart.on('click', (params: any) => {
      const point = params?.data?.point;
      if (!point?.key) {
        return;
      }

      this.selectedTopRequested = point;
      this.loadTopRequested(point.key);
    });
  }

  private initTopRequestedDrillChart(): void {
    const el = this.topRequestedDrillChartRef?.nativeElement;
    if (!el || this.topRequestedDrillChart) return;
    this.topRequestedDrillChart = echarts.init(el, undefined, { renderer: 'canvas' });
  }

  private initDemandHeatmapChart(): void {
    const el = this.demandHeatmapChartRef?.nativeElement;
    if (!el || this.demandHeatmapChart) return;
    this.demandHeatmapChart = echarts.init(el, undefined, { renderer: 'canvas' });
  }

  private initRejectionsStatusChart(): void {
    const el = this.rejectionsStatusChartRef?.nativeElement;
    if (!el || this.rejectionsStatusChart) return;
    this.rejectionsStatusChart = echarts.init(el, undefined, { renderer: 'canvas' });
  }

  private initDemandForecastChart(): void {
    const el = this.demandForecastChartRef?.nativeElement;
    if (!el || this.demandForecastChart) return;
    this.demandForecastChart = echarts.init(el, undefined, { renderer: 'canvas' });
  }

  private initStatusFlowChart(): void {
    const el = this.statusFlowChartRef?.nativeElement;
    if (!el || this.statusFlowChart) return;
    this.statusFlowChart = echarts.init(el, undefined, { renderer: 'canvas' });
  }

  private loadDemandVsStock(): void {
    if (!this.currentFilter && this.stockScatterTipo === 'FUERA') return;

    this.stockScatterLoading = true;
    this.stockScatterError = '';
    this.stockScatterSinDatos = false;

    const params: DemandVsStockParams = {
      tipo: this.stockScatterTipo,
      groupBy: this.stockScatterGroupBy,
      categoria: this.currentFilter?.tipoEquipoId ?? null,
      asignatura: this.currentFilter?.asignaturaId ?? null,
      anioIngreso: this.currentFilter?.anioIngreso ?? null,
      estado: this.estadoSeleccionado,
    };

    if (this.stockScatterTipo === 'FUERA' && this.currentFilter) {
      params.from = this.currentFilter.from;
      params.to = this.currentFilter.to;
    }

    this.dashboardService.getDemandVsStock(params)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (payload) => {
          this.lastStockScatterPayload = payload;
          this.stockScatterSinDatos = !payload?.hasData;
          this.renderDemandVsStockChart(payload);
          this.stockScatterLoading = false;
        },
        error: () => {
          this.stockScatterError = 'No se pudo cargar la relación demanda vs stock.';
          this.stockScatterLoading = false;
          this.demandVsStockChart?.clear();
        }
      });
  }

  private loadTopRequested(drillKey?: string): void {
    if (!this.currentFilter && this.topRequestedTipo === 'FUERA') {
      return;
    }

    this.topRequestedLoading = true;
    this.topRequestedError = '';
    this.topRequestedSinDatos = false;

    const params: TopRequestedParams = {
      tipo: this.topRequestedTipo,
      groupBy: this.topRequestedGroupBy,
      topN: this.topRequestedTopN,
      bucket: this.topRequestedBucket,
      drillKey: drillKey ?? null,
      categoria: this.currentFilter?.tipoEquipoId ?? null,
      asignatura: this.currentFilter?.asignaturaId ?? null,
      anioIngreso: this.currentFilter?.anioIngreso ?? null,
      estado: this.estadoSeleccionado,
    };

    if (this.topRequestedTipo === 'FUERA' && this.currentFilter) {
      params.from = this.currentFilter.from;
      params.to = this.currentFilter.to;
    }

    this.dashboardService.getTopRequested(params)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (payload) => {
          this.lastTopRequestedPayload = payload;
          this.topRequestedSinDatos = !payload?.hasData;
          if (payload?.drilldown) {
            this.selectedTopRequested = payload.drilldown;
          }
          this.renderTopRequestedChart(payload);
          if (payload?.drilldown) {
            this.renderTopRequestedDrillChart(payload.drilldown);
          } else {
            this.topRequestedDrillChart?.clear();
          }
          this.topRequestedLoading = false;
        },
        error: () => {
          this.topRequestedError = 'No se pudo cargar el ranking Top solicitados.';
          this.topRequestedLoading = false;
          this.topRequestedChart?.clear();
          this.topRequestedDrillChart?.clear();
        }
      });
  }

  private loadDemandHeatmap(): void {
    if (!this.currentFilter && this.heatmapTipo === 'FUERA') {
      return;
    }

    this.heatmapLoading = true;
    this.heatmapError = '';
    this.heatmapSinDatos = false;

    const params: DemandHeatmapParams = {
      tipo: this.heatmapTipo,
      normalizeByWeeks: this.heatmapNormalizeByWeeks,
      categoria: this.currentFilter?.tipoEquipoId ?? null,
      asignatura: this.currentFilter?.asignaturaId ?? null,
      anioIngreso: this.currentFilter?.anioIngreso ?? null,
      estado: this.estadoSeleccionado,
    };

    if (this.currentFilter && this.heatmapTipo === 'FUERA') {
      params.from = this.currentFilter.from;
      params.to = this.currentFilter.to;
    }

    this.dashboardService.getDemandHeatmap(params)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (payload) => {
          this.lastHeatmapPayload = payload;
          this.heatmapSinDatos = !payload?.hasData;
          this.renderDemandHeatmapChart(payload);
          this.heatmapLoading = false;
        },
        error: () => {
          this.heatmapError = 'No se pudo cargar el heatmap de demanda.';
          this.heatmapLoading = false;
          this.demandHeatmapChart?.clear();
        }
      });
  }

  private loadRejectionsAndStatus(): void {
    if (!this.currentFilter && this.rejectionsStatusTipo === 'FUERA') {
      return;
    }

    this.rejectionsStatusLoading = true;
    this.rejectionsStatusError = '';
    this.rejectionsStatusSinDatos = false;

    const params: RejectionsAndStatusParams = {
      tipo: this.rejectionsStatusTipo,
      view: this.rejectionsStatusView,
      categoria: this.currentFilter?.tipoEquipoId ?? null,
      asignatura: this.currentFilter?.asignaturaId ?? null,
      anioIngreso: this.currentFilter?.anioIngreso ?? null,
      estado: this.estadoSeleccionado,
    };

    if (this.rejectionsStatusTipo === 'FUERA' && this.currentFilter) {
      params.from = this.currentFilter.from;
      params.to = this.currentFilter.to;
    }

    this.dashboardService.getRejectionsAndStatus(params)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (payload) => {
          this.lastRejectionsStatusPayload = payload;
          this.rejectionsStatusSinDatos = !payload?.hasData;
          this.rejectionsStatusSummary = payload?.messages?.summary ?? '';
          this.rejectionsStatusInterpretation = payload?.messages?.interpretation ?? '';
          this.renderRejectionsStatusChart(payload);
          this.rejectionsStatusLoading = false;
        },
        error: () => {
          this.rejectionsStatusError = 'No se pudo cargar la distribución de motivos/estados.';
          this.rejectionsStatusLoading = false;
          this.rejectionsStatusChart?.clear();
        }
      });
  }

  private loadDemandForecast(): void {
    if (!this.currentFilter && this.forecastTipo === 'FUERA') {
      return;
    }

    this.forecastLoading = true;
    this.forecastError = '';
    this.forecastSinDatos = false;

    const params: DemandForecastParams = {
      tipo: this.forecastTipo,
      bucket: this.forecastBucket,
      horizon: this.forecastHorizon,
      categoria: this.currentFilter?.tipoEquipoId ?? null,
      asignatura: this.currentFilter?.asignaturaId ?? null,
      anioIngreso: this.currentFilter?.anioIngreso ?? null,
      estado: this.estadoSeleccionado,
    };

    if (this.forecastTipo === 'FUERA' && this.currentFilter) {
      params.from = this.currentFilter.from;
      params.to = this.currentFilter.to;
    }

    this.dashboardService.getDemandForecast(params)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (payload) => {
          this.lastForecastPayload = payload;
          this.forecastSinDatos = !payload?.hasData;

          const mae = payload?.metrics?.mae;
          const mape = payload?.metrics?.mape;
          this.forecastMetricsText = [
            mae != null ? `MAE: ${mae}` : null,
            mape != null ? `MAPE: ${mape}%` : null,
          ].filter(Boolean).join(' · ');

          this.renderDemandForecastChart(payload);
          this.forecastLoading = false;
        },
        error: () => {
          this.forecastError = 'No se pudo cargar el forecast de demanda.';
          this.forecastLoading = false;
          this.demandForecastChart?.clear();
        }
      });
  }

  private loadStatusFlow(): void {
    if (!this.currentFilter && this.statusFlowTipo === 'FUERA') {
      return;
    }

    this.statusFlowLoading = true;
    this.statusFlowError = '';
    this.statusFlowSinDatos = false;

    const params: StatusFlowParams = {
      tipo: this.statusFlowTipo,
      categoria: this.currentFilter?.tipoEquipoId ?? null,
      asignatura: this.currentFilter?.asignaturaId ?? null,
      anioIngreso: this.currentFilter?.anioIngreso ?? null,
      estado: this.estadoSeleccionado,
    };

    if (this.statusFlowTipo === 'FUERA' && this.currentFilter) {
      params.from = this.currentFilter.from;
      params.to = this.currentFilter.to;
    }

    this.dashboardService.getStatusFlow(params)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (payload) => {
          this.lastStatusFlowPayload = payload;
          this.statusFlowSinDatos = !payload?.hasData;
          this.statusFlowSummary = payload?.messages?.summary ?? '';
          this.renderStatusFlowChart(payload);
          this.statusFlowLoading = false;
        },
        error: () => {
          this.statusFlowError = 'No se pudo cargar el flujo de estados.';
          this.statusFlowLoading = false;
          this.statusFlowChart?.clear();
        }
      });
  }

  private renderDemandVsStockChart(payload: any): void {
    this.initDemandVsStockChart();
    if (!this.demandVsStockChart) return;

    const points: any[] = payload?.points ?? [];
    const cutX = payload?.meta?.cutLines?.x ?? 0;
    const cutY = payload?.meta?.cutLines?.y ?? 0;

    // Build color map by category
    const categoryColors: Record<string, string> = {};
    const palette = [
      '#5470c6', '#91cc75', '#fac858', '#ee6666', '#73c0de',
      '#3ba272', '#fc8452', '#9a60b4', '#ea7ccc', '#48b8d0'
    ];
    let colorIdx = 0;
    points.forEach((p: any) => {
      const cat = p.categoria ?? 'Sin categoría';
      if (!categoryColors[cat]) {
        categoryColors[cat] = palette[colorIdx % palette.length];
        colorIdx++;
      }
    });

    // Build series grouped by category for legend
    const byCat: Record<string, any[]> = {};
    points.forEach((p: any) => {
      const cat = p.categoria ?? 'Sin categoría';
      if (!byCat[cat]) byCat[cat] = [];
      byCat[cat].push(p);
    });

    const series: any[] = Object.entries(byCat).map(([cat, pts]) => ({
      name: cat,
      type: 'scatter',
      symbolSize: 16,
      data: pts.map((p: any) => ({
        value: [p.x, p.y],
        point: p,
      })),
      emphasis: { focus: 'series' },
      markLine: undefined,
    }));

    // Add quadrant lines to first series only
    if (series.length > 0) {
      series[0].markLine = {
        symbol: ['none', 'none'],
        label: { show: true, formatter: '{b}' },
        lineStyle: { type: 'dashed', opacity: 0.75 },
        data: [
          { xAxis: cutX, name: `Corte demanda (${cutX})` },
          { yAxis: cutY, name: `Corte stock (${cutY})` },
        ]
      };
    }

    const option: echarts.EChartsOption = {
      animation: true,
      animationDuration: 700,
      animationEasing: 'cubicOut',
      grid: { left: 58, right: 20, top: 64, bottom: 55 },
      legend: {
        top: 8,
        data: Object.keys(byCat),
      },
      tooltip: {
        trigger: 'item',
        backgroundColor: '#1f2937',
        borderWidth: 0,
        textStyle: { color: '#fff' },
        formatter: (params: any) => {
          const point = params?.data?.point;
          if (!point) return '';

          const quadrantText = payload?.meta?.quadrants?.[point.quadrant] ?? '';
          return [
            `<div style="margin-bottom:6px;font-weight:600">${point.label}</div>`,
            `Categoría: <b>${point.categoria}</b>`,
            `Demanda aprobada (X): <b>${point.x}</b> préstamos`,
            `Stock operativo (Y): <b>${point.y}</b> equipos`,
            `Saturación: <b>${point.saturacion}%</b>`,
            `Déficit: <b>${point.deficit}</b>`,
            `Rechazo por stock: <b>${point.rejectRate}%</b> (${point.rejectCount})`,
            `Cuadrante: <b>${point.quadrant.replaceAll('_', ' ')}</b>`,
            `<span style="opacity:.9">${quadrantText}</span>`,
          ].join('<br/>');
        }
      },
      toolbox: {
        right: 12,
        feature: {
          restore: {},
          saveAsImage: { name: 'demanda-vs-stock' }
        }
      },
      xAxis: {
        type: 'value',
        name: 'Demanda (# préstamos)',
        min: 0,
        splitLine: { show: true },
      },
      yAxis: {
        type: 'value',
        name: 'Stock operativo (equipos)',
        min: 0,
        splitLine: { show: true },
      },
      series,
    };

    this.demandVsStockChart.setOption(option, true);
  }

  private renderTopRequestedChart(payload: any): void {
    this.initTopRequestedChart();
    if (!this.topRequestedChart) return;

    const ranking: any[] = payload?.ranking ?? [];
    const selectedKey = this.selectedTopRequested?.selectedKey ?? this.selectedTopRequested?.key ?? null;

    const chartRows = [...ranking].reverse();
    const labels = chartRows.map((row) => row.label);
    const seriesData = chartRows.map((row) => ({
      value: row.demand,
      point: row,
      itemStyle: {
        color: (() => {
          const variation = Number(row.variationPct ?? 0);
          return variation > 0 ? '#4ade80' : (variation < 0 ? '#f87171' : '#9ca3af');
        })(),
        opacity: selectedKey ? (selectedKey === row.key ? 1 : 0.35) : 0.92,
      },
      label: {
        show: true,
        position: 'right' as const,
        color: (() => {
          const variation = Number(row.variationPct ?? 0);
          return variation > 0 ? '#16a34a' : (variation < 0 ? '#dc2626' : '#6b7280');
        })(),
        fontWeight: 600,
        formatter: () => {
          const variation = Number(row.variationPct ?? 0);
          const arrow = variation > 0 ? '↑' : (variation < 0 ? '↓' : '→');
          const sign = variation > 0 ? '+' : '';
          return `${sign}${variation}% ${arrow}`;
        }
      }
    }));

    const option: echarts.EChartsOption = {
      animation: true,
      animationDuration: 700,
      animationEasing: 'cubicOut',
      grid: { left: 180, right: 120, top: 64, bottom: 35 },
      legend: {
        top: 8,
        data: ['Demanda'],
      },
      tooltip: {
        trigger: 'item',
        backgroundColor: '#1f2937',
        borderWidth: 0,
        textStyle: { color: '#fff' },
        formatter: (params: any) => {
          const point = params?.data?.point;
          if (!point) return '';

          const variation = Number(point.variationPct ?? 0);
          const arrow = variation > 0 ? '↑' : (variation < 0 ? '↓' : '→');
          const sign = variation > 0 ? '+' : '';

          return [
            `<div style="margin-bottom:6px;font-weight:600">${point.label}</div>`,
            `Demanda periodo seleccionado: <b>${point.currentPeriod}</b>`,
            `Demanda periodo anterior: <b>${point.previousPeriod}</b>`,
            `Variación: <b>${sign}${variation}% ${arrow}</b>`,
            `<span style="opacity:.85">${payload?.meta?.comparison ?? ''}</span>`,
            `<span style="opacity:.8">Click para drill-down temporal.</span>`,
          ].join('<br/>');
        }
      },
      toolbox: {
        right: 12,
        feature: {
          restore: {},
          saveAsImage: { name: 'top-solicitados' },
        }
      },
      xAxis: {
        type: 'value',
        name: 'Demanda (# préstamos)',
        min: 0,
        splitLine: { show: true },
      },
      yAxis: {
        type: 'category',
        data: labels,
        axisLabel: { width: 160, overflow: 'truncate' }
      },
      series: [
        {
          name: 'Demanda',
          type: 'bar',
          data: seriesData,
          barMaxWidth: 28,
          emphasis: { focus: 'series' },
        }
      ]
    };

    this.topRequestedChart.setOption(option, true);
  }

  private renderTopRequestedDrillChart(drilldown: any): void {
    this.initTopRequestedDrillChart();
    if (!this.topRequestedDrillChart) return;

    const labels: string[] = drilldown?.labels ?? [];
    const total: number[] = drilldown?.series?.total_solicitudes ?? [];
    const isInternal = drilldown?.mode === 'internal';

    const option: echarts.EChartsOption = {
      animation: true,
      animationDuration: 650,
      animationEasing: 'cubicOut',
      grid: { left: 52, right: 24, top: 48, bottom: 56 },
      tooltip: {
        trigger: 'axis',
        axisPointer: { type: isInternal ? 'shadow' : 'cross' },
        backgroundColor: '#1f2937',
        borderWidth: 0,
        textStyle: { color: '#fff' },
      },
      xAxis: {
        type: 'category',
        data: labels,
        boundaryGap: isInternal,
        axisLabel: { rotate: labels.length > 8 ? 25 : 0 },
      },
      yAxis: { type: 'value', min: 0, minInterval: 1, name: 'Solicitudes' },
      series: [
        {
          name: drilldown?.selectedLabel ?? 'Serie temporal',
          type: isInternal ? 'bar' : 'line',
          smooth: !isInternal,
          showSymbol: !isInternal,
          areaStyle: isInternal ? undefined : { opacity: 0.12 },
          data: total,
        }
      ]
    };

    this.topRequestedDrillChart.setOption(option, true);
  }

  private renderDemandHeatmapChart(payload: any): void {
    this.initDemandHeatmapChart();
    if (!this.demandHeatmapChart) return;

    const xLabels: string[] = payload?.xLabels ?? [];
    const yLabels: string[] = payload?.yLabels ?? [];
    const sourceData: any[] = payload?.data ?? [];
    const normalized = !!payload?.meta?.normalizedByWeeks;
    const weekDivisor = Number(payload?.meta?.weekDivisor ?? 1);
    const missingWeekday = Number(payload?.meta?.missingWeekdayCount ?? 0);

    const data = sourceData.map((cell) => [
      Number(cell?.xIndex ?? 0),
      Number(cell?.yIndex ?? 0),
      Number(cell?.value ?? 0),
      Number(cell?.rawCount ?? 0),
      String(cell?.xLabel ?? ''),
      String(cell?.yLabel ?? ''),
    ]);

    const maxValue = Math.max(1, ...data.map((cell) => Number(cell[2] ?? 0)));
    const palette = this.heatmapPalette === 'intense'
      ? ['#fef2f2', '#fca5a5', '#ef4444', '#b91c1c', '#7f1d1d']
      : ['#e0f2fe', '#7dd3fc', '#38bdf8', '#0284c7', '#075985'];

    const option: echarts.EChartsOption = {
      animation: true,
      animationDuration: 650,
      animationEasing: 'cubicOut',
      grid: { left: 90, right: 90, top: 68, bottom: 50 },
      tooltip: {
        position: 'top',
        backgroundColor: '#1f2937',
        borderWidth: 0,
        textStyle: { color: '#fff' },
        formatter: (params: any) => {
          const [xIdx, yIdx, value, rawCount, xLabel, yLabel] = params?.data ?? [];
          const valueLabel = normalized
            ? `Promedio semanal: <b>${value}</b>`
            : `Solicitudes: <b>${rawCount}</b>`;

          return [
            `<div style="margin-bottom:6px;font-weight:600">${yLabel} · ${xLabel}</div>`,
            `Celda (x=${xIdx}, y=${yIdx})`,
            `Solicitudes totales: <b>${rawCount}</b>`,
            valueLabel,
            normalized ? `<span style="opacity:.85">Normalizado en ${weekDivisor} semana(s)</span>` : '',
            missingWeekday > 0 ? `<span style="opacity:.8">Omitidos sin fecha para día de semana: ${missingWeekday}</span>` : '',
          ].filter(Boolean).join('<br/>');
        }
      },
      xAxis: {
        type: 'category',
        data: xLabels,
        splitArea: { show: true },
        axisLabel: { rotate: xLabels.length > 8 ? 25 : 0 },
      },
      yAxis: {
        type: 'category',
        data: yLabels,
        splitArea: { show: true },
      },
      visualMap: {
        min: 0,
        max: maxValue,
        calculable: true,
        orient: 'vertical',
        right: 12,
        top: 'middle',
        inRange: {
          color: palette,
        }
      },
      series: [
        {
          name: 'Demanda',
          type: 'heatmap',
          data,
          label: {
            show: true,
            formatter: (params: any) => {
              const rawCount = Number(params?.data?.[3] ?? 0);
              const value = Number(params?.data?.[2] ?? 0);
              return normalized ? `${value}` : `${rawCount}`;
            },
            fontSize: 10,
          },
          emphasis: {
            itemStyle: {
              shadowBlur: 10,
              shadowColor: 'rgba(0, 0, 0, 0.35)'
            }
          }
        }
      ]
    };

    this.demandHeatmapChart.setOption(option, true);
  }

  private renderRejectionsStatusChart(payload: any): void {
    this.initRejectionsStatusChart();
    if (!this.rejectionsStatusChart) return;

    const items: any[] = payload?.items ?? [];
    const chartType = payload?.meta?.chartType ?? 'donut';

    const option: echarts.EChartsOption = {
      animation: true,
      animationDuration: 650,
      animationEasing: 'cubicOut',
      tooltip: {
        trigger: 'item',
        backgroundColor: '#1f2937',
        borderWidth: 0,
        textStyle: { color: '#fff' },
        formatter: (params: any) => {
          const data = params?.data ?? {};
          const pct = Number(data?.percent ?? params?.percent ?? 0);
          return [
            `<div style="margin-bottom:6px;font-weight:600">${data?.displayLabel ?? data?.name ?? ''}</div>`,
            `Casos: <b>${data?.value ?? 0}</b>`,
            `Participación: <b>${pct}%</b>`,
          ].join('<br/>');
        }
      },
      legend: {
        top: 8,
      },
      toolbox: {
        right: 12,
        feature: {
          restore: {},
          saveAsImage: { name: 'motivos-estados' }
        }
      },
      series: chartType === 'treemap'
        ? [
            {
              type: 'treemap',
              roam: false,
              breadcrumb: { show: false },
              label: { show: true, formatter: '{b}: {c}' },
              data: items.map((item) => ({
                name: item.displayLabel || item.label,
                displayLabel: item.displayLabel || item.label,
                value: item.value,
                percent: item.percent,
              }))
            }
          ]
        : [
            {
              name: payload?.meta?.view === 'estados' ? 'Estados' : 'Motivos',
              type: 'pie',
              radius: ['45%', '70%'],
              center: ['50%', '56%'],
              avoidLabelOverlap: true,
              label: {
                show: true,
                formatter: '{b}: {d}%'
              },
              data: items.map((item) => ({
                name: item.displayLabel || item.label,
                displayLabel: item.displayLabel || item.label,
                value: item.value,
                percent: item.percent,
              }))
            }
          ]
    };

    this.rejectionsStatusChart.setOption(option, true);
  }

  private renderDemandForecastChart(payload: any): void {
    this.initDemandForecastChart();
    if (!this.demandForecastChart) return;

    const histLabels: string[] = payload?.labels?.historical ?? [];
    const forecastLabels: string[] = payload?.labels?.forecast ?? [];
    const allLabels = [...histLabels, ...forecastLabels];

    const historical: number[] = payload?.series?.historical ?? [];
    const fitted: number[] = payload?.series?.fitted ?? [];
    const forecast: number[] = payload?.series?.forecast ?? [];
    const lowerP90: number[] = payload?.series?.lowerP90 ?? [];
    const upperP90: number[] = payload?.series?.upperP90 ?? [];

    const padHist = historical.concat(Array(forecast.length).fill(null));
    const padFitted = fitted.concat(Array(forecast.length).fill(null));
    const padForecast = Array(histLabels.length).fill(null).concat(forecast);
    const padLowerP90 = Array(histLabels.length).fill(null).concat(lowerP90);
    const padUpperP90 = Array(histLabels.length).fill(null).concat(upperP90);

    const option: echarts.EChartsOption = {
      animation: true,
      animationDuration: 700,
      animationEasing: 'cubicOut',
      grid: { left: 54, right: 24, top: 64, bottom: 56 },
      legend: {
        top: 8,
        data: ['Histórico real', 'Ajuste modelo', 'Forecast', 'Banda P90']
      },
      tooltip: {
        trigger: 'axis',
        axisPointer: { type: 'cross' },
        backgroundColor: '#1f2937',
        borderWidth: 0,
        textStyle: { color: '#fff' },
      },
      toolbox: {
        right: 12,
        feature: {
          restore: {},
          saveAsImage: { name: 'demanda-forecast' }
        }
      },
      xAxis: {
        type: 'category',
        data: allLabels,
        boundaryGap: false,
      },
      yAxis: {
        type: 'value',
        name: 'Demanda (# préstamos)',
        min: 0,
      },
      series: [
        {
          name: 'Histórico real',
          type: 'line',
          smooth: true,
          showSymbol: false,
          data: padHist,
          lineStyle: { width: 2 },
        },
        {
          name: 'Ajuste modelo',
          type: 'line',
          smooth: true,
          showSymbol: false,
          data: padFitted,
          lineStyle: { width: 1.5, type: 'dashed' },
        },
        {
          name: 'Forecast',
          type: 'line',
          smooth: true,
          showSymbol: true,
          data: padForecast,
          lineStyle: { width: 2.5 },
          itemStyle: { color: '#2563eb' },
        },
        {
          name: 'Banda P90',
          type: 'line',
          data: padLowerP90,
          lineStyle: { opacity: 0 },
          stack: 'band-p90',
          symbol: 'none',
        },
        {
          name: 'Banda P90',
          type: 'line',
          data: padUpperP90.map((upper, idx) => {
            const low = padLowerP90[idx] as number | null;
            if (upper == null || low == null) return null;
            return Number(upper) - Number(low);
          }),
          lineStyle: { opacity: 0 },
          areaStyle: { color: 'rgba(37, 99, 235, 0.18)' },
          stack: 'band-p90',
          symbol: 'none',
        }
      ]
    };

    this.demandForecastChart.setOption(option, true);
  }

  private renderStatusFlowChart(payload: any): void {
    this.initStatusFlowChart();
    if (!this.statusFlowChart) return;

    const nodes: any[] = payload?.nodes ?? [];
    const links: any[] = payload?.links ?? [];

    const option: echarts.EChartsOption = {
      animation: true,
      animationDuration: 650,
      animationEasing: 'cubicOut',
      tooltip: {
        trigger: 'item',
        backgroundColor: '#1f2937',
        borderWidth: 0,
        textStyle: { color: '#fff' },
        formatter: (params: any) => {
          if (params?.dataType === 'edge') {
            const data = params?.data ?? {};
            return [
              `<div style="margin-bottom:6px;font-weight:600">${data.source} → ${data.target}</div>`,
              `Casos: <b>${data.value ?? 0}</b>`,
              `% del total: <b>${data.percentTotal ?? 0}%</b>`,
              `% desde origen: <b>${data.percentFromSource ?? 0}%</b>`,
            ].join('<br/>');
          }

          const nodeName = params?.name ?? '';
          const outbound = links
            .filter((link) => link.source === nodeName)
            .reduce((acc, link) => acc + Number(link.value ?? 0), 0);
          const inbound = links
            .filter((link) => link.target === nodeName)
            .reduce((acc, link) => acc + Number(link.value ?? 0), 0);

          return [
            `<div style="margin-bottom:6px;font-weight:600">${nodeName}</div>`,
            `Entradas: <b>${inbound}</b>`,
            `Salidas: <b>${outbound}</b>`,
          ].join('<br/>');
        }
      },
      toolbox: {
        right: 12,
        feature: {
          restore: {},
          saveAsImage: { name: 'flujo-estados' }
        }
      },
      series: [
        {
          type: 'sankey',
          left: 18,
          right: 18,
          top: 14,
          bottom: 14,
          nodeAlign: 'justify',
          draggable: false,
          emphasis: { focus: 'adjacency' },
          lineStyle: {
            color: 'gradient',
            curveness: 0.5,
            opacity: 0.35,
          },
          label: {
            fontSize: 12,
          },
          data: nodes.map((node) => ({ name: node.name })),
          links: links.map((link) => ({
            source: link.source,
            target: link.target,
            value: link.value,
            percentTotal: link.percentTotal,
            percentFromSource: link.percentFromSource,
          })),
        }
      ]
    };

    this.statusFlowChart.setOption(option, true);
  }

  /** FUERA — línea/área navegable por fecha */
  private renderTimeseriesChart(payload: any): void {
    const labels: string[] = payload?.labels ?? [];
    const total: number[] = payload?.series?.total_solicitudes ?? [];
    const aprobadas: number[] = payload?.series?.aprobadas ?? [];

    const option: echarts.EChartsOption = {
      animation: true,
      animationDuration: 700,
      animationEasing: 'cubicOut',
      legend: { top: 8, data: ['Solicitudes totales', 'Aprobadas'] },
      tooltip: {
        trigger: 'axis',
        axisPointer: { type: 'cross' },
        backgroundColor: '#1f2937',
        borderWidth: 0,
        textStyle: { color: '#fff' },
        formatter: (params: any) => {
          const rows = Array.isArray(params) ? params : [params];
          const header = `<div style="margin-bottom:6px;font-weight:600">${rows[0]?.axisValueLabel ?? ''}</div>`;
          const body = rows.map((p: any) => `${p.marker} ${p.seriesName}: <b>${p.value ?? 0}</b>`).join('<br/>');
          return `${header}${body}`;
        }
      },
      toolbox: {
        right: 12,
        feature: {
          dataZoom: { yAxisIndex: 'none' },
          restore: {},
          saveAsImage: { name: 'demanda-externa' },
        }
      },
      brush: { toolbox: ['lineX', 'clear'], xAxisIndex: 'all' },
      grid: { left: 52, right: 24, top: 56, bottom: 90 },
      xAxis: { type: 'category', data: labels, boundaryGap: false },
      yAxis: { type: 'value', minInterval: 1, name: 'Solicitudes' },
      dataZoom: [
        { type: 'inside', zoomOnMouseWheel: true, moveOnMouseMove: true, moveOnMouseWheel: true },
        { type: 'slider', show: true, bottom: 26 },
      ],
      series: [
        {
          name: 'Solicitudes totales', type: 'line', smooth: true,
          showSymbol: false, lineStyle: { width: 2 },
          areaStyle: { opacity: 0.18 }, emphasis: { focus: 'series' },
          data: total,
        },
        {
          name: 'Aprobadas', type: 'line', smooth: true,
          showSymbol: false, lineStyle: { width: 2, type: 'dashed' },
          areaStyle: { opacity: 0.08 }, emphasis: { focus: 'series' },
          data: aprobadas,
        },
      ],
    };

    this.chart!.setOption(option, true);
  }

  /** DENTRO — barras por bloque horario */
  private renderBlockChart(payload: any): void {
    const labels: string[] = payload?.labels ?? [];
    const total: number[] = payload?.series?.total_solicitudes ?? [];
    const aprobadas: number[] = payload?.series?.aprobadas ?? [];

    const option: echarts.EChartsOption = {
      animation: true,
      animationDuration: 700,
      animationEasing: 'cubicOut',
      legend: { top: 8, data: ['Solicitudes totales', 'Aprobadas'] },
      tooltip: {
        trigger: 'axis',
        axisPointer: { type: 'shadow' },
        backgroundColor: '#1f2937',
        borderWidth: 0,
        textStyle: { color: '#fff' },
        formatter: (params: any) => {
          const rows = Array.isArray(params) ? params : [params];
          const header = `<div style="margin-bottom:6px;font-weight:600">${rows[0]?.axisValueLabel ?? ''}</div>`;
          const body = rows.map((p: any) => `${p.marker} ${p.seriesName}: <b>${p.value ?? 0}</b>`).join('<br/>');
          return `${header}${body}`;
        }
      },
      toolbox: {
        right: 12,
        feature: {
          saveAsImage: { name: 'demanda-bloques' },
        }
      },
      grid: { left: 52, right: 24, top: 56, bottom: 40 },
      xAxis: {
        type: 'category',
        data: labels,
        axisLabel: { rotate: 25, fontSize: 11 },
      },
      yAxis: { type: 'value', minInterval: 1, name: 'Solicitudes' },
      series: [
        {
          name: 'Solicitudes totales', type: 'bar',
          barMaxWidth: 44, itemStyle: { borderRadius: [4, 4, 0, 0] },
          emphasis: { focus: 'series' }, data: total,
        },
        {
          name: 'Aprobadas', type: 'bar',
          barMaxWidth: 44, itemStyle: { borderRadius: [4, 4, 0, 0] },
          emphasis: { focus: 'series' }, data: aprobadas,
        },
      ],
    };

    this.chart!.setOption(option, true);
  }

  private mapBucket(granularity: string): 'day' | 'week' | 'month' {
    const mapping: Record<string, 'day' | 'week' | 'month'> = {
      day: 'day', week: 'week', month: 'month',
      quarter: 'month', semester: 'month', year: 'month',
    };
    return mapping[granularity] ?? 'month';
  }
}
