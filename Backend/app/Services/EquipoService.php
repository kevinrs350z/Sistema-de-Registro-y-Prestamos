<?php
namespace App\Services;

use App\Models\Equipo;
use App\Models\EquipoHistorial;
use Illuminate\Support\Facades\DB;

/**
 * Servicio encargado de gestionar las operaciones de negocio relacionadas con Equipos.
 *
 * Esta clase centraliza toda la lógica asociada a la consulta, creación, actualización
 * y eliminación de equipos, manteniendo una arquitectura desacoplada en la cual
 * el controlador se limita únicamente a coordinar solicitudes y delegar trabajo.
 *
 * Principios aplicados:
 * - SRP (Single Responsibility Principle): el servicio contiene la lógica del dominio.
 * - Consulta relacional optimizada mediante joins explícitos.
 * - Uso estandarizado de excepciones controladas.
 *
 * @package App\Services
 */

class EquipoService
{

    /**
     * Obtiene el listado completo de equipos registrados en el sistema.
     *
     * Este método ejecuta una consulta relacional que une las tablas
     * `equipos`, `tipo_equipos` y `categorias` para construir un objeto
     * enriquecido que incluye información estructurada del equipo:
     *
     *  - ID del equipo (`idEquipo`)
     *  - Código del activo
     *  - Estado actual
     *  - Timestamps de creación y actualización
     *  - Nombre del modelo asociado
     *  - Categoría correspondiente
     *
     * Esta consulta está optimizada para entregar al frontend (nuevo y legado)
     * un dataset completo sin requerir consultas adicionales.
     *
     * @return Collection  Colección de equipos con información relacional.
     */
    public function getAll()
    {
        return Equipo::select(
            'equipos.id',
            'equipos.codigo',
            'equipos.estado',
            'equipos.created_at',
            'equipos.updated_at',
            'tipo_equipos.nombre as nombre',
            'categorias.nombre as categoria'
        )
        ->join('tipo_equipos', 'tipo_equipos.id', '=', 'equipos.tipo_equipo_id')
        ->join('categorias', 'categorias.id', '=', 'tipo_equipos.categoria_id')
        ->get();
    }

    /**
     * Obtiene un equipo específico por su identificador.
     *
     * La estructura del retorno es idéntica al formato proporcionado por `getAll`,
     * asegurando consistencia en la API. Si el equipo no existe, se genera una
     * excepción `ModelNotFoundException` que es manejada por el controlador.
     *
     * @param  int  $id  Identificador del equipo a consultar.
     * @return object    Objeto con la información del equipo solicitado.
     *
     * @throws \Illuminate\Database\Eloquent\ModelNotFoundException
     */
    public function getById($id)
    {
        return Equipo::select(
            'equipos.id',
            'equipos.codigo',
            'equipos.estado',
            'equipos.created_at',
            'equipos.updated_at',
            'tipo_equipos.nombre as nombre',
            'categorias.nombre as categoria'
        )
        ->join('tipo_equipos', 'tipo_equipos.id', '=', 'equipos.tipo_equipo_id')
        ->join('categorias', 'categorias.id', '=', 'tipo_equipos.categoria_id')
        ->where('equipos.id', $id)
        ->firstOrFail();
    }


    /**
     * Crea un nuevo registro de equipo en la base de datos.
     *
     * Este método recibe datos previamente validados desde el controlador o desde
     * un Form Request. La creación se delega al modelo Eloquent, manteniendo la
     * separación de responsabilidades y permitiendo pruebas unitarias más limpias.
     *
     * @param  array  $data  Datos validados necesarios para crear un equipo.
     * @return Equipo         Instancia del nuevo registro creado.
     */
    public function create($data)
    {
        return Equipo::create($data);
    }

    /**
     * Actualiza los datos de un equipo existente.
     *
     * El método recupera el equipo mediante `findOrFail`, aplica los cambios
     * mediante `fill()` y persiste la actualización llamando a `save()`.
     * Se retorna el modelo actualizado para mantener trazabilidad.
     *
     * @param  int    $id    Identificador del equipo.
     * @param  array  $data  Datos validados a actualizar.
     * @return Equipo         Equipo actualizado.
     *
     * @throws \Illuminate\Database\Eloquent\ModelNotFoundException
     */
    public function update($id, $data)
    {  
        $equipo = Equipo::findOrFail($id);
        $equipo->fill($data);
        $equipo->save();

        return $equipo;
    }

    
    /**
     * Dar de baja un equipo (soft delete + estado BAJA + auditoría).
     *
     * Este método implementa el flujo profesional completo:
     * 1. Cambia el estado a 'BAJA' para reportes y trazabilidad.
     * 2. Aplica SoftDelete (deleted_at) para excluirlo de queries normales.
     * 3. Registra la acción en el historial de auditoría.
     *
     * El equipo NO se elimina físicamente, permitiendo:
     * - Consultas históricas con withTrashed()
     * - Reportes de equipos dados de baja
     * - Recuperación si fuera necesario (restore)
     *
     * @param  int  $id  Identificador del equipo.
     * @param  int  $adminId  Identificador del administrador que ejecuta la acción.
     * @return Equipo
     *
     * @throws \Illuminate\Database\Eloquent\ModelNotFoundException
     */
    public function darDeBaja($id, $adminId)
    {
        return DB::transaction(function () use ($id, $adminId) {
            $equipo = Equipo::findOrFail($id);
            $estadoAnterior = $equipo->estado;

            // 1. Cambiar estado a BAJA
            $equipo->estado = 'BAJA';
            $equipo->save();

            // 2. Registrar en historial de auditoría
            EquipoHistorial::create([
                'equipo_id' => $equipo->id,
                'admin_id'  => $adminId,
                'accion'    => 'BAJA',
                'detalle'   => json_encode([
                    'estado_anterior' => $estadoAnterior,
                    'estado_nuevo' => 'BAJA',
                    'motivo' => 'Dado de baja por administrador',
                ]),
            ]);

            // 3. Aplicar SoftDelete (establece deleted_at)
            $equipo->delete();

            return $equipo;
        });
    }
}
