<?php

namespace App\Http\Controllers;

use App\Http\Requests\Usuario\StoreUsuarioRequest;
use App\Http\Requests\Usuario\UpdateUsuarioRequest;
use App\Services\UsuarioService;

class UsuarioController extends Controller
{
    // ============================================================
    // LISTAR TODOS LOS USUARIOS
    // ============================================================
    public function index(UsuarioService $service)
    {
        try {
            $usuarios = $service->listarUsuarios();
            return response()->json($usuarios, 200);

        } catch (\Exception $e) {

            return response()->json([
                'error' => 'Error al obtener los usuarios',
                'message' => $e->getMessage()
            ], 500);
        }
    }

    // ============================================================
    // CREAR USUARIO
    // ============================================================
    public function store(StoreUsuarioRequest $request, UsuarioService $service)
    {
        try {
            $usuario = $service->crearUsuario($request->validated());

            return response()->json([
                'message' => 'Usuario creado correctamente',
                'data' => $usuario
            ], 201);

        } catch (\Exception $e) {

            return response()->json([
                'error'   => 'Error al crear el usuario',
                'message' => $e->getMessage()
            ], 500);
        }
    }

    // ============================================================
    // MOSTRAR UN USUARIO POR ID
    // ============================================================
    public function show($id, UsuarioService $service)
    {
        try {
            $usuario = $service->obtenerUsuario($id);
            return response()->json($usuario, 200);

        } catch (\Exception $e) {

            return response()->json([
                'error' => 'Usuario no encontrado',
                'message' => $e->getMessage()
            ], 404);
        }
    }

    // ============================================================
    // ACTUALIZAR USUARIO Y PERSONA
    // ============================================================
    public function update(UpdateUsuarioRequest $request, $id, UsuarioService $service)
    {
        try {
            $data = $request->validated();
            $usuario = $service->actualizarUsuario($id, $data);

            return response()->json([
                'message' => 'Usuario actualizado correctamente',
                'data' => $usuario
            ], 200);

        } catch (\Exception $e) {

            return response()->json([
                'error' => 'Error al actualizar el usuario',
                'message' => $e->getMessage()
            ], 500);
        }
    }

    // ============================================================
    // ELIMINAR USUARIO Y PERSONA
    // ============================================================
    public function destroy($id, UsuarioService $service)
    {
        try {
            $service->eliminarUsuario($id);

            return response()->json([
                'message' => 'Usuario eliminado correctamente'
            ], 200);

        } catch (\Exception $e) {

            return response()->json([
                'error'   => 'Error al eliminar el usuario',
                'message' => $e->getMessage()
            ], 500);
        }
    }
}
