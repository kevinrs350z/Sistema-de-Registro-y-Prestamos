import { Injectable } from '@angular/core';
import { environment } from '../../../environments/environment';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class ReportesAlumnosService {
  // Corrige la baseUrl para que coincida con las rutas del backend
  private readonly baseUrl = `${environment.apiBaseUrl}/api/reportes/alumnos`;

  constructor(private http: HttpClient) {}

  // Las rutas del backend están definidas en ReportesAlumnosAdminController
  getKPIsAlumnos(): Observable<any> {
    // GET /api/reportes/alumnos/kpis
    return this.http.get<any>(`${this.baseUrl}/kpis`);
  }

  getPrestamosPorCarrera(): Observable<any[]> {
    // GET /api/reportes/alumnos/prestamos-carrera
    return this.http.get<any[]>(`${this.baseUrl}/prestamos-carrera`);
  }

  getSancionesPorNivel(): Observable<any[]> {
    // GET /api/reportes/alumnos/sanciones-nivel
    return this.http.get<any[]>(`${this.baseUrl}/sanciones-nivel`);
  }

  getEvolucionPrestamosAlumnos(): Observable<any[]> {
    // GET /api/reportes/alumnos/evolucion-prestamos
    return this.http.get<any[]>(`${this.baseUrl}/evolucion-prestamos`);
  }

  getRankingAlumnos(): Observable<any[]> {
    // GET /api/reportes/alumnos/ranking
    return this.http.get<any[]>(`${this.baseUrl}/ranking`);
  }
}
