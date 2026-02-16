<?php
namespace App\Services\Reportes;

use Carbon\Carbon;
use Illuminate\Support\Facades\DB;
use Illuminate\Http\Request;

/**
 * Servicio de reportes de alumnos con filtros BI estándar.
 * 
 * Soporta filtros universales:
 * - from/to: Rango de fechas (YYYY-MM-DD)
 * - uso: interno | externo | ambos
 * - anioIngreso: Año de ingreso del alumno
 * - granularity: day | week | month | quarter | semester | year
 */
class ReportesAlumnosAdminService
{
    /**
     * Obtener rango de fechas desde request o usar default
     */
    private function getDateRange(?Request $request, int $defaultMonths = 6): array
    {
        if ($request && $request->has('from') && $request->has('to')) {
            $start = Carbon::parse($request->input('from'))->startOfDay();
            $end = Carbon::parse($request->input('to'))->endOfDay();
        } else {
            $end = Carbon::now()->endOfDay();
            $start = Carbon::now()->subMonths($defaultMonths - 1)->startOfMonth();
        }
        return [$start, $end];
    }

    /**
     * Aplicar filtro de tipo de uso (interno/externo/ambos)
     */
    private function applyTipoUsoFilter($query, ?Request $request)
    {
        $uso = $request?->input('uso', 'ambos') ?? 'ambos';
        
        if ($uso === 'interno') {
            $query->where('p.tipo', 'INTERNO');
        } elseif ($uso === 'externo') {
            $query->where('p.tipo', 'EXTERNO');
        }
        // 'ambos' no aplica filtro
        
        return $query;
    }

    /**
     * Obtener IDs de alumnos, opcionalmente filtrados por año de ingreso
     */
    private function alumnosUserIds(?int $anioIngreso = null): array
    {
        $query = DB::table('rol_user as ru')
            ->join('rol as r', 'r.idRol', '=', 'ru.idRol')
            ->join('users as u', 'u.idUser', '=', 'ru.idUser')
            ->whereRaw('LOWER(r.Nombre) = ?', ['alumno']);
            
        if ($anioIngreso) {
            $query->whereYear('u.created_at', $anioIngreso);
        }
        
        return $query->pluck('ru.idUser')->toArray();
    }

    /**
     * Generar todos los períodos del rango (para 12 meses completos)
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
                case 'quarter':
                    $periods[] = $current->format('Y') . '-Q' . ceil($current->month / 3);
                    $current->addMonths(3);
                    break;
            }
        }
        
        return $periods;
    }

    /**
     * @deprecated Usar getKPIs con Request
     */
    private function getRange($months = 6)
    {
        $end = Carbon::now()->endOfDay();
        $start = Carbon::now()->subMonths($months - 1)->startOfMonth();
        return [$start, $end];
    }

    public function getKPIs(?Request $request = null, $months = 1)
    {
        [$start, $end] = $this->getDateRange($request, $months);
        $anioIngreso = $request?->input('anioIngreso') ? (int)$request->input('anioIngreso') : null;
        $alumnos = $this->alumnosUserIds($anioIngreso);
        $uso = $request?->input('uso', 'ambos') ?? 'ambos';

        // Query base con filtro de uso
        $baseQuery = DB::table('prestamos as p')
            ->whereIn('p.idUser', $alumnos)
            ->whereBetween('p.created_at', [$start, $end]);
        
        if ($uso === 'interno') {
            $baseQuery->where('p.tipo', 'INTERNO');
        } elseif ($uso === 'externo') {
            $baseQuery->where('p.tipo', 'EXTERNO');
        }

        $totalLoans = (clone $baseQuery)->count();

        $alumnosConPrestamos = (clone $baseQuery)
            ->distinct('idUser')
            ->count('idUser');

        $prestamosPromedio = $alumnosConPrestamos > 0
            ? round($totalLoans / $alumnosConPrestamos, 1)
            : 0;

        $pending = (clone $baseQuery)
            ->where('p.estado', 'PENDIENTE')
            ->count();

        $active = (clone $baseQuery)
            ->where('p.estado', 'APROBADO')
            ->count();

        $late = (clone $baseQuery)
            ->where('p.estado', 'APROBADO')
            ->where('p.fecha_fin', '<', now())
            ->count();

        $avgResolutionDays = (clone $baseQuery)
            ->whereIn('p.estado', ['DEVUELTO'])
            ->selectRaw('AVG(DATEDIFF(p.updated_at, p.created_at)) as avgDays')
            ->value('avgDays');

        $totalEquipos = DB::table('equipos')->count();

        $equiposPrestadosQuery = DB::table('prestamos as p')
            ->join('prestamo_equipo as pe', 'pe.idPrestamo', '=', 'p.idPrestamo')
            ->where('p.estado', 'APROBADO');
        
        if ($uso === 'interno') {
            $equiposPrestadosQuery->where('p.tipo', 'INTERNO');
        } elseif ($uso === 'externo') {
            $equiposPrestadosQuery->where('p.tipo', 'EXTERNO');
        }
        
        $equiposPrestados = $equiposPrestadosQuery->distinct('pe.idEquipo')->count('pe.idEquipo');

        $alumnosConSanciones = DB::table('user_sancion')
            ->whereIn('idUser', $alumnos)
            ->distinct('idUser')
            ->count('idUser');

        $nuevosSemestre = DB::table('users')
            ->whereIn('idUser', $alumnos)
            ->whereBetween('created_at', [$start, $end])
            ->count();

        // Calcular variación vs período anterior
        $diffDays = $start->diffInDays($end);
        $prevStart = $start->copy()->subDays($diffDays);
        $prevEnd = $start->copy()->subDay();
        
        $prevQuery = DB::table('prestamos as p')
            ->whereIn('p.idUser', $alumnos)
            ->whereBetween('p.created_at', [$prevStart, $prevEnd]);
        
        if ($uso === 'interno') {
            $prevQuery->where('p.tipo', 'INTERNO');
        } elseif ($uso === 'externo') {
            $prevQuery->where('p.tipo', 'EXTERNO');
        }
        
        $prestamosPrevios = $prevQuery->count();
        $variacionPrestamos = $totalLoans - $prestamosPrevios;

        // Métricas de interno vs externo
        $internos = (clone $baseQuery)->where('p.tipo', 'INTERNO')->count();
        $externos = (clone $baseQuery)->where('p.tipo', 'EXTERNO')->count();

        return [
            'alumnosConPrestamos' => $alumnosConPrestamos,
            'prestamosPromedio' => $prestamosPromedio,
            'alumnosConSanciones' => $alumnosConSanciones,
            'nuevosSemestre' => $nuevosSemestre,
            'variacionPrestamos' => $variacionPrestamos,
            'totalLoans' => $totalLoans,
            'pendingApprovals' => $pending,
            'activeLoans' => $active,
            'lateReturns' => $late,
            'avgResolutionDays' => $avgResolutionDays ? round($avgResolutionDays, 1) : 0,
            'equipmentUtilization' => $totalEquipos > 0
                ? round(($equiposPrestados / $totalEquipos) * 100, 1)
                : 0,
            // Desglose interno/externo
            'prestamosInternos' => $internos,
            'prestamosExternos' => $externos,
            'porcentajeInternos' => $totalLoans > 0 ? round(($internos / $totalLoans) * 100, 1) : 0,
            'porcentajeExternos' => $totalLoans > 0 ? round(($externos / $totalLoans) * 100, 1) : 0,
            // Filtros aplicados
            'filtros' => [
                'from' => $start->toDateString(),
                'to' => $end->toDateString(),
                'uso' => $uso,
                'anioIngreso' => $anioIngreso
            ]
        ];
    }

    public function getWorkflowEstados()
    {
        return DB::table('prestamos')
            ->select('estado', DB::raw('COUNT(*) as total'))
            ->whereIn('idUser', $this->alumnosUserIds())
            ->groupBy('estado')
            ->orderByDesc('total')
            ->get();
    }

    public function getTiempoResolucion($months = 6)
    {
        [$start, $end] = $this->getRange($months);

        return DB::table('prestamos')
            ->whereIn('idUser', $this->alumnosUserIds())
            ->whereIn('estado', ['DEVUELTO'])
            ->whereBetween('created_at', [$start, $end])
            ->selectRaw("DATE_FORMAT(created_at, '%Y-%m') as mes")
            ->selectRaw("AVG(DATEDIFF(updated_at, created_at)) as promedio")
            ->groupBy('mes')
            ->orderBy('mes')
            ->get();
    }

    public function getEquiposCriticos($months = 6)
    {
        [$start, $end] = $this->getRange($months);

        $freq = DB::table('prestamos as p')
            ->join('prestamo_equipo as pe', 'pe.idPrestamo', '=', 'p.idPrestamo')
            ->join('equipos as e', 'e.id', '=', 'pe.idEquipo')
            ->join('tipo_equipos as te', 'te.id', '=', 'e.tipo_equipo_id')
            ->join('categorias as c', 'c.id', '=', 'te.categoria_id')
            ->whereIn('p.idUser', $this->alumnosUserIds())
            ->whereBetween('p.created_at', [$start, $end])
            ->select(
                'te.id as tipo_id',
                'te.nombre as name',
                'c.nombre as category',
                DB::raw('ROUND(COUNT(*) / NULLIF(COUNT(DISTINCT e.id), 0), 2) as frequency')
            )
            ->groupBy('te.id', 'te.nombre', 'c.nombre')
            ->get()
            ->keyBy('tipo_id');

        $avail = DB::table('equipos as e')
            ->join('tipo_equipos as te', 'te.id', '=', 'e.tipo_equipo_id')
            ->select(
                'te.id as tipo_id',
                DB::raw('COUNT(*) as total_units'),
                DB::raw("SUM(CASE WHEN e.estado = 'DISPONIBLE' THEN 1 ELSE 0 END) as available_units")
            )
            ->groupBy('te.id')
            ->get()
            ->keyBy('tipo_id');

        $out = [];

        foreach ($freq as $id => $row) {
            $a = $avail[$id] ?? null;
            $availability = $a && $a->total_units > 0
                ? round(($a->available_units / $a->total_units) * 100, 1)
                : 0;

            $out[] = [
                'name' => $row->name,
                'category' => $row->category,
                'frequency' => (int)$row->frequency,
                'availability' => $availability
            ];
        }

        return $out;
    }

    public function getInventarioEvolucion($months = 6)
    {
        [$start, $end] = $this->getRange($months);
        $total = DB::table('equipos')->count();

        $periodos = DB::table('prestamos')
            ->whereBetween('created_at', [$start, $end])
            ->selectRaw("DATE_FORMAT(created_at, '%Y-%m') as periodo")
            ->groupBy('periodo')
            ->orderBy('periodo')
            ->pluck('periodo');

        $prestados = DB::table('prestamos as p')
            ->join('prestamo_equipo as pe', 'pe.idPrestamo', '=', 'p.idPrestamo')
            ->where('p.estado', 'APROBADO')
            ->whereBetween('p.created_at', [$start, $end])
            ->selectRaw("DATE_FORMAT(p.created_at, '%Y-%m') as periodo")
            ->selectRaw("COUNT(DISTINCT pe.idEquipo) as prestados")
            ->groupBy('periodo')
            ->get()
            ->keyBy('periodo');

        return $periodos->map(fn($p) => [
            'periodo' => $p,
            'total' => $total,
            'prestados' => $prestados[$p]->prestados ?? 0,
            'disponibles' => max($total - ($prestados[$p]->prestados ?? 0), 0)
        ]);
    }

    public function getHeatmapSolicitudes($months = 3)
    {
        [$start, $end] = $this->getRange($months);

        $dias = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes'];

        $horas = collect(range(8, 20))
            ->map(fn($h) => str_pad($h, 2, '0', STR_PAD_LEFT) . ':00')
            ->values();

        $rows = DB::table('prestamos')
            ->whereIn('idUser', $this->alumnosUserIds())
            ->whereBetween('created_at', [$start, $end])
            ->selectRaw('DAYOFWEEK(created_at) as dow')
            ->selectRaw('HOUR(created_at) as hour')
            ->selectRaw('COUNT(*) as total')
            ->groupBy('dow', 'hour')
            ->get();

        $dowMap = [
            2 => 0,
            3 => 1,
            4 => 2,
            5 => 3,
            6 => 4
        ];

        $data = [];

        foreach ($rows as $r) {
            if (!isset($dowMap[$r->dow])) {
                continue;
            }

            if ($r->hour < 8 || $r->hour > 20) {
                continue;
            }

            $data[] = [
                $r->hour - 8,
                $dowMap[$r->dow],
                (int) $r->total
            ];
        }

        return [
            'dias'  => $dias,
            'horas' => $horas,
            'data'  => $data
        ];
    }

    public function getRiesgoPorAlumno($months = 6)
    {
        [$start, $end] = $this->getRange($months);
        $alumnos = $this->alumnosUserIds();

        $stats = DB::table('prestamos as p')
            ->join('users as u', 'u.idUser', '=', 'p.idUser')
            ->join('persona as per', 'per.idPersona', '=', 'u.idPersona')
            ->whereBetween('p.created_at', [$start, $end])
            ->whereIn('p.idUser', $alumnos)
            ->select(
                'u.idUser as id',
                DB::raw("CONCAT(per.Nombre,' ',per.apellido1) as name"),
                'u.Email as email',
                DB::raw('COUNT(*) as totalLoans'),
                DB::raw("
                    SUM(
                        CASE
                            WHEN p.estado = 'APROBADO'
                             AND p.fecha_fin < NOW()
                            THEN 1
                            ELSE 0
                        END
                    ) as lateLoans
                ")
            )
            ->groupBy('u.idUser','per.Nombre','per.apellido1','u.Email')
            ->get();

        $sanctions = DB::table('user_sancion as us')
            ->join('sancions as s', 's.idSancion', '=', 'us.idSancion')
            ->where('s.estado', 'ACTIVA')
            ->select('us.idUser', DB::raw('COUNT(*) as total'))
            ->groupBy('us.idUser')
            ->get()
            ->keyBy('idUser');

        $out = [];

        foreach ($stats as $u) {

            $totalLoans = (int) $u->totalLoans;
            $lateLoans  = (int) $u->lateLoans;

            $lateRate = $totalLoans > 0
                ? round(($lateLoans / $totalLoans) * 100, 1)
                : 0;

            $activeSanctions = isset($sanctions[$u->id])
                ? (int) $sanctions[$u->id]->total
                : 0;

            $riskScore = ($lateRate * 0.7) + ($activeSanctions * 15);

            if ($riskScore >= 40) {
                $riskLevel = 'high';
            } elseif ($riskScore >= 20) {
                $riskLevel = 'medium';
            } else {
                $riskLevel = 'low';
            }

            $out[] = [
                'id' => (int) $u->id,
                'name' => $u->name,
                'email' => $u->email,
                'totalLoans' => $totalLoans,
                'lateReturnRate' => $lateRate,
                'activeSanctions' => $activeSanctions,
                'riskLevel' => $riskLevel
            ];
        }

        return $out;
    }

    /**
     * @deprecated No funcional - la tabla users/persona no tiene campo 'carrera'.
     * Retorna préstamos agrupados por año de ingreso como alternativa.
     */
    public function getPrestamosPorCarrera(?Request $request = null, $months = 12)
    {
        [$start, $end] = $this->getDateRange($request, $months);
        $anioIngreso = $request?->input('anioIngreso') ? (int)$request->input('anioIngreso') : null;
        $alumnos = $this->alumnosUserIds($anioIngreso);
        $uso = $request?->input('uso', 'ambos') ?? 'ambos';

        $query = DB::table('prestamos as p')
            ->join('users as u', 'u.idUser', '=', 'p.idUser')
            ->whereIn('p.idUser', $alumnos)
            ->whereBetween('p.created_at', [$start, $end]);
        
        if ($uso === 'interno') {
            $query->where('p.tipo', 'INTERNO');
        } elseif ($uso === 'externo') {
            $query->where('p.tipo', 'EXTERNO');
        }

        return $query
            ->selectRaw("YEAR(u.created_at) as carrera, COUNT(*) as total_prestamos")
            ->groupBy(DB::raw('YEAR(u.created_at)'))
            ->orderByDesc('total_prestamos')
            ->get();
    }

    /**
     * Evolución de préstamos con 12 meses completos (meses vacíos = 0)
     */
    public function getEvolucionPrestamosAlumnos(?Request $request = null, $months = 12)
    {
        [$start, $end] = $this->getDateRange($request, $months);
        $anioIngreso = $request?->input('anioIngreso') ? (int)$request->input('anioIngreso') : null;
        $alumnos = $this->alumnosUserIds($anioIngreso);
        $uso = $request?->input('uso', 'ambos') ?? 'ambos';
        $granularity = $request?->input('granularity', 'month') ?? 'month';

        // Generar todos los períodos del rango
        $allPeriods = $this->generateAllPeriods($start, $end, $granularity);
        
        // Query base
        $query = DB::table('prestamos as p')
            ->whereIn('p.idUser', $alumnos)
            ->whereBetween('p.created_at', [$start, $end]);
        
        if ($uso === 'interno') {
            $query->where('p.tipo', 'INTERNO');
        } elseif ($uso === 'externo') {
            $query->where('p.tipo', 'EXTERNO');
        }

        $data = $query
            ->selectRaw("DATE_FORMAT(p.created_at, '%Y-%m') as periodo, COUNT(*) as total_prestamos")
            ->groupBy('periodo')
            ->orderBy('periodo')
            ->get()
            ->keyBy('periodo');

        // También obtener desglose interno/externo por período
        $internos = (clone $query)
            ->where('p.tipo', 'INTERNO')
            ->selectRaw("DATE_FORMAT(p.created_at, '%Y-%m') as periodo, COUNT(*) as total")
            ->groupBy('periodo')
            ->get()
            ->keyBy('periodo');

        $externos = (clone $query)
            ->where('p.tipo', 'EXTERNO')
            ->selectRaw("DATE_FORMAT(p.created_at, '%Y-%m') as periodo, COUNT(*) as total")
            ->groupBy('periodo')
            ->get()
            ->keyBy('periodo');

        // Completar todos los períodos (incluir meses con 0)
        $result = collect($allPeriods)->map(function($periodo) use ($data, $internos, $externos) {
            return [
                'periodo' => $periodo,
                'total_prestamos' => $data[$periodo]->total_prestamos ?? 0,
                'internos' => $internos[$periodo]->total ?? 0,
                'externos' => $externos[$periodo]->total ?? 0,
            ];
        });

        return [
            'data' => $result->values(),
            'filtros' => [
                'from' => $start->toDateString(),
                'to' => $end->toDateString(),
                'uso' => $uso,
                'anioIngreso' => $anioIngreso,
                'granularity' => $granularity
            ]
        ];
    }

    public function getSancionesPorNivel(?Request $request = null, $months = 12)
    {
        [$start, $end] = $this->getDateRange($request, $months);
        $anioIngreso = $request?->input('anioIngreso') ? (int)$request->input('anioIngreso') : null;
        $alumnos = $this->alumnosUserIds($anioIngreso);

        return DB::table('user_sancion as us')
            ->join('sancions as s', 's.idSancion', '=', 'us.idSancion')
            ->whereIn('us.idUser', $alumnos)
            ->whereBetween('us.created_at', [$start, $end])
            ->selectRaw("UPPER(s.nivel) as nivel, COUNT(*) as total")
            ->groupBy(DB::raw("UPPER(s.nivel)"))
            ->orderByDesc('total')
            ->get();
    }

    /**
     * Ranking de alumnos con filtros BI completos
     * Incluye: total préstamos, sanciones, desglose interno/externo, tasa de sanción
     */
    public function getRankingAlumnos(?Request $request = null, $limit = 10, $months = 12)
    {
        [$start, $end] = $this->getDateRange($request, $months);
        $anioIngreso = $request?->input('anioIngreso') ? (int)$request->input('anioIngreso') : null;
        $alumnos = $this->alumnosUserIds($anioIngreso);
        $uso = $request?->input('uso', 'ambos') ?? 'ambos';

        // Query base de préstamos
        $prestamosQuery = DB::table('prestamos as p')
            ->join('users as u', 'u.idUser', '=', 'p.idUser')
            ->join('persona as per', 'per.idPersona', '=', 'u.idPersona')
            ->whereIn('p.idUser', $alumnos)
            ->whereBetween('p.created_at', [$start, $end]);

        if ($uso === 'interno') {
            $prestamosQuery->where('p.tipo', 'INTERNO');
        } elseif ($uso === 'externo') {
            $prestamosQuery->where('p.tipo', 'EXTERNO');
        }

        $prestamos = $prestamosQuery
            ->selectRaw("
                u.idUser as idUser,
                CONCAT(per.Nombre,' ',per.apellido1,' ',COALESCE(per.apellido2,'')) as nombre,
                u.Email as email,
                YEAR(u.created_at) as anio_ingreso,
                COUNT(*) as total_prestamos,
                SUM(CASE WHEN p.tipo = 'INTERNO' THEN 1 ELSE 0 END) as prestamos_internos,
                SUM(CASE WHEN p.tipo = 'EXTERNO' THEN 1 ELSE 0 END) as prestamos_externos
            ")
            ->groupBy('u.idUser','per.Nombre','per.apellido1','per.apellido2','u.Email', 'u.created_at');

        // Subquery de sanciones en el período
        $sancionesQuery = DB::table('user_sancion as us')
            ->join('sancions as s', 's.idSancion', '=', 'us.idSancion')
            ->whereIn('us.idUser', $alumnos)
            ->whereBetween('us.created_at', [$start, $end])
            ->selectRaw("us.idUser, COUNT(*) as sanciones")
            ->groupBy('us.idUser');

        $ranking = DB::query()
            ->fromSub($prestamos, 'p')
            ->leftJoinSub($sancionesQuery, 's', 's.idUser', '=', 'p.idUser')
            ->selectRaw("
                p.idUser,
                p.nombre, 
                p.email, 
                p.anio_ingreso,
                p.total_prestamos, 
                p.prestamos_internos,
                p.prestamos_externos,
                COALESCE(s.sanciones, 0) as sanciones,
                CASE 
                    WHEN p.total_prestamos > 0 
                    THEN ROUND((COALESCE(s.sanciones, 0) / p.total_prestamos) * 100, 1)
                    ELSE 0 
                END as tasa_sancion
            ")
            ->orderByDesc('p.total_prestamos')
            ->limit($limit)
            ->get();

        return [
            'data' => $ranking,
            'filtros' => [
                'from' => $start->toDateString(),
                'to' => $end->toDateString(),
                'uso' => $uso,
                'anioIngreso' => $anioIngreso,
                'limit' => $limit
            ]
        ];
    }
}
