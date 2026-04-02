import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class EventosService {


  private readonly api = `${environment.apiBaseUrl}/api`;

  constructor(private http: HttpClient) {}

  /* ======================================
              AUTH HEADERS
  ======================================= */
  private getToken(): string | null {
    return sessionStorage.getItem('token')
      || localStorage.getItem('access_token')
      || localStorage.getItem('auth_token');
  }

  private authHeaders(): HttpHeaders {
    const token = this.getToken();
    let headers = new HttpHeaders({
      'Accept': 'application/json'
    });

    if (token) {
      headers = headers.set('Authorization', `Bearer ${token}`);
    }

    return headers;
  }

  /* ======================================
              GET EQUIPOS (tipo_equipos)
  ======================================= */
  getEquipos(): Observable<any> {
    // ejemplo: /api/admin/tipo-equipos
    return this.http.get(`${this.api}/admin/tipo-equipos`, {
      headers: this.authHeaders()
    });
  }

  /* ======================================
              GET ASIGNATURAS
  ======================================= */
  getAsignaturas(): Observable<any> {
    // ejemplo: /api/admin/asignaturas
    return this.http.get(`${this.api}/admin/asignaturas`, {
      headers: this.authHeaders()
    });
  }

  /* ======================================
              GET RESERVAS (prestamos)
              - soporta paginación si existe
  ======================================= */
  getReservasAdmin(page: number = 1, perPage: number = 8): Observable<any> {
    // ejemplo: /api/admin/reservas?page=1&per_page=8
    let params = new HttpParams()
      .set('page', String(page))
      .set('per_page', String(perPage));

    return this.http.get(`${this.api}/admin/reservas`, {
      headers: this.authHeaders(),
      params
    });
  }

  /* ======================================
              POST CREAR RESERVA (prestamo)
  ======================================= */
  crearPrestamoAdmin(payload: any): Observable<any> {
    // ejemplo: /api/admin/reservas
    return this.http.post(`${this.api}/admin/reservas`, payload, {
      headers: this.authHeaders()
        .set('Content-Type', 'application/json')
    });
  }

  /* ======================================
              CANCELAR RESERVA
              (puede ser DELETE o PATCH)
  ======================================= */
  cancelarReservaAdmin(id: number, motivo: string): Observable<any> {
    // opción A: PATCH /admin/reservas/:id/cancelar
    return this.http.patch(`${this.api}/admin/reservas/${id}/cancelar`, {
      motivo
    }, {
      headers: this.authHeaders()
        .set('Content-Type', 'application/json')
    });

    // opción B (si usas DELETE):
    // return this.http.delete(`${this.baseUrl}/admin/reservas/${id}`, {
    //   headers: this.authHeaders(),
    //   body: { motivo }
    // });
  }
}
