import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { Grupo } from '../models/grupo.model';

/**
 * Servicio de grupos para uso general (alumno).
 * Usa los endpoints públicos /api/grupos
 */
@Injectable({ providedIn: 'root' })
export class GrupoService {
  private readonly apiUrl = `${environment.apiBaseUrl}/api/grupos`;

  constructor(private http: HttpClient) {}

  private getHeaders(): HttpHeaders {
    const token = localStorage.getItem('token') ?? '';
    return new HttpHeaders({
      Authorization: `Bearer ${token}`,
      Accept: 'application/json'
    });
  }

  getGrupos(): Observable<Grupo[]> {
    return this.http.get<Grupo[]>(this.apiUrl, {
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
    return this.http.put<Grupo>(`${this.apiUrl}/${id}`, data, {
      headers: this.getHeaders()
    });
  }

  addUsuario(grupoId: number, usuarioId: number): Observable<any> {
    return this.http.post(`${this.apiUrl}/${grupoId}/add-usuario`, { usuario_id: usuarioId }, {
      headers: this.getHeaders()
    });
  }

  removeUsuario(grupoId: number, usuarioId: number): Observable<any> {
    return this.http.post(`${this.apiUrl}/${grupoId}/remove-usuario`, { usuario_id: usuarioId }, {
      headers: this.getHeaders()
    });
  }
}
