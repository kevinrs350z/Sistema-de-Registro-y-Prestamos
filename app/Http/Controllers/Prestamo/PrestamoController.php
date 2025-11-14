<?php

namespace App\Http\Controllers\Prestamo;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use App\Models\Prestamo;
use App\Models\BloquePrestamo;

class PrestamoController extends Controller
{
     public function index(Request $request)
    {
        try {
            $user = Auth::user();

            if (!$user) {
                return response()->json(['error' => 'Usuario no autenticado'], 401);
            }

            $prestamos = Prestamo::with([
                    'equipo',
                    'bloquePrestamo.bloque',
                    'bloquePrestamo.asignatura'
                ])
                ->where('idUser', $user->idUser)
                ->orderByDesc('idPrestamo')
                ->get();

            return response()->json($prestamos);
        } catch (\Exception $e) {
            return response()->json([
                'error' => 'Error al obtener las solicitudes.',
                'message' => $e->getMessage(),
            ], 500);
        }
    }
    public function store(Request $request)
    {
        //  Validación base (común)
        $request->validate([
            'equipos' => 'required|array|min:1',
            'equipos.*' => 'integer|exists:equipos,idEquipo',
            'tipo' => 'required|string|in:DENTRO,FUERA',
            'asignatura' => 'nullable|integer|exists:asignaturas,idAsignatura',
            'motivo' => 'nullable|string|max:500',
            'observacion' => 'nullable|string|max:500',
        ]);

        //  Validaciones adicionales según tipo
        if ($request->tipo === 'DENTRO') {
            $request->validate([
                'bloques' => 'required|array|min:1',
                'bloques.*' => 'integer|exists:bloques,idBloque',
            ]);
        } else { // tipo === 'FUERA'
            $request->validate([
                'fecha_inicio' => 'required|date',
                'fecha_fin' => 'required|date|after_or_equal:fecha_inicio',
            ]);
        }

        $usuarioId = Auth::id();

        DB::beginTransaction();
        try {
            $prestamosCreados = [];

            foreach ($request->equipos as $idEquipo) {
                // 🔹 Crear el préstamo base
                $prestamo = Prestamo::create([
                    'idUser'        => $usuarioId,
                    'idEquipo'      => $idEquipo,
                    'fecha_inicio'  => $request->filled('fecha_inicio') ? $request->fecha_inicio : null,
                    'fecha_fin'     => $request->filled('fecha_fin') ? $request->fecha_fin : null,
                    'otra_motivo'  => $request->motivo ?: null,

                    'tipo'          => $request->tipo,
                    'estado'        => 'pendiente',
                    'observacion'   => $request->observacion ?: null,
                ]);

                // 🔹 Si el préstamo es DENTRO, vincula bloques y asignatura
                if ($request->tipo === 'DENTRO' && $request->bloques) {
                    foreach ($request->bloques as $idBloque) {
                        BloquePrestamo::create([
                            'idPrestamo'   => $prestamo->idPrestamo,
                            'idBloque'     => $idBloque,
                            'idAsignatura' => $request->asignatura,
                        ]);
                    }
                }

                $prestamosCreados[] = $prestamo->load(
                    'user',
                    'equipo',
                    'bloquePrestamo.bloque',
                    'bloquePrestamo.asignatura'
                );
            }

            DB::commit();

            return response()->json([
                'message' => '✅ Préstamos creados correctamente.',
                'prestamos' => $prestamosCreados,
            ], 201);
        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json([
                'error' => '❌ Error al crear los préstamos.',
                'message' => $e->getMessage(),
            ], 500);
        }
    }
}
