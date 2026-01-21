import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';


@Injectable({
  providedIn: 'root'
})
export class AsignaturasService {

  private readonly api = `${environment.apiBaseUrl}/api`;

  constructor(private http: HttpClient,) {}

  /* ===========================
        HEADERS CON TOKEN
  ============================ */
  private getHeaders(): HttpHeaders {
    const token = localStorage.getItem('token'); // o sessionStorage
    return new HttpHeaders({
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json'
    });
  }

  /* ===========================
        EQUIPOS / ASIGNATURAS
  ============================ */

  getEquipos(): Observable<any> {
    return this.http.get(
      `${this.api}/equipos`,
      { headers: this.getHeaders() }
    );
  }

  getAsignaturas(): Observable<any> {
    return this.http.get(
      `${this.api}/asignaturas`,
      { headers: this.getHeaders() }
    );
  }

  /* ===========================
        EVENTOS (SIMULADOS)
  ============================ */
  getEventos(): Observable<any> {
    return new Observable(sub => {
      sub.next([
        { id: 1, nombre: 'Feria de Diseño' },
        { id: 2, nombre: 'Workshop Multimedia' },
        { id: 3, nombre: 'Charla Audiovisual' }
      ]);
      sub.complete();
    });
  }

  /* ===========================
        RESTRICCIONES (FUTURO)
  ============================ */

  getRestricciones(): Observable<any> {
    return this.http.get(
      `${this.api}/restricciones`,
      { headers: this.getHeaders() }
    );
  }

  crearRestriccion(data: any): Observable<any> {
    return this.http.post(
      `${this.api}/restricciones`,
      data,
      { headers: this.getHeaders() }
    );
  }

  actualizarRestriccion(data: any): Observable<any> {
    return this.http.put(
      `${this.api}/restricciones/${data.id}`,
      data,
      { headers: this.getHeaders() }
    );
  }

  eliminarRestriccion(id: number): Observable<any> {
    return this.http.delete(
      `${this.api}/restricciones/${id}`,
      { headers: this.getHeaders() }
    );
  }
  crearPrestamoAdmin(data: any) {
    return this.http.post(
      `${this.api}/admin/prestamos`,
      data,
      { headers: this.getHeaders() }
    );
  }

}
