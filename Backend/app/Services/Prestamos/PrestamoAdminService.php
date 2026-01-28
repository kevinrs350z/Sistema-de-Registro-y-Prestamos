<?php

namespace App\Services\Prestamos;

use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Facades\Log;

use App\Models\Prestamo;
use App\Models\Observacion;
use App\Models\PrestamoHistorial;
use App\Models\User;
use App\Mail\PrestamoAprobadoMail;
use App\Mail\PrestamoRechazadoMail;

use App\Enums\EstadoPrestamo;
use App\Enums\EstadoEquipo;

use Illuminate\Support\Facades\DB;
use App\Models\Equipo;
use App\Services\PrestamoService;
use App\Models\Evento;


class PrestamoAdminService
{
    public function __construct(
        private PrestamoService $prestamoService
    ) {}
    /* ============================================================
        APROBAR O RECHAZAR
    ============================================================ */
    public function cambiarEstado(
        int $idPrestamo,
        string $accion,
        ?string $motivo
    ): void {
        $prestamo = Prestamo::with(['user.persona', 'equipos.tipo'])
            ->findOrFail($idPrestamo);

        $estadoAnterior = $prestamo->estado;

        $nuevoEstado = $accion === 'aprobar'
            ? EstadoPrestamo::APROBADO
            : EstadoPrestamo::RECHAZADO;

        // Guardamos estado
        $prestamo->estado = $nuevoEstado;
        if (!is_null($motivo) && trim($motivo) !== '') {
            $prestamo->observacion = $motivo;
        }
        $prestamo->save();

        // 🔹 REGISTRAR EN HISTORIAL DE CAMBIOS
        $userId = auth()->id() ?? auth('sanctum')->user()?->idUser;
        $this->registrarHistorial(
            $prestamo->idPrestamo,
            $userId,
            $estadoAnterior,
            $nuevoEstado,
            $motivo
        );

        // Si se rechaza, liberar equipos a DISPONIBLE
        if ($accion === 'rechazar') {
            foreach ($prestamo->equipos as $equipo) {
                $equipo->estado = EstadoEquipo::DISPONIBLE;
                $equipo->save();
            }
        }

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

        $estadoAnterior = $prestamo->estado;

        if ($prestamo->estado !== EstadoPrestamo::ENTREGADO) {
            throw new \Exception('Solo préstamos ENTREGADOS pueden marcarse como devueltos.');
        }

        $prestamo->estado = EstadoPrestamo::DEVUELTO;
        $prestamo->save();

        // 🔹 REGISTRAR EN HISTORIAL DE CAMBIOS
        $userId = auth()->id() ?? auth('sanctum')->user()?->idUser;
        $this->registrarHistorial(
            $prestamo->idPrestamo,
            $userId,
            $estadoAnterior,
            EstadoPrestamo::DEVUELTO,
            $motivo
        );

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

            if ($prestamo->estado !== EstadoPrestamo::ENTREGADO) {
                throw new \Exception('El préstamo no está en estado ENTREGADO.');
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
                'idPrestamo'  => $idPrestamo,
                'idUser'      => auth()->id() ?? auth('sanctum')->user()?->idUser,
                'descripcion' => $motivo,
                'tipo'        => 'DEVOLUCION_PARCIAL',
                'estado'      => 'habilitado'
            ]);

            // 4️⃣ ¿Quedan equipos sin devolver?
            $pendientes = DB::table('prestamo_equipo')
                ->where('idPrestamo', $idPrestamo)
                ->where('devuelto', false)
                ->count();

            // 5️⃣ Si NO quedan → préstamo DEVUELTO
            if ($pendientes === 0) {
                $estadoAnterior = $prestamo->estado;
                $prestamo->estado = EstadoPrestamo::DEVUELTO;
                $prestamo->save();

                $userId = auth()->id() ?? auth('sanctum')->user()?->idUser;
                $this->registrarHistorial(
                    $prestamo->idPrestamo,
                    $userId,
                    $estadoAnterior,
                    EstadoPrestamo::DEVUELTO,
                    'Todos los equipos devueltos'
                );
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
        ->whereIn('estado', [
            EstadoPrestamo::PENDIENTE,
            EstadoPrestamo::APROBADO,
        ])
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

    public function crearPrestamoAdmin(array $data, $request)
    {
        
        $data['origen'] = 'ADMIN';
        // 1️⃣ EVENTO
        if ($request->tipo === 'EVENTO') {

            $evento = Evento::create([
                'nombre_evento'      => $request->nombre_evento,
                'fecha_inicio'       => $request->fecha_inicio,
                'fecha_fin'          => $request->fecha_fin,
                'responsable_nombre' => $request->profesor,
                'descripcion'        => $request->observacion,
            ]);

            $prestamo = Prestamo::create(
                array_merge($data, [
                    'evento_id' => $evento->id,
                ]));

        } else {

            // 2️⃣ ASIGNATURA / NORMAL
           
            $prestamo = Prestamo::create(
                array_merge($data, [
                    'fecha_inicio' => null, 
                    'fecha_fin'    => null, 
                ])
            );

            $this->prestamoService->asignarBloques(
                $prestamo->idPrestamo,
                $request->bloques,
                $request->asignatura
            );
        }

        // 3️⃣ EQUIPOS (IGUAL PARA TODOS)
        $this->prestamoService->procesarEquipos(
            $prestamo->idPrestamo,
            $request->equipos
        );

        return $prestamo;
    }

    /* ============================================================
        MARCAR ENTREGADO
    ============================================================ */
    public function marcarEntregado(
        int $idPrestamo,
        int $adminId
    ): void {
        DB::transaction(function () use ($idPrestamo, $adminId) {
            
            // 1️⃣ OBTENER PRÉSTAMO
            $prestamo = Prestamo::findOrFail($idPrestamo);

            $estadoAnterior = $prestamo->estado;

            // 2️⃣ VALIDAR: Solo APROBADO → ENTREGADO
            if ($prestamo->estado !== EstadoPrestamo::APROBADO) {
                throw new \Exception(
                    "Solo préstamos en estado APROBADO pueden marcarse como ENTREGADO. " .
                    "Estado actual: {$prestamo->estado}"
                );
            }

            // 3️⃣ VALIDAR QUE QUIEN EJECUTA SEA ADMIN
            $admin = User::findOrFail($adminId);
            if (!$admin->isAdmin()) {
                throw new \Exception('Solo un administrador puede marcar un préstamo como ENTREGADO.');
            }

            // 4️⃣ CAMBIAR ESTADO
            $prestamo->estado = EstadoPrestamo::ENTREGADO;
            $prestamo->save();

            // 5️⃣ REGISTRAR EN HISTORIAL DE CAMBIOS
            $this->registrarHistorial(
                $prestamo->idPrestamo,
                $adminId,
                $estadoAnterior,
                EstadoPrestamo::ENTREGADO,
                'Entrega física realizada'
            );

            // 6️⃣ LOG DE AUDITORÍA
            Log::info('Préstamo marcado como ENTREGADO', [
                'idPrestamo'   => $idPrestamo,
                'admin_id'     => $adminId,
                'admin_nombre' => $admin->persona?->Nombre ?? 'Admin',
                'timestamp'    => now(),
            ]);
        });
    }

    private function registrarHistorial(
        int $idPrestamo,
        ?int $idUser,
        string $estadoAnterior,
        string $estadoNuevo,
        ?string $descripcion = null
    ): void {
        if (!$idUser) {
            return;
        }

        PrestamoHistorial::create([
            'idPrestamo'     => $idPrestamo,
            'idUser'         => $idUser,
            'estado_anterior'=> $estadoAnterior,
            'estado_nuevo'   => $estadoNuevo,
            'descripcion'    => $descripcion,
        ]);
    }




}
