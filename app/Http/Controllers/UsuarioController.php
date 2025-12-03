<?php

namespace App\Http\Controllers;

use App\Http\Requests\Usuario\StoreUsuarioRequest;
use App\Http\Requests\Usuario\UpdateUsuarioRequest;
use App\Services\UsuarioService;

class UsuarioController extends Controller
{

    /**
 * Obtiene el listado completo de usuarios del sistema.
 *
 * Este método actúa como punto de entrada para la consulta de usuarios desde el controlador.
 * Delegamos la lógica de negocio al UsuarioService, manteniendo el controlador liviano y
 * aplicando el principio de responsabilidad única (SRP). 
 *
 * @param UsuarioService $service  Servicio encargado de la gestión de usuarios.
 * @return \Illuminate\Http\JsonResponse  Respuesta JSON con los usuarios o un mensaje de error.
 */
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

/**
 * Actualiza los datos de un usuario específico.
 *
 * Este método recibe una solicitud validada a través de UpdateUsuarioRequest,
 * delega la lógica de actualización al UsuarioService y retorna una respuesta
 * JSON estandarizada. Utiliza manejo de excepciones para garantizar que
 * cualquier error sea entregado de forma controlada y segura.
 *
 * @param UpdateUsuarioRequest $request   Solicitud validada con las reglas de actualización.
 * @param int $id                         Identificador del usuario a actualizar.
 * @param UsuarioService $service         Servicio encargado de la lógica de negocio.
 *
 * @return \Illuminate\Http\JsonResponse   Respuesta JSON con el resultado de la operación.
 */
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
