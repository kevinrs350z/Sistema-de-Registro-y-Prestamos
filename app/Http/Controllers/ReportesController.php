<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class ReportesController extends Controller
{
    /**
     * Reporte: Equipos más solicitados.
     *
     * Devuelve el nombre del tipo de equipo y cuántas veces ha sido solicitado.
     */
    public function equiposMasSolicitados()
    {
        $data = DB::table('prestamo_equipo as pe')
            ->join('equipos as e', 'pe.idEquipo', '=', 'e.id')
            ->join('tipo_equipos as t', 'e.tipo_equipo_id', '=', 't.id')
            ->select(
                't.nombre as equipo',
                DB::raw('COUNT(*) as total_solicitudes')
            )
            ->groupBy('t.nombre')
            ->orderByDesc('total_solicitudes')
            ->limit(10) // opcional: mostrar solo los 10 equipos más usados
            ->get();

        return response()->json($data);
    }
}
