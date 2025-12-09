import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class DashboardReportesService {


  private baseUrl = 'http://localhost:8000/api/reportes/dashboard';

  constructor(private http: HttpClient) {}

  /**
   * KPIs generales del dashboard
   * Esperado algo como:
   * {
   *   prestamosMes: number;
   *   prestamosMesAnterior: number;
   *   equiposDisponibles: number;
   *   usuariosActivos: number;
   *   sancionesActivas: number;
   * }
   */
  getKPIsDashboard(): Observable<any> {
    return this.http.get<any>(`${this.baseUrl}/kpis`);
  }

  /**
   * Serie temporal de solicitudes por día (últimas X semanas)
   * [{ fecha: '2025-12-01', total: 10 }, ...]
   */
  getSolicitudesPorDia(): Observable<any[]> {
    return this.http.get<any[]>(`${this.baseUrl}/solicitudes-dia`);
  }

  /**
   * Uso global interno vs externo
   * [{ tipo: 'INTERNO', total: 20 }, { tipo: 'EXTERNO', total: 8 }]
   */
  getUsoInternoExternoGlobal(): Observable<any[]> {
    return this.http.get<any[]>(`${this.baseUrl}/uso-interno-externo`);
  }

  /**
   * Top categorías de equipos más usadas
   * [{ categoria: 'Fotografía', total_solicitudes: 15 }, ...]
   */
  getTopCategorias(): Observable<any[]> {
    return this.http.get<any[]>(`${this.baseUrl}/top-categorias`);
  }

  /**
   * Sanciones y rechazos globales
   * { total_sanciones: number, total_rechazos: number }
   */
  getSancionesYRechazosGlobal(): Observable<any> {
    return this.http.get<any>(`${this.baseUrl}/sanciones-rechazos`);
  }

  /**
   * Top alumnos que más solicitan equipos
   * [{ nombre, email, total_solicitudes }, ...]
   */
  getTopAlumnos(): Observable<any[]> {
    return this.http.get<any[]>(`${this.baseUrl}/top-alumnos`);
  }
}
