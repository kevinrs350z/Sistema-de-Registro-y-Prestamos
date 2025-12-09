import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReportesEquiposComponent } from '../reportes-equipos/reportes-equipos.component';
import { ReportesAlumnosComponent } from '../reportes-alumnos/reportes-alumnos.component';
import { ReportesTendenciasComponent } from '../reportes-tendencias/reportes-tendencias.component';
import { ReportesMantenimientosComponent } from '../reportes-mantenimientos/reportes-mantenimientos.component';
import { ReportesSancionesComponent } from '../reportes-sanciones/reportes-sanciones.component';


import { ReportesDashboardComponent } from '../reportes-dashboard/reportes-dashboard.component';
import { ReportesProfesoresComponent } from '../reportes-profesores/reportes-profesores.component';
import { ReportesAsignaturasComponent } from '../reportes-asignaturas/reportes-asignaturas.component';
import { ReportesInventarioComponent } from '../reportes-inventario/reportes-inventario.component';
import { Router, RouterModule } from '@angular/router';

@Component({
  selector: 'app-reportes',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    ReportesEquiposComponent,
    ReportesAlumnosComponent,
    ReportesSancionesComponent,
    ReportesMantenimientosComponent,
    ReportesTendenciasComponent,
    ReportesDashboardComponent,
    ReportesProfesoresComponent,
    ReportesAsignaturasComponent,
    ReportesInventarioComponent
  ],
  templateUrl: './reportes.component.html',
  styleUrls: ['./reportes.component.css']
})
export class ReportesComponent {
  tab = 'equipos';  
}
