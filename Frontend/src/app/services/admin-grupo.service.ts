import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { Grupo } from '../models/grupo.model';

export interface GrupoFilters {
  q?: string;
  anio?: string;
  semestre?: string;
  asignatura_id?: string;
  estado?: string;
  page?: number;
  per_page?: number;
}

export interface PagedResponse<T> {
  data: T[];
  current_page: number;
  last_page: number;
}

/**
 * Servicio administrativo para gestión de grupos.
 * Usa endpoints protegidos /api/admin/grupos
 */
@Injectable({ providedIn: 'root' })
export class AdminGrupoService {
  private readonly apiUrl = `${environment.apiBaseUrl}/api/admin/grupos`;

  constructor(private http: HttpClient) {}

  private getHeaders(): HttpHeaders {
    const token = localStorage.getItem('token') ?? '';
    return new HttpHeaders({
      Authorization: `Bearer ${token}`,
      Accept: 'application/json'
    });
  }

  getGrupos(filters: GrupoFilters = {}): Observable<PagedResponse<Grupo>> {
    let params = new HttpParams();
    Object.entries(filters).forEach(([k, v]) => {
      if (v !== undefined && v !== null && v !== '') {
        params = params.set(k, String(v));
      }
    });
    return this.http.get<PagedResponse<Grupo>>(this.apiUrl, {
      params,
      headers: this.getHeaders()
    });
  }

  getGrupo(id: number): Observable<Grupo> {
    return this.http.get<Grupo>(`${this.apiUrl}/${id}`, {
      headers: this.getHeaders()
    });
  }

  createGrupo(data: Partial<Grupo>): Observable<Grupo> {
    return this.http.post<Grupo>(this.apiUrl, data, {
      headers: this.getHeaders()
    });
  }

  updateGrupo(id: number, data: Partial<Grupo>): Observable<Grupo> {
    return this.http.patch<Grupo>(`${this.apiUrl}/${id}`, data, {
      headers: this.getHeaders()
    });
  }

  actualizarEstado(id: number, estado: 'ACTIVO' | 'CERRADO'): Observable<any> {
    return this.http.patch(`${this.apiUrl}/${id}/estado`, { estado }, {
      headers: this.getHeaders()
    });
  }

  addIntegrantes(grupoId: number, usuarios: number[]): Observable<any> {
    return this.http.post(`${this.apiUrl}/${grupoId}/integrantes`, { usuarios }, {
      headers: this.getHeaders()
    });
  }

  removeIntegrante(grupoId: number, usuarioId: number): Observable<any> {
    return this.http.delete(`${this.apiUrl}/${grupoId}/integrantes/${usuarioId}`, {
      headers: this.getHeaders()
    });
  }
}
