<?php

namespace App\Http\Controllers\Prestamo;

use App\Http\Controllers\Controller;
use App\Http\Requests\Prestamo\StorePrestamoAlumnoRequest;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use App\Models\Prestamo;
use App\Models\BloquePrestamo;
use App\Services\PrestamoService;

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
                    'equipos.tipo',                    
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
    public function store(StorePrestamoAlumnoRequest $request, PrestamoService $service)
    {
        DB::beginTransaction();

        try {
            $user = Auth::user();

            if ($user?->bloqueado) {
                return response()->json([
                    'message' => 'Alumno bloqueado. No puedes solicitar equipos hasta resolver el incidente.',
                    'motivo' => $user->bloqueado_motivo,
                    'fecha' => $user->bloqueado_fecha
                ], 403);
            }

            $prestamo = $service->crearPrestamo([
                'idUser'       => $user->idUser,
                'fecha_inicio' => $request->fecha_inicio,
                'fecha_fin'    => $request->fecha_fin,
                'otra_motivo'  => $request->motivo,
                'tipo'         => $request->tipo,
                'estado'       => 'PENDIENTE',
                'observacion'  => $request->observacion,
            ]);

            if ($request->tipo === 'DENTRO') {
                $service->asignarBloques(
                    $prestamo->idPrestamo,
                    $request->bloques,
                    $request->asignatura
                );
            }

            // 🔥 AQUÍ ESTABA EL ERROR
            if ($request->has('equipos')) {
                $service->procesarEquipos(
                    $prestamo->idPrestamo,
                    $request->equipos
                );
            }

            DB::commit();

            return response()->json([
                'message'    => 'Solicitud enviada correctamente',
                'idPrestamo' => $prestamo->idPrestamo
            ], 201);

        } catch (\Exception $e) {
            DB::rollBack();
            if ($e->getCode() === 403 && $e->getMessage() === 'ALUMNO_BLOQUEADO') {
                return response()->json([
                    'message' => 'Alumno bloqueado. No puedes solicitar equipos hasta resolver el incidente.',
                    'motivo' => $user->bloqueado_motivo ?? null,
                    'fecha' => $user->bloqueado_fecha ?? null
                ], 403);
            }
            return response()->json(['error' => $e->getMessage()], 400);
        }
    }



}
