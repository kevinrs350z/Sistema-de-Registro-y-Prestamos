<?php

namespace App\Services\Reportes;

use Carbon\Carbon;
use Illuminate\Support\Facades\DB;

class ReportesSancionesService
{
    /**
     * KPIs de sanciones.
     */
    public function kpis(): array
    {
        // Sanciones activas: JOIN con sancions para verificar estado ACTIVA
        $totalActivas = DB::table('user_sancion as us')
            ->join('sancions as s', 's.idSancion', '=', 'us.idSancion')
            ->where('s.estado', 'ACTIVA')
            ->count();

        $totalHistoricas = DB::table('user_sancion')->count();

        // Reincidentes: usuarios con más de 1 sanción
        $reincidentes = DB::table('user_sancion')
            ->select('idUser', DB::raw('COUNT(*) as cnt'))
            ->groupBy('idUser')
            ->havingRaw('COUNT(*) > 1')
            ->get()
            ->count();

        return [
            'sanciones_activas'    => $totalActivas,
            'sanciones_historicas' => $totalHistoricas,
            'usuarios_reincidentes' => $reincidentes,
        ];
    }
}
