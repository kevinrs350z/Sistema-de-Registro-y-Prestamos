import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import Chart from 'chart.js/auto';

@Component({
  selector: 'app-report-viewer',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './report-viewer.component.html',
  styleUrls: ['./report-viewer.component.css']
})
export class ReportViewerComponent implements OnInit {
  private auth = inject(AuthService);

  active = 'equipos';

  menu = [
    { key: 'dashboard', label: 'Dashboard' },
    { key: 'equipos', label: 'Equipos' },
    { key: 'alumnos', label: 'Alumnos' },
    { key: 'profesores', label: 'Profesores' },
    { key: 'asignaturas', label: 'Asignaturas' },
    { key: 'inventario', label: 'Inventario' },
    { key: 'sanciones', label: 'Sanciones' },
    { key: 'mantenimientos', label: 'Mantenimientos' },
    { key: 'tendencias', label: 'Tendencias' },
  ];

  REPORT_CONFIG: any = {
    alumnos: {
      title: 'Reporte de Alumnos',
      endpoint: '/api/reportes/alumnos',
      charts: ['bar', 'doughnut', 'line']
    },
    equipos: {
      title: 'Reporte de Equipos',
      endpoint: '/api/reportes/equipos',
      charts: ['bar', 'pie', 'radar']
    },
    profesores: {
      title: 'Profesores',
      endpoint: '/api/reportes/profesores',
      charts: ['line', 'bar']
    },
    // agrega el resto...
  };

  config = this.REPORT_CONFIG[this.active];

  charts: any[] = [];

  constructor(private http: HttpClient) {}

  ngOnInit() {
    if (!this.auth.isAdmin()) {
      return;
    }
    this.cargarDatos();
  }

  cambiarReporte(nombre: string) {
    this.active = nombre;
    this.config = this.REPORT_CONFIG[nombre];
    this.cargarDatos();
  }

  cargarDatos() {
    this.http.get(this.config.endpoint).subscribe((data: any) => {
      this.destruirCharts();
      this.renderizarCharts(data);
    });
  }

  destruirCharts() {
    this.charts.forEach(c => c.destroy());
    this.charts = [];
  }

  renderizarCharts(data: any) {
    const tipos = this.config.charts;

    const c1 = new Chart('chart1', { type: tipos[0], data });
    const c2 = new Chart('chart2', { type: tipos[1], data });
    const c3 = new Chart('chart3', { type: tipos[2], data });

    this.charts.push(c1, c2, c3);
  }

  exportPDF() {}
  exportExcel() {}

}
