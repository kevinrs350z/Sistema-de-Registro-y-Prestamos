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
use App\Events\PrestamoCreated;
use App\Events\PrestamoActualizado;


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

        // Lógica para procesar motivo y observación
        if (!is_null($motivo) && trim($motivo) !== '') {
            // Si es rechazo, intentamos extraer el enum del motivo
            if ($accion === 'rechazar') {
                $motivoEnum = null;
                $textoObservacion = $motivo;

                // Buscar si el string empieza con algún motivo válido
                foreach (\App\Enums\MotivoRechazo::all() as $enum) {
                    // Verificamos si empieza con el ENUM
                    // Ej: "SIN_STOCK - No hay unidades" o "SIN_STOCK"
                    if (str_starts_with($motivo, $enum)) {
                        $motivoEnum = $enum;
                        // Limpiamos el enum del texto de observación
                        // Removemos el enum y caracteres separadores comunes (" - ", ": ", " ")
                        $resto = substr($motivo, strlen($enum));
                        $textoObservacion = ltrim($resto, " -:\t\n\r");
                        break;
                    }
                }

                // Asignamos el motivo detectado o null (o OTRO si preferimos default)
                // Si no se detectó enum, asumimos que todo es observación y el motivo queda null o OTRO
                $prestamo->motivo_rechazo = $motivoEnum; 
                
                // Si se detectó un enum, guardamos solo el texto limpio en observación
                // Si no, guardamos todo el string original
                $prestamo->observacion = $textoObservacion ?: null; // Si queda vacío, null
            } else {
                // Si es aprobar, todo va a observación directo
                $prestamo->observacion = $motivo;
            }
        }

        $prestamo->save();

        // � DISPARAR EVENTO DE ACTUALIZACIÓN
        event(new PrestamoActualizado($prestamo, 'cambio_estado'));

        // �🔹 REGISTRAR EN HISTORIAL DE CAMBIOS
        $userId = auth()->id() ?? auth('sanctum')->user()?->idUser;
        $this->registrarHistorial(
            $prestamo->idPrestamo,
            $userId,
            $estadoAnterior,
            $nuevoEstado,
            $motivo // Guardamos el string completo original en historial para referencia
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

        // Envio de correo al alumno (no debe bloquear ni romper la respuesta)
        if ($email) {
            try {
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
            } catch (\Throwable $e) {
                Log::warning('No se pudo encolar correo de préstamo', [
                    'prestamo_id' => $prestamo->idPrestamo,
                    'accion' => $accion,
                    'email' => $email,
                    'error' => $e->getMessage(),
                ]);
                // No se relanza la excepción para evitar que el front reciba 500
            }
        }

        // Notificar encargados del cambio de estado
        try {
            $this->prestamoService->notificarEncargadosCambioEstado($prestamo->idPrestamo, $accion);
        } catch (\Exception $e) {
            Log::warning('No se pudo notificar encargados del cambio de estado', [
                'prestamo_id' => $prestamo->idPrestamo,
                'accion' => $accion,
                'error' => $e->getMessage(),
            ]);
        }

        // Si es externo (FUERA), notificar a inventario
        try {
            $this->prestamoService->notificarInventarioSiExterno($prestamo, $accion === 'aprobar' ? 'APROBADO' : 'RECHAZADO');
        } catch (\Exception $e) {
            Log::warning('No se pudo notificar inventario', [
                'prestamo_id' => $prestamo->idPrestamo,
                'error' => $e->getMessage(),
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

        // � DISPARAR EVENTO DE ACTUALIZACIÓN
        event(new PrestamoActualizado($prestamo, 'marcado_devuelto'));

        // �🔹 REGISTRAR EN HISTORIAL DE CAMBIOS
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

        // Notificar al alumno y encargados de la devolucion
        try {
            $this->prestamoService->notificarDevuelto($prestamo->idPrestamo, $motivoFinal);
        } catch (\Exception $e) {
            Log::warning('No se pudo notificar devolucion', [
                'prestamo_id' => $prestamo->idPrestamo,
                'error' => $e->getMessage(),
            ]);
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

            // 5. Si NO quedan → prestamo DEVUELTO
            if ($pendientes === 0) {
                $estadoAnterior = $prestamo->estado;
                $prestamo->estado = EstadoPrestamo::DEVUELTO;
                $prestamo->save();

                // 🔔 DISPARAR EVENTO DE ACTUALIZACIÓN
                event(new PrestamoActualizado($prestamo, 'todos_equipos_devueltos'));

                $userId = auth()->id() ?? auth('sanctum')->user()?->idUser;
                $this->registrarHistorial(
                    $prestamo->idPrestamo,
                    $userId,
                    $estadoAnterior,
                    EstadoPrestamo::DEVUELTO,
                    'Todos los equipos devueltos'
                );

                // Notificar al alumno y encargados
                try {
                    $this->prestamoService->notificarDevuelto($prestamo->idPrestamo, 'Todos los equipos devueltos');
                } catch (\Exception $e) {
                    Log::warning('No se pudo notificar devolucion completa', [
                        'prestamo_id' => $prestamo->idPrestamo,
                        'error' => $e->getMessage(),
                    ]);
                }
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
    /**
     * Obtener TODOS los préstamos (sin filtros de estado)
     * Devuelve: PENDIENTE, APROBADO, ENTREGADO, DEVUELTO, RECHAZADO, etc.
     */
    public function obtenerPendientes()
    {
        return Prestamo::with([
            'user.persona',
            'equipos.tipo',
            'bloquePrestamo.bloque',
            'integrantes.persona'
        ])
        // 🔓 SIN FILTRO DE ESTADO - Devuelve ABSOLUTAMENTE TODO
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
                    // 📊 Obtener stock TOTAL disponible del tipo de equipo
                    $stockDisponible = \App\Models\Equipo::where('tipo_equipo_id', $e->tipo_equipo_id)
                        ->where('estado', EstadoEquipo::DISPONIBLE)
                        ->count();

                    // 📊 Obtener stock TOTAL del tipo de equipo (sin filtrar estado)
                    $stockTotal = \App\Models\Equipo::where('tipo_equipo_id', $e->tipo_equipo_id)
                        ->count();

                    return [
                        'id' => $e->id,
                        'codigo' => $e->codigo,
                        'nombre' => optional($e->tipo)->nombre ?? 'Equipo',
                        'imagen' => $e->imagen,
                        'tipo_equipo_id' => $e->tipo_equipo_id,
                        'devuelto' => (bool) ($e->pivot->devuelto ?? false),
                        'stock_disponible' => $stockDisponible,    // 📦 Stock disponible
                        'stock_total' => $stockTotal,               // 📦 Stock total
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
            // Siempre guardar fecha_inicio (para DENTRO = fecha del día)
            $fechaInicio = $request->fecha_inicio ?? now()->toDateString();
            $fechaFin    = $request->fecha_fin ?? $fechaInicio;

            $prestamo = Prestamo::create(
                array_merge($data, [
                    'fecha_inicio' => $fechaInicio,
                    'fecha_fin'    => $fechaFin,
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

        // 🔔 DISPARAR EVENTO DE CREACIÓN
        event(new PrestamoCreated($prestamo));

        return $prestamo;
    }

    /* ============================================================
        MARCAR ENTREGADO
    ============================================================ */
    public function marcarEntregado(
        int $idPrestamo,
        int $adminId
    ): void {
        $nombreAdmin = null;

        DB::transaction(function () use ($idPrestamo, $adminId, &$nombreAdmin) {
            
            // 1. OBTENER PRESTAMO
            $prestamo = Prestamo::findOrFail($idPrestamo);

            $estadoAnterior = $prestamo->estado;

            // 2. VALIDAR: Solo APROBADO -> ENTREGADO
            if ($prestamo->estado !== EstadoPrestamo::APROBADO) {
                throw new \Exception(
                    "Solo préstamos en estado APROBADO pueden marcarse como ENTREGADO. " .
                    "Estado actual: {$prestamo->estado}"
                );
            }

            // 3. VALIDAR QUE QUIEN EJECUTA SEA ADMIN
            $admin = User::findOrFail($adminId);
            if (!$admin->isAdmin()) {
                throw new \Exception('Solo un administrador puede marcar un préstamo como ENTREGADO.');
            }

            $nombreAdmin = $admin->persona?->Nombre ?? 'Administrador';

            // 4. CAMBIAR ESTADO
            $prestamo->estado = EstadoPrestamo::ENTREGADO;
            $prestamo->save();

            // 🔔 DISPARAR EVENTO DE ACTUALIZACIÓN
            event(new PrestamoActualizado($prestamo, 'marcado_entregado'));

            // 5. REGISTRAR EN HISTORIAL DE CAMBIOS
            $this->registrarHistorial(
                $prestamo->idPrestamo,
                $adminId,
                $estadoAnterior,
                EstadoPrestamo::ENTREGADO,
                'Entrega física realizada'
            );

            // 6. LOG DE AUDITORIA
            Log::info('Prestamo marcado como ENTREGADO', [
                'idPrestamo'   => $idPrestamo,
                'admin_id'     => $adminId,
                'admin_nombre' => $nombreAdmin,
                'timestamp'    => now(),
            ]);
        });

        // 7. Notificar al alumno y encargados de la entrega (fuera de la transaccion)
        try {
            $this->prestamoService->notificarEntregado($idPrestamo, $nombreAdmin ?? 'Administrador');
        } catch (\Exception $e) {
            Log::warning('No se pudo notificar entrega', [
                'prestamo_id' => $idPrestamo,
                'error' => $e->getMessage(),
            ]);
        }
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

    /* ============================================================
        DEVOLUCIONES MASIVAS
    ============================================================ */
    /**
     * Marcar como DEVUELTO todas las solicitudes ENTREGADAS
     * (que aún no han sido devueltas)
     */
    public function devolverTodosMasivo(?string $motivo = null): array
    {
        $prestamosActualizados = [];
        $errores = [];

        // Obtener todos los préstamos SIN FILTRO DE ESTADO (temporalmente para testing)
        $prestamos = Prestamo::get();

        foreach ($prestamos as $prestamo) {
            try {
                // Marcar equipos como devueltos
                DB::table('prestamo_equipo')
                    ->where('idPrestamo', $prestamo->idPrestamo)
                    ->update(['devuelto' => true]);

                // Cambiar estado a DEVUELTO
                $estadoAnterior = $prestamo->estado;
                $prestamo->estado = EstadoPrestamo::DEVUELTO;
                $prestamo->save();

                // Registrar en historial (sin usuario si no está autenticado)
                PrestamoHistorial::create([
                    'idPrestamo' => $prestamo->idPrestamo,
                    'idUser' => auth()->id(),
                    'estado_anterior' => $estadoAnterior,
                    'estado_nuevo' => EstadoPrestamo::DEVUELTO,
                    'descripcion' => $motivo ?? 'Devolución masiva automática',
                ]);

                // 🔔 Emitir evento
                event(new PrestamoActualizado($prestamo, 'devuelto_masivo'));

                $prestamosActualizados[] = [
                    'idPrestamo' => $prestamo->idPrestamo,
                    'estado' => EstadoPrestamo::DEVUELTO,
                ];
            } catch (\Exception $e) {
                $errores[] = [
                    'idPrestamo' => $prestamo->idPrestamo,
                    'error' => $e->getMessage(),
                ];
            }
        }

        return [
            'procesados' => count($prestamosActualizados),
            'actualizados' => $prestamosActualizados,
            'errores' => $errores,
            'mensaje' => count($prestamosActualizados) . ' préstamos marcados como devueltos (todos los estados)',
        ];
    }

    /**
     * Cancelar todas las solicitudes PENDIENTES
     * (rechazarlas automáticamente)
     */
    public function cancelarTodosPendientesMasivo(?string $motivo = null): array
    {
        $prestamosActualizados = [];
        $errores = [];

        // Obtener todos los préstamos en estado PENDIENTE
        $prestamos = Prestamo::where('estado', EstadoPrestamo::PENDIENTE)->get();

        foreach ($prestamos as $prestamo) {
            try {
                // Liberar equipos (marcar como disponibles nuevamente)
                $equipos = DB::table('prestamo_equipo')
                    ->where('idPrestamo', $prestamo->idPrestamo)
                    ->pluck('idEquipo');

                foreach ($equipos as $idEquipo) {
                    Equipo::find($idEquipo)?->update(['estado' => EstadoEquipo::DISPONIBLE]);
                }

                // Cambiar estado a RECHAZADO
                $estadoAnterior = $prestamo->estado;
                $prestamo->estado = EstadoPrestamo::RECHAZADO;
                $prestamo->save();

                // Registrar en historial (sin usuario si no está autenticado)
                PrestamoHistorial::create([
                    'idPrestamo' => $prestamo->idPrestamo,
                    'idUser' => auth()->id(),
                    'estado_anterior' => $estadoAnterior,
                    'estado_nuevo' => EstadoPrestamo::RECHAZADO,
                    'descripcion' => $motivo ?? 'Cancelación masiva automática',
                ]);

                // 🔔 Emitir evento
                event(new PrestamoActualizado($prestamo, 'cancelado_masivo'));

                $prestamosActualizados[] = [
                    'idPrestamo' => $prestamo->idPrestamo,
                    'estado' => EstadoPrestamo::RECHAZADO,
                ];
            } catch (\Exception $e) {
                $errores[] = [
                    'idPrestamo' => $prestamo->idPrestamo,
                    'error' => $e->getMessage(),
                ];
            }
        }

        return [
            'procesados' => count($prestamosActualizados),
            'actualizados' => $prestamosActualizados,
            'errores' => $errores,
            'mensaje' => count($prestamosActualizados) . ' préstamos cancelados',
        ];
    }





}
