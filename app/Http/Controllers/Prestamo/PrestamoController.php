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
    // =========================================================
    // LISTAR PRÉSTAMOS DEL USUARIO AUTENTICADO
    // =========================================================
    public function index(Request $request)
    {
        try {
            $user = Auth::user();

            if (!$user) {
                return response()->json(['error' => 'Usuario no autenticado'], 401);
            }

            $prestamos = Prestamo::with([
                    'equipos',                    // relación muchos a muchos
                    'bloquePrestamo.bloque',
                    'bloquePrestamo.asignatura'
                ])
                ->where('idUser', $user->idUser)
                ->orderByDesc('idPrestamo')
                ->get();

            return response()->json($prestamos);

        } catch (\Exception $e) {
            return response()->json([
                'error'   => 'Error al obtener las solicitudes.',
                'message' => $e->getMessage(),
            ], 500);
        }
    }

    // =========================================================
    // CREAR NUEVO PRÉSTAMO (CON CARRITO)
    // =========================================================
    public function store(Request $request)
    {
        // Validación base (no toco tus nombres)
        $request->validate([
            'idUser'       => 'required|integer|exists:users,idUser',
            'tipo'         => 'required|string|in:DENTRO,FUERA',
            'asignatura'   => 'nullable',
            'motivo'       => 'nullable|string',
            'observacion'  => 'nullable|string',
            'fecha_inicio' => 'nullable|date',
            'fecha_fin'    => 'nullable|date|after_or_equal:fecha_inicio',
            'bloques'      => 'required_if:tipo,DENTRO|array',
            'bloques.*'    => 'integer|exists:bloques,idBloque',

            'equipos' => 'required|array|min:1',

            'equipos.*.idTipoEquipo'        => 'required|integer|exists:tipo_equipos,id',
            'equipos.*.cantidad'           => 'required|integer|min:1',
            'equipos.*.modo'               => 'required|in:cualquiera,especifico',
            'equipos.*.equiposSeleccionados' => 'array',
        ]);

        DB::beginTransaction();

        try {
            // =======================================
            // CREAR REGISTRO EN TABLA PRESTAMOS
            // =======================================

            // Por seguridad, usamos el usuario autenticado
            $user = Auth::user();
            if (!$user) {
                return response()->json(['error' => 'Usuario no autenticado'], 401);
            }

            $prestamo = Prestamo::create([
                'idUser'       => $user->idUser,               // ignoramos idUser enviado
                'fecha_inicio' => $request->fecha_inicio,
                'fecha_fin'    => $request->fecha_fin,
                'otra_motivo'  => $request->motivo,
                'tipo'         => $request->tipo,
                'estado'       => 'pendiente',
                'observacion'  => $request->observacion,
            ]);

            // =======================================
            // BLOQUES (SOLO SI TIPO = DENTRO)
            // =======================================
            if ($request->tipo === 'DENTRO' && is_array($request->bloques)) {
                foreach ($request->bloques as $idBloque) {
                    BloquePrestamo::create([
                        'idPrestamo'   => $prestamo->idPrestamo,
                        'idBloque'     => $idBloque,
                        'idAsignatura' => $request->asignatura,
                    ]);
                }
            }

            // =======================================
            // PROCESAR CARRITO DE EQUIPOS
            // =======================================
            foreach ($request->equipos as $item) {
                $idTipo   = $item['idTipoEquipo'];
                $cantidad = $item['cantidad'];
                $modo     = $item['modo'];

                // -----------------------------------
                // MODO: ESPECÍFICO
                // -----------------------------------
                if ($modo === 'especifico') {
                    $idsSeleccionados = $item['equiposSeleccionados'] ?? [];

                    if (count($idsSeleccionados) !== $cantidad) {
                        DB::rollBack();
                        return response()->json([
                            'error' => "Debes seleccionar exactamente $cantidad equipos para el tipo $idTipo."
                        ], 400);
                    }

                    // Verificar que todos existan, sean de ese tipo y estén disponibles
                    $disponibles = DB::table('equipos')
                        ->whereIn('id', $idsSeleccionados)
                        ->where('tipo_equipo_id', $idTipo)
                        ->where('estado', 'disponible')
                        ->count();

                    if ($disponibles !== $cantidad) {
                        DB::rollBack();
                        return response()->json([
                            'error' => "Algunos de los equipos seleccionados ya no están disponibles."
                        ], 400);
                    }

                    // Asignar cada equipo específico al préstamo
                    foreach ($idsSeleccionados as $idEquipo) {
                        DB::table('prestamo_equipo')->insert([
                            'idPrestamo' => $prestamo->idPrestamo,
                            'idEquipo'   => $idEquipo,
                            'created_at' => now(),
                            'updated_at' => now(),
                        ]);

                        DB::table('equipos')
                            ->where('id', $idEquipo)
                            ->update(['estado' => 'prestado']);
                    }

                    // continuar al siguiente item del carrito
                    continue;
                }

                // -----------------------------------
                // MODO: CUALQUIERA
                // -----------------------------------
                $equiposDisponibles = DB::table('equipos')
                    ->where('tipo_equipo_id', $idTipo)
                    ->where('estado', 'disponible')
                    ->limit($cantidad)
                    ->pluck('id');

                if ($equiposDisponibles->count() < $cantidad) {
                    DB::rollBack();
                    return response()->json([
                        'error' => "Stock insuficiente para el tipo de equipo $idTipo."
                    ], 400);
                }

                foreach ($equiposDisponibles as $idEquipo) {
                    DB::table('prestamo_equipo')->insert([
                        'idPrestamo' => $prestamo->idPrestamo,
                        'idEquipo'   => $idEquipo,
                        'created_at' => now(),
                        'updated_at' => now(),
                    ]);

                    DB::table('equipos')
                        ->where('id', $idEquipo)
                        ->update(['estado' => 'prestado']);
                }
            }

            DB::commit();

            return response()->json([
                'message'  => 'Préstamo creado correctamente.',
                'idPrestamo' => $prestamo->idPrestamo
            ], 201);

        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json([
                'error'   => 'Error al crear el préstamo.',
                'message' => $e->getMessage(),
            ], 500);
        }
    }
}
