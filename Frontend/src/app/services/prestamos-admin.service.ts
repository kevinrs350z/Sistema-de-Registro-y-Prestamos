import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class PrestamosAdminService {

  private readonly apiUrl = `${environment.apiBaseUrl}/api/admin/prestamos`;

  constructor(private http: HttpClient) {}

  // Obtener header con token
  private getAuthHeaders(): HttpHeaders {
    const token = sessionStorage.getItem('token') ?? '';
    return new HttpHeaders({
      Authorization: `Bearer ${token}`
    });
  }

  //  1. Obtener solicitudes pendientes
  getPendientes(): Observable<any[]> {
    return this.http.get<any[]>(
      `${this.apiUrl}/pendientes`,
      { headers: this.getAuthHeaders() }
    );
  }

  //  2. Obtener historial de préstamos (aceptados/rechazados/finalizados)
  getHistorial(): Observable<any[]> {
    return this.http.get<any[]>(
      `${this.apiUrl}/historial`,
      { headers: this.getAuthHeaders() }
    );
  }
  devolverEquipo(idPrestamo: number, idEquipo: number, motivo: string) {
    return this.http.patch(`${this.apiUrl}/${idPrestamo}/equipos/${idEquipo}/devolver`,{ motivo });
  }

aprobarPrestamo(id: number, motivo: string, accion: string) {
  return this.http.post(`${this.apiUrl}/aprobar/${id}`, {
    motivo,
    accion
  });
}
marcarDevuelto(id: number, motivo: string) {
  return this.http.post(`${this.apiUrl}/${id}/devolver`, {
    motivo
  });
}

marcarEntregado(id: number) {
  return this.http.post(`${this.apiUrl}/${id}/entregar`, {});
}

extenderPrestamo(id: number, payload: { fecha: string; comentario?: string; equiposIds: number[] }) {
  return this.http.patch(`${this.apiUrl}/${id}/extender`, payload);
}

  actualizarEquiposPrestamo(
    id: number,
    payload: { equipos: Array<{ idTipoEquipo: number; cantidad: number }>; motivo?: string | null }
  ) {
    return this.http.patch(`${this.apiUrl}/${id}/equipos`, payload, {
      headers: this.getAuthHeaders()
    });
  }

//devolverEquipo(idPrestamo: number, idEquipo: number, motivo: string) {
 // return this.http.patch(`${this.apiUrl}/prestamos/${idPrestamo}/devolver-equipo/${idEquipo}`, {
  //  motivo
  //});
//}



rechazarPrestamo(id: number, motivo: string, accion: string) {
  return this.http.post(`${this.apiUrl}/rechazar/${id}`, {
    motivo,
    accion
  });
}

// 🔄 OPERACIONES MASIVAS

/**
 * Devolver todos los préstamos en estado ENTREGADO
 */
devolverTodosMasivo(motivo?: string): Observable<any> {
  return this.http.post(
    `${environment.apiBaseUrl}/api/admin/prestamos/masivo/devolver-todos`,
    { motivo: motivo || 'Devolución masiva' },
    { headers: this.getAuthHeaders() }
  );
}

/**
 * Cancelar todos los préstamos PENDIENTES
 */
cancelarTodosPendientesMasivo(motivo?: string): Observable<any> {
  return this.http.post(
    `${environment.apiBaseUrl}/api/admin/prestamos/masivo/cancelar-pendientes`,
    { motivo: motivo || 'Cancelación masiva' },
    { headers: this.getAuthHeaders() }
  );
}

}
