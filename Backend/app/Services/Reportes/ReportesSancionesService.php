<?php

namespace App\Services\Reportes;

use Illuminate\Support\Facades\DB;
use Carbon\Carbon;

class ReportesSancionesService
{
    private function rangoFechas(?string $inicio, ?string $fin): array
    {
        $start = $inicio ? Carbon::parse($inicio)->startOfDay() : Carbon::now()->subMonths(12)->startOfMonth();
        $end = $fin ? Carbon::parse($fin)->endOfDay() : Carbon::now()->endOfDay();
        return [$start, $end];
    }

    public function kpis()
    {
        return [
            'sancionesActivas' => DB::table('sancions')->where('estado', 'ACTIVA')->count(),
            'sancionesTotal' => DB::table('user_sancion')->count(),
            'bloqueosActivos' => DB::table('users')->where('bloqueado', true)->count(),
            'bloqueosHistoricos' => DB::table('user_sancion')->where('accion', 'BLOQUEO')->count(),
        ];
    }

    public function motivosFrecuentes(?string $inicio = null, ?string $fin = null)
    {
        [$start, $end] = $this->rangoFechas($inicio, $fin);

        return DB::table('user_sancion as us')
            ->join('sancions as s', 's.idSancion', '=', 'us.idSancion')
            ->whereBetween('us.created_at', [$start, $end])
            ->select('s.nivel as motivo', DB::raw('COUNT(*) as total'))
            ->groupBy('s.nivel')
            ->orderByDesc('total')
            ->get();
    }

    public function reincidenciaUsuarios(?string $inicio = null, ?string $fin = null)
    {
        [$start, $end] = $this->rangoFechas($inicio, $fin);

        return DB::table('user_sancion as us')
            ->join('users as u', 'u.idUser', '=', 'us.idUser')
            ->join('persona as p', 'p.idPersona', '=', 'u.idPersona')
            ->whereBetween('us.created_at', [$start, $end])
            ->selectRaw("CONCAT(p.Nombre,' ',p.Apellido1) as usuario")
            ->addSelect('u.Email as email')
            ->selectRaw('COUNT(*) as total')
            ->groupBy('u.idUser', 'p.Nombre', 'p.Apellido1', 'u.Email')
            ->orderByDesc('total')
            ->limit(10)
            ->get();
    }

    public function bloqueosActivos()
    {
        return DB::table('users as u')
            ->join('persona as p', 'p.idPersona', '=', 'u.idPersona')
            ->leftJoin('users as admin', 'admin.idUser', '=', 'u.bloqueado_por')
            ->leftJoin('persona as pa', 'pa.idPersona', '=', 'admin.idPersona')
            ->where('u.bloqueado', true)
            ->selectRaw("CONCAT(p.Nombre,' ',p.Apellido1) as usuario")
            ->addSelect('u.Email as email', 'u.bloqueado_motivo', 'u.bloqueado_fecha')
            ->selectRaw("CONCAT(pa.Nombre,' ',pa.Apellido1) as bloqueado_por")
            ->orderBy('u.bloqueado_fecha', 'desc')
            ->get();
    }

    public function relacionAtrasos()
    {
        $sanciones = DB::table('user_sancion')
            ->select('idUser', DB::raw('COUNT(*) as sanciones'))
            ->groupBy('idUser');

        $atrasos = DB::table('prestamos')
            ->where('estado', 'APROBADO')
            ->whereNotNull('fecha_fin')
            ->where('fecha_fin', '<', Carbon::now())
            ->select('idUser', DB::raw('COUNT(*) as atrasos'))
            ->groupBy('idUser');

        return DB::table('users as u')
            ->join('persona as p', 'p.idPersona', '=', 'u.idPersona')
            ->leftJoinSub($sanciones, 's', 's.idUser', '=', 'u.idUser')
            ->leftJoinSub($atrasos, 'a', 'a.idUser', '=', 'u.idUser')
            ->selectRaw("CONCAT(p.Nombre,' ',p.Apellido1) as usuario")
            ->addSelect('u.Email as email')
            ->selectRaw('COALESCE(s.sanciones, 0) as sanciones')
            ->selectRaw('COALESCE(a.atrasos, 0) as atrasos')
            ->orderByDesc('sanciones')
            ->limit(15)
            ->get();
    }
}
