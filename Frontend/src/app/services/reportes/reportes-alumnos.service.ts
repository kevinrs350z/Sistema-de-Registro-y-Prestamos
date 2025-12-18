import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class ReportesAlumnosService {

  private baseUrl = 'http://localhost:8000/api/reportes/alumnos';

  constructor(private http: HttpClient) {}

  getKPIsAlumnos(): Observable<any> {
    return this.http.get<any>(`${this.baseUrl}/kpis`);
  }

  getPrestamosPorCarrera(): Observable<any[]> {
    return this.http.get<any[]>(`${this.baseUrl}/prestamos-carrera`);
  }

  getSancionesPorNivel(): Observable<any[]> {
    return this.http.get<any[]>(`${this.baseUrl}/sanciones-nivel`);
  }

  getEvolucionPrestamosAlumnos(): Observable<any[]> {
    return this.http.get<any[]>(`${this.baseUrl}/evolucion-prestamos`);
  }

  getRankingAlumnos(): Observable<any[]> {
    return this.http.get<any[]>(`${this.baseUrl}/ranking`);
  }
}
