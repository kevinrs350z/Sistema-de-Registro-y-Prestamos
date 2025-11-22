<?php

namespace App\Http\Controllers\Prestamo;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use App\Models\Prestamo;
use App\Models\BloquePrestamo;
use App\Models\PrestamoEquipo;

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
                    'equipos',                       // ✅ ahora plural
                    'bloquePrestamo.bloque',
                    'bloquePrestamo.asignatura',
                    'user',
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
        // 1️⃣ Validación base
        $request->validate([
            'equipos'       => 'required|array|min:1',
            // OJO: aquí asumo que la PK de equipos es "id"
            'equipos.*'     => 'integer|exists:equipos,id',

            'tipo'          => 'required|string|in:DENTRO,FUERA',
            'asignatura'    => 'nullable|integer|exists:asignaturas,idAsignatura',
            'motivo'        => 'nullable|string|max:500',
            'observacion'   => 'nullable|string|max:500',
        ]);

        // 2️⃣ Validaciones adicionales según tipo
        if ($request->tipo === 'DENTRO') {
            $request->validate([
                'bloques'   => 'required|array|min:1',
                'bloques.*' => 'integer|exists:bloques,idBloque',
            ]);
        } else { // tipo === 'FUERA'
            $request->validate([
                'fecha_inicio' => 'required|date',
                'fecha_fin'    => 'required|date|after_or_equal:fecha_inicio',
            ]);
        }

        $usuario = Auth::user();

        if (!$usuario) {
            return response()->json(['error' => 'Usuario no autenticado'], 401);
        }

        $usuarioId = $usuario->idUser;

        DB::beginTransaction();

        try {
            // 3️⃣ Crear UN SOLO préstamo (cabecera)
            $prestamo = Prestamo::create([
                'idUser'       => $usuarioId,
                'fecha_inicio' => $request->filled('fecha_inicio') ? $request->fecha_inicio : null,
                'fecha_fin'    => $request->filled('fecha_fin') ? $request->fecha_fin : null,
                'otra_motivo'  => $request->motivo ?: null,
                'tipo'         => $request->tipo,
                'estado'       => 'pendiente',
                'observacion'  => $request->observacion ?: null,
            ]);

            // 4️⃣ Asociar equipos en la tabla pivot prestamo_equipo
            foreach ($request->equipos as $idEquipo) {
                PrestamoEquipo::create([
                    'idPrestamo' => $prestamo->idPrestamo,
                    'idEquipo'   => $idEquipo,
                ]);
            }

            // 5️⃣ Si el préstamo es DENTRO, vincular bloques y asignatura
            if ($request->tipo === 'DENTRO' && $request->bloques) {
                foreach ($request->bloques as $idBloque) {
                    BloquePrestamo::create([
                        'idPrestamo'   => $prestamo->idPrestamo,
                        'idBloque'     => $idBloque,
                        'idAsignatura' => $request->asignatura,
                    ]);
                }
            }

            // 6️⃣ Cargar relaciones para responder bonito
            $prestamo->load(
                'user',
                'equipos',
                'bloquePrestamo.bloque',
                'bloquePrestamo.asignatura'
            );

            DB::commit();

            return response()->json([
                'message'  => '✅ Préstamo creado correctamente.',
                'prestamo' => $prestamo,
            ], 201);
        } catch (\Exception $e) {
            DB::rollBack();

            return response()->json([
                'error'   => '❌ Error al crear el préstamo.',
                'message' => $e->getMessage(),
            ], 500);
        }
    }
}
