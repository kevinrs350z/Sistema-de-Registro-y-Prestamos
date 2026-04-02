<?php

namespace App\Services\Reportes;

use Carbon\Carbon;
use Illuminate\Support\Facades\DB;

/**
 * KPIs de Auditoría — Métricas priorizadas para control y rendición de cuentas.
 *
 * KPI-04  Fill Rate por Tipo Equipo
 * KPI-10  Tasa de Atraso por Tipo Equipo
 * KPI-16  Pareto de Rechazos por Motivo
 * KPI-24  Throughput del Sistema
 * KPI-26  Equipos Huérfanos
 * D.5     Segmentación ABC de Modelos
 * KPI-12  Heatmap Bloque × Día × Tipo Equipo (mejorado)
 */
class KpiAuditoriaService
{
    /* ================================================================
     *  HELPERS
     * ================================================================ */

    /**
     * Rango de fechas con defaults razonables (últimos 6 meses).
     */
    private function dateRange(array $filters): array
    {
        $from = isset($filters['from'])
            ? Carbon::parse($filters['from'])->startOfDay()
            : Carbon::now()->subMonths(6)->startOfDay();

        $to = isset($filters['to'])
            ? Carbon::parse($filters['to'])->endOfDay()
            : Carbon::now()->endOfDay();

        return [$from, $to];
    }

    /**
     * Aplica filtros opcionales de tipo_equipo_id a la query.
     */
    private function applyTipoEquipoFilter($query, ?int $tipoEquipoId)
    {
        if ($tipoEquipoId) {
            $query->where('e.tipo_equipo_id', $tipoEquipoId);
        }
        return $query;
    }

    /* ================================================================
     *  KPI-04: FILL RATE POR TIPO DE EQUIPO
     *  % de solicitudes satisfechas (no rechazadas) por modelo.
     * ================================================================ */

    public function fillRate(array $filters): array
    {
        [$from, $to] = $this->dateRange($filters);
        $tipoEquipoId = isset($filters['tipo_equipo_id']) ? (int)$filters['tipo_equipo_id'] : null;

        $query = DB::table('prestamos as p')
            ->join('prestamo_equipo as pe', 'pe.idPrestamo', '=', 'p.idPrestamo')
            ->join('equipos as e', 'e.id', '=', 'pe.idEquipo')
            ->join('tipo_equipos as te', 'te.id', '=', 'e.tipo_equipo_id')
            ->whereBetween('p.fecha_inicio', [$from, $to]);

        $query = $this->applyTipoEquipoFilter($query, $tipoEquipoId);

        $rows = $query
            ->select(
                'te.id as tipo_equipo_id',
                'te.nombre as modelo',
                DB::raw("COUNT(DISTINCT p.idPrestamo) as total"),
                DB::raw("COUNT(DISTINCT CASE WHEN p.estado != 'RECHAZADO' THEN p.idPrestamo END) as satisfechas"),
                DB::raw("COUNT(DISTINCT CASE WHEN p.estado = 'RECHAZADO' THEN p.idPrestamo END) as rechazadas")
            )
            ->groupBy('te.id', 'te.nombre')
            ->orderByDesc('total')
            ->get();

        $data = $rows->map(function ($r) {
            $fillRate = $r->total > 0 ? round($r->satisfechas * 100 / $r->total, 1) : 0;
            return [
                'tipo_equipo_id' => $r->tipo_equipo_id,
                'modelo'         => $r->modelo,
                'total'          => (int)$r->total,
                'satisfechas'    => (int)$r->satisfechas,
                'rechazadas'     => (int)$r->rechazadas,
                'fill_rate'      => $fillRate,
            ];
        });

        $globalTotal = $data->sum('total');
        $globalSatisfechas = $data->sum('satisfechas');

        return [
            'global_fill_rate' => $globalTotal > 0 ? round($globalSatisfechas * 100 / $globalTotal, 1) : 0,
            'detalle' => $data->values()->toArray(),
            'meta' => ['from' => $from->toDateString(), 'to' => $to->toDateString()],
        ];
    }

    /* ================================================================
     *  KPI-10: TASA DE ATRASO POR TIPO DE EQUIPO
     *  % de préstamos donde la devolución fue posterior a fecha_fin.
     * ================================================================ */

    public function tasaAtraso(array $filters): array
    {
        [$from, $to] = $this->dateRange($filters);
        $tipoEquipoId = isset($filters['tipo_equipo_id']) ? (int)$filters['tipo_equipo_id'] : null;

        $query = DB::table('prestamos as p')
            ->join('prestamo_equipo as pe', 'pe.idPrestamo', '=', 'p.idPrestamo')
            ->join('equipos as e', 'e.id', '=', 'pe.idEquipo')
            ->join('tipo_equipos as te', 'te.id', '=', 'e.tipo_equipo_id')
            ->whereBetween('p.fecha_inicio', [$from, $to])
            ->whereIn('p.estado', ['DEVUELTO', 'ATRASADO', 'ENTREGADO', 'APROBADO', 'PENDIENTE_ENTREGA']);

        $query = $this->applyTipoEquipoFilter($query, $tipoEquipoId);

        $rows = $query
            ->select(
                'te.id as tipo_equipo_id',
                'te.nombre as modelo',
                DB::raw("COUNT(DISTINCT p.idPrestamo) as total"),
                DB::raw("COUNT(DISTINCT CASE WHEN p.estado = 'ATRASADO' OR (p.estado = 'DEVUELTO' AND p.fecha_devolucion_real > p.fecha_fin) THEN p.idPrestamo END) as atrasados")
            )
            ->groupBy('te.id', 'te.nombre')
            ->orderByDesc(DB::raw("COUNT(DISTINCT CASE WHEN p.estado = 'ATRASADO' OR (p.estado = 'DEVUELTO' AND p.fecha_devolucion_real > p.fecha_fin) THEN p.idPrestamo END)"))
            ->get();

        $data = $rows->map(function ($r) {
            $tasa = $r->total > 0 ? round($r->atrasados * 100 / $r->total, 1) : 0;
            return [
                'tipo_equipo_id' => $r->tipo_equipo_id,
                'modelo'         => $r->modelo,
                'total'          => (int)$r->total,
                'atrasados'      => (int)$r->atrasados,
                'tasa_atraso'    => $tasa,
            ];
        });

        // Formato Pareto: de mayor a menor
        $sorted = $data->sortByDesc('tasa_atraso')->values();

        return [
            'global_tasa_atraso' => $data->sum('total') > 0
                ? round($data->sum('atrasados') * 100 / $data->sum('total'), 1) : 0,
            'detalle' => $sorted->toArray(),
            'meta'    => ['from' => $from->toDateString(), 'to' => $to->toDateString()],
        ];
    }

    /* ================================================================
     *  KPI-16: PARETO DE RECHAZOS POR MOTIVO
     *  Top motivos de rechazo con acumulado para el 80/20.
     * ================================================================ */

    public function paretoRechazos(array $filters): array
    {
        [$from, $to] = $this->dateRange($filters);
        $tipoEquipoId = isset($filters['tipo_equipo_id']) ? (int)$filters['tipo_equipo_id'] : null;

        // Obtener motivos de rechazo desde prestamo_historial
        $query = DB::table('prestamos as p')
            ->join('prestamo_historial as ph', 'ph.idPrestamo', '=', 'p.idPrestamo')
            ->whereBetween('p.fecha_inicio', [$from, $to])
            ->where('p.estado', 'RECHAZADO');

        // Si hay filtro de tipo equipo, necesitamos el join
        if ($tipoEquipoId) {
            $query->join('prestamo_equipo as pe', 'pe.idPrestamo', '=', 'p.idPrestamo')
                  ->join('equipos as e', 'e.id', '=', 'pe.idEquipo')
                  ->where('e.tipo_equipo_id', $tipoEquipoId);
        }

        // Clasificar motivo desde la descripción del historial
        $rows = $query
            ->select(DB::raw("
                CASE
                    WHEN ph.descripcion LIKE '%SIN_STOCK%' OR ph.descripcion LIKE '%sin stock%' OR ph.descripcion LIKE '%no hay%disponib%' THEN 'SIN_STOCK'
                    WHEN ph.descripcion LIKE '%CONFLICTO_HORARIO%' OR ph.descripcion LIKE '%conflicto%horario%' THEN 'CONFLICTO_HORARIO'
                    WHEN ph.descripcion LIKE '%SANCION%' OR ph.descripcion LIKE '%sancion%' THEN 'SANCION_USUARIO'
                    WHEN ph.descripcion LIKE '%LIMITE%' OR ph.descripcion LIKE '%limite%prestamo%' OR ph.descripcion LIKE '%máximo%' THEN 'LIMITE_PRESTAMOS'
                    WHEN ph.descripcion LIKE '%EQUIPO_NO_DISPONIBLE%' OR ph.descripcion LIKE '%equipo%no%disponib%' THEN 'EQUIPO_NO_DISPONIBLE'
                    WHEN ph.descripcion LIKE '%OTRO%' THEN 'OTRO'
                    ELSE 'OTRO'
                END as motivo
            "))
            ->selectRaw("COUNT(DISTINCT p.idPrestamo) as cantidad")
            ->groupBy('motivo')
            ->orderByDesc('cantidad')
            ->get();

        // También intentar obtener del campo motivo_rechazo si existe
        $motivosDirectos = DB::table('prestamos')
            ->whereBetween('fecha_inicio', [$from, $to])
            ->where('estado', 'RECHAZADO')
            ->whereNotNull('motivo_rechazo')
            ->select('motivo_rechazo as motivo', DB::raw('COUNT(*) as cantidad'))
            ->groupBy('motivo_rechazo')
            ->orderByDesc('cantidad')
            ->get();

        // Si hay datos del campo directo, usarlos; si no, usar los del historial
        $finalRows = $motivosDirectos->isNotEmpty() ? $motivosDirectos : $rows;

        $grandTotal = $finalRows->sum('cantidad');

        // Calcular acumulado para Pareto
        $cumulative = 0;
        $pareto = $finalRows->map(function ($r) use ($grandTotal, &$cumulative) {
            $pct = $grandTotal > 0 ? round($r->cantidad * 100 / $grandTotal, 1) : 0;
            $cumulative += $pct;
            return [
                'motivo'          => $r->motivo,
                'cantidad'        => (int)$r->cantidad,
                'porcentaje'      => $pct,
                'acumulado'       => round($cumulative, 1),
            ];
        });

        return [
            'total_rechazos' => $grandTotal,
            'pareto'         => $pareto->values()->toArray(),
            'meta'           => ['from' => $from->toDateString(), 'to' => $to->toDateString()],
        ];
    }

    /* ================================================================
     *  KPI-24: THROUGHPUT DEL SISTEMA
     *  Préstamos procesados por período (día / semana / mes).
     * ================================================================ */

    public function throughput(array $filters): array
    {
        [$from, $to] = $this->dateRange($filters);
        $bucket = $filters['bucket'] ?? 'week';

        $format = match ($bucket) {
            'day'   => '%Y-%m-%d',
            'month' => '%Y-%m',
            default => '%x-W%v', // ISO week
        };

        // Total procesados (todos los que pasaron de PENDIENTE)
        $timeseries = DB::table('prestamos')
            ->whereBetween('fecha_inicio', [$from, $to])
            ->whereIn('estado', ['APROBADO', 'PENDIENTE_ENTREGA', 'ENTREGADO', 'ATRASADO', 'DEVUELTO', 'RECHAZADO'])
            ->select(
                DB::raw("DATE_FORMAT(fecha_inicio, '{$format}') as periodo"),
                DB::raw("COUNT(*) as procesados"),
                DB::raw("COUNT(CASE WHEN estado NOT IN ('RECHAZADO') THEN 1 END) as aprobados"),
                DB::raw("COUNT(CASE WHEN estado = 'RECHAZADO' THEN 1 END) as rechazados"),
                DB::raw("COUNT(CASE WHEN estado = 'DEVUELTO' THEN 1 END) as completados")
            )
            ->groupBy('periodo')
            ->orderBy('periodo')
            ->get();

        $avgProcesados = $timeseries->count() > 0
            ? round($timeseries->avg('procesados'), 1) : 0;

        return [
            'promedio_por_periodo' => $avgProcesados,
            'bucket'               => $bucket,
            'timeseries'           => $timeseries->toArray(),
            'meta'                 => ['from' => $from->toDateString(), 'to' => $to->toDateString()],
        ];
    }

    /* ================================================================
     *  KPI-26: MODELOS HUÉRFANOS
     *  Tipos de equipo (modelos) sin préstamos en los últimos N meses.
     *  Agrupa por tipo_equipo, no por equipo físico individual.
     *  Usa fecha_inicio como referencia temporal (normalizada para
     *  DENTRO y FUERA mediante migración backfill).
     * ================================================================ */

    public function equiposHuerfanos(array $filters): array
    {
        $mesesUmbral = isset($filters['meses']) ? (int)$filters['meses'] : 3;
        $limite = Carbon::now()->subMonths($mesesUmbral);

        // Todos los tipos de equipo con su cantidad de unidades físicas
        $tiposEquipo = DB::table('tipo_equipos as te')
            ->select(
                'te.id',
                'te.nombre as modelo',
                DB::raw('(SELECT COUNT(*) FROM equipos WHERE tipo_equipo_id = te.id) as unidades')
            )
            ->get();

        // Tipos de equipo que SÍ tienen al menos un préstamo reciente
        $tiposConUso = DB::table('tipo_equipos as te')
            ->whereExists(function ($sub) use ($limite) {
                $sub->select(DB::raw(1))
                    ->from('equipos as e')
                    ->join('prestamo_equipo as pe', 'pe.idEquipo', '=', 'e.id')
                    ->join('prestamos as p', 'p.idPrestamo', '=', 'pe.idPrestamo')
                    ->whereColumn('e.tipo_equipo_id', 'te.id')
                    ->where('p.estado', '!=', 'RECHAZADO')
                    ->where('p.fecha_inicio', '>=', $limite);
            })
            ->pluck('id')
            ->toArray();

        // Último préstamo por tipo de equipo (para calcular días sin uso)
        $ultimoPrestamoPorTipo = DB::table('tipo_equipos as te')
            ->join('equipos as e', 'e.tipo_equipo_id', '=', 'te.id')
            ->join('prestamo_equipo as pe', 'pe.idEquipo', '=', 'e.id')
            ->join('prestamos as p', function ($j) {
                $j->on('p.idPrestamo', '=', 'pe.idPrestamo')
                  ->where('p.estado', '!=', 'RECHAZADO');
            })
            ->select('te.id', DB::raw('MAX(p.fecha_inicio) as ultimo_prestamo'))
            ->groupBy('te.id')
            ->pluck('ultimo_prestamo', 'id')
            ->toArray();

        // Total de préstamos históricos por tipo
        $prestamosPorTipo = DB::table('tipo_equipos as te')
            ->join('equipos as e', 'e.tipo_equipo_id', '=', 'te.id')
            ->join('prestamo_equipo as pe', 'pe.idEquipo', '=', 'e.id')
            ->join('prestamos as p', function ($j) {
                $j->on('p.idPrestamo', '=', 'pe.idPrestamo')
                  ->where('p.estado', '!=', 'RECHAZADO');
            })
            ->select('te.id', DB::raw('COUNT(DISTINCT p.idPrestamo) as total'))
            ->groupBy('te.id')
            ->pluck('total', 'id')
            ->toArray();

        $huerfanos = $tiposEquipo
            ->filter(fn($te) => !in_array($te->id, $tiposConUso))
            ->map(function ($te) use ($ultimoPrestamoPorTipo, $prestamosPorTipo) {
                $ultimoPrestamo = $ultimoPrestamoPorTipo[$te->id] ?? null;
                return [
                    'tipo_equipo_id'   => $te->id,
                    'modelo'           => $te->modelo,
                    'unidades'         => (int)$te->unidades,
                    'total_prestamos'  => (int)($prestamosPorTipo[$te->id] ?? 0),
                    'ultimo_prestamo'  => $ultimoPrestamo,
                    'dias_sin_uso'     => $ultimoPrestamo
                        ? Carbon::parse($ultimoPrestamo)->diffInDays(Carbon::now())
                        : null,
                ];
            })
            ->sortByDesc('dias_sin_uso')
            ->values();

        $totalModelos = $tiposEquipo->count();

        return [
            'total_modelos'    => $totalModelos,
            'total_huerfanos'  => $huerfanos->count(),
            'porcentaje'       => $totalModelos > 0
                ? round($huerfanos->count() * 100 / $totalModelos, 1) : 0,
            'meses_umbral'     => $mesesUmbral,
            'huerfanos'        => $huerfanos->toArray(),
        ];
    }

    /* ================================================================
     *  D.5: SEGMENTACIÓN ABC DE MODELOS
     *  A = 70% del uso, B = 70-90%, C = 90-100%.
     * ================================================================ */

    public function segmentacionABC(array $filters): array
    {
        [$from, $to] = $this->dateRange($filters);

        $rows = DB::table('prestamos as p')
            ->join('prestamo_equipo as pe', 'pe.idPrestamo', '=', 'p.idPrestamo')
            ->join('equipos as e', 'e.id', '=', 'pe.idEquipo')
            ->join('tipo_equipos as te', 'te.id', '=', 'e.tipo_equipo_id')
            ->whereBetween('p.fecha_inicio', [$from, $to])
            ->where('p.estado', '!=', 'RECHAZADO')
            ->select(
                'te.id as tipo_equipo_id',
                'te.nombre as modelo',
                DB::raw('COUNT(DISTINCT p.idPrestamo) as prestamos')
            )
            ->groupBy('te.id', 'te.nombre')
            ->orderByDesc('prestamos')
            ->get();

        $grandTotal = $rows->sum('prestamos');
        $cumulative = 0;

        $data = $rows->map(function ($r) use ($grandTotal, &$cumulative) {
            $cumulative += $r->prestamos;
            $pctAcumulado = $grandTotal > 0 ? round($cumulative * 100 / $grandTotal, 1) : 0;

            $clase = 'C';
            if ($pctAcumulado <= 70) $clase = 'A';
            elseif ($pctAcumulado <= 90) $clase = 'B';

            return [
                'tipo_equipo_id' => $r->tipo_equipo_id,
                'modelo'         => $r->modelo,
                'prestamos'      => (int)$r->prestamos,
                'porcentaje'     => $grandTotal > 0 ? round($r->prestamos * 100 / $grandTotal, 1) : 0,
                'acumulado'      => $pctAcumulado,
                'clase'          => $clase,
            ];
        });

        $resumen = [
            'A' => ['modelos' => 0, 'prestamos' => 0, 'descripcion' => 'Alta rotación — nunca deben faltar'],
            'B' => ['modelos' => 0, 'prestamos' => 0, 'descripcion' => 'Uso intermedio — stock normal'],
            'C' => ['modelos' => 0, 'prestamos' => 0, 'descripcion' => 'Bajo uso — candidatos a redistribución'],
        ];
        foreach ($data as $d) {
            $resumen[$d['clase']]['modelos']++;
            $resumen[$d['clase']]['prestamos'] += $d['prestamos'];
        }

        return [
            'total_modelos'    => $data->count(),
            'total_prestamos'  => $grandTotal,
            'resumen'          => $resumen,
            'detalle'          => $data->values()->toArray(),
            'meta'             => ['from' => $from->toDateString(), 'to' => $to->toDateString()],
        ];
    }

    /* ================================================================
     *  KPI-12: HEATMAP BLOQUE × DÍA × TIPO EQUIPO (mejorado)
     *  Muestra demanda por bloque horario y día de la semana, filtrable
     *  por tipo de equipo.
     * ================================================================ */

    public function heatmapMejorado(array $filters): array
    {
        [$from, $to] = $this->dateRange($filters);
        $tipoEquipoId = isset($filters['tipo_equipo_id']) ? (int)$filters['tipo_equipo_id'] : null;

        $query = DB::table('prestamos as p')
            ->join('bloque_prestamos as bp', 'bp.idPrestamo', '=', 'p.idPrestamo')
            ->join('bloques as b', 'b.idBloque', '=', 'bp.idBloque')
            ->whereBetween('p.fecha_inicio', [$from, $to])
            ->where('p.estado', '!=', 'RECHAZADO');

        if ($tipoEquipoId) {
            $query->join('prestamo_equipo as pe', 'pe.idPrestamo', '=', 'p.idPrestamo')
                  ->join('equipos as e', 'e.id', '=', 'pe.idEquipo')
                  ->where('e.tipo_equipo_id', $tipoEquipoId);
        }

        $rows = $query
            ->select(
                DB::raw("DAYOFWEEK(p.fecha_inicio) as dia_semana"),
                'b.nombre as bloque',
                'b.hora_inicio',
                DB::raw("COUNT(DISTINCT p.idPrestamo) as demanda")
            )
            ->groupBy('dia_semana', 'b.nombre', 'b.hora_inicio')
            ->orderBy('dia_semana')
            ->orderBy('b.hora_inicio')
            ->get();

        // Nombres de días (1=Domingo ... 7=Sábado en MySQL)
        $diasNombre = [1 => 'Domingo', 2 => 'Lunes', 3 => 'Martes', 4 => 'Miércoles', 5 => 'Jueves', 6 => 'Viernes', 7 => 'Sábado'];

        // Obtener todos los bloques disponibles
        $bloques = DB::table('bloques')
            ->orderBy('hora_inicio')
            ->pluck('nombre')
            ->toArray();

        // Construir matriz para ECharts
        $heatmapData = [];
        $maxDemanda = 0;
        foreach ($rows as $r) {
            $diaNombre = $diasNombre[$r->dia_semana] ?? "Día {$r->dia_semana}";
            $heatmapData[] = [$r->bloque, $diaNombre, (int)$r->demanda];
            $maxDemanda = max($maxDemanda, (int)$r->demanda);
        }

        // Días en orden lunes-sábado (excluir domingo si no hay)
        $diasOrden = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];

        return [
            'bloques'     => $bloques,
            'dias'        => $diasOrden,
            'heatmapData' => $heatmapData,
            'maxDemanda'  => $maxDemanda,
            'meta'        => [
                'from'           => $from->toDateString(),
                'to'             => $to->toDateString(),
                'tipo_equipo_id' => $tipoEquipoId,
            ],
        ];
    }

    /* ================================================================
     *  RESUMEN GENERAL — Llama a los KPIs principales para un solo
     *  response que alimenta las tarjetas del dashboard.
     * ================================================================ */

    public function resumenGeneral(array $filters): array
    {
        [$from, $to] = $this->dateRange($filters);

        // fecha_inicio está normalizada para DENTRO y FUERA
        $totalPrestamos = DB::table('prestamos')
            ->whereBetween('fecha_inicio', [$from, $to])
            ->count();
        $rechazados = DB::table('prestamos')
            ->whereBetween('fecha_inicio', [$from, $to])
            ->where('estado', 'RECHAZADO')
            ->count();
        $fillRateGlobal = $totalPrestamos > 0
            ? round(($totalPrestamos - $rechazados) * 100 / $totalPrestamos, 1) : 0;

        // Tasa atraso global — solo aplica a FUERA (tienen fecha_fin)
        $noRechazados = $totalPrestamos - $rechazados;
        $atrasados = DB::table('prestamos')
            ->whereBetween('fecha_inicio', [$from, $to])
            ->where(function ($q) {
                $q->where('estado', 'ATRASADO')
                  ->orWhere(function ($q2) {
                      $q2->where('estado', 'DEVUELTO')
                         ->whereColumn('fecha_devolucion_real', '>', 'fecha_fin');
                  });
            })
            ->count();
        $tasaAtrasoGlobal = $noRechazados > 0 ? round($atrasados * 100 / $noRechazados, 1) : 0;

        // Throughput promedio semanal
        $semanas = max(1, Carbon::parse($from)->diffInWeeks(Carbon::parse($to)));
        $procesados = DB::table('prestamos')
            ->whereBetween('fecha_inicio', [$from, $to])
            ->whereNotIn('estado', ['PENDIENTE'])
            ->count();
        $throughputSemanal = round($procesados / $semanas, 1);

        // Modelos huérfanos (3 meses) — por tipo_equipo, no por equipo físico
        $limite3m = Carbon::now()->subMonths(3);
        $totalModelos = DB::table('tipo_equipos')->count();
        $modelosConUso = DB::table('tipo_equipos as te')
            ->whereExists(function ($sub) use ($limite3m) {
                $sub->select(DB::raw(1))
                    ->from('equipos as e')
                    ->join('prestamo_equipo as pe', 'pe.idEquipo', '=', 'e.id')
                    ->join('prestamos as p', 'p.idPrestamo', '=', 'pe.idPrestamo')
                    ->whereColumn('e.tipo_equipo_id', 'te.id')
                    ->where('p.estado', '!=', 'RECHAZADO')
                    ->where('p.fecha_inicio', '>=', $limite3m);
            })
            ->count();
        $huerfanosPct = $totalModelos > 0
            ? round(($totalModelos - $modelosConUso) * 100 / $totalModelos, 1) : 0;

        $totalEquipos = DB::table('equipos')->count();

        return [
            'cards' => [
                [
                    'key'       => 'fill_rate',
                    'label'     => 'Fill Rate Global',
                    'value'     => $fillRateGlobal,
                    'unit'      => '%',
                    'color'     => $fillRateGlobal >= 80 ? 'green' : ($fillRateGlobal >= 60 ? 'amber' : 'red'),
                    'tooltip'   => 'Porcentaje de solicitudes satisfechas (no rechazadas)',
                ],
                [
                    'key'       => 'tasa_atraso',
                    'label'     => 'Tasa de Atraso',
                    'value'     => $tasaAtrasoGlobal,
                    'unit'      => '%',
                    'color'     => $tasaAtrasoGlobal <= 10 ? 'green' : ($tasaAtrasoGlobal <= 25 ? 'amber' : 'red'),
                    'tooltip'   => 'Porcentaje de préstamos devueltos fuera de plazo',
                ],
                [
                    'key'       => 'throughput',
                    'label'     => 'Throughput Semanal',
                    'value'     => $throughputSemanal,
                    'unit'      => 'prést/sem',
                    'color'     => 'blue',
                    'tooltip'   => 'Promedio de préstamos procesados por semana',
                ],
                [
                    'key'       => 'huerfanos',
                    'label'     => 'Modelos Huérfanos',
                    'value'     => $huerfanosPct,
                    'unit'      => '%',
                    'color'     => $huerfanosPct <= 15 ? 'green' : ($huerfanosPct <= 30 ? 'amber' : 'red'),
                    'tooltip'   => 'Porcentaje de modelos sin préstamos en últimos 3 meses',
                ],
                [
                    'key'       => 'total_prestamos',
                    'label'     => 'Total Solicitudes',
                    'value'     => $totalPrestamos,
                    'unit'      => null,
                    'color'     => 'blue',
                    'tooltip'   => 'Solicitudes en el período seleccionado',
                ],
                [
                    'key'       => 'total_equipos',
                    'label'     => 'Flota Total',
                    'value'     => $totalEquipos,
                    'unit'      => 'equipos',
                    'color'     => 'blue',
                    'tooltip'   => 'Cantidad total de equipos registrados',
                ],
            ],
            'meta' => ['from' => $from->toDateString(), 'to' => $to->toDateString()],
        ];
    }
}
