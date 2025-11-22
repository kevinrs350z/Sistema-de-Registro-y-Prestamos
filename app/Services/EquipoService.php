<?php
namespace App\Services;

use App\Models\Equipo;

class EquipoService
{
    public function getAll()
    {
        return Equipo::all();
    }

    public function getById($id)
    {
        return Equipo::findOrFail($id);
    }

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
