import { Component, OnInit, OnDestroy, ViewChild, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Subject, takeUntil } from 'rxjs';
import Chart from 'chart.js/auto';
import { ExportButtonsComponent } from '../export-buttons/export-buttons.component';
import { ReportesTendenciasService } from '../../../../services/reportes/reportes-tendencias.service';
import { ExportService, ReporteData } from '../../../../services/export.service';
import { ReportFiltersComponent } from '../report-filters/report-filters.component';
import { ReportFiltersService, ReportFilter } from '../../../../services/report-filters.service';

@Component({
  selector: 'app-reportes-tendencias',
  standalone: true,
  imports: [CommonModule, ExportButtonsComponent, ReportFiltersComponent],
  templateUrl: './reportes-tendencias.component.html',
  styleUrls: ['./reportes-tendencias.component.css']
})
export class ReportesTendenciasComponent implements OnInit, OnDestroy {
  @ViewChild('prestamosChart') prestamosChart?: ElementRef<HTMLCanvasElement>;
  @ViewChild('categoriasChart') categoriasChart?: ElementRef<HTMLCanvasElement>;
  @ViewChild('usuariosChart') usuariosChart?: ElementRef<HTMLCanvasElement>;

  // Subject para cleanup
  private destroy$ = new Subject<void>();
  currentFilter: ReportFilter | null = null;

  // Loading states
  loadingPrestamosMes = true;
  loadingCategorias = true;
  loadingUsoTipoUsuario = true;

  // Error states
  errorPrestamosMes: string | null = null;
  errorCategorias: string | null = null;
  errorUsoTipoUsuario: string | null = null;

  private chartPrestamos?: Chart;
  private chartCategorias?: Chart;
  private chartUsuarios?: Chart;

  prestamosMes: any[] = [];
  categorias: any[] = [];
  usoTipoUsuario: any[] = [];

  universidad = 'Universidad de Tarapacá';
  departamento = 'Departamento de Diseño Multimedia';
  reporteTitulo = 'Reporte de Tendencias';
  rangoFechas = 'Últimos 12 meses';
  usuarioGenera = '—';
  fechaGeneracion = new Date();

  constructor(
    private tendenciasService: ReportesTendenciasService,
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
    this.cargarPrestamosMes();
    this.cargarCategorias();
    this.cargarUsoTipoUsuario();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
    this.chartPrestamos?.destroy();
    this.chartCategorias?.destroy();
    this.chartUsuarios?.destroy();
  }

  cargarPrestamosMes(): void {
    if (!this.currentFilter) return;
    
    this.loadingPrestamosMes = true;
    this.errorPrestamosMes = null;
    
    this.tendenciasService.getPrestamosMesWithFilter(this.currentFilter).subscribe({
      next: (data) => {
        this.prestamosMes = data || [];
        const labels = data.map((d: any) => d.mes ?? d.fecha ?? d.semana ?? d.trimestre ?? d.semestre ?? d['año'] ?? d.label ?? '');
        const valores = data.map((d: any) => Number(d.total ?? 0));

        const ctx = this.prestamosChart?.nativeElement.getContext('2d');
        if (ctx) {
          this.chartPrestamos?.destroy();
          this.chartPrestamos = new Chart(ctx, {
            type: 'line',
            data: { labels, datasets: [{ data: valores, borderColor: '#1f78ff', backgroundColor: 'rgba(31,120,255,0.2)', fill: true }] },
            options: { responsive: true, maintainAspectRatio: false }
          });
        }
        this.loadingPrestamosMes = false;
      },
      error: (err) => {
        this.prestamosMes = [];
        this.loadingPrestamosMes = false;
        this.errorPrestamosMes = 'Error al cargar préstamos por mes';
        console.error('Error préstamos mes:', err);
      }
    });
  }

  cargarCategorias(): void {
    if (!this.currentFilter) return;
    
    this.loadingCategorias = true;
    this.errorCategorias = null;
    
    this.tendenciasService.getCategoriasWithFilter(this.currentFilter).subscribe({
      next: (data) => {
        this.categorias = data || [];
        const labels = data.map((d: any) => d.categoria);
        const valores = data.map((d: any) => d.total);

        const ctx = this.categoriasChart?.nativeElement.getContext('2d');
        if (ctx) {
          this.chartCategorias?.destroy();
          this.chartCategorias = new Chart(ctx, {
            type: 'bar',
            data: { labels, datasets: [{ data: valores, backgroundColor: '#10b981' }] },
            options: { responsive: true, maintainAspectRatio: false }
          });
        }
        this.loadingCategorias = false;
      },
      error: (err) => {
        this.categorias = [];
        this.loadingCategorias = false;
        this.errorCategorias = 'Error al cargar categorías';
        console.error('Error categorías:', err);
      }
    });
  }

  cargarUsoTipoUsuario(): void {
    if (!this.currentFilter) return;
    
    this.loadingUsoTipoUsuario = true;
    this.errorUsoTipoUsuario = null;
    
    this.tendenciasService.getUsoTipoUsuarioWithFilter(this.currentFilter).subscribe({
      next: (data) => {
        this.usoTipoUsuario = data || [];
        const labels = data.map((d: any) => d.rol ?? d.tipo ?? 'Sin rol');
        const valores = data.map((d: any) => Number(d.total ?? 0));

        const ctx = this.usuariosChart?.nativeElement.getContext('2d');
        if (ctx) {
          this.chartUsuarios?.destroy();
          this.chartUsuarios = new Chart(ctx, {
            type: 'bar',
            data: { labels, datasets: [{ data: valores, backgroundColor: '#f59e0b' }] },
            options: { responsive: true, maintainAspectRatio: false }
          });
        }
        this.loadingUsoTipoUsuario = false;
      },
      error: (err) => {
        this.usoTipoUsuario = [];
        this.loadingUsoTipoUsuario = false;
        this.errorUsoTipoUsuario = 'Error al cargar uso por tipo de usuario';
        console.error('Error uso tipo usuario:', err);
      }
    });
  }

  exportarPDF(): void {
    const reporteData: ReporteData = {
      titulo: 'Reporte de Tendencias',
      subtitulo: 'Evolución temporal y demanda por categorías',
      fechaGeneracion: new Date(),
      usuario: this.usuarioGenera,
      periodo: this.rangoFechas,
      secciones: [
        {
          tipo: 'tabla',
          titulo: 'Préstamos por Mes',
          subtitulo: 'Comportamiento histórico de la demanda',
          datos: {
            columnas: ['Período', 'Total Préstamos'],
            filas: this.prestamosMes.map(d => [d.mes ?? d.fecha ?? d.label ?? '', d.total]),
            anchos: ['*', 120]
          }
        },
        {
          tipo: 'tabla',
          titulo: 'Categorías más Demandadas',
          subtitulo: 'Uso acumulado por categoría',
          datos: {
            columnas: ['Categoría', 'Total Solicitudes'],
            filas: this.categorias.map(d => [d.categoria, d.total]),
            anchos: ['*', 120]
          }
        },
        {
          tipo: 'tabla',
          titulo: 'Uso por Tipo de Usuario',
          subtitulo: 'Distribución por rol',
          datos: {
            columnas: ['Rol', 'Total Préstamos'],
            filas: this.usoTipoUsuario.map(d => [d.rol, d.total]),
            anchos: ['*', 120]
          }
        }
      ]
    };

    this.exportService.exportarPDFInstitucional(reporteData, 'Reporte_Tendencias_UTA.pdf');
  }

  exportarExcel(): void {
    const sheets = [
      {
        name: 'Prestamos_Mes',
        data: this.prestamosMes.map((p: any) => ({ Mes: p.mes, Total: p.total }))
      },
      {
        name: 'Categorias',
        data: this.categorias.map((c: any) => ({ Categoria: c.categoria, Total: c.total }))
      },
      {
        name: 'Uso_Tipo_Usuario',
        data: this.usoTipoUsuario.map((u: any) => ({ Rol: u.rol, Total: u.total }))
      }
    ];

    this.exportService.exportarExcel(sheets, `Reporte_Tendencias_UTA_${Date.now()}.xlsx`);
  }

  private cargarUsuario(): void {
    try {
      const raw = localStorage.getItem('user');
      if (!raw) return;
      const u = JSON.parse(raw);
      this.usuarioGenera = u?.nombre || u?.email || '—';
    } catch {
      this.usuarioGenera = '—';
    }
  }
}
