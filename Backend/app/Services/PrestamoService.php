<?php
namespace App\Services;

use App\Models\Prestamo;
use App\Models\BloquePrestamo;
use App\Models\Pack;
use App\Models\TipoEquipo;
use App\Models\TipoEquipoRelacionado;
use App\Models\User;
use App\Enums\EstadoPrestamo;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use App\Jobs\SendPrestamoSolicitudEncargadosJob;
use App\Jobs\SendGenericEmailJob;
use App\Mail\PrestamoSolicitudEncargadosMail;
use App\Mail\PrestamoSolicitudConfirmacionMail;
use App\Mail\PrestamoEntregadoMail;
use App\Mail\PrestamoDevueltoMail;
use App\Mail\PrestamoInventarioMail;
use App\Mail\PrestamoAprobadoMail;
use App\Mail\PrestamoRechazadoMail;
use App\Models\Configuracion;

class PrestamoService
{
    /**
     * Crear préstamo base (alumno o admin)
     */
    public function crearPrestamo(array $data): Prestamo
    {
        if (isset($data['idUser']) && ($data['estado'] ?? null) === 'PENDIENTE') {
            $user = User::find($data['idUser']);
            if ($user && $user->bloqueado) {
                throw new \Exception('ALUMNO_BLOQUEADO', 403);
            }
        }
        return Prestamo::create($data);
    }

    /**
     * Asignar bloques al préstamo
     */
    public function asignarBloques(int $idPrestamo, array $bloques, $idAsignatura = null): void
    {
        foreach ($bloques as $idBloque) {
            BloquePrestamo::create([
                'idPrestamo'   => $idPrestamo,
                'idBloque'     => $idBloque,
                'idAsignatura' => $idAsignatura,
            ]);
        }
    }

    /**
     * Procesar carrito de equipos
     */
    public function procesarEquipos(int $idPrestamo, array $equipos): void
    {
        foreach ($equipos as $item) {

            if (isset($item['idPack'])) {
                $this->asignarPack($idPrestamo, $item['idPack']);
                continue;
            }

            $idTipo   = $item['idTipoEquipo'];
            $cantidad = $item['cantidad'];
            $modo     = $item['modo'];

            if ($modo === 'especifico') {
                $this->asignarEquiposEspecificos($idPrestamo, $idTipo, $cantidad, $item['equiposSeleccionados'] ?? []);
                continue;
            }

            $this->asignarEquiposCualquiera($idPrestamo, $idTipo, $cantidad);
        }
    }

    private function asignarPack(int $idPrestamo, int $idPack): void
    {
        $pack = Pack::with('equipos')->find($idPack);

        if (!$pack) {
            throw new \Exception("El pack seleccionado no existe.");
        }

        foreach ($pack->equipos as $equipo) {
            if ($equipo->estado !== 'DISPONIBLE') {
                throw new \Exception("El equipo '{$equipo->codigo}' del pack no está disponible.");
            }

            $this->asignarEquipo($idPrestamo, $equipo->id);
        }
    }

    private function asignarEquiposEspecificos(int $idPrestamo, int $idTipo, int $cantidad, array $ids): void
    {
        if (count($ids) !== $cantidad) {
            throw new \Exception("Cantidad de equipos específicos incorrecta.");
        }

        $disponibles = DB::table('equipos')
            ->whereIn('id', $ids)
            ->where('tipo_equipo_id', $idTipo)
            ->where('estado', 'DISPONIBLE')
            ->whereNull('deleted_at')
            ->count();

        if ($disponibles !== $cantidad) {
            throw new \Exception("Algunos equipos no están disponibles.");
        }

        foreach ($ids as $idEquipo) {
            $this->asignarEquipo($idPrestamo, $idEquipo);
        }
    }

    private function asignarEquiposCualquiera(int $idPrestamo, int $idTipo, int $cantidad): void
    {
        $equipos = DB::table('equipos')
            ->where('tipo_equipo_id', $idTipo)
            ->where('estado', 'DISPONIBLE')
            ->whereNull('deleted_at')
            ->lockForUpdate()
            ->limit($cantidad)
            ->pluck('id');

        if ($equipos->count() < $cantidad) {
            throw new \Exception("Stock insuficiente.");
        }

        foreach ($equipos as $idEquipo) {
            $this->asignarEquipo($idPrestamo, $idEquipo);
        }
    }

    private function asignarEquipo(int $idPrestamo, int $idEquipo): void
    {
        DB::table('prestamo_equipo')->insert([
            'idPrestamo' => $idPrestamo,
            'idEquipo'   => $idEquipo,
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        DB::table('equipos')
            ->where('id', $idEquipo)
            ->update(['estado' => 'PRESTADO']);
    }

    /**
     * Registrar integrantes asociados a un préstamo.
     */
    public function asignarIntegrantes(int $idPrestamo, array $integrantes): void
    {
        $integrantes = array_values(array_unique(array_filter($integrantes)));

        if (empty($integrantes)) {
            return;
        }

        $rows = array_map(function ($idUser) use ($idPrestamo) {
            return [
                'idPrestamo' => $idPrestamo,
                'idUser' => $idUser,
                'created_at' => now(),
                'updated_at' => now(),
            ];
        }, $integrantes);

        DB::table('prestamo_integrantes')->insert($rows);
    }

    /**
     * Asociar préstamo a un grupo (tabla grupo_prestamo)
     */
    public function asignarGrupoPrestamo(int $grupoId, int $prestamoId): void
    {
        DB::table('grupo_prestamo')->insert([
            'grupo_id' => $grupoId,
            'prestamo_id' => $prestamoId,
            'created_at' => now(),
            'updated_at' => now(),
        ]);
    }

    /**
     * Obtener bloqueo por tipo para un usuario (catálogo).
     */
    public function obtenerBloqueoPorTipoUsuario(int $userId): array
    {
        $tipos = TipoEquipo::select('id', 'maximo_prestamo')->get();
        $activos = $this->obtenerConteosActivosPorUsuario([$userId]);
        
        $gruposRelacionados = $this->obtenerGruposRelacionados();
        
        $resultado = [];

        foreach ($tipos as $tipo) {
            $maximo = (int) ($tipo->maximo_prestamo ?? 0);
            
            $grupoIds = $gruposRelacionados[$tipo->id] ?? [$tipo->id];
            
            $activosGrupo = 0;
            foreach ($grupoIds as $tipoRelacionadoId) {
                $activosGrupo += (int) ($activos[$userId][$tipoRelacionadoId] ?? 0);
            }

            $bloqueadoPorSolicitud = $activosGrupo > 0;
            $bloqueado = $bloqueadoPorSolicitud || ($maximo === 0 ? true : $activosGrupo >= $maximo);

            $resultado[$tipo->id] = [
                'activos' => $activosGrupo,
                'maximo' => $maximo,
                'bloqueado' => $bloqueado,
                'grupo_relacionados' => $grupoIds,
                'bloqueado_por_solicitud' => $bloqueadoPorSolicitud,
            ];
        }

        return $resultado;
    }

    /**
     * Validar máximo de préstamos activos por tipo (alumno + integrantes).
     */
    public function validarMaximoPrestamo(array $userIds, array $equipos): array
    {
        $userIds = array_values(array_unique(array_filter($userIds)));
        if (empty($userIds)) {
            return [];
        }

        $solicitados = $this->construirConteoSolicitado($equipos);
        if (empty($solicitados)) {
            return [];
        }

        $activos = $this->obtenerConteosActivosPorUsuario($userIds);
        
        $gruposRelacionados = $this->obtenerGruposRelacionados();
        
        $tiposIds = array_keys($solicitados);
        $tipos = TipoEquipo::whereIn('id', $tiposIds)
            ->get(['id', 'maximo_prestamo', 'nombre']);

        $maximos = $tipos->mapWithKeys(fn ($t) => [
            (int) $t->id => (int) ($t->maximo_prestamo ?? 0)
        ])->toArray();
        
        $nombresEquipos = $tipos->mapWithKeys(fn ($t) => [
            (int) $t->id => $t->nombre
        ])->toArray();

        $usuarios = User::with('persona')
            ->whereIn('idUser', $userIds)
            ->get()
            ->keyBy('idUser');

        $bloqueos = [];

        foreach ($userIds as $uid) {
            foreach ($solicitados as $tipoId => $cantSolicitada) {
                $maximo = $maximos[$tipoId] ?? 0;
                
                $grupoIds = $gruposRelacionados[$tipoId] ?? [$tipoId];
                
                $cantActivaGrupo = 0;
                foreach ($grupoIds as $tipoRelacionadoId) {
                    $cantActivaGrupo += (int) ($activos[$uid][$tipoRelacionadoId] ?? 0);
                }
                
                $cantSolicitadaGrupo = 0;
                foreach ($grupoIds as $tipoRelacionadoId) {
                    $cantSolicitadaGrupo += (int) ($solicitados[$tipoRelacionadoId] ?? 0);
                }

                $excedePorSolicitud = $cantActivaGrupo > 0 && $cantSolicitadaGrupo > 0;
                $excede = $excedePorSolicitud || ($maximo === 0
                    ? $cantSolicitadaGrupo > 0
                    : ($cantActivaGrupo + $cantSolicitadaGrupo) > $maximo);

                if ($excede) {
                    if (!isset($bloqueos[$uid])) {
                        $persona = $usuarios[$uid]->persona ?? null;
                        $nombre = $persona
                            ? trim(($persona->Nombre ?? '') . ' ' . ($persona->apellido1 ?? '') . ' ' . ($persona->apellido2 ?? ''))
                            : ($usuarios[$uid]->Email ?? 'Usuario');

                        $bloqueos[$uid] = [
                            'usuario' => [
                                'id' => $uid,
                                'nombre' => $nombre,
                            ],
                            'tipos' => []
                        ];
                    }

                    $nombresRelacionados = array_filter(array_map(
                        fn($id) => $nombresEquipos[$id] ?? null,
                        $grupoIds
                    ));

                    $bloqueos[$uid]['tipos'][] = [
                        'tipo_id' => $tipoId,
                        'activos' => $cantActivaGrupo,
                        'solicitados' => $cantSolicitadaGrupo,
                        'maximo' => $maximo,
                        'bloqueado_por_solicitud' => $excedePorSolicitud,
                        'grupo_relacionados' => $grupoIds,
                        'nombres_relacionados' => $nombresRelacionados,
                    ];
                }
            }
        }

        return $bloqueos;
    }

    /**
     * Notificar encargados de categorias involucradas en un prestamo.
     * Tambien envia confirmacion al alumno y notifica a inventario si es externo.
     */
    public function notificarEncargadosSolicitud(int $prestamoId): void
    {
        $prestamo = Prestamo::with(['user.persona', 'equipos.tipo.categoria'])
            ->find($prestamoId);

        if (!$prestamo) {
            Log::warning('Prestamo no encontrado para notificacion de encargados', [
                'prestamo_id' => $prestamoId,
            ]);
            return;
        }

        // 1. Enviar confirmacion al alumno
        $this->notificarAlumnoSolicitud($prestamoId);

        // 2. Notificar encargados
        $categoriaIds = $prestamo->equipos
            ->map(function ($equipo) {
                return $equipo->tipo?->categoria_id;
            })
            ->filter()
            ->unique()
            ->values()
            ->toArray();

        $encargados = [];

        if (!empty($categoriaIds)) {
            $encargados = User::where('estado', 'ACTIVO')
                ->whereHas('roles', function ($q) {
                    $q->whereIn('Nombre', ['ADMIN', 'SUPER_USUARIO']);
                })
                ->whereHas('categoriasEncargadas', function ($q) use ($categoriaIds) {
                    $q->whereIn('categorias.id', $categoriaIds)
                        ->where('categorias.activo', true);
                })
                ->pluck('Email')
                ->filter()
                ->unique()
                ->values()
                ->toArray();
        }

        $fallback = Configuracion::obtener('prestamo_fallback_email');

        if (empty($encargados)) {
            Log::warning('Sin encargados para categorias del prestamo', [
                'prestamo_id' => $prestamoId,
                'categorias' => $categoriaIds,
                'fallback' => $fallback,
            ]);

            if (!empty($fallback)) {
                $mail = new PrestamoSolicitudEncargadosMail($prestamo);
                SendPrestamoSolicitudEncargadosJob::dispatch($fallback, [], $mail, 'prestamo-solicitud-fallback');
            }
        } else {
            $mail = new PrestamoSolicitudEncargadosMail($prestamo);
            $to = $encargados[0];
            $bcc = array_slice($encargados, 1);
            SendPrestamoSolicitudEncargadosJob::dispatch($to, $bcc, $mail, 'prestamo-solicitud-encargados');
        }

        // 3. Si es externo (FUERA), notificar a inventario
        $this->notificarInventarioSiExterno($prestamo, 'PENDIENTE');
    }

    /**
     * Notificar al alumno que su solicitud fue registrada.
     */
    public function notificarAlumnoSolicitud(int $prestamoId): void
    {
        $prestamo = Prestamo::with(['user.persona', 'equipos.tipo'])
            ->find($prestamoId);

        if (!$prestamo) {
            return;
        }

        $email = $prestamo->user?->Email ?? null;
        if (empty($email)) {
            Log::warning('Alumno sin email para notificacion de solicitud', [
                'prestamo_id' => $prestamoId,
            ]);
            return;
        }

        $mail = new PrestamoSolicitudConfirmacionMail($prestamo);
        SendGenericEmailJob::dispatch($email, $mail);
    }

    /**
     * Notificar encargados cuando un prestamo es aprobado/rechazado.
     */
    public function notificarEncargadosCambioEstado(int $prestamoId, string $accion): void
    {
        $prestamo = Prestamo::with(['user.persona', 'equipos.tipo.categoria'])
            ->find($prestamoId);

        if (!$prestamo) {
            return;
        }

        $encargadoEmails = $this->obtenerEmailsEncargados($prestamo);

        if (empty($encargadoEmails)) {
            return;
        }

        $persona = $prestamo->user?->persona;
        $nombreAlumno = trim(($persona?->Nombre ?? '') . ' ' . ($persona?->apellido1 ?? ''));
        $estadoTexto = $accion === 'aprobar' ? 'APROBADO' : 'RECHAZADO';

        $mail = new PrestamoSolicitudEncargadosMail($prestamo);
        $mail->subject("Prestamo #{$prestamo->idPrestamo} {$estadoTexto} - {$nombreAlumno}");

        $to = $encargadoEmails[0];
        $bcc = array_slice($encargadoEmails, 1);

        SendPrestamoSolicitudEncargadosJob::dispatch($to, $bcc, $mail, "prestamo-{$accion}-encargados");
    }

    /**
     * Notificar al alumno y encargados cuando un prestamo es entregado.
     */
    public function notificarEntregado(int $prestamoId, string $nombreAdmin): void
    {
        $prestamo = Prestamo::with(['user.persona', 'equipos.tipo.categoria'])
            ->find($prestamoId);

        if (!$prestamo) {
            return;
        }

        // Notificar al alumno
        $emailAlumno = $prestamo->user?->Email ?? null;
        if (!empty($emailAlumno)) {
            $mailAlumno = new PrestamoEntregadoMail($prestamo, $nombreAdmin, 'alumno');
            SendGenericEmailJob::dispatch($emailAlumno, $mailAlumno);
        }

        // Notificar a encargados
        $encargadoEmails = $this->obtenerEmailsEncargados($prestamo);
        if (!empty($encargadoEmails)) {
            $mailEncargado = new PrestamoEntregadoMail($prestamo, $nombreAdmin, 'encargado');
            $to = $encargadoEmails[0];
            $bcc = array_slice($encargadoEmails, 1);
            SendPrestamoSolicitudEncargadosJob::dispatch($to, $bcc, $mailEncargado, 'prestamo-entregado-encargados');
        }

        // Si es externo (FUERA), notificar a inventario
        $this->notificarInventarioSiExterno($prestamo, 'ENTREGADO');
    }

    /**
     * Notificar al alumno y encargados cuando un prestamo es devuelto.
     */
    public function notificarDevuelto(int $prestamoId, ?string $motivo = null): void
    {
        $prestamo = Prestamo::with(['user.persona', 'equipos.tipo.categoria'])
            ->find($prestamoId);

        if (!$prestamo) {
            return;
        }

        // Notificar al alumno
        $emailAlumno = $prestamo->user?->Email ?? null;
        if (!empty($emailAlumno)) {
            $mailAlumno = new PrestamoDevueltoMail($prestamo, $motivo, 'alumno');
            SendGenericEmailJob::dispatch($emailAlumno, $mailAlumno);
        }

        // Notificar a encargados
        $encargadoEmails = $this->obtenerEmailsEncargados($prestamo);
        if (!empty($encargadoEmails)) {
            $mailEncargado = new PrestamoDevueltoMail($prestamo, $motivo, 'encargado');
            $to = $encargadoEmails[0];
            $bcc = array_slice($encargadoEmails, 1);
            SendPrestamoSolicitudEncargadosJob::dispatch($to, $bcc, $mailEncargado, 'prestamo-devuelto-encargados');
        }

        // Si es externo (FUERA), notificar a inventario
        $this->notificarInventarioSiExterno($prestamo, 'DEVUELTO');
    }

    /**
     * Notificar a inventario cuando un prestamo externo (FUERA) cambia de estado.
     */
    public function notificarInventarioSiExterno($prestamo, string $estado): void
    {
        if (strtoupper($prestamo->tipo) !== 'FUERA') {
            return;
        }

        $emailInventario = Configuracion::obtener('inventario_email');

        if (empty($emailInventario)) {
            Log::warning('No hay email de inventario configurado para prestamo externo', [
                'prestamo_id' => $prestamo->idPrestamo,
                'estado' => $estado,
            ]);
            return;
        }

        $mail = new PrestamoInventarioMail($prestamo, $estado);
        SendGenericEmailJob::dispatch($emailInventario, $mail);

        Log::info('Notificacion de inventario enviada para prestamo externo', [
            'prestamo_id' => $prestamo->idPrestamo,
            'estado' => $estado,
            'email_inventario' => $emailInventario,
        ]);
    }

    /**
     * Obtener emails de encargados para las categorias del prestamo.
     */
    private function obtenerEmailsEncargados($prestamo): array
    {
        $categoriaIds = $prestamo->equipos
            ->map(fn ($equipo) => $equipo->tipo?->categoria_id)
            ->filter()
            ->unique()
            ->values()
            ->toArray();

        if (empty($categoriaIds)) {
            return [];
        }

        return User::where('estado', 'ACTIVO')
            ->whereHas('roles', function ($q) {
                $q->whereIn('Nombre', ['ADMIN', 'SUPER_USUARIO']);
            })
            ->whereHas('categoriasEncargadas', function ($q) use ($categoriaIds) {
                $q->whereIn('categorias.id', $categoriaIds)
                    ->where('categorias.activo', true);
            })
            ->pluck('Email')
            ->filter()
            ->unique()
            ->values()
            ->toArray();
    }

    private function construirConteoSolicitado(array $equipos): array
    {
        $conteo = [];

        foreach ($equipos as $item) {
            if (isset($item['idPack'])) {
                $pack = Pack::with('equipos')->find($item['idPack']);
                if (!$pack) {
                    continue;
                }

                $multiplicador = (int) ($item['cantidad'] ?? 1);
                foreach ($pack->equipos as $eq) {
                    $tipoId = (int) $eq->tipo_equipo_id;
                    $conteo[$tipoId] = ($conteo[$tipoId] ?? 0) + $multiplicador;
                }
                continue;
            }

            $tipoId = (int) ($item['idTipoEquipo'] ?? 0);
            $cantidad = (int) ($item['cantidad'] ?? 0);
            if ($tipoId && $cantidad > 0) {
                $conteo[$tipoId] = ($conteo[$tipoId] ?? 0) + $cantidad;
            }
        }

        return $conteo;
    }

    public function obtenerTiposSolicitados(array $equipos): array
    {
        return array_keys($this->construirConteoSolicitado($equipos));
    }

    private function obtenerConteosActivosPorUsuario(array $userIds): array
    {
        $estadosActivos = [
            EstadoPrestamo::PENDIENTE,
            EstadoPrestamo::APROBADO,
            EstadoPrestamo::PENDIENTE_ENTREGA,
            EstadoPrestamo::ENTREGADO,
            EstadoPrestamo::ATRASADO,
        ];

        $conteos = [];

        $main = DB::table('prestamos as p')
            ->join('prestamo_equipo as pe', 'pe.idPrestamo', '=', 'p.idPrestamo')
            ->join('equipos as e', 'e.id', '=', 'pe.idEquipo')
            ->whereIn('p.estado', $estadosActivos)
            ->whereIn('p.idUser', $userIds)
            ->groupBy('p.idUser', 'e.tipo_equipo_id')
            ->selectRaw('p.idUser as idUser, e.tipo_equipo_id as tipo_id, count(*) as total')
            ->get();

        foreach ($main as $row) {
            $conteos[$row->idUser][(int) $row->tipo_id] = (int) $row->total;
        }

        $integrantes = DB::table('prestamo_integrantes as pi')
            ->join('prestamos as p', 'p.idPrestamo', '=', 'pi.idPrestamo')
            ->join('prestamo_equipo as pe', 'pe.idPrestamo', '=', 'p.idPrestamo')
            ->join('equipos as e', 'e.id', '=', 'pe.idEquipo')
            ->whereIn('p.estado', $estadosActivos)
            ->whereIn('pi.idUser', $userIds)
            ->groupBy('pi.idUser', 'e.tipo_equipo_id')
            ->selectRaw('pi.idUser as idUser, e.tipo_equipo_id as tipo_id, count(*) as total')
            ->get();

        foreach ($integrantes as $row) {
            $actual = $conteos[$row->idUser][(int) $row->tipo_id] ?? 0;
            $conteos[$row->idUser][(int) $row->tipo_id] = $actual + (int) $row->total;
        }

        return $conteos;
    }

    private function obtenerGruposRelacionados(): array
    {
        $relaciones = DB::table('tipo_equipo_relacionados')
            ->select('tipo_equipo_id', 'relacionado_id')
            ->get();

        $grafo = [];
        foreach ($relaciones as $rel) {
            $a = (int) $rel->tipo_equipo_id;
            $b = (int) $rel->relacionado_id;

            $grafo[$a][] = $b;
            $grafo[$b][] = $a;
        }

        $grupos = [];
        $todosLosTipos = TipoEquipo::pluck('id')->toArray();

        foreach ($todosLosTipos as $tipoId) {
            if (isset($grupos[$tipoId])) {
                continue;
            }

            $grupo = $this->encontrarGrupoConectado($tipoId, $grafo);
            
            foreach ($grupo as $miembro) {
                $grupos[$miembro] = $grupo;
            }
        }

        return $grupos;
    }

    private function encontrarGrupoConectado(int $inicio, array $grafo): array
    {
        $visitados = [$inicio => true];
        $cola = [$inicio];
        $grupo = [$inicio];

        while (!empty($cola)) {
            $actual = array_shift($cola);
            $vecinos = $grafo[$actual] ?? [];

            foreach ($vecinos as $vecino) {
                if (!isset($visitados[$vecino])) {
                    $visitados[$vecino] = true;
                    $cola[] = $vecino;
                    $grupo[] = $vecino;
                }
            }
        }

        return array_values(array_unique($grupo));
    }

    private function agruparSolicitadosPorGrupo(array $solicitados, array $gruposRelacionados): array
    {
        $resultado = [];

        foreach ($solicitados as $tipoId => $cantidad) {
            $grupoIds = $gruposRelacionados[$tipoId] ?? [$tipoId];
            $grupoKey = implode('-', array_unique($grupoIds));

            if (!isset($resultado[$grupoKey])) {
                $resultado[$grupoKey] = [
                    'tipos' => $grupoIds,
                    'total' => 0,
                ];
            }

            $resultado[$grupoKey]['total'] += $cantidad;
        }

        return $resultado;
    }
}
