import { Component, OnInit, OnDestroy, ViewChild, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import Chart from 'chart.js/auto';
import { ExportButtonsComponent } from '../export-buttons/export-buttons.component';
import { ReportesInventarioService } from '../../../../services/reportes/reportes-inventario.service';
import { ExportService, ReporteData } from '../../../../services/export.service';

@Component({
  selector: 'app-reportes-inventario',
  standalone: true,
  imports: [CommonModule, ExportButtonsComponent],
  templateUrl: './reportes-inventario.component.html',
  styleUrls: ['./reportes-inventario.component.css']
})
export class ReportesInventarioComponent implements OnInit, OnDestroy {
  @ViewChild('estadoChart') estadoChart?: ElementRef<HTMLCanvasElement>;
  @ViewChild('categoriaChart') categoriaChart?: ElementRef<HTMLCanvasElement>;
  @ViewChild('usoChart') usoChart?: ElementRef<HTMLCanvasElement>;
  @ViewChild('antiguedadChart') antiguedadChart?: ElementRef<HTMLCanvasElement>;

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

  private chartEstado?: Chart;
  private chartCategorias?: Chart;
  private chartUso?: Chart;
  private chartAntiguedad?: Chart;

  constructor(
    private inventarioService: ReportesInventarioService,
    private exportService: ExportService
  ) {}
  fechaInicio: string = '';
  fechaFin: string = '';
  periodo: string = 'dias';

  ngOnInit(): void {
    this.cargarUsuario();
    this.cargarEstado();
    this.cargarCategorias();
    this.cargarTopUso();
    this.cargarAntiguedad();
    this.cargarSubutilizados();
  }

  filtrarPorFecha() {
    let rango = '';
    if (this.fechaInicio && this.fechaFin) {
      rango = `Del ${this.fechaInicio} al ${this.fechaFin}`;
    } else {
      rango = 'Sin filtro';
    }
    // Aquí deberías recargar los datos usando el filtro
    // Ejemplo: this.reportesService.getInventario(this.fechaInicio, this.fechaFin, this.periodo).subscribe(...)
    // Mostrar mensaje de filtro aplicado
    // this.mostrarMensaje('Filtro aplicado.');
  }

  ngOnDestroy(): void {
    this.chartEstado?.destroy();
    this.chartCategorias?.destroy();
    this.chartUso?.destroy();
    this.chartAntiguedad?.destroy();
  }

  private cargarEstado(): void {
    this.inventarioService.getEstado().subscribe((data) => {
      const labels = data.map((d: any) => d.estado);
      const valores = data.map((d: any) => d.total);

      this.kpis.total = valores.reduce((a: number, b: number) => a + b, 0);
      this.kpis.disponibles = data.find((d: any) => d.estado === 'DISPONIBLE')?.total ?? 0;
      this.kpis.mantenimiento = data.find((d: any) => d.estado === 'MANTENIMIENTO')?.total ?? 0;
      this.kpis.baja = data.find((d: any) => d.estado === 'BAJA')?.total ?? 0;

      const ctx = this.estadoChart?.nativeElement.getContext('2d');
      if (!ctx) return;

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
    });
  }

  private cargarCategorias(): void {
    this.inventarioService.getCategorias().subscribe((data) => {
      const labels = data.map((d: any) => d.categoria);
      const valores = data.map((d: any) => d.total);

      const ctx = this.categoriaChart?.nativeElement.getContext('2d');
      if (!ctx) return;

      this.chartCategorias?.destroy();
      this.chartCategorias = new Chart(ctx, {
        type: 'bar',
        data: {
          labels,
          datasets: [{ data: valores, backgroundColor: '#1f78ff' }]
        },
        options: { responsive: true, maintainAspectRatio: false }
      });
    });
  }

  private cargarTopUso(): void {
    this.inventarioService.getTopUtilizados().subscribe((data) => {
      const labels = data.map((d: any) => d.equipo);
      const valores = data.map((d: any) => d.total);

      const ctx = this.usoChart?.nativeElement.getContext('2d');
      if (!ctx) return;

      this.chartUso?.destroy();
      this.chartUso = new Chart(ctx, {
        type: 'bar',
        data: {
          labels,
          datasets: [{ data: valores, backgroundColor: '#6366f1' }]
        },
        options: { responsive: true, maintainAspectRatio: false }
      });
    });
  }

  private cargarAntiguedad(): void {
    this.inventarioService.getAntiguedad().subscribe((data) => {
      const labels = data.map((d: any) => d.rango);
      const valores = data.map((d: any) => d.total);

      const ctx = this.antiguedadChart?.nativeElement.getContext('2d');
      if (!ctx) return;

      this.chartAntiguedad?.destroy();
      this.chartAntiguedad = new Chart(ctx, {
        type: 'bar',
        data: {
          labels,
          datasets: [{ data: valores, backgroundColor: '#0ea5e9' }]
        },
        options: { responsive: true, maintainAspectRatio: false }
      });
    });
  }

  private cargarSubutilizados(): void {
    this.inventarioService.getSubutilizados().subscribe((data) => {
      this.subutilizados = data || [];
    });
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
