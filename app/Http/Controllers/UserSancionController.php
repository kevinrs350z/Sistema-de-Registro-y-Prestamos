<?php

namespace App\Http\Controllers;

use App\Models\User;
use App\Models\Sancion;
use Illuminate\Http\Request;

class UserSancionController extends Controller
{
    // -------- ASIGNAR SANCION A UN USUARIO (ADMIN) --------
    public function asignarSancion(Request $request)
    {
        $request->validate([
            'idUser' => 'required|exists:users,idUser',
            'nivel' => 'required|string',
            'estado' => 'required|string',
            'fecha_inicio' => 'required|date',
            'fecha_fin' => 'required|date|after_or_equal:fecha_inicio',
        ]);

        // Crear sanción
        $sancion = Sancion::create([
            'nivel' => $request->nivel,
            'estado' => $request->estado,
            'fecha_inicio' => $request->fecha_inicio,
            'fecha_fin' => $request->fecha_fin,
        ]);

        // Buscar usuario
        $user = User::where('idUser', $request->idUser)->first();

        // Asignar sanción en tabla pivote
        $user->sanciones()->attach($sancion->idSancion);

        return response()->json([
            'message' => 'Sanción creada y asignada correctamente.',
            'sancion' => $sancion,
            'usuario' => $user->only(['idUser', 'Email']),
        ], 201);
    }

    // -------- MOSTRAR TODAS LAS SANCIONES DEL SISTEMA CON SUS USUARIOS --------
    public function listarSanciones()
    {
        // Cargar sanciones + usuarios asociados
        $sanciones = Sancion::with('users')->get();

        return response()->json([
            'message' => 'Listado completo de sanciones con sus usuarios.',
            'sanciones' => $sanciones
        ]);
    }
}
