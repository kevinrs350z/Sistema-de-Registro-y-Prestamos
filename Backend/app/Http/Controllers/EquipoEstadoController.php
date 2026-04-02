<?php

namespace App\Http\Controllers;

use App\Http\Requests\Equipo\CambiarEstadoEquipoRequest;
use App\Services\EquipoEstadoService;
use App\Models\EquipoEstadoEvento;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Database\Eloquent\ModelNotFoundException;
use Illuminate\Validation\ValidationException;

/**
 * Controlador para gestionar estados de equipos y auditoría.
 * 
 * Endpoints:
 * - PATCH /equipos/{id}/estado - Cambiar estado de un equipo
 * - GET /equipos/{id}/historial-estados - Obtener historial de estados
 * - GET /tipos-falla - Obtener catálogo de tipos de falla
 */
class EquipoEstadoController extends Controller
{
    private EquipoEstadoService $equipoEstadoService;

    public function __construct(EquipoEstadoService $equipoEstadoService)
    {
        $this->equipoEstadoService = $equipoEstadoService;
    }

    /**
     * Cambiar el estado de un equipo.
     * 
     * PATCH /api/equipos/{id}/estado
     * 
     * Payload ejemplo:
     * {
     *   "estado": "MANTENIMIENTO",
     *   "motivo": "No enciende / falla de carga",
     *   "tipoFallaId": 4,
     *   "observacion": "Se detecta falso contacto en puerto de carga",
     *   "origen": "admin"
     * }
     *
     * @param CambiarEstadoEquipoRequest $request
     * @param int $id ID del equipo
     * @return JsonResponse
     */
    public function cambiarEstado(CambiarEstadoEquipoRequest $request, int $id): JsonResponse
    {
        try {
            $usuario = $request->user();
            
            $equipo = $this->equipoEstadoService->cambiarEstadoEquipo(
                equipoId: $id,
                nuevoEstado: $request->input('estado'),
                usuarioId: $usuario->idUser,
                motivo: $request->input('motivo'),
                tipoFallaId: $request->input('tipoFallaId'),
                observacion: $request->input('observacion'),
                origen: $request->input('origen', EquipoEstadoEvento::ORIGEN_ADMIN)
            );

            return response()->json([
                'message' => 'Estado del equipo actualizado correctamente.',
                'equipo' => [
                    'id' => $equipo->id,
                    'codigo' => $equipo->codigo,
                    'estado' => $equipo->estado,
                    'updated_at' => $equipo->updated_at,
                ],
            ], 200);

        } catch (ModelNotFoundException $e) {
            return response()->json([
                'error' => 'Equipo no encontrado.',
                'message' => $e->getMessage(),
            ], 404);

        } catch (ValidationException $e) {
            return response()->json([
                'error' => 'Error de validación.',
                'errors' => $e->errors(),
            ], 422);

        } catch (\Exception $e) {
            return response()->json([
                'error' => 'Error al cambiar el estado del equipo.',
                'message' => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Obtener el historial de estados de un equipo (paginado).
     * 
     * GET /api/equipos/{id}/historial-estados
     * 
     * Query params:
     * - per_page: int (default 15)
     *
     * @param Request $request
     * @param int $id ID del equipo
     * @return JsonResponse
     */
    public function historialEstados(Request $request, int $id): JsonResponse
    {
        try {
            $perPage = min($request->input('per_page', 15), 100);
            
            $historial = $this->equipoEstadoService->obtenerHistorialEstados($id, $perPage);

            // Transformar los datos para la respuesta
            $historial->getCollection()->transform(function ($evento) {
                return [
                    'id' => $evento->id,
                    'estado_anterior' => $evento->estado_anterior,
                    'estado_nuevo' => $evento->estado_nuevo,
                    'fecha_evento' => $evento->fecha_evento->toIso8601String(),
                    'motivo' => $evento->motivo,
                    'observacion' => $evento->observacion,
                    'origen' => $evento->origen,
                    'usuario' => $evento->usuario ? [
                        'id' => $evento->usuario->idUser,
                        'nombre' => $evento->usuario->persona 
                            ? $evento->usuario->persona->Nombre . ' ' . $evento->usuario->persona->Apellido
                            : 'Usuario desconocido',
                        'email' => $evento->usuario->Email,
                    ] : null,
                    'tipo_falla' => $evento->tipoFalla ? [
                        'id' => $evento->tipoFalla->id,
                        'codigo' => $evento->tipoFalla->codigo,
                        'nombre' => $evento->tipoFalla->nombre,
                        'categoria' => $evento->tipoFalla->categoria,
                    ] : null,
                ];
            });

            return response()->json([
                'equipo_id' => $id,
                'historial' => $historial,
            ], 200);

        } catch (ModelNotFoundException $e) {
            return response()->json([
                'error' => 'Equipo no encontrado.',
                'message' => $e->getMessage(),
            ], 404);

        } catch (\Exception $e) {
            return response()->json([
                'error' => 'Error al obtener el historial de estados.',
                'message' => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Obtener el catálogo de tipos de falla.
     * 
     * GET /api/tipos-falla
     * 
     * Query params:
     * - categoria: string (filtrar por categoría: CAM, AUD, IT, MECH, PWR, USR, INV)
     *
     * @param Request $request
     * @return JsonResponse
     */
    public function tiposFalla(Request $request): JsonResponse
    {
        try {
            $categoria = $request->input('categoria');
            
            $tiposFalla = $this->equipoEstadoService->obtenerTiposFalla($categoria);

            // Agrupar por categoría para mejor visualización
            $agrupados = $tiposFalla->groupBy('categoria')->map(function ($items, $categoria) {
                return [
                    'categoria' => $categoria,
                    'descripcion' => \App\Models\TipoFalla::categorias()[$categoria] ?? $categoria,
                    'tipos' => $items->map(function ($tipo) {
                        return [
                            'id' => $tipo->id,
                            'codigo' => $tipo->codigo,
                            'nombre' => $tipo->nombre,
                            'descripcion' => $tipo->descripcion,
                        ];
                    })->values(),
                ];
            })->values();

            return response()->json([
                'tipos_falla' => $agrupados,
                'total' => $tiposFalla->count(),
            ], 200);

        } catch (\Exception $e) {
            return response()->json([
                'error' => 'Error al obtener los tipos de falla.',
                'message' => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Obtener las categorías de tipos de falla disponibles.
     * 
     * GET /api/tipos-falla/categorias
     *
     * @return JsonResponse
     */
    public function categoriasFalla(): JsonResponse
    {
        return response()->json([
            'categorias' => \App\Models\TipoFalla::categorias(),
        ], 200);
    }
}
