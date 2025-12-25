<?php

namespace App\Services\Reportes;

use Illuminate\Support\Facades\DB;
use Carbon\Carbon;

class ReportesAlumnosAdminService
{
    /* ============================================================
       UTILIDAD: rango temporal para analítica
       (usa created_at)
    ============================================================ */
    private function getRange($months = 6)
    {
        $end = Carbon::now()->endOfDay();
        $start = Carbon::now()->subMonths($months - 1)->startOfMonth();
        return [$start, $end];
    }

    /* ============================================================
       SOLO USUARIOS ALUMNOS
    ============================================================ */
    private function alumnosUserIds()
    {
        return DB::table('rol_user as ru')
            ->join('rol as r', 'r.idRol', '=', 'ru.idRol')
            ->whereRaw('LOWER(r.Nombre) = ?', ['alumno'])
            ->pluck('ru.idUser')
            ->toArray();
    }

    /* ============================================================
       0) KPIs DASHBOARD
    ============================================================ */
    public function getKPIs()
    {
        [$start, $end] = $this->getRange(1);
        $alumnos = $this->alumnosUserIds();

        // solicitudes creadas este mes
        $totalLoans = DB::table('prestamos')
            ->whereIn('idUser', $alumnos)
            ->whereBetween('created_at', [$start, $end])
            ->count();

        $pending = DB::table('prestamos')
            ->whereIn('idUser', $alumnos)
            ->where('estado', 'PENDIENTE')
            ->count();

        $active = DB::table('prestamos')
            ->whereIn('idUser', $alumnos)
            ->where('estado', 'APROBADO')
            ->count();

        // ATRASO DERIVADO
        $late = DB::table('prestamos')
            ->whereIn('idUser', $alumnos)
            ->where('estado', 'APROBADO')
            ->where('fecha_fin', '<', now())
            ->count();

        // tiempo real de resolución (updated_at - created_at)
        $avgResolutionDays = DB::table('prestamos')
            ->whereIn('idUser', $alumnos)
            ->whereIn('estado', ['DEVUELTO'])
            ->selectRaw('AVG(DATEDIFF(updated_at, created_at)) as avgDays')
            ->value('avgDays');

        $totalEquipos = DB::table('equipos')->count();

        $equiposPrestados = DB::table('prestamos as p')
            ->join('prestamo_equipo as pe', 'pe.idPrestamo', '=', 'p.idPrestamo')
            ->where('p.estado', 'APROBADO')
            ->distinct('pe.idEquipo')
            ->count('pe.idEquipo');

        return [
            'totalLoans' => $totalLoans,
            'pendingApprovals' => $pending,
            'activeLoans' => $active,
            'lateReturns' => $late,
            'avgResolutionDays' => $avgResolutionDays ? round($avgResolutionDays, 1) : 0,
            'equipmentUtilization' => $totalEquipos > 0
                ? round(($equiposPrestados / $totalEquipos) * 100, 1)
                : 0
        ];
    }

    /* ============================================================
       1) CUELLO DE BOTELLA (ESTADOS)
    ============================================================ */
    public function getWorkflowEstados()
    {
        return DB::table('prestamos')
            ->select('estado', DB::raw('COUNT(*) as total'))
            ->whereIn('idUser', $this->alumnosUserIds())
            ->groupBy('estado')
            ->orderByDesc('total')
            ->get();
    }

    /* ============================================================
       2) TIEMPO PROMEDIO DE RESOLUCIÓN (por mes)
    ============================================================ */
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

    /* ============================================================
       3) EQUIPOS CRÍTICOS (scatter)
    ============================================================ */
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

    /* ============================================================
       4) EVOLUCIÓN INVENTARIO (por mes)
    ============================================================ */
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

    /* ============================================================
       5) HEATMAP (día / hora) → created_at
    ============================================================ */
    public function getHeatmapSolicitudes($months = 3)
    {
        [$start, $end] = $this->getRange($months);

        // Días laborales (ordenados para el heatmap)
        $dias = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes'];

        // Horas de atención (08:00 a 20:00)
        $horas = collect(range(8, 20))
            ->map(fn($h) => str_pad($h, 2, '0', STR_PAD_LEFT) . ':00')
            ->values();

        // Datos base desde la BD
        $rows = DB::table('prestamos')
            ->whereIn('idUser', $this->alumnosUserIds())
            ->whereBetween('created_at', [$start, $end])
            ->selectRaw('DAYOFWEEK(created_at) as dow')
            ->selectRaw('HOUR(created_at) as hour')
            ->selectRaw('COUNT(*) as total')
            ->groupBy('dow', 'hour')
            ->get();

        /**
         * Mapeo de DAYOFWEEK (MySQL)
         * 1 = Domingo (no se usa)
         * 2 = Lunes    -> índice 0
         * 3 = Martes   -> índice 1
         * 4 = Miércoles-> índice 2
         * 5 = Jueves   -> índice 3
         * 6 = Viernes  -> índice 4
         * 7 = Sábado   (no se usa)
         */
        $dowMap = [
            2 => 0,
            3 => 1,
            4 => 2,
            5 => 3,
            6 => 4
        ];

        $data = [];

        foreach ($rows as $r) {
            // Ignorar fines de semana
            if (!isset($dowMap[$r->dow])) {
                continue;
            }

            // Ignorar horas fuera del rango
            if ($r->hour < 8 || $r->hour > 20) {
                continue;
            }

            // Formato esperado por ECharts: [x, y, valor]
            $data[] = [
                $r->hour - 8,          // índice hora (0 = 08:00)
                $dowMap[$r->dow],      // índice día
                (int) $r->total        // cantidad de solicitudes
            ];
        }

        return [
            'dias'  => $dias,
            'horas' => $horas,
            'data'  => $data
        ];
    }


    /* ============================================================
       6) RIESGO POR ALUMNO
    ============================================================ */
    public function getRiesgoPorAlumno($months = 6)
{
    [$start, $end] = $this->getRange($months);
    $alumnos = $this->alumnosUserIds();

    // ===============================
    // 1) Estadísticas base
    // ===============================
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

    // ===============================
    // 2) Sanciones activas por alumno
    // ===============================
    $sanctions = DB::table('user_sancion as us')
        ->join('sancions as s', 's.idSancion', '=', 'us.idSancion')
        ->where('s.estado', 'ACTIVA')
        ->select('us.idUser', DB::raw('COUNT(*) as total'))
        ->groupBy('us.idUser')
        ->get()
        ->keyBy('idUser');

    // ===============================
    // 3) Construcción del resultado final
    // ===============================
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

        // Regla de riesgo (simple y clara)
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

}
