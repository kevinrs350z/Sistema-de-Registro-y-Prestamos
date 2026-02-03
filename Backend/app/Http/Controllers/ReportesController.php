<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Carbon\Carbon;

class ReportesController extends Controller
{
    /**
     * Normalizar parámetro de granularidad.
     */
    private function normalizeGranularity(?string $granularity): string
    {
        $allowed = ['day', 'week', 'month', 'quarter', 'semester', 'year'];
        return in_array($granularity, $allowed) ? $granularity : 'month';
    }

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
        $granularity = $this->normalizeGranularity($request->input('granularity'));
        
        $service = app(\App\Services\Reportes\ReportesInventarioService::class);
        $data = $service->topUtilizados($inicio, $fin, 10);
        
        return response()->json([
            'data' => $data,
            'meta' => [
                'fechaInicio' => $inicio,
                'fechaFin' => $fin,
                'granularity' => $granularity
            ]
        ]);
    }

    /**
     * Reporte: Préstamos por período con granularidad.
     */
    public function prestamosPorPeriodo(Request $request)
    {
        $user = $request->user();
        if (!$user->hasRole('ADMIN')) {
            return response()->json(['error' => 'No tienes permisos para ver reportes.'], 403);
        }
        
        $inicio = $request->input('fechaInicio');
        $fin = $request->input('fechaFin');
        $granularity = $this->normalizeGranularity($request->input('granularity'));
        
        $service = app(\App\Services\Reportes\ReportesTendenciasService::class);
        $data = $service->prestamosPorPeriodo($inicio, $fin, $granularity);
        
        return response()->json([
            'data' => $data,
            'meta' => [
                'fechaInicio' => $inicio,
                'fechaFin' => $fin,
                'granularity' => $granularity
            ]
        ]);
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
        $service = app(\App\Services\Reportes\ReportesTendenciasService::class);
        $data = $service->usoInternoExterno($inicio, $fin);
        
        return response()->json([
            'data' => $data,
            'meta' => [
                'fechaInicio' => $inicio,
                'fechaFin' => $fin
            ]
        ]);
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
        
        // Calcular fechas por defecto si no se proporcionan
        $start = $inicio ? Carbon::parse($inicio)->startOfDay() : Carbon::now()->subMonths(12)->startOfMonth();
        $end = $fin ? Carbon::parse($fin)->endOfDay() : Carbon::now()->endOfDay();
        
        // Contar sanciones aplicadas en el rango
        $sanciones = DB::table('user_sancion')
            ->whereBetween('created_at', [$start, $end])
            ->count();
        
        // Contar préstamos rechazados en el rango
        $rechazos = DB::table('prestamos')
            ->whereRaw('UPPER(estado) = ?', ['RECHAZADO'])
            ->whereBetween('created_at', [$start, $end])
            ->count();
            
        return response()->json([
            'data' => [
                "total_sanciones" => $sanciones,
                "total_rechazos" => $rechazos
            ],
            'meta' => [
                'fechaInicio' => $start->toDateString(),
                'fechaFin' => $end->toDateString()
            ]
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
        
        // Calcular fechas por defecto
        $start = $inicio ? Carbon::parse($inicio)->startOfDay() : Carbon::now()->subMonths(12)->startOfMonth();
        $end = $fin ? Carbon::parse($fin)->endOfDay() : Carbon::now()->endOfDay();
        
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
            ->where('e.estado', 'BAJA')
            ->whereBetween('e.created_at', [$start, $end])
            ->orderBy('e.created_at', 'desc') 
            ->get();
            
        return response()->json([
            'data' => $data,
            'meta' => [
                'fechaInicio' => $start->toDateString(),
                'fechaFin' => $end->toDateString()
            ]
        ]);
    }

    /**
     * Categorías más demandadas.
     */
    public function categoriasMasDemandadas(Request $request)
    {
        $user = $request->user();
        if (!$user->hasRole('ADMIN')) {
            return response()->json(['error' => 'No tienes permisos para ver reportes.'], 403);
        }
        
        $inicio = $request->input('fechaInicio');
        $fin = $request->input('fechaFin');
        
        $service = app(\App\Services\Reportes\ReportesTendenciasService::class);
        $data = $service->categoriasMasDemandadas($inicio, $fin);
        
        return response()->json([
            'data' => $data,
            'meta' => [
                'fechaInicio' => $inicio,
                'fechaFin' => $fin
            ]
        ]);
    }
}
