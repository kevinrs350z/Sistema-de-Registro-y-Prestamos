<?php

namespace App\Services;

use App\Models\Persona;
use App\Models\User;
use App\Models\Rol;
use Illuminate\Support\Facades\Hash;

class UsuarioService
{
    // ============================================================
    // LISTAR USUARIOS
    // ============================================================
    public function listarUsuarios()
    {
        return User::select(
                'users.idUser as id',
                'persona.Nombre as nombre',
                'persona.apellido1',
                'persona.apellido2',
                'persona.Rut as rut',
                'users.Email as email',
                'persona.telefono',
                'persona.celular',
                'rol.Nombre as rol'
            )
            ->join('persona', 'persona.idPersona', '=', 'users.idPersona')
            ->leftJoin('rol_user', 'rol_user.idUser', '=', 'users.idUser')
            ->leftJoin('rol', 'rol.idRol', '=', 'rol_user.idRol')
            ->orderBy('persona.Nombre', 'asc')
            ->paginate(50);       
    }


    // ============================================================
    // OBTENER USUARIO POR ID
    // ============================================================
    public function obtenerUsuario($id)
    {
        return User::select(
                'users.idUser as id',
                'persona.Nombre as nombre',
                'persona.apellido1',
                'persona.apellido2',
                'persona.Rut as rut',
                'users.Email as email',
                'persona.telefono',
                'persona.celular',
                'rol.Nombre as rol'
            )
            ->join('persona', 'persona.idPersona', '=', 'users.idPersona')
            ->leftJoin('rol_user', 'rol_user.idUser', '=', 'users.idUser')
            ->leftJoin('rol', 'rol.idRol', '=', 'rol_user.idRol')
            ->where('users.idUser', $id)
            ->firstOrFail();
    }


    // ============================================================
    // CREAR USUARIO COMPLETO
    // ============================================================
    public function crearUsuario($data)
    {
        // 1. Crear persona
        $persona = Persona::create([
            'Nombre'     => $data['nombre'],
            'apellido1'  => $data['apellido1'],
            'apellido2'  => $data['apellido2'] ?? null,
            'Rut'        => $data['rut'],
            'Email'      => $data['email'],
            'telefono'   => $data['telefono'] ?? null,
            'celular'    => $data['celular'] ?? null
        ]);

        // 2. Crear usuario
        $usuario = User::create([
            'idPersona'  => $persona->idPersona,
            'Contrasena' => Hash::make($data['password']),
            'Email'      => $data['email'],
        ]);

        // 3. Buscar rol
        $rol = Rol::where('Nombre', $data['rol'])->firstOrFail();

        // 4. Asignar rol
        $usuario->roles()->attach($rol->idRol);

        return [
            'persona' => $persona,
            'usuario' => $usuario,
            'rol'     => $rol->Nombre
        ];
    }

    // ============================================================
    // ACTUALIZAR USUARIO + PERSONA
    // ============================================================
    public function actualizarUsuario($id, $data)
    {
        $usuario = User::findOrFail($id);
        $persona = Persona::findOrFail($usuario->idPersona);

        // ============================
        // 1. ACTUALIZAR PERSONA
        // ============================
        $persona->update([
            'Nombre'     => $data['nombre'],
            'apellido1'  => $data['apellido1'],
            'apellido2'  => $data['apellido2'] ?? null,
            'Rut'        => $data['rut'],
            'Email'      => $data['email'],   // ✔ actualizar duplicado
            'telefono'   => $data['telefono'] ?? null,
            'celular'    => $data['celular'] ?? null
        ]);

        // ============================
        // 2. ACTUALIZAR USER
        // ============================
        $usuario->Email = $data['email'];

        if (!empty($data['password'])) {
            $usuario->Contrasena = Hash::make($data['password']);
        }

        $usuario->save();

        // ============================
        // 3. ACTUALIZAR ROL
        // ============================
        if (!empty($data['rol'])) {

            $nuevoRol = Rol::where('Nombre', $data['rol'])->firstOrFail();

            // borrar roles anteriores
            $usuario->roles()->sync([$nuevoRol->idRol]);
        }

        return [
            'persona' => $persona,
            'usuario' => $usuario,
            'rol'     => $nuevoRol->Nombre ?? 'sin cambios'
        ];
    }


    // ============================================================
    // ELIMINAR USUARIO COMPLETO
    // ============================================================
    public function eliminarUsuario($id)
    {
        $usuario = User::findOrFail($id);

        // Eliminar roles
        $usuario->roles()->detach();

        // Eliminar persona
        Persona::find($usuario->idPersona)?->delete();

        // Eliminar usuario
        $usuario->delete();
    }
}
