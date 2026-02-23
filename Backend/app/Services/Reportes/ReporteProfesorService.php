<?php

namespace App\Services\Reportes;

use Carbon\Carbon;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class ReporteProfesorService
{
    /**
     * Obtener rango de fechas desde request o default (12 meses)
     */
    private function getDateRange(?Request $request, int $defaultMonths = 12): array
    {
        if ($request && $request->has('from') && $request->has('to')) {
            return [
                Carbon::parse($request->input('from'))->startOfDay(),
                Carbon::parse($request->input('to'))->endOfDay()
            ];
        }
        return [
            Carbon::now()->subMonths($defaultMonths)->startOfMonth(),
            Carbon::now()->endOfDay()
        ];
    }

    /* ============================================================
       1. Préstamos por profesor (TOP) — con filtro de fechas
    ============================================================ */
    public function getPrestamosPorProfesor(?Request $request = null)
    {
        [$start, $end] = $this->getDateRange($request);

        return DB::table('docentes AS d')
            ->join('persona AS pe', 'pe.idPersona', '=', 'd.idPersona')
            ->leftJoin('users AS u', 'u.idPersona', '=', 'pe.idPersona')
            ->leftJoin('prestamos AS p', function ($join) use ($start, $end) {
                $join->on('p.idUser', '=', 'u.idUser')
                     ->whereBetween('p.created_at', [$start, $end]);
            })
            ->selectRaw("CONCAT(pe.Nombre, ' ', pe.Apellido1) AS profesor")
            ->selectRaw("COUNT(p.idPrestamo) AS total")
            ->groupBy('d.idDocente', 'profesor')
            ->orderByDesc('total')
            ->get();
    }

    /* ============================================================
       2. Tendencia mensual por profesor — con filtro de fechas
    ============================================================ */
public function getTendenciaMensual(?Request $request = null)
{
    [$start, $end] = $this->getDateRange($request);

    // 1) Obtener todos los meses reales presentes en préstamos del período
    $periodos = DB::table('prestamos')
        ->selectRaw("DATE_FORMAT(fecha_inicio, '%Y-%m') AS periodo")
        ->whereNotNull('fecha_inicio')
        ->whereBetween('fecha_inicio', [$start, $end])
        ->groupBy('periodo')
        ->orderBy('periodo')
        ->pluck('periodo')
        ->toArray();

    // 2) Obtener docentes (los únicos que deben aparecer)
    $docentes = DB::table('docentes AS d')
        ->join('persona AS pe', 'pe.idPersona', '=', 'd.idPersona')
        ->leftJoin('users AS u', 'u.idPersona', '=', 'pe.idPersona')
        ->select(
            'd.idDocente',
            DB::raw("CONCAT(pe.Nombre, ' ', pe.Apellido1) AS profesor"),
            'u.idUser'
        )
        ->get();

    // 3) Obtener totales por docente y periodo (filtrado por fechas)
    $totales = DB::table('prestamos AS p')
        ->join('users AS u', 'u.idUser', '=', 'p.idUser')
        ->join('persona AS pe', 'pe.idPersona', '=', 'u.idPersona')
        ->join('docentes AS d', 'd.idPersona', '=', 'pe.idPersona')
        ->whereBetween('p.fecha_inicio', [$start, $end])
        ->selectRaw("
            d.idDocente,
            DATE_FORMAT(p.fecha_inicio, '%Y-%m') AS periodo,
            COUNT(*) AS total
        ")
        ->groupBy('d.idDocente', 'periodo')
        ->get();

    // 4) Armar dataset final (series)
    $series = [];

    foreach ($docentes as $doc) {
        $data = [];

        foreach ($periodos as $mes) {
            $match = $totales->first(function ($t) use ($doc, $mes) {
                return $t->idDocente == $doc->idDocente && $t->periodo == $mes;
            });

            $data[] = $match ? (int)$match->total : 0;
        }

        $series[] = [
            "name" => $doc->profesor,
            "type" => "line",
            "smooth" => true,
            "data" => $data,
        ];
    }

    return [
        "meses" => $periodos,
        "series" => $series
    ];
}






    /* ============================================================
       3. Equipos más usados por profesor (tabla paginada)
       Agrupado por TIPO DE EQUIPO, no por equipo físico individual
    ============================================================ */
public function getEquiposPorProfesor($page, $pageSize)
{
    $query = DB::table('docentes AS d')
        ->join('persona AS pe', 'pe.idPersona', '=', 'd.idPersona')
        ->leftJoin('users AS u', 'u.idPersona', '=', 'pe.idPersona')
        ->leftJoin('prestamos AS p', 'p.idUser', '=', 'u.idUser')
        ->leftJoin('prestamo_equipo AS peq', 'peq.idPrestamo', '=', 'p.idPrestamo')
        ->leftJoin('equipos AS e', 'e.id', '=', 'peq.idEquipo')
        ->leftJoin('tipo_equipos AS te', 'te.id', '=', 'e.tipo_equipo_id')
        ->selectRaw('d.idDocente')
        ->selectRaw("CONCAT(pe.Nombre, ' ', pe.Apellido1) AS profesor")
        ->selectRaw("te.nombre AS equipo")
        ->selectRaw("COUNT(e.id) AS total")
        ->whereNotNull('te.nombre')
        ->groupBy('d.idDocente', 'profesor', 'te.nombre')
        ->orderByDesc('total');

    // Total sin paginar
    $totalQuery = clone $query;
    $total = $totalQuery->get()->count();

    $data = $query
        ->skip(($page - 1) * $pageSize)
        ->take($pageSize)
        ->get();

    return [
        'data' => $data,
        'total' => $total,
        'page' => $page,
        'pageSize' => $pageSize,
        'totalPages' => ceil($total / $pageSize),
    ];
}

}
