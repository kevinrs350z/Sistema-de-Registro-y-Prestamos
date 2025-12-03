<?php
namespace App\Services;

use App\Models\Equipo;

class EquipoService
{

/**
 * Obtiene el listado completo de equipos registrados en el sistema.
 *
 * Este método construye una consulta relacional que une las tablas
 * `equipos`, `tipo_equipos` y `categorias` para retornar información
 * enriquecida que incluye:
 *  - Identificador del equipo.
 *  - Código y estado actual.
 *  - Fecha de creación y actualización.
 *  - Nombre del modelo (tipo de equipo).
 *  - Categoría a la que pertenece el equipo.
 *
 * Esta estructura está diseñada para proporcionar al frontend
 * (incluyendo versiones anteriores) todos los datos necesarios
 * para visualizar el inventario sin requerir consultas adicionales.
 *
 * @return \Illuminate\Support\Collection  Colección de equipos con información asociada.
 */
    public function getAll()
    {
        return Equipo::select(
            'equipos.id as idEquipo',
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

    // ============================================================
    // OBTENER UN SOLO EQUIPO (mismo formato)
    // ============================================================
    public function getById($id)
    {
        return Equipo::select(
            'equipos.id as idEquipo',
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
 * Este método recibe los datos previamente validados desde el controlador
 * y utiliza Eloquent para generar un nuevo registro en la tabla `equipos`.
 * Su responsabilidad es ejecutar la operación de persistencia sin aplicar
 * lógica adicional, manteniendo la separación de responsabilidades dentro
 * de la arquitectura (el controlador valida, el servicio orquesta, y el
 * modelo almacena).
 *
 * @param array $data Datos validados necesarios para crear el equipo.
 * @return \App\Models\Equipo Nuevo registro creado en la base de datos.
 */
    public function create($data)
    {
        return Equipo::create($data);
    }

    public function update($id, $data)
    {  
        $equipo = Equipo::findOrFail($id);
        $equipo->fill($data);
        $equipo->save();

        return $equipo;
    }

    public function delete($id)
    {
        $equipo = Equipo::findOrFail($id);
        $equipo->delete();

        return $equipo;
    }
}
