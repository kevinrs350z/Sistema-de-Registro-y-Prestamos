<?php

namespace App\Http\Controllers\Reportes;

use App\Http\Controllers\Controller;
use App\Services\Reportes\EstadisticasModeloService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

/**
 * Controlador del Dashboard de Estadísticas por MODELO (tipo_equipo).
 * 
 * Proporciona endpoints para:
 * - Resumen ejecutivo (KPIs globales)
 * - Ranking de modelos por score de compra
 * - Saturación y uso normalizado
 * - Demanda insatisfecha
 * - Mantenimiento y fallas
 * - Rankings por marca
 * 
 * Todos los endpoints aceptan filtros de fecha (desde/hasta) y
 * opcionalmente filtrar por tipo_equipo_id específico.
 * 
 * @package App\Http\Controllers\Reportes
 */
class DashboardModelosController extends Controller
{
    private EstadisticasModeloService $service;

    public function __construct(EstadisticasModeloService $service)
    {
        $this->service = $service;
    }

    // =========================================================================
    // RESUMEN EJECUTIVO
    // =========================================================================

    /**
     * Obtiene el resumen ejecutivo con KPIs globales.
     * 
     * GET /api/estadisticas-modelos/resumen
     * 
     * Query params:
     * - desde: string (Y-m-d) - default 12 meses atrás
     * - hasta: string (Y-m-d) - default hoy
     *
     * @param Request $request
     * @return JsonResponse
     */
    public function resumenEjecutivo(Request $request): JsonResponse
    {
        try {
            $desde = $request->input('desde');
            $hasta = $request->input('hasta');

            $resumen = $this->service->resumenEjecutivo($desde, $hasta);

            return response()->json($resumen, 200);

        } catch (\Exception $e) {
            return response()->json([
                'error' => 'Error al obtener resumen ejecutivo.',
                'message' => $e->getMessage(),
            ], 500);
        }
    }

    // =========================================================================
    // RANKING Y SCORE DE COMPRA
    // =========================================================================

    /**
     * Obtiene el ranking de modelos por score de prioridad de compra.
     * 
     * GET /api/estadisticas-modelos/ranking
     * 
     * Query params:
     * - desde: string (Y-m-d)
     * - hasta: string (Y-m-d)
     * - recomendacion: string (COMPRAR|MONITOREAR|NO_COMPRAR) - filtrar por recomendación
     * - limite: int - máximo de resultados
     *
     * @param Request $request
     * @return JsonResponse
     */
    public function rankingModelos(Request $request): JsonResponse
    {
        try {
            $desde = $request->input('desde');
            $hasta = $request->input('hasta');
            $recomendacion = $request->input('recomendacion');
            $limite = $request->input('limite', 50);

            $ranking = $this->service->scorePrioridadCompra($desde, $hasta);

            // Filtrar por recomendación si se especifica
            if ($recomendacion) {
                $ranking = $ranking->where('recomendacion', strtoupper($recomendacion));
            }

            // Limitar resultados
            $ranking = $ranking->take($limite)->values();

            return response()->json([
                'ranking' => $ranking,
                'total' => $ranking->count(),
                'filtros' => [
                    'desde' => $desde,
                    'hasta' => $hasta,
                    'recomendacion' => $recomendacion,
                ],
            ], 200);

        } catch (\Exception $e) {
            return response()->json([
                'error' => 'Error al obtener ranking de modelos.',
                'message' => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Obtiene el detalle de score de un modelo específico.
     * 
     * GET /api/estadisticas-modelos/{id}/score
     *
     * @param Request $request
     * @param int $id tipo_equipo_id
     * @return JsonResponse
     */
    public function scoreModelo(Request $request, int $id): JsonResponse
    {
        try {
            $desde = $request->input('desde');
            $hasta = $request->input('hasta');

            $ranking = $this->service->scorePrioridadCompra($desde, $hasta);
            $modelo = $ranking->firstWhere('tipo_equipo_id', $id);

            if (!$modelo) {
                return response()->json([
                    'error' => 'Modelo no encontrado.',
                ], 404);
            }

            return response()->json($modelo, 200);

        } catch (\Exception $e) {
            return response()->json([
                'error' => 'Error al obtener score del modelo.',
                'message' => $e->getMessage(),
            ], 500);
        }
    }

    // =========================================================================
    // USO Y SATURACIÓN
    // =========================================================================

    /**
     * Obtiene el uso mensual normalizado por modelo.
     * 
     * GET /api/estadisticas-modelos/uso-mensual
     * 
     * Query params:
     * - tipo_equipo_id: int - filtrar por modelo específico
     * - desde: string (Y-m-d)
     * - hasta: string (Y-m-d)
     *
     * @param Request $request
     * @return JsonResponse
     */
    public function usoMensual(Request $request): JsonResponse
    {
        try {
            $tipoEquipoId = $request->input('tipo_equipo_id');
            $desde = $request->input('desde');
            $hasta = $request->input('hasta');

            $uso = $this->service->usoMensualPorModelo(
                $tipoEquipoId ? (int) $tipoEquipoId : null,
                $desde,
                $hasta
            );

            // Agrupar por modelo para mejor visualización
            $agrupado = $uso->groupBy('tipo_equipo_id')->map(function ($items) {
                $primero = $items->first();
                return [
                    'tipo_equipo_id' => $primero['tipo_equipo_id'],
                    'modelo' => $primero['modelo'],
                    'marca' => $primero['marca'],
                    'categoria' => $primero['categoria'],
                    'total_equipos' => $primero['total_equipos'],
                    'uso_promedio' => round($items->avg('uso_normalizado'), 4),
                    'uso_promedio_porcentaje' => round($items->avg('uso_porcentaje'), 2),
                    'meses' => $items->map(fn($m) => [
                        'mes' => $m['mes'],
                        'dias_prestados' => $m['dias_prestados'],
                        'uso_porcentaje' => $m['uso_porcentaje'],
                    ])->values(),
                ];
            })->values();

            return response()->json([
                'modelos' => $agrupado,
                'total_modelos' => $agrupado->count(),
                'filtros' => [
                    'tipo_equipo_id' => $tipoEquipoId,
                    'desde' => $desde,
                    'hasta' => $hasta,
                ],
            ], 200);

        } catch (\Exception $e) {
            return response()->json([
                'error' => 'Error al obtener uso mensual.',
                'message' => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Obtiene los percentiles de uso (P50, P75, P90) por modelo.
     * 
     * GET /api/estadisticas-modelos/percentiles
     *
     * @param Request $request
     * @return JsonResponse
     */
    public function percentiles(Request $request): JsonResponse
    {
        try {
            $tipoEquipoId = $request->input('tipo_equipo_id');
            $desde = $request->input('desde');
            $hasta = $request->input('hasta');

            $percentiles = $this->service->percentilesPorModelo(
                $tipoEquipoId ? (int) $tipoEquipoId : null,
                $desde,
                $hasta
            );

            return response()->json([
                'modelos' => $percentiles,
                'total' => $percentiles->count(),
                'filtros' => [
                    'tipo_equipo_id' => $tipoEquipoId,
                    'desde' => $desde,
                    'hasta' => $hasta,
                ],
            ], 200);

        } catch (\Exception $e) {
            return response()->json([
                'error' => 'Error al obtener percentiles.',
                'message' => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Obtiene la tendencia del P75 mensual por modelo.
     * 
     * GET /api/estadisticas-modelos/tendencia-p75
     *
     * @param Request $request
     * @return JsonResponse
     */
    public function tendenciaP75(Request $request): JsonResponse
    {
        try {
            $tipoEquipoId = $request->input('tipo_equipo_id');
            $meses = $request->input('meses', 12);

            $tendencia = $this->service->tendenciaP75PorModelo(
                $tipoEquipoId ? (int) $tipoEquipoId : null,
                min(36, max(3, (int) $meses))
            );

            return response()->json([
                'modelos' => $tendencia,
                'total' => $tendencia->count(),
                'filtros' => [
                    'tipo_equipo_id' => $tipoEquipoId,
                    'meses' => $meses,
                ],
            ], 200);

        } catch (\Exception $e) {
            return response()->json([
                'error' => 'Error al obtener tendencia P75.',
                'message' => $e->getMessage(),
            ], 500);
        }
    }

    // =========================================================================
    // DEMANDA INSATISFECHA
    // =========================================================================

    /**
     * Obtiene los rechazos por falta de stock por modelo.
     * 
     * GET /api/estadisticas-modelos/demanda-insatisfecha
     *
     * @param Request $request
     * @return JsonResponse
     */
    public function demandaInsatisfecha(Request $request): JsonResponse
    {
        try {
            $tipoEquipoId = $request->input('tipo_equipo_id');
            $desde = $request->input('desde');
            $hasta = $request->input('hasta');

            $rechazos = $this->service->rechazosStockPorModelo(
                $tipoEquipoId ? (int) $tipoEquipoId : null,
                $desde,
                $hasta
            );

            // Agrupar por modelo
            $agrupado = $rechazos->groupBy('tipo_equipo_id')->map(function ($items) {
                $primero = $items->first();
                return [
                    'tipo_equipo_id' => $primero['tipo_equipo_id'],
                    'modelo' => $primero['modelo'],
                    'marca' => $primero['marca'],
                    'categoria' => $primero['categoria'],
                    'total_solicitudes' => $items->sum('total_solicitudes'),
                    'rechazos_stock' => $items->sum('rechazos_stock'),
                    'rechazos_otros' => $items->sum('rechazos_otros'),
                    'tasa_rechazo_stock_promedio' => round($items->avg('tasa_rechazo_stock'), 4),
                    'tasa_rechazo_porcentaje' => round($items->avg('tasa_rechazo_stock_porcentaje'), 2),
                    'desglose_motivos' => $items->reduce(function ($carry, $item) {
                        foreach ($item['desglose_motivos'] ?? [] as $motivo => $cantidad) {
                            $carry[$motivo] = ($carry[$motivo] ?? 0) + $cantidad;
                        }
                        return $carry;
                    }, []),
                    'meses' => $items->map(fn($m) => [
                        'mes' => $m['mes'],
                        'rechazos_stock' => $m['rechazos_stock'],
                        'total_solicitudes' => $m['total_solicitudes'],
                        'tasa_porcentaje' => $m['tasa_rechazo_stock_porcentaje'],
                    ])->values(),
                ];
            })->sortByDesc('rechazos_stock')->values();

            return response()->json([
                'modelos' => $agrupado,
                'total' => $agrupado->count(),
                'resumen' => [
                    'total_rechazos_stock' => $agrupado->sum('rechazos_stock'),
                    'total_rechazos_otros' => $agrupado->sum('rechazos_otros'),
                    'total_solicitudes' => $agrupado->sum('total_solicitudes'),
                    'desglose_global' => $agrupado->reduce(function ($carry, $item) {
                        foreach ($item['desglose_motivos'] ?? [] as $motivo => $cantidad) {
                            $carry[$motivo] = ($carry[$motivo] ?? 0) + $cantidad;
                        }
                        return $carry;
                    }, []),
                ],
                'filtros' => [
                    'tipo_equipo_id' => $tipoEquipoId,
                    'desde' => $desde,
                    'hasta' => $hasta,
                ],
            ], 200);

        } catch (\Exception $e) {
            return response()->json([
                'error' => 'Error al obtener demanda insatisfecha.',
                'message' => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Obtiene el tiempo de espera promedio por modelo.
     * 
     * GET /api/estadisticas-modelos/tiempo-espera
     *
     * @param Request $request
     * @return JsonResponse
     */
    public function tiempoEspera(Request $request): JsonResponse
    {
        try {
            $tipoEquipoId = $request->input('tipo_equipo_id');
            $desde = $request->input('desde');
            $hasta = $request->input('hasta');

            $tiempos = $this->service->tiempoEsperaPorModelo(
                $tipoEquipoId ? (int) $tipoEquipoId : null,
                $desde,
                $hasta
            );

            return response()->json([
                'modelos' => $tiempos,
                'total' => $tiempos->count(),
                'filtros' => [
                    'tipo_equipo_id' => $tipoEquipoId,
                    'desde' => $desde,
                    'hasta' => $hasta,
                ],
            ], 200);

        } catch (\Exception $e) {
            return response()->json([
                'error' => 'Error al obtener tiempos de espera.',
                'message' => $e->getMessage(),
            ], 500);
        }
    }

    // =========================================================================
    // MANTENIMIENTO Y FALLAS
    // =========================================================================

    /**
     * Obtiene mantenimientos por modelo y tipo de falla.
     * 
     * GET /api/estadisticas-modelos/mantenimientos
     *
     * @param Request $request
     * @return JsonResponse
     */
    public function mantenimientos(Request $request): JsonResponse
    {
        try {
            $tipoEquipoId = $request->input('tipo_equipo_id');
            $desde = $request->input('desde');
            $hasta = $request->input('hasta');

            $mantenimientos = $this->service->mantenimientosPorModeloYFalla(
                $tipoEquipoId ? (int) $tipoEquipoId : null,
                $desde,
                $hasta
            );

            // Agrupar por modelo
            $agrupado = $mantenimientos->groupBy('tipo_equipo_id')->map(function ($items) {
                $primero = $items->first();
                return [
                    'tipo_equipo_id' => $primero->tipo_equipo_id,
                    'modelo' => $primero->modelo,
                    'marca' => $primero->marca,
                    'categoria' => $primero->categoria,
                    'total_incidentes' => $items->sum('total_incidentes'),
                    'fallas' => $items->groupBy('tipo_falla_id')->map(function ($fallaItems) {
                        $f = $fallaItems->first();
                        return [
                            'tipo_falla_id' => $f->tipo_falla_id,
                            'codigo' => $f->falla_codigo,
                            'nombre' => $f->falla_nombre,
                            'categoria' => $f->falla_categoria,
                            'total' => $fallaItems->sum('total_incidentes'),
                        ];
                    })->values(),
                ];
            })->sortByDesc('total_incidentes')->values();

            return response()->json([
                'modelos' => $agrupado,
                'total' => $agrupado->count(),
                'total_incidentes' => $mantenimientos->sum('total_incidentes'),
                'filtros' => [
                    'tipo_equipo_id' => $tipoEquipoId,
                    'desde' => $desde,
                    'hasta' => $hasta,
                ],
            ], 200);

        } catch (\Exception $e) {
            return response()->json([
                'error' => 'Error al obtener mantenimientos.',
                'message' => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Obtiene el downtime por modelo.
     * 
     * GET /api/estadisticas-modelos/downtime
     *
     * @param Request $request
     * @return JsonResponse
     */
    public function downtime(Request $request): JsonResponse
    {
        try {
            $tipoEquipoId = $request->input('tipo_equipo_id');
            $desde = $request->input('desde');
            $hasta = $request->input('hasta');

            $downtime = $this->service->downtimePorModelo(
                $tipoEquipoId ? (int) $tipoEquipoId : null,
                $desde,
                $hasta
            );

            return response()->json([
                'modelos' => $downtime,
                'total' => $downtime->count(),
                'resumen' => [
                    'total_horas' => $downtime->sum('total_horas'),
                    'total_dias' => round($downtime->sum('total_horas') / 24, 2),
                    'total_incidentes' => $downtime->sum('total_incidentes'),
                ],
                'filtros' => [
                    'tipo_equipo_id' => $tipoEquipoId,
                    'desde' => $desde,
                    'hasta' => $hasta,
                ],
            ], 200);

        } catch (\Exception $e) {
            return response()->json([
                'error' => 'Error al obtener downtime.',
                'message' => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Obtiene la tasa de incidentes por exposición.
     * 
     * GET /api/estadisticas-modelos/incidentes
     *
     * @param Request $request
     * @return JsonResponse
     */
    public function incidentes(Request $request): JsonResponse
    {
        try {
            $tipoEquipoId = $request->input('tipo_equipo_id');
            $desde = $request->input('desde');
            $hasta = $request->input('hasta');

            $incidentes = $this->service->incidentesPorExposicion(
                $tipoEquipoId ? (int) $tipoEquipoId : null,
                $desde,
                $hasta
            );

            return response()->json([
                'modelos' => $incidentes->sortByDesc('incidentes_por_1000_dias')->values(),
                'total' => $incidentes->count(),
                'filtros' => [
                    'tipo_equipo_id' => $tipoEquipoId,
                    'desde' => $desde,
                    'hasta' => $hasta,
                ],
            ], 200);

        } catch (\Exception $e) {
            return response()->json([
                'error' => 'Error al obtener tasa de incidentes.',
                'message' => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Obtiene la distribución de fallas por categoría.
     * 
     * GET /api/estadisticas-modelos/fallas-categoria
     *
     * @param Request $request
     * @return JsonResponse
     */
    public function fallasCategoria(Request $request): JsonResponse
    {
        try {
            $tipoEquipoId = $request->input('tipo_equipo_id');
            $desde = $request->input('desde');
            $hasta = $request->input('hasta');

            $distribucion = $this->service->distribucionFallasPorCategoria(
                $tipoEquipoId ? (int) $tipoEquipoId : null,
                $desde,
                $hasta
            );

            $total = $distribucion->sum('total');

            return response()->json([
                'categorias' => $distribucion->map(function ($item) use ($total) {
                    $item['porcentaje'] = $total > 0 
                        ? round($item['total'] / $total * 100, 2) 
                        : 0;
                    return $item;
                }),
                'total' => $total,
                'filtros' => [
                    'tipo_equipo_id' => $tipoEquipoId,
                    'desde' => $desde,
                    'hasta' => $hasta,
                ],
            ], 200);

        } catch (\Exception $e) {
            return response()->json([
                'error' => 'Error al obtener distribución de fallas.',
                'message' => $e->getMessage(),
            ], 500);
        }
    }

    // =========================================================================
    // RANKINGS POR MARCA
    // =========================================================================

    /**
     * Obtiene el ranking de marcas.
     * 
     * GET /api/estadisticas-modelos/marcas
     *
     * @param Request $request
     * @return JsonResponse
     */
    public function rankingMarcas(Request $request): JsonResponse
    {
        try {
            $desde = $request->input('desde');
            $hasta = $request->input('hasta');

            $ranking = $this->service->rankingPorMarca($desde, $hasta);

            return response()->json([
                'marcas' => $ranking,
                'total' => $ranking->count(),
                'filtros' => [
                    'desde' => $desde,
                    'hasta' => $hasta,
                ],
            ], 200);

        } catch (\Exception $e) {
            return response()->json([
                'error' => 'Error al obtener ranking de marcas.',
                'message' => $e->getMessage(),
            ], 500);
        }
    }

    // =========================================================================
    // DATOS PARA GRÁFICOS ESPECÍFICOS
    // =========================================================================

    /**
     * Obtiene datos para boxplot de uso por modelo.
     * 
     * GET /api/estadisticas-modelos/graficos/boxplot-uso
     *
     * @param Request $request
     * @return JsonResponse
     */
    public function boxplotUso(Request $request): JsonResponse
    {
        try {
            $desde = $request->input('desde');
            $hasta = $request->input('hasta');
            $limite = $request->input('limite', 15);

            $percentiles = $this->service->percentilesPorModelo(null, $desde, $hasta);

            // Preparar datos para boxplot (top N por P75)
            $datos = $percentiles->sortByDesc('p75')
                ->take($limite)
                ->map(fn($p) => [
                    'modelo' => $p['modelo'] . ($p['marca'] ? ' (' . $p['marca'] . ')' : ''),
                    'min' => round($p['uso_minimo'] * 100, 2),
                    'p50' => round($p['p50'] * 100, 2),
                    'p75' => round($p['p75'] * 100, 2),
                    'p90' => round($p['p90'] * 100, 2),
                    'max' => round($p['uso_maximo'] * 100, 2),
                    'promedio' => round($p['promedio'] * 100, 2),
                ])
                ->values();

            return response()->json([
                'datos' => $datos,
                'eje_y' => 'Uso (%)',
                'titulo' => 'Distribución de uso por modelo',
            ], 200);

        } catch (\Exception $e) {
            return response()->json([
                'error' => 'Error al generar datos de boxplot.',
                'message' => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Obtiene datos para serie temporal del P75.
     * 
     * GET /api/estadisticas-modelos/graficos/serie-p75
     *
     * @param Request $request
     * @return JsonResponse
     */
    public function serieP75(Request $request): JsonResponse
    {
        try {
            $tipoEquipoId = $request->input('tipo_equipo_id');
            $meses = $request->input('meses', 12);

            $tendencia = $this->service->tendenciaP75PorModelo(
                $tipoEquipoId ? (int) $tipoEquipoId : null,
                min(36, max(3, (int) $meses))
            );

            // Preparar datos para gráfico de líneas
            $series = $tendencia->map(fn($t) => [
                'nombre' => $t['modelo'],
                'datos' => collect($t['tendencia'])->map(fn($p) => [
                    'x' => $p['mes'],
                    'y' => $p['p75_porcentaje'],
                ])->values(),
                'tendencia' => $t['tendencia_direccion'],
                'pendiente' => $t['pendiente'],
            ]);

            return response()->json([
                'series' => $series,
                'eje_y' => 'P75 Uso (%)',
                'titulo' => 'Tendencia de uso (P75) por modelo',
            ], 200);

        } catch (\Exception $e) {
            return response()->json([
                'error' => 'Error al generar serie P75.',
                'message' => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Obtiene tabla de recomendaciones de compra.
     * 
     * GET /api/estadisticas-modelos/recomendaciones
     *
     * @param Request $request
     * @return JsonResponse
     */
    public function tablaRecomendaciones(Request $request): JsonResponse
    {
        try {
            $desde = $request->input('desde');
            $hasta = $request->input('hasta');

            $ranking = $this->service->scorePrioridadCompra($desde, $hasta);

            // Preparar tabla de recomendaciones
            $tabla = $ranking->map(fn($m) => [
                'tipo_equipo_id' => $m['tipo_equipo_id'],
                'modelo' => $m['modelo'],
                'marca' => $m['marca'],
                'categoria' => $m['categoria'],
                'score' => $m['score'],
                'recomendacion' => $m['recomendacion'],
                'explicacion' => implode('. ', $m['explicacion']),
                'p75_uso' => $m['componentes']['presion_uso']['valor'],
                'tasa_rechazo' => $m['componentes']['demanda_insatisfecha']['valor'],
                'tendencia' => $m['componentes']['tendencia']['direccion'],
                'incidentes_1000d' => $m['componentes']['fiabilidad']['valor'],
            ]);

            // Agrupar por recomendación
            $agrupado = [
                'COMPRAR' => $tabla->where('recomendacion', 'COMPRAR')->values(),
                'MONITOREAR' => $tabla->where('recomendacion', 'MONITOREAR')->values(),
                'NO_COMPRAR' => $tabla->where('recomendacion', 'NO_COMPRAR')->values(),
            ];

            return response()->json([
                'tabla' => $tabla,
                'agrupado' => $agrupado,
                'resumen' => [
                    'comprar' => $tabla->where('recomendacion', 'COMPRAR')->count(),
                    'monitorear' => $tabla->where('recomendacion', 'MONITOREAR')->count(),
                    'no_comprar' => $tabla->where('recomendacion', 'NO_COMPRAR')->count(),
                ],
                'filtros' => [
                    'desde' => $desde,
                    'hasta' => $hasta,
                ],
            ], 200);

        } catch (\Exception $e) {
            return response()->json([
                'error' => 'Error al generar tabla de recomendaciones.',
                'message' => $e->getMessage(),
            ], 500);
        }
    }
}
