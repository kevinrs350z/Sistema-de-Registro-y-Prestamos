<?php

namespace App\Http\Controllers;

use App\Http\Requests\Equipo\StoreTipoEquipoRequest as EquipoStoreTipoEquipoRequest;
use Illuminate\Http\Request;
use App\Services\TipoEquipoService;
use App\Http\Requests\TipoEquipo\UpdateTipoEquipoRequest;
use App\Http\Requests\TipoEquipo\StoreTipoEquipoRequest;
use App\Models\TipoEquipo;

class TipoEquipoController extends Controller
{
    public function index(TipoEquipoService $service)
    {
        $tequipo = $service->getAll();
        return response()->json($tequipo, 200);
    }
    public function store(StoreTipoEquipoRequest $request, TipoEquipoService $service)
    {
        $data = $request->validated();

        try{
            $tipoEquipo = $service->create($data);
            return response()->json([
                'message' => 'tipo equipo creado correctamente.',
                'tipoEquipo' => $tipoEquipo,
            ], 201);
        }catch(\Exception $e){
            return response()->json([
                'error' => 'error al crear el tipo del equipo.',
                'message' => $e->getMessage(),
            ],500);
        }
    }
    public function show($id, TipoEquipoService $service)
    {
        $data = $service->getById($id);
        return response()->json($data,200);
    }
    public function update(UpdateTipoEquipoRequest $request, TipoEquipoService $service, $id)
    {
        $data = $request->validated();
        $tipoEquipo = $service->update($id, $data);

        return response()->json([
            'message' => 'tipo de equipo actualizado correctamente',
            'tipoEquipo' => $tipoEquipo,
        ], 200);
    }
    public function destroy($id, TipoEquipoService $service)
    {
        $resultado = $service->delete($id);

        if ($resultado['error']) {
            return response()->json($resultado, 409);
        }

        return response()->json($resultado, 200);
    }

}
