<?php
namespace App\Services;

use App\Models\Equipo;

class EquipoService
{
    // ============================================================
    // LISTAR TODOS (con nombre y categoría para el frontend viejo)
    // ============================================================
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

    // ============================================================
    // CRUD NORMAL
    // ============================================================
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
