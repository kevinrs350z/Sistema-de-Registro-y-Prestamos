import { Component, OnInit, OnDestroy, ViewChild, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import Chart from 'chart.js/auto';
import { ExportButtonsComponent } from '../export-buttons/export-buttons.component';
import { ReportesTendenciasService } from '../../../../services/reportes/reportes-tendencias.service';
import { ExportService, ReporteData } from '../../../../services/export.service';

@Component({
  selector: 'app-reportes-tendencias',
  standalone: true,
  imports: [CommonModule, ExportButtonsComponent],
  templateUrl: './reportes-tendencias.component.html',
  styleUrls: ['./reportes-tendencias.component.css']
})
export class ReportesTendenciasComponent implements OnInit, OnDestroy {
  @ViewChild('prestamosChart') prestamosChart?: ElementRef<HTMLCanvasElement>;
  @ViewChild('categoriasChart') categoriasChart?: ElementRef<HTMLCanvasElement>;
  @ViewChild('usuariosChart') usuariosChart?: ElementRef<HTMLCanvasElement>;

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
    private exportService: ExportService
  ) {}

  ngOnInit(): void {
    this.cargarUsuario();
    this.cargarPrestamosMes();
    this.cargarCategorias();
    this.cargarUsoTipoUsuario();
  }

  ngOnDestroy(): void {
    this.chartPrestamos?.destroy();
    this.chartCategorias?.destroy();
    this.chartUsuarios?.destroy();
  }

  private cargarPrestamosMes(): void {
    this.tendenciasService.getPrestamosMes().subscribe((data) => {
      this.prestamosMes = data || [];
      const labels = data.map((d: any) => d.mes);
      const valores = data.map((d: any) => d.total);

      const ctx = this.prestamosChart?.nativeElement.getContext('2d');
      if (!ctx) return;

      this.chartPrestamos?.destroy();
      this.chartPrestamos = new Chart(ctx, {
        type: 'line',
        data: { labels, datasets: [{ data: valores, borderColor: '#1f78ff', backgroundColor: 'rgba(31,120,255,0.2)', fill: true }] },
        options: { responsive: true, maintainAspectRatio: false }
      });
    });
  }

  private cargarCategorias(): void {
    this.tendenciasService.getCategorias().subscribe((data) => {
      this.categorias = data || [];
      const labels = data.map((d: any) => d.categoria);
      const valores = data.map((d: any) => d.total);

      const ctx = this.categoriasChart?.nativeElement.getContext('2d');
      if (!ctx) return;

      this.chartCategorias?.destroy();
      this.chartCategorias = new Chart(ctx, {
        type: 'bar',
        data: { labels, datasets: [{ data: valores, backgroundColor: '#10b981' }] },
        options: { responsive: true, maintainAspectRatio: false }
      });
    });
  }

  private cargarUsoTipoUsuario(): void {
    this.tendenciasService.getUsoTipoUsuario().subscribe((data) => {
      this.usoTipoUsuario = data || [];
      const labels = data.map((d: any) => d.rol);
      const valores = data.map((d: any) => d.total);

      const ctx = this.usuariosChart?.nativeElement.getContext('2d');
      if (!ctx) return;

      this.chartUsuarios?.destroy();
      this.chartUsuarios = new Chart(ctx, {
        type: 'bar',
        data: { labels, datasets: [{ data: valores, backgroundColor: '#f59e0b' }] },
        options: { responsive: true, maintainAspectRatio: false }
      });
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
            columnas: ['Mes', 'Total Préstamos'],
            filas: this.prestamosMes.map(d => [d.mes, d.total]),
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
