<?php

namespace App\Services\Reportes;

use Carbon\Carbon;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\DB;
use App\Enums\EstadoEquipo;
use App\Enums\EstadoPrestamo;
use App\Enums\MotivoRechazo;

/**
 * Servicio de Estadísticas por MODELO (tipo_equipo) para decisiones de compra.
 * 
 * Este servicio implementa métricas normalizadas para evaluar:
 * - ¿Qué modelos comprar y cuántos?
 * - ¿Qué modelos/marcas evitar por fallas?
 * - ¿Qué modelos están saturados vs subutilizados?
 * - ¿Qué modelos generan demanda insatisfecha?
 * 
 * IMPORTANTE: Todas las métricas son por TIPO_EQUIPO (modelo), NO por equipo físico.
 * 
 * Métricas implementadas:
 * A) Uso y Saturación (normalizados por tiempo)
 * B) Demanda Insatisfecha (rechazos por stock)
 * C) Fiabilidad y Mantenimiento (usando auditoría)
 * D) Rankings por Marca
 * E) Score de Prioridad de Compra
 */
class EstadisticasModeloService
{
    // =========================================================================
    // CONSTANTES Y CONFIGURACIÓN
    // =========================================================================
    
    /** Pesos del score de prioridad de compra */
    private const PESO_PRESION_USO = 0.35;
    private const PESO_DEMANDA_INSATISFECHA = 0.25;
    private const PESO_TENDENCIA = 0.20;
    private const PESO_RIESGO_DOWNTIME = 0.10;
    private const PESO_FIABILIDAD = 0.10;

    /** Umbrales para normalización del score */
    private const UMBRAL_USO_ALTO = 0.75;      // P75 >= 75% = presión alta
    private const UMBRAL_RECHAZO_ALTO = 0.10;  // >= 10% rechazos = demanda alta
    private const UMBRAL_INCIDENTES_ALTO = 50; // >= 50 incidentes/1000 días = riesgo
    private const UMBRAL_DOWNTIME_ALTO = 720;  // >= 720 horas (30 días) = riesgo alto

    // =========================================================================
    // A) USO Y SATURACIÓN
    // =========================================================================

    /**
     * Calcula el uso mensual normalizado por MODELO.
     * 
     * Fórmula:
     * uso_mensual_modelo = (∑ días prestados de activos del modelo en el mes)
     *                      / (Nº activos del modelo × días del mes)
     * 
     * @param int|null $tipoEquipoId Filtrar por modelo específico (null = todos)
     * @param string|null $desde Fecha inicio (Y-m-d)
     * @param string|null $hasta Fecha fin (Y-m-d)
     * @return Collection
     */
    public function usoMensualPorModelo(
        ?int $tipoEquipoId = null,
        ?string $desde = null,
        ?string $hasta = null
    ): Collection {
        $fechaInicio = $desde ? Carbon::parse($desde) : Carbon::now()->subMonths(12);
        $fechaFin = $hasta ? Carbon::parse($hasta) : Carbon::now();

        // Generar todos los meses del rango
        $meses = [];
        $current = $fechaInicio->copy()->startOfMonth();
        while ($current <= $fechaFin) {
            $meses[] = $current->format('Y-m');
            $current->addMonth();
        }

        // Query base: días prestados por modelo y mes
        $query = DB::table('prestamos as p')
            ->join('prestamo_equipo as pe', 'pe.idPrestamo', '=', 'p.idPrestamo')
            ->join('equipos as e', 'e.id', '=', 'pe.idEquipo')
            ->join('tipo_equipos as te', 'te.id', '=', 'e.tipo_equipo_id')
            ->join('categorias as c', 'c.id', '=', 'te.categoria_id')
            ->whereIn('p.estado', [
                EstadoPrestamo::APROBADO,
                EstadoPrestamo::PENDIENTE_ENTREGA,
                EstadoPrestamo::ENTREGADO,
                EstadoPrestamo::DEVUELTO
            ])
            ->whereNotNull('p.fecha_inicio')
            ->whereNotNull('p.fecha_fin')
            ->where('p.fecha_inicio', '<=', $fechaFin)
            ->where('p.fecha_fin', '>=', $fechaInicio);

        if ($tipoEquipoId) {
            $query->where('te.id', $tipoEquipoId);
        }

        // Calcular días prestados por modelo y mes
        $prestamos = $query->select(
            'te.id as tipo_equipo_id',
            'te.nombre as modelo',
            'te.marca',
            'c.nombre as categoria',
            'e.id as equipo_id',
            'p.fecha_inicio',
            'p.fecha_fin'
        )->get();

        // Contar equipos por modelo
        $equiposPorModeloQuery = DB::table('equipos as e')
            ->join('tipo_equipos as te', 'te.id', '=', 'e.tipo_equipo_id')
            ->whereNull('e.deleted_at')
            ->whereNotIn('e.estado', [EstadoEquipo::DADO_DE_BAJA]);

        if ($tipoEquipoId) {
            $equiposPorModeloQuery->where('te.id', $tipoEquipoId);
        }

        $equiposPorModelo = $equiposPorModeloQuery
            ->select('te.id as tipo_equipo_id', DB::raw('COUNT(e.id) as total_equipos'))
            ->groupBy('te.id')
            ->pluck('total_equipos', 'tipo_equipo_id');

        // Procesar días prestados por modelo y mes
        $resultados = [];
        
        foreach ($prestamos as $prestamo) {
            $inicio = Carbon::parse($prestamo->fecha_inicio);
            $fin = Carbon::parse($prestamo->fecha_fin);
            
            // Iterar cada mes del préstamo
            $current = $inicio->copy()->startOfMonth();
            while ($current <= $fin) {
                $mes = $current->format('Y-m');
                
                if (in_array($mes, $meses)) {
                    $inicioMes = $current->copy()->startOfMonth();
                    $finMes = $current->copy()->endOfMonth();
                    
                    // Calcular días en este mes específico
                    $inicioReal = $inicio->gt($inicioMes) ? $inicio : $inicioMes;
                    $finReal = $fin->lt($finMes) ? $fin : $finMes;
                    $dias = max(0, $inicioReal->diffInDays($finReal) + 1);
                    
                    $key = $prestamo->tipo_equipo_id . '-' . $mes;
                    if (!isset($resultados[$key])) {
                        $resultados[$key] = [
                            'tipo_equipo_id' => $prestamo->tipo_equipo_id,
                            'modelo' => $prestamo->modelo,
                            'marca' => $prestamo->marca,
                            'categoria' => $prestamo->categoria,
                            'mes' => $mes,
                            'dias_prestados' => 0,
                            'total_equipos' => $equiposPorModelo[$prestamo->tipo_equipo_id] ?? 1,
                        ];
                    }
                    $resultados[$key]['dias_prestados'] += $dias;
                }
                
                $current->addMonth();
            }
        }

        // Calcular uso normalizado
        return collect($resultados)->map(function ($item) {
            $diasMes = Carbon::parse($item['mes'] . '-01')->daysInMonth;
            $diasDisponibles = $item['total_equipos'] * $diasMes;
            $usoNormalizado = $diasDisponibles > 0 
                ? round($item['dias_prestados'] / $diasDisponibles, 4) 
                : 0;

            return [
                'tipo_equipo_id' => $item['tipo_equipo_id'],
                'modelo' => $item['modelo'],
                'marca' => $item['marca'],
                'categoria' => $item['categoria'],
                'mes' => $item['mes'],
                'dias_prestados' => $item['dias_prestados'],
                'total_equipos' => $item['total_equipos'],
                'dias_disponibles' => $diasDisponibles,
                'uso_normalizado' => $usoNormalizado,
                'uso_porcentaje' => round($usoNormalizado * 100, 2),
            ];
        })->values();
    }

    /**
     * Calcula percentiles de uso (P50, P75, P90) por MODELO.
     * 
     * Calcula el "uso por activo" de cada equipo del modelo en el período,
     * luego obtiene los percentiles de esa distribución.
     * 
     * uso_activo = días_prestado / días_disponibles (restando mantenimiento)
     * 
     * @param int|null $tipoEquipoId Filtrar por modelo específico
     * @param string|null $desde Fecha inicio
     * @param string|null $hasta Fecha fin
     * @return Collection
     */
    public function percentilesPorModelo(
        ?int $tipoEquipoId = null,
        ?string $desde = null,
        ?string $hasta = null
    ): Collection {
        $fechaInicio = $desde ? Carbon::parse($desde) : Carbon::now()->subMonths(12);
        $fechaFin = $hasta ? Carbon::parse($hasta) : Carbon::now();
        $diasPeriodo = $fechaInicio->diffInDays($fechaFin) + 1;

        // Obtener todos los equipos con su modelo
        $equiposQuery = DB::table('equipos as e')
            ->join('tipo_equipos as te', 'te.id', '=', 'e.tipo_equipo_id')
            ->join('categorias as c', 'c.id', '=', 'te.categoria_id')
            ->whereNull('e.deleted_at')
            ->select(
                'e.id as equipo_id',
                'te.id as tipo_equipo_id',
                'te.nombre as modelo',
                'te.marca',
                'c.nombre as categoria',
                'e.created_at as fecha_alta'
            );

        if ($tipoEquipoId) {
            $equiposQuery->where('te.id', $tipoEquipoId);
        }

        $equipos = $equiposQuery->get();

        // Calcular días prestados por equipo
        $diasPrestadosPorEquipo = $this->calcularDiasPrestadosPorEquipo(
            $equipos->pluck('equipo_id')->toArray(),
            $fechaInicio,
            $fechaFin
        );

        // Calcular días en mantenimiento por equipo
        $diasMantenimientoPorEquipo = $this->calcularDiasMantenimientoPorEquipo(
            $equipos->pluck('equipo_id')->toArray(),
            $fechaInicio,
            $fechaFin
        );

        // Agrupar por modelo y calcular uso por activo
        $usosPorModelo = [];
        
        foreach ($equipos as $equipo) {
            $fechaAlta = Carbon::parse($equipo->fecha_alta);
            $inicioReal = $fechaAlta->gt($fechaInicio) ? $fechaAlta : $fechaInicio;
            $diasDisponiblesBase = max(1, $inicioReal->diffInDays($fechaFin) + 1);
            
            $diasMantenimiento = $diasMantenimientoPorEquipo[$equipo->equipo_id] ?? 0;
            $diasDisponibles = max(1, $diasDisponiblesBase - $diasMantenimiento);
            
            $diasPrestados = $diasPrestadosPorEquipo[$equipo->equipo_id] ?? 0;
            $usoActivo = min(1, $diasPrestados / $diasDisponibles);
            
            if (!isset($usosPorModelo[$equipo->tipo_equipo_id])) {
                $usosPorModelo[$equipo->tipo_equipo_id] = [
                    'tipo_equipo_id' => $equipo->tipo_equipo_id,
                    'modelo' => $equipo->modelo,
                    'marca' => $equipo->marca,
                    'categoria' => $equipo->categoria,
                    'usos' => [],
                ];
            }
            
            $usosPorModelo[$equipo->tipo_equipo_id]['usos'][] = $usoActivo;
        }

        // Calcular percentiles
        return collect($usosPorModelo)->map(function ($item) {
            $usos = collect($item['usos'])->sort()->values();
            $n = $usos->count();
            
            if ($n === 0) {
                return array_merge($item, [
                    'total_equipos' => 0,
                    'p50' => 0,
                    'p75' => 0,
                    'p90' => 0,
                    'promedio' => 0,
                    'uso_minimo' => 0,
                    'uso_maximo' => 0,
                ]);
            }

            // Calcular percentiles
            $p50Index = (int) floor($n * 0.50);
            $p75Index = (int) floor($n * 0.75);
            $p90Index = (int) floor($n * 0.90);

            unset($item['usos']);

            return array_merge($item, [
                'total_equipos' => $n,
                'p50' => round($usos[$p50Index] ?? 0, 4),
                'p75' => round($usos[$p75Index] ?? 0, 4),
                'p90' => round($usos[min($p90Index, $n - 1)] ?? 0, 4),
                'promedio' => round($usos->avg(), 4),
                'uso_minimo' => round($usos->min(), 4),
                'uso_maximo' => round($usos->max(), 4),
                'p50_porcentaje' => round(($usos[$p50Index] ?? 0) * 100, 2),
                'p75_porcentaje' => round(($usos[$p75Index] ?? 0) * 100, 2),
                'p90_porcentaje' => round(($usos[min($p90Index, $n - 1)] ?? 0) * 100, 2),
            ]);
        })->values();
    }

    /**
     * Tendencia del P75 mensual por modelo (últimos N meses).
     * 
     * @param int|null $tipoEquipoId
     * @param int $meses Número de meses a analizar
     * @return Collection
     */
    public function tendenciaP75PorModelo(?int $tipoEquipoId = null, int $meses = 12): Collection
    {
        $resultado = [];
        
        for ($i = $meses - 1; $i >= 0; $i--) {
            $mesInicio = Carbon::now()->subMonths($i)->startOfMonth();
            $mesFin = Carbon::now()->subMonths($i)->endOfMonth();
            
            $percentiles = $this->percentilesPorModelo(
                $tipoEquipoId,
                $mesInicio->format('Y-m-d'),
                $mesFin->format('Y-m-d')
            );
            
            foreach ($percentiles as $p) {
                $key = $p['tipo_equipo_id'];
                if (!isset($resultado[$key])) {
                    $resultado[$key] = [
                        'tipo_equipo_id' => $p['tipo_equipo_id'],
                        'modelo' => $p['modelo'],
                        'marca' => $p['marca'],
                        'categoria' => $p['categoria'],
                        'tendencia' => [],
                    ];
                }
                
                $resultado[$key]['tendencia'][] = [
                    'mes' => $mesInicio->format('Y-m'),
                    'p75' => $p['p75'],
                    'p75_porcentaje' => $p['p75_porcentaje'],
                ];
            }
        }

        // Calcular pendiente de tendencia
        return collect($resultado)->map(function ($item) {
            $tendencia = collect($item['tendencia']);
            $n = $tendencia->count();
            
            if ($n < 2) {
                $item['pendiente'] = 0;
                $item['tendencia_direccion'] = 'estable';
                return $item;
            }

            // Regresión lineal simple
            $xSum = 0; $ySum = 0; $xySum = 0; $x2Sum = 0;
            foreach ($tendencia as $i => $t) {
                $x = $i;
                $y = $t['p75'];
                $xSum += $x;
                $ySum += $y;
                $xySum += $x * $y;
                $x2Sum += $x * $x;
            }
            
            $denominator = $n * $x2Sum - $xSum * $xSum;
            $pendiente = $denominator != 0 
                ? ($n * $xySum - $xSum * $ySum) / $denominator 
                : 0;

            $item['pendiente'] = round($pendiente, 6);
            $item['tendencia_direccion'] = $pendiente > 0.01 ? 'creciente' 
                : ($pendiente < -0.01 ? 'decreciente' : 'estable');
            
            return $item;
        })->values();
    }

    // =========================================================================
    // B) DEMANDA INSATISFECHA
    // =========================================================================

    /**
     * Calcula rechazos por falta de stock por MODELO.
     * 
     * @param int|null $tipoEquipoId
     * @param string|null $desde
     * @param string|null $hasta
     * @return Collection
     */
    public function rechazosStockPorModelo(
        ?int $tipoEquipoId = null,
        ?string $desde = null,
        ?string $hasta = null
    ): Collection {
        $fechaInicio = $desde ? Carbon::parse($desde) : Carbon::now()->subMonths(12);
        $fechaFin = $hasta ? Carbon::parse($hasta) : Carbon::now();

        // Obtener rechazos usando la fecha del historial (momento exacto del rechazo)
        $query = DB::table('prestamos as p')
            ->join('prestamo_historial as ph', function($join) {
                $join->on('ph.idPrestamo', '=', 'p.idPrestamo')
                     ->where('ph.estado_nuevo', EstadoPrestamo::RECHAZADO);
            })
            ->join('prestamo_equipo as pe', 'pe.idPrestamo', '=', 'p.idPrestamo')
            ->join('equipos as e', 'e.id', '=', 'pe.idEquipo')
            ->join('tipo_equipos as te', 'te.id', '=', 'e.tipo_equipo_id')
            ->join('categorias as c', 'c.id', '=', 'te.categoria_id')
            ->where('p.estado', EstadoPrestamo::RECHAZADO)
            ->whereBetween('ph.created_at', [$fechaInicio, $fechaFin])
            ->select(
                'te.id as tipo_equipo_id',
                'te.nombre as modelo',
                'te.marca',
                'c.nombre as categoria',
                'p.motivo_rechazo',
                DB::raw('DATE_FORMAT(ph.created_at, "%Y-%m") as mes'),
                DB::raw('COUNT(DISTINCT p.idPrestamo) as total_rechazos')
            )
            ->groupBy('te.id', 'te.nombre', 'te.marca', 'c.nombre', 'p.motivo_rechazo', DB::raw('DATE_FORMAT(ph.created_at, "%Y-%m")'));

        if ($tipoEquipoId) {
            $query->where('te.id', $tipoEquipoId);
        }

        $rechazos = $query->get();

        // Obtener total de solicitudes por modelo/mes usando la fecha de creación de la solicitud
        $solicitudesQuery = DB::table('prestamos as p')
            ->join('prestamo_equipo as pe', 'pe.idPrestamo', '=', 'p.idPrestamo')
            ->join('equipos as e', 'e.id', '=', 'pe.idEquipo')
            ->join('tipo_equipos as te', 'te.id', '=', 'e.tipo_equipo_id')
            ->whereBetween('p.created_at', [$fechaInicio, $fechaFin])
            ->select(
                'te.id as tipo_equipo_id',
                DB::raw('DATE_FORMAT(p.created_at, "%Y-%m") as mes'),
                DB::raw('COUNT(DISTINCT p.idPrestamo) as total_solicitudes')
            )
            ->groupBy('te.id', DB::raw('DATE_FORMAT(p.created_at, "%Y-%m")'));

        if ($tipoEquipoId) {
            $solicitudesQuery->where('te.id', $tipoEquipoId);
        }

        $solicitudes = $solicitudesQuery->get()->keyBy(function ($item) {
            return $item->tipo_equipo_id . '-' . $item->mes;
        });

        // Procesar y calcular tasas
        $resultado = [];
        foreach ($rechazos as $r) {
            $key = $r->tipo_equipo_id . '-' . $r->mes;
            $totalSolicitudes = $solicitudes[$key]->total_solicitudes ?? 1;
            
            if (!isset($resultado[$key])) {
                $resultado[$key] = [
                    'tipo_equipo_id' => $r->tipo_equipo_id,
                    'modelo' => $r->modelo,
                    'marca' => $r->marca,
                    'categoria' => $r->categoria,
                    'mes' => $r->mes,
                    'total_solicitudes' => $totalSolicitudes,
                    'rechazos_stock' => 0,
                    'rechazos_otros' => 0,
                    'rechazos_total' => 0,
                    'desglose_motivos' => [],
                ];
            }

            // Clasificar por motivo
            if (in_array($r->motivo_rechazo, MotivoRechazo::demandaInsatisfecha())) {
                $resultado[$key]['rechazos_stock'] += $r->total_rechazos;
            } else {
                $resultado[$key]['rechazos_otros'] += $r->total_rechazos;
            }
            $resultado[$key]['rechazos_total'] += $r->total_rechazos;

            // Agregar al desglose por motivo específico
            $motivo = $r->motivo_rechazo ?? 'DESCONOCIDO';
            $resultado[$key]['desglose_motivos'][$motivo] = 
                ($resultado[$key]['desglose_motivos'][$motivo] ?? 0) + $r->total_rechazos;
        }

        return collect($resultado)->map(function ($item) {
            $item['tasa_rechazo_stock'] = $item['total_solicitudes'] > 0
                ? round($item['rechazos_stock'] / $item['total_solicitudes'], 4)
                : 0;
            $item['tasa_rechazo_stock_porcentaje'] = round($item['tasa_rechazo_stock'] * 100, 2);
            return $item;
        })->values();
    }

    /**
     * Tiempo de espera promedio (solicitud → entrega) por modelo.
     * 
     * @param int|null $tipoEquipoId
     * @param string|null $desde
     * @param string|null $hasta
     * @return Collection
     */
    public function tiempoEsperaPorModelo(
        ?int $tipoEquipoId = null,
        ?string $desde = null,
        ?string $hasta = null
    ): Collection {
        $fechaInicio = $desde ? Carbon::parse($desde) : Carbon::now()->subMonths(12);
        $fechaFin = $hasta ? Carbon::parse($hasta) : Carbon::now();

        $query = DB::table('prestamos as p')
            ->join('prestamo_equipo as pe', 'pe.idPrestamo', '=', 'p.idPrestamo')
            ->join('equipos as e', 'e.id', '=', 'pe.idEquipo')
            ->join('tipo_equipos as te', 'te.id', '=', 'e.tipo_equipo_id')
            ->join('categorias as c', 'c.id', '=', 'te.categoria_id')
            ->whereIn('p.estado', [EstadoPrestamo::ENTREGADO, EstadoPrestamo::DEVUELTO])
            ->whereNotNull('p.fecha_entrega_real')
            ->whereBetween('p.created_at', [$fechaInicio, $fechaFin])
            ->select(
                'te.id as tipo_equipo_id',
                'te.nombre as modelo',
                'te.marca',
                'c.nombre as categoria',
                DB::raw('AVG(TIMESTAMPDIFF(HOUR, p.created_at, p.fecha_entrega_real)) as promedio_horas'),
                DB::raw('MIN(TIMESTAMPDIFF(HOUR, p.created_at, p.fecha_entrega_real)) as minimo_horas'),
                DB::raw('MAX(TIMESTAMPDIFF(HOUR, p.created_at, p.fecha_entrega_real)) as maximo_horas'),
                DB::raw('COUNT(DISTINCT p.idPrestamo) as total_entregas')
            )
            ->groupBy('te.id', 'te.nombre', 'te.marca', 'c.nombre');

        if ($tipoEquipoId) {
            $query->where('te.id', $tipoEquipoId);
        }

        return $query->get()->map(function ($item) {
            return [
                'tipo_equipo_id' => $item->tipo_equipo_id,
                'modelo' => $item->modelo,
                'marca' => $item->marca,
                'categoria' => $item->categoria,
                'promedio_horas' => round($item->promedio_horas ?? 0, 1),
                'promedio_dias' => round(($item->promedio_horas ?? 0) / 24, 2),
                'minimo_horas' => round($item->minimo_horas ?? 0, 1),
                'maximo_horas' => round($item->maximo_horas ?? 0, 1),
                'total_entregas' => $item->total_entregas,
            ];
        });
    }

    // =========================================================================
    // C) FIABILIDAD Y MANTENIMIENTO
    // =========================================================================

    /**
     * Eventos de mantenimiento por modelo y tipo de falla.
     * 
     * @param int|null $tipoEquipoId
     * @param string|null $desde
     * @param string|null $hasta
     * @return Collection
     */
    public function mantenimientosPorModeloYFalla(
        ?int $tipoEquipoId = null,
        ?string $desde = null,
        ?string $hasta = null
    ): Collection {
        $fechaInicio = $desde ? Carbon::parse($desde) : Carbon::now()->subMonths(12);
        $fechaFin = $hasta ? Carbon::parse($hasta) : Carbon::now();

        $query = DB::table('equipo_estado_eventos as eee')
            ->join('equipos as e', 'e.id', '=', 'eee.equipo_id')
            ->join('tipo_equipos as te', 'te.id', '=', 'e.tipo_equipo_id')
            ->join('categorias as c', 'c.id', '=', 'te.categoria_id')
            ->leftJoin('tipos_falla as tf', 'tf.id', '=', 'eee.tipo_falla_id')
            ->where('eee.estado_nuevo', EstadoEquipo::MANTENIMIENTO)
            ->whereBetween('eee.fecha_evento', [$fechaInicio, $fechaFin])
            ->select(
                'te.id as tipo_equipo_id',
                'te.nombre as modelo',
                'te.marca',
                'c.nombre as categoria',
                'tf.id as tipo_falla_id',
                'tf.codigo as falla_codigo',
                'tf.nombre as falla_nombre',
                'tf.categoria as falla_categoria',
                DB::raw('DATE_FORMAT(eee.fecha_evento, "%Y-%m") as mes'),
                DB::raw('COUNT(*) as total_incidentes')
            )
            ->groupBy(
                'te.id', 'te.nombre', 'te.marca', 'c.nombre',
                'tf.id', 'tf.codigo', 'tf.nombre', 'tf.categoria',
                DB::raw('DATE_FORMAT(eee.fecha_evento, "%Y-%m")')
            );

        if ($tipoEquipoId) {
            $query->where('te.id', $tipoEquipoId);
        }

        return $query->get();
    }

    /**
     * Downtime (tiempo en mantenimiento) por modelo.
     * 
     * Calcula intervalos desde evento MANTENIMIENTO hasta salida (DISPONIBLE u otro).
     * 
     * @param int|null $tipoEquipoId
     * @param string|null $desde
     * @param string|null $hasta
     * @return Collection
     */
    public function downtimePorModelo(
        ?int $tipoEquipoId = null,
        ?string $desde = null,
        ?string $hasta = null
    ): Collection {
        $fechaInicio = $desde ? Carbon::parse($desde) : Carbon::now()->subMonths(12);
        $fechaFin = $hasta ? Carbon::parse($hasta) : Carbon::now();

        // Obtener todos los eventos de mantenimiento
        $query = DB::table('equipo_estado_eventos as eee')
            ->join('equipos as e', 'e.id', '=', 'eee.equipo_id')
            ->join('tipo_equipos as te', 'te.id', '=', 'e.tipo_equipo_id')
            ->join('categorias as c', 'c.id', '=', 'te.categoria_id')
            ->whereBetween('eee.fecha_evento', [$fechaInicio, $fechaFin])
            ->where(function ($q) {
                $q->where('eee.estado_nuevo', EstadoEquipo::MANTENIMIENTO)
                  ->orWhere('eee.estado_anterior', EstadoEquipo::MANTENIMIENTO);
            })
            ->orderBy('eee.equipo_id')
            ->orderBy('eee.fecha_evento')
            ->select(
                'e.id as equipo_id',
                'te.id as tipo_equipo_id',
                'te.nombre as modelo',
                'te.marca',
                'c.nombre as categoria',
                'eee.estado_anterior',
                'eee.estado_nuevo',
                'eee.fecha_evento'
            );

        if ($tipoEquipoId) {
            $query->where('te.id', $tipoEquipoId);
        }

        $eventos = $query->get();

        // Calcular downtime por equipo
        $downtimePorModelo = [];
        $equipoEnMantenimiento = [];

        foreach ($eventos as $evento) {
            if ($evento->estado_nuevo === EstadoEquipo::MANTENIMIENTO) {
                // Entrada a mantenimiento
                $equipoEnMantenimiento[$evento->equipo_id] = [
                    'inicio' => Carbon::parse($evento->fecha_evento),
                    'tipo_equipo_id' => $evento->tipo_equipo_id,
                    'modelo' => $evento->modelo,
                    'marca' => $evento->marca,
                    'categoria' => $evento->categoria,
                ];
            } elseif ($evento->estado_anterior === EstadoEquipo::MANTENIMIENTO) {
                // Salida de mantenimiento
                if (isset($equipoEnMantenimiento[$evento->equipo_id])) {
                    $inicio = $equipoEnMantenimiento[$evento->equipo_id]['inicio'];
                    $fin = Carbon::parse($evento->fecha_evento);
                    $horasDowntime = $inicio->diffInHours($fin);

                    $tipoId = $evento->tipo_equipo_id;
                    if (!isset($downtimePorModelo[$tipoId])) {
                        $downtimePorModelo[$tipoId] = [
                            'tipo_equipo_id' => $tipoId,
                            'modelo' => $evento->modelo,
                            'marca' => $evento->marca,
                            'categoria' => $evento->categoria,
                            'total_horas' => 0,
                            'total_incidentes' => 0,
                            'incidentes_detalle' => [],
                        ];
                    }

                    $downtimePorModelo[$tipoId]['total_horas'] += $horasDowntime;
                    $downtimePorModelo[$tipoId]['total_incidentes']++;

                    unset($equipoEnMantenimiento[$evento->equipo_id]);
                }
            }
        }

        // Agregar equipos aún en mantenimiento (downtime parcial)
        foreach ($equipoEnMantenimiento as $equipoId => $data) {
            $horasDowntime = $data['inicio']->diffInHours(Carbon::now());
            $tipoId = $data['tipo_equipo_id'];

            if (!isset($downtimePorModelo[$tipoId])) {
                $downtimePorModelo[$tipoId] = [
                    'tipo_equipo_id' => $tipoId,
                    'modelo' => $data['modelo'],
                    'marca' => $data['marca'],
                    'categoria' => $data['categoria'],
                    'total_horas' => 0,
                    'total_incidentes' => 0,
                    'incidentes_detalle' => [],
                ];
            }

            $downtimePorModelo[$tipoId]['total_horas'] += $horasDowntime;
            $downtimePorModelo[$tipoId]['total_incidentes']++;
            $downtimePorModelo[$tipoId]['equipos_en_mantenimiento'] = 
                ($downtimePorModelo[$tipoId]['equipos_en_mantenimiento'] ?? 0) + 1;
        }

        // Obtener total de equipos por modelo para calcular downtime por unidad
        $equiposPorModelo = DB::table('equipos as e')
            ->join('tipo_equipos as te', 'te.id', '=', 'e.tipo_equipo_id')
            ->whereNull('e.deleted_at')
            ->select('te.id as tipo_equipo_id', DB::raw('COUNT(*) as total'))
            ->groupBy('te.id')
            ->pluck('total', 'tipo_equipo_id');

        return collect($downtimePorModelo)->map(function ($item) use ($equiposPorModelo) {
            $totalEquipos = $equiposPorModelo[$item['tipo_equipo_id']] ?? 1;
            $item['total_equipos'] = $totalEquipos;
            $item['total_dias'] = round($item['total_horas'] / 24, 2);
            $item['promedio_horas_por_incidente'] = $item['total_incidentes'] > 0
                ? round($item['total_horas'] / $item['total_incidentes'], 2)
                : 0;
            $item['downtime_por_unidad_horas'] = round($item['total_horas'] / $totalEquipos, 2);
            unset($item['incidentes_detalle']);
            return $item;
        })->values();
    }

    /**
     * Tasa de incidentes por exposición (por 1000 días disponibles).
     * 
     * incidentes_por_1000_dias = (eventos_mantto / días_disponibles_total) × 1000
     * 
     * @param int|null $tipoEquipoId
     * @param string|null $desde
     * @param string|null $hasta
     * @return Collection
     */
    public function incidentesPorExposicion(
        ?int $tipoEquipoId = null,
        ?string $desde = null,
        ?string $hasta = null
    ): Collection {
        $fechaInicio = $desde ? Carbon::parse($desde) : Carbon::now()->subMonths(12);
        $fechaFin = $hasta ? Carbon::parse($hasta) : Carbon::now();
        $diasPeriodo = $fechaInicio->diffInDays($fechaFin) + 1;

        // Contar incidentes (entradas a mantenimiento) por modelo
        $incidentesQuery = DB::table('equipo_estado_eventos as eee')
            ->join('equipos as e', 'e.id', '=', 'eee.equipo_id')
            ->join('tipo_equipos as te', 'te.id', '=', 'e.tipo_equipo_id')
            ->join('categorias as c', 'c.id', '=', 'te.categoria_id')
            ->where('eee.estado_nuevo', EstadoEquipo::MANTENIMIENTO)
            ->whereBetween('eee.fecha_evento', [$fechaInicio, $fechaFin])
            ->select(
                'te.id as tipo_equipo_id',
                'te.nombre as modelo',
                'te.marca',
                'c.nombre as categoria',
                DB::raw('COUNT(*) as total_incidentes')
            )
            ->groupBy('te.id', 'te.nombre', 'te.marca', 'c.nombre');

        if ($tipoEquipoId) {
            $incidentesQuery->where('te.id', $tipoEquipoId);
        }

        $incidentes = $incidentesQuery->get()->keyBy('tipo_equipo_id');

        // Obtener equipos por modelo
        $equiposQuery = DB::table('equipos as e')
            ->join('tipo_equipos as te', 'te.id', '=', 'e.tipo_equipo_id')
            ->join('categorias as c', 'c.id', '=', 'te.categoria_id')
            ->whereNull('e.deleted_at')
            ->select(
                'te.id as tipo_equipo_id',
                'te.nombre as modelo',
                'te.marca',
                'c.nombre as categoria',
                DB::raw('COUNT(*) as total_equipos')
            )
            ->groupBy('te.id', 'te.nombre', 'te.marca', 'c.nombre');

        if ($tipoEquipoId) {
            $equiposQuery->where('te.id', $tipoEquipoId);
        }

        return $equiposQuery->get()->map(function ($item) use ($incidentes, $diasPeriodo) {
            $tipoId = $item->tipo_equipo_id;
            $totalIncidentes = $incidentes[$tipoId]->total_incidentes ?? 0;
            $diasDisponibles = $item->total_equipos * $diasPeriodo;

            return [
                'tipo_equipo_id' => $tipoId,
                'modelo' => $item->modelo,
                'marca' => $item->marca,
                'categoria' => $item->categoria,
                'total_equipos' => $item->total_equipos,
                'total_incidentes' => $totalIncidentes,
                'dias_disponibles' => $diasDisponibles,
                'incidentes_por_1000_dias' => $diasDisponibles > 0
                    ? round(($totalIncidentes / $diasDisponibles) * 1000, 2)
                    : 0,
            ];
        });
    }

    /**
     * Distribución de fallas por categoría.
     * 
     * @param int|null $tipoEquipoId
     * @param string|null $desde
     * @param string|null $hasta
     * @return Collection
     */
    public function distribucionFallasPorCategoria(
        ?int $tipoEquipoId = null,
        ?string $desde = null,
        ?string $hasta = null
    ): Collection {
        $fechaInicio = $desde ? Carbon::parse($desde) : Carbon::now()->subMonths(12);
        $fechaFin = $hasta ? Carbon::parse($hasta) : Carbon::now();

        $query = DB::table('equipo_estado_eventos as eee')
            ->join('equipos as e', 'e.id', '=', 'eee.equipo_id')
            ->join('tipo_equipos as te', 'te.id', '=', 'e.tipo_equipo_id')
            ->leftJoin('tipos_falla as tf', 'tf.id', '=', 'eee.tipo_falla_id')
            ->where('eee.estado_nuevo', EstadoEquipo::MANTENIMIENTO)
            ->whereBetween('eee.fecha_evento', [$fechaInicio, $fechaFin])
            ->select(
                'tf.categoria as falla_categoria',
                DB::raw('COUNT(*) as total')
            )
            ->groupBy('tf.categoria');

        if ($tipoEquipoId) {
            $query->where('te.id', $tipoEquipoId);
        }

        $categorias = \App\Models\TipoFalla::categorias();

        return $query->get()->map(function ($item) use ($categorias) {
            return [
                'categoria' => $item->falla_categoria ?? 'SIN_CATEGORIA',
                'descripcion' => $categorias[$item->falla_categoria] ?? 'Sin categoría',
                'total' => $item->total,
            ];
        });
    }

    // =========================================================================
    // D) RANKINGS POR MARCA
    // =========================================================================

    /**
     * Rankings de marcas con métricas comparativas.
     * 
     * @param string|null $desde
     * @param string|null $hasta
     * @return Collection
     */
    public function rankingPorMarca(?string $desde = null, ?string $hasta = null): Collection
    {
        $fechaInicio = $desde ? Carbon::parse($desde) : Carbon::now()->subMonths(12);
        $fechaFin = $hasta ? Carbon::parse($hasta) : Carbon::now();

        // Obtener uso promedio por marca
        $usoMensual = $this->usoMensualPorModelo(null, $desde, $hasta);
        $usoPorMarca = $usoMensual->groupBy('marca')->map(function ($items, $marca) {
            return [
                'marca' => $marca ?: 'Sin marca',
                'uso_mensual_promedio' => round($items->avg('uso_normalizado'), 4),
                'total_modelos' => $items->unique('tipo_equipo_id')->count(),
            ];
        });

        // Obtener incidentes por marca
        $incidentes = $this->incidentesPorExposicion(null, $desde, $hasta);
        $incidentesPorMarca = $incidentes->groupBy('marca')->map(function ($items, $marca) {
            $totalIncidentes = $items->sum('total_incidentes');
            $diasDisponibles = $items->sum('dias_disponibles');
            return [
                'marca' => $marca ?: 'Sin marca',
                'incidentes_por_1000_dias' => $diasDisponibles > 0
                    ? round(($totalIncidentes / $diasDisponibles) * 1000, 2)
                    : 0,
                'total_equipos' => $items->sum('total_equipos'),
            ];
        });

        // Obtener downtime por marca
        $downtime = $this->downtimePorModelo(null, $desde, $hasta);
        $downtimePorMarca = $downtime->groupBy('marca')->map(function ($items, $marca) {
            $totalHoras = $items->sum('total_horas');
            $totalEquipos = $items->sum('total_equipos');
            return [
                'marca' => $marca ?: 'Sin marca',
                'downtime_total_horas' => round($totalHoras, 2),
                'downtime_por_unidad' => $totalEquipos > 0 
                    ? round($totalHoras / $totalEquipos, 2) 
                    : 0,
            ];
        });

        // Combinar métricas
        $marcas = $usoPorMarca->keys()->merge($incidentesPorMarca->keys())->unique();

        return $marcas->map(function ($marca) use ($usoPorMarca, $incidentesPorMarca, $downtimePorMarca) {
            $uso = $usoPorMarca[$marca] ?? ['uso_mensual_promedio' => 0, 'total_modelos' => 0];
            $inc = $incidentesPorMarca[$marca] ?? ['incidentes_por_1000_dias' => 0, 'total_equipos' => 0];
            $dt = $downtimePorMarca[$marca] ?? ['downtime_total_horas' => 0, 'downtime_por_unidad' => 0];

            return [
                'marca' => $marca,
                'total_modelos' => $uso['total_modelos'],
                'total_equipos' => $inc['total_equipos'],
                'uso_mensual_promedio' => $uso['uso_mensual_promedio'],
                'uso_porcentaje' => round($uso['uso_mensual_promedio'] * 100, 2),
                'incidentes_por_1000_dias' => $inc['incidentes_por_1000_dias'],
                'downtime_por_unidad_horas' => $dt['downtime_por_unidad'],
            ];
        })->sortByDesc('uso_mensual_promedio')->values();
    }

    // =========================================================================
    // E) SCORE DE PRIORIDAD DE COMPRA
    // =========================================================================

    /**
     * Calcula el Score de Prioridad de Compra (0-100) por modelo.
     * 
     * Componentes:
     * - Presión de uso (P75): 35%
     * - Demanda insatisfecha (rechazos stock): 25%
     * - Tendencia (pendiente últimos meses): 20%
     * - Riesgo downtime: 10%
     * - Fiabilidad (incidentes): 10% (inverso)
     * 
     * @param string|null $desde
     * @param string|null $hasta
     * @return Collection
     */
    public function scorePrioridadCompra(?string $desde = null, ?string $hasta = null): Collection
    {
        // Obtener todas las métricas necesarias
        $percentiles = $this->percentilesPorModelo(null, $desde, $hasta)->keyBy('tipo_equipo_id');
        $tendencias = $this->tendenciaP75PorModelo(null, 6)->keyBy('tipo_equipo_id');
        $rechazos = $this->rechazosStockPorModelo(null, $desde, $hasta);
        $downtime = $this->downtimePorModelo(null, $desde, $hasta)->keyBy('tipo_equipo_id');
        $incidentes = $this->incidentesPorExposicion(null, $desde, $hasta)->keyBy('tipo_equipo_id');

        // Agregar rechazos por modelo (sumar todos los meses)
        $rechazosPorModelo = $rechazos->groupBy('tipo_equipo_id')->map(function ($items) {
            return [
                'total_solicitudes' => $items->sum('total_solicitudes'),
                'rechazos_stock' => $items->sum('rechazos_stock'),
                'tasa_rechazo' => $items->sum('total_solicitudes') > 0
                    ? $items->sum('rechazos_stock') / $items->sum('total_solicitudes')
                    : 0,
            ];
        });

        // Obtener todos los modelos
        $modelos = DB::table('tipo_equipos as te')
            ->join('categorias as c', 'c.id', '=', 'te.categoria_id')
            ->select('te.id', 'te.nombre as modelo', 'te.marca', 'c.nombre as categoria')
            ->get();

        return $modelos->map(function ($modelo) use (
            $percentiles, $tendencias, $rechazosPorModelo, $downtime, $incidentes
        ) {
            $id = $modelo->id;

            // Componentes
            $p75 = $percentiles[$id]['p75'] ?? 0;
            $pendiente = $tendencias[$id]['pendiente'] ?? 0;
            $tasaRechazo = $rechazosPorModelo[$id]['tasa_rechazo'] ?? 0;
            $horasDowntime = $downtime[$id]['downtime_por_unidad_horas'] ?? 0;
            $incidentesPor1000 = $incidentes[$id]['incidentes_por_1000_dias'] ?? 0;

            // Normalizar componentes (0-1)
            $scorePresion = min(1, $p75 / self::UMBRAL_USO_ALTO);
            $scoreDemanda = min(1, $tasaRechazo / self::UMBRAL_RECHAZO_ALTO);
            $scoreTendencia = min(1, max(0, ($pendiente + 0.05) / 0.10)); // pendiente normalizada
            $scoreDowntime = min(1, $horasDowntime / self::UMBRAL_DOWNTIME_ALTO);
            $scoreFiabilidad = 1 - min(1, $incidentesPor1000 / self::UMBRAL_INCIDENTES_ALTO);

            // Score ponderado
            $scoreTotal = (
                $scorePresion * self::PESO_PRESION_USO +
                $scoreDemanda * self::PESO_DEMANDA_INSATISFECHA +
                $scoreTendencia * self::PESO_TENDENCIA +
                (1 - $scoreDowntime) * self::PESO_RIESGO_DOWNTIME + // Inverso: menos downtime = mejor
                $scoreFiabilidad * self::PESO_FIABILIDAD
            ) * 100;

            // Determinar recomendación
            $recomendacion = 'MONITOREAR';
            $explicacion = [];

            if ($scoreTotal >= 70) {
                $recomendacion = 'COMPRAR';
                if ($scorePresion > 0.7) $explicacion[] = 'Alta presión de uso (P75=' . round($p75 * 100, 1) . '%)';
                if ($scoreDemanda > 0.5) $explicacion[] = 'Demanda insatisfecha significativa';
                if ($pendiente > 0.02) $explicacion[] = 'Tendencia de uso creciente';
            } elseif ($scoreTotal <= 30) {
                $recomendacion = 'NO_COMPRAR';
                if ($scoreDowntime > 0.5) $explicacion[] = 'Alto downtime por mantenimiento';
                if ($scoreFiabilidad < 0.5) $explicacion[] = 'Baja fiabilidad (muchos incidentes)';
                if ($scorePresion < 0.3) $explicacion[] = 'Bajo nivel de uso';
            } else {
                if ($scoreTendencia > 0.5) $explicacion[] = 'Tendencia ascendente, monitorear';
                if ($scoreDowntime > 0.3) $explicacion[] = 'Atención: downtime moderado';
            }

            if (empty($explicacion)) {
                $explicacion[] = 'Sin alertas significativas';
            }

            return [
                'tipo_equipo_id' => $id,
                'modelo' => $modelo->modelo,
                'marca' => $modelo->marca,
                'categoria' => $modelo->categoria,
                'score' => round($scoreTotal, 1),
                'recomendacion' => $recomendacion,
                'explicacion' => $explicacion,
                'componentes' => [
                    'presion_uso' => [
                        'valor' => round($p75 * 100, 2),
                        'peso' => self::PESO_PRESION_USO * 100,
                        'score_normalizado' => round($scorePresion, 4),
                    ],
                    'demanda_insatisfecha' => [
                        'valor' => round($tasaRechazo * 100, 2),
                        'peso' => self::PESO_DEMANDA_INSATISFECHA * 100,
                        'score_normalizado' => round($scoreDemanda, 4),
                    ],
                    'tendencia' => [
                        'valor' => round($pendiente, 6),
                        'peso' => self::PESO_TENDENCIA * 100,
                        'score_normalizado' => round($scoreTendencia, 4),
                        'direccion' => $tendencias[$id]['tendencia_direccion'] ?? 'estable',
                    ],
                    'riesgo_downtime' => [
                        'valor' => round($horasDowntime, 2),
                        'peso' => self::PESO_RIESGO_DOWNTIME * 100,
                        'score_normalizado' => round(1 - $scoreDowntime, 4),
                    ],
                    'fiabilidad' => [
                        'valor' => round($incidentesPor1000, 2),
                        'peso' => self::PESO_FIABILIDAD * 100,
                        'score_normalizado' => round($scoreFiabilidad, 4),
                    ],
                ],
                'metricas_raw' => [
                    'p75' => $p75,
                    'total_equipos' => $percentiles[$id]['total_equipos'] ?? 0,
                    'rechazos_stock' => $rechazosPorModelo[$id]['rechazos_stock'] ?? 0,
                    'downtime_horas' => $horasDowntime,
                    'incidentes_por_1000_dias' => $incidentesPor1000,
                ],
            ];
        })->sortByDesc('score')->values();
    }

    // =========================================================================
    // RESUMEN EJECUTIVO (KPIs GLOBALES)
    // =========================================================================

    /**
     * Obtiene KPIs globales para el resumen ejecutivo.
     * 
     * @param string|null $desde
     * @param string|null $hasta
     * @return array
     */
    public function resumenEjecutivo(?string $desde = null, ?string $hasta = null): array
    {
        $fechaInicio = $desde ? Carbon::parse($desde) : Carbon::now()->subMonths(12);
        $fechaFin = $hasta ? Carbon::parse($hasta) : Carbon::now();

        // Totales de inventario
        $inventario = DB::table('equipos as e')
            ->join('tipo_equipos as te', 'te.id', '=', 'e.tipo_equipo_id')
            ->whereNull('e.deleted_at')
            ->select(
                DB::raw('COUNT(DISTINCT te.id) as total_modelos'),
                DB::raw('COUNT(e.id) as total_equipos'),
                DB::raw("SUM(CASE WHEN e.estado = 'DISPONIBLE' THEN 1 ELSE 0 END) as disponibles"),
                DB::raw("SUM(CASE WHEN e.estado = 'PRESTADO' THEN 1 ELSE 0 END) as prestados"),
                DB::raw("SUM(CASE WHEN e.estado = 'MANTENIMIENTO' THEN 1 ELSE 0 END) as en_mantenimiento"),
                DB::raw("SUM(CASE WHEN e.estado = 'DADO_DE_BAJA' THEN 1 ELSE 0 END) as dados_de_baja")
            )
            ->first();

        // Percentiles para calcular saturación y uso global
        $percentiles = $this->percentilesPorModelo(null, $desde, $hasta);
        $usoPromedioGlobal = $percentiles->count() > 0 ? $percentiles->avg('p75') ?? 0 : 0;
        $modelosSaturados = $percentiles->where('p75', '>=', self::UMBRAL_USO_ALTO)->count();
        $modelosSubutilizados = $percentiles->where('p75', '<', 0.25)->count();

        // Rechazos por stock
        $rechazos = $this->rechazosStockPorModelo(null, $desde, $hasta);
        $totalRechazosStock = $rechazos->sum('rechazos_stock');
        $totalSolicitudes = $rechazos->sum('total_solicitudes');
        $tasaRechazoGlobal = $totalSolicitudes > 0
            ? round($totalRechazosStock / $totalSolicitudes * 100, 2)
            : 0;

        // Downtime
        $downtimeData = $this->downtimePorModelo(null, $desde, $hasta);
        $downtimeTotalHoras = round($downtimeData->sum('total_horas'), 1);
        $totalIncidentesMant = $downtimeData->sum('total_incidentes');

        // Modelos críticos (top 5 score COMPRAR)
        $scores = $this->scorePrioridadCompra($desde, $hasta);
        $modelosCriticos = $scores->where('recomendacion', 'COMPRAR')
            ->take(5)
            ->map(fn($m) => [
                'tipo_equipo_id' => $m['tipo_equipo_id'],
                'modelo' => $m['modelo'],
                'marca' => $m['marca'],
                'score' => $m['score'],
                'recomendacion' => $m['recomendacion'],
            ])->values();

        // Marcas problemáticas (incidentes > 10/1000d)
        $incidentes = $this->incidentesPorExposicion(null, $desde, $hasta);
        $marcasProblematicas = $incidentes->groupBy('marca')
            ->map(function ($items, $marca) {
                $totalInc = $items->sum('total_incidentes');
                $diasDisp = $items->sum('dias_disponibles');
                return [
                    'marca' => $marca ?: 'Sin marca',
                    'incidentes_1000d' => $diasDisp > 0
                        ? round(($totalInc / $diasDisp) * 1000, 2)
                        : 0,
                    'total_modelos' => $items->unique('tipo_equipo_id')->count(),
                ];
            })
            ->filter(fn($m) => $m['incidentes_1000d'] > 10)
            ->sortByDesc('incidentes_1000d')
            ->values();

        return [
            'fecha_generacion' => Carbon::now()->toISOString(),
            'periodo' => [
                'desde' => $fechaInicio->toDateString(),
                'hasta' => $fechaFin->toDateString(),
            ],
            'kpis' => [
                'total_modelos' => $inventario->total_modelos,
                'total_equipos' => $inventario->total_equipos,
                'tasa_utilizacion_global' => round($usoPromedioGlobal * 100, 2),
                'modelos_saturados' => $modelosSaturados,
                'modelos_subutilizados' => $modelosSubutilizados,
                'total_rechazos_stock' => $totalRechazosStock,
                'tasa_rechazo_global' => $tasaRechazoGlobal,
                'total_incidentes_mantenimiento' => $totalIncidentesMant,
                'downtime_total_horas' => $downtimeTotalHoras,
            ],
            'modelos_criticos' => $modelosCriticos,
            'marcas_problematicas' => $marcasProblematicas,
        ];
    }

    // =========================================================================
    // MÉTODOS AUXILIARES PRIVADOS
    // =========================================================================

    /**
     * Calcula días prestados por equipo en un período.
     */
    private function calcularDiasPrestadosPorEquipo(
        array $equipoIds,
        Carbon $fechaInicio,
        Carbon $fechaFin
    ): array {
        if (empty($equipoIds)) return [];

        $prestamos = DB::table('prestamos as p')
            ->join('prestamo_equipo as pe', 'pe.idPrestamo', '=', 'p.idPrestamo')
            ->whereIn('pe.idEquipo', $equipoIds)
            ->whereIn('p.estado', [
                EstadoPrestamo::APROBADO,
                EstadoPrestamo::PENDIENTE_ENTREGA,
                EstadoPrestamo::ENTREGADO,
                EstadoPrestamo::DEVUELTO
            ])
            ->whereNotNull('p.fecha_inicio')
            ->whereNotNull('p.fecha_fin')
            ->where('p.fecha_inicio', '<=', $fechaFin)
            ->where('p.fecha_fin', '>=', $fechaInicio)
            ->select('pe.idEquipo', 'p.fecha_inicio', 'p.fecha_fin')
            ->get();

        $resultado = [];
        foreach ($prestamos as $p) {
            $inicio = Carbon::parse($p->fecha_inicio);
            $fin = Carbon::parse($p->fecha_fin);

            // Ajustar al período
            $inicioReal = $inicio->gt($fechaInicio) ? $inicio : $fechaInicio;
            $finReal = $fin->lt($fechaFin) ? $fin : $fechaFin;
            $dias = max(0, $inicioReal->diffInDays($finReal) + 1);

            $resultado[$p->idEquipo] = ($resultado[$p->idEquipo] ?? 0) + $dias;
        }

        return $resultado;
    }

    /**
     * Calcula días en mantenimiento por equipo en un período.
     */
    private function calcularDiasMantenimientoPorEquipo(
        array $equipoIds,
        Carbon $fechaInicio,
        Carbon $fechaFin
    ): array {
        if (empty($equipoIds)) return [];

        $eventos = DB::table('equipo_estado_eventos')
            ->whereIn('equipo_id', $equipoIds)
            ->where(function ($q) {
                $q->where('estado_nuevo', EstadoEquipo::MANTENIMIENTO)
                  ->orWhere('estado_anterior', EstadoEquipo::MANTENIMIENTO);
            })
            ->orderBy('equipo_id')
            ->orderBy('fecha_evento')
            ->select('equipo_id', 'estado_anterior', 'estado_nuevo', 'fecha_evento')
            ->get();

        $resultado = [];
        $enMantenimiento = [];

        foreach ($eventos as $evento) {
            if ($evento->estado_nuevo === EstadoEquipo::MANTENIMIENTO) {
                $enMantenimiento[$evento->equipo_id] = Carbon::parse($evento->fecha_evento);
            } elseif ($evento->estado_anterior === EstadoEquipo::MANTENIMIENTO) {
                if (isset($enMantenimiento[$evento->equipo_id])) {
                    $inicio = $enMantenimiento[$evento->equipo_id];
                    $fin = Carbon::parse($evento->fecha_evento);

                    // Ajustar al período
                    $inicioReal = $inicio->gt($fechaInicio) ? $inicio : $fechaInicio;
                    $finReal = $fin->lt($fechaFin) ? $fin : $fechaFin;

                    if ($inicioReal <= $finReal) {
                        $dias = $inicioReal->diffInDays($finReal);
                        $resultado[$evento->equipo_id] = 
                            ($resultado[$evento->equipo_id] ?? 0) + $dias;
                    }

                    unset($enMantenimiento[$evento->equipo_id]);
                }
            }
        }

        // Equipos aún en mantenimiento
        foreach ($enMantenimiento as $equipoId => $inicio) {
            $inicioReal = $inicio->gt($fechaInicio) ? $inicio : $fechaInicio;
            $dias = $inicioReal->diffInDays($fechaFin);
            $resultado[$equipoId] = ($resultado[$equipoId] ?? 0) + $dias;
        }

        return $resultado;
    }
}
