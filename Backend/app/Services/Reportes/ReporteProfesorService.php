<?php

namespace App\Services\Reportes;

use Illuminate\Support\Facades\DB;

class ReporteProfesorService
{
    /* ============================================================
       1. Préstamos por profesor (TOP)
    ============================================================ */
    public function getPrestamosPorProfesor()
    {
        return DB::table('docentes AS d')
            ->join('persona AS pe', 'pe.idPersona', '=', 'd.idPersona')
            ->leftJoin('users AS u', 'u.idPersona', '=', 'pe.idPersona')
            ->leftJoin('prestamos AS p', 'p.idUser', '=', 'u.idUser')
            ->selectRaw("CONCAT(pe.Nombre, ' ', pe.Apellido1) AS profesor")
            ->selectRaw("COUNT(p.idPrestamo) AS total")
            ->groupBy('d.idDocente', 'profesor')
            ->orderByDesc('total')
            ->get();
    }

    /* ============================================================
       2. Tendencia mensual por profesor
    ============================================================ */
public function getTendenciaMensual()
{
    // 1) Obtener todos los meses reales presentes en préstamos
    $periodos = DB::table('prestamos')
        ->selectRaw("DATE_FORMAT(fecha_inicio, '%Y-%m') AS periodo")
        ->whereNotNull('fecha_inicio')
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

    // 3) Obtener totales por docente y periodo
    $totales = DB::table('prestamos AS p')
        ->join('users AS u', 'u.idUser', '=', 'p.idUser')
        ->join('persona AS pe', 'pe.idPersona', '=', 'u.idPersona')
        ->join('docentes AS d', 'd.idPersona', '=', 'pe.idPersona')
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
    ============================================================ */
public function getEquiposPorProfesor($page, $pageSize)
{
    $query = DB::table('docentes AS d')
        ->join('persona AS pe', 'pe.idPersona', '=', 'd.idPersona')
        ->leftJoin('users AS u', 'u.idPersona', '=', 'pe.idPersona')
        ->leftJoin('prestamos AS p', 'p.idUser', '=', 'u.idUser')
        ->leftJoin('prestamo_equipo AS peq', 'peq.idPrestamo', '=', 'p.idPrestamo')
        ->leftJoin('equipos AS e', 'e.id', '=', 'peq.idEquipo')
        ->selectRaw('d.idDocente')
        ->selectRaw("CONCAT(pe.Nombre, ' ', pe.Apellido1) AS profesor")
        ->selectRaw("e.codigo AS equipo")
        ->selectRaw("COUNT(e.id) AS total")
        ->groupBy('d.idDocente', 'profesor', 'equipo')
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
