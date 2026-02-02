import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class GrupoService {
  private apiUrl = '/api/grupos';

  constructor(private http: HttpClient) {}

  getGrupos(): Observable<any> {
    return this.http.get(this.apiUrl);
  }

  getGrupo(id: number): Observable<any> {
    return this.http.get(`${this.apiUrl}/${id}`);
  }

  createGrupo(data: any): Observable<any> {
    return this.http.post(this.apiUrl, data);
  }

  updateGrupo(id: number, data: any): Observable<any> {
    return this.http.put(`${this.apiUrl}/${id}`, data);
  }

  deleteGrupo(id: number): Observable<any> {
    return this.http.delete(`${this.apiUrl}/${id}`);
  }

  addUsuario(grupoId: number, usuarioId: number): Observable<any> {
    return this.http.post(`${this.apiUrl}/${grupoId}/add-usuario`, { usuario_id: usuarioId });
  }

  removeUsuario(grupoId: number, usuarioId: number): Observable<any> {
    return this.http.post(`${this.apiUrl}/${grupoId}/remove-usuario`, { usuario_id: usuarioId });
  }

  asignarPrestamo(grupoId: number, prestamoId: number): Observable<any> {
    return this.http.post(`${this.apiUrl}/${grupoId}/asignar-prestamo`, { prestamo_id: prestamoId });
  }

  quitarPrestamo(grupoId: number, prestamoId: number): Observable<any> {
    return this.http.post(`${this.apiUrl}/${grupoId}/quitar-prestamo`, { prestamo_id: prestamoId });
  }
}
