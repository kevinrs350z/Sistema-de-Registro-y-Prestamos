import { Component, OnInit, OnDestroy, ViewChild, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Subject, takeUntil } from 'rxjs';
import Chart from 'chart.js/auto';
import { ExportButtonsComponent } from '../export-buttons/export-buttons.component';
import { ReportesSancionesService } from '../../../../services/reportes/reportes-sanciones.service';
import { ExportService, ReporteData } from '../../../../services/export.service';
import { ReportFiltersComponent } from '../report-filters/report-filters.component';
import { ReportFiltersService, ReportFilter } from '../../../../services/report-filters.service';

@Component({
  selector: 'app-reportes-sanciones',
  standalone: true,
  imports: [CommonModule, ExportButtonsComponent, ReportFiltersComponent],
  templateUrl: './reportes-sanciones.component.html',
  styleUrls: ['./reportes-sanciones.component.css']
})
export class ReportesSancionesComponent implements OnInit, OnDestroy {
  @ViewChild('motivosChart') motivosChart?: ElementRef<HTMLCanvasElement>;
  @ViewChild('reincidenciaChart') reincidenciaChart?: ElementRef<HTMLCanvasElement>;

  // Subject para cleanup
  private destroy$ = new Subject<void>();
  currentFilter: ReportFilter | null = null;

  // Loading states
  loadingKpis = true;
  loadingMotivos = true;
  loadingReincidencia = true;
  loadingBloqueos = true;
  loadingRelacionAtrasos = true;

  // Error states
  errorKpis: string | null = null;
  errorMotivos: string | null = null;
  errorReincidencia: string | null = null;
  errorBloqueos: string | null = null;
  errorRelacionAtrasos: string | null = null;

  kpis = {
    sancionesActivas: 0,
    sancionesTotal: 0,
    bloqueosActivos: 0,
    bloqueosHistoricos: 0
  };

  universidad = 'Universidad de Tarapacá';
  departamento = 'Departamento de Diseño Multimedia';
  reporteTitulo = 'Reporte de Sanciones y Bloqueos';
  rangoFechas = 'Últimos 12 meses';
  usuarioGenera = '—';
  fechaGeneracion = new Date();

  bloqueos: any[] = [];
  relacionAtrasos: any[] = [];

  private chartMotivos?: Chart;
  private chartReincidencia?: Chart;

  constructor(
    private sancionesService: ReportesSancionesService,
    private exportService: ExportService,
    private filterService: ReportFiltersService
  ) {}

  ngOnInit(): void {
    this.cargarUsuario();
    
    // Suscribirse a cambios del filtro centralizado
    this.filterService.filter$
      .pipe(takeUntil(this.destroy$))
      .subscribe((filter: ReportFilter) => {
        this.currentFilter = filter;
        this.cargarTodosLosDatos();
      });
  }

  cargarTodosLosDatos(): void {
    this.cargarKPIs();
    this.cargarMotivos();
    this.cargarReincidencia();
    this.cargarBloqueos();
    this.cargarRelacionAtrasos();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
    this.chartMotivos?.destroy();
    this.chartReincidencia?.destroy();
  }

  cargarKPIs(): void {
    if (!this.currentFilter) return;
    
    this.loadingKpis = true;
    this.errorKpis = null;
    
    this.sancionesService.getKpisWithFilter(this.currentFilter).subscribe({
      next: (data) => {
        this.kpis = data;
        this.loadingKpis = false;
      },
      error: (err) => {
        this.loadingKpis = false;
        this.errorKpis = 'Error al cargar KPIs';
        console.error('Error KPIs:', err);
      }
    });
  }

  cargarMotivos(): void {
    if (!this.currentFilter) return;
    
    this.loadingMotivos = true;
    this.errorMotivos = null;
    
    this.sancionesService.getMotivosWithFilter(this.currentFilter).subscribe({
      next: (data) => {
        const labels = data.map((d: any) => d.motivo);
        const valores = data.map((d: any) => d.total);

        const ctx = this.motivosChart?.nativeElement.getContext('2d');
        if (ctx) {
          this.chartMotivos?.destroy();
          this.chartMotivos = new Chart(ctx, {
            type: 'bar',
            data: { labels, datasets: [{ data: valores, backgroundColor: '#ef4444' }] },
            options: { responsive: true, maintainAspectRatio: false }
          });
        }
        this.loadingMotivos = false;
      },
      error: (err) => {
        this.loadingMotivos = false;
        this.errorMotivos = 'Error al cargar motivos';
        console.error('Error motivos:', err);
      }
    });
  }

  cargarReincidencia(): void {
    if (!this.currentFilter) return;
    
    this.loadingReincidencia = true;
    this.errorReincidencia = null;
    
    this.sancionesService.getReincidenciaWithFilter(this.currentFilter).subscribe({
      next: (data) => {
        const labels = data.map((d: any) => d.usuario);
        const valores = data.map((d: any) => d.total);

        const ctx = this.reincidenciaChart?.nativeElement.getContext('2d');
        if (ctx) {
          this.chartReincidencia?.destroy();
          this.chartReincidencia = new Chart(ctx, {
            type: 'bar',
            data: { labels, datasets: [{ data: valores, backgroundColor: '#f59e0b' }] },
            options: { responsive: true, maintainAspectRatio: false }
          });
        }
        this.loadingReincidencia = false;
      },
      error: (err) => {
        this.loadingReincidencia = false;
        this.errorReincidencia = 'Error al cargar reincidencia';
        console.error('Error reincidencia:', err);
      }
    });
  }

  cargarBloqueos(): void {
    if (!this.currentFilter) return;
    
    this.loadingBloqueos = true;
    this.errorBloqueos = null;
    
    this.sancionesService.getBloqueosWithFilter(this.currentFilter).subscribe({
      next: (data) => {
        this.bloqueos = data || [];
        this.loadingBloqueos = false;
      },
      error: (err) => {
        this.bloqueos = [];
        this.loadingBloqueos = false;
        this.errorBloqueos = 'Error al cargar bloqueos';
        console.error('Error bloqueos:', err);
      }
    });
  }

  cargarRelacionAtrasos(): void {
    if (!this.currentFilter) return;
    
    this.loadingRelacionAtrasos = true;
    this.errorRelacionAtrasos = null;
    
    this.sancionesService.getRelacionAtrasosWithFilter(this.currentFilter).subscribe({
      next: (data) => {
        this.relacionAtrasos = data || [];
        this.loadingRelacionAtrasos = false;
      },
      error: (err) => {
        this.relacionAtrasos = [];
        this.loadingRelacionAtrasos = false;
        this.errorRelacionAtrasos = 'Error al cargar relación atrasos';
        console.error('Error relación atrasos:', err);
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
      titulo: 'Reporte de Sanciones y Bloqueos',
      subtitulo: 'Indicadores disciplinarios y reincidencia',
      fechaGeneracion: new Date(),
      usuario: this.usuarioGenera,
      periodo: this.rangoFechas,
      secciones: [
        {
          tipo: 'kpis',
          titulo: 'Indicadores Disciplinarios',
          datos: [
            { label: 'Sanciones activas', valor: this.kpis.sancionesActivas },
            { label: 'Total sanciones', valor: this.kpis.sancionesTotal },
            { label: 'Bloqueos activos', valor: this.kpis.bloqueosActivos },
            { label: 'Bloqueos históricos', valor: this.kpis.bloqueosHistoricos }
          ]
        },
        {
          tipo: 'tabla',
          titulo: 'Bloqueos Activos',
          subtitulo: 'Usuarios bloqueados actualmente',
          datos: {
            columnas: ['Usuario', 'Email', 'Motivo', 'Fecha', 'Bloqueado por'],
            filas: this.bloqueos.map(b => [
              b.usuario,
              b.email,
              b.bloqueado_motivo || '—',
              b.bloqueado_fecha || '—',
              b.bloqueado_por || '—'
            ]),
            anchos: ['*', '*', '*', 80, '*']
          }
        },
        {
          tipo: 'tabla',
          titulo: 'Relación Sanciones / Atrasos',
          subtitulo: 'Comparación de incidentes disciplinarios',
          datos: {
            columnas: ['Usuario', 'Email', 'Sanciones', 'Atrasos'],
            filas: this.relacionAtrasos.map(r => [r.usuario, r.email, r.sanciones, r.atrasos]),
            anchos: ['*', '*', 80, 80]
          }
        }
      ]
    };

    this.exportService.exportarPDFInstitucional(reporteData, 'Reporte_Sanciones_UTA.pdf');
  }

  exportarExcel(): void {
    const sheets = [
      {
        name: 'KPIs',
        data: [
          { Indicador: 'Sanciones activas', Valor: this.kpis.sancionesActivas },
          { Indicador: 'Total sanciones', Valor: this.kpis.sancionesTotal },
          { Indicador: 'Bloqueos activos', Valor: this.kpis.bloqueosActivos },
          { Indicador: 'Bloqueos históricos', Valor: this.kpis.bloqueosHistoricos }
        ]
      },
      {
        name: 'Bloqueos',
        data: this.bloqueos.map((b: any) => ({
          Usuario: b.usuario,
          Email: b.email,
          Motivo: b.bloqueado_motivo,
          Fecha: b.bloqueado_fecha,
          BloqueadoPor: b.bloqueado_por
        }))
      },
      {
        name: 'Relacion_Atrasos',
        data: this.relacionAtrasos.map((r: any) => ({
          Usuario: r.usuario,
          Email: r.email,
          Sanciones: r.sanciones,
          Atrasos: r.atrasos
        }))
      }
    ];

    this.exportService.exportarExcel(sheets, `Reporte_Sanciones_UTA_${Date.now()}.xlsx`);
  }
}
