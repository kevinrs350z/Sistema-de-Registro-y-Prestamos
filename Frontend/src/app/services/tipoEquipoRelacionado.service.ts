import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

export interface TipoRelacionado {
  id: number;
  nombre: string;
}

export interface TipoConRelaciones {
  id: number;
  nombre: string;
  categoria: string | null;
  maximo_prestamo: number;
  relacionados: TipoRelacionado[];
}

@Injectable({ providedIn: 'root' })
export class TipoEquipoRelacionadoService {

  private apiUrl = `${environment.apiBaseUrl}/api`;

  constructor(private http: HttpClient) {}

  private getHeaders(): HttpHeaders {
    const token = localStorage.getItem('token') ?? '';
    return new HttpHeaders({
      Authorization: `Bearer ${token}`,
      Accept: 'application/json'
    });
  }

  /**
   * Listar todos los tipos con sus relaciones
   */
  getAll(): Observable<TipoConRelaciones[]> {
    return this.http.get<TipoConRelaciones[]>(`${this.apiUrl}/tipoEquipo-relacionados`, {
      headers: this.getHeaders()
    });
  }

  /**
   * Obtener relaciones de un tipo específico
   */
  getRelaciones(tipoId: number): Observable<TipoConRelaciones> {
    return this.http.get<TipoConRelaciones>(`${this.apiUrl}/tipoEquipo-relacionados/${tipoId}`, {
      headers: this.getHeaders()
    });
  }

  /**
   * Crear una relación entre dos tipos de equipo
   */
  crearRelacion(tipoEquipoId: number, relacionadoId: number): Observable<any> {
    return this.http.post(`${this.apiUrl}/tipoEquipo-relacionados`, {
      tipo_equipo_id: tipoEquipoId,
      relacionado_id: relacionadoId
    }, {
      headers: this.getHeaders()
    });
  }

  /**
   * Eliminar una relación entre dos tipos de equipo
   */
  eliminarRelacion(tipoEquipoId: number, relacionadoId: number): Observable<any> {
    return this.http.delete(`${this.apiUrl}/tipoEquipo-relacionados`, {
      headers: this.getHeaders(),
      body: {
        tipo_equipo_id: tipoEquipoId,
        relacionado_id: relacionadoId
      }
    });
  }

  /**
   * Obtener sugerencias de tipos que podrían relacionarse (misma categoría)
   */
  getSugerencias(tipoId: number): Observable<TipoRelacionado[]> {
    return this.http.get<TipoRelacionado[]>(`${this.apiUrl}/tipoEquipo-relacionados/${tipoId}/sugerencias`, {
      headers: this.getHeaders()
    });
  }
}
