import {
  Component, ElementRef, OnDestroy, OnInit, ViewChild, AfterViewInit
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Subject, takeUntil, forkJoin } from 'rxjs';
import * as echarts from 'echarts';
import {
  DashboardOperationalService,
  StockoutBaseParams
} from '../../../../services/reportes/dashboard-operational.service';
import { ReportFiltersComponent } from '../report-filters/report-filters.component';
import { ReportFilter } from '../../../../services/report-filters.service';

@Component({
  selector: 'app-dashboard-stockout',
  standalone: true,
  imports: [CommonModule, FormsModule, ReportFiltersComponent],
  templateUrl: './dashboard-stockout.component.html',
  styleUrls: ['./dashboard-stockout.component.css']
})
export class DashboardStockoutComponent implements OnInit, AfterViewInit, OnDestroy {
  @ViewChild('timeseriesChart') timeseriesRef?: ElementRef<HTMLDivElement>;
  @ViewChild('scatterChart')    scatterRef?: ElementRef<HTMLDivElement>;

  private destroy$ = new Subject<void>();
  private timeseriesInstance: any;
  private scatterInstance: any;

  currentFilter: ReportFilter | null = null;
  tipoSeleccionado: 'FUERA' | 'DENTRO' = 'FUERA';

  // ── State ──
  loading = false;
  error = '';

  // KPI
  kpiData: any = null;

  // Timeseries
  bucketTimeseries: 'day' | 'week' | 'month' = 'week';
  timeseriesData: any = null;

  // Ranking
  rankingGroupBy: 'equipo' | 'categoria' = 'equipo';
  rankingData: any = null;
  rankingSortField = 'rechazos';
  rankingSortAsc = false;

  // Scatter
  scatterGroupBy: 'equipo' | 'categoria' = 'categoria';
  scatterData: any = null;

  // Priority
  priorityData: any = null;

  private resizeObserver?: ResizeObserver;
  private resizeHandler = () => {
    this.timeseriesInstance?.resize();
    this.scatterInstance?.resize();
  };

  ngOnInit(): void {
    window.addEventListener('resize', this.resizeHandler);
  }

  ngAfterViewInit(): void {
    this.resizeObserver = new ResizeObserver(() => this.resizeHandler());
    if (this.timeseriesRef?.nativeElement) this.resizeObserver.observe(this.timeseriesRef.nativeElement);
    if (this.scatterRef?.nativeElement) this.resizeObserver.observe(this.scatterRef.nativeElement);
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
    window.removeEventListener('resize', this.resizeHandler);
    this.resizeObserver?.disconnect();
    this.timeseriesInstance?.dispose();
    this.scatterInstance?.dispose();
  }

  constructor(private svc: DashboardOperationalService) {}

  /* ── Filter events ── */

  onFiltersChanged(filter: ReportFilter): void {
    this.currentFilter = filter;
    this.loadAll();
  }

  onTipoChange(tipo: 'FUERA' | 'DENTRO'): void {
    this.tipoSeleccionado = tipo;
    this.loadAll();
  }

  /* ── Main load ── */

  private baseParams(): StockoutBaseParams {
    const p: StockoutBaseParams = {
      tipo: this.tipoSeleccionado,
      categoria: this.currentFilter?.tipoEquipoId ?? null,
      asignatura: this.currentFilter?.asignaturaId ?? null,
      anioIngreso: this.currentFilter?.anioIngreso ?? null,
    };
    if (this.tipoSeleccionado === 'FUERA' && this.currentFilter) {
      p.from = this.currentFilter.from;
      p.to   = this.currentFilter.to;
    }
    return p;
  }

  loadAll(): void {
    if (!this.currentFilter && this.tipoSeleccionado === 'FUERA') return;

    this.loading = true;
    this.error = '';

    const bp = this.baseParams();

    forkJoin({
      kpi:        this.svc.getStockoutKpi(bp),
      timeseries: this.svc.getStockoutTimeseries({ ...bp, bucket: this.bucketTimeseries }),
      ranking:    this.svc.getStockoutRanking({ ...bp, groupBy: this.rankingGroupBy }),
      scatter:    this.svc.getStockoutScatter({ ...bp, groupBy: this.scatterGroupBy }),
      priority:   this.svc.getStockoutPriority(bp),
    })
    .pipe(takeUntil(this.destroy$))
    .subscribe({
      next: (data) => {
        this.kpiData        = data.kpi;
        this.timeseriesData = data.timeseries;
        this.rankingData    = data.ranking;
        this.scatterData    = data.scatter;
        this.priorityData   = data.priority;
        this.loading = false;

        setTimeout(() => {
          this.renderTimeseries();
          this.renderScatter();
        }, 50);
      },
      error: () => {
        this.error = 'No se pudieron cargar los datos de demanda insatisfecha.';
        this.loading = false;
      }
    });
  }

  /* ── Partial reloads ── */

  onBucketChange(bucket: 'day' | 'week' | 'month'): void {
    this.bucketTimeseries = bucket;
    const bp = this.baseParams();
    this.svc.getStockoutTimeseries({ ...bp, bucket })
      .pipe(takeUntil(this.destroy$))
      .subscribe(data => {
        this.timeseriesData = data;
        setTimeout(() => this.renderTimeseries(), 50);
      });
  }

  onRankingGroupByChange(gb: 'equipo' | 'categoria'): void {
    this.rankingGroupBy = gb;
    const bp = this.baseParams();
    this.svc.getStockoutRanking({ ...bp, groupBy: gb })
      .pipe(takeUntil(this.destroy$))
      .subscribe(data => this.rankingData = data);
  }

  onScatterGroupByChange(gb: 'equipo' | 'categoria'): void {
    this.scatterGroupBy = gb;
    const bp = this.baseParams();
    this.svc.getStockoutScatter({ ...bp, groupBy: gb })
      .pipe(takeUntil(this.destroy$))
      .subscribe(data => {
        this.scatterData = data;
        setTimeout(() => this.renderScatter(), 50);
      });
  }

  /* ── Ranking sort ── */

  sortRanking(field: string): void {
    if (this.rankingSortField === field) {
      this.rankingSortAsc = !this.rankingSortAsc;
    } else {
      this.rankingSortField = field;
      this.rankingSortAsc = false;
    }
    if (this.rankingData?.ranking) {
      this.rankingData.ranking.sort((a: any, b: any) => {
        const va = a[field] ?? 0;
        const vb = b[field] ?? 0;
        return this.rankingSortAsc ? va - vb : vb - va;
      });
    }
  }

  getSortIcon(field: string): string {
    if (this.rankingSortField !== field) return '⇅';
    return this.rankingSortAsc ? '↑' : '↓';
  }

  /* ── Variation helpers ── */

  getArrow(dir: string): string {
    if (dir === 'up') return '↑';
    if (dir === 'down') return '↓';
    return '→';
  }

  getVariationText(kpi: any): string {
    if (kpi?.variation == null) return '';
    const sign = kpi.variation > 0 ? '+' : '';
    return `${sign}${kpi.variation}%`;
  }

  /* ── Timeseries chart ── */

  private renderTimeseries(): void {
    const el = this.timeseriesRef?.nativeElement;
    if (!el || !this.timeseriesData?.series?.labels?.length) return;

    if (!this.timeseriesInstance) {
      this.timeseriesInstance = echarts.init(el);
    }

    const s = this.timeseriesData.series;

    this.timeseriesInstance.setOption({
      tooltip: {
        trigger: 'axis',
        backgroundColor: 'rgba(255,255,255,0.96)',
        borderColor: '#e0e4ec',
        textStyle: { color: '#364a63', fontSize: 12 },
        formatter: (params: any[]) => {
          const date = params[0].axisValue;
          let html = `<strong>${date}</strong><br/>`;
          params.forEach((p: any) => {
            html += `<span style="color:${p.color}">●</span> ${p.seriesName}: <strong>${p.value}</strong><br/>`;
          });
          // Add rate if available
          const idx = s.labels.indexOf(date);
          if (idx >= 0 && s.tasaPorPeriodo?.[idx] != null) {
            html += `<span style="color:#8094ae">Tasa: ${s.tasaPorPeriodo[idx]}%</span>`;
          }
          return html;
        }
      },
      legend: { data: ['Solicitudes totales', 'Rechazos SIN_STOCK'], top: 0 },
      grid: { top: 40, right: 20, bottom: 60, left: 50 },
      dataZoom: [
        { type: 'inside', start: 0, end: 100 },
        { type: 'slider', start: 0, end: 100, height: 20, bottom: 8 }
      ],
      xAxis: {
        type: 'category',
        data: s.labels,
        axisLabel: { fontSize: 11, rotate: s.labels.length > 20 ? 45 : 0 }
      },
      yAxis: { type: 'value', name: 'Solicitudes' },
      series: [
        {
          name: 'Solicitudes totales',
          type: 'line',
          data: s.demanda,
          smooth: true,
          lineStyle: { width: 2 },
          itemStyle: { color: '#6576ff' },
          areaStyle: { color: 'rgba(101,118,255,0.08)' },
        },
        {
          name: 'Rechazos SIN_STOCK',
          type: 'line',
          data: s.stockouts,
          smooth: true,
          lineStyle: { width: 2.5, type: 'dashed' },
          itemStyle: { color: '#e85347' },
          areaStyle: { color: 'rgba(232,83,71,0.06)' },
        }
      ]
    }, true);

    this.timeseriesInstance.resize();
  }

  /* ── Scatter chart ── */

  private renderScatter(): void {
    const el = this.scatterRef?.nativeElement;
    if (!el || !this.scatterData?.points?.length) return;

    if (!this.scatterInstance) {
      this.scatterInstance = echarts.init(el);
    }

    const pts = this.scatterData.points;
    const axes = this.scatterData.axes;

    // Color map by categoría
    const cats = [...new Set(pts.map((p: any) => p.categoria))] as string[];
    const palette = ['#6576ff', '#e85347', '#1ee0ac', '#f4bd0e', '#09c2de', '#816bff', '#ff63a5', '#20c997'];
    const catColor: Record<string, string> = {};
    cats.forEach((cat, i) => catColor[cat] = palette[i % palette.length]);

    const seriesMap: Record<string, any[]> = {};
    pts.forEach((p: any) => {
      const key = p.categoria;
      if (!seriesMap[key]) seriesMap[key] = [];
      seriesMap[key].push([p.demanda, p.rechazos, p.nombre, p.pctPerdida, p.cuadrante]);
    });

    const series = Object.entries(seriesMap).map(([name, data]) => ({
      name,
      type: 'scatter',
      data,
      symbolSize: (val: number[]) => Math.max(10, Math.min(40, val[1] * 3 + 8)),
      itemStyle: { color: catColor[name], opacity: 0.85 },
    }));

    // Guide lines for quadrants
    const markLines = [
      { yAxis: axes.midRechazos, label: { formatter: 'Umbral rechazos', position: 'insideEndTop' }, lineStyle: { type: 'dashed', color: '#ccc' } },
      { xAxis: axes.midDemanda, label: { formatter: 'Umbral demanda', position: 'insideEndTop' }, lineStyle: { type: 'dashed', color: '#ccc' } },
    ];

    if (series.length > 0) {
      (series[0] as any).markLine = {
        silent: true,
        data: markLines,
        symbol: 'none',
      };
    }

    this.scatterInstance.setOption({
      tooltip: {
        trigger: 'item',
        backgroundColor: 'rgba(255,255,255,0.96)',
        borderColor: '#e0e4ec',
        textStyle: { color: '#364a63', fontSize: 12 },
        formatter: (p: any) => {
          const d = p.data;
          const cuadLabel: Record<string, string> = {
            critico: '🔴 Crítico (alta demanda + alta pérdida)',
            buen_stock: '🟢 Buen stock (alta demanda, pocos rechazos)',
            puntual: '🟡 Problema puntual',
            irrelevante: '⚪ No relevante',
          };
          return `<strong>${d[2]}</strong><br/>`
            + `Demanda: ${d[0]}<br/>`
            + `Rechazos: ${d[1]}<br/>`
            + `Pérdida: ${d[3]}%<br/>`
            + `${cuadLabel[d[4]] ?? d[4]}`;
        }
      },
      legend: { data: Object.keys(seriesMap), top: 0, type: 'scroll' },
      grid: { top: 45, right: 20, bottom: 20, left: 60 },
      xAxis: { type: 'value', name: 'Demanda (solicitudes)', nameLocation: 'middle', nameGap: 28 },
      yAxis: { type: 'value', name: 'Rechazos SIN_STOCK', nameLocation: 'middle', nameGap: 40 },
      series,
    }, true);

    this.scatterInstance.resize();
  }

  /* ── Priority color helpers ── */

  getPriorityBadgeClass(clasificacion: string): string {
    switch (clasificacion) {
      case 'Comprar urgente': return 'badge-urgente';
      case 'Evaluar compra':  return 'badge-evaluar';
      case 'Monitorear':      return 'badge-monitorear';
      default:                return 'badge-noprio';
    }
  }

  getScoreBarWidth(score: number): number {
    return Math.min(100, Math.max(0, score));
  }

  getScoreBarColor(score: number): string {
    if (score >= 80) return '#e85347';
    if (score >= 60) return '#f4bd0e';
    if (score >= 40) return '#09c2de';
    return '#8094ae';
  }
}
