<?php

namespace App\Services\Reportes;

use Carbon\Carbon;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class ReportesAsignaturasService
{
    /**
     * Extrae rango de fechas del request (from/to) o aplica default.
     */
    private function getDateRange(?Request $request, int $defaultMonths = 12): array
    {
        $end   = $request && $request->filled('to')
            ? Carbon::parse($request->input('to'))->endOfDay()
            : Carbon::now()->endOfDay();
        $start = $request && $request->filled('from')
            ? Carbon::parse($request->input('from'))->startOfDay()
            : $end->copy()->subMonths($defaultMonths)->startOfDay();

        return [$start, $end];
    }

    /* ============================================================
       1) Uso por asignatura
    ============================================================ */
    public function getUsoAsignaturas(?Request $request = null)
    {
        [$start, $end] = $this->getDateRange($request);

        return DB::table('bloque_prestamos as bp')
            ->join('asignaturas as a', 'a.idAsignatura', '=', 'bp.idAsignatura')
            ->join('prestamos as p', 'p.idPrestamo', '=', 'bp.idPrestamo')
            ->whereBetween('p.fecha_inicio', [$start, $end])
            ->select(
                'a.nombre as asignatura',
                DB::raw('COUNT(*) as prestamos')
            )
            ->groupBy('a.nombre')
            ->orderByDesc('prestamos')
            ->get();
    }

    /* ============================================================
       2) Equipos más usados por asignatura (con paginación)
    ============================================================ */
    public function getEquiposPorAsignatura(Request $request)
    {
        [$start, $end] = $this->getDateRange($request);
        $perPage = $request->input('per_page', 15);
        $search  = $request->input('search', '');

        $query = DB::table('bloque_prestamos as bp')
            ->join('asignaturas as a', 'a.idAsignatura', '=', 'bp.idAsignatura')
            ->join('prestamos as p', 'p.idPrestamo', '=', 'bp.idPrestamo')
            ->join('prestamo_equipo as pe', 'pe.idPrestamo', '=', 'p.idPrestamo')
            ->join('equipos as e', 'e.id', '=', 'pe.idEquipo')
            ->join('tipo_equipos as te', 'te.id', '=', 'e.tipo_equipo_id')
            ->whereBetween('p.fecha_inicio', [$start, $end])
            ->select(
                'a.nombre as asignatura',
                'te.nombre as equipo',
                DB::raw('COUNT(*) as total')
            )
            ->groupBy('a.nombre', 'te.nombre')
            ->orderByDesc('total');

        // 🔎 búsqueda opcional (parametrizada para evitar SQL injection)
        if ($search !== '') {
            $query->where(function ($q) use ($search) {
                $q->where('a.nombre', 'LIKE', '%' . $search . '%')
                  ->orWhere('te.nombre', 'LIKE', '%' . $search . '%');
            });
        }

        // 📌 paginar el resultado final
        $page = $query->paginate($perPage);

        return [
            'data' => $page->items(),
            'page' => $page->currentPage(),
            'totalPages' => $page->lastPage(),
            'total' => $page->total()
        ];
    }

    /* ============================================================
       3) Tendencia por año
    ============================================================ */
    public function getTendenciaAsignaturas(?Request $request = null)
    {
        [$start, $end] = $this->getDateRange($request, 36);

        return DB::table('bloque_prestamos as bp')
            ->join('prestamos as p', 'p.idPrestamo', '=', 'bp.idPrestamo')
            ->whereBetween('p.fecha_inicio', [$start, $end])
            ->select(
                DB::raw('YEAR(p.fecha_inicio) AS anio'),
                DB::raw('COUNT(*) AS prestamos')
            )
            ->groupBy('anio')
            ->orderBy('anio')
            ->get();
    }
}
