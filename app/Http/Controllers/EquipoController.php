<?php

namespace App\Http\Controllers;

use App\Services\EquipoService;
use App\Http\Requests\Equipo\StoreEquipoRequest;
use App\Http\Requests\Equipo\UpdateEquipoRequest;

/**
 * Controlador encargado de gestionar las operaciones CRUD de equipos.
 *
 * Este controlador actúa como intermediario entre las rutas de la API
 * y la lógica de negocio contenida en EquipoService. Su responsabilidad
 * es validar las solicitudes mediante Form Requests, delegar el trabajo
 * al servicio correspondiente y retornar respuestas estandarizadas al
 * cliente en formato JSON.
 *
 * Métodos incluidos:
 *  - index():    Listado de todos los equipos.
 *  - store():    Creación de un nuevo equipo.
 *  - show():     Obtención de un equipo por ID.
 *  - update():   Actualización de un equipo existente.
 *  - destroy():  Eliminación lógica o física de un equipo.
 *
 * Este controlador demuestra el patrón arquitectura desacoplada:
 * controlador liviano + servicio dedicado + validación externa.
 */
class EquipoController extends Controller
{
        /**
     * Retorna el listado completo de equipos.
     *
     * @param EquipoService $service
     * @return \Illuminate\Http\JsonResponse
     */
    public function index(EquipoService $service)
    {
        return response()->json($service->getAll(), 200);
    }
/**
 * Registra un nuevo equipo en el sistema.
 *
 * Este método recibe una solicitud validada mediante `StoreEquipoRequest`,
 * lo que garantiza que los datos cumplan con las reglas de integridad antes
 * de ejecutarse cualquier operación. Una vez validados, el controlador
 * delega la creación al `EquipoService`, siguiendo el principio de
 * responsabilidad única (SRP) y manteniendo el controlador liviano.
 *
 * Si la creación se ejecuta correctamente, retorna una respuesta JSON con
 * código HTTP 201 (Created). En caso de error, captura la excepción y
 * devuelve un mensaje controlado con código 500, evitando exponer detalles
 * internos del sistema.
 *
 * @param StoreEquipoRequest $request  Datos ya validados para la creación.
 * @param EquipoService $service       Servicio encargado del proceso de registro.
 * @return \Illuminate\Http\JsonResponse Respuesta JSON con el resultado.
 */
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
