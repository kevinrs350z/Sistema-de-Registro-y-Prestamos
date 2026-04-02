import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { environment } from '../../environments/environment';

export interface AdminUser {
  id: number;
  nombre: string;
  email: string;
  rut?: string;
  rol?: string;
}

@Injectable({ providedIn: 'root' })
export class AdminUsersService {
  private readonly apiUrl = `${environment.apiBaseUrl}/api/admin/users/search`;

  constructor(private http: HttpClient) {}

  private getHeaders(): HttpHeaders {
    const token = localStorage.getItem('token') ?? '';
    return new HttpHeaders({
      Authorization: `Bearer ${token}`,
      Accept: 'application/json'
    });
  }

  /**
   * Buscar usuarios para autocompletado.
   * El backend retorna array directo, no paginado.
   */
  search(q: string, limit = 10, roles: string[] = []): Observable<AdminUser[]> {
    let params = new HttpParams().set('q', q);
    if (roles.length) {
      params = params.set('roles', roles.join(','));
    }
    return this.http.get<AdminUser[]>(this.apiUrl, {
      params,
      headers: this.getHeaders()
    }).pipe(
      map(resp => Array.isArray(resp) ? resp.slice(0, limit) : [])
    );
  }
}
