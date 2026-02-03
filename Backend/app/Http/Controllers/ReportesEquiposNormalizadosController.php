<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Services\Reportes\ReportesEquiposNormalizadosService;

/**
 * Controlador para reportes de equipos con métricas normalizadas.
 * 
 * API Endpoints:
 * 
 * GET /api/reportes/equipos-normalizados/kpis
 *   - Params: ?from=YYYY-MM-DD&to=YYYY-MM-DD&uso=interno|externo|ambos
 *   - Returns: KPIs generales de equipos con filtros aplicados
 * 
 * GET /api/reportes/equipos-normalizados/lista
 *   - Params: ?from=YYYY-MM-DD&to=YYYY-MM-DD&uso=interno|externo|ambos&limit=20
 *   - Returns: Lista de equipos con métricas normalizadas (evita sesgo por antigüedad)
 * 
 * GET /api/reportes/equipos-normalizados/top-por-mes
 *   - Params: ?from=YYYY-MM-DD&to=YYYY-MM-DD&uso=interno|externo|ambos&limit=10
 *   - Returns: Top equipos ordenados por préstamos/mes activo
 * 
 * GET /api/reportes/equipos-normalizados/evolucion
 *   - Params: ?from=YYYY-MM-DD&to=YYYY-MM-DD&uso=interno|externo|ambos&granularity=month
 *   - Returns: Evolución de utilización en el tiempo (12 meses completos)
 * 
 * GET /api/reportes/equipos-normalizados/categorias
 *   - Params: ?from=YYYY-MM-DD&to=YYYY-MM-DD&uso=interno|externo|ambos
 *   - Returns: Métricas agregadas por categoría
 * 
 * GET /api/reportes/equipos-normalizados/comparacion-antiguedad
 *   - Params: ?from=YYYY-MM-DD&to=YYYY-MM-DD&uso=interno|externo|ambos
 *   - Returns: Comparación de rendimiento: equipos antiguos vs nuevos
 */
class ReportesEquiposNormalizadosController extends Controller
{
    protected ReportesEquiposNormalizadosService $service;

    public function __construct(ReportesEquiposNormalizadosService $service)
    {
        $this->service = $service;
    }

    /**
     * Verificar permisos de admin
     */
    private function checkAdminRole(Request $request)
    {
        $user = $request->user();
        if (!$user || !$user->hasRole('ADMIN')) {
            return response()->json([
                'error' => 'No tienes permisos para ver reportes de equipos.'
            ], 403);
        }
        return null;
    }

    /**
     * GET /api/reportes/equipos-normalizados/kpis
     * 
     * KPIs generales de equipos con filtros BI.
     * 
     * @param Request $request
     *   - from: Fecha inicio (YYYY-MM-DD)
     *   - to: Fecha fin (YYYY-MM-DD)
     *   - uso: interno | externo | ambos
     * 
     * @return \Illuminate\Http\JsonResponse
     */
    public function kpis(Request $request)
    {
        if ($error = $this->checkAdminRole($request)) return $error;
        
        $data = $this->service->getKPIs($request);
        return response()->json($data);
    }

    /**
     * GET /api/reportes/equipos-normalizados/lista
     * 
     * Lista de equipos con métricas normalizadas.
     * Evita sesgo por antigüedad mostrando préstamos/mes y % utilización.
     * 
     * @param Request $request
     *   - from: Fecha inicio (YYYY-MM-DD)
     *   - to: Fecha fin (YYYY-MM-DD)
     *   - uso: interno | externo | ambos
     *   - limit: Límite de resultados (default: 20)
     * 
     * @return \Illuminate\Http\JsonResponse
     */
    public function lista(Request $request)
    {
        if ($error = $this->checkAdminRole($request)) return $error;
        
        $limit = $request->input('limit', 20);
        $data = $this->service->getEquiposNormalizados($request, $limit);
        return response()->json($data);
    }

    /**
     * GET /api/reportes/equipos-normalizados/top-por-mes
     * 
     * Top equipos ordenados por préstamos por mes activo.
     * Comparación justa entre equipos nuevos y antiguos.
     * 
     * @param Request $request
     *   - from: Fecha inicio (YYYY-MM-DD)
     *   - to: Fecha fin (YYYY-MM-DD)
     *   - uso: interno | externo | ambos
     *   - limit: Límite de resultados (default: 10)
     * 
     * @return \Illuminate\Http\JsonResponse
     */
    public function topPorMes(Request $request)
    {
        if ($error = $this->checkAdminRole($request)) return $error;
        
        $limit = $request->input('limit', 10);
        $data = $this->service->getTopEquiposPorMesActivo($request, $limit);
        return response()->json($data);
    }

    /**
     * GET /api/reportes/equipos-normalizados/evolucion
     * 
     * Evolución de utilización de equipos en el tiempo.
     * Retorna 12 meses completos incluyendo períodos con cero préstamos.
     * 
     * @param Request $request
     *   - from: Fecha inicio (YYYY-MM-DD)
     *   - to: Fecha fin (YYYY-MM-DD)
     *   - uso: interno | externo | ambos
     *   - granularity: day | week | month
     * 
     * @return \Illuminate\Http\JsonResponse
     */
    public function evolucion(Request $request)
    {
        if ($error = $this->checkAdminRole($request)) return $error;
        
        $data = $this->service->getEvolucionUtilizacion($request);
        return response()->json($data);
    }

    /**
     * GET /api/reportes/equipos-normalizados/categorias
     * 
     * Métricas agregadas por categoría de equipo.
     * 
     * @param Request $request
     *   - from: Fecha inicio (YYYY-MM-DD)
     *   - to: Fecha fin (YYYY-MM-DD)
     *   - uso: interno | externo | ambos
     * 
     * @return \Illuminate\Http\JsonResponse
     */
    public function categorias(Request $request)
    {
        if ($error = $this->checkAdminRole($request)) return $error;
        
        $data = $this->service->getMetricasPorCategoria($request);
        return response()->json($data);
    }

    /**
     * GET /api/reportes/equipos-normalizados/comparacion-antiguedad
     * 
     * Compara rendimiento entre equipos antiguos (>12 meses) y nuevos (<=12 meses).
     * Útil para análisis de ciclo de vida de equipos.
     * 
     * @param Request $request
     *   - from: Fecha inicio (YYYY-MM-DD)
     *   - to: Fecha fin (YYYY-MM-DD)
     *   - uso: interno | externo | ambos
     * 
     * @return \Illuminate\Http\JsonResponse
     */
    public function comparacionAntiguedad(Request $request)
    {
        if ($error = $this->checkAdminRole($request)) return $error;
        
        $data = $this->service->getComparacionAntiguedad($request);
        return response()->json($data);
    }
}
