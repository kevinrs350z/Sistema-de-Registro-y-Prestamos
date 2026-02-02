import { Component, OnInit, OnDestroy, ViewChild, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import Chart from 'chart.js/auto';
import { ExportButtonsComponent } from '../export-buttons/export-buttons.component';
import { ReportesSancionesService } from '../../../../services/reportes/reportes-sanciones.service';
import { ExportService, ReporteData } from '../../../../services/export.service';

@Component({
  selector: 'app-reportes-sanciones',
  standalone: true,
  imports: [CommonModule, ExportButtonsComponent],
  templateUrl: './reportes-sanciones.component.html',
  styleUrls: ['./reportes-sanciones.component.css']
})
export class ReportesSancionesComponent implements OnInit, OnDestroy {
  @ViewChild('motivosChart') motivosChart?: ElementRef<HTMLCanvasElement>;
  @ViewChild('reincidenciaChart') reincidenciaChart?: ElementRef<HTMLCanvasElement>;

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
    private exportService: ExportService
  ) {}
  fechaInicio: string = '';
  fechaFin: string = '';
  periodo: string = 'dias';

  ngOnInit(): void {
    this.cargarUsuario();
    this.cargarKPIs();
    this.cargarMotivos();
    this.cargarReincidencia();
    this.cargarBloqueos();
    this.cargarRelacionAtrasos();
  }

  filtrarPorFecha() {
    let rango = '';
    if (this.fechaInicio && this.fechaFin) {
      rango = `Del ${this.fechaInicio} al ${this.fechaFin}`;
    } else {
      rango = 'Sin filtro';
    }
    // Aquí deberías recargar los datos usando el filtro
    // Ejemplo: this.reportesService.getSanciones(this.fechaInicio, this.fechaFin, this.periodo).subscribe(...)
    // Mostrar mensaje de filtro aplicado
    // this.mostrarMensaje('Filtro aplicado.');
  }

  ngOnDestroy(): void {
    this.chartMotivos?.destroy();
    this.chartReincidencia?.destroy();
  }

  private cargarKPIs(): void {
    this.sancionesService.getKpis().subscribe((data) => {
      this.kpis = data;
    });
  }

  private cargarMotivos(): void {
    this.sancionesService.getMotivos().subscribe((data) => {
      const labels = data.map((d: any) => d.motivo);
      const valores = data.map((d: any) => d.total);

      const ctx = this.motivosChart?.nativeElement.getContext('2d');
      if (!ctx) return;

      this.chartMotivos?.destroy();
      this.chartMotivos = new Chart(ctx, {
        type: 'bar',
        data: { labels, datasets: [{ data: valores, backgroundColor: '#ef4444' }] },
        options: { responsive: true, maintainAspectRatio: false }
      });
    });
  }

  private cargarReincidencia(): void {
    this.sancionesService.getReincidencia().subscribe((data) => {
      const labels = data.map((d: any) => d.usuario);
      const valores = data.map((d: any) => d.total);

      const ctx = this.reincidenciaChart?.nativeElement.getContext('2d');
      if (!ctx) return;

      this.chartReincidencia?.destroy();
      this.chartReincidencia = new Chart(ctx, {
        type: 'bar',
        data: { labels, datasets: [{ data: valores, backgroundColor: '#f59e0b' }] },
        options: { responsive: true, maintainAspectRatio: false }
      });
    });
  }

  private cargarBloqueos(): void {
    this.sancionesService.getBloqueos().subscribe((data) => {
      this.bloqueos = data || [];
    });
  }

  private cargarRelacionAtrasos(): void {
    this.sancionesService.getRelacionAtrasos().subscribe((data) => {
      this.relacionAtrasos = data || [];
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
