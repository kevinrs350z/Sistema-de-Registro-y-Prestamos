<?php

namespace App\Http\Controllers;

use App\Models\Pack;
use App\Services\PackService;
use App\Http\Requests\Pack\StorePackRequest;
use App\Http\Requests\Pack\UpdatePackRequest;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;

class PackController extends Controller
{
    public function __construct(
        private PackService $service
    ) {}

    /**
     * GET /api/packs
     * Listado paginado de packs
     */
    public function index(Request $request)
    {
        $perPage = $request->get('per_page', 10);

        $packs = $this->service->listarPaginado($perPage);

        return response()->json([
            'data' => $packs->getCollection()->map(fn ($pack) => [
                'id'          => $pack->id,
                'nombre'      => $pack->nombre,
                'descripcion' => $pack->descripcion,
                'imagen_url'  => $pack->imagen
                    ? asset('storage/' . $pack->imagen)
                    : null,
                'created_at'  => $pack->created_at,
                'disponibles' => $this->service->cantidadDisponible($pack),
                'agotado'     => $this->service->cantidadDisponible($pack) === 0,
                'equipos'     => $pack->equipos->map(fn ($e) => [
                    'id'            => $e->id,
                    // Mostrar el nombre legible: preferir el nombre del tipo si existe,
                    // si no, usar el código del equipo como fallback.
                    'nombre'        => $e->tipo?->nombre ?? $e->codigo,
                    'descripcion'   => $e->observacion,
                    'codigo_activo' => $e->codigo,
                    'estado'        => $e->estado,
                ]),
            ]),
            'meta' => [
                'current_page' => $packs->currentPage(),
                'last_page'    => $packs->lastPage(),
                'per_page'     => $packs->perPage(),
                'total'        => $packs->total(),
            ],
        ]);
    }

    /**
     * POST /api/packs
     * Crear pack
     */
    public function store(StorePackRequest $request)
    {
        $equipos = $request->input('equipos');

        if (is_string($equipos)) {
            $request->merge([
                'equipos' => json_decode($equipos, true)
            ]);
        }

        $pack = $this->service->crear($request->validated() + [
            'imagen' => $request->file('imagen'),
        ]);

        return response()->json([
            'message' => 'Pack creado correctamente.',
            'id' => $pack->id,
        ], 201);
    }
    public function update(UpdatePackRequest $request, Pack $pack)
    {
        $this->service->actualizar(
            $pack,
            $request->validated(),
            $request->file('imagen')
        );

        return response()->json([
            'message' => 'Pack actualizado correctamente.'
        ]);
    }


    /**
     * DELETE /api/packs/{pack}
     * Soft delete
     */
    public function destroy(Pack $pack)
    {
        $this->service->eliminar($pack);

        return response()->json([
            'message' => 'Pack eliminado correctamente.'
        ]);
    }

    /**
     * POST /api/packs/{pack}/reactivar
     * Reactivar un pack forzando los equipos asociados a DISPONIBLE.
     */
    public function reactivar(Pack $pack)
    {
        // Forzar estado DISPONIBLE en los equipos asociados al pack.
        foreach ($pack->equipos as $equipo) {
            $equipo->estado = 'DISPONIBLE';
            $equipo->save();
        }

        return response()->json([
            'message' => 'Pack reactivado correctamente.'
        ]);
    }
}
