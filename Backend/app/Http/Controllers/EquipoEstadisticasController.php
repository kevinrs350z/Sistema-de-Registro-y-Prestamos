<?php

namespace App\Http\Controllers;

use App\Services\EquipoEstadisticasService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

/**
 * Controlador para estadísticas y reportes de fallas/mantenimientos.
 * 
 * Endpoints para dashboard:
 * - GET /estadisticas/mantenimientos - Mantenimientos por tipo y falla
 * - GET /estadisticas/top-modelos-fallas - Top modelos con más fallas
 * - GET /estadisticas/downtime - Tiempo fuera de servicio por modelo
 * - GET /estadisticas/fallas-frecuentes - Fallas más frecuentes
 * - GET /estadisticas/evolucion-mantenimientos - Evolución mensual
 * - GET /estadisticas/equipos-mantenimiento - Equipos actualmente en mantenimiento
 * - GET /estadisticas/resumen-estados - Resumen de estados del inventario
 */
class EquipoEstadisticasController extends Controller
{
    private EquipoEstadisticasService $estadisticasService;

    public function __construct(EquipoEstadisticasService $estadisticasService)
    {
        $this->estadisticasService = $estadisticasService;
    }

    /**
     * Mantenimientos agrupados por tipo de equipo y tipo de falla.
     * 
     * GET /api/estadisticas/mantenimientos
     * 
     * Query params:
     * - desde: string (Y-m-d)
     * - hasta: string (Y-m-d)
     *
     * @param Request $request
     * @return JsonResponse
     */
    public function mantenimientosPorTipoYFalla(Request $request): JsonResponse
    {
        try {
            $desde = $request->input('desde');
            $hasta = $request->input('hasta');

            $datos = $this->estadisticasService->mantenimientosPorTipoYFalla($desde, $hasta);

            // Agrupar por tipo de equipo para mejor visualización
            $agrupados = $datos->groupBy('tipo_equipo_id')->map(function ($items, $tipoEquipoId) {
                $primer = $items->first();
                return [
                    'tipo_equipo_id' => $tipoEquipoId,
                    'tipo_equipo' => $primer->tipo_equipo,
                    'categoria' => $primer->categoria,
                    'total_mantenimientos' => $items->sum('total_mantenimientos'),
                    'fallas' => $items->map(function ($item) {
                        return [
                            'tipo_falla_id' => $item->tipo_falla_id,
                            'codigo' => $item->falla_codigo,
                            'nombre' => $item->falla_nombre,
                            'categoria' => $item->falla_categoria,
                            'total' => $item->total_mantenimientos,
                        ];
                    })->values(),
                ];
            })->values();

            return response()->json([
                'datos' => $agrupados,
                'filtros' => [
                    'desde' => $desde,
                    'hasta' => $hasta,
                ],
                'total_mantenimientos' => $datos->sum('total_mantenimientos'),
            ], 200);

        } catch (\Exception $e) {
            return response()->json([
                'error' => 'Error al obtener estadísticas de mantenimientos.',
                'message' => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Top modelos (tipos de equipo) con más fallas.
     * 
     * GET /api/estadisticas/top-modelos-fallas
     * 
     * Query params:
     * - limite: int (default 10)
     * - desde: string (Y-m-d)
     * - hasta: string (Y-m-d)
     * - anio: int (para filtrar por mes específico)
     * - mes: int (requiere anio)
     *
     * @param Request $request
     * @return JsonResponse
     */
    public function topModelosConFallas(Request $request): JsonResponse
    {
        try {
            $limite = min($request->input('limite', 10), 50);
            $desde = $request->input('desde');
            $hasta = $request->input('hasta');
            $anio = $request->input('anio');
            $mes = $request->input('mes');

            // Si se especifica año y mes, usar la función por mes
            if ($anio && $mes) {
                $datos = $this->estadisticasService->topModelosPorMes(
                    (int) $anio,
                    (int) $mes,
                    $limite
                );
            } else {
                $datos = $this->estadisticasService->topModelosConFallas($limite, $desde, $hasta);
            }

            return response()->json([
                'datos' => $datos,
                'filtros' => [
                    'limite' => $limite,
                    'desde' => $desde,
                    'hasta' => $hasta,
                    'anio' => $anio,
                    'mes' => $mes,
                ],
            ], 200);

        } catch (\Exception $e) {
            return response()->json([
                'error' => 'Error al obtener top modelos con fallas.',
                'message' => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Tiempo fuera de servicio (downtime) por modelo.
     * 
     * GET /api/estadisticas/downtime
     * 
     * Query params:
     * - desde: string (Y-m-d)
     * - hasta: string (Y-m-d)
     *
     * @param Request $request
     * @return JsonResponse
     */
    public function downtimePorModelo(Request $request): JsonResponse
    {
        try {
            $desde = $request->input('desde');
            $hasta = $request->input('hasta');

            $datos = $this->estadisticasService->downtimePorModelo($desde, $hasta);

            // Calcular totales
            $totalHoras = $datos->sum('total_horas_downtime');
            $totalIncidentes = $datos->sum('total_incidentes');

            return response()->json([
                'datos' => $datos,
                'resumen' => [
                    'total_horas_downtime' => $totalHoras,
                    'total_dias_downtime' => round($totalHoras / 24, 2),
                    'total_incidentes' => $totalIncidentes,
                    'promedio_horas_por_incidente' => $totalIncidentes > 0 
                        ? round($totalHoras / $totalIncidentes, 2) 
                        : 0,
                    'modelos_afectados' => $datos->count(),
                ],
                'filtros' => [
                    'desde' => $desde,
                    'hasta' => $hasta,
                ],
            ], 200);

        } catch (\Exception $e) {
            return response()->json([
                'error' => 'Error al obtener estadísticas de downtime.',
                'message' => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Fallas más frecuentes.
     * 
     * GET /api/estadisticas/fallas-frecuentes
     * 
     * Query params:
     * - limite: int (default 10)
     * - desde: string (Y-m-d)
     * - hasta: string (Y-m-d)
     *
     * @param Request $request
     * @return JsonResponse
     */
    public function fallasFrecuentes(Request $request): JsonResponse
    {
        try {
            $limite = min($request->input('limite', 10), 50);
            $desde = $request->input('desde');
            $hasta = $request->input('hasta');

            $datos = $this->estadisticasService->fallasmasFrecuentes($limite, $desde, $hasta);

            return response()->json([
                'datos' => $datos,
                'filtros' => [
                    'limite' => $limite,
                    'desde' => $desde,
                    'hasta' => $hasta,
                ],
            ], 200);

        } catch (\Exception $e) {
            return response()->json([
                'error' => 'Error al obtener fallas frecuentes.',
                'message' => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Evolución mensual de mantenimientos.
     * 
     * GET /api/estadisticas/evolucion-mantenimientos
     * 
     * Query params:
     * - meses: int (default 12)
     *
     * @param Request $request
     * @return JsonResponse
     */
    public function evolucionMantenimientos(Request $request): JsonResponse
    {
        try {
            $meses = min($request->input('meses', 12), 36);

            $datos = $this->estadisticasService->evolucionMensualMantenimientos($meses);

            return response()->json([
                'datos' => $datos,
                'total_periodo' => $datos->sum('total'),
                'promedio_mensual' => $datos->count() > 0 
                    ? round($datos->sum('total') / $datos->count(), 2) 
                    : 0,
            ], 200);

        } catch (\Exception $e) {
            return response()->json([
                'error' => 'Error al obtener evolución de mantenimientos.',
                'message' => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Equipos actualmente en mantenimiento.
     * 
     * GET /api/estadisticas/equipos-mantenimiento
     *
     * @return JsonResponse
     */
    public function equiposEnMantenimiento(): JsonResponse
    {
        try {
            $datos = $this->estadisticasService->equiposEnMantenimiento();

            return response()->json([
                'equipos' => $datos,
                'total' => $datos->count(),
            ], 200);

        } catch (\Exception $e) {
            return response()->json([
                'error' => 'Error al obtener equipos en mantenimiento.',
                'message' => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Resumen de estados del inventario.
     * 
     * GET /api/estadisticas/resumen-estados
     *
     * @return JsonResponse
     */
    public function resumenEstados(): JsonResponse
    {
        try {
            $datos = $this->estadisticasService->resumenEstadosInventario();

            $total = $datos->sum();

            return response()->json([
                'estados' => $datos,
                'total_equipos' => $total,
                'porcentajes' => $datos->map(function ($count) use ($total) {
                    return $total > 0 ? round(($count / $total) * 100, 2) : 0;
                }),
            ], 200);

        } catch (\Exception $e) {
            return response()->json([
                'error' => 'Error al obtener resumen de estados.',
                'message' => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Dashboard completo de estadísticas de mantenimiento.
     * 
     * GET /api/estadisticas/dashboard
     * 
     * Retorna un resumen consolidado para el dashboard.
     *
     * @param Request $request
     * @return JsonResponse
     */
    public function dashboard(Request $request): JsonResponse
    {
        try {
            $desde = $request->input('desde');
            $hasta = $request->input('hasta');

            return response()->json([
                'resumen_estados' => $this->estadisticasService->resumenEstadosInventario(),
                'equipos_en_mantenimiento' => $this->estadisticasService->equiposEnMantenimiento()->count(),
                'top_modelos_fallas' => $this->estadisticasService->topModelosConFallas(5, $desde, $hasta),
                'fallas_frecuentes' => $this->estadisticasService->fallasmasFrecuentes(5, $desde, $hasta),
                'evolucion_mensual' => $this->estadisticasService->evolucionMensualMantenimientos(6),
            ], 200);

        } catch (\Exception $e) {
            return response()->json([
                'error' => 'Error al obtener dashboard de estadísticas.',
                'message' => $e->getMessage(),
            ], 500);
        }
    }
}
