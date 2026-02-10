import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import {
  ModeloFiltros,
  ResumenEjecutivo,
  ScoreCompraResponse,
  UsoMensualResponse,
  PercentilesResponse,
  TendenciaP75Response,
  DemandaResponse,
  TiempoEsperaResponse,
  MantenimientosResponse,
  DowntimeResponse,
  IncidentesResponse,
  FallasCategoriaResponse,
  MarcasResponse,
  BoxplotDatos,
  SerieP75Response,
  RecomendacionesResponse,
  ScoreModelo
} from '../../models/estadisticas-modelo.models';

/**
 * Servicio para comunicación con el backend de estadísticas por MODELO.
 * Base URL: /api/estadisticas-modelos/
 *
 * Todos los requests envían `X-Skip-Loading` para que el interceptor
 * global NO muestre el modal bloqueante "Procesando solicitud…".
 * El dashboard maneja sus propios loaders locales.
 */
@Injectable({ providedIn: 'root' })
export class EstadisticasModeloService {

  private readonly base = `${environment.apiBaseUrl}/api/estadisticas-modelos`;

  /** Header que indica al LoadingInterceptor que no active el overlay global */
  private readonly silentHeaders = new HttpHeaders().set('X-Skip-Loading', 'true');

  constructor(private http: HttpClient) {}

  // ── Helpers ────────────────────────────────────────────────

  private buildParams(filtros: ModeloFiltros): HttpParams {
    let params = new HttpParams();
    if (filtros.desde) params = params.set('desde', filtros.desde);
    if (filtros.hasta) params = params.set('hasta', filtros.hasta);
    if (filtros.tipo_equipo_id) params = params.set('tipo_equipo_id', filtros.tipo_equipo_id.toString());
    if (filtros.recomendacion) params = params.set('recomendacion', filtros.recomendacion);
    if (filtros.limite) params = params.set('limite', filtros.limite.toString());
    if (filtros.meses) params = params.set('meses', filtros.meses.toString());
    return params;
  }

  private silentGet<T>(url: string, filtros: ModeloFiltros = {}): Observable<T> {
    return this.http.get<T>(url, {
      params: this.buildParams(filtros),
      headers: this.silentHeaders
    });
  }

  // ── Resumen Ejecutivo ──────────────────────────────────────

  getResumenEjecutivo(filtros: ModeloFiltros = {}): Observable<ResumenEjecutivo> {
    return this.silentGet<ResumenEjecutivo>(`${this.base}/resumen`, filtros);
  }

  // ── Score / Ranking ────────────────────────────────────────

  getRanking(filtros: ModeloFiltros = {}): Observable<ScoreCompraResponse> {
    return this.silentGet<ScoreCompraResponse>(`${this.base}/ranking`, filtros);
  }

  getScoreModelo(id: number, filtros: ModeloFiltros = {}): Observable<ScoreModelo> {
    return this.silentGet<ScoreModelo>(`${this.base}/${id}/score`, filtros);
  }

  // ── Uso y Saturación ───────────────────────────────────────

  getUsoMensual(filtros: ModeloFiltros = {}): Observable<UsoMensualResponse> {
    return this.silentGet<UsoMensualResponse>(`${this.base}/uso-mensual`, filtros);
  }

  getPercentiles(filtros: ModeloFiltros = {}): Observable<PercentilesResponse> {
    return this.silentGet<PercentilesResponse>(`${this.base}/percentiles`, filtros);
  }

  getTendenciaP75(filtros: ModeloFiltros = {}): Observable<TendenciaP75Response> {
    return this.silentGet<TendenciaP75Response>(`${this.base}/tendencia-p75`, filtros);
  }

  // ── Demanda ────────────────────────────────────────────────

  getDemandaInsatisfecha(filtros: ModeloFiltros = {}): Observable<DemandaResponse> {
    return this.silentGet<DemandaResponse>(`${this.base}/demanda-insatisfecha`, filtros);
  }

  getTiempoEspera(filtros: ModeloFiltros = {}): Observable<TiempoEsperaResponse> {
    return this.silentGet<TiempoEsperaResponse>(`${this.base}/tiempo-espera`, filtros);
  }

  // ── Mantenimiento y Fallas ─────────────────────────────────

  getMantenimientos(filtros: ModeloFiltros = {}): Observable<MantenimientosResponse> {
    return this.silentGet<MantenimientosResponse>(`${this.base}/mantenimientos`, filtros);
  }

  getDowntime(filtros: ModeloFiltros = {}): Observable<DowntimeResponse> {
    return this.silentGet<DowntimeResponse>(`${this.base}/downtime`, filtros);
  }

  getIncidentes(filtros: ModeloFiltros = {}): Observable<IncidentesResponse> {
    return this.silentGet<IncidentesResponse>(`${this.base}/incidentes`, filtros);
  }

  getFallasCategoria(filtros: ModeloFiltros = {}): Observable<FallasCategoriaResponse> {
    return this.silentGet<FallasCategoriaResponse>(`${this.base}/fallas-categoria`, filtros);
  }

  // ── Marcas ─────────────────────────────────────────────────

  getRankingMarcas(filtros: ModeloFiltros = {}): Observable<MarcasResponse> {
    return this.silentGet<MarcasResponse>(`${this.base}/marcas`, filtros);
  }

  // ── Gráficos ───────────────────────────────────────────────

  getBoxplotUso(filtros: ModeloFiltros = {}): Observable<BoxplotDatos> {
    return this.silentGet<BoxplotDatos>(`${this.base}/graficos/boxplot-uso`, filtros);
  }

  getSerieP75(filtros: ModeloFiltros = {}): Observable<SerieP75Response> {
    return this.silentGet<SerieP75Response>(`${this.base}/graficos/serie-p75`, filtros);
  }

  // ── Recomendaciones ────────────────────────────────────────

  getRecomendaciones(filtros: ModeloFiltros = {}): Observable<RecomendacionesResponse> {
    return this.silentGet<RecomendacionesResponse>(`${this.base}/recomendaciones`, filtros);
  }
}
