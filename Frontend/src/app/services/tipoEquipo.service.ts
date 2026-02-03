import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

import { map } from 'rxjs/operators';

@Injectable({ providedIn: 'root' })
export class TipoEquipoService {

  private apiUrl = `${environment.apiBaseUrl}/api`;

  constructor(private http: HttpClient) { }

  private getHeaders(): HttpHeaders {
    const token = sessionStorage.getItem('token') ?? '';
    return new HttpHeaders({
      Authorization: `Bearer ${token}`,
      Accept: 'application/json'
    });
  }

  // ============================================================
  // LISTAR TIPOS DE EQUIPO
  // ============================================================
  getTipos(): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/tipoEquipo`, {
      headers: this.getHeaders()
    });
  }

  // ============================================================
  // CREAR NUEVO TIPO (modelo)
  // ============================================================
  crearTipo(data: any, imagen?: File): Observable<any> {

    const formData = new FormData();

    formData.append('nombre', data.nombre);
    formData.append('categoria_id', data.categoria_id);
    formData.append('maximo_prestamo', String(data.maximo_prestamo ?? 0));

    if (imagen) formData.append('imagen', imagen);

    return this.http.post(`${this.apiUrl}/tipoEquipo`, formData, {
      headers: this.getHeaders()
    });
  }

  // ============================================================
  // CATÁLOGO: tipo de equipos + stock
  // ============================================================
  getCatalogo(): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/catalogo-equipos`, {
      headers: this.getHeaders()
    });
  }

  // ============================================================
  // LISTAR EQUIPOS FÍSICOS DISPONIBLES POR TIPO
  // ============================================================
  getEquiposPorTipo(idTipo: number): Observable<any[]> {
    return this.http.get<any[]>(
      `${this.apiUrl}/tipoEquipo/${idTipo}/equipos-disponibles`,
      { headers: this.getHeaders() }
    );
  }

  // ============================================================
  // ACTUALIZAR TIPO
  // ============================================================
  actualizarTipo(id: number, data: any): Observable<any> {
    const tieneImagen = data?.imagen instanceof File;

    if (tieneImagen) {
      // Laravel no soporta archivos con PUT directo.
      // Usamos POST + _method=PUT para el workaround.
      const formData = new FormData();
      formData.append('_method', 'PUT');

      Object.keys(data).forEach(key => {
        if (data[key] === undefined || data[key] === null) return;
        formData.append(key, data[key]);
      });

      // POST con _method=PUT para que Laravel procese el archivo
      return this.http.post(`${this.apiUrl}/tipoEquipo/${id}`, formData, {
        headers: new HttpHeaders({
          Authorization: `Bearer ${sessionStorage.getItem('token') ?? ''}`,
          Accept: 'application/json'
          // NO ponemos Content-Type, el browser lo setea automáticamente con boundary
        })
      });
    }

    return this.http.put(`${this.apiUrl}/tipoEquipo/${id}`, data, {
      headers: this.getHeaders()
    });
  }

  // ============================================================
  // ELIMINAR TIPO
  // ============================================================
  eliminarTipo(id: number): Observable<any> {
    return this.http.delete(`${this.apiUrl}/tipoEquipo/${id}`, {
      headers: this.getHeaders()
    });

  }



  // ============================================================
  // LISTAR PACKS
  // ============================================================
  getPacks(): Observable<any[]> {
    return this.http.get<any>(`${this.apiUrl}/packs`, {
      headers: this.getHeaders()
    }).pipe(
      map((response: any) => response.data)
    );
  }


}
