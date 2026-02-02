import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

@Injectable({ providedIn: 'root' })
export class CategoriaService {

  private readonly apiUrl = `${environment.apiBaseUrl}/api`;

  constructor(private http: HttpClient) {}

  private getHeaders(): HttpHeaders {
    const token = localStorage.getItem('token') ?? '';
    return new HttpHeaders({
      Authorization: `Bearer ${token}`,
      Accept: 'application/json'
    });
  }

  getCategorias(): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/categoria`, {
      headers: this.getHeaders()
    });
  }

  getCategoriaById(id: number): Observable<any> {
    return this.http.get(`${this.apiUrl}/categoria/${id}`, {
      headers: this.getHeaders()
    });
  }

  crearCategoria(data: any): Observable<any> {
    return this.http.post(`${this.apiUrl}/categoria`, data, {
      headers: this.getHeaders()
    });
  }

  actualizarCategoria(id: number, data: any): Observable<any> {
    return this.http.put(`${this.apiUrl}/categoria/${id}`, data, {
      headers: this.getHeaders()
    });
  }

  eliminarCategoria(id: number): Observable<any> {
    return this.http.delete(`${this.apiUrl}/categoria/${id}`, {
      headers: this.getHeaders()
    });
  }
}
