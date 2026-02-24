<?php

namespace App\Services\Analytics;

use Carbon\Carbon;
use Illuminate\Support\Facades\DB;

/**
 * Servicio de analíticas de demanda insatisfecha por falta de stock (SIN_STOCK).
 *
 * Identifica rechazos vía prestamos.motivo_rechazo (principal)
 * y usa prestamo_historial.descripcion como fallback de compatibilidad.
 *
 * Endpoints:
 *   1. KPI global stockout rate + variación
 *   2. Timeseries demanda vs rechazos SIN_STOCK
 *   3. Ranking top N con prioridad de compra
 *   4. Scatter demanda vs rechazos por categoría/equipo
 *   5. Score de prioridad de compra (0-100)
 */
class StockoutAnalyticsService
{
    /* ── Constantes ── */
    private const APPROVED_STATES = ['APROBADO', 'PENDIENTE_ENTREGA', 'ENTREGADO', 'DEVUELTO', 'ATRASADO'];

    /* =========================================================
     * 1. KPI Global — Stockout Rate
     * ========================================================= */
    public function getStockoutKpi(array $filters): array
    {
        [$currentFrom, $currentTo, $prevFrom, $prevTo] = $this->resolvePeriods($filters);

        // Total solicitudes periodo actual
        $qTotCurr = $this->baseQuery($filters)
            ->select(DB::raw('COUNT(DISTINCT p.idPrestamo) AS total'));
        $qTotPrev = $this->baseQuery($filters)
            ->select(DB::raw('COUNT(DISTINCT p.idPrestamo) AS total'));

        // Rechazos SIN_STOCK periodo actual
        $qSinCurr = $this->stockoutQuery($filters)
            ->select(DB::raw('COUNT(DISTINCT p.idPrestamo) AS total'));
        $qSinPrev = $this->stockoutQuery($filters)
            ->select(DB::raw('COUNT(DISTINCT p.idPrestamo) AS total'));

        if ($currentFrom && $currentTo) {
            $qTotCurr->whereBetween('p.fecha_inicio', [$currentFrom, $currentTo]);
            $qTotPrev->whereBetween('p.fecha_inicio', [$prevFrom, $prevTo]);
            $qSinCurr->whereBetween('p.fecha_inicio', [$currentFrom, $currentTo]);
            $qSinPrev->whereBetween('p.fecha_inicio', [$prevFrom, $prevTo]);
        }

        $totCurr = (int) ($qTotCurr->first()->total ?? 0);
        $totPrev = (int) ($qTotPrev->first()->total ?? 0);
        $sinCurr = (int) ($qSinCurr->first()->total ?? 0);
        $sinPrev = (int) ($qSinPrev->first()->total ?? 0);

        $rateCurr = $totCurr > 0 ? round(($sinCurr / $totCurr) * 100, 1) : 0;
        $ratePrev = $totPrev > 0 ? round(($sinPrev / $totPrev) * 100, 1) : 0;

        $kpi = $this->buildKpiCard(
            'stockout_rate',
            'Stockout Rate Global',
            (float) $rateCurr,
            (float) $ratePrev,
            '%',
            "Demanda perdida por falta de stock: {$sinCurr} rechazos SIN_STOCK de {$totCurr} solicitudes ({$rateCurr}%). "
            . "Periodo anterior: {$sinPrev}/{$totPrev} ({$ratePrev}%).",
            true // invertColors: bajar es bueno
        );

        // Stockout por categoría (top 5)
        $qCat = $this->stockoutQuery($filters)
            ->join('prestamo_equipo as pe2', 'pe2.idPrestamo', '=', 'p.idPrestamo')
            ->join('equipos as e2', 'e2.id', '=', 'pe2.idEquipo')
            ->join('tipo_equipos as te2', 'te2.id', '=', 'e2.tipo_equipo_id')
            ->join('categorias as c2', 'c2.id', '=', 'te2.categoria_id')
            ->select('c2.nombre as categoria', DB::raw('COUNT(DISTINCT p.idPrestamo) AS rechazos'))
            ->groupBy('c2.nombre')
            ->orderByDesc('rechazos')
            ->limit(5);

        if ($currentFrom && $currentTo) {
            $qCat->whereBetween('p.fecha_inicio', [$currentFrom, $currentTo]);
        }

        $topCategorias = $qCat->get()->map(fn ($row) => [
            'categoria' => $row->categoria,
            'rechazos'  => (int) $row->rechazos,
        ])->all();

        // Alertas automáticas
        $alertas = $this->buildAlertas($rateCurr, $ratePrev, $filters, $currentFrom, $currentTo);

        return [
            'kpi'           => $kpi,
            'absolutos'     => ['rechazos' => $sinCurr, 'total' => $totCurr],
            'topCategorias' => $topCategorias,
            'alertas'       => $alertas,
            'meta'          => $this->buildMeta($filters, $currentFrom, $currentTo, $prevFrom, $prevTo),
        ];
    }

    /* =========================================================
     * 2. Timeseries — Demanda vs Rechazos SIN_STOCK
     * ========================================================= */
    public function getStockoutTimeseries(array $filters): array
    {
        [$currentFrom, $currentTo] = $this->resolvePeriods($filters);
        $bucket = strtolower($filters['bucket'] ?? 'week');

        if (!$currentFrom || !$currentTo) {
            return ['series' => [], 'hasData' => false, 'meta' => $this->buildMeta($filters)];
        }

        $truncExpr = $this->dateTrunc('p.fecha_inicio', $bucket);

        // Serie 1: Solicitudes totales
        $totals = $this->baseQuery($filters)
            ->select(DB::raw("{$truncExpr} as periodo"), DB::raw('COUNT(DISTINCT p.idPrestamo) as total'))
            ->whereBetween('p.fecha_inicio', [$currentFrom, $currentTo])
            ->groupBy(DB::raw($truncExpr))
            ->orderBy(DB::raw($truncExpr))
            ->pluck('total', 'periodo');

        // Serie 2: Rechazos SIN_STOCK
        $stockouts = $this->stockoutQuery($filters)
            ->select(DB::raw("{$truncExpr} as periodo"), DB::raw('COUNT(DISTINCT p.idPrestamo) as total'))
            ->whereBetween('p.fecha_inicio', [$currentFrom, $currentTo])
            ->groupBy(DB::raw($truncExpr))
            ->orderBy(DB::raw($truncExpr))
            ->pluck('total', 'periodo');

        // Unificar periodos
        $allPeriods = collect($totals->keys())->merge($stockouts->keys())->unique()->sort()->values();

        $series = [
            'labels'    => $allPeriods->all(),
            'demanda'   => $allPeriods->map(fn ($p) => (int) ($totals[$p] ?? 0))->all(),
            'stockouts' => $allPeriods->map(fn ($p) => (int) ($stockouts[$p] ?? 0))->all(),
        ];

        // Tasa por periodo
        $series['tasaPorPeriodo'] = $allPeriods->map(function ($p) use ($totals, $stockouts) {
            $t = (int) ($totals[$p] ?? 0);
            $s = (int) ($stockouts[$p] ?? 0);
            return $t > 0 ? round(($s / $t) * 100, 1) : 0;
        })->all();

        return [
            'series'  => $series,
            'bucket'  => $bucket,
            'hasData' => array_sum($series['demanda']) > 0,
            'meta'    => $this->buildMeta($filters, $currentFrom, $currentTo),
        ];
    }

    /* =========================================================
     * 3. Ranking — Top N Demanda Insatisfecha
     * ========================================================= */
    public function getStockoutRanking(array $filters): array
    {
        [$currentFrom, $currentTo, $prevFrom, $prevTo] = $this->resolvePeriods($filters);
        $groupBy = strtolower($filters['groupBy'] ?? 'equipo');
        $topN    = (int) ($filters['topN'] ?? 15);

        // Determinar columnas de agrupación
        if ($groupBy === 'categoria') {
            $nameExpr  = 'c.nombre';
            $groupCol  = 'c.id';
            $extraJoin = null;
        } else {
            // equipo = tipo_equipo
            $nameExpr  = "CONCAT(te.nombre, ' — ', te.marca, ' ', te.modelo)";
            $groupCol  = 'te.id';
            $extraJoin = null;
        }

        // ── Solicitudes totales por grupo (período actual) ──
        $qTotCurr = $this->baseQuery($filters)
            ->join('prestamo_equipo as pe2', 'pe2.idPrestamo', '=', 'p.idPrestamo')
            ->join('equipos as e2', 'e2.id', '=', 'pe2.idEquipo')
            ->join('tipo_equipos as te2', 'te2.id', '=', 'e2.tipo_equipo_id')
            ->join('categorias as c2', 'c2.id', '=', 'te2.categoria_id');

        // ── Rechazos SIN_STOCK por grupo (período actual) ──
        $qSinCurr = $this->stockoutQuery($filters)
            ->join('prestamo_equipo as pe3', 'pe3.idPrestamo', '=', 'p.idPrestamo')
            ->join('equipos as e3', 'e3.id', '=', 'pe3.idEquipo')
            ->join('tipo_equipos as te3', 'te3.id', '=', 'e3.tipo_equipo_id')
            ->join('categorias as c3', 'c3.id', '=', 'te3.categoria_id');

        // Adaptar col y alias según agrupación
        if ($groupBy === 'categoria') {
            $qTotCurr->select('c2.id as grp_id', 'c2.nombre as nombre', DB::raw('COUNT(DISTINCT p.idPrestamo) as total_sol'));
            $qTotCurr->groupBy('c2.id', 'c2.nombre');
            $qSinCurr->select('c3.id as grp_id', 'c3.nombre as nombre', DB::raw('COUNT(DISTINCT p.idPrestamo) as rechazos'));
            $qSinCurr->groupBy('c3.id', 'c3.nombre');
        } else {
            $qTotCurr->select(
                'te2.id as grp_id',
                DB::raw("CONCAT(te2.nombre, ' — ', te2.marca, ' ', te2.modelo) as nombre"),
                'c2.nombre as categoria',
                DB::raw('COUNT(DISTINCT p.idPrestamo) as total_sol')
            );
            $qTotCurr->groupBy('te2.id', 'te2.nombre', 'te2.marca', 'te2.modelo', 'c2.nombre');
            $qSinCurr->select(
                'te3.id as grp_id',
                DB::raw("CONCAT(te3.nombre, ' — ', te3.marca, ' ', te3.modelo) as nombre"),
                'c3.nombre as categoria',
                DB::raw('COUNT(DISTINCT p.idPrestamo) as rechazos')
            );
            $qSinCurr->groupBy('te3.id', 'te3.nombre', 'te3.marca', 'te3.modelo', 'c3.nombre');
        }

        if ($currentFrom && $currentTo) {
            $qTotCurr->whereBetween('p.fecha_inicio', [$currentFrom, $currentTo]);
            $qSinCurr->whereBetween('p.fecha_inicio', [$currentFrom, $currentTo]);
        }

        $totRows = $qTotCurr->get()->keyBy('grp_id');
        $sinRows = $qSinCurr->get()->keyBy('grp_id');

        // ── Rechazos SIN_STOCK por grupo (período anterior) para tendencia ──
        $sinPrevMap = [];
        if ($prevFrom && $prevTo) {
            $qSinPrev = $this->stockoutQuery($filters)
                ->join('prestamo_equipo as pe4', 'pe4.idPrestamo', '=', 'p.idPrestamo')
                ->join('equipos as e4', 'e4.id', '=', 'pe4.idEquipo')
                ->join('tipo_equipos as te4', 'te4.id', '=', 'e4.tipo_equipo_id')
                ->join('categorias as c4', 'c4.id', '=', 'te4.categoria_id')
                ->whereBetween('p.fecha_inicio', [$prevFrom, $prevTo]);

            if ($groupBy === 'categoria') {
                $qSinPrev->select('c4.id as grp_id', DB::raw('COUNT(DISTINCT p.idPrestamo) as rechazos'));
                $qSinPrev->groupBy('c4.id');
            } else {
                $qSinPrev->select('te4.id as grp_id', DB::raw('COUNT(DISTINCT p.idPrestamo) as rechazos'));
                $qSinPrev->groupBy('te4.id');
            }

            $sinPrevMap = $qSinPrev->pluck('rechazos', 'grp_id')->all();
        }

        // ── Construir filas del ranking ──
        $allIds = $totRows->keys()->merge($sinRows->keys())->unique();
        $rows = [];

        foreach ($allIds as $id) {
            $totRow = $totRows->get($id);
            $sinRow = $sinRows->get($id);

            $totalSol = (int) ($totRow->total_sol ?? 0);
            $rechazos = (int) ($sinRow->rechazos ?? 0);
            $pctPerdida = $totalSol > 0 ? round(($rechazos / $totalSol) * 100, 1) : 0;

            $prevRechazos = (int) ($sinPrevMap[$id] ?? 0);
            $tendencia = $prevRechazos > 0
                ? round((($rechazos - $prevRechazos) / $prevRechazos) * 100, 1)
                : ($rechazos > 0 ? 100 : 0);

            $nombre = $totRow->nombre ?? ($sinRow->nombre ?? "ID:{$id}");
            $categoria = $totRow->categoria ?? ($sinRow->categoria ?? null);

            $rows[] = [
                'id'         => $id,
                'nombre'     => $nombre,
                'categoria'  => $groupBy !== 'categoria' ? $categoria : null,
                'totalSol'   => $totalSol,
                'rechazos'   => $rechazos,
                'pctPerdida' => $pctPerdida,
                'tendencia'  => $tendencia,
                'prevRechazos' => $prevRechazos,
            ];
        }

        // Ordenar por rechazos descendente y limitar
        usort($rows, fn ($a, $b) => $b['rechazos'] <=> $a['rechazos']);
        $rows = array_slice($rows, 0, $topN);

        // Calcular prioridad
        foreach ($rows as &$row) {
            $row['prioridad'] = $this->calcularPrioridad($row['rechazos'], $row['pctPerdida'], $row['tendencia']);
        }
        unset($row);

        return [
            'ranking'  => $rows,
            'groupBy'  => $groupBy,
            'topN'     => $topN,
            'hasData'  => count($rows) > 0,
            'meta'     => $this->buildMeta($filters, $currentFrom, $currentTo, $prevFrom, $prevTo),
        ];
    }

    /* =========================================================
     * 4. Scatter — Demanda vs Rechazos SIN_STOCK
     * ========================================================= */
    public function getStockoutScatter(array $filters): array
    {
        [$currentFrom, $currentTo] = $this->resolvePeriods($filters);
        $groupBy = strtolower($filters['groupBy'] ?? 'categoria');

        // Solicitudes totales por grupo
        $qTot = $this->baseQuery($filters)
            ->join('prestamo_equipo as pe2', 'pe2.idPrestamo', '=', 'p.idPrestamo')
            ->join('equipos as e2', 'e2.id', '=', 'pe2.idEquipo')
            ->join('tipo_equipos as te2', 'te2.id', '=', 'e2.tipo_equipo_id')
            ->join('categorias as c2', 'c2.id', '=', 'te2.categoria_id');

        // Rechazos SIN_STOCK por grupo
        $qSin = $this->stockoutQuery($filters)
            ->join('prestamo_equipo as pe3', 'pe3.idPrestamo', '=', 'p.idPrestamo')
            ->join('equipos as e3', 'e3.id', '=', 'pe3.idEquipo')
            ->join('tipo_equipos as te3', 'te3.id', '=', 'e3.tipo_equipo_id')
            ->join('categorias as c3', 'c3.id', '=', 'te3.categoria_id');

        if ($groupBy === 'equipo') {
            $qTot->select(
                'te2.id as grp_id',
                DB::raw("CONCAT(te2.nombre, ' ', te2.marca) as nombre"),
                'c2.nombre as categoria',
                DB::raw('COUNT(DISTINCT p.idPrestamo) as demanda')
            )->groupBy('te2.id', 'te2.nombre', 'te2.marca', 'c2.nombre');

            $qSin->select(
                'te3.id as grp_id',
                DB::raw('COUNT(DISTINCT p.idPrestamo) as rechazos')
            )->groupBy('te3.id');
        } else {
            $qTot->select(
                'c2.id as grp_id',
                'c2.nombre as nombre',
                DB::raw('COUNT(DISTINCT p.idPrestamo) as demanda')
            )->groupBy('c2.id', 'c2.nombre');

            $qSin->select(
                'c3.id as grp_id',
                DB::raw('COUNT(DISTINCT p.idPrestamo) as rechazos')
            )->groupBy('c3.id');
        }

        if ($currentFrom && $currentTo) {
            $qTot->whereBetween('p.fecha_inicio', [$currentFrom, $currentTo]);
            $qSin->whereBetween('p.fecha_inicio', [$currentFrom, $currentTo]);
        }

        $totMap = $qTot->get()->keyBy('grp_id');
        $sinMap = $qSin->get()->keyBy('grp_id');

        $points = [];
        foreach ($totMap as $id => $row) {
            $demanda   = (int) $row->demanda;
            $rechazos  = (int) ($sinMap[$id]->rechazos ?? 0);
            $points[] = [
                'nombre'    => $row->nombre,
                'categoria' => $row->categoria ?? $row->nombre,
                'demanda'   => $demanda,
                'rechazos'  => $rechazos,
                'pctPerdida' => $demanda > 0 ? round(($rechazos / $demanda) * 100, 1) : 0,
            ];
        }

        // Cuadrantes interpretativos
        $maxDemanda  = max(array_column($points, 'demanda') ?: [1]);
        $maxRechazos = max(array_column($points, 'rechazos') ?: [1]);
        $midDemanda  = $maxDemanda / 2;
        $midRechazos = $maxRechazos / 2;

        foreach ($points as &$pt) {
            if ($pt['demanda'] >= $midDemanda && $pt['rechazos'] >= $midRechazos) {
                $pt['cuadrante'] = 'critico';
            } elseif ($pt['demanda'] >= $midDemanda && $pt['rechazos'] < $midRechazos) {
                $pt['cuadrante'] = 'buen_stock';
            } elseif ($pt['demanda'] < $midDemanda && $pt['rechazos'] >= $midRechazos) {
                $pt['cuadrante'] = 'puntual';
            } else {
                $pt['cuadrante'] = 'irrelevante';
            }
        }
        unset($pt);

        return [
            'points'  => $points,
            'groupBy' => $groupBy,
            'axes'    => [
                'midDemanda'  => round($midDemanda),
                'midRechazos' => round($midRechazos),
            ],
            'hasData' => count($points) > 0,
            'meta'    => $this->buildMeta($filters, $currentFrom, $currentTo),
        ];
    }

    /* =========================================================
     * 5. Score de Prioridad de Compra (0–100)
     * ========================================================= */
    public function getStockoutPriority(array $filters): array
    {
        [$currentFrom, $currentTo, $prevFrom, $prevTo] = $this->resolvePeriods($filters);

        // Datos crudos por tipo_equipo
        $qTot = $this->baseQuery($filters)
            ->join('prestamo_equipo as pe2', 'pe2.idPrestamo', '=', 'p.idPrestamo')
            ->join('equipos as e2', 'e2.id', '=', 'pe2.idEquipo')
            ->join('tipo_equipos as te2', 'te2.id', '=', 'e2.tipo_equipo_id')
            ->join('categorias as c2', 'c2.id', '=', 'te2.categoria_id')
            ->select(
                'te2.id as grp_id',
                DB::raw("CONCAT(te2.nombre, ' — ', te2.marca, ' ', te2.modelo) as nombre"),
                'c2.nombre as categoria',
                DB::raw('COUNT(DISTINCT p.idPrestamo) as demanda')
            )
            ->groupBy('te2.id', 'te2.nombre', 'te2.marca', 'te2.modelo', 'c2.nombre');

        $qSin = $this->stockoutQuery($filters)
            ->join('prestamo_equipo as pe3', 'pe3.idPrestamo', '=', 'p.idPrestamo')
            ->join('equipos as e3', 'e3.id', '=', 'pe3.idEquipo')
            ->join('tipo_equipos as te3', 'te3.id', '=', 'e3.tipo_equipo_id')
            ->select('te3.id as grp_id', DB::raw('COUNT(DISTINCT p.idPrestamo) as rechazos'))
            ->groupBy('te3.id');

        if ($currentFrom && $currentTo) {
            $qTot->whereBetween('p.fecha_inicio', [$currentFrom, $currentTo]);
            $qSin->whereBetween('p.fecha_inicio', [$currentFrom, $currentTo]);
        }

        $totMap = $qTot->get()->keyBy('grp_id');
        $sinMap = $qSin->get()->keyBy('grp_id');

        // Tendencia: rechazos período anterior
        $sinPrevMap = collect();
        if ($prevFrom && $prevTo) {
            $sinPrevMap = $this->stockoutQuery($filters)
                ->join('prestamo_equipo as pe4', 'pe4.idPrestamo', '=', 'p.idPrestamo')
                ->join('equipos as e4', 'e4.id', '=', 'pe4.idEquipo')
                ->join('tipo_equipos as te4', 'te4.id', '=', 'e4.tipo_equipo_id')
                ->select('te4.id as grp_id', DB::raw('COUNT(DISTINCT p.idPrestamo) as rechazos'))
                ->whereBetween('p.fecha_inicio', [$prevFrom, $prevTo])
                ->groupBy('te4.id')
                ->pluck('rechazos', 'grp_id');
        }

        // Duración P90 por tipo_equipo (capacidad amarrada)
        $durRows = DB::table('prestamos as p')
            ->join('prestamo_equipo as pe5', 'pe5.idPrestamo', '=', 'p.idPrestamo')
            ->join('equipos as e5', 'e5.id', '=', 'pe5.idEquipo')
            ->whereIn(DB::raw('UPPER(p.estado)'), self::APPROVED_STATES)
            ->whereNotNull('p.fecha_inicio')
            ->whereNotNull('p.fecha_fin')
            ->select('e5.tipo_equipo_id as grp_id', DB::raw('DATEDIFF(p.fecha_fin, p.fecha_inicio) as dias'))
            ->get()
            ->groupBy('grp_id');

        $durP90Map = [];
        foreach ($durRows as $grpId => $rows) {
            $dias = $rows->pluck('dias')->filter(fn ($v) => $v !== null && $v >= 0)->sort()->values()->all();
            $durP90Map[$grpId] = count($dias) > 0 ? $this->percentile($dias, 90) : 0;
        }

        // Normalización
        $allDemandas = $totMap->pluck('demanda')->all();
        $maxDemanda  = max($allDemandas ?: [1]);
        $allDurP90   = array_values($durP90Map) ?: [1];
        $maxDurP90   = max($allDurP90) ?: 1;

        // Construir scores
        $items = [];
        foreach ($totMap as $id => $row) {
            $demanda      = (int) $row->demanda;
            $rechazos     = (int) ($sinMap[$id]->rechazos ?? 0);
            $stockoutRate = $demanda > 0 ? ($rechazos / $demanda) : 0;
            $prevRechazos = (int) ($sinPrevMap[$id] ?? 0);

            // Tendencia normalizada (0 a 1)
            $tendencia = 0;
            if ($prevRechazos > 0) {
                $tendencia = min(1, max(0, ($rechazos - $prevRechazos) / $prevRechazos));
            } elseif ($rechazos > 0) {
                $tendencia = 1;
            }

            // Demanda P90 normalizada (usamos demanda bruta normalizada vs max)
            $demandaNorm = $maxDemanda > 0 ? ($demanda / $maxDemanda) : 0;

            // Duración P90 normalizada
            $durP90     = $durP90Map[$id] ?? 0;
            $durP90Norm = $maxDurP90 > 0 ? ($durP90 / $maxDurP90) : 0;

            // Score = 0.4 * demanda_norm + 0.4 * stockout_rate + 0.1 * tendencia + 0.1 * durP90_norm
            $score = round(
                (0.4 * $demandaNorm + 0.4 * $stockoutRate + 0.1 * $tendencia + 0.1 * $durP90Norm) * 100,
                1
            );
            $score = min(100, max(0, $score));

            // Clasificación
            if ($score >= 80) {
                $clasificacion = 'Comprar urgente';
                $color = 'red';
            } elseif ($score >= 60) {
                $clasificacion = 'Evaluar compra';
                $color = 'amber';
            } elseif ($score >= 40) {
                $clasificacion = 'Monitorear';
                $color = 'blue';
            } else {
                $clasificacion = 'No prioritario';
                $color = 'gray';
            }

            $items[] = [
                'id'             => $id,
                'nombre'         => $row->nombre,
                'categoria'      => $row->categoria,
                'demanda'        => $demanda,
                'rechazos'       => $rechazos,
                'stockoutRate'   => round($stockoutRate * 100, 1),
                'tendencia'      => round($tendencia * 100, 1),
                'durP90'         => round($durP90, 1),
                'score'          => $score,
                'clasificacion'  => $clasificacion,
                'color'          => $color,
                'desglose'       => [
                    'demandaNorm'  => round($demandaNorm * 100, 1),
                    'stockoutRate' => round($stockoutRate * 100, 1),
                    'tendencia'    => round($tendencia * 100, 1),
                    'durP90Norm'   => round($durP90Norm * 100, 1),
                ],
                'tooltip' => "Score {$score}/100: "
                    . "demanda=" . round($demandaNorm * 100) . "% (×0.4), "
                    . "stockout=" . round($stockoutRate * 100, 1) . "% (×0.4), "
                    . "tendencia=" . round($tendencia * 100) . "% (×0.1), "
                    . "duración P90=" . round($durP90, 1) . "d (×0.1).",
            ];
        }

        // Ordenar por score descendente
        usort($items, fn ($a, $b) => $b['score'] <=> $a['score']);

        // Resumen
        $urgente   = count(array_filter($items, fn ($i) => $i['score'] >= 80));
        $evaluar   = count(array_filter($items, fn ($i) => $i['score'] >= 60 && $i['score'] < 80));
        $monitorear = count(array_filter($items, fn ($i) => $i['score'] >= 40 && $i['score'] < 60));

        return [
            'items'   => $items,
            'resumen' => [
                'urgente'    => $urgente,
                'evaluar'    => $evaluar,
                'monitorear' => $monitorear,
                'total'      => count($items),
            ],
            'pesos' => [
                'demandaNorm'  => 0.4,
                'stockoutRate' => 0.4,
                'tendencia'    => 0.1,
                'durP90Norm'   => 0.1,
            ],
            'hasData' => count($items) > 0,
            'meta'    => $this->buildMeta($filters, $currentFrom, $currentTo, $prevFrom, $prevTo),
        ];
    }

    /* =========================================================
     * Queries base
     * ========================================================= */

    /**
     * Base query sobre prestamos con joins estándar y filtros compartidos.
     */
    private function baseQuery(array $filters)
    {
        $query = DB::table('prestamos as p')
            ->leftJoin('prestamo_equipo as pe', 'pe.idPrestamo', '=', 'p.idPrestamo')
            ->leftJoin('equipos as e', 'e.id', '=', 'pe.idEquipo')
            ->leftJoin('tipo_equipos as te', 'te.id', '=', 'e.tipo_equipo_id')
            ->leftJoin('categorias as c', 'c.id', '=', 'te.categoria_id')
            ->leftJoin('grupo_prestamo as gp', 'gp.prestamo_id', '=', 'p.idPrestamo')
            ->leftJoin('grupos as g', 'g.id', '=', 'gp.grupo_id');

        $this->applySharedFilters($query, $filters);

        return $query;
    }

    /**
     * Query base para rechazos por stock.
     *
     * Fuente principal: prestamos.motivo_rechazo
     * Fallback: prestamo_historial.descripcion (datos antiguos).
     */
    private function stockoutQuery(array $filters)
    {
        $query = DB::table('prestamos as p')
            ->leftJoin('prestamo_historial as ph', 'ph.idPrestamo', '=', 'p.idPrestamo')
            ->leftJoin('prestamo_equipo as pe', 'pe.idPrestamo', '=', 'p.idPrestamo')
            ->leftJoin('equipos as e', 'e.id', '=', 'pe.idEquipo')
            ->leftJoin('tipo_equipos as te', 'te.id', '=', 'e.tipo_equipo_id')
            ->leftJoin('categorias as c', 'c.id', '=', 'te.categoria_id')
            ->leftJoin('grupo_prestamo as gp', 'gp.prestamo_id', '=', 'p.idPrestamo')
            ->leftJoin('grupos as g', 'g.id', '=', 'gp.grupo_id')
            ->where(DB::raw('UPPER(p.estado)'), 'RECHAZADO')
            ->where(function ($q) {
                $q->whereIn(DB::raw('UPPER(COALESCE(p.motivo_rechazo, \'\'))'), ['SIN_STOCK', 'CONFLICTO_HORARIO'])
                    ->orWhere(function ($legacy) {
                        $legacy->whereRaw("UPPER(REPLACE(COALESCE(ph.descripcion, ''), ' ', '_')) LIKE '%SIN_STOCK%'")
                            ->orWhereRaw("UPPER(REPLACE(COALESCE(ph.descripcion, ''), ' ', '_')) LIKE '%CONFLICTO_HORARIO%'");
                    });
            });

        $this->applySharedFilters($query, $filters);

        return $query;
    }

    /**
     * Filtros compartidos: categoría, equipo, anioIngreso, asignatura.
     */
    private function applySharedFilters($query, array $filters): void
    {
        // Categoría o tipo de equipo
        $categoria = $filters['categoria'] ?? null;
        if (!is_null($categoria) && $categoria !== '') {
            if (is_numeric($categoria)) {
                $num = (int) $categoria;
                $query->where(function ($sub) use ($num) {
                    $sub->where('c.id', $num)
                        ->orWhere('te.id', $num);
                });
            } else {
                $query->where(function ($sub) use ($categoria) {
                    $sub->where('c.nombre', 'like', "%{$categoria}%")
                        ->orWhere('te.nombre', 'like', "%{$categoria}%");
                });
            }
        }

        // Equipo específico
        $equipo = $filters['equipo'] ?? null;
        if (!is_null($equipo) && $equipo !== '') {
            if (is_numeric($equipo)) {
                $query->where('te.id', (int) $equipo);
            } else {
                $query->where('te.nombre', 'like', "%{$equipo}%");
            }
        }

        // Año de ingreso (grupos.anio)
        if (!empty($filters['anioIngreso'])) {
            $query->where('g.anio', (int) $filters['anioIngreso']);
        }

        // Asignatura — si el join existe
        if (!empty($filters['asignatura'])) {
            $query->where('g.asignatura_id', (int) $filters['asignatura']);
        }
    }

    /* =========================================================
     * Helpers
     * ========================================================= */

    private function resolvePeriods(array $filters): array
    {
        $tipo = strtoupper(trim($filters['tipo'] ?? 'FUERA'));
        $from = $filters['from'] ?? null;
        $to   = $filters['to'] ?? null;

        if ($tipo === 'FUERA' && $from && $to) {
            $currentFrom = Carbon::parse($from)->startOfDay();
            $currentTo   = Carbon::parse($to)->endOfDay();
            $days = $currentFrom->diffInDays($currentTo) ?: 1;
            $prevFrom = $currentFrom->copy()->subDays($days + 1)->startOfDay();
            $prevTo   = $currentFrom->copy()->subDay()->endOfDay();

            return [$currentFrom, $currentTo, $prevFrom, $prevTo];
        }

        return [null, null, null, null];
    }

    private function dateTrunc(string $column, string $bucket): string
    {
        return match ($bucket) {
            'day'   => "DATE({$column})",
            'week'  => "DATE(DATE_SUB({$column}, INTERVAL WEEKDAY({$column}) DAY))",
            'month' => "DATE_FORMAT({$column}, '%Y-%m-01')",
            default => "DATE({$column})",
        };
    }

    private function buildKpiCard(string $key, string $label, float $value, float $prev, ?string $unit, string $tooltip, bool $invertColors = false): array
    {
        $diff = $value - $prev;
        $pct  = $prev != 0 ? round((($value - $prev) / abs($prev)) * 100, 1) : ($value > 0 ? 100 : 0);

        if ($diff > 0) {
            $direction = 'up';
            $color     = $invertColors ? 'red' : 'green';
        } elseif ($diff < 0) {
            $direction = 'down';
            $color     = $invertColors ? 'green' : 'red';
        } else {
            $direction = 'neutral';
            $color     = 'gray';
        }

        return [
            'key'       => $key,
            'label'     => $label,
            'value'     => $value,
            'unit'      => $unit,
            'prev'      => $prev,
            'variation' => $pct,
            'direction' => $direction,
            'color'     => $color,
            'tooltip'   => $tooltip,
        ];
    }

    private function percentile(array $sortedValues, float $percent): float
    {
        $count = count($sortedValues);
        if ($count === 0) return 0.0;
        if ($count === 1) return (float) $sortedValues[0];

        $position = ($percent / 100) * ($count - 1);
        $floor = (int) floor($position);
        $ceil  = (int) ceil($position);

        if ($floor === $ceil) return (float) $sortedValues[$floor];

        $weight = $position - $floor;
        return ((float) $sortedValues[$floor] * (1 - $weight))
            + ((float) $sortedValues[$ceil] * $weight);
    }

    private function calcularPrioridad(int $rechazos, float $pctPerdida, float $tendencia): array
    {
        // Prioridad simplificada para el ranking
        if ($rechazos >= 5 && $pctPerdida >= 20) {
            return ['nivel' => 'Alta', 'color' => 'red'];
        }
        if ($rechazos >= 3 || $pctPerdida >= 10 || $tendencia > 50) {
            return ['nivel' => 'Media', 'color' => 'amber'];
        }
        return ['nivel' => 'Baja', 'color' => 'gray'];
    }

    private function buildMeta(array $filters, ?Carbon $from = null, ?Carbon $to = null, ?Carbon $prevFrom = null, ?Carbon $prevTo = null): array
    {
        return [
            'tipo'        => strtoupper(trim($filters['tipo'] ?? 'FUERA')),
            'from'        => $from?->toDateString(),
            'to'          => $to?->toDateString(),
            'prevFrom'    => $prevFrom?->toDateString(),
            'prevTo'      => $prevTo?->toDateString(),
            'generatedAt' => now()->toIso8601String(),
        ];
    }

    /**
     * Alertas automáticas basadas en umbrales.
     */
    private function buildAlertas(float $rateCurr, float $ratePrev, array $filters, ?Carbon $from, ?Carbon $to): array
    {
        $alertas = [];

        // Alerta 1: Stockout rate > 15%
        if ($rateCurr > 15) {
            $alertas[] = [
                'tipo'    => 'danger',
                'icono'   => 'bi-exclamation-triangle-fill',
                'mensaje' => "Stockout rate crítico: {$rateCurr}% de solicitudes perdidas por falta de stock.",
            ];
        } elseif ($rateCurr > 8) {
            $alertas[] = [
                'tipo'    => 'warning',
                'icono'   => 'bi-exclamation-circle-fill',
                'mensaje' => "Stockout rate elevado: {$rateCurr}% de solicitudes no atendidas.",
            ];
        }

        // Alerta 2: Tendencia creciente
        if ($ratePrev > 0 && $rateCurr > $ratePrev * 1.2) {
            $alertas[] = [
                'tipo'    => 'warning',
                'icono'   => 'bi-graph-up-arrow',
                'mensaje' => "Tendencia creciente: stockout rate subió de {$ratePrev}% a {$rateCurr}%.",
            ];
        }

        // Alerta 3: Concentración en una categoría (se calcula arriba y se pasa como alerta si top1 > 50%)
        if ($from && $to) {
            $qCatCheck = $this->stockoutQuery($filters)
                ->join('prestamo_equipo as pe_chk', 'pe_chk.idPrestamo', '=', 'p.idPrestamo')
                ->join('equipos as e_chk', 'e_chk.id', '=', 'pe_chk.idEquipo')
                ->join('tipo_equipos as te_chk', 'te_chk.id', '=', 'e_chk.tipo_equipo_id')
                ->join('categorias as c_chk', 'c_chk.id', '=', 'te_chk.categoria_id')
                ->select('c_chk.nombre as cat', DB::raw('COUNT(DISTINCT p.idPrestamo) as n'))
                ->whereBetween('p.fecha_inicio', [$from, $to])
                ->groupBy('c_chk.nombre')
                ->orderByDesc('n')
                ->limit(2)
                ->get();

            if ($qCatCheck->count() >= 2) {
                $totalCatStockout = $qCatCheck->sum('n');
                $topCat = $qCatCheck->first();
                if ($totalCatStockout > 0 && (($topCat->n / $totalCatStockout) * 100) > 50) {
                    $pctConc = round(($topCat->n / $totalCatStockout) * 100, 0);
                    $alertas[] = [
                        'tipo'    => 'info',
                        'icono'   => 'bi-bullseye',
                        'mensaje' => "Concentración: {$pctConc}% de los stockouts se concentran en \"{$topCat->cat}\".",
                    ];
                }
            }
        }

        return $alertas;
    }
}
