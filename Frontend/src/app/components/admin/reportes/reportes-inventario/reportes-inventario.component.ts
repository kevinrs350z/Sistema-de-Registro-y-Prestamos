import { Component, OnInit, OnDestroy, ViewChild, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Subject, takeUntil } from 'rxjs';
import Chart from 'chart.js/auto';
import { ExportButtonsComponent } from '../export-buttons/export-buttons.component';
import { ReportesInventarioService } from '../../../../services/reportes/reportes-inventario.service';
import { ExportService, ReporteData } from '../../../../services/export.service';
import { ReportFiltersComponent } from '../report-filters/report-filters.component';
import { ReportFiltersService, ReportFilter } from '../../../../services/report-filters.service';

@Component({
  selector: 'app-reportes-inventario',
  standalone: true,
  imports: [CommonModule, ExportButtonsComponent, ReportFiltersComponent],
  templateUrl: './reportes-inventario.component.html',
  styleUrls: ['./reportes-inventario.component.css']
})
export class ReportesInventarioComponent implements OnInit, OnDestroy {
  @ViewChild('estadoChart') estadoChart?: ElementRef<HTMLCanvasElement>;
  @ViewChild('categoriaChart') categoriaChart?: ElementRef<HTMLCanvasElement>;
  @ViewChild('usoChart') usoChart?: ElementRef<HTMLCanvasElement>;
  @ViewChild('antiguedadChart') antiguedadChart?: ElementRef<HTMLCanvasElement>;
  @ViewChild('demandaChart') demandaChart?: ElementRef<HTMLCanvasElement>;

  // Subject para cleanup
  private destroy$ = new Subject<void>();
  currentFilter: ReportFilter | null = null;

  // Loading states
  loadingEstado = true;
  loadingCategorias = true;
  loadingTopUso = true;
  loadingAntiguedad = true;
  loadingSubutilizados = true;
  loadingDemanda = true;
  loadingTiposEquipo = true;

  // Error states
  errorEstado: string | null = null;
  errorCategorias: string | null = null;
  errorTopUso: string | null = null;
  errorAntiguedad: string | null = null;
  errorSubutilizados: string | null = null;
  errorDemanda: string | null = null;
  errorTiposEquipo: string | null = null;

  kpis = {
    total: 0,
    disponibles: 0,
    mantenimiento: 0,
    baja: 0
  };

  universidad = 'Universidad de Tarapacá';
  departamento = 'Departamento de Diseño Multimedia';
  reporteTitulo = 'Reporte de Inventario';
  rangoFechas = 'Últimos 12 meses';
  usuarioGenera = '—';
  fechaGeneracion = new Date();

  subutilizados: any[] = [];

  demandaDisponibilidad: any[] = [];
  saturacionMax = 0;
  periodosCriticos = 0;
  stockOperativo = 0;
  demandaMaxima = 0;
  demandaPromedio = 0;
  tipoEquipoNombre = 'Todos';

  tiposEquipos: any[] = [];
  tipoEquipoSeleccionado: number | null = null;

  private chartEstado?: Chart;
  private chartCategorias?: Chart;
  private chartUso?: Chart;
  private chartAntiguedad?: Chart;
  private chartDemanda?: Chart;

  constructor(
    private inventarioService: ReportesInventarioService,
    private exportService: ExportService,
    private filterService: ReportFiltersService
  ) {}

  ngOnInit(): void {
    this.cargarUsuario();

    this.cargarTiposEquipo();
    
    // Suscribirse a cambios del filtro centralizado
    this.filterService.filter$
      .pipe(takeUntil(this.destroy$))
      .subscribe((filter: ReportFilter) => {
        this.currentFilter = filter;
        this.cargarTodosLosDatos();
      });
  }

  cargarTodosLosDatos(): void {
    this.cargarEstado();
    this.cargarCategorias();
    this.cargarTopUso();
    this.cargarAntiguedad();
    this.cargarSubutilizados();
    this.cargarDemandaVsDisponibilidad();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
    this.chartEstado?.destroy();
    this.chartCategorias?.destroy();
    this.chartUso?.destroy();
    this.chartAntiguedad?.destroy();
    this.chartDemanda?.destroy();
  }

  cargarEstado(): void {
    if (!this.currentFilter) return;
    
    this.loadingEstado = true;
    this.errorEstado = null;
    
    this.inventarioService.getEstadoWithFilter(this.currentFilter).subscribe({
      next: (data) => {
        const labels = data.map((d: any) => d.estado);
        const valores = data.map((d: any) => d.total);

        this.kpis.total = valores.reduce((a: number, b: number) => a + b, 0);
        this.kpis.disponibles = data.find((d: any) => d.estado === 'DISPONIBLE')?.total ?? 0;
        this.kpis.mantenimiento = data.find((d: any) => d.estado === 'MANTENIMIENTO')?.total ?? 0;
        this.kpis.baja = data.find((d: any) => d.estado === 'BAJA')?.total ?? 0;

        const ctx = this.estadoChart?.nativeElement.getContext('2d');
        if (ctx) {
          this.chartEstado?.destroy();
          this.chartEstado = new Chart(ctx, {
            type: 'doughnut',
            data: {
              labels,
              datasets: [{
                data: valores,
                backgroundColor: ['#10b981', '#3b82f6', '#f59e0b', '#ef4444']
              }]
            },
            options: { responsive: true, maintainAspectRatio: false }
          });
        }
        this.loadingEstado = false;
      },
      error: (err) => {
        this.loadingEstado = false;
        this.errorEstado = 'Error al cargar estado del inventario';
        console.error('Error estado:', err);
      }
    });
  }

  cargarCategorias(): void {
    if (!this.currentFilter) return;
    
    this.loadingCategorias = true;
    this.errorCategorias = null;
    
    this.inventarioService.getCategoriasWithFilter(this.currentFilter).subscribe({
      next: (data) => {
        const labels = data.map((d: any) => d.categoria);
        const valores = data.map((d: any) => d.total);

        const ctx = this.categoriaChart?.nativeElement.getContext('2d');
        if (ctx) {
          this.chartCategorias?.destroy();
          this.chartCategorias = new Chart(ctx, {
            type: 'bar',
            data: {
              labels,
              datasets: [{ data: valores, backgroundColor: '#1f78ff' }]
            },
            options: { responsive: true, maintainAspectRatio: false }
          });
        }
        this.loadingCategorias = false;
      },
      error: (err) => {
        this.loadingCategorias = false;
        this.errorCategorias = 'Error al cargar categorías';
        console.error('Error categorías:', err);
      }
    });
  }

  cargarTopUso(): void {
    if (!this.currentFilter) return;
    
    this.loadingTopUso = true;
    this.errorTopUso = null;
    
    this.inventarioService.getTopUtilizadosWithFilter(this.currentFilter).subscribe({
      next: (data) => {
        const labels = data.map((d: any) => d.equipo);
        const valores = data.map((d: any) => d.total);

        const ctx = this.usoChart?.nativeElement.getContext('2d');
        if (ctx) {
          this.chartUso?.destroy();
          this.chartUso = new Chart(ctx, {
            type: 'bar',
            data: {
              labels,
              datasets: [{ data: valores, backgroundColor: '#6366f1' }]
            },
            options: { responsive: true, maintainAspectRatio: false }
          });
        }
        this.loadingTopUso = false;
      },
      error: (err) => {
        this.loadingTopUso = false;
        this.errorTopUso = 'Error al cargar top utilizados';
        console.error('Error top uso:', err);
      }
    });
  }

  cargarAntiguedad(): void {
    if (!this.currentFilter) return;
    
    this.loadingAntiguedad = true;
    this.errorAntiguedad = null;
    
    this.inventarioService.getAntiguedadWithFilter(this.currentFilter).subscribe({
      next: (data) => {
        const labels = data.map((d: any) => d.rango);
        const valores = data.map((d: any) => d.total);

        const ctx = this.antiguedadChart?.nativeElement.getContext('2d');
        if (ctx) {
          this.chartAntiguedad?.destroy();
          this.chartAntiguedad = new Chart(ctx, {
            type: 'bar',
            data: {
              labels,
              datasets: [{ data: valores, backgroundColor: '#0ea5e9' }]
            },
            options: { responsive: true, maintainAspectRatio: false }
          });
        }
        this.loadingAntiguedad = false;
      },
      error: (err) => {
        this.loadingAntiguedad = false;
        this.errorAntiguedad = 'Error al cargar antigüedad';
        console.error('Error antigüedad:', err);
      }
    });
  }

  cargarSubutilizados(): void {
    if (!this.currentFilter) return;
    
    this.loadingSubutilizados = true;
    this.errorSubutilizados = null;
    
    this.inventarioService.getSubutilizadosWithFilter(this.currentFilter).subscribe({
      next: (data) => {
        this.subutilizados = data || [];
        this.loadingSubutilizados = false;
      },
      error: (err) => {
        this.subutilizados = [];
        this.loadingSubutilizados = false;
        this.errorSubutilizados = 'Error al cargar subutilizados';
        console.error('Error subutilizados:', err);
      }
    });
  }

  cargarDemandaVsDisponibilidad(): void {
    if (!this.currentFilter) return;

    this.loadingDemanda = true;
    this.errorDemanda = null;

    this.inventarioService.getDemandaVsDisponibilidadWithFilter(this.currentFilter, this.tipoEquipoSeleccionado ?? undefined).subscribe({
      next: (resp) => {
        const series = resp?.series ?? [];
        const meta = resp?.meta ?? {};
        
        this.demandaDisponibilidad = series;
        this.stockOperativo = meta.stockOperativo ?? 0;
        this.demandaMaxima = meta.demandaMaxima ?? 0;
        this.demandaPromedio = meta.demandaPromedio ?? 0;
        this.tipoEquipoNombre = meta.tipoEquipoNombre ?? 'Todos';

        const saturaciones = series.map((s: any) => s.saturacion ?? 0);
        this.saturacionMax = saturaciones.length ? Math.max(...saturaciones) : 0;
        this.periodosCriticos = series.filter((s: any) => s.demanda > s.stockOperativo).length;

        this.crearGraficoDemandaVsDisponibilidad();
        this.loadingDemanda = false;
      },
      error: (err) => {
        this.loadingDemanda = false;
        this.errorDemanda = 'Error al cargar demanda vs disponibilidad';
        console.error('Error demanda vs disponibilidad:', err);
      }
    });
  }

  cargarTiposEquipo(): void {
    this.loadingTiposEquipo = true;
    this.errorTiposEquipo = null;

    this.inventarioService.getTiposEquipoRelacionados().subscribe({
      next: (data) => {
        this.tiposEquipos = data || [];
        this.loadingTiposEquipo = false;
      },
      error: (err) => {
        this.loadingTiposEquipo = false;
        this.errorTiposEquipo = 'Error al cargar tipos de equipo';
        console.error('Error tipos equipo:', err);
      }
    });
  }

  onTipoEquipoChange(value: string): void {
    const id = value ? Number(value) : null;
    this.tipoEquipoSeleccionado = Number.isNaN(id) ? null : id;
    this.cargarDemandaVsDisponibilidad();
  }

  getRelacionadosLabel(): string {
    if (!this.tipoEquipoSeleccionado) return 'Todos los tipos incluidos';
    const tipo = this.tiposEquipos.find(t => t.id === this.tipoEquipoSeleccionado);
    const relacionados = tipo?.relacionados ?? [];
    if (!relacionados.length) return 'Sin relacionados definidos';
    return relacionados.map((r: any) => r.nombre).join(', ');
  }

  private crearGraficoDemandaVsDisponibilidad(): void {
    const ctx = this.demandaChart?.nativeElement.getContext('2d');
    if (!ctx) return;

    this.chartDemanda?.destroy();

    const labels = this.demandaDisponibilidad.map((d: any) => d.periodo);
    const demanda = this.demandaDisponibilidad.map((d: any) => d.demanda);
    
    // Línea horizontal fija del stock operativo
    const stockLine = this.demandaDisponibilidad.map(() => this.stockOperativo);
    
    // Colores: rojo si supera el stock, gris normal si no
    const coloresDemanda = this.demandaDisponibilidad.map((d: any) =>
      d.demanda > d.stockOperativo ? '#d93025' : '#4285f4'
    );

    this.chartDemanda = new Chart(ctx, {
      type: 'bar',
      data: {
        labels,
        datasets: [
          {
            type: 'bar',
            label: 'Equipos solicitados',
            data: demanda,
            backgroundColor: coloresDemanda,
            borderRadius: 4,
            maxBarThickness: 32,
            order: 2
          },
          {
            type: 'line',
            label: `Stock operativo (${this.stockOperativo} unidades)`,
            data: stockLine,
            borderColor: '#1e8e3e',
            backgroundColor: 'rgba(30, 142, 62, 0.1)',
            borderWidth: 2,
            borderDash: [6, 4],
            tension: 0,
            pointRadius: 0,
            pointHoverRadius: 0,
            fill: false,
            order: 1
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        interaction: { mode: 'index', intersect: false },
        plugins: {
          legend: { 
            position: 'bottom',
            labels: {
              usePointStyle: true,
              padding: 16
            }
          },
          tooltip: {
            backgroundColor: 'rgba(32, 33, 36, 0.95)',
            titleFont: { weight: 'bold' },
            padding: 12,
            callbacks: {
              label: (context) => {
                if (context.dataset.label?.includes('Stock')) {
                  return `Stock disponible: ${this.stockOperativo} unidades`;
                }
                return `Demanda: ${context.raw} equipos solicitados`;
              },
              afterBody: (items) => {
                if (!items?.length) return [];
                const idx = items[0].dataIndex;
                const dem = demanda[idx] ?? 0;
                const stock = this.stockOperativo;
                const diff = dem - stock;
                
                if (diff > 0) {
                  return [
                    '',
                    `⚠️ DÉFICIT: Faltan ${diff} equipos`,
                    `Saturación: ${stock > 0 ? Math.round((dem / stock) * 100) : 100}%`
                  ];
                } else if (diff < 0) {
                  return [
                    '',
                    `✓ Disponible: Sobran ${Math.abs(diff)} equipos`,
                    `Uso: ${stock > 0 ? Math.round((dem / stock) * 100) : 0}% del stock`
                  ];
                }
                return ['', `Stock justo: 100% de uso`];
              }
            }
          }
        },
        scales: {
          x: {
            grid: { display: false },
            ticks: { 
              maxRotation: 45,
              font: { size: 11 }
            }
          },
          y: {
            beginAtZero: true,
            grid: { color: 'rgba(0,0,0,0.06)' },
            title: {
              display: true,
              text: 'Cantidad de equipos',
              font: { size: 12, weight: 'bold' }
            }
          }
        }
      }
    });
  }

  private cargarUsuario(): void {
    try {
      const raw = sessionStorage.getItem('user');
      if (!raw) return;
      const u = JSON.parse(raw);
      this.usuarioGenera = u?.nombre || u?.email || '—';
    } catch {
      this.usuarioGenera = '—';
    }
  }

  exportarPDF(): void {
    const reporteData: ReporteData = {
      titulo: 'Reporte de Inventario',
      subtitulo: 'Estado general, uso y antigüedad del inventario',
      fechaGeneracion: new Date(),
      usuario: this.usuarioGenera,
      periodo: this.rangoFechas,
      secciones: [
        {
          tipo: 'kpis',
          titulo: 'Indicadores de Inventario',
          datos: [
            { label: 'Total equipos', valor: this.kpis.total },
            { label: 'Disponibles', valor: this.kpis.disponibles },
            { label: 'En mantenimiento', valor: this.kpis.mantenimiento },
            { label: 'Dados de baja', valor: this.kpis.baja }
          ]
        },
        {
          tipo: 'tabla',
          titulo: 'Equipos Subutilizados',
          subtitulo: 'Tipos con menor uso en el período',
          datos: {
            columnas: ['Equipo', 'Total Solicitudes'],
            filas: this.subutilizados.map(e => [e.equipo, e.total]),
            anchos: ['*', 120]
          }
        }
      ]
    };

    this.exportService.exportarPDFInstitucional(reporteData, 'Reporte_Inventario_UTA.pdf');
  }

  exportarExcel(): void {
    const sheets = [
      {
        name: 'KPIs',
        data: [
          { Indicador: 'Total equipos', Valor: this.kpis.total },
          { Indicador: 'Disponibles', Valor: this.kpis.disponibles },
          { Indicador: 'Mantenimiento', Valor: this.kpis.mantenimiento },
          { Indicador: 'Baja', Valor: this.kpis.baja }
        ]
      },
      {
        name: 'Subutilizados',
        data: this.subutilizados.map((d: any) => ({ Equipo: d.equipo, Solicitudes: d.total }))
      }
    ];

    this.exportService.exportarExcel(sheets, `Reporte_Inventario_UTA_${Date.now()}.xlsx`);
  }
}
