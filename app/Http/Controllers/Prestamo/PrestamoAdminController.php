<?php

namespace App\Http\Controllers\Prestamo;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Models\Prestamo;
use App\Models\Observacion;
use App\Mail\PrestamoAprobadoMail;
use App\Mail\PrestamoRechazadoMail;
use Illuminate\Support\Facades\Mail;

class PrestamoAdminController extends Controller
{
    public function marcarDevuelto(Request $request, $id)
    {
        $user = auth()->user();
        if (!$user->isAdmin()) {
            return response()->json(['message' => 'No autorizado'], 403);
        }

        $motivo = trim($request->input('motivo'));
        if ($motivo === '') {
            return response()->json(['message' => 'Debe ingresar un motivo'], 422);
        }

        $prestamo = Prestamo::with(['user.persona', 'equipos'])->find($id);

        if (!$prestamo) {
            return response()->json(['message' => 'Préstamo no encontrado'], 404);
        }

        // Cambiar estado
        $prestamo->estado = 'devuelto';
        $prestamo->save();

        // Registrar observación
        Observacion::create([
            'idPrestamo' => $prestamo->idPrestamo,
            'motivo' => $motivo,
            'tipo' => 'devolucion'
        ]);

        // Opcional: cambiar estado de los equipos a disponible
        foreach ($prestamo->equipos as $e) {
            $e->estado = 'disponible';
            $e->save();
        }

        return response()->json([
            'message' => 'Préstamo marcado como devuelto correctamente.'
        ]);
    }
public function cambiarEstado(Request $request, $id)
{
    
    $user = auth()->user();
    if (!$user->isAdmin()) {
        return response()->json(['message' => 'No autorizado'], 403);
    }

    $accion = strtolower($request->input('accion'));
    $motivo = trim($request->input('motivo'));
    $prestamo = Prestamo::with(['user.persona', 'equipos'])->find($id);

    if (!$prestamo) return response()->json(['message' => 'Préstamo no encontrado'], 404);

    // Cambiar estado
    $prestamo->estado = $accion === 'aceptar' ? 'aceptado' : 'rechazado';
    $prestamo->save();

    // Obtener datos para el correo
    $nombre = $prestamo->user->persona->Nombre;
    $email  = $prestamo->user->Email;
    $equipos = $prestamo->equipos->map(fn($e) => [
        'nombre' => $e->tipo->nombre,
        'codigo' => $e->codigo
    ]);

    // Enviar correo según acción
    if ($accion === 'aceptar') {
        Mail::to($email)->send(new PrestamoAprobadoMail(
            $nombre,
            $prestamo->idPrestamo,
            $prestamo->created_at->format('d/m/Y H:i'),
            $motivo,
            $equipos
        ));
    } else {
        Mail::to($email)->send(new PrestamoRechazadoMail(
            $nombre,
            $prestamo->idPrestamo,
            $prestamo->created_at->format('d/m/Y H:i'),
            $motivo
        ));
    }

    return response()->json(['message' => 'Estado del préstamo actualizado y correo enviado.']);
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
