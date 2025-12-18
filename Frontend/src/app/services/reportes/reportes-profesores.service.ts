import { Injectable } from "@angular/core";
import { HttpClient } from "@angular/common/http";
import { Observable } from "rxjs";

@Injectable({
  providedIn: "root",
})
export class ReportesProfesoresService {

  private apiUrl = "http://localhost:8000/api/reportes/profesores";

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
}
