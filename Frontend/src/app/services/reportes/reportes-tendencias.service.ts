import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

@Injectable({ providedIn: 'root' })
export class ReportesTendenciasService {
  private readonly baseUrl = `${environment.apiBaseUrl}/api/reportes/tendencias`;

  constructor(private http: HttpClient) {}

  getPrestamosMes(): Observable<any[]> {
    return this.http.get<any[]>(`${this.baseUrl}/prestamos-mes`);
  }

  getCategorias(): Observable<any[]> {
    return this.http.get<any[]>(`${this.baseUrl}/categorias`);
  }

  getUsoTipoUsuario(): Observable<any[]> {
    return this.http.get<any[]>(`${this.baseUrl}/uso-tipo-usuario`);
  }
}
