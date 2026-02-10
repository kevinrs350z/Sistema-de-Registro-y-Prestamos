<?php

namespace App\Services\Prestamos;

use Illuminate\Support\Facades\Log;

use App\Models\Prestamo;
use App\Models\Observacion;
use App\Models\PrestamoHistorial;
use App\Models\User;
use App\Jobs\SendPrestamoEmailJob;

use App\Enums\EstadoPrestamo;
use App\Enums\EstadoEquipo;

use Illuminate\Support\Facades\DB;
use App\Models\Equipo;
use App\Services\PrestamoService;
use App\Models\Evento;
use Carbon\Carbon;


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
        ])->toArray();

        // 📧 ENVÍO DE CORREO EN SEGUNDO PLANO (NO BLOQUEA)
        if ($email) {
            SendPrestamoEmailJob::dispatch(
                $accion === 'aprobar' ? 'aprobado' : 'rechazado',
                $email,
                $nombre,
                $prestamo->idPrestamo,
                $prestamo->created_at->format('d/m/Y H:i'),
                $motivo,
                $accion === 'aprobar' ? $equipos : null
            );

            Log::info('Job de correo encolado', [
                'prestamo_id' => $prestamo->idPrestamo,
                'accion' => $accion,
                'email' => $email
            ]);
        }
    }

    /* ============================================================
        MARCAR DEVUELTO
    ============================================================ */
    public function marcarDevuelto(
        int $idPrestamo,
        ?string $motivo
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
        $motivoFinal = $motivo && trim($motivo) !== ''
            ? $motivo
            : 'Préstamo devuelto por administración.';

        $this->registrarHistorial(
            $prestamo->idPrestamo,
            $userId,
            $estadoAnterior,
            EstadoPrestamo::DEVUELTO,
            $motivoFinal
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

    public function extenderPrestamo(
        int $idPrestamo,
        string $nuevaFecha,
        array $equiposIds,
        ?string $comentario
    ): void {
        DB::transaction(function () use ($idPrestamo, $nuevaFecha, $equiposIds, $comentario) {
            $prestamo = Prestamo::with(['equipos.tipo'])->findOrFail($idPrestamo);

            if (!in_array($prestamo->estado, [EstadoPrestamo::APROBADO, EstadoPrestamo::ENTREGADO], true)) {
                throw new \Exception('Solo préstamos APROBADOS o ENTREGADOS pueden extenderse.');
            }

            $equiposSeleccionados = collect($equiposIds)->unique()->values();

            if ($equiposSeleccionados->isEmpty()) {
                throw new \Exception('Debes seleccionar al menos un equipo para extender.');
            }

            $equiposPrestamo = $prestamo->equipos;
            $idsPrestamo = $equiposPrestamo->pluck('id');

            if ($equiposSeleccionados->diff($idsPrestamo)->isNotEmpty()) {
                throw new \Exception('Algunos equipos seleccionados no pertenecen al préstamo.');
            }

            $pendientesActuales = $equiposPrestamo->filter(fn ($equipo) => !($equipo->pivot->devuelto ?? false))->pluck('id');

            if ($pendientesActuales->isEmpty()) {
                throw new \Exception('No existen equipos pendientes para extender.');
            }

            $pendientesSeleccionados = $equiposSeleccionados->intersect($pendientesActuales);

            if ($pendientesSeleccionados->isEmpty()) {
                throw new \Exception('Los equipos elegidos ya fueron devueltos.');
            }

            $userId = auth()->id() ?? auth('sanctum')->user()?->idUser;

            // 1️⃣ Actualizar fecha límite del préstamo
            $prestamo->fecha_fin = Carbon::parse($nuevaFecha)->endOfDay();
            $prestamo->save();

            // 2️⃣ Registrar observación de extensión
            Observacion::create([
                'idPrestamo'  => $prestamo->idPrestamo,
                'idUser'      => $userId,
                'descripcion' => $comentario ?: 'Extensión del préstamo registrada por administración.',
                'tipo'        => 'EXTENSION',
                'estado'      => 'habilitado'
            ]);

            // 3️⃣ Marcar como devueltos los equipos no seleccionados
            $equiposNoExtender = $pendientesActuales->diff($pendientesSeleccionados);

            if ($equiposNoExtender->isNotEmpty()) {
                DB::table('prestamo_equipo')
                    ->where('idPrestamo', $prestamo->idPrestamo)
                    ->whereIn('idEquipo', $equiposNoExtender->all())
                    ->update(['devuelto' => true]);

                Equipo::whereIn('id', $equiposNoExtender->all())
                    ->update(['estado' => EstadoEquipo::DISPONIBLE]);

                foreach ($equiposPrestamo->whereIn('id', $equiposNoExtender->all()) as $equipoDevuelto) {
                    Observacion::create([
                        'idPrestamo'  => $prestamo->idPrestamo,
                        'idUser'      => $userId,
                        'descripcion' => sprintf(
                            'Extensión: equipo %s (%s) devuelto automáticamente.',
                            $equipoDevuelto->tipo->nombre ?? 'Equipo',
                            $equipoDevuelto->codigo ?? '—'
                        ),
                        'tipo'        => 'DEVOLUCION_PARCIAL',
                        'estado'      => 'habilitado'
                    ]);
                }
            }

            // 4️⃣ Garantizar que equipos seleccionados sigan pendientes
            DB::table('prestamo_equipo')
                ->where('idPrestamo', $prestamo->idPrestamo)
                ->whereIn('idEquipo', $pendientesSeleccionados->all())
                ->update(['devuelto' => false]);

            // 5️⃣ Ajustar estado del préstamo
            $quedanPendientes = DB::table('prestamo_equipo')
                ->where('idPrestamo', $prestamo->idPrestamo)
                ->where('devuelto', false)
                ->exists();

            if (!$quedanPendientes) {
                $estadoAnterior = $prestamo->estado;
                $prestamo->estado = EstadoPrestamo::DEVUELTO;
                $prestamo->save();

                $this->registrarHistorial(
                    $prestamo->idPrestamo,
                    $userId,
                    $estadoAnterior,
                    EstadoPrestamo::DEVUELTO,
                    'Extensión cerrada: todos los equipos fueron devueltos.'
                );
            } elseif ($prestamo->estado !== EstadoPrestamo::ENTREGADO) {
                $estadoAnterior = $prestamo->estado;
                $prestamo->estado = EstadoPrestamo::ENTREGADO;
                $prestamo->save();

                $this->registrarHistorial(
                    $prestamo->idPrestamo,
                    $userId,
                    $estadoAnterior,
                    EstadoPrestamo::ENTREGADO,
                    'Extensión: equipos pendientes continúan en préstamo.'
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
            'bloquePrestamo.bloque',
            'integrantes.persona'
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

            // Mapear integrantes del equipo
            $integrantesData = [];
            if ($p->integrantes && $p->integrantes->count() > 0) {
                $integrantesData = $p->integrantes->map(function ($integrante) {
                    return [
                        'idUser' => $integrante->idUser,
                        'nombre' => $integrante->persona?->Nombre ?? 'Sin nombre',
                        'email' => $integrante->persona?->Email ?? '',
                    ];
                })->toArray();
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
                    'idUser' => optional($p->user)->idUser,
                    'nombre' => $persona?->Nombre,
                    'email'  => $persona?->Email,
                ],

                'bloquePrestamo' => $bloquesTexto,

                'equipos' => $p->equipos->map(function ($e) {
                    return [
                        'id' => $e->id,
                        'codigo' => $e->codigo,
                        'nombre' => optional($e->tipo)->nombre ?? 'Equipo',
                        'imagen' => $e->imagen,
                        'tipo_equipo_id' => $e->tipo_equipo_id,
                        'devuelto' => (bool) ($e->pivot->devuelto ?? false),
                    ];
                }),

                'integrantes' => $integrantesData,
            ];
        });

    }

    public function actualizarEquiposPrestamo(
        int $idPrestamo,
        array $equipos,
        ?string $motivo
    ): void {
        DB::transaction(function () use ($idPrestamo, $equipos, $motivo) {
            $prestamo = Prestamo::with(['equipos'])->findOrFail($idPrestamo);

            if ($prestamo->estado !== EstadoPrestamo::PENDIENTE) {
                throw new \Exception('Solo solicitudes PENDIENTES pueden modificarse.');
            }

            foreach ($prestamo->equipos as $equipo) {
                $equipo->estado = EstadoEquipo::DISPONIBLE;
                $equipo->save();
            }

            DB::table('prestamo_equipo')
                ->where('idPrestamo', $prestamo->idPrestamo)
                ->delete();

            $equiposPayload = collect($equipos)
                ->map(function ($e) {
                    return [
                        'idTipoEquipo' => $e['idTipoEquipo'],
                        'cantidad' => $e['cantidad'],
                        'modo' => 'cualquiera',
                    ];
                })
                ->values()
                ->all();

            $this->prestamoService->procesarEquipos($prestamo->idPrestamo, $equiposPayload);

            Observacion::create([
                'idPrestamo' => $prestamo->idPrestamo,
                'idUser' => auth()->id() ?? auth('sanctum')->user()?->idUser,
                'descripcion' => $motivo ?: 'Ajuste de equipos realizado por administracion.',
                'tipo' => 'AJUSTE_EQUIPOS',
                'estado' => 'habilitado'
            ]);
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
