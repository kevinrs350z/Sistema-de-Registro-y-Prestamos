import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class ReportesService {

  private apiUrl = 'http://localhost:8000/api/reportes';

  constructor(private http: HttpClient) {}

  getEquiposMasSolicitados(): Observable<any> {
    return this.http.get(`${this.apiUrl}/equipos-mas-solicitados`);
  }
  getUsoInternoExterno():  Observable<any> {
    return this.http.get(`${this.apiUrl}/uso-interno-externo`);
  }

  getSancionesYRechazos(): Observable<any> {
    return this.http.get(`${this.apiUrl}/sanciones-rechazos`);
  }

  getEquiposDadoDeBaja(): Observable<any> {
    return this.http.get(`${this.apiUrl}/equipos-baja`);
  }

}
