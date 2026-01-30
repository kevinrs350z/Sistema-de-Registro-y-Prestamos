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
    public function equiposMasSolicitados(Request $request)
    {
        $user = $request->user();
        if (!$user->hasRole('ADMIN')) {
            return response()->json([
                'error' => 'No tienes permisos para ver reportes.'
            ], 403);
        }
        $inicio = $request->input('fechaInicio');
        $fin = $request->input('fechaFin');
        $periodo = $request->input('periodo');
        $service = app(\App\Services\Reportes\ReportesInventarioService::class);
        $data = $service->topUtilizados($inicio, $fin, 10);
        return response()->json($data);
    }

    public function usoInternoExterno(Request $request)
    {
        $user = $request->user();
        if (!$user->hasRole('ADMIN')) {
            return response()->json([
                'error' => 'No tienes permisos para ver reportes.'
            ], 403);
        }
        $inicio = $request->input('fechaInicio');
        $fin = $request->input('fechaFin');
        $periodo = $request->input('periodo');
        $service = app(\App\Services\Reportes\ReportesTendenciasService::class);
        $data = $service->usoPorTipoUsuario($inicio, $fin);
        return response()->json($data);
    }

    public function sancionesYRechazos(Request $request)
    {
        $user = $request->user();
        if (!$user->hasRole('ADMIN')) {
            return response()->json([
                'error' => 'No tienes permisos para ver reportes.'
            ], 403);
        }
        $inicio = $request->input('fechaInicio');
        $fin = $request->input('fechaFin');
        $periodo = $request->input('periodo');
        $service = app(\App\Services\Reportes\ReportesSancionesService::class);
        $sanciones = $service->motivosFrecuentes($inicio, $fin);
        $rechazos = DB::table('prestamos')
            ->whereRaw('LOWER(estado) = ?', ['rechazado'])
            ->whereBetween('created_at', [$inicio, $fin])
            ->count();
        return response()->json([
            "total_sanciones" => $sanciones,
            "total_rechazos" => $rechazos
        ]);
    }

    public function equiposDadoDeBaja(Request $request)
    {
        $user = $request->user();
        if (!$user->hasRole('ADMIN')) {
            return response()->json([
                'error' => 'No tienes permisos para ver reportes.'
            ], 403);
        }
        $inicio = $request->input('fechaInicio');
        $fin = $request->input('fechaFin');
        $periodo = $request->input('periodo');
        $service = app(\App\Services\Reportes\ReportesInventarioService::class);
        $data = DB::table('equipos as e')
            ->join('tipo_equipos as t', 'e.tipo_equipo_id', '=', 't.id')
            ->select(
                'e.id',
                'e.codigo',
                'e.estado',
                'e.created_at',
                't.nombre as tipo',
                't.descripcion as descripcion_tipo'
            )
            ->where('e.estado', 'baja')
            ->whereBetween('e.created_at', [$inicio, $fin])
            ->orderBy('e.created_at', 'desc') 
            ->get();
        return response()->json($data);
    }


}
