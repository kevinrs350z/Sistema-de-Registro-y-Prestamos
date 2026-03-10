<?php

namespace App\Services\Analytics;

use Carbon\Carbon;
use Illuminate\Support\Facades\DB;

/**
 * Servicio de analíticas de demanda.
 *
 * FUERA (externo)  → serie temporal por fecha_inicio  (día / semana / mes)
 * DENTRO (interno) → demanda agregada por bloque horario (Bloque 1 … 8)
 *
 * NUNCA se usan created_at / updated_at como dimensión temporal.
 */
class DemandAnalyticsService
{
    private const APPROVED_STATES = ['APROBADO', 'PENDIENTE_ENTREGA', 'ENTREGADO', 'DEVUELTO', 'ATRASADO'];
    private const STOCKOUT_REJECTION_REASONS = ['SIN_STOCK', 'CONFLICTO_HORARIO'];

    /* =========================================================
     * Punto de entrada público
     * ========================================================= */

    /**
     * KPIs ejecutivos: 6 tarjetas con valor + variación vs período anterior.
     *
     * Requiere: tipo, from, to (para FUERA); tipo (para DENTRO).
     */
    public function getExecutiveKpis(array $filters): array
    {
        $tipo = strtoupper(trim($filters['tipo'] ?? 'FUERA'));
        $from = $filters['from'] ?? null;
        $to   = $filters['to'] ?? null;

        // ── Períodos ──
        if ($tipo === 'FUERA' && $from && $to) {
            $currentFrom = Carbon::parse($from)->startOfDay();
            $currentTo   = Carbon::parse($to)->endOfDay();
            $days = $currentFrom->diffInDays($currentTo) ?: 1;
            $prevFrom = $currentFrom->copy()->subDays($days + 1)->startOfDay();
            $prevTo   = $currentFrom->copy()->subDay()->endOfDay();
        } else {
            // DENTRO: todo el histórico, sin comparación temporal
            $currentFrom = null;
            $currentTo   = null;
            $prevFrom    = null;
            $prevTo      = null;
        }

        // ── 1. Solicitudes del período ──
        $kpi1 = $this->kpiSolicitudes($filters, $currentFrom, $currentTo, $prevFrom, $prevTo);

        // ── 2. Utilización (% equipos usados vs disponibles) ──
        $kpi2 = $this->kpiUtilizacion($filters, $currentFrom, $currentTo, $prevFrom, $prevTo);

        // ── 3. % Atrasos ──
        $kpi3 = $this->kpiAtrasos($filters, $currentFrom, $currentTo, $prevFrom, $prevTo);

        // ── 4. % Rechazos por falta de stock ──
        $kpi4 = $this->kpiRechazosStock($filters, $currentFrom, $currentTo, $prevFrom, $prevTo);

        // ── 5. Duración P50 / P90 ──
        $kpi5 = $this->kpiDuracion($filters, $currentFrom, $currentTo, $prevFrom, $prevTo);

        // ── 6. Top categoría crítica ──
        $kpi6 = $this->kpiTopCritica($filters, $currentFrom, $currentTo);

        // ── 7. Equipos disponibles ──
        $kpi7 = $this->kpiEquiposDisponibles();

        // ── 8. Préstamos activos ──
        $kpi8 = $this->kpiPrestamosActivos($filters, $currentFrom, $currentTo, $prevFrom, $prevTo);

        // ── 9. Fill Rate (nivel de servicio) ──
        $kpi9 = $this->kpiFillRate($filters, $currentFrom, $currentTo, $prevFrom, $prevTo);

        // ── 10. Tiempo de ciclo solicitud → aprobación P50/P90 ──
        $kpi10 = $this->kpiTiempoCiclo($filters, $currentFrom, $currentTo);

        // ── 11. Frecuencia de préstamo por usuario P50/P90 ──
        $kpi11 = $this->kpiFrecuenciaUsuario($filters, $currentFrom, $currentTo);

        // ── 12. Demanda pico del periodo ──
        $kpi12 = $this->kpiDemandaPico($filters, $currentFrom, $currentTo, $prevFrom, $prevTo);

        return [
            'kpis' => [$kpi1, $kpi9, $kpi7, $kpi8, $kpi2, $kpi3, $kpi4, $kpi5, $kpi10, $kpi11, $kpi12, $kpi6],
            'meta' => [
                'tipo'        => $tipo,
                'from'        => $currentFrom?->toDateString(),
                'to'          => $currentTo?->toDateString(),
                'prevFrom'    => $prevFrom?->toDateString(),
                'prevTo'      => $prevTo?->toDateString(),
                'generatedAt' => now()->toIso8601String(),
            ],
        ];
    }

    /* ----- KPI helpers ----- */

    private function kpiSolicitudes(array $f, ?Carbon $from, ?Carbon $to, ?Carbon $pFrom, ?Carbon $pTo): array
    {
        $qCurr = $this->baseQuery($f)->select(DB::raw('COUNT(DISTINCT p.idPrestamo) AS total'));
        $qPrev = $this->baseQuery($f)->select(DB::raw('COUNT(DISTINCT p.idPrestamo) AS total'));

        if ($from && $to) {
            $qCurr->whereBetween('p.fecha_inicio', [$from, $to]);
            $qPrev->whereBetween('p.fecha_inicio', [$pFrom, $pTo]);
        }

        $curr = (int) ($qCurr->first()->total ?? 0);
        $prev = (int) ($qPrev->first()->total ?? 0);

        return $this->buildKpiCard(
            'solicitudes',
            'Solicitudes del período',
            $curr,
            $prev,
            null,
            'Cantidad total de solicitudes/préstamos registrados en el rango seleccionado.'
        );
    }

    private function kpiUtilizacion(array $f, ?Carbon $from, ?Carbon $to, ?Carbon $pFrom, ?Carbon $pTo): array
    {
        // Equipos totales activos (no dados de baja)
        $totalEquipos = DB::table('equipos')
            ->whereNull('deleted_at')
            ->whereNotIn('estado', ['DADO_DE_BAJA'])
            ->count();

        if ($totalEquipos === 0) {
            return $this->buildKpiCard('utilizacion', 'Utilización', 0, 0, '%', 'Porcentaje de equipos distintos usados respecto al total activo.');
        }

        $qCurr = $this->baseQuery($f)
            ->select(DB::raw('COUNT(DISTINCT pe.idEquipo) AS usados'));
        $qPrev = $this->baseQuery($f)
            ->select(DB::raw('COUNT(DISTINCT pe.idEquipo) AS usados'));

        // Solo contar préstamos aprobados
        $qCurr->whereIn(DB::raw('UPPER(p.estado)'), self::APPROVED_STATES);
        $qPrev->whereIn(DB::raw('UPPER(p.estado)'), self::APPROVED_STATES);

        if ($from && $to) {
            $qCurr->whereBetween('p.fecha_inicio', [$from, $to]);
            $qPrev->whereBetween('p.fecha_inicio', [$pFrom, $pTo]);
        }

        $usadosCurr = (int) ($qCurr->first()->usados ?? 0);
        $usadosPrev = (int) ($qPrev->first()->usados ?? 0);

        $pctCurr = round(($usadosCurr / $totalEquipos) * 100, 1);
        $pctPrev = round(($usadosPrev / $totalEquipos) * 100, 1);

        return $this->buildKpiCard(
            'utilizacion',
            'Utilización',
            $pctCurr,
            $pctPrev,
            '%',
            "Porcentaje de equipos distintos usados ({$usadosCurr}/{$totalEquipos}) vs total activo."
        );
    }

    private function kpiAtrasos(array $f, ?Carbon $from, ?Carbon $to, ?Carbon $pFrom, ?Carbon $pTo): array
    {
        // Total aprobados (base)
        $qTotalCurr = $this->baseQuery($f)->select(DB::raw('COUNT(DISTINCT p.idPrestamo) AS total'))
            ->whereIn(DB::raw('UPPER(p.estado)'), self::APPROVED_STATES);
        $qTotalPrev = $this->baseQuery($f)->select(DB::raw('COUNT(DISTINCT p.idPrestamo) AS total'))
            ->whereIn(DB::raw('UPPER(p.estado)'), self::APPROVED_STATES);

        // Atrasados
        $qAtrCurr = $this->baseQuery($f)->select(DB::raw('COUNT(DISTINCT p.idPrestamo) AS total'))
            ->where(DB::raw('UPPER(p.estado)'), 'ATRASADO');
        $qAtrPrev = $this->baseQuery($f)->select(DB::raw('COUNT(DISTINCT p.idPrestamo) AS total'))
            ->where(DB::raw('UPPER(p.estado)'), 'ATRASADO');

        if ($from && $to) {
            $qTotalCurr->whereBetween('p.fecha_inicio', [$from, $to]);
            $qTotalPrev->whereBetween('p.fecha_inicio', [$pFrom, $pTo]);
            $qAtrCurr->whereBetween('p.fecha_inicio', [$from, $to]);
            $qAtrPrev->whereBetween('p.fecha_inicio', [$pFrom, $pTo]);
        }

        $totalCurr = (int) ($qTotalCurr->first()->total ?? 0);
        $totalPrev = (int) ($qTotalPrev->first()->total ?? 0);
        $atrCurr   = (int) ($qAtrCurr->first()->total ?? 0);
        $atrPrev   = (int) ($qAtrPrev->first()->total ?? 0);

        $pctCurr = $totalCurr > 0 ? round(($atrCurr / $totalCurr) * 100, 1) : 0;
        $pctPrev = $totalPrev > 0 ? round(($atrPrev / $totalPrev) * 100, 1) : 0;

        return $this->buildKpiCard(
            'atrasos',
            '% Atrasos',
            $pctCurr,
            $pctPrev,
            '%',
            "Préstamos con estado ATRASADO ({$atrCurr}/{$totalCurr}) respecto a los aprobados.",
            true // invertir: subir es malo
        );
    }

    private function kpiRechazosStock(array $f, ?Carbon $from, ?Carbon $to, ?Carbon $pFrom, ?Carbon $pTo): array
    {
        // Total solicitudes
        $qTotCurr = $this->baseQuery($f)->select(DB::raw('COUNT(DISTINCT p.idPrestamo) AS total'));
        $qTotPrev = $this->baseQuery($f)->select(DB::raw('COUNT(DISTINCT p.idPrestamo) AS total'));

        // Rechazados por stock (solo motivo_rechazo, no otra_motivo que es campo libre del usuario)
        $qRejCurr = $this->baseQuery($f)->select(DB::raw('COUNT(DISTINCT p.idPrestamo) AS total'))
            ->where(DB::raw('UPPER(p.estado)'), 'RECHAZADO')
            ->whereIn(DB::raw("UPPER(COALESCE(p.motivo_rechazo, ''))"), self::STOCKOUT_REJECTION_REASONS);
        $qRejPrev = $this->baseQuery($f)->select(DB::raw('COUNT(DISTINCT p.idPrestamo) AS total'))
            ->where(DB::raw('UPPER(p.estado)'), 'RECHAZADO')
            ->whereIn(DB::raw("UPPER(COALESCE(p.motivo_rechazo, ''))"), self::STOCKOUT_REJECTION_REASONS);

        if ($from && $to) {
            $qTotCurr->whereBetween('p.fecha_inicio', [$from, $to]);
            $qTotPrev->whereBetween('p.fecha_inicio', [$pFrom, $pTo]);
            $qRejCurr->whereBetween('p.fecha_inicio', [$from, $to]);
            $qRejPrev->whereBetween('p.fecha_inicio', [$pFrom, $pTo]);
        }

        $totCurr = (int) ($qTotCurr->first()->total ?? 0);
        $totPrev = (int) ($qTotPrev->first()->total ?? 0);
        $rejCurr = (int) ($qRejCurr->first()->total ?? 0);
        $rejPrev = (int) ($qRejPrev->first()->total ?? 0);

        // Si no hay rechazos por stock, mostrar % rechazos total
        $hayStockReason = ($rejCurr + $rejPrev) > 0;
        if (!$hayStockReason) {
            $qRejCurr2 = $this->baseQuery($f)->select(DB::raw('COUNT(DISTINCT p.idPrestamo) AS total'))
                ->where(DB::raw('UPPER(p.estado)'), 'RECHAZADO');
            $qRejPrev2 = $this->baseQuery($f)->select(DB::raw('COUNT(DISTINCT p.idPrestamo) AS total'))
                ->where(DB::raw('UPPER(p.estado)'), 'RECHAZADO');
            if ($from && $to) {
                $qRejCurr2->whereBetween('p.fecha_inicio', [$from, $to]);
                $qRejPrev2->whereBetween('p.fecha_inicio', [$pFrom, $pTo]);
            }
            $rejCurr = (int) ($qRejCurr2->first()->total ?? 0);
            $rejPrev = (int) ($qRejPrev2->first()->total ?? 0);
        }

        $pctCurr = $totCurr > 0 ? round(($rejCurr / $totCurr) * 100, 1) : 0;
        $pctPrev = $totPrev > 0 ? round(($rejPrev / $totPrev) * 100, 1) : 0;

        $label = $hayStockReason ? 'Stockout Rate' : '% Rechazos total';
        $tooltip = $hayStockReason
            ? "Tasa de rotura de stock: {$pctCurr}% de solicitudes rechazadas por falta de equipo o conflicto horario ({$rejCurr}/{$totCurr}). Invertido: bajar es bueno."
            : "Rechazos totales ({$rejCurr}/{$totCurr}). No se detectaron motivos de stock específicos.";

        return $this->buildKpiCard($hayStockReason ? 'rechazos_stock' : 'rechazos_total', $label, $pctCurr, $pctPrev, '%', $tooltip, true);
    }

    private function kpiDuracion(array $f, ?Carbon $from, ?Carbon $to, ?Carbon $pFrom, ?Carbon $pTo): array
    {
        $tipo = strtoupper(trim($f['tipo'] ?? 'FUERA'));

        if ($tipo === 'DENTRO') {
            // Duración en minutos por bloques
            $qCurr = DB::table('prestamos as p')
                ->join('bloque_prestamos as bp', 'bp.idPrestamo', '=', 'p.idPrestamo')
                ->join('bloques as b', 'b.idBloque', '=', 'bp.idBloque')
                ->whereIn(DB::raw('UPPER(p.estado)'), self::APPROVED_STATES)
                ->select(DB::raw('TIMESTAMPDIFF(MINUTE, b.hora_inicio, b.hora_fin) as duracion'));

            $durations = $qCurr->pluck('duracion')->filter(fn ($v) => $v > 0)->sort()->values()->all();
            $unit = 'min';
        } else {
            // Duración en días — query directa sin join a prestamo_equipo para evitar multiplicación de filas
            $qCurr = DB::table('prestamos as p')
                ->whereIn(DB::raw('UPPER(p.estado)'), self::APPROVED_STATES)
                ->where('p.tipo', 'FUERA')
                ->whereNotNull('p.fecha_inicio')->whereNotNull('p.fecha_fin')
                ->select('p.idPrestamo', DB::raw('DATEDIFF(p.fecha_fin, p.fecha_inicio) as duracion'));

            if ($from && $to) {
                $qCurr->whereBetween('p.fecha_inicio', [$from, $to]);
            }

            $durations = $qCurr->pluck('duracion')->filter(fn ($v) => $v > 0)->sort()->values()->all();
            $unit = 'días';
        }

        $p50 = count($durations) > 0 ? $this->percentile($durations, 50) : 0;
        $p90 = count($durations) > 0 ? $this->percentile($durations, 90) : 0;

        return [
            'key'       => 'duracion',
            'label'     => 'Duración P50 / P90',
            'value'     => "P50: {$p50} · P90: {$p90}",
            'p50'       => $p50,
            'p90'       => $p90,
            'unit'      => $unit,
            'variation' => null,
            'direction' => 'neutral',
            'color'     => 'blue',
            'tooltip'   => "Duración típica (P50={$p50} {$unit}) y percentil alto (P90={$p90} {$unit}). P50 = la mitad se devuelve antes.",
        ];
    }

    private function kpiTopCritica(array $f, ?Carbon $from, ?Carbon $to): array
    {
        // Categoría con mayor presión: alta demanda + baja disponibilidad
        $q = DB::table('prestamos as p')
            ->join('prestamo_equipo as pe', 'pe.idPrestamo', '=', 'p.idPrestamo')
            ->join('equipos as eq', 'eq.id', '=', 'pe.idEquipo')
            ->join('tipo_equipos as te', 'te.id', '=', 'eq.tipo_equipo_id')
            ->join('categorias as cat', 'cat.id', '=', 'te.categoria_id')
            ->whereIn(DB::raw('UPPER(p.estado)'), array_merge(self::APPROVED_STATES, ['RECHAZADO']))
            ->select(
                'cat.id as cat_id',
                'cat.nombre as cat_nombre',
                DB::raw('COUNT(DISTINCT p.idPrestamo) as demanda')
            )
            ->groupBy('cat.id', 'cat.nombre')
            ->orderByDesc('demanda');

        if ($from && $to) {
            $q->whereBetween('p.fecha_inicio', [$from, $to]);
        }

        $topCats = $q->limit(5)->get();
        $winner = null;
        $maxPressure = -1;

        foreach ($topCats as $cat) {
            // Stock disponible de esa categoría
            $stock = DB::table('equipos as eq')
                ->join('tipo_equipos as te', 'te.id', '=', 'eq.tipo_equipo_id')
                ->where('te.categoria_id', $cat->cat_id)
                ->whereNull('eq.deleted_at')
                ->whereNotIn('eq.estado', ['DADO_DE_BAJA'])
                ->count();

            $disponible = DB::table('equipos as eq')
                ->join('tipo_equipos as te', 'te.id', '=', 'eq.tipo_equipo_id')
                ->where('te.categoria_id', $cat->cat_id)
                ->whereNull('eq.deleted_at')
                ->where('eq.estado', 'DISPONIBLE')
                ->count();

            // Pressure score = demanda / (disponibles + 1) — cuanto mayor, más crítica
            $pressure = $cat->demanda / max(1, $disponible);
            if ($pressure > $maxPressure) {
                $maxPressure = $pressure;
                $winner = (object) [
                    'nombre'     => $cat->cat_nombre,
                    'demanda'    => $cat->demanda,
                    'stock'      => $stock,
                    'disponible' => $disponible,
                    'pressure'   => round($pressure, 1),
                ];
            }
        }

        if (!$winner) {
            return [
                'key'       => 'top_critica',
                'label'     => 'Categoría crítica',
                'value'     => '—',
                'variation' => null,
                'direction' => 'neutral',
                'color'     => 'gray',
                'tooltip'   => 'No hay datos suficientes para determinar la categoría más presionada.',
            ];
        }

        return [
            'key'       => 'top_critica',
            'label'     => 'Categoría crítica',
            'value'     => $winner->nombre,
            'detail'    => "Demanda: {$winner->demanda} · Disponibles: {$winner->disponible}/{$winner->stock}",
            'pressure'  => $winner->pressure,
            'variation' => null,
            'direction' => 'neutral',
            'color'     => $winner->pressure > 5 ? 'red' : ($winner->pressure > 2 ? 'amber' : 'green'),
            'tooltip'   => "Categoría con mayor presión (demanda/disponibilidad). Score: {$winner->pressure}. {$winner->demanda} solicitudes con {$winner->disponible} equipos libres de {$winner->stock} totales.",
        ];
    }

    private function kpiEquiposDisponibles(): array
    {
        $total = DB::table('equipos')
            ->whereNull('deleted_at')
            ->whereNotIn('estado', ['DADO_DE_BAJA'])
            ->count();

        $disponibles = DB::table('equipos')
            ->whereNull('deleted_at')
            ->where('estado', 'DISPONIBLE')
            ->count();

        $prestados = DB::table('equipos')
            ->whereNull('deleted_at')
            ->where('estado', 'PRESTADO')
            ->count();

        $mantenimiento = DB::table('equipos')
            ->whereNull('deleted_at')
            ->whereIn('estado', ['MANTENIMIENTO', 'BAJA_TEMPORAL'])
            ->count();

        $pctDisp = $total > 0 ? round(($disponibles / $total) * 100, 1) : 0;

        $color = $pctDisp >= 50 ? 'green' : ($pctDisp >= 25 ? 'amber' : 'red');

        return [
            'key'        => 'equipos_disponibles',
            'label'      => 'Equipos disponibles',
            'value'      => $disponibles,
            'unit'       => null,
            'detail'     => "De {$total} activos · {$prestados} prestados · {$mantenimiento} en mtto.",
            'pctDisp'    => $pctDisp,
            'total'      => $total,
            'prestados'  => $prestados,
            'mantenimiento' => $mantenimiento,
            'variation'  => null,
            'direction'  => 'neutral',
            'color'      => $color,
            'tooltip'    => "Equipos en estado DISPONIBLE: {$disponibles} de {$total} activos ({$pctDisp}%). Prestados: {$prestados}. En mantenimiento/baja temporal: {$mantenimiento}.",
        ];
    }

    private function kpiPrestamosActivos(array $f, ?Carbon $from, ?Carbon $to, ?Carbon $pFrom, ?Carbon $pTo): array
    {
        $activeStates = ['APROBADO', 'PENDIENTE_ENTREGA', 'ENTREGADO', 'ATRASADO'];

        // Préstamos activos AHORA (sin importar periodo)
        $activosAhora = DB::table('prestamos')
            ->whereIn(DB::raw('UPPER(estado)'), $activeStates)
            ->count();

        // Préstamos activos en periodo actual vs anterior (para variación)
        $qCurr = $this->baseQuery($f)
            ->select(DB::raw('COUNT(DISTINCT p.idPrestamo) AS total'))
            ->whereIn(DB::raw('UPPER(p.estado)'), $activeStates);
        $qPrev = $this->baseQuery($f)
            ->select(DB::raw('COUNT(DISTINCT p.idPrestamo) AS total'))
            ->whereIn(DB::raw('UPPER(p.estado)'), $activeStates);

        if ($from && $to) {
            $qCurr->whereBetween('p.fecha_inicio', [$from, $to]);
            $qPrev->whereBetween('p.fecha_inicio', [$pFrom, $pTo]);
        }

        $curr = (int) ($qCurr->first()->total ?? 0);
        $prev = (int) ($qPrev->first()->total ?? 0);

        $card = $this->buildKpiCard(
            'prestamos_activos',
            'Préstamos activos',
            $curr,
            $prev,
            null,
            "Préstamos en curso (aprobados, pendientes de entrega, entregados o atrasados). Activos ahora: {$activosAhora}."
        );

        // Agregar dato extra: activos en este instante
        $card['activosAhora'] = $activosAhora;

        return $card;
    }

    private function kpiFillRate(array $f, ?Carbon $from, ?Carbon $to, ?Carbon $pFrom, ?Carbon $pTo): array
    {
        // Total solicitudes
        $qTotCurr = $this->baseQuery($f)->select(DB::raw('COUNT(DISTINCT p.idPrestamo) AS total'));
        $qTotPrev = $this->baseQuery($f)->select(DB::raw('COUNT(DISTINCT p.idPrestamo) AS total'));

        // Solicitudes que terminaron en préstamo (aprobadas+)
        $qOkCurr = $this->baseQuery($f)->select(DB::raw('COUNT(DISTINCT p.idPrestamo) AS total'))
            ->whereIn(DB::raw('UPPER(p.estado)'), self::APPROVED_STATES);
        $qOkPrev = $this->baseQuery($f)->select(DB::raw('COUNT(DISTINCT p.idPrestamo) AS total'))
            ->whereIn(DB::raw('UPPER(p.estado)'), self::APPROVED_STATES);

        if ($from && $to) {
            $qTotCurr->whereBetween('p.fecha_inicio', [$from, $to]);
            $qTotPrev->whereBetween('p.fecha_inicio', [$pFrom, $pTo]);
            $qOkCurr->whereBetween('p.fecha_inicio', [$from, $to]);
            $qOkPrev->whereBetween('p.fecha_inicio', [$pFrom, $pTo]);
        }

        $totCurr = (int) ($qTotCurr->first()->total ?? 0);
        $totPrev = (int) ($qTotPrev->first()->total ?? 0);
        $okCurr  = (int) ($qOkCurr->first()->total ?? 0);
        $okPrev  = (int) ($qOkPrev->first()->total ?? 0);

        $pctCurr = $totCurr > 0 ? round(($okCurr / $totCurr) * 100, 1) : 0;
        $pctPrev = $totPrev > 0 ? round(($okPrev / $totPrev) * 100, 1) : 0;

        return $this->buildKpiCard(
            'fill_rate',
            'Fill Rate (nivel de servicio)',
            $pctCurr,
            $pctPrev,
            '%',
            "Porcentaje de solicitudes que se convirtieron en préstamo ({$okCurr}/{$totCurr}). Es el indicador principal de cumplimiento de demanda."
        );
    }

    private function kpiTiempoCiclo(array $f, ?Carbon $from, ?Carbon $to): array
    {
        // Tiempo desde el primer evento del historial hasta la primera transición a APROBADO.
        // Evita usar created_at/updated_at del préstamo como base estadística.
        $q = DB::table('prestamos as p')
            ->join('prestamo_historial as ph_apr', function ($join) {
                $join->on('ph_apr.idPrestamo', '=', 'p.idPrestamo')
                    ->where(DB::raw('UPPER(ph_apr.estado_nuevo)'), 'APROBADO');
            })
            ->join('prestamo_historial as ph_ini', 'ph_ini.idPrestamo', '=', 'p.idPrestamo')
            ->select(DB::raw('TIMESTAMPDIFF(HOUR, MIN(ph_ini.created_at), MIN(ph_apr.created_at)) as horas'))
            ->groupBy('p.idPrestamo');

        if ($from && $to) {
            $q->whereBetween('p.fecha_inicio', [$from, $to]);
        }

        $horas = $q->pluck('horas')->filter(fn ($v) => $v !== null && $v >= 0)->sort()->values()->all();

        $p50 = count($horas) > 0 ? $this->percentile($horas, 50) : 0;
        $p90 = count($horas) > 0 ? $this->percentile($horas, 90) : 0;

        // Convertir a días si > 48h
        $unit = 'horas';
        $p50Display = $p50;
        $p90Display = $p90;
        if ($p90 > 48) {
            $p50Display = round($p50 / 24, 1);
            $p90Display = round($p90 / 24, 1);
            $unit = 'días';
        }

        return [
            'key'       => 'tiempo_ciclo',
            'label'     => 'Ciclo solicitud → aprobación',
            'value'     => "P50: {$p50Display} · P90: {$p90Display}",
            'p50'       => $p50Display,
            'p90'       => $p90Display,
            'unit'      => $unit,
            'count'     => count($horas),
            'variation' => null,
            'direction' => 'neutral',
            'color'     => $p90Display > 48 ? 'red' : ($p90Display > 24 ? 'amber' : 'blue'),
            'tooltip'   => "Tiempo desde primer evento registrado hasta aprobación. P50={$p50Display} {$unit}, P90={$p90Display} {$unit}. Basado en " . count($horas) . " solicitudes con historial. Si sube, el proceso se está tapando.",
        ];
    }

    private function kpiFrecuenciaUsuario(array $f, ?Carbon $from, ?Carbon $to): array
    {
        $q = DB::table('prestamos as p')
            ->select('p.idUser', DB::raw('COUNT(DISTINCT p.idPrestamo) as total'))
            ->groupBy('p.idUser');

        if ($from && $to) {
            $q->whereBetween('p.fecha_inicio', [$from, $to]);
        }

        $counts = $q->pluck('total')->sort()->values()->all();

        $p50 = count($counts) > 0 ? $this->percentile($counts, 50) : 0;
        $p90 = count($counts) > 0 ? $this->percentile($counts, 90) : 0;
        $totalUsers = count($counts);

        return [
            'key'       => 'frecuencia_usuario',
            'label'     => 'Frecuencia por usuario',
            'value'     => "P50: {$p50} · P90: {$p90}",
            'p50'       => $p50,
            'p90'       => $p90,
            'unit'      => 'préstamos',
            'totalUsers' => $totalUsers,
            'variation' => null,
            'direction' => 'neutral',
            'color'     => 'blue',
            'tooltip'   => "Préstamos por usuario: el típico hace {$p50} y los heavy-users llegan a {$p90}+. Total: {$totalUsers} usuarios activos. Útil para políticas y planificación.",
        ];
    }

    private function kpiDemandaPico(array $f, ?Carbon $from, ?Carbon $to, ?Carbon $pFrom, ?Carbon $pTo): array
    {
        $qCurr = $this->baseQuery($f)
            ->select(
                DB::raw('DATE(p.fecha_inicio) as dia'),
                DB::raw('COUNT(DISTINCT p.idPrestamo) as total')
            )
            ->groupBy(DB::raw('DATE(p.fecha_inicio)'));

        $qPrev = $this->baseQuery($f)
            ->select(
                DB::raw('DATE(p.fecha_inicio) as dia'),
                DB::raw('COUNT(DISTINCT p.idPrestamo) as total')
            )
            ->groupBy(DB::raw('DATE(p.fecha_inicio)'));

        if ($from && $to) {
            $qCurr->whereBetween('p.fecha_inicio', [$from, $to]);
            $qPrev->whereBetween('p.fecha_inicio', [$pFrom, $pTo]);
        }

        $dailyCurr = $qCurr->pluck('total', 'dia');
        $dailyPrev = $qPrev->pluck('total', 'dia');

        $peakCurr    = $dailyCurr->max() ?? 0;
        $peakDayCurr = $dailyCurr->search($peakCurr) ?: '—';
        $peakPrev    = $dailyPrev->max() ?? 0;

        $card = $this->buildKpiCard(
            'demanda_pico',
            'Demanda pico (día)',
            (float) $peakCurr,
            (float) $peakPrev,
            'sol.',
            "Máximo de solicitudes en un solo día: {$peakCurr} el {$peakDayCurr}. Periodo anterior: {$peakPrev}. Usar para justificar stock por picos."
        );

        $card['peakDay'] = (string) $peakDayCurr;

        return $card;
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

    public function getDemandTimeseries(array $filters): array
    {
        $tipo = strtoupper(trim($filters['tipo'] ?? 'FUERA'));

        if ($tipo === 'DENTRO') {
            return $this->demandByBloque($filters);
        }

        return $this->demandByDate($filters);
    }

    public function getLoanDurationDistribution(array $filters): array
    {
        $tipo = strtoupper(trim($filters['tipo'] ?? 'FUERA'));

        if ($tipo === 'DENTRO') {
            return $this->durationByBloque($filters);
        }

        return $this->durationByDate($filters);
    }

    public function getDemandVsDuration(array $filters): array
    {
        $tipo = strtoupper(trim($filters['tipo'] ?? 'FUERA'));
        $groupBy = $filters['groupBy'] ?? 'period';
        $bucket = $filters['bucket'] ?? 'week';
        $durationMetric = strtolower((string) ($filters['durationMetric'] ?? 'p50')) === 'p90' ? 'p90' : 'p50';

        if ($tipo === 'DENTRO' && $groupBy === 'period') {
            $groupBy = 'categoria';
        }

        [$groups, $metaRange] = $tipo === 'DENTRO'
            ? $this->buildDemandDurationGroupsByBloque($filters, $groupBy)
            : $this->buildDemandDurationGroupsByDate($filters, $groupBy, $bucket);

        if (empty($groups)) {
            return [
                'meta' => array_merge([
                    'tipo' => $tipo,
                    'groupBy' => $groupBy,
                    'bucket' => $groupBy === 'period' ? $bucket : null,
                    'durationMetric' => $durationMetric,
                    'durationUnit' => $tipo === 'DENTRO' ? 'minutos' : 'dias',
                    'xAxis' => 'Demanda (# de préstamos)',
                    'yAxis' => strtoupper($durationMetric) . ' de duración típica',
                    'quadrants' => $this->quadrantGuide(),
                ], $metaRange),
                'points' => [],
                'hasData' => false,
                'drilldown' => null,
            ];
        }

        $points = [];
        $allX = [];
        $allY = [];

        foreach ($groups as $key => $group) {
            $durations = array_values($group['durations']);
            sort($durations);

            $count = count($durations);
            if ($count === 0) {
                continue;
            }

            $x = $count;
            $p50 = $this->percentile($durations, 50);
            $p90 = $this->percentile($durations, 90);
            $y = $durationMetric === 'p90' ? $p90 : $p50;
            $stockRejectRate = $count > 0
                ? round(($group['stockRejects'] / $count) * 100, 2)
                : 0.0;

            $point = [
                'key' => $key,
                'label' => $group['label'],
                'groupBy' => $groupBy,
                'dimension' => $group['dimension'],
                'x' => $x,
                'y' => round($y, 2),
                'size' => $stockRejectRate,
                'stockoutRejectRate' => $stockRejectRate,
                'stockoutRejectCount' => $group['stockRejects'],
                'durationMetric' => $durationMetric,
                'count' => $count,
                'stats' => [
                    'min' => round((float) min($durations), 2),
                    'p50' => round($p50, 2),
                    'p90' => round($p90, 2),
                    'max' => round((float) max($durations), 2),
                ],
                'sampleLoanIds' => array_slice(array_values(array_keys($group['durations'])), 0, 12),
            ];

            $points[] = $point;
            $allX[] = $x;
            $allY[] = $y;
        }

        if (empty($points)) {
            return [
                'meta' => array_merge([
                    'tipo' => $tipo,
                    'groupBy' => $groupBy,
                    'bucket' => $groupBy === 'period' ? $bucket : null,
                    'durationMetric' => $durationMetric,
                    'durationUnit' => $tipo === 'DENTRO' ? 'minutos' : 'dias',
                    'xAxis' => 'Demanda (# de préstamos)',
                    'yAxis' => strtoupper($durationMetric) . ' de duración típica',
                    'quadrants' => $this->quadrantGuide(),
                ], $metaRange),
                'points' => [],
                'hasData' => false,
                'drilldown' => null,
            ];
        }

        $xCut = $this->percentile($allX, 50);
        $yCut = $this->percentile($allY, 50);

        foreach ($points as &$point) {
            $point['quadrant'] = $this->detectQuadrant($point['x'], $point['y'], $xCut, $yCut);
        }
        unset($point);

        usort($points, fn ($a, $b) => ($b['x'] <=> $a['x']) ?: ($b['y'] <=> $a['y']));

        $drilldown = null;
        $drillKey = trim((string) ($filters['drillKey'] ?? ''));
        if ($drillKey !== '') {
            $selected = collect($points)->first(fn ($p) => ($p['key'] ?? '') === $drillKey);
            if ($selected) {
                $drilldown = [
                    'selectedKey' => $selected['key'],
                    'selectedLabel' => $selected['label'],
                    'groupBy' => $selected['groupBy'],
                    'quadrant' => $selected['quadrant'],
                    'dimension' => $selected['dimension'],
                    'demand' => $selected['x'],
                    'durationTypical' => $selected['y'],
                    'durationMetric' => $selected['durationMetric'],
                    'durationUnit' => $tipo === 'DENTRO' ? 'minutos' : 'dias',
                    'stockoutRejectRate' => $selected['stockoutRejectRate'],
                    'stockoutRejectCount' => $selected['stockoutRejectCount'],
                    'sampleLoanIds' => $selected['sampleLoanIds'],
                    'howToRead' => $this->quadrantGuide()[$selected['quadrant']] ?? null,
                ];
            }
        }

        return [
            'meta' => array_merge([
                'tipo' => $tipo,
                'groupBy' => $groupBy,
                'bucket' => $groupBy === 'period' ? $bucket : null,
                'durationMetric' => $durationMetric,
                'durationUnit' => $tipo === 'DENTRO' ? 'minutos' : 'dias',
                'xAxis' => 'Demanda (# de préstamos)',
                'yAxis' => strtoupper($durationMetric) . ' de duración típica',
                'quadrants' => $this->quadrantGuide(),
                'cutLines' => [
                    'x' => round($xCut, 2),
                    'y' => round($yCut, 2),
                ],
            ], $metaRange),
            'points' => $points,
            'hasData' => count($points) > 0,
            'drilldown' => $drilldown,
        ];
    }

    private function buildDemandDurationGroupsByDate(array $filters, string $groupBy, string $bucket): array
    {
        $from = Carbon::parse($filters['from'])->startOfDay();
        $to = Carbon::parse($filters['to'])->endOfDay();

        $query = $this->baseQuery($filters)
            ->leftJoin('asignaturas as a', 'a.idAsignatura', '=', 'g.asignatura_id')
            ->where('p.tipo', 'FUERA')
            ->whereNotNull('p.fecha_inicio')
            ->whereNotNull('p.fecha_fin')
            ->whereDate('p.fecha_fin', '>=', DB::raw('p.fecha_inicio'))
            ->whereBetween('p.fecha_inicio', [$from->toDateString(), $to->toDateString()]);

        if (!empty($filters['asignatura'])) {
            $query->where('g.asignatura_id', (int) $filters['asignatura']);
        }

        $rows = $query->get([
            'p.idPrestamo',
            'p.estado',
            'p.motivo_rechazo',
            'p.fecha_inicio',
            'p.fecha_fin',
            'c.id as categoria_id',
            'c.nombre as categoria_nombre',
            'g.asignatura_id',
            'a.nombre as asignatura_nombre',
        ]);

        $groups = [];
        foreach ($rows as $row) {
            $inicio = Carbon::parse($row->fecha_inicio)->startOfDay();
            $fin = Carbon::parse($row->fecha_fin)->startOfDay();
            $duration = max(1, $inicio->diffInDays($fin) + 1);

            [$key, $label] = $this->durationGroupKeyAndLabel($groupBy, $bucket, $inicio, $row);
            if (!isset($groups[$key])) {
                $groups[$key] = [
                    'label' => $label,
                    'durations' => [],
                    'stockRejects' => 0,
                    'dimension' => $this->buildDimensionPayload($groupBy, $row, $label),
                ];
            }

            $loanId = (int) $row->idPrestamo;
            if (!isset($groups[$key]['durations'][$loanId])) {
                $groups[$key]['durations'][$loanId] = $duration;
                if ($this->isStockoutRejected($row->estado, $row->motivo_rechazo)) {
                    $groups[$key]['stockRejects']++;
                }
            }
        }

        return [$groups, ['from' => $from->toDateString(), 'to' => $to->toDateString()]];
    }

    private function buildDemandDurationGroupsByBloque(array $filters, string $groupBy): array
    {
        $query = $this->baseQuery($filters)
            ->leftJoin('asignaturas as a', 'a.idAsignatura', '=', 'g.asignatura_id')
            ->where('p.tipo', 'DENTRO')
            ->join('bloque_prestamos as bp', 'bp.idPrestamo', '=', 'p.idPrestamo')
            ->join('bloques as b', 'b.idBloque', '=', 'bp.idBloque');

        if (!empty($filters['asignatura'])) {
            $query->where('bp.idAsignatura', (int) $filters['asignatura']);
        }

        $rows = $query->get([
            'p.idPrestamo',
            'p.estado',
            'p.motivo_rechazo',
            'b.hora_inicio',
            'b.hora_fin',
            'c.id as categoria_id',
            'c.nombre as categoria_nombre',
            'g.asignatura_id',
            'a.nombre as asignatura_nombre',
        ]);

        $loanRows = [];
        foreach ($rows as $row) {
            $loanId = (int) $row->idPrestamo;
            $minutos = max(0, Carbon::parse($row->hora_inicio)->diffInMinutes(Carbon::parse($row->hora_fin)));

            if (!isset($loanRows[$loanId])) {
                $loanRows[$loanId] = [
                    'duration' => 0,
                    'estado' => $row->estado,
                    'motivo' => $row->motivo_rechazo,
                    'row' => $row,
                ];
            }

            $loanRows[$loanId]['duration'] += $minutos;
        }

        $groups = [];
        foreach ($loanRows as $loanId => $data) {
            $row = $data['row'];
            [$key, $label] = $this->dimensionKeyAndLabel($groupBy, $row);

            if (!isset($groups[$key])) {
                $groups[$key] = [
                    'label' => $label,
                    'durations' => [],
                    'stockRejects' => 0,
                    'dimension' => $this->buildDimensionPayload($groupBy, $row, $label),
                ];
            }

            $groups[$key]['durations'][$loanId] = $data['duration'];
            if ($this->isStockoutRejected($data['estado'], $data['motivo'])) {
                $groups[$key]['stockRejects']++;
            }
        }

        return [$groups, []];
    }

    private function buildDimensionPayload(string $groupBy, object $row, string $label): array
    {
        if ($groupBy === 'asignatura') {
            return [
                'type' => 'asignatura',
                'id' => $row->asignatura_id ?? null,
                'label' => $label,
            ];
        }

        if ($groupBy === 'categoria') {
            return [
                'type' => 'categoria',
                'id' => $row->categoria_id ?? null,
                'label' => $label,
            ];
        }

        return [
            'type' => 'period',
            'id' => null,
            'label' => $label,
        ];
    }

    private function isStockoutRejected(?string $estado, ?string $motivo): bool
    {
        return strtoupper((string) $estado) === 'RECHAZADO'
            && in_array(strtoupper((string) $motivo), self::STOCKOUT_REJECTION_REASONS, true);
    }

    private function detectQuadrant(float|int $x, float|int $y, float $xCut, float $yCut): string
    {
        if ($x >= $xCut && $y >= $yCut) {
            return 'alta_demanda_alta_duracion';
        }
        if ($x < $xCut && $y >= $yCut) {
            return 'baja_demanda_alta_duracion';
        }
        if ($x >= $xCut && $y < $yCut) {
            return 'alta_demanda_baja_duracion';
        }
        return 'baja_demanda_baja_duracion';
    }

    private function quadrantGuide(): array
    {
        return [
            'alta_demanda_alta_duracion' => 'Mucha demanda y préstamos largos. Conviene revisar la disponibilidad.',
            'baja_demanda_alta_duracion' => 'Poca demanda pero los préstamos duran mucho. Revisar plazos de devolución.',
            'alta_demanda_baja_duracion' => 'Se piden mucho y se devuelven rápido. Buena rotación.',
            'baja_demanda_baja_duracion' => 'Poca demanda y préstamos cortos. Sin problemas.',
        ];
    }

    /* =========================================================
     * FUERA — duración en días (fecha_inicio → fecha_fin)
     * ========================================================= */
    private function durationByDate(array $filters): array
    {
        $from = Carbon::parse($filters['from'])->startOfDay();
        $to = Carbon::parse($filters['to'])->endOfDay();
        $groupBy = $filters['groupBy'] ?? 'period';
        $bucket = $filters['bucket'] ?? 'week';

        $query = $this->baseQuery($filters)
            ->leftJoin('asignaturas as a', 'a.idAsignatura', '=', 'g.asignatura_id')
            ->where('p.tipo', 'FUERA')
            ->whereNotNull('p.fecha_inicio')
            ->whereNotNull('p.fecha_fin')
            ->whereDate('p.fecha_fin', '>=', DB::raw('p.fecha_inicio'))
            ->whereBetween('p.fecha_inicio', [$from->toDateString(), $to->toDateString()]);

        if (!empty($filters['asignatura'])) {
            $query->where('g.asignatura_id', (int) $filters['asignatura']);
        }

        $rows = $query
            ->orderBy('p.fecha_inicio')
            ->get([
                'p.idPrestamo',
                'p.fecha_inicio',
                'p.fecha_fin',
                'c.id as categoria_id',
                'c.nombre as categoria_nombre',
                'g.asignatura_id',
                'a.nombre as asignatura_nombre',
            ]);

        $groups = [];
        $dedupe = [];

        foreach ($rows as $row) {
            $inicio = Carbon::parse($row->fecha_inicio)->startOfDay();
            $fin = Carbon::parse($row->fecha_fin)->startOfDay();
            $duracionDias = max(1, $inicio->diffInDays($fin) + 1);

            [$key, $label] = $this->durationGroupKeyAndLabel($groupBy, $bucket, $inicio, $row);
            $uniqueKey = $key . '|' . (string) $row->idPrestamo;

            if (isset($dedupe[$uniqueKey])) {
                continue;
            }
            $dedupe[$uniqueKey] = true;

            if (!isset($groups[$key])) {
                $groups[$key] = [
                    'label' => $label,
                    'values' => [],
                ];
            }

            $groups[$key]['values'][] = $duracionDias;
        }

        return $this->buildBoxplotResponse($groups, [
            'from' => $from->toDateString(),
            'to' => $to->toDateString(),
            'tipo' => 'FUERA',
            'groupBy' => $groupBy,
            'bucket' => $bucket,
            'unit' => 'dias',
            'durationSource' => 'prestamos.fecha_inicio / prestamos.fecha_fin',
        ]);
    }

    /* =========================================================
     * DENTRO — duración en minutos (bloques.hora_inicio → hora_fin)
     *
     * Cada préstamo DENTRO tiene N bloques asignados en
     * bloque_prestamos → bloques.  La duración total del
     * préstamo es la suma de minutos de todos sus bloques.
     * ========================================================= */
    private function durationByBloque(array $filters): array
    {
        $groupBy = $filters['groupBy'] ?? 'categoria';
        // Para DENTRO no hay fecha de préstamo, así que "period" no aplica.
        if ($groupBy === 'period') {
            $groupBy = 'categoria';
        }

        $query = $this->baseQuery($filters)
            ->leftJoin('asignaturas as a', 'a.idAsignatura', '=', 'g.asignatura_id')
            ->where('p.tipo', 'DENTRO')
            ->join('bloque_prestamos as bp', 'bp.idPrestamo', '=', 'p.idPrestamo')
            ->join('bloques as b', 'b.idBloque', '=', 'bp.idBloque');

        if (!empty($filters['asignatura'])) {
            $query->where('bp.idAsignatura', (int) $filters['asignatura']);
        }

        $rows = $query
            ->get([
                'p.idPrestamo',
                'b.hora_inicio',
                'b.hora_fin',
                'c.id as categoria_id',
                'c.nombre as categoria_nombre',
                'g.asignatura_id',
                'a.nombre as asignatura_nombre',
            ]);

        // Acumular minutos por préstamo
        $loanMinutes = []; // idPrestamo => { minutes, row (último para agrupar) }
        foreach ($rows as $row) {
            $inicio = Carbon::parse($row->hora_inicio);
            $fin = Carbon::parse($row->hora_fin);
            $minutos = max(0, $inicio->diffInMinutes($fin));

            $id = (int) $row->idPrestamo;
            if (!isset($loanMinutes[$id])) {
                $loanMinutes[$id] = ['minutes' => 0, 'row' => $row];
            }
            $loanMinutes[$id]['minutes'] += $minutos;
        }

        // Agrupar duración total por dimensión
        $groups = [];
        foreach ($loanMinutes as $entry) {
            $row = $entry['row'];
            [$key, $label] = $this->dimensionKeyAndLabel($groupBy, $row);

            if (!isset($groups[$key])) {
                $groups[$key] = ['label' => $label, 'values' => []];
            }
            $groups[$key]['values'][] = $entry['minutes'];
        }

        return $this->buildBoxplotResponse($groups, [
            'tipo' => 'DENTRO',
            'groupBy' => $groupBy,
            'unit' => 'minutos',
            'durationSource' => 'bloques.hora_inicio / bloques.hora_fin (suma por préstamo)',
        ]);
    }

    /* =========================================================
     * Genera la respuesta boxplot + P90 a partir de $groups
     * ========================================================= */
    private function buildBoxplotResponse(array $groups, array $meta): array
    {
        if (empty($groups)) {
            return [
                'meta' => array_merge($meta, [
                    'recommendation' => 'Usar mediana (P50) para representar duración típica y reducir sesgo de outliers.',
                ]),
                'labels' => [],
                'boxplot' => [],
                'p90' => [],
                'summary' => [],
                'hasData' => false,
            ];
        }

        ksort($groups);

        $labels = [];
        $boxplot = [];
        $p90 = [];
        $summary = [];

        foreach ($groups as $group) {
            $values = $group['values'];
            sort($values);

            $min = (float) min($values);
            $p25 = $this->percentile($values, 25);
            $p50 = $this->percentile($values, 50);
            $p75 = $this->percentile($values, 75);
            $p90Value = $this->percentile($values, 90);
            $max = (float) max($values);

            $labels[] = $group['label'];
            $boxplot[] = [
                round($min, 2),
                round($p25, 2),
                round($p50, 2),
                round($p75, 2),
                round($max, 2),
            ];
            $p90[] = round($p90Value, 2);
            $summary[] = [
                'label' => $group['label'],
                'count' => count($values),
                'min' => round($min, 2),
                'p25' => round($p25, 2),
                'p50' => round($p50, 2),
                'p75' => round($p75, 2),
                'p90' => round($p90Value, 2),
                'max' => round($max, 2),
            ];
        }

        return [
            'meta' => array_merge($meta, [
                'recommendation' => 'Usar mediana (P50) para representar duración típica y reducir sesgo de outliers.',
            ]),
            'labels' => $labels,
            'boxplot' => $boxplot,
            'p90' => $p90,
            'summary' => $summary,
            'hasData' => count($labels) > 0,
        ];
    }

    /* =========================================================
     * FUERA — serie temporal por fecha_inicio
     * ========================================================= */
    private function demandByDate(array $filters): array
    {
        $from   = Carbon::parse($filters['from'])->startOfDay();
        $to     = Carbon::parse($filters['to'])->endOfDay();
        $bucket = $filters['bucket'] ?? 'day';

        $query = $this->baseQuery($filters)
            ->where('p.tipo', 'FUERA')
            ->whereNotNull('p.fecha_inicio')
            ->whereBetween('p.fecha_inicio', [$from->toDateString(), $to->toDateString()]);

        $rows = $query
            ->select(DB::raw('DISTINCT p.idPrestamo'), 'p.fecha_inicio', 'p.estado')
            ->orderBy('p.fecha_inicio')
            ->get();

        // Agrupar por bucket
        $totalByPeriod    = [];
        $approvedByPeriod = [];

        foreach ($rows as $row) {
            $key = $this->bucketStart(Carbon::parse($row->fecha_inicio), $bucket)
                        ->toDateString();

            $totalByPeriod[$key] = ($totalByPeriod[$key] ?? 0) + 1;

            if (in_array(strtoupper((string) $row->estado), self::APPROVED_STATES, true)) {
                $approvedByPeriod[$key] = ($approvedByPeriod[$key] ?? 0) + 1;
            }
        }

        // Eje X continuo
        $periods  = $this->buildPeriods($from->copy(), $to->copy(), $bucket);
        $labels   = [];
        $totals   = [];
        $approved = [];

        foreach ($periods as $p) {
            $k         = $p['period_start'];
            $labels[]  = $p['label'];
            $totals[]  = $totalByPeriod[$k] ?? 0;
            $approved[] = $approvedByPeriod[$k] ?? 0;
        }

        return [
            'mode' => 'external',
            'meta' => [
                'from'   => $from->toDateString(),
                'to'     => $to->toDateString(),
                'bucket' => $bucket,
                'tipo'   => 'FUERA',
                'filters' => $this->metaFilters($filters),
            ],
            'labels' => $labels,
            'series' => [
                'total_solicitudes' => $totals,
                'aprobadas'         => $approved,
            ],
            'hasData' => array_sum($totals) > 0,
        ];
    }

    /* =========================================================
     * DENTRO — demanda agregada por bloque horario
     * ========================================================= */
    private function demandByBloque(array $filters): array
    {
        // Todos los bloques para X-axis completa
        $bloques = DB::table('bloques')
            ->orderBy('hora_inicio')
            ->get(['idBloque', 'nombre', 'hora_inicio', 'hora_fin']);

        // Contar solicitudes por bloque
        $query = $this->baseQuery($filters)
            ->where('p.tipo', 'DENTRO')
            ->join('bloque_prestamos as bp', 'bp.idPrestamo', '=', 'p.idPrestamo')
            ->join('bloques as b', 'b.idBloque', '=', 'bp.idBloque');

        // Filtro de asignatura en bloque_prestamos
        if (!empty($filters['asignatura'])) {
            $query->where('bp.idAsignatura', (int) $filters['asignatura']);
        }

        $counts = $query
            ->groupBy('b.idBloque', 'b.nombre', 'b.hora_inicio', 'b.hora_fin')
            ->select(
                'b.idBloque',
                'b.nombre',
                'b.hora_inicio',
                'b.hora_fin',
                DB::raw('COUNT(DISTINCT p.idPrestamo) as total'),
                DB::raw(
                    'COUNT(DISTINCT CASE WHEN UPPER(p.estado) IN ('
                    . collect(self::APPROVED_STATES)->map(fn ($s) => "'$s'")->implode(',')
                    . ') THEN p.idPrestamo END) as aprobadas'
                )
            )
            ->get()
            ->keyBy('idBloque');

        $labels   = [];
        $totals   = [];
        $approved = [];

        foreach ($bloques as $bloque) {
            $hora = substr($bloque->hora_inicio, 0, 5) . '–' . substr($bloque->hora_fin, 0, 5);
            $labels[]  = "{$bloque->nombre} ({$hora})";
            $totals[]  = (int) ($counts[$bloque->idBloque]->total ?? 0);
            $approved[] = (int) ($counts[$bloque->idBloque]->aprobadas ?? 0);
        }

        return [
            'mode' => 'internal',
            'meta' => [
                'tipo'    => 'DENTRO',
                'filters' => $this->metaFilters($filters),
                'bloques' => $bloques->count(),
            ],
            'labels' => $labels,
            'series' => [
                'total_solicitudes' => $totals,
                'aprobadas'         => $approved,
            ],
            'hasData' => array_sum($totals) > 0,
        ];
    }

    /* =========================================================
     * Query base con filtros compartidos (sin tipo ni fechas)
     * ========================================================= */
    private function baseQuery(array $filters)
    {
        $query = DB::table('prestamos as p')
            ->leftJoin('prestamo_equipo as pe', 'pe.idPrestamo', '=', 'p.idPrestamo')
            ->leftJoin('equipos as e', 'e.id', '=', 'pe.idEquipo')
            ->leftJoin('tipo_equipos as te', 'te.id', '=', 'e.tipo_equipo_id')
            ->leftJoin('categorias as c', 'c.id', '=', 'te.categoria_id')
            ->leftJoin('grupo_prestamo as gp', 'gp.prestamo_id', '=', 'p.idPrestamo')
            ->leftJoin('grupos as g', 'g.id', '=', 'gp.grupo_id');

        // ── Filtro por tipo FUERA/DENTRO ──
        $tipo = $filters['tipo'] ?? null;
        if ($tipo && in_array(strtoupper(trim($tipo)), ['FUERA', 'DENTRO'])) {
            $query->where('p.tipo', strtoupper(trim($tipo)));
        }

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
                // Sanitizar wildcards en input del usuario
                $categoriaSafe = str_replace(['%', '_'], ['\%', '\_'], $categoria);
                $query->where(function ($sub) use ($categoriaSafe) {
                    $sub->where('c.nombre', 'like', "%{$categoriaSafe}%")
                        ->orWhere('te.nombre', 'like', "%{$categoriaSafe}%");
                });
            }
        }

        // Año de ingreso (grupos.anio)
        if (!empty($filters['anioIngreso'])) {
            $query->where('g.anio', (int) $filters['anioIngreso']);
        }

        // Estado
        $estado = $filters['estado'] ?? null;
        if (!is_null($estado) && trim($estado) !== '' && strtoupper(trim($estado)) !== 'TODOS') {
            $estados = array_values(array_filter(array_map(
                static fn ($item) => strtoupper(trim($item)),
                explode(',', $estado)
            )));
            if (!empty($estados)) {
                $query->whereIn(DB::raw('UPPER(p.estado)'), $estados);
            }
        }

        return $query;
    }

    /* =========================================================
     * Helpers de periodos para FUERA
     * ========================================================= */
    private function buildPeriods(Carbon $from, Carbon $to, string $bucket): array
    {
        $cursor = $this->bucketStart($from->copy(), $bucket);
        $end    = $this->bucketStart($to->copy(), $bucket);

        $periods = [];
        while ($cursor->lessThanOrEqualTo($end)) {
            $periods[] = [
                'period_start' => $cursor->toDateString(),
                'label'        => $this->periodLabel($cursor, $bucket),
            ];

            match ($bucket) {
                'week'  => $cursor->addWeek(),
                'month' => $cursor->addMonth(),
                default => $cursor->addDay(),
            };
        }

        return $periods;
    }

    private function bucketStart(Carbon $date, string $bucket): Carbon
    {
        return match ($bucket) {
            'week'  => $date->startOfWeek(Carbon::MONDAY),
            'month' => $date->startOfMonth(),
            default => $date->startOfDay(),
        };
    }

    private function periodLabel(Carbon $date, string $bucket): string
    {
        return match ($bucket) {
            'week'  => $date->isoFormat('GGGG-[W]WW'),
            'month' => $date->format('Y-m'),
            default => $date->format('Y-m-d'),
        };
    }

    private function metaFilters(array $filters): array
    {
        return [
            'categoria'   => $filters['categoria'] ?? null,
            'asignatura'  => $filters['asignatura'] ?? null,
            'anioIngreso' => $filters['anioIngreso'] ?? null,
            'estado'      => $filters['estado'] ?? null,
        ];
    }

    private function durationGroupKeyAndLabel(string $groupBy, string $bucket, Carbon $inicio, object $row): array
    {
        if ($groupBy === 'asignatura' || $groupBy === 'categoria') {
            return $this->dimensionKeyAndLabel($groupBy, $row);
        }

        $periodStart = $bucket === 'month'
            ? $inicio->copy()->startOfMonth()
            : $inicio->copy()->startOfWeek(Carbon::MONDAY);

        $key = $bucket === 'month'
            ? 'period:' . $periodStart->format('Y-m')
            : 'period:' . $periodStart->isoFormat('GGGG-[W]WW');

        $label = $bucket === 'month'
            ? $periodStart->format('Y-m')
            : $periodStart->isoFormat('GGGG-[W]WW');

        return [$key, $label];
    }

    /**
     * Clave + label para agrupación por dimensión (asignatura / categoría).
     * Compartido entre FUERA y DENTRO.
     */
    private function dimensionKeyAndLabel(string $dimension, object $row): array
    {
        if ($dimension === 'asignatura') {
            $id = $row->asignatura_id ? (string) $row->asignatura_id : 'sin_asignatura';
            $label = $row->asignatura_nombre ? (string) $row->asignatura_nombre : 'Sin asignatura';
            return ["asignatura:$id", $label];
        }

        $id = $row->categoria_id ? (string) $row->categoria_id : 'sin_categoria';
        $label = $row->categoria_nombre ? (string) $row->categoria_nombre : 'Sin categoría';
        return ["categoria:$id", $label];
    }

    /* =========================================================
     * Scatter 4: Demanda vs Stock
     *
     * Cada punto = 1 tipo_equipo (o categoría, según groupBy).
     *   X = demanda total (# préstamos distintos en el rango)
     *   Y = stock operativo actual (equipos con estado operativo)
     * Color → categoría del tipo_equipo.
     * Cuadrantes: alta_demanda_bajo_stock (comprar) …
     * ========================================================= */
    public function getDemandVsStock(array $filters): array
    {
        $tipo = strtoupper(trim($filters['tipo'] ?? 'FUERA'));
        $groupBy = $filters['groupBy'] ?? 'tipo_equipo';
        if (!in_array($groupBy, ['tipo_equipo', 'categoria'], true)) {
            $groupBy = 'tipo_equipo';
        }

        // --- 1. Stock operativo por tipo_equipo -----------------------
        $stockRows = DB::table('equipos as eq')
            ->join('tipo_equipos as te', 'te.id', '=', 'eq.tipo_equipo_id')
            ->leftJoin('categorias as cat', 'cat.id', '=', 'te.categoria_id')
            ->select(
                'te.id as tipo_equipo_id',
                'te.nombre as tipo_equipo_nombre',
                'cat.id as categoria_id',
                'cat.nombre as categoria_nombre',
                DB::raw('COUNT(*) as total_equipos'),
                DB::raw("SUM(CASE WHEN eq.estado IN ('MANTENIMIENTO','BAJA_TEMPORAL','DADO_DE_BAJA') THEN 1 ELSE 0 END) as no_operativos")
            )
            ->groupBy('te.id', 'te.nombre', 'cat.id', 'cat.nombre')
            ->get();

        $stockMap = []; // tipo_equipo_id => { stock, catId, catNombre, teNombre }
        foreach ($stockRows as $row) {
            $stockMap[(int) $row->tipo_equipo_id] = [
                'stock' => (int) $row->total_equipos - (int) $row->no_operativos,
                'total' => (int) $row->total_equipos,
                'noOp'  => (int) $row->no_operativos,
                'catId' => $row->categoria_id,
                'catNombre' => $row->categoria_nombre ?? 'Sin categoría',
                'teNombre'  => $row->tipo_equipo_nombre ?? 'Sin tipo',
            ];
        }

        // --- 2. Demanda por tipo_equipo (FUERA o DENTRO) ----------------
        $demandMap = []; // tipo_equipo_id => count of distinct loans
        if ($tipo === 'DENTRO') {
            $dQuery = DB::table('prestamos as p')
                ->join('prestamo_equipo as pe', 'pe.idPrestamo', '=', 'p.idPrestamo')
                ->join('equipos as e', 'e.id', '=', 'pe.idEquipo')
                ->where('p.tipo', 'DENTRO')
                ->whereIn(DB::raw('UPPER(p.estado)'), self::APPROVED_STATES);

            if (!empty($filters['from']) && !empty($filters['to'])) {
                $dQuery->whereBetween('p.fecha_inicio', [$filters['from'], $filters['to']]);
            }

            $dRows = $dQuery
                ->select('e.tipo_equipo_id', DB::raw('COUNT(DISTINCT p.idPrestamo) as demanda'))
                ->groupBy('e.tipo_equipo_id')
                ->get();
        } else {
            $from = Carbon::parse($filters['from'])->startOfDay();
            $to   = Carbon::parse($filters['to'])->endOfDay();

            $dQuery = DB::table('prestamos as p')
                ->join('prestamo_equipo as pe', 'pe.idPrestamo', '=', 'p.idPrestamo')
                ->join('equipos as e', 'e.id', '=', 'pe.idEquipo')
                ->where('p.tipo', 'FUERA')
                ->whereNotNull('p.fecha_inicio')
                ->whereBetween('p.fecha_inicio', [$from->toDateString(), $to->toDateString()])
                ->whereIn(DB::raw('UPPER(p.estado)'), self::APPROVED_STATES);

            $dRows = $dQuery
                ->select('e.tipo_equipo_id', DB::raw('COUNT(DISTINCT p.idPrestamo) as demanda'))
                ->groupBy('e.tipo_equipo_id')
                ->get();
        }

        foreach ($dRows as $row) {
            $demandMap[(int) $row->tipo_equipo_id] = (int) $row->demanda;
        }

        // --- 3. Rechazos por stock por tipo_equipo ---
        $rejectQuery = DB::table('prestamos as p')
            ->join('prestamo_equipo as pe', 'pe.idPrestamo', '=', 'p.idPrestamo')
            ->join('equipos as e', 'e.id', '=', 'pe.idEquipo')
            ->where(DB::raw('UPPER(p.estado)'), 'RECHAZADO')
            ->whereIn(DB::raw('UPPER(p.motivo_rechazo)'), self::STOCKOUT_REJECTION_REASONS);

        if ($tipo === 'FUERA' && !empty($filters['from']) && !empty($filters['to'])) {
            $rejectQuery->whereBetween('p.fecha_inicio', [
                Carbon::parse($filters['from'])->toDateString(),
                Carbon::parse($filters['to'])->toDateString(),
            ]);
        }

        $rejectMap = [];
        $rejectQuery
            ->select('e.tipo_equipo_id', DB::raw('COUNT(DISTINCT p.idPrestamo) as rechazos'))
            ->groupBy('e.tipo_equipo_id')
            ->get()
            ->each(function ($r) use (&$rejectMap) {
                $rejectMap[(int) $r->tipo_equipo_id] = (int) $r->rechazos;
            });

        // --- 4. Construir puntos ------------------------------------
        $points = [];
        $allX = [];
        $allY = [];

        // Merge all known tipo_equipo_ids
        $allTeIds = array_unique(array_merge(array_keys($stockMap), array_keys($demandMap)));

        foreach ($allTeIds as $teId) {
            $stock = $stockMap[$teId] ?? null;
            $demand = $demandMap[$teId] ?? 0;

            if (!$stock) {
                continue; // skip if no equipment record
            }

            $rejects = $rejectMap[$teId] ?? 0;
            $totalRequests = $demand + $rejects;
            $rejectRate = $totalRequests > 0 ? round(($rejects / $totalRequests) * 100, 2) : 0.0;
            $saturacion = $stock['stock'] > 0 ? round(($demand / $stock['stock']) * 100, 1) : ($demand > 0 ? 999.9 : 0.0);
            $deficit = $demand - $stock['stock'];

            if ($groupBy === 'categoria') {
                $key = 'cat:' . ($stock['catId'] ?? 'sin');
                $label = $stock['catNombre'];
            } else {
                $key = 'te:' . $teId;
                $label = $stock['teNombre'];
            }

            $points[] = [
                'key' => $key,
                'tipoEquipoId' => $teId,
                'label' => $label,
                'categoria' => $stock['catNombre'],
                'categoriaId' => $stock['catId'],
                'x' => $demand,
                'y' => $stock['stock'],
                'stockTotal' => $stock['total'],
                'stockNoOperativo' => $stock['noOp'],
                'rejectRate' => $rejectRate,
                'rejectCount' => $rejects,
                'saturacion' => $saturacion,
                'deficit' => $deficit,
            ];

            $allX[] = $demand;
            $allY[] = $stock['stock'];
        }

        // Cuando se agrupa por categoría, consolidar puntos del mismo cat
        if ($groupBy === 'categoria') {
            $merged = [];
            foreach ($points as $pt) {
                $k = $pt['key'];
                if (!isset($merged[$k])) {
                    $merged[$k] = $pt;
                } else {
                    $merged[$k]['x'] += $pt['x'];
                    $merged[$k]['y'] += $pt['y'];
                    $merged[$k]['stockTotal'] += $pt['stockTotal'];
                    $merged[$k]['stockNoOperativo'] += $pt['stockNoOperativo'];
                    $merged[$k]['rejectCount'] += $pt['rejectCount'];
                }
            }
            // Recalculate derived fields
            $points = [];
            $allX = [];
            $allY = [];
            foreach ($merged as $pt) {
                $totalReq = $pt['x'] + $pt['rejectCount'];
                $pt['rejectRate'] = $totalReq > 0 ? round(($pt['rejectCount'] / $totalReq) * 100, 2) : 0.0;
                $pt['saturacion'] = $pt['y'] > 0 ? round(($pt['x'] / $pt['y']) * 100, 1) : ($pt['x'] > 0 ? 999.9 : 0.0);
                $pt['deficit'] = $pt['x'] - $pt['y'];
                $points[] = $pt;
                $allX[] = $pt['x'];
                $allY[] = $pt['y'];
            }
        }

        if (empty($points)) {
            return [
                'meta' => [
                    'tipo' => $tipo,
                    'groupBy' => $groupBy,
                    'xAxis' => 'Demanda (# préstamos aprobados)',
                    'yAxis' => 'Stock operativo (equipos)',
                    'quadrants' => $this->stockQuadrantGuide(),
                ],
                'points' => [],
                'hasData' => false,
            ];
        }

        // --- 5. Cortes de cuadrante ---
        sort($allX);
        sort($allY);
        $xCut = $this->percentile($allX, 50);
        $yCut = $this->percentile($allY, 50);

        foreach ($points as &$pt) {
            $pt['quadrant'] = $this->detectStockQuadrant($pt['x'], $pt['y'], $xCut, $yCut);
        }
        unset($pt);

        usort($points, fn ($a, $b) => ($b['x'] <=> $a['x']) ?: ($a['y'] <=> $b['y']));

        $metaRange = [];
        if ($tipo === 'FUERA' && !empty($filters['from']) && !empty($filters['to'])) {
            $metaRange = [
                'from' => Carbon::parse($filters['from'])->toDateString(),
                'to' => Carbon::parse($filters['to'])->toDateString(),
            ];
        }

        return [
            'meta' => array_merge([
                'tipo' => $tipo,
                'groupBy' => $groupBy,
                'xAxis' => 'Demanda (# préstamos aprobados)',
                'yAxis' => 'Stock operativo (equipos)',
                'quadrants' => $this->stockQuadrantGuide(),
                'cutLines' => [
                    'x' => round($xCut, 2),
                    'y' => round($yCut, 2),
                ],
            ], $metaRange),
            'points' => $points,
            'hasData' => count($points) > 0,
        ];
    }

    private function detectStockQuadrant(float|int $x, float|int $y, float $xCut, float $yCut): string
    {
        if ($x >= $xCut && $y < $yCut) {
            return 'alta_demanda_bajo_stock';
        }
        if ($x >= $xCut && $y >= $yCut) {
            return 'alta_demanda_alto_stock';
        }
        if ($x < $xCut && $y < $yCut) {
            return 'baja_demanda_bajo_stock';
        }
        return 'baja_demanda_alto_stock';
    }

    private function stockQuadrantGuide(): array
    {
        return [
            'alta_demanda_bajo_stock' => 'Se pide mucho y hay poco stock. Considerar compra.',
            'alta_demanda_alto_stock' => 'Stock suficiente para la demanda actual.',
            'baja_demanda_bajo_stock' => 'Poco uso y poco stock. Verificar si el equipo se necesita.',
            'baja_demanda_alto_stock' => 'Sobra stock para la demanda que hay.',
        ];
    }

    public function getDemandHeatmap(array $filters): array
    {
        $tipo = strtoupper(trim($filters['tipo'] ?? 'DENTRO'));
        $normalize = filter_var($filters['normalizeByWeeks'] ?? true, FILTER_VALIDATE_BOOL);

        $weekdays = [
            1 => 'Lunes',
            2 => 'Martes',
            3 => 'Miércoles',
            4 => 'Jueves',
            5 => 'Viernes',
            6 => 'Sábado',
            7 => 'Domingo',
        ];

        $rows = [];
        if ($tipo === 'DENTRO') {
            $query = $this->baseQuery($filters)
                ->leftJoin('asignaturas as a', 'a.idAsignatura', '=', 'g.asignatura_id')
                ->where('p.tipo', 'DENTRO')
                ->join('bloque_prestamos as bp', 'bp.idPrestamo', '=', 'p.idPrestamo')
                ->join('bloques as b', 'b.idBloque', '=', 'bp.idBloque');

            if (!empty($filters['asignatura'])) {
                $query->where('bp.idAsignatura', (int) $filters['asignatura']);
            }

            if (!empty($filters['from']) && !empty($filters['to'])) {
                $from = Carbon::parse($filters['from'])->startOfDay();
                $to = Carbon::parse($filters['to'])->endOfDay();
                $query->whereBetween('p.fecha_inicio', [$from->toDateString(), $to->toDateString()]);
            }

            $rows = $query->get([
                'p.idPrestamo',
                'p.fecha_inicio',
                'b.idBloque',
                'b.nombre as bloque_nombre',
                'b.hora_inicio',
                'b.hora_fin',
            ]);
        } else {
            $from = Carbon::parse($filters['from'])->startOfDay();
            $to = Carbon::parse($filters['to'])->endOfDay();

            $query = $this->baseQuery($filters)
                ->leftJoin('asignaturas as a', 'a.idAsignatura', '=', 'g.asignatura_id')
                ->where('p.tipo', 'FUERA')
                ->whereNotNull('p.fecha_inicio')
                ->whereBetween('p.fecha_inicio', [$from->toDateString(), $to->toDateString()]);

            if (!empty($filters['asignatura'])) {
                $query->where('g.asignatura_id', (int) $filters['asignatura']);
            }

            $rows = $query->get([
                'p.idPrestamo',
                'p.fecha_inicio',
            ]);
        }

        $matrix = [];
        $xLabelByKey = [];
        $xOrderByKey = [];
        $uniqueWeeks = [];
        $missingWeekday = 0;

        foreach ($rows as $row) {
            if (empty($row->fecha_inicio)) {
                $missingWeekday++;
                continue;
            }

            $fecha = Carbon::parse($row->fecha_inicio);
            $weekday = $fecha->dayOfWeekIso;

            if ($weekday < 1 || $weekday > 7) {
                continue;
            }

            $weekKey = $fecha->isoFormat('GGGG-[W]WW');
            $uniqueWeeks[$weekKey] = true;

            if ($tipo === 'DENTRO') {
                $idBloque = (int) ($row->idBloque ?? 0);
                $horaInicio = isset($row->hora_inicio) ? substr((string) $row->hora_inicio, 0, 5) : '--:--';
                $horaFin = isset($row->hora_fin) ? substr((string) $row->hora_fin, 0, 5) : '--:--';
                $bloqueNombre = (string) ($row->bloque_nombre ?? 'Bloque');

                $xKey = 'bloque:' . $idBloque;
                $xLabelByKey[$xKey] = $bloqueNombre . ' (' . $horaInicio . '–' . $horaFin . ')';
                $xOrderByKey[$xKey] = $idBloque > 0 ? $idBloque : 999;
            } else {
                $hour = $fecha->format('H');
                $xKey = 'hora:' . $hour;
                $xLabelByKey[$xKey] = $hour . ':00';
                $xOrderByKey[$xKey] = (int) $hour;
            }

            $cellKey = $weekday . '|' . $xKey;
            $matrix[$cellKey] = ($matrix[$cellKey] ?? 0) + 1;
        }

        if (empty($xLabelByKey)) {
            return [
                'meta' => [
                    'tipo' => $tipo,
                    'normalizedByWeeks' => $normalize,
                    'xAxisType' => $tipo === 'DENTRO' ? 'bloque' : 'hora',
                    'weekDivisor' => 1,
                    'missingWeekdayCount' => $missingWeekday,
                ],
                'xLabels' => [],
                'yLabels' => array_values($weekdays),
                'data' => [],
                'hasData' => false,
            ];
        }

        uksort($xLabelByKey, function ($a, $b) use ($xOrderByKey) {
            return ($xOrderByKey[$a] ?? 0) <=> ($xOrderByKey[$b] ?? 0);
        });

        $xKeys = array_keys($xLabelByKey);
        $xLabels = array_values($xLabelByKey);
        $xIndexByKey = array_flip($xKeys);

        $weekDivisor = 1;
        if ($normalize) {
            if ($tipo === 'FUERA' && !empty($filters['from']) && !empty($filters['to'])) {
                $from = Carbon::parse($filters['from'])->startOfDay();
                $to = Carbon::parse($filters['to'])->endOfDay();
                $weekDivisor = max(1, (int) ceil(($from->diffInDays($to) + 1) / 7));
            } else {
                $weekDivisor = max(1, count($uniqueWeeks));
            }
        }

        $data = [];
        $maxValue = 0.0;

        foreach ($weekdays as $dayIndex => $dayLabel) {
            foreach ($xKeys as $xKey) {
                $rawCount = (int) ($matrix[$dayIndex . '|' . $xKey] ?? 0);
                $value = $normalize ? round($rawCount / $weekDivisor, 2) : $rawCount;
                $maxValue = max($maxValue, (float) $value);

                $data[] = [
                    'xIndex' => $xIndexByKey[$xKey],
                    'yIndex' => $dayIndex - 1,
                    'value' => $value,
                    'rawCount' => $rawCount,
                    'xLabel' => $xLabelByKey[$xKey],
                    'yLabel' => $dayLabel,
                ];
            }
        }

        return [
            'meta' => [
                'tipo' => $tipo,
                'normalizedByWeeks' => $normalize,
                'xAxisType' => $tipo === 'DENTRO' ? 'bloque' : 'hora',
                'weekDivisor' => $weekDivisor,
                'missingWeekdayCount' => $missingWeekday,
                'maxValue' => round($maxValue, 2),
                'legendLabel' => $normalize ? 'Promedio semanal de solicitudes' : 'Solicitudes totales',
            ],
            'xLabels' => $xLabels,
            'yLabels' => array_values($weekdays),
            'data' => $data,
            'hasData' => count($data) > 0,
        ];
    }

    public function getTopRequested(array $filters): array
    {
        $tipo = strtoupper(trim($filters['tipo'] ?? 'FUERA'));
        $groupBy = strtolower(trim((string) ($filters['groupBy'] ?? 'equipo')));
        $groupBy = in_array($groupBy, ['equipo', 'categoria', 'asignatura'], true) ? $groupBy : 'equipo';
        $topN = (int) ($filters['topN'] ?? 10);
        $topN = in_array($topN, [10, 20], true) ? $topN : 10;
        $bucket = ($filters['bucket'] ?? 'week') === 'month' ? 'month' : 'week';

        [$keyExpr, $labelExpr] = $this->topRequestedDimensionSql($groupBy);

        $query = $this->baseQuery($filters)
            ->leftJoin('asignaturas as a', 'a.idAsignatura', '=', 'g.asignatura_id')
            ->where('p.tipo', $tipo);

        if ($tipo === 'DENTRO') {
            $query
                ->join('bloque_prestamos as bp', 'bp.idPrestamo', '=', 'p.idPrestamo')
                ->join('bloques as b', 'b.idBloque', '=', 'bp.idBloque');

            if (!empty($filters['asignatura'])) {
                $query->where('bp.idAsignatura', (int) $filters['asignatura']);
            }
        } else {
            $from = Carbon::parse($filters['from'])->startOfDay();
            $to = Carbon::parse($filters['to'])->endOfDay();

            $query
                ->whereNotNull('p.fecha_inicio')
                ->whereBetween('p.fecha_inicio', [$from->toDateString(), $to->toDateString()]);

            if (!empty($filters['asignatura'])) {
                $query->where('g.asignatura_id', (int) $filters['asignatura']);
            }
        }

        $rows = $query
            ->selectRaw("$keyExpr as item_key, $labelExpr as item_label, COUNT(DISTINCT p.idPrestamo) as demand")
            ->groupByRaw("$keyExpr, $labelExpr")
            ->orderByDesc('demand')
            ->limit($topN)
            ->get();

        $comparison = $tipo === 'FUERA'
            ? $this->topRequestedMonthlyComparison($filters, $groupBy)
            : ['current' => [], 'previous' => [], 'label' => 'Comparación mensual no disponible para DENTRO sin fechas.'];

        $ranking = [];
        foreach ($rows as $row) {
            $key = (string) $row->item_key;
            $currentValue = (int) $row->demand;
            $previousValue = (int) ($comparison['previous'][$key] ?? 0);

            if ($previousValue > 0) {
                $variationPct = round((($currentValue - $previousValue) / $previousValue) * 100, 1);
            } else {
                $variationPct = $currentValue > 0 ? 100.0 : 0.0;
            }

            $ranking[] = [
                'key' => $key,
                'label' => (string) $row->item_label,
                'groupBy' => $groupBy,
                'demand' => $currentValue,
                'currentPeriod' => $currentValue,
                'previousPeriod' => $previousValue,
                'variationPct' => $variationPct,
                'trend' => $variationPct > 0 ? 'up' : ($variationPct < 0 ? 'down' : 'flat'),
            ];
        }

        $drilldown = null;
        $drillKey = trim((string) ($filters['drillKey'] ?? ''));
        if ($drillKey !== '') {
            $selected = collect($ranking)->first(fn ($item) => ($item['key'] ?? '') === $drillKey);
            if ($selected) {
                $drilldown = $tipo === 'FUERA'
                    ? $this->buildTopRequestedDrilldownByDate($filters, $selected, $bucket)
                    : $this->buildTopRequestedDrilldownByBloque($filters, $selected);
            }
        }

        return [
            'meta' => [
                'tipo' => $tipo,
                'groupBy' => $groupBy,
                'topN' => $topN,
                'bucket' => $bucket,
                'comparison' => $comparison['label'],
            ],
            'ranking' => $ranking,
            'hasData' => count($ranking) > 0,
            'drilldown' => $drilldown,
        ];
    }

    public function getDemandForecast(array $filters): array
    {
        $tipo = strtoupper(trim($filters['tipo'] ?? 'FUERA'));
        $bucket = ($filters['bucket'] ?? 'week') === 'month' ? 'month' : 'week';
        $defaultHorizon = $bucket === 'week' ? 6 : 4;
        $horizon = (int) ($filters['horizon'] ?? $defaultHorizon);
        $maxHorizon = $bucket === 'week' ? 8 : 6;
        $minHorizon = $bucket === 'week' ? 4 : 2;
        $horizon = max($minHorizon, min($maxHorizon, $horizon));

        $query = $this->baseQuery($filters)
            ->where('p.tipo', $tipo)
            ->whereNotNull('p.fecha_inicio');

        $metaRange = [];
        if (!empty($filters['from']) && !empty($filters['to'])) {
            $from = Carbon::parse($filters['from'])->startOfDay();
            $to = Carbon::parse($filters['to'])->endOfDay();
            $query->whereBetween('p.fecha_inicio', [$from->toDateString(), $to->toDateString()]);
            $metaRange = ['from' => $from->toDateString(), 'to' => $to->toDateString()];
        }

        if ($tipo === 'DENTRO' && !empty($filters['asignatura'])) {
            $query
                ->join('bloque_prestamos as bp', 'bp.idPrestamo', '=', 'p.idPrestamo')
                ->where('bp.idAsignatura', (int) $filters['asignatura']);
        } elseif (!empty($filters['asignatura'])) {
            $query->where('g.asignatura_id', (int) $filters['asignatura']);
        }

        $rows = $query
            ->select(DB::raw('DISTINCT p.idPrestamo'), 'p.fecha_inicio')
            ->orderBy('p.fecha_inicio')
            ->get();

        if ($rows->isEmpty()) {
            return [
                'meta' => array_merge([
                    'tipo' => $tipo,
                    'bucket' => $bucket,
                    'horizon' => $horizon,
                    'model' => 'Tendencia lineal + estacionalidad simple',
                ], $metaRange),
                'series' => [
                    'historical' => [],
                    'fitted' => [],
                    'forecast' => [],
                    'lowerP50' => [],
                    'upperP50' => [],
                    'lowerP90' => [],
                    'upperP90' => [],
                ],
                'labels' => [
                    'historical' => [],
                    'forecast' => [],
                    'all' => [],
                ],
                'metrics' => [
                    'mae' => null,
                    'mape' => null,
                ],
                'hasData' => false,
            ];
        }

        $byPeriod = [];
        foreach ($rows as $row) {
            $start = $this->bucketStart(Carbon::parse($row->fecha_inicio), $bucket)->toDateString();
            $byPeriod[$start] = ($byPeriod[$start] ?? 0) + 1;
        }

        if (!empty($metaRange['from']) && !empty($metaRange['to'])) {
            $periods = $this->buildPeriods(Carbon::parse($metaRange['from']), Carbon::parse($metaRange['to']), $bucket);
        } else {
            $periodStarts = array_keys($byPeriod);
            sort($periodStarts);
            $first = Carbon::parse($periodStarts[0]);
            $last = Carbon::parse(end($periodStarts));
            $periods = $this->buildPeriods($first, $last, $bucket);
            $metaRange = ['from' => $first->toDateString(), 'to' => $last->toDateString()];
        }

        $historicalLabels = [];
        $historicalY = [];
        $historicalStarts = [];
        foreach ($periods as $period) {
            $historicalLabels[] = $period['label'];
            $historicalStarts[] = $period['period_start'];
            $historicalY[] = (int) ($byPeriod[$period['period_start']] ?? 0);
        }

        if (count($historicalY) < 3) {
            return [
                'meta' => array_merge([
                    'tipo' => $tipo,
                    'bucket' => $bucket,
                    'horizon' => $horizon,
                    'model' => 'Tendencia lineal + estacionalidad simple',
                    'note' => 'Insuficientes puntos históricos para estimar forecast confiable.',
                ], $metaRange),
                'series' => [
                    'historical' => $historicalY,
                    'fitted' => [],
                    'forecast' => [],
                    'lowerP50' => [],
                    'upperP50' => [],
                    'lowerP90' => [],
                    'upperP90' => [],
                ],
                'labels' => [
                    'historical' => $historicalLabels,
                    'forecast' => [],
                    'all' => $historicalLabels,
                ],
                'metrics' => [
                    'mae' => null,
                    'mape' => null,
                ],
                'hasData' => count($historicalY) > 0,
            ];
        }

        $n = count($historicalY);
        $x = range(0, $n - 1);

        ['intercept' => $a, 'slope' => $b] = $this->linearRegression($x, $historicalY);

        $seasonLength = $bucket === 'week' ? 4 : 12;
        $seasonBuckets = [];
        foreach ($historicalY as $idx => $actual) {
            $trend = $a + ($b * $idx);
            $residual = $actual - $trend;
            $seasonKey = $idx % $seasonLength;
            if (!isset($seasonBuckets[$seasonKey])) {
                $seasonBuckets[$seasonKey] = [];
            }
            $seasonBuckets[$seasonKey][] = $residual;
        }

        $seasonality = [];
        for ($s = 0; $s < $seasonLength; $s++) {
            $values = $seasonBuckets[$s] ?? [];
            $seasonality[$s] = empty($values) ? 0.0 : $this->average($values);
        }

        $fitted = [];
        $absErrors = [];
        $ape = [];
        foreach ($historicalY as $idx => $actual) {
            $estimate = max(0, $a + ($b * $idx) + ($seasonality[$idx % $seasonLength] ?? 0));
            $fitted[] = round($estimate, 2);
            $absErr = abs($actual - $estimate);
            $absErrors[] = $absErr;
            if ($actual > 0) {
                $ape[] = ($absErr / $actual) * 100;
            }
        }

        sort($absErrors);
        $errP50 = $this->percentile($absErrors, 50);
        $errP90 = $this->percentile($absErrors, 90);

        $forecastLabels = [];
        $forecast = [];
        $lowerP50 = [];
        $upperP50 = [];
        $lowerP90 = [];
        $upperP90 = [];

        $lastStart = Carbon::parse($historicalStarts[count($historicalStarts) - 1]);
        for ($step = 1; $step <= $horizon; $step++) {
            $futureIndex = $n + ($step - 1);

            $futureStart = $lastStart->copy();
            if ($bucket === 'week') {
                $futureStart->addWeeks($step);
            } else {
                $futureStart->addMonths($step);
            }

            $pred = max(0, $a + ($b * $futureIndex) + ($seasonality[$futureIndex % $seasonLength] ?? 0));
            $predRounded = round($pred, 2);

            $forecast[] = $predRounded;
            $lowerP50[] = round(max(0, $pred - $errP50), 2);
            $upperP50[] = round($pred + $errP50, 2);
            $lowerP90[] = round(max(0, $pred - $errP90), 2);
            $upperP90[] = round($pred + $errP90, 2);
            $forecastLabels[] = $this->periodLabel($futureStart, $bucket);
        }

        return [
            'meta' => array_merge([
                'tipo' => $tipo,
                'bucket' => $bucket,
                'horizon' => $horizon,
                'model' => 'Tendencia lineal + estacionalidad simple',
                'explanation' => 'Predicción basada en tendencia + estacionalidad simple.',
                'uncertainty' => 'Bandas calculadas con error histórico absoluto (P50/P90).',
            ], $metaRange),
            'series' => [
                'historical' => $historicalY,
                'fitted' => $fitted,
                'forecast' => $forecast,
                'lowerP50' => $lowerP50,
                'upperP50' => $upperP50,
                'lowerP90' => $lowerP90,
                'upperP90' => $upperP90,
            ],
            'labels' => [
                'historical' => $historicalLabels,
                'forecast' => $forecastLabels,
                'all' => array_merge($historicalLabels, $forecastLabels),
            ],
            'metrics' => [
                'mae' => round($this->average($absErrors), 3),
                'mape' => count($ape) > 0 ? round($this->average($ape), 2) : null,
            ],
            'hasData' => count($historicalY) > 0,
        ];
    }

    public function getStatusFlow(array $filters): array
    {
        $tipo = strtoupper(trim($filters['tipo'] ?? 'FUERA'));

        $query = $this->baseQuery($filters)
            ->where('p.tipo', $tipo);

        $metaRange = [];
        if ($tipo === 'FUERA') {
            $from = Carbon::parse($filters['from'])->startOfDay();
            $to = Carbon::parse($filters['to'])->endOfDay();
            $query
                ->whereNotNull('p.fecha_inicio')
                ->whereBetween('p.fecha_inicio', [$from->toDateString(), $to->toDateString()]);
            $metaRange = ['from' => $from->toDateString(), 'to' => $to->toDateString()];
        } elseif (!empty($filters['from']) && !empty($filters['to'])) {
            $from = Carbon::parse($filters['from'])->startOfDay();
            $to = Carbon::parse($filters['to'])->endOfDay();
            $query->whereBetween('p.fecha_inicio', [$from->toDateString(), $to->toDateString()]);
            $metaRange = ['from' => $from->toDateString(), 'to' => $to->toDateString()];
        }

        if ($tipo === 'DENTRO' && !empty($filters['asignatura'])) {
            $query
                ->join('bloque_prestamos as bp', 'bp.idPrestamo', '=', 'p.idPrestamo')
                ->where('bp.idAsignatura', (int) $filters['asignatura']);
        } elseif (!empty($filters['asignatura'])) {
            $query->where('g.asignatura_id', (int) $filters['asignatura']);
        }

        $rows = $query
            ->select(DB::raw('DISTINCT p.idPrestamo'), 'p.estado')
            ->get();

        if ($rows->isEmpty()) {
            return [
                'meta' => array_merge([
                    'tipo' => $tipo,
                    'sourceStage' => 'Solicitud registrada',
                    'description' => 'Flujo de estados desde solicitud hasta estado actual.',
                    'totalSolicitudes' => 0,
                ], $metaRange),
                'nodes' => [],
                'links' => [],
                'hasData' => false,
                'messages' => [
                    'summary' => 'Sin datos para construir flujo de estados con los filtros seleccionados.',
                ],
            ];
        }

        $linksCounter = [];
        $sourceTotals = [];
        $total = 0;

        foreach ($rows as $row) {
            $total++;
            $estado = strtoupper(trim((string) ($row->estado ?? '')));

            if ($estado === 'RECHAZADO') {
                $this->addStatusFlowLink($linksCounter, $sourceTotals, 'Solicitud registrada', 'Rechazado');
                continue;
            }

            if ($estado === 'PENDIENTE') {
                $this->addStatusFlowLink($linksCounter, $sourceTotals, 'Solicitud registrada', 'Pendiente de revisión');
                continue;
            }

            if (in_array($estado, ['APROBADO', 'PENDIENTE_ENTREGA', 'ENTREGADO', 'DEVUELTO', 'ATRASADO'], true)) {
                $this->addStatusFlowLink($linksCounter, $sourceTotals, 'Solicitud registrada', 'Aprobado');

                if ($estado === 'PENDIENTE_ENTREGA') {
                    $this->addStatusFlowLink($linksCounter, $sourceTotals, 'Aprobado', 'Pendiente de entrega');
                } elseif ($estado === 'APROBADO') {
                    $this->addStatusFlowLink($linksCounter, $sourceTotals, 'Aprobado', 'Aprobado sin entrega');
                } else {
                    $this->addStatusFlowLink($linksCounter, $sourceTotals, 'Aprobado', 'En préstamo');

                    if ($estado === 'DEVUELTO') {
                        $this->addStatusFlowLink($linksCounter, $sourceTotals, 'En préstamo', 'Devuelto');
                    } elseif ($estado === 'ATRASADO') {
                        $this->addStatusFlowLink($linksCounter, $sourceTotals, 'En préstamo', 'Atrasado');
                    }
                }

                continue;
            }

            $this->addStatusFlowLink($linksCounter, $sourceTotals, 'Solicitud registrada', 'Otros estados');
        }

        $nodesMap = [];
        $links = [];

        foreach ($linksCounter as $key => $count) {
            [$source, $target] = explode('|', $key, 2);
            $fromTotal = $sourceTotals[$source] ?? 0;

            $links[] = [
                'source' => $source,
                'target' => $target,
                'value' => (int) $count,
                'percentTotal' => $total > 0 ? round(($count / $total) * 100, 2) : 0,
                'percentFromSource' => $fromTotal > 0 ? round(($count / $fromTotal) * 100, 2) : 0,
            ];

            $nodesMap[$source] = true;
            $nodesMap[$target] = true;
        }

        $nodeOrder = [
            'Solicitud registrada',
            'Pendiente de revisión',
            'Aprobado',
            'Pendiente de entrega',
            'Aprobado sin entrega',
            'En préstamo',
            'Devuelto',
            'Atrasado',
            'Rechazado',
            'Otros estados',
        ];

        $nodes = [];
        foreach ($nodeOrder as $name) {
            if (!isset($nodesMap[$name])) {
                continue;
            }
            $nodes[] = ['name' => $name];
        }

        usort($links, fn ($a, $b) => $b['value'] <=> $a['value']);

        $topFlow = $links[0] ?? null;
        $summary = $topFlow
            ? sprintf(
                'Transición principal: %s → %s (%s casos, %.2f%% del total).',
                $topFlow['source'],
                $topFlow['target'],
                $topFlow['value'],
                $topFlow['percentTotal']
            )
            : 'No hay transiciones con los filtros seleccionados.';

        return [
            'meta' => array_merge([
                'tipo' => $tipo,
                'sourceStage' => 'Solicitud registrada',
                'description' => 'Flujo de estados desde solicitud hasta estado actual.',
                'totalSolicitudes' => $total,
            ], $metaRange),
            'nodes' => $nodes,
            'links' => $links,
            'hasData' => count($links) > 0,
            'messages' => [
                'summary' => $summary,
            ],
        ];
    }

    public function getRejectionsAndStatus(array $filters): array
    {
        $tipo = strtoupper(trim($filters['tipo'] ?? 'FUERA'));
        $view = strtolower(trim((string) ($filters['view'] ?? 'motivos')));
        $view = in_array($view, ['motivos', 'estados'], true) ? $view : 'motivos';

        $query = $this->baseQuery($filters)
            ->where('p.tipo', $tipo);

        if ($tipo === 'DENTRO') {
            if (!empty($filters['from']) && !empty($filters['to'])) {
                $from = Carbon::parse($filters['from'])->startOfDay();
                $to = Carbon::parse($filters['to'])->endOfDay();
                $query->whereBetween('p.fecha_inicio', [$from->toDateString(), $to->toDateString()]);
            }
        } else {
            $from = Carbon::parse($filters['from'])->startOfDay();
            $to = Carbon::parse($filters['to'])->endOfDay();
            $query
                ->whereNotNull('p.fecha_inicio')
                ->whereBetween('p.fecha_inicio', [$from->toDateString(), $to->toDateString()]);
        }

        $rows = $query->get([
            'p.idPrestamo',
            'p.estado',
            'p.motivo_rechazo',
        ]);

        $counter = [];
        $total = 0;
        $stockLossCount = 0;

        foreach ($rows as $row) {
            $total++;
            $estado = strtoupper(trim((string) $row->estado));
            $motivo = strtoupper(trim((string) $row->motivo_rechazo));

            if ($view === 'estados') {
                $label = $estado !== '' ? $estado : 'SIN_ESTADO';
            } else {
                if ($estado !== 'RECHAZADO') {
                    $label = 'OTROS';
                } elseif (in_array($motivo, self::STOCKOUT_REJECTION_REASONS, true)) {
                    $label = 'FALTA_STOCK';
                    $stockLossCount++;
                } else {
                    $label = 'RECHAZO';
                }
            }

            $counter[$label] = ($counter[$label] ?? 0) + 1;
        }

        if (empty($counter)) {
            return [
                'meta' => [
                    'tipo' => $tipo,
                    'view' => $view,
                    'chartType' => 'donut',
                ],
                'items' => [],
                'hasData' => false,
                'messages' => [
                    'summary' => 'Sin datos para analizar distribución con los filtros seleccionados.',
                    'interpretation' => 'Ajusta periodo o filtros para visualizar motivos/estados.',
                ],
            ];
        }

        $items = collect($counter)
            ->map(function ($count, $label) use ($total) {
                $pct = $total > 0 ? round(($count / $total) * 100, 2) : 0;
                return [
                    'label' => $label,
                    'displayLabel' => $this->humanReadableRejectionStatusLabel($label),
                    'value' => (int) $count,
                    'percent' => $pct,
                ];
            })
            ->sortByDesc('value')
            ->values()
            ->all();

        $chartType = count($items) <= 6 ? 'donut' : 'treemap';
        $top = $items[0];

        $summary = $view === 'motivos'
            ? sprintf('Predomina "%s" con %s casos (%.2f%%).', $top['displayLabel'], $top['value'], $top['percent'])
            : sprintf('El estado más frecuente es "%s" con %s casos (%.2f%%).', $top['displayLabel'], $top['value'], $top['percent']);

        $interpretation = $view === 'motivos'
            ? sprintf(
                'Rechazos por falta de stock: %s de %s solicitudes (%.2f%%).',
                $stockLossCount,
                $total,
                $total > 0 ? round(($stockLossCount / $total) * 100, 2) : 0
            )
            : 'Revisa en qué estados se acumulan más solicitudes para detectar demoras.';

        return [
            'meta' => [
                'tipo' => $tipo,
                'view' => $view,
                'chartType' => $chartType,
                'total' => $total,
            ],
            'items' => $items,
            'hasData' => count($items) > 0,
            'messages' => [
                'summary' => $summary,
                'interpretation' => $interpretation,
            ],
        ];
    }

    private function humanReadableRejectionStatusLabel(string $label): string
    {
        return match (strtoupper(trim($label))) {
            'FALTA_STOCK' => 'Falta de stock',
            'RECHAZO' => 'Rechazo (otros motivos)',
            'OTROS' => 'Otros',
            'PENDIENTE_ENTREGA' => 'Pendiente de entrega',
            'ATRASADO' => 'Atrasado (fuera de plazo)',
            'ENTREGADO' => 'Entregado',
            'DEVUELTO' => 'Devuelto',
            'APROBADO' => 'Aprobado',
            'PENDIENTE' => 'Pendiente',
            'SIN_ESTADO' => 'Sin estado',
            default => ucwords(strtolower(str_replace('_', ' ', $label))),
        };
    }

    private function addStatusFlowLink(array &$linksCounter, array &$sourceTotals, string $source, string $target): void
    {
        $key = $source . '|' . $target;
        $linksCounter[$key] = ($linksCounter[$key] ?? 0) + 1;
        $sourceTotals[$source] = ($sourceTotals[$source] ?? 0) + 1;
    }

    private function topRequestedDimensionSql(string $groupBy): array
    {
        if ($groupBy === 'categoria') {
            return [
                "CONCAT('categoria:', COALESCE(CAST(c.id AS CHAR), 'sin_categoria'))",
                "COALESCE(c.nombre, 'Sin categoría')",
            ];
        }

        if ($groupBy === 'asignatura') {
            return [
                "CONCAT('asignatura:', COALESCE(CAST(g.asignatura_id AS CHAR), 'sin_asignatura'))",
                "COALESCE(a.nombre, 'Sin asignatura')",
            ];
        }

        return [
            "CONCAT('equipo:', COALESCE(CAST(te.id AS CHAR), 'sin_equipo'))",
            "COALESCE(te.nombre, 'Sin tipo de equipo')",
        ];
    }

    private function applyTopRequestedDrillFilter($query, string $drillKey): void
    {
        [$type, $id] = array_pad(explode(':', $drillKey, 2), 2, '');
        $id = trim($id);

        if ($id === '' || str_starts_with($id, 'sin_')) {
            if ($type === 'categoria') {
                $query->whereNull('c.id');
            } elseif ($type === 'asignatura') {
                $query->whereNull('g.asignatura_id');
            } else {
                $query->whereNull('te.id');
            }
            return;
        }

        if (!is_numeric($id)) {
            return;
        }

        $numericId = (int) $id;
        if ($type === 'categoria') {
            $query->where('c.id', $numericId);
        } elseif ($type === 'asignatura') {
            $query->where('g.asignatura_id', $numericId);
        } else {
            $query->where('te.id', $numericId);
        }
    }

    private function topRequestedMonthlyComparison(array $filters, string $groupBy): array
    {
        $referenceDate = !empty($filters['to']) ? Carbon::parse($filters['to'])->endOfDay() : Carbon::now()->endOfDay();

        $currentStart = $referenceDate->copy()->startOfMonth();
        $currentEnd = $referenceDate->copy();

        $daysInScope = $currentStart->diffInDays($currentEnd) + 1;
        $previousStart = $currentStart->copy()->subMonthNoOverflow();
        $previousEnd = $previousStart->copy()->addDays($daysInScope - 1)->endOfDay();
        if ($previousEnd->month !== $previousStart->month) {
            $previousEnd = $previousStart->copy()->endOfMonth()->endOfDay();
        }

        $current = $this->topRequestedDemandMapInRange($filters, $groupBy, $currentStart, $currentEnd);
        $previous = $this->topRequestedDemandMapInRange($filters, $groupBy, $previousStart, $previousEnd);

        return [
            'current' => $current,
            'previous' => $previous,
            'label' => sprintf(
                'Comparación: %s vs %s',
                $currentStart->isoFormat('MMMM YYYY'),
                $previousStart->isoFormat('MMMM YYYY')
            ),
        ];
    }

    private function topRequestedDemandMapInRange(array $filters, string $groupBy, Carbon $from, Carbon $to): array
    {
        [$keyExpr, $labelExpr] = $this->topRequestedDimensionSql($groupBy);

        $query = $this->baseQuery($filters)
            ->leftJoin('asignaturas as a', 'a.idAsignatura', '=', 'g.asignatura_id')
            ->where('p.tipo', 'FUERA')
            ->whereNotNull('p.fecha_inicio')
            ->whereBetween('p.fecha_inicio', [$from->toDateString(), $to->toDateString()]);

        if (!empty($filters['asignatura'])) {
            $query->where('g.asignatura_id', (int) $filters['asignatura']);
        }

        return $query
            ->selectRaw("$keyExpr as item_key, $labelExpr as item_label, COUNT(DISTINCT p.idPrestamo) as demand")
            ->groupByRaw("$keyExpr, $labelExpr")
            ->get()
            ->mapWithKeys(fn ($row) => [(string) $row->item_key => (int) $row->demand])
            ->toArray();
    }

    private function buildTopRequestedDrilldownByDate(array $filters, array $selected, string $bucket): array
    {
        $from = Carbon::parse($filters['from'])->startOfDay();
        $to = Carbon::parse($filters['to'])->endOfDay();

        $query = $this->baseQuery($filters)
            ->leftJoin('asignaturas as a', 'a.idAsignatura', '=', 'g.asignatura_id')
            ->where('p.tipo', 'FUERA')
            ->whereNotNull('p.fecha_inicio')
            ->whereBetween('p.fecha_inicio', [$from->toDateString(), $to->toDateString()]);

        $this->applyTopRequestedDrillFilter($query, (string) $selected['key']);

        $rows = $query
            ->select(DB::raw('DISTINCT p.idPrestamo'), 'p.fecha_inicio')
            ->orderBy('p.fecha_inicio')
            ->get();

        $totalsByPeriod = [];
        foreach ($rows as $row) {
            $key = $this->bucketStart(Carbon::parse($row->fecha_inicio), $bucket)->toDateString();
            $totalsByPeriod[$key] = ($totalsByPeriod[$key] ?? 0) + 1;
        }

        $periods = $this->buildPeriods($from->copy(), $to->copy(), $bucket);
        $labels = [];
        $series = [];

        foreach ($periods as $period) {
            $labels[] = $period['label'];
            $series[] = $totalsByPeriod[$period['period_start']] ?? 0;
        }

        return [
            'selectedKey' => $selected['key'],
            'selectedLabel' => $selected['label'],
            'groupBy' => $selected['groupBy'],
            'mode' => 'external',
            'labels' => $labels,
            'series' => [
                'total_solicitudes' => $series,
            ],
        ];
    }

    private function buildTopRequestedDrilldownByBloque(array $filters, array $selected): array
    {
        $bloques = DB::table('bloques')
            ->orderBy('hora_inicio')
            ->get(['idBloque', 'nombre', 'hora_inicio', 'hora_fin']);

        $query = $this->baseQuery($filters)
            ->leftJoin('asignaturas as a', 'a.idAsignatura', '=', 'g.asignatura_id')
            ->where('p.tipo', 'DENTRO')
            ->join('bloque_prestamos as bp', 'bp.idPrestamo', '=', 'p.idPrestamo')
            ->join('bloques as b', 'b.idBloque', '=', 'bp.idBloque');

        if (!empty($filters['asignatura'])) {
            $query->where('bp.idAsignatura', (int) $filters['asignatura']);
        }

        $this->applyTopRequestedDrillFilter($query, (string) $selected['key']);

        $counts = $query
            ->groupBy('b.idBloque', 'b.nombre', 'b.hora_inicio', 'b.hora_fin')
            ->select(
                'b.idBloque',
                DB::raw('COUNT(DISTINCT p.idPrestamo) as total')
            )
            ->get()
            ->keyBy('idBloque');

        $labels = [];
        $series = [];
        foreach ($bloques as $bloque) {
            $hora = substr($bloque->hora_inicio, 0, 5) . '–' . substr($bloque->hora_fin, 0, 5);
            $labels[] = "{$bloque->nombre} ({$hora})";
            $series[] = (int) ($counts[$bloque->idBloque]->total ?? 0);
        }

        return [
            'selectedKey' => $selected['key'],
            'selectedLabel' => $selected['label'],
            'groupBy' => $selected['groupBy'],
            'mode' => 'internal',
            'labels' => $labels,
            'series' => [
                'total_solicitudes' => $series,
            ],
        ];
    }

    private function linearRegression(array $x, array $y): array
    {
        $n = count($x);
        if ($n === 0 || $n !== count($y)) {
            return ['intercept' => 0.0, 'slope' => 0.0];
        }

        $sumX = array_sum($x);
        $sumY = array_sum($y);
        $sumXY = 0.0;
        $sumXX = 0.0;

        for ($i = 0; $i < $n; $i++) {
            $sumXY += ((float) $x[$i]) * ((float) $y[$i]);
            $sumXX += ((float) $x[$i]) * ((float) $x[$i]);
        }

        $den = ($n * $sumXX) - ($sumX * $sumX);
        if (abs($den) < 1e-9) {
            return ['intercept' => (float) ($sumY / max(1, $n)), 'slope' => 0.0];
        }

        $slope = (($n * $sumXY) - ($sumX * $sumY)) / $den;
        $intercept = ($sumY - ($slope * $sumX)) / $n;

        return ['intercept' => (float) $intercept, 'slope' => (float) $slope];
    }

    private function average(array $values): float
    {
        if (empty($values)) {
            return 0.0;
        }

        return array_sum($values) / count($values);
    }

    private function percentile(array $sortedValues, float $percent): float
    {
        $count = count($sortedValues);
        if ($count === 0) {
            return 0.0;
        }
        if ($count === 1) {
            return (float) $sortedValues[0];
        }

        $position = ($percent / 100) * ($count - 1);
        $floor = (int) floor($position);
        $ceil = (int) ceil($position);

        if ($floor === $ceil) {
            return (float) $sortedValues[$floor];
        }

        $weight = $position - $floor;
        return ((float) $sortedValues[$floor] * (1 - $weight))
            + ((float) $sortedValues[$ceil] * $weight);
    }
}
