import { Component, OnInit, OnDestroy, ViewChild, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Subject, forkJoin, takeUntil, debounceTime, switchMap, finalize, of, EMPTY } from 'rxjs';
import { EstadisticasModeloService } from '../../../../services/reportes/estadisticas-modelo.service';
import { ExportService } from '../../../../services/export.service';
import {
  ModeloFiltros, ResumenEjecutivo, DashboardTab,
  ScoreCompraResponse, UsoMensualResponse, PercentilesResponse,
  DemandaResponse, MantenimientosResponse, DowntimeResponse,
  RecomendacionesResponse, TendenciaP75Response, BoxplotDatos,
  RecomendacionItem, ScoreModelo
} from '../../../../models/estadisticas-modelo.models';
import { Chart, registerables } from 'chart.js';

Chart.register(...registerables);

// ── Interfaces locales ───────────────────────────────────────
interface PresetOption {
  key: string;
  label: string;
  months: number;
}

interface MethodologyComponent {
  name: string;
  weight: number;
  color: string;
  description: string;
}

@Component({
  selector: 'app-dashboard-modelos',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './dashboard-modelos.component.html',
  styleUrls: ['./dashboard-modelos.component.css']
})
export class DashboardModelosComponent implements OnInit, OnDestroy {

  // ── State ──────────────────────────────────────────────────
  activeTab: DashboardTab = 'score';
  loading = false;
  error = '';

  // Filtros
  desde = '';
  hasta = '';
  meses = 12;
  activePreset = '1y';

  // Preset config
  readonly presetOptions: PresetOption[] = [
    { key: '3m', label: '3 meses', months: 3 },
    { key: '6m', label: '6 meses', months: 6 },
    { key: '1y', label: '1 año', months: 12 },
    { key: '2y', label: '2 años', months: 24 }
  ];

  // Methodology panel
  showMethodology = false;
  readonly methodologyComponents: MethodologyComponent[] = [
    { name: 'Presión de uso', weight: 35, color: '#118dff', description: 'Ocupación P75 del inventario vs. capacidad disponible.' },
    { name: 'Demanda insatisfecha', weight: 25, color: '#f59e0b', description: 'Solicitudes rechazadas por falta de stock.' },
    { name: 'Tendencia', weight: 20, color: '#06b6d4', description: 'Dirección del uso: ¿la presión crece o decrece?' },
    { name: 'Riesgo downtime', weight: 10, color: '#ef4444', description: 'Días fuera de servicio por fallas técnicas.' },
    { name: 'Fiabilidad', weight: 10, color: '#10b981', description: 'Tasa de incidentes por cada 1000 días de exposición.' }
  ];

  // Data
  resumen: ResumenEjecutivo | null = null;
  ranking: ScoreCompraResponse | null = null;
  recomendaciones: RecomendacionesResponse | null = null;
  usoMensual: UsoMensualResponse | null = null;
  percentiles: PercentilesResponse | null = null;
  tendencia: TendenciaP75Response | null = null;
  boxplot: BoxplotDatos | null = null;
  demanda: DemandaResponse | null = null;
  mantenimientos: MantenimientosResponse | null = null;
  downtime: DowntimeResponse | null = null;

  // Score detail
  selectedModelo: ScoreModelo | null = null;
  isLoadingDetalle = false;
  errorDetalle = '';
  private selectModelo$ = new Subject<RecomendacionItem>();

  // Charts
  private charts: Map<string, Chart> = new Map();

  // Export
  isExportingPdf = false;
  isExportingExcel = false;

  private destroy$ = new Subject<void>();
  private filterChange$ = new Subject<void>();

  @ViewChild('chartUsoMensual') chartUsoMensualRef!: ElementRef<HTMLCanvasElement>;
  @ViewChild('chartBoxplot') chartBoxplotRef!: ElementRef<HTMLCanvasElement>;
  @ViewChild('chartTendencia') chartTendenciaRef!: ElementRef<HTMLCanvasElement>;
  @ViewChild('chartDemanda') chartDemandaRef!: ElementRef<HTMLCanvasElement>;
  @ViewChild('chartFallas') chartFallasRef!: ElementRef<HTMLCanvasElement>;
  @ViewChild('chartDowntime') chartDowntimeRef!: ElementRef<HTMLCanvasElement>;

  constructor(
    private api: EstadisticasModeloService,
    private exportService: ExportService
  ) { }

  ngOnInit(): void {
    this.setDefaultDates();
    this.filterChange$
      .pipe(debounceTime(400), takeUntil(this.destroy$))
      .subscribe(() => this.loadData());

    // ── switchMap: cancela request anterior al seleccionar otro modelo ──
    this.selectModelo$
      .pipe(
        takeUntil(this.destroy$),
        switchMap((item) => {
          this.isLoadingDetalle = true;
          this.errorDetalle = '';
          this.selectedModelo = null;
          return this.api.getScoreModelo(item.tipo_equipo_id, this.filtros).pipe(
            finalize(() => this.isLoadingDetalle = false)
          );
        })
      )
      .subscribe({
        next: (score) => this.selectedModelo = score,
        error: (err) => {
          this.errorDetalle = 'No se pudo cargar el detalle. Intenta de nuevo.';
          console.error('Error cargando score modelo:', err);
        }
      });

    this.loadData();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
    this.charts.forEach(c => c.destroy());
  }

  // ── Filtros ────────────────────────────────────────────────

  private setDefaultDates(): void {
    const now = new Date();
    const from = new Date(now);
    from.setMonth(from.getMonth() - 12);
    this.desde = from.toISOString().split('T')[0];
    this.hasta = now.toISOString().split('T')[0];
  }

  get filtros(): ModeloFiltros {
    return { desde: this.desde, hasta: this.hasta, meses: this.meses };
  }

  onFilterChange(): void {
    this.activePreset = '';
    this.filterChange$.next();
  }

  applyPreset(preset: string): void {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    let from: Date;
    const found = this.presetOptions.find(p => p.key === preset);

    if (found) {
      from = new Date(today);
      if (found.months <= 12) {
        from.setMonth(from.getMonth() - found.months);
      } else {
        from.setFullYear(from.getFullYear() - Math.floor(found.months / 12));
      }
    } else {
      from = new Date(today);
      from.setFullYear(from.getFullYear() - 1);
    }

    this.desde = from.toISOString().split('T')[0];
    this.hasta = today.toISOString().split('T')[0];
    this.activePreset = preset;
    this.loadData();
  }

  // ── Tab ────────────────────────────────────────────────────

  setTab(tab: DashboardTab): void {
    this.activeTab = tab;
    setTimeout(() => this.renderActiveCharts(), 100);
  }

  // ── Load Data ──────────────────────────────────────────────

  loadData(): void {
    this.loading = true;
    this.error = '';

    forkJoin({
      resumen: this.api.getResumenEjecutivo(this.filtros),
      recomendaciones: this.api.getRecomendaciones(this.filtros)
    }).pipe(
      takeUntil(this.destroy$),
      finalize(() => this.loading = false)
    ).subscribe({
      next: (res) => {
        this.resumen = res.resumen;
        this.recomendaciones = res.recomendaciones;
        this.loadTabData();
      },
      error: (err) => {
        this.error = 'No se pudieron cargar los datos. Verifica la conexión.';
        console.error('Error cargando dashboard modelos:', err);
      }
    });
  }

  private loadTabData(): void {
    switch (this.activeTab) {
      case 'saturacion': this.loadSaturacion(); break;
      case 'demanda': this.loadDemanda(); break;
      case 'mantenimiento': this.loadMantenimiento(); break;
      case 'score': break;
    }
  }

  private loadSaturacion(): void {
    forkJoin({
      uso: this.api.getUsoMensual(this.filtros),
      boxplot: this.api.getBoxplotUso(this.filtros),
      tendencia: this.api.getSerieP75(this.filtros)
    }).pipe(takeUntil(this.destroy$)).subscribe({
      next: (res) => {
        this.usoMensual = res.uso;
        this.boxplot = res.boxplot;
        setTimeout(() => {
          this.renderChartUsoMensual();
          this.renderChartBoxplot();
          this.renderChartTendencia(res.tendencia);
        }, 50);
      },
      error: () => { }
    });
  }

  private loadDemanda(): void {
    this.api.getDemandaInsatisfecha(this.filtros)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (res) => {
          this.demanda = res;
          setTimeout(() => this.renderChartDemanda(), 50);
        },
        error: () => { }
      });
  }

  private loadMantenimiento(): void {
    forkJoin({
      mant: this.api.getMantenimientos(this.filtros),
      dt: this.api.getDowntime(this.filtros)
    }).pipe(takeUntil(this.destroy$)).subscribe({
      next: (res) => {
        this.mantenimientos = res.mant;
        this.downtime = res.dt;
        setTimeout(() => {
          this.renderChartFallas();
          this.renderChartDowntime();
        }, 50);
      },
      error: () => { }
    });
  }

  // ── Score detail ───────────────────────────────────────────

  selectModelo(item: RecomendacionItem): void {
    this.selectModelo$.next(item);
  }

  closeDetail(): void {
    this.selectedModelo = null;
    this.errorDetalle = '';
    this.isLoadingDetalle = false;
  }

  // ── Charts ─────────────────────────────────────────────────

  private renderActiveCharts(): void {
    switch (this.activeTab) {
      case 'saturacion':
        if (this.usoMensual) {
          this.renderChartUsoMensual();
          this.renderChartBoxplot();
        } else { this.loadSaturacion(); }
        break;
      case 'demanda':
        if (this.demanda) { this.renderChartDemanda(); }
        else { this.loadDemanda(); }
        break;
      case 'mantenimiento':
        if (this.mantenimientos) {
          this.renderChartFallas();
          this.renderChartDowntime();
        } else { this.loadMantenimiento(); }
        break;
    }
  }

  private getOrCreateChart(key: string, ref: ElementRef<HTMLCanvasElement> | undefined, config: any): Chart | null {
    if (!ref?.nativeElement) return null;
    const existing = this.charts.get(key);
    if (existing) { existing.destroy(); }
    const chart = new Chart(ref.nativeElement, config);
    this.charts.set(key, chart);
    return chart;
  }

  private readonly COLORS = [
    '#118dff', '#12239e', '#e66c37', '#6b007b', '#e044a7',
    '#744ec2', '#d9b300', '#15a892', '#eb5757', '#4dabf5',
    '#667eea', '#2d9cdb', '#f2994a', '#219653', '#9b51e0'
  ];

  // ── Datasets de líneas de referencia (umbrales) ────────────

  private getThresholdAnnotations(allMonths: string[]): any[] {
    return [
      {
        label: '70% — Vigilancia',
        data: allMonths.map(() => 70),
        borderColor: '#f59e0b',
        borderWidth: 1.5,
        borderDash: [6, 4],
        pointRadius: 0,
        fill: false,
        tension: 0,
        order: 100
      },
      {
        label: '85% — Capacidad crítica',
        data: allMonths.map(() => 85),
        borderColor: '#ef4444',
        borderWidth: 1.5,
        borderDash: [6, 4],
        pointRadius: 0,
        fill: false,
        tension: 0,
        order: 100
      }
    ];
  }

  // ── Chart: Uso Mensual (line + reference lines) ────────────

  private renderChartUsoMensual(): void {
    if (!this.usoMensual?.modelos?.length) return;
    const top5 = this.usoMensual.modelos.slice(0, 5);
    const allMonths = [...new Set(top5.flatMap(m => m.meses.map(mm => mm.mes)))].sort();

    const datasets = top5.map((m, i) => ({
      label: `${m.modelo} (${m.marca || 'S/M'})`,
      data: allMonths.map(mes => {
        const found = m.meses.find(mm => mm.mes === mes);
        return found ? found.uso_porcentaje : 0;
      }),
      borderColor: this.COLORS[i % this.COLORS.length],
      backgroundColor: this.COLORS[i % this.COLORS.length] + '22',
      tension: 0.3,
      fill: false,
      pointRadius: 3,
      borderWidth: 2,
      order: i
    }));

    // Add threshold reference lines
    datasets.push(...this.getThresholdAnnotations(allMonths));

    this.getOrCreateChart('usoMensual', this.chartUsoMensualRef, {
      type: 'line',
      data: { labels: allMonths, datasets },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        interaction: { mode: 'index' as const, intersect: false },
        plugins: {
          legend: {
            position: 'bottom',
            labels: {
              boxWidth: 12,
              font: { size: 11 },
              filter: (item: any) => !item.text.includes('—')
            }
          },
          tooltip: {
            callbacks: {
              label: (ctx: any) => {
                if (ctx.dataset.label?.includes('—')) return '';
                const val = ctx.parsed.y;
                let suffix = '';
                if (val >= 85) suffix = ' ⚠️ Crítico';
                else if (val >= 70) suffix = ' ⚡ Vigilar';
                return `${ctx.dataset.label}: ${val.toFixed(1)}%${suffix}`;
              },
              filter: (item: any) => item.dataset.label && !item.dataset.label.includes('—')
            }
          }
        },
        scales: {
          y: {
            beginAtZero: true,
            max: 100,
            title: { display: true, text: 'Uso normalizado (%)' },
            ticks: { callback: (v: any) => v + '%' }
          },
          x: {
            title: { display: true, text: 'Mes' },
            ticks: { maxRotation: 45 }
          }
        }
      }
    });
  }

  // ── Chart: Percentiles (grouped bar + reference lines) ─────

  private renderChartBoxplot(): void {
    if (!this.boxplot?.datos?.length) return;
    const data = this.boxplot.datos.slice(0, 10);
    const labels = data.map(d => d.modelo);

    this.getOrCreateChart('boxplot', this.chartBoxplotRef, {
      type: 'bar',
      data: {
        labels,
        datasets: [
          {
            label: 'P50 (Mediana)',
            data: data.map(d => d.p50),
            backgroundColor: '#118dff44',
            borderColor: '#118dff',
            borderWidth: 1
          },
          {
            label: 'P75 (3 de 4 días)',
            data: data.map(d => d.p75),
            backgroundColor: '#e66c3744',
            borderColor: '#e66c37',
            borderWidth: 1
          },
          {
            label: 'P90 (Pico demanda)',
            data: data.map(d => d.p90),
            backgroundColor: '#6b007b44',
            borderColor: '#6b007b',
            borderWidth: 1
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        indexAxis: 'y' as const,
        plugins: {
          legend: { position: 'bottom', labels: { boxWidth: 12, font: { size: 11 } } },
          tooltip: {
            callbacks: {
              title: (items: any) => {
                const idx = items[0]?.dataIndex;
                if (idx !== undefined) {
                  const d = data[idx];
                  return `${d.modelo} · ${d.total_equipos ?? ''} uds`;
                }
                return '';
              },
              label: (ctx: any) => {
                const val = ctx.parsed.x;
                const pName = ctx.dataset.label;
                let interpretation = '';
                if (pName.includes('P50')) interpretation = 'la mitad del tiempo está por debajo de este nivel';
                if (pName.includes('P75')) interpretation = '3 de cada 4 períodos no superan este uso';
                if (pName.includes('P90')) interpretation = 'solo el 10% del tiempo se supera este uso';
                return `${pName}: ${val.toFixed(1)}% — ${interpretation}`;
              },
              afterBody: (items: any) => {
                const idx = items[0]?.dataIndex;
                if (idx !== undefined) {
                  const d = data[idx];
                  const lines = [];
                  if (d.p75 >= 85) lines.push('⚠️ P75 > 85%: saturación crítica');
                  else if (d.p75 >= 70) lines.push('⚡ P75 > 70%: vigilancia necesaria');
                  return lines.join('\n');
                }
                return '';
              }
            }
          }
        },
        scales: {
          x: {
            beginAtZero: true,
            max: 100,
            title: { display: true, text: 'Uso (%)' },
            ticks: { callback: (v: any) => v + '%' },
            grid: {
              color: (ctx: any) => {
                if (ctx.tick.value === 70) return '#f59e0b44';
                if (ctx.tick.value === 85) return '#ef444444';
                return '#e2e8f020';
              }
            }
          }
        }
      }
    });
  }

  // ── Chart: Tendencia P75 (line + thresholds) ───────────────

  private renderChartTendencia(data: any): void {
    if (!data?.series?.length) return;
    const series = data.series.slice(0, 5);
    const allMonths: string[] = [...new Set(series.flatMap((s: any) => s.datos.map((d: any) => d.x)))].sort() as string[];

    const datasets: any[] = series.map((s: any, i: number) => ({
      label: s.nombre,
      data: allMonths.map((m: string) => {
        const found = s.datos.find((d: any) => d.x === m);
        return found ? found.y : null;
      }),
      borderColor: this.COLORS[i % this.COLORS.length],
      borderWidth: 2,
      tension: 0.3,
      fill: false,
      pointRadius: 2,
      spanGaps: true,
      borderDash: s.tendencia === 'DECRECIENTE' ? [5, 5] : [],
      order: i
    }));

    // Add threshold lines
    datasets.push(...this.getThresholdAnnotations(allMonths));

    this.getOrCreateChart('tendencia', this.chartTendenciaRef, {
      type: 'line',
      data: { labels: allMonths, datasets },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        interaction: { mode: 'index' as const, intersect: false },
        plugins: {
          legend: {
            position: 'bottom',
            labels: {
              boxWidth: 12,
              font: { size: 11 },
              filter: (item: any) => !item.text.includes('—')
            }
          },
          tooltip: {
            callbacks: {
              label: (ctx: any) => {
                if (ctx.dataset.label?.includes('—')) return '';
                return `${ctx.dataset.label}: ${ctx.parsed.y?.toFixed(1)}% (P75)`;
              },
              filter: (item: any) => item.dataset.label && !item.dataset.label.includes('—')
            }
          }
        },
        scales: {
          y: {
            beginAtZero: true,
            title: { display: true, text: 'P75 Uso (%)' },
            ticks: { callback: (v: any) => v + '%' }
          },
          x: {
            ticks: { maxRotation: 45 }
          }
        }
      }
    });
  }

  // ── Chart: Demanda (horizontal bar + ratio tooltips) ───────

  private renderChartDemanda(): void {
    if (!this.demanda?.modelos?.length) return;
    const top10 = this.demanda.modelos.slice(0, 10);

    // Colores por motivo de rechazo
    const coloresMotivos: { [key: string]: { bg: string; border: string } } = {
      SIN_STOCK: { bg: '#ef444488', border: '#ef4444' },
      CONFLICTO_HORARIO: { bg: '#f9731688', border: '#f97316' },
      SANCION_USUARIO: { bg: '#eab30888', border: '#eab308' },
      DOCUMENTACION: { bg: '#22c55e88', border: '#22c55e' },
      LIMITE_PRESTAMOS: { bg: '#3b82f688', border: '#3b82f6' },
      OTRO: { bg: '#8b5cf688', border: '#8b5cf6' },
      DESCONOCIDO: { bg: '#6b728088', border: '#6b7280' }
    };

    // Etiquetas legibles por motivo
    const labelMotivos: { [key: string]: string } = {
      SIN_STOCK: 'Sin stock disponible',
      CONFLICTO_HORARIO: 'Conflicto de horario',
      SANCION_USUARIO: 'Sanción de usuario',
      DOCUMENTACION: 'Documentación incompleta',
      LIMITE_PRESTAMOS: 'Límite de préstamos',
      OTRO: 'Otro motivo',
      DESCONOCIDO: 'Sin especificar'
    };

    // Obtener todos los motivos únicos presentes en los datos
    const motivosPresentes = [...new Set(
      top10.flatMap(m => Object.keys(m.desglose_motivos || {}))
    )];

    // Ordenar motivos: SIN_STOCK primero, luego el resto alfabéticamente
    const motivosOrdenados = motivosPresentes.sort((a, b) => {
      if (a === 'SIN_STOCK') return -1;
      if (b === 'SIN_STOCK') return 1;
      return a.localeCompare(b);
    });

    // Generar datasets dinámicos por cada motivo
    const datasets = motivosOrdenados.map(motivo => ({
      label: labelMotivos[motivo] || motivo,
      data: top10.map(m => m.desglose_motivos?.[motivo] || 0),
      backgroundColor: coloresMotivos[motivo]?.bg || '#6b728088',
      borderColor: coloresMotivos[motivo]?.border || '#6b7280',
      borderWidth: 1
    }));

    this.getOrCreateChart('demanda', this.chartDemandaRef, {
      type: 'bar',
      data: {
        labels: top10.map(m => `${m.modelo} (${m.marca || ''})`),
        datasets: datasets.length > 0 ? datasets : [
          { label: 'Sin rechazos', data: top10.map(() => 0), backgroundColor: '#6b728088' }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        indexAxis: 'y' as const,
        plugins: {
          legend: { position: 'bottom', labels: { boxWidth: 12, font: { size: 11 } } },
          tooltip: {
            callbacks: {
              title: (items: any) => {
                const idx = items[0]?.dataIndex;
                if (idx !== undefined) {
                  const m = top10[idx];
                  return `${m.modelo} (${m.marca || ''})`;
                }
                return '';
              },
              label: (ctx: any) => {
                return `${ctx.dataset.label}: ${ctx.parsed.x}`;
              },
              afterBody: (items: any) => {
                const idx = items[0]?.dataIndex;
                if (idx !== undefined) {
                  const m = top10[idx];
                  const totalRechazos = m.rechazos_stock + m.rechazos_otros;
                  const lines = [
                    `───────────────────`,
                    `Solicitudes totales: ${m.total_solicitudes}`,
                    `Rechazos totales: ${totalRechazos}`,
                  ];
                  // Mostrar desglose por motivo
                  if (m.desglose_motivos) {
                    lines.push(`── Desglose ──`);
                    for (const [motivo, cantidad] of Object.entries(m.desglose_motivos)) {
                      lines.push(`  ${labelMotivos[motivo] || motivo}: ${cantidad}`);
                    }
                  }
                  lines.push(`───────────────────`);
                  lines.push(`Tasa de rechazo: ${m.tasa_rechazo_porcentaje.toFixed(1)}%`);
                  if (m.tasa_rechazo_porcentaje > 10) {
                    lines.push(`⚠️ Supera el umbral del 10%`);
                  }
                  return lines;
                }
                return [];
              }
            }
          }
        },
        scales: {
          x: {
            stacked: true,
            title: { display: true, text: 'Nº de solicitudes rechazadas' }
          },
          y: { stacked: true }
        }
      }
    });
  }

  // ── Chart: Fallas (stacked bar — sorted by total) ──────────

  private renderChartFallas(): void {
    if (!this.mantenimientos?.modelos?.length) return;

    // Sort by total incidents descending
    const sorted = [...this.mantenimientos.modelos]
      .sort((a, b) => b.total_incidentes - a.total_incidentes)
      .slice(0, 8);

    const allFallaCats = [...new Set(sorted.flatMap(m => m.fallas.map(f => f.categoria)))];
    const labels = sorted.map(m => m.modelo);

    const datasets = allFallaCats.map((cat, i) => ({
      label: cat,
      data: sorted.map(m => {
        const f = m.fallas.find(ff => ff.categoria === cat);
        return f ? f.total : 0;
      }),
      backgroundColor: this.COLORS[i % this.COLORS.length] + '99',
      borderColor: this.COLORS[i % this.COLORS.length],
      borderWidth: 1
    }));

    this.getOrCreateChart('fallas', this.chartFallasRef, {
      type: 'bar',
      data: { labels, datasets },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { position: 'bottom', labels: { boxWidth: 12, font: { size: 11 } } },
          tooltip: {
            callbacks: {
              afterBody: (items: any) => {
                const idx = items[0]?.dataIndex;
                if (idx !== undefined) {
                  const m = sorted[idx];
                  return [`Total incidentes: ${m.total_incidentes}`];
                }
                return [];
              }
            }
          }
        },
        scales: {
          x: { stacked: true },
          y: {
            stacked: true,
            title: { display: true, text: 'Nº de incidentes' },
            beginAtZero: true
          }
        }
      }
    });
  }

  // ── Chart: Downtime (bar + per-unit tooltip) ───────────────

  private renderChartDowntime(): void {
    if (!this.downtime?.modelos?.length) return;

    // Sort by total_horas descending
    const sorted = [...this.downtime.modelos]
      .sort((a, b) => b.total_horas - a.total_horas)
      .slice(0, 10);

    this.getOrCreateChart('downtime', this.chartDowntimeRef, {
      type: 'bar',
      data: {
        labels: sorted.map(m => m.modelo),
        datasets: [{
          label: 'Horas fuera de servicio',
          data: sorted.map(m => m.total_horas),
          backgroundColor: sorted.map(m =>
            m.total_horas > 50 ? '#ef444488' :
              m.total_horas > 20 ? '#f59e0b66' : '#94a3b855'
          ),
          borderColor: sorted.map(m =>
            m.total_horas > 50 ? '#ef4444' :
              m.total_horas > 20 ? '#f59e0b' : '#94a3b8'
          ),
          borderWidth: 1
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: false },
          tooltip: {
            callbacks: {
              title: (items: any) => {
                const idx = items[0]?.dataIndex;
                if (idx !== undefined) {
                  return sorted[idx].modelo;
                }
                return '';
              },
              label: (ctx: any) => {
                const m = sorted[ctx.dataIndex];
                return `Downtime total: ${m.total_horas.toFixed(1)}h`;
              },
              afterLabel: (ctx: any) => {
                const m = sorted[ctx.dataIndex];
                const lines = [
                  `${m.total_incidentes} incidentes registrados`,
                  `Promedio: ${m.promedio_horas_por_incidente.toFixed(1)}h por incidente`
                ];
                if (m.total_equipos > 0) {
                  const horasUnidad = m.total_horas / m.total_equipos;
                  lines.push(`Por unidad: ${horasUnidad.toFixed(1)}h de downtime/equipo`);
                }
                if (m.porcentaje_downtime && m.porcentaje_downtime > 5) {
                  lines.push(`⚠️ ${m.porcentaje_downtime.toFixed(1)}% del tiempo fuera de servicio`);
                }
                return lines;
              }
            }
          }
        },
        scales: {
          y: {
            beginAtZero: true,
            title: { display: true, text: 'Horas fuera de servicio' }
          }
        }
      }
    });
  }

  // ── Export ──────────────────────────────────────────────────

  async exportPdf(): Promise<void> {
    if (!this.recomendaciones) return;
    this.isExportingPdf = true;
    try {
      await this.exportService.exportarPDFInstitucional({
        titulo: 'Reporte de Análisis por Modelo de Equipo',
        subtitulo: 'Panel de Decisión de Compra — Análisis BI',
        periodo: `${this.desde} al ${this.hasta}`,
        secciones: [
          {
            tipo: 'kpis',
            titulo: 'Indicadores Clave',
            datos: [
              { label: 'Modelos en inventario', valor: this.resumen?.kpis.total_modelos ?? 0 },
              { label: 'Unidades físicas', valor: this.resumen?.kpis.total_equipos ?? 0 },
              { label: 'Presión de uso (P75)', valor: `${(this.resumen?.kpis.tasa_utilizacion_global ?? 0).toFixed(1)}%` },
              { label: 'Solicitudes denegadas', valor: this.resumen?.kpis.total_rechazos_stock ?? 0 },
              { label: 'Downtime total', valor: `${this.resumen?.kpis.downtime_total_horas ?? 0}h` }
            ]
          },
          {
            tipo: 'tabla',
            titulo: 'Ranking de Modelos — Prioridad de Compra',
            datos: {
              columnas: ['Modelo', 'Marca', 'Score', 'Acción', 'Uso P75', 'Rechazos', 'Tendencia'],
              filas: this.recomendaciones.tabla.map(r => [
                r.modelo, r.marca || '—', r.score, r.recomendacion,
                `${r.p75_uso.toFixed(1)}%`,
                `${r.tasa_rechazo.toFixed(1)}%`,
                r.tendencia
              ])
            }
          }
        ]
      }, `Reporte_Modelos_${this.desde}_${this.hasta}.pdf`);
    } finally {
      this.isExportingPdf = false;
    }
  }

  async exportExcel(): Promise<void> {
    if (!this.recomendaciones) return;
    this.isExportingExcel = true;
    try {
      await this.exportService.exportarExcel([
        {
          name: 'Ranking Modelos',
          data: this.recomendaciones.tabla.map(r => ({
            Modelo: r.modelo,
            Marca: r.marca,
            Categoría: r.categoria,
            Score: r.score,
            Acción: r.recomendacion,
            'Uso P75 (%)': r.p75_uso.toFixed(1),
            'Tasa Rechazo (%)': r.tasa_rechazo.toFixed(1),
            Tendencia: r.tendencia,
            'Incidentes/1000d': r.incidentes_1000d.toFixed(2),
            Explicación: r.explicacion
          }))
        }
      ], `Reporte_Modelos_${this.desde}_${this.hasta}.xlsx`);
    } finally {
      this.isExportingExcel = false;
    }
  }

  // ── Helpers UI — KPI semánticos ────────────────────────────

  getKpiUtilizacionClass(): string {
    if (!this.resumen) return 'kpi-blue';
    const v = this.resumen.kpis.tasa_utilizacion_global;
    if (v >= 85) return 'kpi-red';
    if (v >= 70) return 'kpi-orange-alert';
    if (v >= 40) return 'kpi-green';
    return 'kpi-blue';
  }

  getKpiRechazoClass(): string {
    if (!this.resumen) return 'kpi-red';
    return this.resumen.kpis.tasa_rechazo_global > 10 ? 'kpi-red' : 'kpi-orange';
  }

  // ── Helpers UI — Recomendación ─────────────────────────────

  getRecomendacionClass(rec: string): string {
    switch (rec) {
      case 'COMPRAR': return 'badge-comprar';
      case 'MONITOREAR': return 'badge-monitorear';
      case 'NO_COMPRAR': return 'badge-no-comprar';
      default: return '';
    }
  }

  getRecomendacionLabel(rec: string): string {
    switch (rec) {
      case 'COMPRAR': return 'COMPRAR';
      case 'MONITOREAR': return 'MONITOREAR';
      case 'NO_COMPRAR': return 'NO COMPRAR';
      default: return rec;
    }
  }

  getScoreColor(score: number): string {
    if (score >= 70) return '#10b981';
    if (score >= 40) return '#f59e0b';
    return '#ef4444';
  }

  // ── Helpers UI — Tendencia ─────────────────────────────────

  getTendenciaIcon(dir: string): string {
    switch (dir?.toUpperCase()) {
      case 'CRECIENTE': return '↗';
      case 'DECRECIENTE': return '↘';
      default: return '→';
    }
  }

  getTendenciaLabel(dir: string): string {
    switch (dir?.toUpperCase()) {
      case 'CRECIENTE': return 'Creciente';
      case 'DECRECIENTE': return 'Decreciente';
      default: return 'Estable';
    }
  }

  getTendenciaClass(dir: string): string {
    switch (dir?.toUpperCase()) {
      case 'CRECIENTE': return 'tendencia-creciente';
      case 'DECRECIENTE': return 'tendencia-decreciente';
      default: return 'tendencia-estable';
    }
  }
}
