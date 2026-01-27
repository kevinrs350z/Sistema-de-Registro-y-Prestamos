<?php

namespace App\Services\Reportes;

use Illuminate\Support\Facades\DB;
use Carbon\Carbon;

class ReportesTendenciasService
{
    private function rangoFechas(?string $inicio, ?string $fin): array
    {
        $start = $inicio ? Carbon::parse($inicio)->startOfDay() : Carbon::now()->subMonths(12)->startOfMonth();
        $end = $fin ? Carbon::parse($fin)->endOfDay() : Carbon::now()->endOfDay();
        return [$start, $end];
    }

    public function prestamosPorMes(?string $inicio = null, ?string $fin = null)
    {
        [$start, $end] = $this->rangoFechas($inicio, $fin);

        return DB::table('prestamos')
            ->whereBetween('created_at', [$start, $end])
            ->selectRaw("DATE_FORMAT(created_at, '%Y-%m') as mes")
            ->selectRaw('COUNT(*) as total')
            ->groupBy('mes')
            ->orderBy('mes')
            ->get();
    }

    public function categoriasMasDemandadas(?string $inicio = null, ?string $fin = null)
    {
        [$start, $end] = $this->rangoFechas($inicio, $fin);

        return DB::table('prestamo_equipo as pe')
            ->join('prestamos as p', 'p.idPrestamo', '=', 'pe.idPrestamo')
            ->join('equipos as e', 'e.id', '=', 'pe.idEquipo')
            ->join('tipo_equipos as te', 'te.id', '=', 'e.tipo_equipo_id')
            ->join('categorias as c', 'c.id', '=', 'te.categoria_id')
            ->whereBetween('p.created_at', [$start, $end])
            ->select('c.nombre as categoria', DB::raw('COUNT(*) as total'))
            ->groupBy('c.id', 'c.nombre')
            ->orderByDesc('total')
            ->limit(10)
            ->get();
    }

    public function usoPorTipoUsuario(?string $inicio = null, ?string $fin = null)
    {
        [$start, $end] = $this->rangoFechas($inicio, $fin);

        return DB::table('prestamos as p')
            ->join('users as u', 'u.idUser', '=', 'p.idUser')
            ->join('rol_user as ru', 'ru.idUser', '=', 'u.idUser')
            ->join('rol as r', 'r.idRol', '=', 'ru.idRol')
            ->whereBetween('p.created_at', [$start, $end])
            ->selectRaw("LOWER(r.Nombre) as rol")
            ->selectRaw('COUNT(*) as total')
            ->groupBy('rol')
            ->orderByDesc('total')
            ->get();
    }
}
