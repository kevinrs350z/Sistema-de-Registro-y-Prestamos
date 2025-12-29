<?php

namespace App\Services\Prestamos;

use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Facades\Log;

use App\Models\Prestamo;
use App\Models\Observacion;
use App\Mail\PrestamoAprobadoMail;
use App\Mail\PrestamoRechazadoMail;

use App\Enums\EstadoPrestamo;
use App\Enums\EstadoEquipo;

use Illuminate\Support\Facades\DB;
use App\Models\Equipo;

class PrestamoAdminService
{
    /* ============================================================
        APROBAR O RECHAZAR
    ============================================================ */
    public function cambiarEstado(  
        int $idPrestamo,
        string $accion,
        string $motivo
    ): void {
        $prestamo = Prestamo::with(['user.persona', 'equipos.tipo'])
            ->findOrFail($idPrestamo);

        $nuevoEstado = $accion === 'aprobar'
            ? EstadoPrestamo::APROBADO
            : EstadoPrestamo::RECHAZADO;

        $prestamo->estado = $nuevoEstado;
        $prestamo->save();

        $nombre = $prestamo->user->persona->Nombre ?? 'Usuario';
        $email  = $prestamo->user->Email ?? null;

        $equipos = $prestamo->equipos->map(fn ($e) => [
            'nombre' => $e->tipo->nombre ?? 'Equipo',
            'codigo' => $e->codigo ?? '—'
        ]);

        if ($email) {
            try {
                if ($accion === 'aprobar') {
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
            } catch (\Throwable $e) {
                Log::error('Error al enviar correo de préstamo', [
                    'prestamo_id' => $prestamo->idPrestamo,
                    'error' => $e->getMessage()
                ]);
            }
        }
    }

    /* ============================================================
        MARCAR DEVUELTO
    ============================================================ */
    public function marcarDevuelto(
        int $idPrestamo,
        string $motivo
    ): void {
        $prestamo = Prestamo::with(['equipos'])
            ->findOrFail($idPrestamo);

        if ($prestamo->estado !== EstadoPrestamo::APROBADO) {
            throw new \Exception('Solo préstamos APROBADOS pueden devolverse.');
        }

        $prestamo->estado = EstadoPrestamo::DEVUELTO;
        $prestamo->save();

        Observacion::create([
            'idPrestamo' => $prestamo->idPrestamo,
            'motivo'     => $motivo,
            'tipo'       => 'DEVOLUCION'
        ]);

        foreach ($prestamo->equipos as $equipo) {
            $equipo->estado = EstadoEquipo::DISPONIBLE;
            $equipo->save();
        }
    }



    public function devolverEquipo(
        int $idPrestamo,
        int $idEquipo,
        string $motivo
    ): void {

        DB::transaction(function () use ($idPrestamo, $idEquipo, $motivo) {

            $prestamo = Prestamo::with('equipos')->findOrFail($idPrestamo);

            if ($prestamo->estado !== EstadoPrestamo::APROBADO) {
                throw new \Exception('El préstamo no está en estado APROBADO.');
            }

            // 1️⃣ Marcar equipo como devuelto SOLO en este préstamo
            DB::table('prestamo_equipo')
                ->where('idPrestamo', $idPrestamo)
                ->where('idEquipo', $idEquipo)
                ->update(['devuelto' => true]);

            // 2️⃣ Liberar el equipo
            Equipo::where('id', $idEquipo)
                ->update(['estado' => EstadoEquipo::DISPONIBLE]);

            // 3️⃣ Registrar observación
            Observacion::create([
                'idPrestamo' => $idPrestamo,
                'motivo'     => $motivo,
                'tipo'       => 'DEVOLUCION_PARCIAL'
            ]);

            // 4️⃣ ¿Quedan equipos sin devolver?
            $pendientes = DB::table('prestamo_equipo')
                ->where('idPrestamo', $idPrestamo)
                ->where('devuelto', false)
                ->count();

            // 5️⃣ Si NO quedan → préstamo DEVUELTO
            if ($pendientes === 0) {
                $prestamo->estado = EstadoPrestamo::DEVUELTO;
                $prestamo->save();
            }
        });
    }

    /* ============================================================
        LISTADOS
    ============================================================ */
    public function obtenerPendientes()
    {
        return Prestamo::with([
            'user.persona',
            'equipos.tipo',
            'bloquePrestamo.bloque'
        ])
        ->where('estado', EstadoPrestamo::PENDIENTE)
        ->get()
        ->map(function ($p) {

            $persona = optional($p->user)->persona;

            $bloquesTexto = null;
            if ($p->bloquePrestamo && $p->bloquePrestamo->count() > 0) {
                $bloquesTexto = $p->bloquePrestamo
                    ->map(function ($bp) {
                        return optional($bp->bloque)->nombre ?? "Bloque {$bp->idBloque}";
                    })
                    ->join(', ');
            }

            return [
                'idPrestamo' => $p->idPrestamo,
                'estado' => $p->estado,
                'tipo' => $p->tipo,
                'observacion' => $p->observacion,
                'created_at' => $p->created_at,
                'fecha_inicio' => $p->fecha_inicio,
                'fecha_fin' => $p->fecha_fin,

                'user' => [
                    'nombre' => $persona?->Nombre,
                    'email'  => $persona?->Email,
                ],

                'bloquePrestamo' => $bloquesTexto,

                'equipos' => $p->equipos->map(function ($e) {
                    return [
                        'codigo' => $e->codigo,
                        'nombre' => optional($e->tipo)->nombre ?? 'Equipo',
                        'imagen' => $e->imagen,
                        'devuelto' => (bool) ($e->pivot->devuelto ?? false),
                    ];
                }),
            ];
        });

    }



    public function obtenerHistorial()
    {
        return Prestamo::with([
            'user.persona',
            'equipos.tipo',
            'bloquePrestamo.bloque'
        ])
        ->where('estado', '!=', EstadoPrestamo::PENDIENTE)
        ->get()
            ->map(function ($p) {

                $persona = optional($p->user)->persona;

                $bloquesTexto = null;
                if ($p->bloquePrestamo && $p->bloquePrestamo->count() > 0) {
                    $bloquesTexto = $p->bloquePrestamo
                        ->map(function ($bp) {
                            return optional($bp->bloque)->nombre ?? "Bloque {$bp->idBloque}";
                        })
                        ->join(', ');
                }

                return [
                    'idPrestamo' => $p->idPrestamo,
                    'estado' => $p->estado,
                    'tipo' => $p->tipo,
                    'observacion' => $p->observacion,
                    'created_at' => $p->created_at,
                    'fecha_inicio' => $p->fecha_inicio,
                    'fecha_fin' => $p->fecha_fin,

                    'user' => [
                        'nombre' => $persona?->Nombre,
                        'email'  => $persona?->Email,
                    ],

                    'bloquePrestamo' => $bloquesTexto,

                    'equipos' => $p->equipos->map(function ($e) {
                        return [
                            'id'       => $e->id,
                            'codigo' => $e->codigo,
                            'nombre' => optional($e->tipo)->nombre ?? 'Equipo',
                            'imagen' => $e->imagen,
                            'devuelto' => (bool) ($e->pivot->devuelto ?? false),
                        ];
                    }),
                ];
            });

    }

}
