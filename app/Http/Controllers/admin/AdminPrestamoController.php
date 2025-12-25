<?php

namespace App\Http\Controllers\Prestamo;

use App\Http\Controllers\Controller;
use App\Http\Requests\Prestamo\StorePrestamoAdminRequest;
use App\Services\PrestamoService;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;

class AdminPrestamoController extends Controller
{
    public function store(StorePrestamoAdminRequest $request, PrestamoService $service)
    {
        DB::beginTransaction();

        try {
            $prestamo = $service->crearPrestamo([
                'idUser'           => $request->idUserAlumno,
                'fecha_inicio'     => $request->fecha_inicio,
                'fecha_fin'        => $request->fecha_fin,
                'tipo'             => $request->tipo,
                'estado'           => 'APROBADO',
                'observacion'      => $request->observacion,
                'aprobado_por'     => Auth::id(),
                'fecha_aprobacion' => now(),
            ]);

            if ($request->tipo === 'DENTRO') {
                $service->asignarBloques(
                    $prestamo->idPrestamo,
                    $request->bloques,
                    $request->asignatura
                );
            }

            $service->procesarEquipos($prestamo->idPrestamo, $request->equipos);

            DB::commit();

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
