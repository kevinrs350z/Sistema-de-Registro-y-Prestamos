import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { environment } from '../../environments/environment';
import { ReportFilter, Granularity } from './report-filters.service';

/**
 * Interfaz para filtros de reporte (compatibilidad)
 */
export interface FiltroReporte {
  fechaInicio?: string;
  fechaFin?: string;
  granularity?: Granularity;
  periodo?: 'dia' | 'semana' | 'mes' | 'trimestre' | 'semestre' | 'anio' | 'personalizado';
}

/**
 * Respuesta estándar del API con meta información
 */
export interface ReportResponse<T> {
  data: T;
  meta: {
    fechaInicio: string;
    fechaFin: string;
    granularity?: string;
  };
}

@Injectable({
  providedIn: 'root'
})
export class ReportesService {

  private readonly apiUrl = `${environment.apiBaseUrl}/api/reportes`;

  constructor(private http: HttpClient) {}

  private getHeaders(): HttpHeaders {
    const token = localStorage.getItem('token') ?? '';
    return new HttpHeaders({
      Authorization: `Bearer ${token}`,
      Accept: 'application/json'
    });
  }

  /**
   * Construir parámetros desde filtro local
   */
  private buildParams(filtro?: FiltroReporte): HttpParams {
    let params = new HttpParams();
    if (filtro?.fechaInicio) params = params.set('fechaInicio', filtro.fechaInicio);
    if (filtro?.fechaFin) params = params.set('fechaFin', filtro.fechaFin);
    if (filtro?.granularity) params = params.set('granularity', filtro.granularity);
    if (filtro?.periodo) params = params.set('periodo', filtro.periodo);
    return params;
  }

  /**
   * Construir parámetros desde ReportFilter del servicio centralizado
   */
  buildParamsFromFilter(filter: ReportFilter): HttpParams {
    let params = new HttpParams();
    params = params.set('fechaInicio', filter.from);
    params = params.set('fechaFin', filter.to);
    params = params.set('granularity', filter.granularity);
    if (filter.tipoEquipoId !== undefined && filter.tipoEquipoId !== null) {
      params = params.set('tipoEquipoId', String(filter.tipoEquipoId));
    }
    if (filter.franjaHoraria) {
      params = params.set('franjaHoraria', filter.franjaHoraria);
    }
    return params;
  }

  /**
   * Equipos más solicitados
   */
  getEquiposMasSolicitados(filtro?: FiltroReporte): Observable<any> {
    return this.http.get<ReportResponse<any>>(`${this.apiUrl}/equipos-mas-solicitados`, { 
      headers: this.getHeaders(),
      params: this.buildParams(filtro)
    }).pipe(
      map(response => response.data || response)
    );
  }

  /**
   * Equipos más solicitados con filtro centralizado
   */
  getEquiposMasSolicitadosWithFilter(filter: ReportFilter): Observable<any> {
    return this.http.get<ReportResponse<any>>(`${this.apiUrl}/equipos-mas-solicitados`, { 
      headers: this.getHeaders(),
      params: this.buildParamsFromFilter(filter)
    }).pipe(
      map(response => response.data || response)
    );
  }

  /**
   * Uso interno vs externo
   */
  getUsoInternoExterno(filtro?: FiltroReporte): Observable<any> {
    return this.http.get<ReportResponse<any>>(`${this.apiUrl}/uso-interno-externo`, { 
      headers: this.getHeaders(),
      params: this.buildParams(filtro)
    }).pipe(
      map(response => response.data || response)
    );
  }

  getUsoInternoExternoWithFilter(filter: ReportFilter): Observable<any> {
    return this.http.get<ReportResponse<any>>(`${this.apiUrl}/uso-interno-externo`, { 
      headers: this.getHeaders(),
      params: this.buildParamsFromFilter(filter)
    }).pipe(
      map(response => response.data || response)
    );
  }

  /**
   * Sanciones y rechazos
   */
  getSancionesYRechazos(filtro?: FiltroReporte): Observable<any> {
    return this.http.get<ReportResponse<any>>(`${this.apiUrl}/sanciones-rechazos`, { 
      headers: this.getHeaders(),
      params: this.buildParams(filtro)
    }).pipe(
      map(response => response.data || response)
    );
  }

  getSancionesYRechazosWithFilter(filter: ReportFilter): Observable<any> {
    return this.http.get<ReportResponse<any>>(`${this.apiUrl}/sanciones-rechazos`, { 
      headers: this.getHeaders(),
      params: this.buildParamsFromFilter(filter)
    }).pipe(
      map(response => response.data || response)
    );
  }

  /**
   * Equipos dados de baja
   */
  getEquiposDadoDeBaja(filtro?: FiltroReporte): Observable<any> {
    return this.http.get<ReportResponse<any>>(`${this.apiUrl}/equipos-baja`, { 
      headers: this.getHeaders(),
      params: this.buildParams(filtro)
    }).pipe(
      map(response => response.data || response)
    );
  }

  getEquiposDadoDeBajaWithFilter(filter: ReportFilter): Observable<any> {
    return this.http.get<ReportResponse<any>>(`${this.apiUrl}/equipos-baja`, { 
      headers: this.getHeaders(),
      params: this.buildParamsFromFilter(filter)
    }).pipe(
      map(response => response.data || response)
    );
  }

  /**
   * Préstamos por período con granularidad
   */
  getPrestamosPorPeriodo(filter: ReportFilter): Observable<any> {
    return this.http.get<ReportResponse<any>>(`${this.apiUrl}/prestamos-periodo`, { 
      headers: this.getHeaders(),
      params: this.buildParamsFromFilter(filter)
    }).pipe(
      map(response => response.data || response)
    );
  }

  /**
   * Categorías más demandadas
   */
  getCategoriasMasDemandadas(filter: ReportFilter): Observable<any> {
    return this.http.get<ReportResponse<any>>(`${this.apiUrl}/categorias-demandadas`, { 
      headers: this.getHeaders(),
      params: this.buildParamsFromFilter(filter)
    }).pipe(
      map(response => response.data || response)
    );
  }

  // Operative endpoints (equipos)
  getDisponibilidadEquipos(): Observable<any[]> {
    return this.http.get<any[]>(`${(environment.apiBaseUrl)}/api/dashboard/operational/disponibilidad`, {
      headers: this.getHeaders()
    });
  }

  getEquiposCriticos(): Observable<any[]> {
    return this.http.get<any[]>(`${(environment.apiBaseUrl)}/api/dashboard/operational/criticos`, {
      headers: this.getHeaders()
    });
  }

  getEquipoUltimoEvento(id: number): Observable<any> {
    return this.http.get<any>(`${(environment.apiBaseUrl)}/api/dashboard/operational/equipos/${id}/ultimo-evento`, {
      headers: this.getHeaders()
    });
  }

}
