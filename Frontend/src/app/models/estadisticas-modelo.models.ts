// ============================================================
// DTOs / Interfaces para el módulo BI de Estadísticas por Modelo
// Mapea 1:1 con los responses del DashboardModelosController
// ============================================================

// ─── Filtros ─────────────────────────────────────────────────
export interface ModeloFiltros {
  desde?: string;        // YYYY-MM-DD
  hasta?: string;        // YYYY-MM-DD
  tipo_equipo_id?: number;
  recomendacion?: 'COMPRAR' | 'MONITOREAR' | 'NO_COMPRAR';
  limite?: number;
  meses?: number;
}

// ─── Resumen Ejecutivo ───────────────────────────────────────
export interface ResumenEjecutivo {
  fecha_generacion: string;
  periodo: { desde: string; hasta: string };
  kpis: ResumenKPIs;
  modelos_criticos: ModeloCritico[];
  marcas_problematicas: MarcaProblematica[];
}

export interface ResumenKPIs {
  total_modelos: number;
  total_equipos: number;
  tasa_utilizacion_global: number;
  modelos_saturados: number;
  modelos_subutilizados: number;
  total_rechazos_stock: number;
  tasa_rechazo_global: number;
  total_incidentes_mantenimiento: number;
  downtime_total_horas: number;
}

export interface ModeloCritico {
  tipo_equipo_id: number;
  modelo: string;
  marca: string;
  score: number;
  recomendacion: string;
}

export interface MarcaProblematica {
  marca: string;
  incidentes_1000d: number;
  total_modelos: number;
}

// ─── Score de Compra ─────────────────────────────────────────
export interface ScoreCompraResponse {
  ranking: ScoreModelo[];
  total: number;
  filtros: ModeloFiltros;
}

export interface ScoreModelo {
  tipo_equipo_id: number;
  modelo: string;
  marca: string;
  categoria: string;
  total_equipos: number;
  score: number;
  recomendacion: 'COMPRAR' | 'MONITOREAR' | 'NO_COMPRAR';
  explicacion: string[];
  componentes: {
    presion_uso: ComponenteScore;
    demanda_insatisfecha: ComponenteScore;
    tendencia: ComponenteTendencia;
    riesgo_downtime: ComponenteScore;
    fiabilidad: ComponenteScore;
  };
}

export interface ComponenteScore {
  valor: number;
  peso: number;
  score_normalizado: number;
}

export interface ComponenteTendencia extends ComponenteScore {
  direccion: string; // lowercase from backend: 'creciente' | 'estable' | 'decreciente'
}

// ─── Uso Mensual ─────────────────────────────────────────────
export interface UsoMensualResponse {
  modelos: UsoModeloAgrupado[];
  total_modelos: number;
  filtros: ModeloFiltros;
}

export interface UsoModeloAgrupado {
  tipo_equipo_id: number;
  modelo: string;
  marca: string;
  categoria: string;
  total_equipos: number;
  uso_promedio: number;
  uso_promedio_porcentaje: number;
  meses: UsoMes[];
}

export interface UsoMes {
  mes: string;
  dias_prestados: number;
  uso_porcentaje: number;
}

// ─── Percentiles ─────────────────────────────────────────────
export interface PercentilesResponse {
  modelos: PercentilModelo[];
  total: number;
  filtros: ModeloFiltros;
}

export interface PercentilModelo {
  tipo_equipo_id: number;
  modelo: string;
  marca: string;
  categoria: string;
  total_equipos: number;
  p50: number;
  p75: number;
  p90: number;
  promedio: number;
  uso_minimo: number;
  uso_maximo: number;
}

// ─── Tendencia P75 ───────────────────────────────────────────
export interface TendenciaP75Response {
  modelos: TendenciaModelo[];
  total: number;
  filtros: ModeloFiltros;
}

export interface TendenciaModelo {
  tipo_equipo_id: number;
  modelo: string;
  marca: string;
  tendencia: TendenciaMes[];
  tendencia_direccion: 'CRECIENTE' | 'ESTABLE' | 'DECRECIENTE';
  pendiente: number;
}

export interface TendenciaMes {
  mes: string;
  p75: number;
  p75_porcentaje: number;
}

// ─── Demanda Insatisfecha ────────────────────────────────────
export interface DemandaResponse {
  modelos: DemandaModelo[];
  total: number;
  resumen: {
    total_rechazos_stock: number;
    total_rechazos_otros?: number;
    total_solicitudes: number;
    desglose_global?: { [motivo: string]: number };
  };
  filtros: ModeloFiltros;
}

export interface DemandaModelo {
  tipo_equipo_id: number;
  modelo: string;
  marca: string;
  categoria: string;
  total_solicitudes: number;
  rechazos_stock: number;
  rechazos_otros: number;
  tasa_rechazo_stock_promedio: number;
  tasa_rechazo_porcentaje: number;
  desglose_motivos?: { [motivo: string]: number };
  meses: DemandaMes[];
}

export interface DemandaMes {
  mes: string;
  rechazos_stock: number;
  total_solicitudes: number;
  tasa_porcentaje: number;
}

// ─── Tiempo de Espera ────────────────────────────────────────
export interface TiempoEsperaResponse {
  modelos: TiempoEsperaModelo[];
  total: number;
  filtros: ModeloFiltros;
}

export interface TiempoEsperaModelo {
  tipo_equipo_id: number;
  modelo: string;
  marca: string;
  categoria: string;
  promedio_horas: number;
  maximo_horas: number;
  total_prestamos: number;
}

// ─── Mantenimientos ──────────────────────────────────────────
export interface MantenimientosResponse {
  modelos: MantenimientoModelo[];
  total: number;
  total_incidentes: number;
  filtros: ModeloFiltros;
}

export interface MantenimientoModelo {
  tipo_equipo_id: number;
  modelo: string;
  marca: string;
  categoria: string;
  total_incidentes: number;
  fallas: FallaDetalle[];
}

export interface FallaDetalle {
  tipo_falla_id: number;
  codigo: string;
  nombre: string;
  categoria: string;
  total: number;
}

// ─── Downtime ────────────────────────────────────────────────
export interface DowntimeResponse {
  modelos: DowntimeModelo[];
  total: number;
  resumen: { total_horas: number; total_dias: number; total_incidentes: number };
  filtros: ModeloFiltros;
}

export interface DowntimeModelo {
  tipo_equipo_id: number;
  modelo: string;
  marca: string;
  categoria: string;
  total_equipos: number;
  total_horas: number;
  total_incidentes: number;
  promedio_horas_por_incidente: number;
  porcentaje_downtime?: number;
  downtime_por_unidad_horas?: number;
}

// ─── Incidentes por Exposición ───────────────────────────────
export interface IncidentesResponse {
  modelos: IncidenteModelo[];
  total: number;
  filtros: ModeloFiltros;
}

export interface IncidenteModelo {
  tipo_equipo_id: number;
  modelo: string;
  marca: string;
  categoria: string;
  total_incidentes: number;
  dias_uso_total: number;
  incidentes_por_1000_dias: number;
}

// ─── Fallas por Categoría ────────────────────────────────────
export interface FallasCategoriaResponse {
  categorias: FallaCategoria[];
  total: number;
  filtros: ModeloFiltros;
}

export interface FallaCategoria {
  categoria_falla: string;
  total: number;
  porcentaje: number;
}

// ─── Ranking Marcas ──────────────────────────────────────────
export interface MarcasResponse {
  marcas: MarcaRanking[];
  total: number;
  filtros: ModeloFiltros;
}

export interface MarcaRanking {
  marca: string;
  total_modelos: number;
  total_equipos: number;
  uso_promedio: number;
  incidentes_por_1000_dias: number;
  downtime_promedio_horas: number;
}

// ─── Datos para Gráficos ─────────────────────────────────────
export interface BoxplotDatos {
  datos: BoxplotItem[];
  eje_y: string;
  titulo: string;
}

export interface BoxplotItem {
  modelo: string;
  total_equipos?: number;
  min: number;
  p50: number;
  p75: number;
  p90: number;
  max: number;
  promedio: number;
}

export interface SerieP75Response {
  series: SerieP75[];
  eje_y: string;
  titulo: string;
}

export interface SerieP75 {
  nombre: string;
  datos: { x: string; y: number }[];
  tendencia: 'CRECIENTE' | 'ESTABLE' | 'DECRECIENTE';
  pendiente: number;
}

// ─── Recomendaciones ─────────────────────────────────────────
export interface RecomendacionesResponse {
  tabla: RecomendacionItem[];
  agrupado: {
    COMPRAR: RecomendacionItem[];
    MONITOREAR: RecomendacionItem[];
    NO_COMPRAR: RecomendacionItem[];
  };
  resumen: { comprar: number; monitorear: number; no_comprar: number };
  filtros: ModeloFiltros;
}

export interface RecomendacionItem {
  tipo_equipo_id: number;
  modelo: string;
  marca: string;
  categoria: string;
  score: number;
  recomendacion: 'COMPRAR' | 'MONITOREAR' | 'NO_COMPRAR';
  explicacion: string;
  p75_uso: number;        // already percentage (e.g. 75.5 = 75.5%)
  tasa_rechazo: number;   // already percentage (e.g. 12.3 = 12.3%)
  tendencia: string;      // lowercase: 'creciente', 'estable', 'decreciente'
  incidentes_1000d: number;
}

// ─── Tab activa del dashboard ────────────────────────────────
export type DashboardTab = 'saturacion' | 'demanda' | 'mantenimiento' | 'score';
