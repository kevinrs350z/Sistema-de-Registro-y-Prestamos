import { Component, OnInit, OnDestroy, ViewChild, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import Chart from 'chart.js/auto';
import { ExportButtonsComponent } from '../export-buttons/export-buttons.component';
import { ReportesAsignaturasService } from '../../../../services/reportes/reportes-asignaturas.service';
import { ExportService, ReporteData } from '../../../../services/export.service';

@Component({
  selector: 'app-reportes-asignaturas',
  standalone: true,
  imports: [CommonModule, FormsModule, ExportButtonsComponent],
  templateUrl: './reportes-asignaturas.component.html',
  styleUrls: ['./reportes-asignaturas.component.css']
})
export class ReportesAsignaturasComponent implements OnInit, OnDestroy {
  @ViewChild('usoChart') usoChart?: ElementRef<HTMLCanvasElement>;
  @ViewChild('tendenciaChart') tendenciaChart?: ElementRef<HTMLCanvasElement>;

  equiposAsignatura: any[] = [];
  page = 1;
  totalPages = 1;
  perPage = 10;
  search = '';

  universidad = 'Universidad de Tarapacá';
  departamento = 'Departamento de Diseño Multimedia';
  reporteTitulo = 'Reporte de Asignaturas';
  rangoFechas = 'Últimos 12 meses';
  usuarioGenera = '—';
  fechaGeneracion = new Date();

  private chartUso?: Chart;
  private chartTendencia?: Chart;

  constructor(
    private asignaturasService: ReportesAsignaturasService,
    private exportService: ExportService
  ) {}
  fechaInicio: string = '';
  fechaFin: string = '';
  periodo: string = 'dias';

  ngOnInit(): void {
    this.cargarUsuario();
    this.cargarUso();
    this.cargarTendencia();
    this.cargarEquipos();
  }

  filtrarPorFecha() {
    let rango = '';
    if (this.fechaInicio && this.fechaFin) {
      rango = `Del ${this.fechaInicio} al ${this.fechaFin}`;
    } else {
      rango = 'Sin filtro';
    }
    // Aquí deberías recargar los datos usando el filtro
    // Ejemplo: this.reportesService.getAsignaturas(this.fechaInicio, this.fechaFin, this.periodo).subscribe(...)
    // Mostrar mensaje de filtro aplicado
    // this.mostrarMensaje('Filtro aplicado.');
  }

  ngOnDestroy(): void {
    this.chartUso?.destroy();
    this.chartTendencia?.destroy();
  }

  private cargarUso(): void {
    this.asignaturasService.getUso().subscribe((data) => {
      const labels = data.map((d: any) => d.asignatura);
      const valores = data.map((d: any) => d.prestamos);

      const ctx = this.usoChart?.nativeElement.getContext('2d');
      if (!ctx) return;

      this.chartUso?.destroy();
      this.chartUso = new Chart(ctx, {
        type: 'bar',
        data: { labels, datasets: [{ data: valores, backgroundColor: '#1f78ff' }] },
        options: { responsive: true, maintainAspectRatio: false }
      });
    });
  }

  private cargarTendencia(): void {
    this.asignaturasService.getTendencia().subscribe((data) => {
      const labels = data.map((d: any) => d.anio);
      const valores = data.map((d: any) => d.prestamos);

      const ctx = this.tendenciaChart?.nativeElement.getContext('2d');
      if (!ctx) return;

      this.chartTendencia?.destroy();
      this.chartTendencia = new Chart(ctx, {
        type: 'line',
        data: { labels, datasets: [{ data: valores, borderColor: '#10b981', backgroundColor: 'rgba(16,185,129,0.2)', fill: true }] },
        options: { responsive: true, maintainAspectRatio: false }
      });
    });
  }

  cargarEquipos(): void {
    this.asignaturasService.getEquiposPorAsignatura(this.page, this.perPage, this.search).subscribe((data) => {
      this.equiposAsignatura = data.data || [];
      this.totalPages = data.totalPages || 1;
    });
  }

  buscar(): void {
    this.page = 1;
    this.cargarEquipos();
  }

  cambiarPagina(delta: number): void {
    const next = this.page + delta;
    if (next < 1 || next > this.totalPages) return;
    this.page = next;
    this.cargarEquipos();
  }

  exportarPDF(): void {
    const reporteData: ReporteData = {
      titulo: 'Reporte de Asignaturas',
      subtitulo: 'Uso académico de equipos por asignatura',
      fechaGeneracion: new Date(),
      usuario: this.usuarioGenera,
      periodo: this.rangoFechas,
      secciones: [
        {
          tipo: 'tabla',
          titulo: 'Equipos por Asignatura',
          subtitulo: 'Equipos más utilizados por asignatura',
          datos: {
            columnas: ['Asignatura', 'Equipo', 'Total Solicitudes'],
            filas: this.equiposAsignatura.map(e => [e.asignatura, e.equipo, e.total]),
            anchos: ['*', '*', 100]
          }
        }
      ]
    };

    this.exportService.exportarPDFInstitucional(reporteData, 'Reporte_Asignaturas_UTA.pdf');
  }

  exportarExcel(): void {
    const sheets = [
      {
        name: 'Equipos_por_Asignatura',
        data: this.equiposAsignatura.map((e: any) => ({
          Asignatura: e.asignatura,
          Equipo: e.equipo,
          Total: e.total
        }))
      }
    ];

    this.exportService.exportarExcel(sheets, `Reporte_Asignaturas_UTA_${Date.now()}.xlsx`);
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
