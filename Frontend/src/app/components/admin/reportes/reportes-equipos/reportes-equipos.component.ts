import { Component, OnInit, OnDestroy, inject } from '@angular/core';
import { Chart } from 'chart.js/auto';
import { ReportesService, FiltroReporte } from '../../../../services/reportes.service';
import { ReportFiltersService, ReportFilter } from '../../../../services/report-filters.service';
import { ReportFiltersComponent } from '../report-filters/report-filters.component';
import { CommonModule, DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ExportButtonsComponent } from '../export-buttons/export-buttons.component';
import { ExportService, ReporteData } from '../../../../services/export.service';
import { Subject, takeUntil } from 'rxjs';

/* ============================================================
   PLUGIN BARRAS REDONDEADAS CON SOMBRA
============================================================= */
Chart.register({
  id: 'roundedBars',
  beforeDraw(chart) {
    const ctx = chart.ctx;
    chart.data.datasets.forEach((dataset: any) => {
      const meta = chart.getDatasetMeta(0);
      meta.data.forEach((bar: any) => {
        const { x, y, base, width } = bar;

        ctx.save();
        ctx.fillStyle = dataset.backgroundColor;
        ctx.shadowColor = 'rgba(0,0,0,0.15)';
        ctx.shadowBlur = 8;
        ctx.shadowOffsetY = 4;

        ctx.beginPath();
        ctx.roundRect(x - width / 2, y, width, base - y, 12);
        ctx.fill();
        ctx.restore();
      });
    });
  }
});

/* ============================================================
   CONFIG GLOBAL CHART JS
============================================================= */
Chart.defaults.color = '#444';
Chart.defaults.font.family = "'Inter', sans-serif";
Chart.defaults.plugins.legend.display = false;

type PeriodoPreset = 'mes' | 'trimestre' | 'semestre' | 'anio' | 'personalizado';

interface FiltroGrafico {
  periodo: PeriodoPreset;
  fechaInicio: string;
  fechaFin: string;
}

@Component({
  selector: 'app-reportes-equipos',
  standalone: true,
  templateUrl: './reportes-equipos.component.html',
  styleUrls: ['./reportes-equipos.component.css'],
  imports: [CommonModule, DatePipe, ExportButtonsComponent, FormsModule, ReportFiltersComponent],
  providers: [DatePipe]
})
export class ReportesEquiposComponent implements OnInit, OnDestroy {
  // Nuevo: Subject para cleanup
  private destroy$ = new Subject<void>();
  private pendingLoads = 0;
  
  // Nuevo: Filtro centralizado actual
  currentFilter: ReportFilter | null = null;
  
  // Loading states por sección
  loadingEquipos = false;
  loadingUso = false;
  loadingSanciones = false;
  loadingBaja = false;
  loadingDisponibilidad = false;
  loadingCriticos = false;
  
  // Error states
  errorEquipos: string | null = null;
  errorUso: string | null = null;
  errorSanciones: string | null = null;

  // Modo de filtro: global o individual
  modoFiltro: 'global' | 'individual' = 'global';

  // Filtro global
  filtroGlobal: FiltroGrafico = {
    periodo: 'anio',
    fechaInicio: '',
    fechaFin: ''
  };

  // Filtros individuales por gráfico
  filtroUso: FiltroGrafico = { periodo: 'anio', fechaInicio: '', fechaFin: '' };
  filtroSanciones: FiltroGrafico = { periodo: 'anio', fechaInicio: '', fechaFin: '' };
  filtroDisponibilidad: FiltroGrafico = { periodo: 'anio', fechaInicio: '', fechaFin: '' };

  // Presets de período disponibles
  periodosDisponibles: { valor: PeriodoPreset; label: string }[] = [
    { valor: 'mes', label: 'Último Mes' },
    { valor: 'trimestre', label: 'Último Trimestre' },
    { valor: 'semestre', label: 'Último Semestre' },
    { valor: 'anio', label: 'Último Año' },
    { valor: 'personalizado', label: 'Personalizado' }
  ];

  tituloActual = 'Estadísticas de equipos';

  sanciones = 0;
  rechazos = 0;
  equiposBaja: any[] = [];
  disponibilidadEquipos: any[] = [];
  equiposCriticos: any[] = [];
  disponibilidadPage = 1;
  disponibilidadPageSize = 8;
  today = new Date();
  mensaje: string | null = null;
  universidad = 'Universidad de Tarapacá';
  departamento = 'Departamento de Diseño Multimedia';
  reporteTitulo = 'Reporte de Equipos';
  rangoFechas = 'Últimos 12 meses';
  usuarioGenera = '—';
  fechaGeneracion = new Date();

  // Legacy compatibility
  fechaInicio: string = '';
  fechaFin: string = '';
  periodo: string = 'dias';

  private datePipe = inject(DatePipe);

  private chartEquipos!: Chart;
  private chartUso!: Chart;
  private chartSanciones!: Chart;

  constructor(
    private reportesService: ReportesService,
    private exportService: ExportService,
    private filterService: ReportFiltersService
  ) {}

  ngOnInit(): void {
    this.inicializarFiltrosConFechasDefault();
    this.cargarUsuario();
    
    // Suscribirse al servicio de filtros centralizado
    this.filterService.filter$
      .pipe(takeUntil(this.destroy$))
      .subscribe(filter => {
        this.currentFilter = filter;
        if (this.modoFiltro === 'global') {
          this.cargarTodosLosDatos();
        }
      });

    // Suscribirse al modo
    this.filterService.mode$
      .pipe(takeUntil(this.destroy$))
      .subscribe(mode => {
        this.modoFiltro = mode;
      });
  }

  inicializarFiltrosConFechasDefault(): void {
    const hoy = new Date();
    const fechaFin = this.formatDate(hoy);
    const hace1Anio = new Date(hoy);
    hace1Anio.setFullYear(hace1Anio.getFullYear() - 1);
    const fechaInicio = this.formatDate(hace1Anio);

    this.filtroGlobal = { periodo: 'anio', fechaInicio, fechaFin };
    this.filtroUso = { ...this.filtroGlobal };
    this.filtroSanciones = { ...this.filtroGlobal };
    this.filtroDisponibilidad = { ...this.filtroGlobal };
  }

  private formatDate(date: Date): string {
    return date.toISOString().split('T')[0];
  }

  // Calcula las fechas según el período seleccionado
  calcularFechasPorPeriodo(filtro: FiltroGrafico): { inicio: string; fin: string } {
    const hoy = new Date();
    const fin = this.formatDate(hoy);
    let inicio: Date;

    switch (filtro.periodo) {
      case 'mes':
        inicio = new Date(hoy);
        inicio.setMonth(inicio.getMonth() - 1);
        break;
      case 'trimestre':
        inicio = new Date(hoy);
        inicio.setMonth(inicio.getMonth() - 3);
        break;
      case 'semestre':
        inicio = new Date(hoy);
        inicio.setMonth(inicio.getMonth() - 6);
        break;
      case 'anio':
        inicio = new Date(hoy);
        inicio.setFullYear(inicio.getFullYear() - 1);
        break;
      case 'personalizado':
        return { inicio: filtro.fechaInicio, fin: filtro.fechaFin };
      default:
        inicio = new Date(hoy);
        inicio.setFullYear(inicio.getFullYear() - 1);
    }

    return { inicio: this.formatDate(inicio), fin };
  }

  // Obtiene el filtro correcto según el modo
  getFiltroParaGrafico(tipo: 'uso' | 'sanciones' | 'disponibilidad'): FiltroReporte {
    const filtro = this.modoFiltro === 'global' ? this.filtroGlobal : 
      (tipo === 'uso' ? this.filtroUso : 
       tipo === 'sanciones' ? this.filtroSanciones : this.filtroDisponibilidad);
    
    const { inicio, fin } = this.calcularFechasPorPeriodo(filtro);
    return { fechaInicio: inicio, fechaFin: fin, periodo: filtro.periodo };
  }

  // Cambia el modo de filtro
  cambiarModoFiltro(modo: 'global' | 'individual'): void {
    this.modoFiltro = modo;
    if (modo === 'global') {
      this.cargarTodosLosDatos();
    }
  }

  // Aplica filtro global a todos los gráficos
  aplicarFiltroGlobal(): void {
    this.actualizarRangoFechas();
    this.cargarTodosLosDatos();
    this.mostrarMensaje('Filtro global aplicado');
  }

  // Aplica filtro individual a un gráfico específico
  aplicarFiltroIndividual(tipo: 'uso' | 'sanciones' | 'disponibilidad'): void {
    switch (tipo) {
      case 'uso':
        this.cargarUsoInternoExterno();
        break;
      case 'sanciones':
        this.cargarSancionesYRechazos();
        break;
      case 'disponibilidad':
        this.cargarDisponibilidad();
        break;
    }
    this.mostrarMensaje(`Filtro aplicado a ${tipo}`);
  }

  cargarTodosLosDatos(): void {
    this.filterService.setLoading(true);
    this.pendingLoads = 6;
    this.cargarEquiposMasSolicitados();
    this.cargarUsoInternoExterno();
    this.cargarSancionesYRechazos();
    this.cargarEquiposDadoDeBaja();
    this.cargarDisponibilidad();
    this.cargarEquiposCriticos();
    this.actualizarRangoFechas();
  }

  private onLoadComplete(): void {
    this.pendingLoads--;
    if (this.pendingLoads <= 0) {
      this.filterService.setLoading(false);
    }
  }

  actualizarRangoFechas(): void {
    const { inicio, fin } = this.calcularFechasPorPeriodo(this.filtroGlobal);
    this.rangoFechas = `Del ${this.datePipe.transform(inicio, 'dd/MM/yyyy')} al ${this.datePipe.transform(fin, 'dd/MM/yyyy')}`;
  }

  filtrarPorFecha() {
    // Legacy: sincroniza con el nuevo sistema
    this.filtroGlobal.fechaInicio = this.fechaInicio;
    this.filtroGlobal.fechaFin = this.fechaFin;
    this.filtroGlobal.periodo = 'personalizado';
    this.aplicarFiltroGlobal();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
    this.chartEquipos?.destroy();
    this.chartUso?.destroy();
    this.chartSanciones?.destroy();
  }

  /* ============================================================
     ANIMACIONES
  ============================================================= */
  private animationConfig: any = {
    duration: 1000,
    easing: 'easeOutQuart',
    delay: (ctx: any) => ctx.dataIndex * 120
  };

  mostrarMensaje(texto: string) {
    this.mensaje = texto;
    setTimeout(() => (this.mensaje = null), 3000);
  }

  /* ============================================================
     GRAFICO 1 – Equipos más solicitados
  ============================================================= */
  cargarEquiposMasSolicitados() {
    this.loadingEquipos = true;
    this.errorEquipos = null;
    
    // Usar filtro centralizado si está disponible
    const filtro = this.currentFilter 
      ? this.currentFilter
      : this.getFiltroParaGrafico('uso');
      
    const request$ = this.currentFilter
      ? this.reportesService.getEquiposMasSolicitadosWithFilter(filtro as any)
      : this.reportesService.getEquiposMasSolicitados(filtro);

    request$.subscribe({
      next: (data) => {
        this.loadingEquipos = false;
        const items = Array.isArray(data) ? data : (data?.data || []);
        const labels = items.map((x: any) => x.equipo);
        const valores = items.map((x: any) => x.total || x.total_solicitudes);

        this.chartEquipos?.destroy();

        const canvas = document.getElementById('graficoEquipos') as HTMLCanvasElement | null;
        const ctx = canvas?.getContext('2d');
        if (!ctx) return;

        const grad = ctx.createLinearGradient(0, 0, 0, 240);
        grad.addColorStop(0, '#3b82f6');
        grad.addColorStop(1, '#60a5fa');

        this.chartEquipos = new Chart(ctx, {
          type: 'bar',
          data: {
            labels,
            datasets: [{
              data: valores,
              backgroundColor: grad,
              borderRadius: 10,
              borderSkipped: false,
              barThickness: 22
            }]
          },
          options: {
            responsive: true,
            maintainAspectRatio: false,
            animation: { ...this.animationConfig, duration: 900 },
            scales: {
              x: { grid: { display: false } },
              y: { beginAtZero: true, grid: { color: 'rgba(15,23,42,0.06)' } }
            },
            plugins: { legend: { display: false } }
          }
        });
      },
      error: (err) => {
        this.loadingEquipos = false;
        this.errorEquipos = 'Error cargando equipos más solicitados';
        console.error(err);
        this.onLoadComplete();
      },
      complete: () => this.onLoadComplete()
    });
  }

  /* ============================================================
     GRAFICO 2 – Pie interno/externo
  ============================================================= */
  cargarUsoInternoExterno() {
    this.loadingUso = true;
    this.errorUso = null;
    
    const filtro = this.currentFilter 
      ? this.currentFilter
      : this.getFiltroParaGrafico('uso');
      
    const request$ = this.currentFilter
      ? this.reportesService.getUsoInternoExternoWithFilter(filtro as any)
      : this.reportesService.getUsoInternoExterno(filtro);

    request$.subscribe({
      next: (data) => {
        this.loadingUso = false;
        const items = Array.isArray(data) ? data : (data?.data || []);
        const labels = items.map((x: any) => x.tipo);
        const valores = items.map((x: any) => x.total);

        this.chartUso?.destroy();

        const canvas = document.getElementById('graficoUso') as HTMLCanvasElement | null;
        const ctx = canvas?.getContext('2d');
        if (!ctx) return;

        this.chartUso = new Chart(ctx, {
          type: 'pie',
          data: {
            labels,
            datasets: [{
              data: valores,
              backgroundColor: ['#3b82f6', '#ef4444', '#8b5cf6'],
              borderColor: '#ffffff',
              borderWidth: 2
            }]
          },
          options: {
            responsive: true,
            maintainAspectRatio: false,
            animation: { ...this.animationConfig, duration: 800 },
            plugins: {
              legend: {
                display: true,
                position: 'bottom',
                labels: { boxWidth: 12, usePointStyle: true }
              }
            }
          }
        });
      },
      error: (error) => {
        this.loadingUso = false;
        this.errorUso = 'Error cargando uso interno/externo';
        console.error('Error cargando uso interno/externo:', error);
        this.onLoadComplete();
      },
      complete: () => this.onLoadComplete()
    });
  }

  /* ============================================================
     GRAFICO 3 – Sanciones y Rechazos
  ============================================================= */
  cargarSancionesYRechazos() {
    this.loadingSanciones = true;
    this.errorSanciones = null;
    
    const filtro = this.currentFilter 
      ? this.currentFilter
      : this.getFiltroParaGrafico('sanciones');
      
    const request$ = this.currentFilter
      ? this.reportesService.getSancionesYRechazosWithFilter(filtro as any)
      : this.reportesService.getSancionesYRechazos(filtro);

    request$.subscribe({
      next: (data) => {
        this.loadingSanciones = false;
        const result = data?.data || data;
        this.sanciones = result.total_sanciones || 0;
        this.rechazos = result.total_rechazos || 0;

        this.chartSanciones?.destroy();

        const canvas = document.getElementById('graficoSanciones') as HTMLCanvasElement | null;
        const ctx = canvas?.getContext('2d');
        if (!ctx) return;

        this.chartSanciones = new Chart(ctx, {
          type: 'bar',
          data: {
            labels: ['Sanciones', 'Rechazos'],
            datasets: [{
              data: [this.sanciones, this.rechazos],
              backgroundColor: ['#ef4444', '#f59e0b'],
              borderRadius: 10,
              borderSkipped: false,
              barThickness: 26
            }]
          },
          options: {
            responsive: true,
            maintainAspectRatio: false,
            animation: { ...this.animationConfig, duration: 850 },
            scales: {
              x: { grid: { display: false } },
              y: { beginAtZero: true, grid: { color: 'rgba(15,23,42,0.06)' } }
            }
          }
        });
      },
      error: (error) => {
        this.loadingSanciones = false;
        this.errorSanciones = 'Error cargando sanciones y rechazos';
        console.error('Error cargando sanciones:', error);
        this.onLoadComplete();
      },
      complete: () => this.onLoadComplete()
    });
  }

  /* ============================================================
     TABLA – Equipos dados de baja
  ============================================================= */
  cargarEquiposDadoDeBaja() {
    this.loadingBaja = true;
    
    const filtro = this.currentFilter 
      ? this.currentFilter
      : this.getFiltroParaGrafico('disponibilidad');
      
    const request$ = this.currentFilter
      ? this.reportesService.getEquiposDadoDeBajaWithFilter(filtro as any)
      : this.reportesService.getEquiposDadoDeBaja(filtro);

    request$.subscribe({
      next: (data) => {
        this.loadingBaja = false;
        this.equiposBaja = Array.isArray(data) ? data : (data?.data || []);
      },
      error: (err) => {
        this.loadingBaja = false;
        console.error('Error cargando equipos de baja:', err);
        this.onLoadComplete();
      },
      complete: () => this.onLoadComplete()
    });
  }

  cargarDisponibilidad() {
    this.reportesService.getDisponibilidadEquipos().subscribe({
      next: (data) => {
        this.disponibilidadEquipos = data || [];
        const totalPages = this.disponibilidadTotalPages;
        if (this.disponibilidadPage > totalPages) {
          this.disponibilidadPage = totalPages;
        }
      },
      error: (err) => {
        console.error('Error cargando disponibilidad:', err);
        this.onLoadComplete();
      },
      complete: () => this.onLoadComplete()
    });
  }

  get disponibilidadTotalPages(): number {
    return Math.max(1, Math.ceil(this.disponibilidadEquipos.length / this.disponibilidadPageSize));
  }

  get disponibilidadPaginada(): any[] {
    const start = (this.disponibilidadPage - 1) * this.disponibilidadPageSize;
    return this.disponibilidadEquipos.slice(start, start + this.disponibilidadPageSize);
  }

  cambiarPaginaDisponibilidad(delta: number) {
    const next = this.disponibilidadPage + delta;
    if (next < 1 || next > this.disponibilidadTotalPages) return;
    this.disponibilidadPage = next;
  }

  cargarEquiposCriticos() {
    this.reportesService.getEquiposCriticos().subscribe({
      next: (data) => {
        this.equiposCriticos = data || [];
      },
      error: (err) => {
        console.error('Error cargando equipos críticos:', err);
        this.onLoadComplete();
      },
      complete: () => this.onLoadComplete()
    });
  }

  /* ============================================================
     EXPORTAR EXCEL (USANDO SERVICIO)
  ============================================================= */
  exportExcel() {
    const sheets = [
      {
        name: 'Equipos_Solicitados',
        data: this.chartEquipos?.data?.labels?.map((label: any, i: number) => ({
          Equipo: label,
          Solicitudes: (this.chartEquipos.data.datasets[0].data as number[])[i]
        })) || []
      },
      {
        name: 'Uso_Interno_vs_Externo',
        data: this.chartUso?.data?.labels?.map((label: any, i: number) => ({
          Tipo: label,
          Total: (this.chartUso.data.datasets[0].data as number[])[i]
        })) || []
      },
      {
        name: 'Sanciones_Rechazos',
        data: [
          { Tipo: 'Sanciones', Total: this.sanciones },
          { Tipo: 'Rechazos', Total: this.rechazos }
        ]
      },
      {
        name: 'Equipos_Baja',
        data: this.equiposBaja.map((x) => ({
          ID: x.id,
          Código: x.codigo,
          Tipo: x.tipo,
          Estado: x.estado,
          Fecha: this.datePipe.transform(x.created_at, 'dd/MM/yyyy')
        }))
      }
    ];

    this.exportService.exportarExcel(sheets, 'Reporte_Equipos.xlsx');
    this.mostrarMensaje('Excel exportado correctamente.');
  }

  /* ============================================================
     EXPORTAR PDF (USANDO SERVICIO)
  ============================================================= */
  exportarPDF() {
    const reporteData: ReporteData = {
      titulo: 'Reporte de Equipos',
      subtitulo: 'Estadísticas del Sistema de Préstamos de Equipos',
      fechaGeneracion: new Date(),
      usuario: this.usuarioGenera,
      periodo: this.rangoFechas,
      secciones: [
        {
          tipo: 'kpis',
          titulo: 'Indicadores Disciplinarios',
          datos: [
            { label: 'Sanciones', valor: this.sanciones },
            { label: 'Rechazos', valor: this.rechazos }
          ]
        },
        {
          tipo: 'tabla',
          titulo: 'Disponibilidad de Equipos',
          subtitulo: 'Estado actual por equipo',
          datos: {
            columnas: ['Código', 'Tipo', 'Estado', 'Ubicación', 'Último Evento'],
            filas: this.disponibilidadEquipos.map(d => [
              d.codigo,
              d.tipo,
              d.estado,
              d.ubicacion,
              this.datePipe.transform(d.ultimo_evento, 'dd/MM HH:mm') || '—'
            ]),
            anchos: [80, '*', 80, '*', 90]
          }
        },
        {
          tipo: 'tabla',
          titulo: 'Equipos Críticos / Bloqueados',
          subtitulo: 'Equipos que requieren atención operativa',
          datos: {
            columnas: ['Código', 'Tipo', 'Estado', 'Observación'],
            filas: this.equiposCriticos.map(c => [
              c.codigo,
              c.tipo,
              c.estado,
              c.observacion || 'Sin detalle'
            ]),
            anchos: [80, '*', 100, '*']
          }
        }
      ]
    };

    this.exportService.exportarPDFInstitucional(reporteData, 'Reporte_Equipos_UTA.pdf')
      .then(() => this.mostrarMensaje('PDF generado correctamente.'))
      .catch(() => this.mostrarMensaje('Ocurrió un error al generar el PDF.'));
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
}
