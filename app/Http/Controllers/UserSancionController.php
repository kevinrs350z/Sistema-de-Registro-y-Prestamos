<?php

namespace App\Http\Controllers;

use App\Models\User;
use App\Models\Sancion;
use Illuminate\Http\Request;

class UserSancionController extends Controller
{
    // Solo admin puede ejecutar esto gracias al middleware
    public function asignarSancion(Request $request)
    {
        // Validación
        $request->validate([
            'idUser' => 'required|exists:users,idUser',
            'nivel' => 'required|string',
            'estado' => 'required|string',
            'fecha_inicio' => 'required|date',
            'fecha_fin' => 'required|date|after_or_equal:fecha_inicio',
        ]);

        // Crear sanción nueva
        $sancion = Sancion::create([
            'nivel' => $request->nivel,
            'estado' => $request->estado,
            'fecha_inicio' => $request->fecha_inicio,
            'fecha_fin' => $request->fecha_fin,
        ]);

        // Buscar usuario
        $user = User::find($request->idUser);

        // Asignar sanción en tabla pivote user_sancion
        $user->sanciones()->attach($sancion->idSancion);

        return response()->json([
            'message' => 'Sanción creada y asignada correctamente',
            'sancion' => $sancion,
            'usuario' => $user->only(['idUser', 'name', 'email']),
        ], 201);
    }
}
