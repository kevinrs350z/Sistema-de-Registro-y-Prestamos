import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface UsuarioResponse {
  data: any[];
  current_page: number;
  last_page: number;
}

@Injectable({
  providedIn: 'root'
})
export class UsuariosService {

  private apiUrl = 'http://localhost:8000/api/usuarios';

  constructor(private http: HttpClient) { }

 
  crearUsuario(data: any): Observable<any> {
    return this.http.post(this.apiUrl, data);
  }

 
    obtenerUsuarios(page: number = 1): Observable<UsuarioResponse> {
    return this.http.get<UsuarioResponse>(`http://localhost:8000/api/usuarios?page=${page}`);
    }
    
    actualizarUsuario(id: number, data: any) {
    return this.http.put(`http://localhost:8000/api/usuarios/${id}`, data);
    }

}
