import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class MotivosRechazoService {
  private readonly apiUrl = `${environment.apiBaseUrl}/api/motivos-rechazo`;

  constructor(private http: HttpClient) {}

  getMotivos(): Observable<any[]> {
    return this.http.get<any[]>(this.apiUrl);
  }
}
