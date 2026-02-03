<?php
namespace App\Services\Reportes;

use Carbon\Carbon;
use Illuminate\Support\Facades\DB;
use Illuminate\Http\Request;

/**
 * Servicio de reportes de equipos con métricas normalizadas.
 * 
 * Resuelve el sesgo por antigüedad: equipos antiguos vs nuevos se comparan
 * de forma justa usando métricas normalizadas por tiempo.
 * 
 * Métricas implementadas:
 * - Promedio de duración de préstamo (días)
 * - Préstamos por mes activo
 * - % de utilización real (días prestado / días disponibles)
 * 
 * Soporta filtros universales:
 * - from/to: Rango de fechas (YYYY-MM-DD)
 * - uso: interno | externo | ambos
 * - granularity: day | week | month | quarter
 */
class ReportesEquiposNormalizadosService
{
    /**
     * Obtener rango de fechas desde request
     */
    private function getDateRange(?Request $request, int $defaultMonths = 12): array
    {
        if ($request && $request->has('from') && $request->has('to')) {
            $start = Carbon::parse($request->input('from'))->startOfDay();
            $end = Carbon::parse($request->input('to'))->endOfDay();
        } else {
            $end = Carbon::now()->endOfDay();
            $start = Carbon::now()->subMonths($defaultMonths)->startOfDay();
        }
        return [$start, $end];
    }

    /**
     * Aplicar filtro de tipo de uso
     */
    private function applyTipoUsoFilter($query, ?string $uso, string $alias = 'p')
    {
        if ($uso === 'interno') {
            $query->where("$alias.tipo", 'INTERNO');
        } elseif ($uso === 'externo') {
            $query->where("$alias.tipo", 'EXTERNO');
        }
        return $query;
    }

    /**
     * Generar todos los períodos del rango
     */
    private function generateAllPeriods(Carbon $start, Carbon $end, string $granularity = 'month'): array
    {
        $periods = [];
        $current = $start->copy();
        
        while ($current <= $end) {
            switch ($granularity) {
                case 'day':
                    $periods[] = $current->format('Y-m-d');
                    $current->addDay();
                    break;
                case 'week':
                    $periods[] = $current->format('Y-W');
                    $current->addWeek();
                    break;
                case 'month':
                default:
                    $periods[] = $current->format('Y-m');
                    $current->addMonth();
                    break;
            }
        }
        
        return $periods;
    }

    /**
     * KPIs generales de equipos
     */
    public function getKPIs(?Request $request = null): array
    {
        [$start, $end] = $this->getDateRange($request);
        $uso = $request?->input('uso', 'ambos') ?? 'ambos';

        $totalEquipos = DB::table('equipos')->count();
        $disponibles = DB::table('equipos')->where('estado', 'DISPONIBLE')->count();
        $enPrestamo = DB::table('equipos')->where('estado', 'PRESTADO')->count();
        $enMantenimiento = DB::table('equipos')->where('estado', 'MANTENIMIENTO')->count();

        // Total préstamos en el período con filtro de uso
        $prestamosQuery = DB::table('prestamos as p')
            ->join('prestamo_equipo as pe', 'pe.idPrestamo', '=', 'p.idPrestamo')
            ->whereBetween('p.created_at', [$start, $end])
            ->whereIn('p.estado', ['APROBADO', 'DEVUELTO', 'ENTREGADO']);

        $this->applyTipoUsoFilter($prestamosQuery, $uso);
        $totalPrestamos = $prestamosQuery->count();

        // Equipos únicos prestados
        $equiposPrestadosQuery = DB::table('prestamos as p')
            ->join('prestamo_equipo as pe', 'pe.idPrestamo', '=', 'p.idPrestamo')
            ->whereBetween('p.created_at', [$start, $end])
            ->whereIn('p.estado', ['APROBADO', 'DEVUELTO', 'ENTREGADO']);
        
        $this->applyTipoUsoFilter($equiposPrestadosQuery, $uso);
        $equiposPrestados = $equiposPrestadosQuery->distinct('pe.idEquipo')->count('pe.idEquipo');

        // Promedio de duración de préstamos (en días)
        $duracionQuery = DB::table('prestamos as p')
            ->whereBetween('p.created_at', [$start, $end])
            ->where('p.estado', 'DEVUELTO')
            ->whereNotNull('p.fecha_inicio')
            ->whereNotNull('p.fecha_fin');
        
        $this->applyTipoUsoFilter($duracionQuery, $uso);
        $promedioDuracion = $duracionQuery
            ->selectRaw('AVG(DATEDIFF(p.fecha_fin, p.fecha_inicio)) as promedio')
            ->value('promedio');

        // Calcular meses en el rango
        $mesesEnRango = max(1, $start->diffInMonths($end));
        $prestamosPorMes = $totalPrestamos > 0 ? round($totalPrestamos / $mesesEnRango, 2) : 0;

        // Desglose interno/externo
        $internos = (clone $prestamosQuery)->where('p.tipo', 'INTERNO')->count();
        $externos = (clone $prestamosQuery)->where('p.tipo', 'EXTERNO')->count();

        return [
            'totalEquipos' => $totalEquipos,
            'disponibles' => $disponibles,
            'enPrestamo' => $enPrestamo,
            'enMantenimiento' => $enMantenimiento,
            'totalPrestamos' => $totalPrestamos,
            'equiposPrestados' => $equiposPrestados,
            'tasaUtilizacion' => $totalEquipos > 0 
                ? round(($equiposPrestados / $totalEquipos) * 100, 1) 
                : 0,
            'promedioDuracionDias' => $promedioDuracion ? round($promedioDuracion, 1) : 0,
            'prestamosPorMes' => $prestamosPorMes,
            // Desglose
            'prestamosInternos' => $internos,
            'prestamosExternos' => $externos,
            // Filtros aplicados
            'filtros' => [
                'from' => $start->toDateString(),
                'to' => $end->toDateString(),
                'uso' => $uso
            ]
        ];
    }

    /**
     * Métricas normalizadas por equipo (evita sesgo por antigüedad)
     * 
     * Para cada equipo calcula:
     * - meses_activos: desde fecha_alta hasta 'to'
     * - prestamos_por_mes_activo: préstamos / meses_activos
     * - dias_prestado_total: suma de días en préstamo
     * - dias_disponibles: días desde max(fecha_alta, from) hasta to
     * - utilizacion_porcentaje: dias_prestado / dias_disponibles * 100
     */
    public function getEquiposNormalizados(?Request $request = null, int $limit = 20): array
    {
        [$start, $end] = $this->getDateRange($request);
        $uso = $request?->input('uso', 'ambos') ?? 'ambos';

        // Obtener equipos con su fecha de alta
        $equipos = DB::table('equipos as e')
            ->join('tipo_equipos as te', 'te.id', '=', 'e.tipo_equipo_id')
            ->join('categorias as c', 'c.id', '=', 'te.categoria_id')
            ->select(
                'e.id',
                'e.nombre',
                'e.codigo',
                'te.nombre as tipo',
                'c.nombre as categoria',
                'e.estado',
                'e.created_at as fecha_alta'
            )
            ->get();

        $result = [];

        foreach ($equipos as $equipo) {
            $fechaAlta = Carbon::parse($equipo->fecha_alta);
            
            // Meses activos: desde fecha_alta hasta el fin del período
            $mesesActivos = max(1, $fechaAlta->diffInMonths($end) + 1);
            
            // Días disponibles: desde max(fecha_alta, start) hasta end
            $inicioDisponibilidad = $fechaAlta->gt($start) ? $fechaAlta : $start;
            $diasDisponibles = max(1, $inicioDisponibilidad->diffInDays($end) + 1);

            // Contar préstamos del equipo en el período
            $prestamosQuery = DB::table('prestamos as p')
                ->join('prestamo_equipo as pe', 'pe.idPrestamo', '=', 'p.idPrestamo')
                ->where('pe.idEquipo', $equipo->id)
                ->whereBetween('p.created_at', [$start, $end])
                ->whereIn('p.estado', ['APROBADO', 'DEVUELTO', 'ENTREGADO']);

            $this->applyTipoUsoFilter($prestamosQuery, $uso);
            $totalPrestamos = $prestamosQuery->count();

            // Calcular días totales prestado (suma de duración de cada préstamo)
            $diasPrestado = DB::table('prestamos as p')
                ->join('prestamo_equipo as pe', 'pe.idPrestamo', '=', 'p.idPrestamo')
                ->where('pe.idEquipo', $equipo->id)
                ->whereBetween('p.created_at', [$start, $end])
                ->where('p.estado', 'DEVUELTO')
                ->whereNotNull('p.fecha_inicio')
                ->whereNotNull('p.fecha_fin')
                ->selectRaw('SUM(DATEDIFF(p.fecha_fin, p.fecha_inicio)) as dias')
                ->value('dias') ?? 0;

            // Promedio de duración por préstamo
            $promedioDuracion = $totalPrestamos > 0 
                ? round($diasPrestado / $totalPrestamos, 1) 
                : 0;

            // Préstamos por mes activo (métrica normalizada)
            $prestamosPorMesActivo = round($totalPrestamos / $mesesActivos, 2);

            // % de utilización (días prestado / días disponibles)
            $utilizacionPorcentaje = round(($diasPrestado / $diasDisponibles) * 100, 1);

            // Desglose interno/externo
            $internos = (clone $prestamosQuery)->where('p.tipo', 'INTERNO')->count();
            $externos = (clone $prestamosQuery)->where('p.tipo', 'EXTERNO')->count();

            $result[] = [
                'id' => $equipo->id,
                'nombre' => $equipo->nombre,
                'codigo' => $equipo->codigo,
                'tipo' => $equipo->tipo,
                'categoria' => $equipo->categoria,
                'estado' => $equipo->estado,
                'fecha_alta' => $fechaAlta->toDateString(),
                // Métricas normalizadas
                'meses_activos' => $mesesActivos,
                'dias_disponibles' => $diasDisponibles,
                'total_prestamos' => $totalPrestamos,
                'dias_prestado' => (int)$diasPrestado,
                'promedio_duracion_dias' => $promedioDuracion,
                'prestamos_por_mes_activo' => $prestamosPorMesActivo,
                'utilizacion_porcentaje' => min(100, $utilizacionPorcentaje), // Cap at 100%
                // Desglose
                'prestamos_internos' => $internos,
                'prestamos_externos' => $externos,
            ];
        }

        // Ordenar por utilización descendente
        usort($result, fn($a, $b) => $b['utilizacion_porcentaje'] <=> $a['utilizacion_porcentaje']);

        return [
            'data' => array_slice($result, 0, $limit),
            'total' => count($result),
            'filtros' => [
                'from' => $start->toDateString(),
                'to' => $end->toDateString(),
                'uso' => $uso,
                'limit' => $limit
            ]
        ];
    }

    /**
     * Top equipos por préstamos/mes activo (comparación justa)
     */
    public function getTopEquiposPorMesActivo(?Request $request = null, int $limit = 10): array
    {
        $data = $this->getEquiposNormalizados($request, 100);
        
        // Reordenar por préstamos por mes activo
        usort($data['data'], fn($a, $b) => $b['prestamos_por_mes_activo'] <=> $a['prestamos_por_mes_activo']);
        
        return [
            'data' => array_slice($data['data'], 0, $limit),
            'filtros' => $data['filtros']
        ];
    }

    /**
     * Evolución de utilización en el tiempo (12 meses)
     */
    public function getEvolucionUtilizacion(?Request $request = null): array
    {
        [$start, $end] = $this->getDateRange($request);
        $uso = $request?->input('uso', 'ambos') ?? 'ambos';
        $granularity = $request?->input('granularity', 'month') ?? 'month';

        $allPeriods = $this->generateAllPeriods($start, $end, $granularity);
        $totalEquipos = DB::table('equipos')->count();

        $result = [];

        foreach ($allPeriods as $periodo) {
            // Parsear período para obtener rango
            if ($granularity === 'month') {
                $periodoStart = Carbon::createFromFormat('Y-m', $periodo)->startOfMonth();
                $periodoEnd = Carbon::createFromFormat('Y-m', $periodo)->endOfMonth();
            } else {
                $periodoStart = Carbon::parse($periodo);
                $periodoEnd = $periodoStart->copy()->endOfDay();
            }

            // Contar préstamos en el período
            $prestamosQuery = DB::table('prestamos as p')
                ->whereBetween('p.created_at', [$periodoStart, $periodoEnd])
                ->whereIn('p.estado', ['APROBADO', 'DEVUELTO', 'ENTREGADO']);

            $this->applyTipoUsoFilter($prestamosQuery, $uso);
            $prestamos = $prestamosQuery->count();

            // Equipos únicos prestados
            $equiposPrestadosQuery = DB::table('prestamos as p')
                ->join('prestamo_equipo as pe', 'pe.idPrestamo', '=', 'p.idPrestamo')
                ->whereBetween('p.created_at', [$periodoStart, $periodoEnd])
                ->whereIn('p.estado', ['APROBADO', 'DEVUELTO', 'ENTREGADO']);
            
            $this->applyTipoUsoFilter($equiposPrestadosQuery, $uso);
            $equiposPrestados = $equiposPrestadosQuery->distinct('pe.idEquipo')->count('pe.idEquipo');

            $utilizacion = $totalEquipos > 0 
                ? round(($equiposPrestados / $totalEquipos) * 100, 1) 
                : 0;

            // Desglose
            $internos = (clone $prestamosQuery)->where('p.tipo', 'INTERNO')->count();
            $externos = (clone $prestamosQuery)->where('p.tipo', 'EXTERNO')->count();

            $result[] = [
                'periodo' => $periodo,
                'prestamos' => $prestamos,
                'equipos_prestados' => $equiposPrestados,
                'utilizacion_porcentaje' => $utilizacion,
                'internos' => $internos,
                'externos' => $externos
            ];
        }

        return [
            'data' => $result,
            'filtros' => [
                'from' => $start->toDateString(),
                'to' => $end->toDateString(),
                'uso' => $uso,
                'granularity' => $granularity
            ]
        ];
    }

    /**
     * Métricas por categoría (agregadas)
     */
    public function getMetricasPorCategoria(?Request $request = null): array
    {
        [$start, $end] = $this->getDateRange($request);
        $uso = $request?->input('uso', 'ambos') ?? 'ambos';

        $categorias = DB::table('categorias')->get();
        $result = [];

        foreach ($categorias as $categoria) {
            $equipos = DB::table('equipos as e')
                ->join('tipo_equipos as te', 'te.id', '=', 'e.tipo_equipo_id')
                ->where('te.categoria_id', $categoria->id)
                ->pluck('e.id')
                ->toArray();

            if (empty($equipos)) continue;

            $totalEquipos = count($equipos);

            // Préstamos de equipos de esta categoría
            $prestamosQuery = DB::table('prestamos as p')
                ->join('prestamo_equipo as pe', 'pe.idPrestamo', '=', 'p.idPrestamo')
                ->whereIn('pe.idEquipo', $equipos)
                ->whereBetween('p.created_at', [$start, $end])
                ->whereIn('p.estado', ['APROBADO', 'DEVUELTO', 'ENTREGADO']);

            $this->applyTipoUsoFilter($prestamosQuery, $uso);
            $totalPrestamos = $prestamosQuery->count();

            // Equipos únicos prestados
            $equiposPrestados = (clone $prestamosQuery)
                ->distinct('pe.idEquipo')
                ->count('pe.idEquipo');

            // Promedio duración
            $promedioDuracion = DB::table('prestamos as p')
                ->join('prestamo_equipo as pe', 'pe.idPrestamo', '=', 'p.idPrestamo')
                ->whereIn('pe.idEquipo', $equipos)
                ->whereBetween('p.created_at', [$start, $end])
                ->where('p.estado', 'DEVUELTO')
                ->selectRaw('AVG(DATEDIFF(p.fecha_fin, p.fecha_inicio)) as promedio')
                ->value('promedio');

            $mesesEnRango = max(1, $start->diffInMonths($end));

            $result[] = [
                'id' => $categoria->id,
                'nombre' => $categoria->nombre,
                'total_equipos' => $totalEquipos,
                'equipos_prestados' => $equiposPrestados,
                'total_prestamos' => $totalPrestamos,
                'prestamos_por_mes' => round($totalPrestamos / $mesesEnRango, 2),
                'utilizacion_porcentaje' => $totalEquipos > 0 
                    ? round(($equiposPrestados / $totalEquipos) * 100, 1) 
                    : 0,
                'promedio_duracion_dias' => $promedioDuracion ? round($promedioDuracion, 1) : 0
            ];
        }

        // Ordenar por utilización
        usort($result, fn($a, $b) => $b['utilizacion_porcentaje'] <=> $a['utilizacion_porcentaje']);

        return [
            'data' => $result,
            'filtros' => [
                'from' => $start->toDateString(),
                'to' => $end->toDateString(),
                'uso' => $uso
            ]
        ];
    }

    /**
     * Comparación equipo antiguo vs nuevo
     */
    public function getComparacionAntiguedad(?Request $request = null): array
    {
        $equiposData = $this->getEquiposNormalizados($request, 1000);
        $equipos = $equiposData['data'];

        // Dividir en antiguos (>12 meses) y nuevos (<=12 meses)
        $antiguos = array_filter($equipos, fn($e) => $e['meses_activos'] > 12);
        $nuevos = array_filter($equipos, fn($e) => $e['meses_activos'] <= 12);

        $calcularPromedios = function($lista) {
            if (empty($lista)) return [
                'cantidad' => 0,
                'promedio_utilizacion' => 0,
                'promedio_prestamos_mes' => 0,
                'promedio_duracion' => 0
            ];

            $cantidad = count($lista);
            return [
                'cantidad' => $cantidad,
                'promedio_utilizacion' => round(array_sum(array_column($lista, 'utilizacion_porcentaje')) / $cantidad, 1),
                'promedio_prestamos_mes' => round(array_sum(array_column($lista, 'prestamos_por_mes_activo')) / $cantidad, 2),
                'promedio_duracion' => round(array_sum(array_column($lista, 'promedio_duracion_dias')) / $cantidad, 1)
            ];
        };

        return [
            'antiguos' => $calcularPromedios($antiguos),
            'nuevos' => $calcularPromedios($nuevos),
            'resumen' => 'Equipos antiguos: >12 meses activos. Nuevos: <=12 meses activos.',
            'filtros' => $equiposData['filtros']
        ];
    }
}
