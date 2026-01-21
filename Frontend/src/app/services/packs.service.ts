import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Pack } from '../models/pack.model';
import { environment } from '../../environments/environment.prod';

@Injectable({ providedIn: 'root' })
export class PacksService {

  private readonly baseUrl = `${environment.apiBaseUrl}/api`;

  constructor(private http: HttpClient) {}

  private getAuthHeaders(): HttpHeaders {
    const token = localStorage.getItem('token');

    return new HttpHeaders({
      'Authorization': token ? `Bearer ${token}` : '',
      'Accept': 'application/json'
    });
  }


  getPacks(page = 1, perPage = 10): Observable<any> {
    return this.http.get<any>(
      `${this.baseUrl}/packs?page=${page}&per_page=${perPage}`,
      { headers: this.getAuthHeaders() }
    );
  }

  getPackById(id: number): Observable<Pack> {
    return this.http.get<Pack>(
      `${this.baseUrl}/packs/${id}`,
      { headers: this.getAuthHeaders() }
    );
  }

  crearPack(formData: FormData): Observable<any> {
    return this.http.post(
      `${this.baseUrl}/packs`,
      formData,
      { headers: this.getAuthHeaders() }
    );
  }

  actualizarPack(id: number, formData: FormData): Observable<any> {
    return this.http.post(
      `${this.baseUrl}/packs/${id}?_method=PUT`,
      formData,
      { headers: this.getAuthHeaders() }
    );
  }

  eliminarPack(id: number): Observable<any> {
    return this.http.delete(
      `${this.baseUrl}/packs/${id}`,
      { headers: this.getAuthHeaders() }
    );
  }

  reactivarPack(id: number): Observable<any> {
    return this.http.post(
      `${this.baseUrl}/packs/${id}/reactivar`,
      null,
      { headers: this.getAuthHeaders() }
    );
  }
}
