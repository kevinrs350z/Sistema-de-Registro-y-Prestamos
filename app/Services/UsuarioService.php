<?php

namespace App\Services;

use App\Models\Persona;
use App\Models\User;
use App\Models\Rol;
use Illuminate\Support\Facades\Hash;

class UsuarioService
{

/**
 * Obtiene un listado paginado de usuarios con su información personal y rol asociado.
 *
 * Este método construye una consulta relacional que integra datos de las tablas:
 * - users
 * - persona
 * - rol_user
 * - rol
 *
 * Su objetivo es entregar un conjunto de información unificada, limpia y lista para
 * ser consumida por el frontend, manteniendo una estructura coherente y respetando
 * las convenciones del sistema (nombres, apellidos, contacto y roles).
 *
 * @return \Illuminate\Contracts\Pagination\LengthAwarePaginator
 *         Listado paginado de usuarios con 50 elementos por página.
 */
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


    
    public function crearUsuario($data)
    {
       
        $persona = Persona::create([
            'Nombre'     => $data['nombre'],
            'apellido1'  => $data['apellido1'],
            'apellido2'  => $data['apellido2'] ?? null,
            'Rut'        => $data['rut'],
            'Email'      => $data['email'],
            'telefono'   => $data['telefono'] ?? null,
            'celular'    => $data['celular'] ?? null
        ]);

     
        $usuario = User::create([
            'idPersona'  => $persona->idPersona,
            'Contrasena' => Hash::make($data['password']),
            'Email'      => $data['email'],
        ]);

       
        $rol = Rol::where('Nombre', $data['rol'])->firstOrFail();

        
        $usuario->roles()->attach($rol->idRol);

        return [
            'persona' => $persona,
            'usuario' => $usuario,
            'rol'     => $rol->Nombre
        ];
    }

  
    public function actualizarUsuario($id, $data)
    {
        $usuario = User::findOrFail($id);
        $persona = Persona::findOrFail($usuario->idPersona);

    
        $persona->update([
            'Nombre'     => $data['nombre'],
            'apellido1'  => $data['apellido1'],
            'apellido2'  => $data['apellido2'] ?? null,
            'Rut'        => $data['rut'],
            'Email'      => $data['email'],   // ✔ actualizar duplicado
            'telefono'   => $data['telefono'] ?? null,
            'celular'    => $data['celular'] ?? null
        ]);

   
        $usuario->Email = $data['email'];

        if (!empty($data['password'])) {
            $usuario->Contrasena = Hash::make($data['password']);
        }

        $usuario->save();

   
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
