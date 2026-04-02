<?php

namespace App\Services;

use App\Models\Grupo;
use App\Models\User;
use App\Models\Prestamo;

class GrupoService
{
    public function crearGrupo($nombre, $asignaturaId = null, $docenteId = null, $usuarios = [])
    {
        $grupo = Grupo::create([
            'nombre' => $nombre,
            'asignatura_id' => $asignaturaId,
            'docente_id' => $docenteId,
        ]);
        if (!empty($usuarios)) {
            $grupo->usuarios()->sync($usuarios);
        }
        return $grupo->load(['usuarios', 'asignatura', 'docente']);
    }

    public function asignarUsuarios($grupoId, $usuarios)
    {
        $grupo = Grupo::findOrFail($grupoId);
        $grupo->usuarios()->sync($usuarios);
        return $grupo->load('usuarios');
    }

    public function asignarPrestamo($grupoId, $prestamoId)
    {
        $grupo = Grupo::findOrFail($grupoId);
        $grupo->prestamos()->attach($prestamoId);
        return $grupo->load('prestamos');
    }

    public function quitarPrestamo($grupoId, $prestamoId)
    {
        $grupo = Grupo::findOrFail($grupoId);
        $grupo->prestamos()->detach($prestamoId);
        return $grupo->load('prestamos');
    }
}
