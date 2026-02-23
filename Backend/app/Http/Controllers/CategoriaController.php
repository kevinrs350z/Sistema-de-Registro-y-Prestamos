<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Http\Requests\Categoria\StoreCategoriaRequest;
use App\Http\Requests\Categoria\UpdateCategoriaRequest;
use App\Http\Requests\Categoria\StoreCategoriaEncargadosRequest;
use App\Services\CategoriaService;

class CategoriaController extends Controller
{
    private function ensureAdmin(Request $request)
    {
        $user = $request->user();
        if (!$user || !method_exists($user, 'isAdminOrSuper') || !$user->isAdminOrSuper()) {
            abort(403, 'No autorizado');
        }
    }

    /**
     * Display a listing of the resource.
     *
     * @return \Illuminate\Http\Response
     */
    public function index(CategoriaService $service)
    {
        $a = $service->getAll();    
        
        return response()->json($a, 200);
    }

    /**
     * Listado administrativo de categorias con encargados.
     */
    public function adminIndex(Request $request, CategoriaService $service)
    {
        $this->ensureAdmin($request);

        $a = $service->getAll();
        return response()->json($a, 200);
    }


    /**
     * Store a newly created resource in storage.
     *
     * @param  \Illuminate\Http\Request  $request
     * @return \Illuminate\Http\Response
     */
    public function store(StoreCategoriaRequest $request, CategoriaService $service)
    {
        $data = $request->validated();
        try
        {
            $categoria = $service->create($data);
            return response()->json([
                'message'  => 'categoria creada correctamente',
                'categoria' => $categoria,
            ], 201);

        }catch(\Exception $e){
            return response()->json([
                'error'   => 'error al crear la cateogira',
                'message' => $e->getMessage(),
            ], 500);
        }
        
    }

    /**
     * Display the specified resource.
     *
     * @param  int  $id
     * @return \Illuminate\Http\Response
     */
    public function show($id, CategoriaService $service)
    { 
        $data = $service->getById($id);
        return response()->json($data ,200);
    }

    /**
     * Ver detalle administrativo (incluye encargados).
     */
    public function adminShow(Request $request, $id, CategoriaService $service)
    {
        $this->ensureAdmin($request);
        $data = $service->getById($id);
        return response()->json($data, 200);
    }


    /**
     * Update the specified resource in storage.
     *
     * @param  \Illuminate\Http\Request  $request
     * @param  int  $id
     * @return \Illuminate\Http\Response
     */
    public function update(UpdateCategoriaRequest $request, CategoriaService $service, $id)
    {
        $data = $request->validated();
        $categoria = $service->update($id, $data);
        return response()->json([
            'message' => 'categoria actualizada correctamente',
            'categoria' => $categoria,
        ], 200);

    }

    /**
     * Actualizar estado activo/inactivo.
     */
    public function actualizarEstado(Request $request, CategoriaService $service, $id)
    {
        $this->ensureAdmin($request);

        $request->validate([
            'activo' => 'required|boolean'
        ]);

        $categoria = $service->actualizarEstado($id, (bool) $request->input('activo'));

        return response()->json([
            'message' => 'Estado actualizado correctamente',
            'categoria' => $categoria,
        ], 200);
    }

    /**
     * Remove the specified resource from storage.
     *
     * @param  int  $id
     * @return \Illuminate\Http\Response
     */
    public function destroy($id, CategoriaService $service)
    {
        $resultado = $service->delete($id);

        if ($resultado['error']) {
            return response()->json($resultado, 409);
        }

        return response()->json($resultado, 200);
    }

    /**
     * Listar encargados de una categoria.
     */
    public function encargados(Request $request, $id, CategoriaService $service)
    {
        $this->ensureAdmin($request);

        $encargados = $service->listarEncargados($id);
        return response()->json($encargados, 200);
    }

    /**
     * Agregar encargados a una categoria.
     */
    public function agregarEncargados(StoreCategoriaEncargadosRequest $request, $id, CategoriaService $service)
    {
        $this->ensureAdmin($request);

        try {
            $encargados = $service->agregarEncargados($id, $request->validated()['usuarios']);

            return response()->json([
                'message' => 'Encargados agregados correctamente',
                'encargados' => $encargados,
            ], 200);
        } catch (\InvalidArgumentException $e) {
            return response()->json([
                'error' => 'Usuarios invalidos para encargados',
                'message' => $e->getMessage(),
            ], 422);
        } catch (\Exception $e) {
            return response()->json([
                'error' => 'No se pudo agregar encargados',
                'message' => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Quitar encargado de una categoria.
     */
    public function quitarEncargado(Request $request, $id, $userId, CategoriaService $service)
    {
        $this->ensureAdmin($request);

        $service->quitarEncargado((int) $id, (int) $userId);

        return response()->json([
            'message' => 'Encargado removido correctamente'
        ], 200);
    }



}
