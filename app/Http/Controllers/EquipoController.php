<?php

namespace App\Http\Controllers;

use App\Services\EquipoService;
use App\Http\Requests\Equipo\StoreEquipoRequest;
use App\Http\Requests\Equipo\UpdateEquipoRequest;

class EquipoController extends Controller
{
    public function index(EquipoService $service)
    {
        return response()->json($service->getAll(), 200);
    }

    public function store(StoreEquipoRequest $request, EquipoService $service)
    {
        $data = $request->validated();

        try {
            $equipo = $service->create($data);

            return response()->json([
                'message' => 'Equipo creado correctamente.',
                'equipo'  => $equipo,
            ], 201);

        } catch (\Exception $e) {

            return response()->json([
                'error'   => 'Error al crear el equipo.',
                'message' => $e->getMessage(),
            ],500);
        }
    }

    public function show($idEquipo, EquipoService $service)
    {
        return response()->json($service->getById($idEquipo), 200);
    }

    public function update(UpdateEquipoRequest $request, $idEquipo, EquipoService $service)
    {
        $data = $request->validated();

        try{
            $equipo = $service->update($idEquipo, $data);

            return response()->json([
                'message' => 'Equipo actualizado correctamente.',
                'equipo'  => $equipo,
            ], 200);

        }catch(\Exception $e){

            return response()->json([
                'error'   => 'Error al actualizar el equipo.',
                'message' => $e->getMessage(),
            ],500);
        }
    }

    public function destroy($idEquipo, EquipoService $service)
    {
        try{
            $equipo = $service->delete($idEquipo);

            return response()->json([
                'message' => 'Equipo eliminado correctamente.',
                'equipo'  => $equipo,
            ], 200);

        }catch(\Exception $e){

            return response()->json([
                'error'   => 'Error al eliminar el equipo.',
                'message' => $e->getMessage(),
            ],500);
        }
    }
}
