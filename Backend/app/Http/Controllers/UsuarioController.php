<?php

namespace App\Http\Controllers;

use App\Http\Requests\Usuario\StoreUsuarioRequest;
use App\Http\Requests\Usuario\UpdateUsuarioRequest;
use App\Services\UsuarioService;
use Illuminate\Http\Request;

/**
 * Controlador responsable de gestionar las operaciones CRUD relacionadas con usuarios.
 *
 * Este controlador actúa como intermediario entre las solicitudes HTTP y la lógica
 * de negocio encapsulada en UsuarioService. Se aplica el principio de responsabilidad
 * única (SRP), manteniendo el controlador delgado y delegando la lógica compleja al servicio.
 *
 * @package App\Http\Controllers
 */
class UsuarioController extends Controller
{
    /**
     * Obtiene el listado completo de usuarios del sistema.
     *
     * Este método sirve como punto de entrada para consultar todos los usuarios registrados.
     * Se delega la lógica al UsuarioService para mantener cohesión y separación de responsabilidades.
     *
     * @param  UsuarioService  $service  Servicio encargado de la gestión de usuarios.
     * @return \Illuminate\Http\JsonResponse   Respuesta JSON con el listado de usuarios.
     */
    public function index(Request $request, UsuarioService $service)
    {
        try {
            $estado = $request->query('estado', null); // ACTIVO | INACTIVO | null=TODOS
            $q = $request->query('q', null); // búsqueda por nombre, email o rut
            $usuarios = $service->listarUsuarios($estado, $q);
            return response()->json($usuarios, 200);

        } catch (\Exception $e) {

            return response()->json([
                'error' => 'Error al obtener los usuarios',
                'message' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Registra un nuevo usuario en el sistema.
     *
     * Este método recibe una solicitud validada mediante StoreUsuarioRequest,
     * delega la creación al UsuarioService y retorna una respuesta estructurada.
     *
     * @param  StoreUsuarioRequest  $request  Datos validados del nuevo usuario.
     * @param  UsuarioService       $service  Servicio responsable de la creación.
     * @return \Illuminate\Http\JsonResponse  Respuesta JSON con el usuario creado.
     */    
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


    /**
     * Muestra la información de un usuario específico.
     *
     * Este método permite obtener un usuario por su ID. Si el usuario no existe,
     * se captura la excepción y se retorna una respuesta adecuada.
     *
     * @param  int             $id       Identificador del usuario a consultar.
     * @param  UsuarioService  $service   Servicio encargado de la obtención.
     * @return \Illuminate\Http\JsonResponse Respuesta JSON con los datos del usuario.
     */  
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
     * Este método recibe una solicitud validada mediante UpdateUsuarioRequest,
     * delega la actualización al UsuarioService y retorna un mensaje estandarizado
     * según el resultado de la operación.
     *
     * @param  UpdateUsuarioRequest $request   Solicitud validada con reglas de actualización.
     * @param  int                  $id        Identificador del usuario a actualizar.
     * @param  UsuarioService       $service   Servicio que gestiona la modificación.
     *
     * @return \Illuminate\Http\JsonResponse    Respuesta JSON con el usuario actualizado.
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

    /**
    public function update(UpdateUsuarioRequest $request, $id, UsuarioService $service)
    {
        $user = $request->user();
        $data = $request->validated();
        // Solo ADMIN puede cambiar roles de otros usuarios
        if (isset($data['rol']) && !$user->hasRole('ADMIN')) {
            return response()->json([
                'error' => 'No tienes permisos para asignar roles.'
            ], 403);
        }
        try {
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

    /**
     * Elimina un usuario del sistema.
     *
     * @param  int             $id       Identificador del usuario a eliminar.
     * @param  UsuarioService  $service  Servicio encargado de la eliminación.
     * @param  Request         $request  Request para verificar permisos.
     * @return \Illuminate\Http\JsonResponse  Respuesta JSON confirmando la operación.
     */
    public function destroy($id, UsuarioService $service, Request $request)
    {
        $user = $request->user();
        if ($user && method_exists($user, 'hasRole') && !$user->hasRole('ADMIN')) {
            return response()->json([
                'error' => 'No tienes permisos para eliminar usuarios.'
            ], 403);
        }
        try {
            $service->eliminarUsuario($id);
            return response()->json([
                'message' => 'Usuario desactivado correctamente'
            ], 200);
        } catch (\Exception $e) {
            return response()->json([
                'error'   => 'Error al eliminar el usuario',
                'message' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Reactiva un usuario previamente desactivado.
     *
     * @param int $id
     * @param UsuarioService $service
     * @return \Illuminate\Http\JsonResponse
     */
    public function reactivar($id, UsuarioService $service)
    {
        try {
            $service->reactivarUsuario($id);

            return response()->json([
                'message' => 'Usuario reactivado correctamente'
            ], 200);

        } catch (\Exception $e) {
            return response()->json([
                'error' => 'Error al reactivar el usuario',
                'message' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Bloquear alumno por incidente grave.
     */
    public function bloquear($id, Request $request, UsuarioService $service)
    {
        $request->validate([
            'motivo' => 'required|string|min:5|max:500',
            'fecha'  => 'nullable|date'
        ]);

        try {
            $adminId = $request->user()->idUser;
            $user = $service->bloquearUsuario($id, $request->motivo, $request->fecha, $adminId);

            return response()->json([
                'message' => 'Alumno bloqueado correctamente.',
                'bloqueado' => $user->bloqueado,
                'bloqueado_motivo' => $user->bloqueado_motivo,
                'bloqueado_fecha' => $user->bloqueado_fecha,
                'bloqueado_por' => $user->bloqueado_por,
            ], 200);
        } catch (\Exception $e) {
            $code = $e->getCode() === 403 ? 403 : 500;
            return response()->json([
                'error' => 'No se pudo bloquear al alumno',
                'message' => $e->getMessage()
            ], $code);
        }
    }

    /**
     * Desbloquear alumno.
     */
    public function desbloquear($id, Request $request, UsuarioService $service)
    {
        $request->validate([
            'motivo' => 'nullable|string|max:500'
        ]);

        try {
            $adminId = $request->user()->idUser;
            $user = $service->desbloquearUsuario($id, $request->motivo, $adminId);

            return response()->json([
                'message' => 'Alumno desbloqueado correctamente.',
                'bloqueado' => $user->bloqueado,
            ], 200);
        } catch (\Exception $e) {
            return response()->json([
                'error' => 'No se pudo desbloquear al alumno',
                'message' => $e->getMessage()
            ], 500);
        }
    }
}
