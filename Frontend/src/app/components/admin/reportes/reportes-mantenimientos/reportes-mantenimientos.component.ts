import { Component, OnInit, OnDestroy, ViewChild, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import Chart from 'chart.js/auto';
import { ExportButtonsComponent } from '../export-buttons/export-buttons.component';
import { ReportesMantenimientosService } from '../../../../services/reportes/reportes-mantenimientos.service';
import { ExportService, ReporteData } from '../../../../services/export.service';

@Component({
  selector: 'app-reportes-mantenimientos',
  standalone: true,
  imports: [CommonModule, ExportButtonsComponent],
  templateUrl: './reportes-mantenimientos.component.html',
  styleUrls: ['./reportes-mantenimientos.component.css']
})
export class ReportesMantenimientosComponent implements OnInit, OnDestroy {
  @ViewChild('incidentesChart') incidentesChart?: ElementRef<HTMLCanvasElement>;
  @ViewChild('incidentesEquipoChart') incidentesEquipoChart?: ElementRef<HTMLCanvasElement>;

  kpis = {
    atrasos: 0,
    incidentes: 0,
    equiposMantenimiento: 0
  };

  universidad = 'Universidad de Tarapacá';
  departamento = 'Departamento de Diseño Multimedia';
  reporteTitulo = 'Reporte de Devoluciones y Problemas';
  rangoFechas = 'Últimos 12 meses';
  usuarioGenera = '—';
  fechaGeneracion = new Date();

  atrasos: any[] = [];
  equiposMantenimiento: any[] = [];

  private chartIncidentes?: Chart;
  private chartIncidentesEquipo?: Chart;

  constructor(
    private mantenimientosService: ReportesMantenimientosService,
    private exportService: ExportService
  ) {}

  ngOnInit(): void {
    this.cargarUsuario();
    this.cargarAtrasos();
    this.cargarIncidentes();
    this.cargarIncidentesEquipo();
    this.cargarEquiposMantenimiento();
  }

  ngOnDestroy(): void {
    this.chartIncidentes?.destroy();
    this.chartIncidentesEquipo?.destroy();
  }

  private cargarAtrasos(): void {
    this.mantenimientosService.getAtrasos().subscribe((data) => {
      this.atrasos = data || [];
      this.kpis.atrasos = this.atrasos.length;
    });
  }

  private cargarIncidentes(): void {
    this.mantenimientosService.getIncidentes().subscribe((data) => {
      const labels = data.map((d: any) => d.tipo);
      const valores = data.map((d: any) => d.total);

      this.kpis.incidentes = valores.reduce((a: number, b: number) => a + b, 0);

      const ctx = this.incidentesChart?.nativeElement.getContext('2d');
      if (!ctx) return;

      this.chartIncidentes?.destroy();
      this.chartIncidentes = new Chart(ctx, {
        type: 'bar',
        data: { labels, datasets: [{ data: valores, backgroundColor: '#f97316' }] },
        options: { responsive: true, maintainAspectRatio: false }
      });
    });
  }

  private cargarIncidentesEquipo(): void {
    this.mantenimientosService.getIncidentesEquipo().subscribe((data) => {
      const labels = data.map((d: any) => d.equipo);
      const valores = data.map((d: any) => d.total);

      const ctx = this.incidentesEquipoChart?.nativeElement.getContext('2d');
      if (!ctx) return;

      this.chartIncidentesEquipo?.destroy();
      this.chartIncidentesEquipo = new Chart(ctx, {
        type: 'bar',
        data: { labels, datasets: [{ data: valores, backgroundColor: '#ef4444' }] },
        options: { responsive: true, maintainAspectRatio: false }
      });
    });
  }

  private cargarEquiposMantenimiento(): void {
    this.mantenimientosService.getEquiposMantenimiento().subscribe((data) => {
      this.equiposMantenimiento = data || [];
      this.kpis.equiposMantenimiento = this.equiposMantenimiento.length;
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
      titulo: 'Reporte de Devoluciones y Problemas',
      subtitulo: 'Atrasos, incidentes y estado de mantenimiento',
      fechaGeneracion: new Date(),
      usuario: this.usuarioGenera,
      periodo: this.rangoFechas,
      secciones: [
        {
          tipo: 'kpis',
          titulo: 'Indicadores Operativos',
          datos: [
            { label: 'Atrasos', valor: this.kpis.atrasos },
            { label: 'Incidentes', valor: this.kpis.incidentes },
            { label: 'En mantenimiento', valor: this.kpis.equiposMantenimiento }
          ]
        },
        {
          tipo: 'tabla',
          titulo: 'Préstamos Atrasados',
          subtitulo: 'Casos con devolución fuera de plazo',
          datos: {
            columnas: ['Préstamo', 'Usuario', 'Email', 'Fecha Fin', 'Días Atraso'],
            filas: this.atrasos.map(a => [
              `#${a.idPrestamo}`,
              a.usuario,
              a.email,
              a.fecha_fin || '—',
              a.dias_atraso
            ]),
            anchos: [70, '*', '*', 90, 70]
          }
        },
        {
          tipo: 'tabla',
          titulo: 'Equipos en Mantenimiento',
          subtitulo: 'Equipos con estado crítico',
          datos: {
            columnas: ['Código', 'Estado', 'Observación', 'Actualizado'],
            filas: this.equiposMantenimiento.map(e => [
              e.codigo,
              e.estado,
              e.observacion || '—',
              e.updated_at || '—'
            ]),
            anchos: [100, 100, '*', 100]
          }
        }
      ]
    };

    this.exportService.exportarPDFInstitucional(reporteData, 'Reporte_Mantenimientos_UTA.pdf');
  }

  exportarExcel(): void {
    const sheets = [
      {
        name: 'KPIs',
        data: [
          { Indicador: 'Atrasos', Valor: this.kpis.atrasos },
          { Indicador: 'Incidentes', Valor: this.kpis.incidentes },
          { Indicador: 'Equipos en mantenimiento', Valor: this.kpis.equiposMantenimiento }
        ]
      },
      {
        name: 'Atrasos',
        data: this.atrasos.map((a: any) => ({
          Prestamo: a.idPrestamo,
          Usuario: a.usuario,
          Email: a.email,
          FechaFin: a.fecha_fin,
          DiasAtraso: a.dias_atraso
        }))
      },
      {
        name: 'Equipos_Mantenimiento',
        data: this.equiposMantenimiento.map((e: any) => ({
          Codigo: e.codigo,
          Estado: e.estado,
          Observacion: e.observacion || '',
          Actualizado: e.updated_at
        }))
      }
    ];

    this.exportService.exportarExcel(sheets, `Reporte_Mantenimientos_UTA_${Date.now()}.xlsx`);
  }
}
