import { Injectable } from "@angular/core";
import { HttpClient } from "@angular/common/http";
import { Observable } from "rxjs";
import { environment } from "../../../environments/environment.prod";

@Injectable({
  providedIn: "root",
})
export class ReportesProfesoresService {

  private readonly apiUrl = `${environment.apiBaseUrl}/api/reportes/profesores`;

  constructor(private http: HttpClient) {}

  // ================================
  // TABLA – Equipos por profesor
  // ================================
  getEquiposPorProfesor(page: number, pageSize: number): Observable<any> {
    return this.http.get<any>(
      `${this.apiUrl}/equipos?page=${page}&per_page=${pageSize}`
    );
  }

  // ================================
  // GRÁFICO 1 – Préstamos por profesor
  // ================================
  getPrestamosPorProfesor(): Observable<any[]> {
    return this.http.get<any[]>(
      `${this.apiUrl}/prestamos`
    );
  }

  // ================================
  // GRÁFICO 2 – Tendencia temporal
  // ================================
  getTendenciaPrestamos(): Observable<any> {
    return this.http.get<any>(
      `${this.apiUrl}/tendencia`
    );
  }

  // Operative endpoints for a professor
  getPrestamosActivosProfesor(id: number): Observable<any[]> {
    return this.http.get<any[]>(`${environment.apiBaseUrl}/api/dashboard/operational/profesores/${id}/prestamos-activos`);
  }

  getPrestamosProximosProfesor(id: number): Observable<any[]> {
    return this.http.get<any[]>(`${environment.apiBaseUrl}/api/dashboard/operational/profesores/${id}/prestamos-proximos`);
  }

  getRiesgosProfesor(id: number): Observable<any> {
    return this.http.get<any>(`${environment.apiBaseUrl}/api/dashboard/operational/profesores/${id}/riesgos`);
  }

  getResponsabilidadProfesor(id: number): Observable<any[]> {
    return this.http.get<any[]>(`${environment.apiBaseUrl}/api/dashboard/operational/profesores/${id}/responsabilidad`);
  }

  getAlertasProfesor(id: number): Observable<any> {
    return this.http.get<any>(`${environment.apiBaseUrl}/api/dashboard/operational/profesores/${id}/alertas`);
  }
}
