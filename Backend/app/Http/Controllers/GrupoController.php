<?php

namespace App\Http\Controllers;

use App\Models\Grupo;
use App\Models\GrupoUsuario;
use App\Models\GrupoPrestamo;
use App\Models\User;
use App\Models\Asignatura;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class GrupoController extends Controller
{
    public function index()
    {
        return Grupo::with(['usuarios', 'prestamos', 'asignatura', 'docente'])->get();
    }

    public function show($id)
    {
        return Grupo::with(['usuarios', 'prestamos', 'asignatura', 'docente'])->findOrFail($id);
    }

    public function store(Request $request)
    {
        $grupo = Grupo::create($request->only(['nombre', 'asignatura_id', 'docente_id']));
        if ($request->has('usuarios')) {
            $grupo->usuarios()->sync($request->input('usuarios'));
        }
        return response()->json($grupo->load(['usuarios', 'asignatura', 'docente']), 201);
    }

    public function update(Request $request, $id)
    {
        $grupo = Grupo::findOrFail($id);
        $grupo->update($request->only(['nombre', 'asignatura_id', 'docente_id']));
        if ($request->has('usuarios')) {
            $grupo->usuarios()->sync($request->input('usuarios'));
        }
        return response()->json($grupo->load(['usuarios', 'asignatura', 'docente']));
    }

    public function destroy($id, Request $request)
    {
        $user = $request->user();
        if (!$user->hasRole('ADMIN')) {
            return response()->json([
                'error' => 'No tienes permisos para eliminar grupos.'
            ], 403);
        }
        $grupo = Grupo::findOrFail($id);
        $grupo->delete();
        return response()->json(['message' => 'Grupo eliminado']);
    }

    public function addUsuario(Request $request, $id)
    {
        $grupo = Grupo::findOrFail($id);
        $usuarioId = $request->input('usuario_id');
        $grupo->usuarios()->attach($usuarioId);
        return response()->json($grupo->load('usuarios'));
    }

    public function removeUsuario(Request $request, $id)
    {
        $grupo = Grupo::findOrFail($id);
        $usuarioId = $request->input('usuario_id');
        $grupo->usuarios()->detach($usuarioId);
        return response()->json($grupo->load('usuarios'));
    }

    public function asignarPrestamo(Request $request, $id)
    {
        $grupo = Grupo::findOrFail($id);
        $prestamoId = $request->input('prestamo_id');
        $grupo->prestamos()->attach($prestamoId);
        return response()->json($grupo->load('prestamos'));
    }

    public function quitarPrestamo(Request $request, $id)
    {
        $grupo = Grupo::findOrFail($id);
        $prestamoId = $request->input('prestamo_id');
        $grupo->prestamos()->detach($prestamoId);
        return response()->json($grupo->load('prestamos'));
    }
}
