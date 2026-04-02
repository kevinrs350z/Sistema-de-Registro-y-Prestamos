<?php

namespace App\Http\Controllers;

use App\Enums\CategoriaFalta;
use App\Enums\EstadoSancion;
use App\Enums\NivelSancion;
use App\Models\HistorialSancion;
use App\Models\Prestamo;
use App\Models\Sancion;
use App\Models\User;
use App\Models\UserSancion;
use App\Mail\SancionNotificacion;
use App\Jobs\SendGenericEmailJob;
use App\Services\EscalamientoService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

class UserSancionController extends Controller
{
    private EscalamientoService $escalamiento;

    public function __construct(EscalamientoService $escalamiento)
    {
        $this->escalamiento = $escalamiento;
    }

    // ────────────────────────────────────────────────────
    // PREFILL PARA SANCIÓN DESDE PRÉSTAMO FINALIZADO
    // ────────────────────────────────────────────────────
    public function prefill(Request $request)
    {
        $request->validate(['prestamo_id' => 'required|integer']);

        $prestamo = Prestamo::with(['user.persona', 'equipos.tipo'])
            ->findOrFail($request->prestamo_id);

        if (! in_array($prestamo->estado, ['ENTREGADO', 'DEVUELTO'])) {
            return response()->json(['error' => 'El préstamo no está finalizado.'], 422);
        }

        $persona = $prestamo->user?->persona;

        return response()->json([
            'prestamo' => [
                'idPrestamo'   => $prestamo->idPrestamo,
                'estado'       => $prestamo->estado,
                'fecha_inicio' => $prestamo->fecha_inicio,
                'fecha_fin'    => $prestamo->fecha_fin,
                'equipos'      => $prestamo->equipos->map(fn ($e) => [
                    'id'     => $e->id,
                    'nombre' => $e->tipo->nombre ?? 'Equipo',
                    'codigo' => $e->codigo ?? '—',
                ]),
            ],
            'usuario' => [
                'idUser'   => $prestamo->user?->idUser,
                'nombre'   => $persona?->Nombre ?? '',
                'apellido' => $persona?->Apellido1 ?? '',
                'email'    => $prestamo->user?->Email ?? '',
                'rut'      => $persona?->Rut ?? '',
            ],
        ]);
    }

    // ────────────────────────────────────────────────────
    // CATÁLOGO (niveles disponibles)
    // ────────────────────────────────────────────────────
    public function catalogo()
    {
        $catalogo = Sancion::select('idSancion', 'nivel', 'descripcion', 'estado')
            ->get()
            ->filter(fn ($s) => NivelSancion::isValid((string) $s->nivel))
            ->groupBy(fn ($s) => strtoupper((string) $s->nivel))
            ->map(fn ($group) => $group->sortBy('idSancion')->first())
            ->sortBy(fn ($s) => NivelSancion::peso((string) $s->nivel))
            ->values();

        return response()->json([
            'sanciones'            => $catalogo,
            'categorias_por_nivel' => CategoriaFalta::porNivelConLabels(),
            'niveles'              => NivelSancion::all(),
            'estados'              => EstadoSancion::all(),
        ]);
    }

    // ────────────────────────────────────────────────────
    // ASIGNAR SANCIÓN (con escalamiento automático)
    // ────────────────────────────────────────────────────
    public function asignarSancion(Request $request)
    {
        $request->validate([
            'usuario'         => 'required|string',
            'idSancion'       => 'nullable|integer|exists:sancions,idSancion',
            'nivel'           => 'nullable|string',
            'descripcion'     => 'nullable|string',
            'categoria_falta' => 'nullable|string',
            'fecha_inicio'    => 'required|date',
            'fecha_fin'       => 'required|date|after_or_equal:fecha_inicio',
            'prestamo_id'     => 'nullable|integer|exists:prestamos,idPrestamo',
        ]);

        // ── Buscar usuario ──
        $identificador = $request->usuario;
        $userQuery = User::with('persona');

        if (is_numeric($identificador)) {
            $userQuery->where('idUser', $identificador);
        } elseif (str_contains($identificador, '@')) {
            $userQuery->where('Email', $identificador);
        } else {
            $userQuery->whereHas('persona', fn ($q) => $q->where('Rut', $identificador));
        }

        $user = $userQuery->firstOrFail();

        // ── Resolver catálogo ──
        $sancion = null;
        if ($request->idSancion) {
            $sancion = Sancion::findOrFail($request->idSancion);
        } elseif ($request->nivel) {
            $sancion = Sancion::whereRaw('UPPER(nivel) = ?', [strtoupper($request->nivel)])->first();
        }

        if (! $sancion) {
            return response()->json(['error' => 'No se pudo determinar el tipo de sanción.'], 422);
        }

        $nivel = strtoupper($sancion->nivel);

        // ── Validar categoría de falta ──
        $categoriaFalta = $request->categoria_falta
            ? strtoupper($request->categoria_falta)
            : CategoriaFalta::OTRO;

        // ── Periodo académico actual ──
        $mes = (int) date('m');
        $semestre = $mes <= 7 ? '1' : '2';
        $periodo = date('Y') . '-' . $semestre;

        // ══════════════════════════════════════════════════
        // Crear registro individual en user_sancion
        // ══════════════════════════════════════════════════
        $pivotId = DB::table('user_sancion')->insertGetId([
            'idUser'            => $user->idUser,
            'idSancion'         => $sancion->idSancion,
            'nivel'             => $nivel,
            'estado_sancion'    => EstadoSancion::ACTIVA,
            'categoria_falta'   => $categoriaFalta,
            'fecha_inicio'      => $request->fecha_inicio,
            'fecha_fin'         => $request->fecha_fin,
            'assigned_by'       => auth()->user()?->idUser,
            'prestamo_id'       => $request->prestamo_id,
            'descripcion'       => $request->descripcion,
            'accion'            => 'ASIGNACION',
            'escalada_desde_id' => null,
            'periodo_academico' => $periodo,
            'created_at'        => now(),
            'updated_at'        => now(),
        ]);

        // ── Historial ──
        HistorialSancion::create([
            'user_sancion_id' => $pivotId,
            'accion'          => 'ASIGNACION',
            'estado_anterior' => null,
            'estado_nuevo'    => EstadoSancion::ACTIVA,
            'descripcion'     => $request->descripcion ?? 'Sanción asignada por administrador',
            'ejecutado_por'   => auth()->user()?->idUser,
            'es_automatico'   => false,
            'created_at'      => now(),
        ]);

        // ══════════════════════════════════════════════════
        // BLOQUEAR USUARIO (todas las sanciones bloquean)
        // LEVE/MEDIA/GRAVE: bloqueado durante el periodo
        // GRAVISIMA: bloqueado hasta resolución legal
        // ══════════════════════════════════════════════════
        $motivoBloqueo = $nivel === NivelSancion::GRAVISIMA
            ? "Sanción GRAVÍSIMA — bloqueado hasta resolución legal"
            : "Sanción {$nivel} activa hasta " . $request->fecha_fin;

        DB::table('users')->where('idUser', $user->idUser)->update([
            'bloqueado'        => true,
            'bloqueado_motivo' => $motivoBloqueo,
            'bloqueado_fecha'  => now(),
            'bloqueado_por'    => auth()->user()?->idUser,
        ]);

        // ══════════════════════════════════════════════════
        // ESCALAMIENTO AUTOMÁTICO
        // ══════════════════════════════════════════════════
        $escalamientos = $this->escalamiento->verificar(
            $user->idUser,
            $nivel,
            $pivotId,
            auth()->user()?->idUser
        );

        // ── Notificación email ──
        if ($user->Email) {
            try {
                SendGenericEmailJob::dispatch(
                    $user->Email,
                    new SancionNotificacion('asignada', $user, $sancion),
                    'sancion-asignada'
                );
            } catch (\Throwable $e) {
                Log::warning('No se pudo encolar correo de sanción', [
                    'user' => $user->Email, 'error' => $e->getMessage(),
                ]);
            }
        }

        return response()->json([
            'message'        => 'Sanción creada y asignada correctamente.',
            'sancion'        => $sancion,
            'pivot_id'       => $pivotId,
            'escalamientos'  => $escalamientos,
            'usuario'        => [
                'idUser'   => $user->idUser,
                'Email'    => $user->Email,
                'Rut'      => $user->persona->Rut ?? null,
                'Nombre'   => $user->persona->Nombre ?? null,
                'Apellido' => $user->persona->Apellido1 ?? null,
            ],
        ], 201);
    }

    // ────────────────────────────────────────────────────
    // LISTAR TODAS LAS SANCIONES (registros individuales)
    // ────────────────────────────────────────────────────
    public function listarSanciones()
    {
        $registros = UserSancion::with(['user.persona', 'sancion', 'asignadoPor.persona'])
            ->orderByDesc('created_at')
            ->get();

        $data = $this->formatearListado($registros);

        return response()->json([
            'message'   => 'Listado completo de sanciones.',
            'sanciones' => $data,
        ]);
    }

    // ────────────────────────────────────────────────────
    // LISTAR SANCIONES ACTIVAS
    // ────────────────────────────────────────────────────
    public function listarSancionesActivas()
    {
        $registros = UserSancion::with(['user.persona', 'sancion', 'asignadoPor.persona'])
            ->where('estado_sancion', EstadoSancion::ACTIVA)
            ->orderByDesc('created_at')
            ->get();

        $data = $this->formatearListado($registros);

        return response()->json([
            'message'   => 'Listado de sanciones activas.',
            'sanciones' => $data,
        ]);
    }

    // ────────────────────────────────────────────────────
    // SANCIONES POR USUARIO (ADMIN)
    // ────────────────────────────────────────────────────
    public function sancionesPorUsuario(int $idUser)
    {
        $user = User::with('persona')->findOrFail($idUser);

        $registros = UserSancion::with(['sancion', 'asignadoPor.persona'])
            ->where('idUser', $idUser)
            ->orderByDesc('created_at')
            ->get();

        $data = $registros->map(fn ($r) => $this->formatearRegistro($r));

        return response()->json([
            'usuario' => [
                'idUser'   => $user->idUser,
                'nombre'   => $user->persona?->Nombre ?? null,
                'apellido' => $user->persona?->Apellido1 ?? null,
                'email'    => $user->Email ?? null,
                'rut'      => $user->persona?->Rut ?? null,
            ],
            'resumen' => [
                'activas' => $registros->where('estado_sancion', EstadoSancion::ACTIVA)->count(),
                'total'   => $registros->count(),
                'leves'   => $registros->where('nivel', NivelSancion::LEVE)->count(),
                'medias'  => $registros->where('nivel', NivelSancion::MEDIA)->count(),
                'graves'  => $registros->where('nivel', NivelSancion::GRAVE)->count(),
                'gravisimas' => $registros->where('nivel', NivelSancion::GRAVISIMA)->count(),
            ],
            'sanciones' => $data,
        ]);
    }

    // ────────────────────────────────────────────────────
    // MIS SANCIONES (ALUMNO AUTENTICADO)
    // ────────────────────────────────────────────────────
    public function misSanciones(Request $request)
    {
        $user = $request->user();
        if (! $user) {
            return response()->json(['error' => 'Usuario no autenticado'], 401);
        }

        $registros = UserSancion::with(['sancion', 'asignadoPor.persona'])
            ->where('idUser', $user->idUser)
            ->orderByDesc('created_at')
            ->get();

        $data = $registros->map(fn ($r) => $this->formatearRegistro($r));

        return response()->json([
            'message'   => 'Listado de sanciones del usuario autenticado.',
            'sanciones' => $data,
        ]);
    }

    // ────────────────────────────────────────────────────
    // AMPLIAR SANCIÓN (individual — por pivot ID)
    // ────────────────────────────────────────────────────
    public function ampliarSancion(Request $request, $id)
    {
        $request->validate(['motivo' => 'required|string']);

        $registro = UserSancion::with(['user.persona', 'sancion'])->findOrFail($id);

        $estadoAnterior = $registro->estado_sancion;
        $fechaFinAnterior = $registro->fecha_fin;

        // Obtener días de ampliación desde config
        $dias = (int) (DB::table('configuracion_sanciones')
            ->where('clave', 'ampliacion_dias_default')
            ->value('valor') ?? 7);

        $nuevaFecha = now()->parse($registro->fecha_fin ?? now())->addDays($dias)->toDateString();
        $registro->fecha_fin = $nuevaFecha;
        $registro->save();

        // Historial
        HistorialSancion::create([
            'user_sancion_id' => $registro->id,
            'accion'          => 'AMPLIACION',
            'estado_anterior' => $estadoAnterior,
            'estado_nuevo'    => $registro->estado_sancion,
            'descripcion'     => $request->motivo,
            'ejecutado_por'   => auth()->user()?->idUser,
            'es_automatico'   => false,
            'metadata'        => json_encode([
                'dias_ampliados'      => $dias,
                'fecha_fin_anterior'  => $fechaFinAnterior,
                'fecha_fin_nueva'     => $nuevaFecha,
            ]),
            'created_at'      => now(),
        ]);

        // Email
        $user = $registro->user;
        $sancion = $registro->sancion;
        if ($user && $user->Email) {
            try {
                SendGenericEmailJob::dispatch(
                    $user->Email,
                    new SancionNotificacion('ampliada', $user, $sancion, $request->motivo),
                    'sancion-ampliada'
                );
            } catch (\Throwable $e) {
                Log::warning('Error al encolar correo de ampliación', ['error' => $e->getMessage()]);
            }
        }

        return response()->json([
            'message'  => "Sanción ampliada {$dias} días correctamente.",
            'sancion'  => $this->formatearRegistro($registro),
        ]);
    }

    // ────────────────────────────────────────────────────
    // QUITAR / DESACTIVAR SANCIÓN (individual)
    // ────────────────────────────────────────────────────
    public function quitarSancion(Request $request, $id)
    {
        $request->validate(['motivo' => 'nullable|string']);

        $registro = UserSancion::with(['user.persona', 'sancion'])->findOrFail($id);

        $estadoAnterior = $registro->estado_sancion;
        $registro->estado_sancion = EstadoSancion::EXPIRADA;
        $registro->save();

        // Historial
        HistorialSancion::create([
            'user_sancion_id' => $registro->id,
            'accion'          => 'ANULACION',
            'estado_anterior' => $estadoAnterior,
            'estado_nuevo'    => EstadoSancion::EXPIRADA,
            'descripcion'     => $request->motivo ?? 'Quitada por administrador',
            'ejecutado_por'   => auth()->user()?->idUser,
            'es_automatico'   => false,
            'created_at'      => now(),
        ]);

        // Verificar si se puede desbloquear al usuario
        $activas = UserSancion::where('idUser', $registro->idUser)
            ->whereIn('estado_sancion', EstadoSancion::bloqueantes())
            ->where('id', '!=', $registro->id)
            ->count();

        if ($activas === 0) {
            DB::table('users')->where('idUser', $registro->idUser)->update([
                'bloqueado'        => false,
                'bloqueado_motivo' => null,
                'bloqueado_fecha'  => null,
                'bloqueado_por'    => null,
            ]);
        }

        // Email
        $user = $registro->user;
        $sancion = $registro->sancion;
        if ($user && $user->Email) {
            try {
                SendGenericEmailJob::dispatch(
                    $user->Email,
                    new SancionNotificacion('quitada', $user, $sancion, $request->motivo),
                    'sancion-quitada'
                );
            } catch (\Throwable $e) {
                Log::warning('Error al encolar correo de quitar sanción', ['error' => $e->getMessage()]);
            }
        }

        return response()->json([
            'message' => 'Sanción desactivada correctamente.',
            'sancion' => $this->formatearRegistro($registro),
        ]);
    }

    // ────────────────────────────────────────────────────
    // CONFIGURACIÓN DE ESCALAMIENTO (GET + PUT)
    // ────────────────────────────────────────────────────
    public function getConfiguracion()
    {
        $config = DB::table('configuracion_sanciones')->get()
            ->mapWithKeys(fn ($row) => [$row->clave => $row->valor]);

        return response()->json(['configuracion' => $config]);
    }

    public function updateConfiguracion(Request $request)
    {
        $request->validate(['configuracion' => 'required|array']);

        foreach ($request->configuracion as $clave => $valor) {
            DB::table('configuracion_sanciones')
                ->where('clave', $clave)
                ->update([
                    'valor'      => $valor,
                    'updated_at' => now(),
                    'updated_by' => auth()->user()?->idUser,
                ]);
        }

        return response()->json(['message' => 'Configuración actualizada.']);
    }

    // ────────────────────────────────────────────────────
    // HISTORIAL DE UNA SANCIÓN
    // ────────────────────────────────────────────────────
    public function historial($id)
    {
        $entries = HistorialSancion::with('ejecutor.persona')
            ->where('user_sancion_id', $id)
            ->orderByDesc('created_at')
            ->get()
            ->map(fn ($h) => [
                'id'              => $h->id,
                'accion'          => $h->accion,
                'estado_anterior' => $h->estado_anterior,
                'estado_nuevo'    => $h->estado_nuevo,
                'descripcion'     => $h->descripcion,
                'es_automatico'   => $h->es_automatico,
                'ejecutado_por'   => trim(
                    ($h->ejecutor?->persona?->Nombre ?? '') . ' ' .
                    ($h->ejecutor?->persona?->Apellido1 ?? '')
                ) ?: ($h->es_automatico ? 'Sistema' : null),
                'metadata'        => $h->metadata,
                'fecha'           => $h->created_at,
            ]);

        return response()->json(['historial' => $entries]);
    }

    // ════════════════════════════════════════════════════
    // HELPERS PRIVADOS
    // ════════════════════════════════════════════════════

    private function formatearListado($registros)
    {
        return $registros->map(fn ($r) => $this->formatearRegistro($r));
    }

    private function formatearRegistro(UserSancion $r): array
    {
        $persona = $r->user?->persona;
        $admin   = $r->asignadoPor?->persona;

        $nombreAsignador = trim(
            ($admin?->Nombre ?? '') . ' ' . ($admin?->Apellido1 ?? '')
        );

        return [
            'id'                => $r->id,
            'idSancion'         => $r->idSancion,
            'idUser'            => $r->idUser,
            'nivel'             => $r->nivel ?? $r->sancion?->nivel,
            'estado'            => $r->estado_sancion ?? 'ACTIVA',
            'categoria_falta'   => $r->categoria_falta,
            'descripcion'       => $r->sancion?->descripcion,
            'detalle'           => $r->descripcion,
            'fecha_inicio'      => $r->fecha_inicio,
            'fecha_fin'         => $r->fecha_fin,
            'prestamo_id'       => $r->prestamo_id,
            'accion'            => $r->accion,
            'escalada_desde_id' => $r->escalada_desde_id,
            'periodo_academico' => $r->periodo_academico,
            'asignada_por'      => $nombreAsignador !== '' ? $nombreAsignador : null,
            'asignada_por_email' => $r->asignadoPor?->Email ?? null,
            'asignada_en'       => $r->created_at,
            // Datos del usuario
            'usuario_nombre'    => $persona?->Nombre ?? '',
            'usuario_apellido'  => $persona?->Apellido1 ?? '',
            'usuario_email'     => $r->user?->Email ?? '',
            'usuario_rut'       => $persona?->Rut ?? '',
        ];
    }
}