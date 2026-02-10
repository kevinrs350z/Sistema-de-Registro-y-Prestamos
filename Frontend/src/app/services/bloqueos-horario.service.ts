import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

@Injectable({ providedIn: 'root' })
export class BloqueosHorarioService {
  private apiUrl = `${environment.apiBaseUrl}/api/admin/bloqueos-horario`;

  constructor(private http: HttpClient) {}

  private getHeaders(): HttpHeaders {
    const token = sessionStorage.getItem('token') ?? '';
    return new HttpHeaders({
      Authorization: `Bearer ${token}`,
      Accept: 'application/json'
    });
  }

  getBloqueos(tipoEquipoId: number, weekStart?: string): Observable<any[]> {
    let params = new HttpParams().set('tipo_equipo_id', String(tipoEquipoId));
    if (weekStart) {
      params = params.set('week_start', weekStart);
    }
    return this.http.get<any[]>(this.apiUrl, { headers: this.getHeaders(), params });
  }

  setBloqueo(payload: {
    dia_semana: number;
    idBloque: number;
    idTipoEquipo: number;
    activo: boolean;
    week_start?: string;
    motivo?: string | null;
  }): Observable<any> {
    return this.http.post(this.apiUrl, payload, { headers: this.getHeaders() });
  }
}
