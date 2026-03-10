<?php

namespace App\Http\Controllers\Prestamo;

use App\Http\Controllers\Controller;
use App\Http\Requests\Prestamo\StorePrestamoAdminRequest;
use App\Services\PrestamoService;
use App\Models\Asignatura;
use App\Events\PrestamoCreated;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;

class AdminPrestamoController extends Controller
{
    public function store(StorePrestamoAdminRequest $request, PrestamoService $service)
    {
        DB::beginTransaction();

        try {
            // Obtener asignatura - puede venir como nombre o como ID
            $asignaturaInput = $request->asignatura;
            $asignaturaId = null;

            if ($asignaturaInput === 'OTROS') {
                // Cuando es OTROS, no se asocia ninguna asignatura
                $asignaturaId = null;
            } elseif (is_numeric($asignaturaInput)) {
                $asignaturaId = (int) $asignaturaInput;
            } elseif (is_string($asignaturaInput) && trim($asignaturaInput) !== '') {
                // Buscar asignatura por nombre (case insensitive)
                $asignaturaId = Asignatura::whereRaw('LOWER(nombre) = ?', [mb_strtolower(trim($asignaturaInput))])->value('idAsignatura');
            }

            $prestamo = $service->crearPrestamo([
                'idUser'           => $request->idUserAlumno,
                'fecha_inicio'     => $request->fecha_inicio,
                'fecha_fin'        => $request->fecha_fin,
                'tipo'             => $request->tipo,
                'estado'           => 'APROBADO',
                'observacion'      => $request->observacion,
                'otra_motivo'      => $request->motivo,
                'aprobado_por'     => Auth::id(),
                'fecha_aprobacion' => now(),
            ]);

            if ($request->tipo === 'DENTRO') {
                $service->asignarBloques(
                    $prestamo->idPrestamo,
                    $request->bloques,
                    $asignaturaId
                );
            }

            $service->procesarEquipos($prestamo->idPrestamo, $request->equipos);

            DB::commit();

            // 🔔 EMITIR EVENTO SSE: Nueva solicitud de préstamo creada por admin
            event(new PrestamoCreated($prestamo));

            return response()->json([
                'message'    => 'Préstamo registrado correctamente',
                'idPrestamo' => $prestamo->idPrestamo
            ], 201);

        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json(['error' => $e->getMessage()], 400);
        }
    }
}
