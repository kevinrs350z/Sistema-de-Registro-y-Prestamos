import {
  Component, ElementRef, OnDestroy, OnInit, ViewChild, AfterViewInit
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Subject, takeUntil, forkJoin } from 'rxjs';
import * as echarts from 'echarts';
import {
  AuditDashboardService,
  KpiCard, FillRateItem, AtrasoItem, ParetoItem,
  ThroughputPoint, HuerfanoItem, ABCItem, ABCResumen
} from '../../../../services/reportes/audit-dashboard.service';
import { ReportFiltersComponent } from '../report-filters/report-filters.component';
import { ReportFilter } from '../../../../services/report-filters.service';

@Component({
  selector: 'app-dashboard-audit',
  standalone: true,
  imports: [CommonModule, FormsModule, ReportFiltersComponent],
  templateUrl: './dashboard-audit.component.html',
  styleUrls: ['./dashboard-audit.component.css']
})
export class DashboardAuditComponent implements OnInit, AfterViewInit, OnDestroy {
  @ViewChild('paretoChart') paretoRef?: ElementRef<HTMLDivElement>;
  @ViewChild('throughputChart') throughputRef?: ElementRef<HTMLDivElement>;
  @ViewChild('heatmapChart') heatmapRef?: ElementRef<HTMLDivElement>;
  @ViewChild('abcChart') abcRef?: ElementRef<HTMLDivElement>;

  private destroy$ = new Subject<void>();
  private paretoInstance: any;
  private throughputInstance: any;
  private heatmapInstance: any;
  private abcInstance: any;

  currentFilter: ReportFilter | null = null;

  // State
  loading = false;
  error = '';

  // Data
  cards: KpiCard[] = [];
  fillRateData: FillRateItem[] = [];
  globalFillRate = 0;
  atrasoData: AtrasoItem[] = [];
  globalAtraso = 0;
  paretoData: ParetoItem[] = [];
  totalRechazos = 0;
  throughputData: ThroughputPoint[] = [];
  throughputAvg = 0;
  bucketThroughput: 'day' | 'week' | 'month' = 'week';
  huerfanosData: HuerfanoItem[] = [];
  huerfanosTotal = 0;
  huerfanosPct = 0;
  mesesHuerfanos = 3;
  abcData: ABCItem[] = [];
  abcResumen: ABCResumen | null = null;

  // Tabs
  activeSection: 'overview' | 'fill-rate' | 'atraso' | 'pareto' | 'throughput' | 'huerfanos' | 'abc' | 'heatmap' = 'overview';

  constructor(private auditService: AuditDashboardService) {}

  ngOnInit() {
    this.loadData();
  }

  ngAfterViewInit() {
    window.addEventListener('resize', this.onResize);
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
    window.removeEventListener('resize', this.onResize);
    this.paretoInstance?.dispose();
    this.throughputInstance?.dispose();
    this.heatmapInstance?.dispose();
    this.abcInstance?.dispose();
  }

  private onResize = () => {
    this.paretoInstance?.resize();
    this.throughputInstance?.resize();
    this.heatmapInstance?.resize();
    this.abcInstance?.resize();
  };

  onFiltersChanged(filter: ReportFilter) {
    this.currentFilter = filter;
    this.loadData();
  }

  onSectionChange(section: typeof this.activeSection) {
    this.activeSection = section;
    setTimeout(() => this.renderVisibleCharts(), 100);
  }

  private getParams(): Record<string, any> {
    const p: any = {};
    if (this.currentFilter?.from) p.from = this.currentFilter.from;
    if (this.currentFilter?.to) p.to = this.currentFilter.to;
    return p;
  }

  loadData() {
    this.loading = true;
    this.error = '';

    const params = this.getParams();

    forkJoin({
      resumen: this.auditService.getResumen(params),
      fillRate: this.auditService.getFillRate(params),
      atraso: this.auditService.getTasaAtraso(params),
      pareto: this.auditService.getParetoRechazos(params),
      throughput: this.auditService.getThroughput({ ...params, bucket: this.bucketThroughput }),
      huerfanos: this.auditService.getEquiposHuerfanos({ meses: this.mesesHuerfanos }),
      abc: this.auditService.getSegmentacionABC(params),
      heatmap: this.auditService.getHeatmap(params),
    })
    .pipe(takeUntil(this.destroy$))
    .subscribe({
      next: (data) => {
        // Resumen cards
        this.cards = data.resumen.cards;

        // Fill Rate
        this.fillRateData = data.fillRate.detalle;
        this.globalFillRate = data.fillRate.global_fill_rate;

        // Atraso
        this.atrasoData = data.atraso.detalle;
        this.globalAtraso = data.atraso.global_tasa_atraso;

        // Pareto
        this.paretoData = data.pareto.pareto;
        this.totalRechazos = data.pareto.total_rechazos;

        // Throughput
        this.throughputData = data.throughput.timeseries;
        this.throughputAvg = data.throughput.promedio_por_periodo;

        // Huérfanos
        this.huerfanosData = data.huerfanos.huerfanos;
        this.huerfanosTotal = data.huerfanos.total_huerfanos;
        this.huerfanosPct = data.huerfanos.porcentaje;

        // ABC
        this.abcData = data.abc.detalle;
        this.abcResumen = data.abc.resumen;

        this.loading = false;
        setTimeout(() => this.renderVisibleCharts(), 100);
      },
      error: (err) => {
        console.error('Audit dashboard error', err);
        this.error = 'Error al cargar datos de auditoría.';
        this.loading = false;
      }
    });
  }

  // ── Chart rendering ──

  private renderVisibleCharts() {
    if (this.activeSection === 'overview' || this.activeSection === 'pareto') this.renderPareto();
    if (this.activeSection === 'overview' || this.activeSection === 'throughput') this.renderThroughput();
    if (this.activeSection === 'heatmap') this.renderHeatmap();
    if (this.activeSection === 'abc') this.renderABC();
  }

  private renderPareto() {
    if (!this.paretoRef?.nativeElement || !this.paretoData.length) return;
    this.paretoInstance?.dispose();
    this.paretoInstance = echarts.init(this.paretoRef.nativeElement);

    const motivos = this.paretoData.map(d => d.motivo.replace(/_/g, ' '));
    const cantidades = this.paretoData.map(d => d.cantidad);
    const acumulados = this.paretoData.map(d => d.acumulado);

    this.paretoInstance.setOption({
      tooltip: { trigger: 'axis' },
      legend: { data: ['Rechazos', 'Acumulado %'], bottom: 0 },
      grid: { left: 50, right: 50, top: 30, bottom: 50 },
      xAxis: {
        type: 'category',
        data: motivos,
        axisLabel: { rotate: 20, fontSize: 11 }
      },
      yAxis: [
        { type: 'value', name: 'Cantidad' },
        { type: 'value', name: '%', max: 100, axisLabel: { formatter: '{value}%' } }
      ],
      series: [
        {
          name: 'Rechazos',
          type: 'bar',
          data: cantidades,
          itemStyle: { color: '#ef4444', borderRadius: [4, 4, 0, 0] },
        },
        {
          name: 'Acumulado %',
          type: 'line',
          yAxisIndex: 1,
          data: acumulados,
          itemStyle: { color: '#f59e0b' },
          lineStyle: { width: 2 },
          symbol: 'circle',
          symbolSize: 6,
          markLine: {
            silent: true,
            data: [{ yAxis: 80, lineStyle: { color: '#9ca3af', type: 'dashed' } }],
            label: { formatter: '80%' }
          }
        }
      ]
    });
  }

  private renderThroughput() {
    if (!this.throughputRef?.nativeElement || !this.throughputData.length) return;
    this.throughputInstance?.dispose();
    this.throughputInstance = echarts.init(this.throughputRef.nativeElement);

    const periodos = this.throughputData.map(d => d.periodo);
    const procesados = this.throughputData.map(d => d.procesados);
    const aprobados = this.throughputData.map(d => d.aprobados);
    const rechazados = this.throughputData.map(d => d.rechazados);

    this.throughputInstance.setOption({
      tooltip: { trigger: 'axis' },
      legend: { data: ['Procesados', 'Aprobados', 'Rechazados'], bottom: 0 },
      grid: { left: 50, right: 20, top: 30, bottom: 50 },
      xAxis: { type: 'category', data: periodos, axisLabel: { rotate: 30, fontSize: 10 } },
      yAxis: { type: 'value', name: 'Préstamos' },
      series: [
        {
          name: 'Procesados',
          type: 'line',
          data: procesados,
          areaStyle: { opacity: 0.1 },
          itemStyle: { color: '#3b82f6' },
          smooth: true
        },
        {
          name: 'Aprobados',
          type: 'bar',
          data: aprobados,
          itemStyle: { color: '#22c55e', borderRadius: [3, 3, 0, 0] },
          barMaxWidth: 30
        },
        {
          name: 'Rechazados',
          type: 'bar',
          data: rechazados,
          itemStyle: { color: '#ef4444', borderRadius: [3, 3, 0, 0] },
          barMaxWidth: 30
        }
      ]
    });
  }

  private heatmapRawData: any = null;

  renderHeatmap() {
    if (!this.heatmapRef?.nativeElement) return;
    this.heatmapInstance?.dispose();
    this.heatmapInstance = echarts.init(this.heatmapRef.nativeElement);

    // We need to re-fetch heatmap with optional tipo_equipo_id filter
    const params: any = { ...this.getParams() };
    this.auditService.getHeatmap(params)
      .pipe(takeUntil(this.destroy$))
      .subscribe(data => {
        const bloques = data.bloques;
        const dias = data.dias;
        const heatData = data.heatmapData.map(([bloque, dia, val]) => {
          return [bloques.indexOf(bloque), dias.indexOf(dia), val];
        }).filter(d => d[0] >= 0 && d[1] >= 0);

        this.heatmapInstance.setOption({
          tooltip: {
            position: 'top',
            formatter: (p: any) => `${dias[p.value[1]]} · ${bloques[p.value[0]]}<br><b>${p.value[2]} préstamos</b>`
          },
          grid: { left: 100, right: 40, top: 20, bottom: 60 },
          xAxis: { type: 'category', data: bloques, splitArea: { show: true }, axisLabel: { fontSize: 10, rotate: 30 } },
          yAxis: { type: 'category', data: dias, splitArea: { show: true } },
          visualMap: {
            min: 0,
            max: data.maxDemanda || 10,
            calculable: true,
            orient: 'horizontal',
            left: 'center',
            bottom: 0,
            inRange: { color: ['#eef2ff', '#818cf8', '#4338ca'] }
          },
          series: [{
            type: 'heatmap',
            data: heatData,
            label: { show: true, fontSize: 11 },
            emphasis: { itemStyle: { shadowBlur: 10, shadowColor: 'rgba(0,0,0,0.3)' } }
          }]
        });
      });
  }

  private renderABC() {
    if (!this.abcRef?.nativeElement || !this.abcData.length) return;
    this.abcInstance?.dispose();
    this.abcInstance = echarts.init(this.abcRef.nativeElement);

    const modelos = this.abcData.map(d => d.modelo);
    const prestamos = this.abcData.map(d => d.prestamos);
    const acumulados = this.abcData.map(d => d.acumulado);
    const colores = this.abcData.map(d => d.clase === 'A' ? '#ef4444' : d.clase === 'B' ? '#f59e0b' : '#22c55e');

    this.abcInstance.setOption({
      tooltip: { trigger: 'axis' },
      legend: { data: ['Préstamos', 'Acumulado %'], bottom: 0 },
      grid: { left: 50, right: 50, top: 30, bottom: 60 },
      xAxis: { type: 'category', data: modelos, axisLabel: { rotate: 35, fontSize: 10 } },
      yAxis: [
        { type: 'value', name: 'Préstamos' },
        { type: 'value', name: '%', max: 100, axisLabel: { formatter: '{value}%' } }
      ],
      series: [
        {
          name: 'Préstamos',
          type: 'bar',
          data: prestamos.map((v, i) => ({ value: v, itemStyle: { color: colores[i], borderRadius: [4, 4, 0, 0] } })),
        },
        {
          name: 'Acumulado %',
          type: 'line',
          yAxisIndex: 1,
          data: acumulados,
          itemStyle: { color: '#6366f1' },
          lineStyle: { width: 2 },
          symbol: 'circle',
          symbolSize: 5,
          markLine: {
            silent: true,
            data: [
              { yAxis: 70, lineStyle: { color: '#ef4444', type: 'dashed' }, label: { formatter: 'A 70%' } },
              { yAxis: 90, lineStyle: { color: '#f59e0b', type: 'dashed' }, label: { formatter: 'B 90%' } },
            ]
          }
        }
      ]
    });
  }

  // ── Helpers ──

  getCardColor(card: KpiCard): string {
    return `kpi-${card.color}`;
  }

  getAtrasoColor(tasa: number): string {
    if (tasa <= 10) return 'green';
    if (tasa <= 25) return 'amber';
    return 'red';
  }

  getFillRateColor(rate: number): string {
    if (rate >= 80) return 'green';
    if (rate >= 60) return 'amber';
    return 'red';
  }

  getAlertaClass(alerta: string): string {
    if (alerta === 'ocioso') return 'badge-warning';
    if (alerta === 'en_mantenimiento') return 'badge-info';
    return 'badge-danger';
  }

  getABCClass(clase: string): string {
    if (clase === 'A') return 'abc-a';
    if (clase === 'B') return 'abc-b';
    return 'abc-c';
  }

  onBucketChange(bucket: 'day' | 'week' | 'month') {
    this.bucketThroughput = bucket;
    const params = this.getParams();
    this.auditService.getThroughput({ ...params, bucket })
      .pipe(takeUntil(this.destroy$))
      .subscribe(data => {
        this.throughputData = data.timeseries;
        this.throughputAvg = data.promedio_por_periodo;
        setTimeout(() => this.renderThroughput(), 50);
      });
  }

  onMesesChange(meses: number) {
    this.mesesHuerfanos = meses;
    this.auditService.getEquiposHuerfanos({ meses })
      .pipe(takeUntil(this.destroy$))
      .subscribe(data => {
        this.huerfanosData = data.huerfanos;
        this.huerfanosTotal = data.total_huerfanos;
        this.huerfanosPct = data.porcentaje;
      });
  }

  trackByKey(_: number, card: KpiCard): string { return card.key; }
}
