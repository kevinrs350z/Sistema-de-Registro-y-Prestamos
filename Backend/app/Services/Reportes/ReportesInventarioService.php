<?php

namespace App\Services\Reportes;

use Illuminate\Support\Facades\DB;
use Carbon\Carbon;

class ReportesInventarioService
{
    private function rangoFechas(?string $inicio, ?string $fin): array
    {
        $start = $inicio ? Carbon::parse($inicio)->startOfDay() : Carbon::now()->subMonths(12)->startOfMonth();
        $end = $fin ? Carbon::parse($fin)->endOfDay() : Carbon::now()->endOfDay();
        return [$start, $end];
    }

    public function estadoInventario()
    {
        return DB::table('equipos')
            ->select('estado', DB::raw('COUNT(*) as total'))
            ->groupBy('estado')
            ->orderBy('estado')
            ->get();
    }

    public function equiposPorCategoria()
    {
        return DB::table('equipos as e')
            ->join('tipo_equipos as te', 'te.id', '=', 'e.tipo_equipo_id')
            ->join('categorias as c', 'c.id', '=', 'te.categoria_id')
            ->select('c.nombre as categoria', DB::raw('COUNT(*) as total'))
            ->groupBy('c.id', 'c.nombre')
            ->orderByDesc('total')
            ->get();
    }

    public function antiguedadEquipos()
    {
        return DB::table('equipos')
            ->selectRaw("CASE 
                WHEN TIMESTAMPDIFF(YEAR, created_at, CURDATE()) <= 1 THEN '0-1 años'
                WHEN TIMESTAMPDIFF(YEAR, created_at, CURDATE()) BETWEEN 2 AND 3 THEN '2-3 años'
                WHEN TIMESTAMPDIFF(YEAR, created_at, CURDATE()) BETWEEN 4 AND 5 THEN '4-5 años'
                ELSE '6+ años' END as rango")
            ->selectRaw('COUNT(*) as total')
            ->groupBy('rango')
            ->orderByRaw("FIELD(rango, '0-1 años','2-3 años','4-5 años','6+ años')")
            ->get();
    }

    public function topUtilizados(?string $inicio = null, ?string $fin = null, int $limit = 10)
    {
        [$start, $end] = $this->rangoFechas($inicio, $fin);

        return DB::table('prestamo_equipo as pe')
            ->join('prestamos as p', 'p.idPrestamo', '=', 'pe.idPrestamo')
            ->join('equipos as e', 'e.id', '=', 'pe.idEquipo')
            ->join('tipo_equipos as te', 'te.id', '=', 'e.tipo_equipo_id')
            ->whereBetween('p.created_at', [$start, $end])
            ->select('te.nombre as equipo', DB::raw('COUNT(*) as total'))
            ->groupBy('te.id', 'te.nombre')
            ->orderByDesc('total')
            ->limit($limit)
            ->get();
    }

    public function subUtilizados(?string $inicio = null, ?string $fin = null, int $limit = 10)
    {
        [$start, $end] = $this->rangoFechas($inicio, $fin);

        return DB::table('tipo_equipos as te')
            ->leftJoin('equipos as e', 'e.tipo_equipo_id', '=', 'te.id')
            ->leftJoin('prestamo_equipo as pe', 'pe.idEquipo', '=', 'e.id')
            ->leftJoin('prestamos as p', function ($join) use ($start, $end) {
                $join->on('p.idPrestamo', '=', 'pe.idPrestamo')
                     ->whereBetween('p.created_at', [$start, $end]);
            })
            ->select('te.nombre as equipo', DB::raw('COUNT(p.idPrestamo) as total'))
            ->groupBy('te.id', 'te.nombre')
            ->orderBy('total')
            ->limit($limit)
            ->get();
    }
}
