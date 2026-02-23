<?php

namespace App\Http\Controllers;

use App\Services\ConfiguracionService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class ConfiguracionController extends Controller
{
    public function __construct(
        private ConfiguracionService $service
    ) {}

    /**
     * Verificar que el usuario sea admin o superusuario.
     */
    private function ensureAdmin(): void
    {
        $user = Auth::user();
        if (!$user || !$user->isAdminOrSuper()) {
            abort(403, 'No autorizado');
        }
    }

    /**
     * GET /api/admin/configuraciones
     * Obtener todas las configuraciones.
     */
    public function index(Request $request): JsonResponse
    {
        $this->ensureAdmin();

        $grupo = $request->query('grupo');

        $data = $grupo
            ? $this->service->obtenerPorGrupo($grupo)
            : $this->service->obtenerTodas();

        return response()->json($data);
    }

    /**
     * PUT /api/admin/configuraciones
     * Actualizar multiples configuraciones.
     * Body: { configuraciones: [{ clave: "xxx", valor: "yyy" }, ...] }
     */
    public function update(Request $request): JsonResponse
    {
        $this->ensureAdmin();

        $request->validate([
            'configuraciones' => 'required|array|min:1',
            'configuraciones.*.clave' => 'required|string',
            'configuraciones.*.valor' => 'nullable|string',
        ]);

        try {
            $actualizadas = $this->service->actualizarMultiples(
                $request->configuraciones
            );

            return response()->json([
                'message' => 'Configuraciones actualizadas correctamente.',
                'data' => $actualizadas,
            ]);
        } catch (\InvalidArgumentException $e) {
            return response()->json([
                'error' => $e->getMessage(),
            ], 422);
        }
    }

    /**
     * PATCH /api/admin/configuraciones/{clave}
     * Actualizar una sola configuracion.
     */
    public function updateOne(Request $request, string $clave): JsonResponse
    {
        $this->ensureAdmin();

        $request->validate([
            'valor' => 'nullable|string',
        ]);

        try {
            $config = $this->service->actualizar($clave, $request->valor);

            return response()->json([
                'message' => 'Configuracion actualizada.',
                'data' => $config,
            ]);
        } catch (\InvalidArgumentException $e) {
            return response()->json([
                'error' => $e->getMessage(),
            ], 422);
        } catch (\Illuminate\Database\Eloquent\ModelNotFoundException $e) {
            return response()->json([
                'error' => "Configuracion '{$clave}' no encontrada.",
            ], 404);
        }
    }
}
