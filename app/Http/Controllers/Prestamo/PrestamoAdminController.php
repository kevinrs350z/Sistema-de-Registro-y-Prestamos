<?php

namespace App\Http\Controllers\Prestamo;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Models\Prestamo;
use App\Models\Observacion;

class PrestamoAdminController extends Controller
{
    /* ============================================================
       🔹 CAMBIAR ESTADO (APROBAR / RECHAZAR)
    ============================================================ */
    public function cambiarEstado(Request $request)
    {
        $user = auth()->user();

        if (!$user->isAdmin()) {
            return response()->json(['message' => 'No autorizado'], 403);
        }

        $idPrestamo = $request->input('id');
        $accion     = strtolower($request->input('accion'));
        $motivo     = trim($request->input('motivo'));

        // ❗ Corrección del error: variable mal escrita ($AidPrestamo)
        $prestamo = Prestamo::find($idPrestamo);

        if (!$prestamo) {
            return response()->json(['message' => 'Préstamo no encontrado'], 404);
        }

        if ($accion === 'aceptar') {
            $prestamo->estado = 'aceptado';
        } elseif ($accion === 'rechazar') {
            $prestamo->estado = 'rechazado';
        } else {
            return response()->json(['message' => 'Acción inválida'], 400);
        }

        $prestamo->save();

        Observacion::create([
            'idPrestamo'  => $prestamo->idPrestamo,
            'descripcion' => $motivo ?: 'Sin motivo especificado',
            'estado'      => $accion === 'aceptar' ? 'aprobacion' : 'rechazo',
        ]);

        return response()->json([
            'message' => 'Estado del préstamo actualizado correctamente',
            'prestamo' => $prestamo
        ]);
    }

    /* ============================================================
       🔹 LISTAR PRÉSTAMOS PENDIENTES
    ============================================================ */
    public function pendientes()
    {
        $user = auth()->user();

        if (!$user->isAdmin()) {
            return response()->json(['message' => 'No autorizado'], 403);
        }

        $prestamos = Prestamo::with([
            'user.persona',
            'equipos.tipo',
            'bloquePrestamo.bloque'
        ])
        ->where('estado', 'pendiente')
        ->get();

        $data = $prestamos->map(function ($p) {

            $bloquesTexto = null;
            if ($p->bloquePrestamo && $p->bloquePrestamo->count() > 0) {
                $bloquesTexto = $p->bloquePrestamo
                    ->map(fn($bp) => $bp->bloque->nombre ?? "Bloque {$bp->idBloque}")
                    ->join(', ');
            }

            return [
                'idPrestamo' => $p->idPrestamo,
                'user' => [
                    'nombre' => $p->user->persona->Nombre ?? 'Desconocido',
                    'email' => $p->user->Email ?? ''
                ],
                'tipo' => $p->tipo,
                'fecha_inicio' => $p->fecha_inicio,
                'fecha_fin' => $p->fecha_fin,
                'bloquePrestamo' => $bloquesTexto,
                'equipos' => $p->equipos->map(function ($e) {
                    return [
                        'nombre' => $e->tipo->nombre ?? 'Sin nombre',
                        'codigo_activo' => $e->codigo ?? '—'
                    ];
                }),
                'observacion' => $p->observacion ?? 'Sin observación',
                'estado' => $p->estado ?? 'pendiente',
                'created_at' => $p->created_at,
            ];
        });

        return response()->json($data);
    }

    /* ============================================================
       🔹 LISTAR HISTORIAL (NO PENDIENTES)
    ============================================================ */
    public function historial()
    {
        $user = auth()->user();

        if (!$user->isAdmin()) {
            return response()->json(['message' => 'No autorizado'], 403);
        }

        $prestamos = Prestamo::with([
            'user.persona',
            'equipos.tipo',
            'bloquePrestamo.bloque'
        ])
        ->where('estado', '!=', 'pendiente')
        ->get();

        $data = $prestamos->map(function ($p) {

            $bloquesTexto = null;
            if ($p->bloquePrestamo && $p->bloquePrestamo->count() > 0) {
                $bloquesTexto = $p->bloquePrestamo
                    ->map(fn($bp) => $bp->bloque->nombre ?? "Bloque {$bp->idBloque}")
                    ->join(', ');
            }

            return [
                'idPrestamo' => $p->idPrestamo,
                'user' => [
                    'nombre' => $p->user->persona->Nombre ?? 'Desconocido',
                    'email' => $p->user->Email ?? ''
                ],
                'tipo' => $p->tipo,
                'fecha_inicio' => $p->fecha_inicio,
                'fecha_fin' => $p->fecha_fin,
                'bloquePrestamo' => $bloquesTexto,
                'equipos' => $p->equipos->map(function ($e) {
                    return [
                        'nombre' => $e->tipo->nombre ?? 'Sin nombre',
                        'codigo_activo' => $e->codigo ?? '—'
                    ];
                }),
                'observacion' => $p->observacion ?? 'Sin observación',
                'estado' => $p->estado,
                'created_at' => $p->created_at,
            ];
        });

        return response()->json($data);
    }
}
