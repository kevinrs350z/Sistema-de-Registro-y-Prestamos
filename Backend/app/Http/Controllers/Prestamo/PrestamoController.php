<?php

namespace App\Http\Controllers\Prestamo;

use App\Http\Controllers\Controller;
use App\Http\Requests\Prestamo\StorePrestamoAlumnoRequest;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use App\Models\Prestamo;
use App\Models\BloquePrestamo;
use App\Models\Asignatura;
use App\Models\BloqueoHorario;
use App\Models\PrestamoHistorial;
use App\Enums\EstadoPrestamo;
use App\Enums\EstadoEquipo;
use App\Enums\EstadoSancion;
use App\Enums\NivelSancion;
use App\Models\UserSancion;
use App\Services\PrestamoService;
use Carbon\Carbon;

class PrestamoController extends Controller
{
    // =========================================================
    // LISTAR PRÉSTAMOS DEL USUARIO AUTENTICADO
    // =========================================================
    public function index(Request $request)
    {
        try {
            $user = Auth::user();

            if (!$user) {
                return response()->json(['error' => 'Usuario no autenticado'], 401);
            }

            $prestamos = Prestamo::with([
                    'equipos.tipo',                    
                    'bloquePrestamo.bloque',
                    'bloquePrestamo.asignatura',
                    'observaciones' => function($query) {
                        $query->whereIn('tipo', ['EXTENSION', 'AJUSTE_EQUIPOS'])
                            ->orderBy('created_at', 'desc');
                    }
                ])
                ->where('idUser', $user->idUser)
                ->orderByDesc('idPrestamo')
                ->get()
                ->map(function($prestamo) {
                    $prestamo->tiene_extension = $prestamo->observaciones->isNotEmpty();
                    $prestamo->ultima_extension = $prestamo->observaciones->first();
                    $prestamo->ajuste_equipos = $prestamo->observaciones
                        ->where('tipo', 'AJUSTE_EQUIPOS')
                        ->first();
                    return $prestamo;
                });

            return response()->json($prestamos);

        } catch (\Exception $e) {
            return response()->json([
                'error'   => 'Error al obtener las solicitudes.',
                'message' => $e->getMessage(),
            ], 500);
        }
    }

    // =========================================================
    // CREAR NUEVO PRÉSTAMO (CON CARRITO)
    // =========================================================
    public function store(StorePrestamoAlumnoRequest $request, PrestamoService $service)
    {
        DB::beginTransaction();

        try {
            $user = Auth::user();
            $integrantes = array_values(array_unique($request->input('integrantes', [])));
            $integrantes = array_filter($integrantes, fn ($id) => $id !== ($user?->idUser));

            if ($user?->bloqueado) {
                return response()->json([
                    'message' => 'Alumno bloqueado. No puedes solicitar equipos hasta resolver el incidente.',
                    'motivo' => $user->bloqueado_motivo,
                    'fecha' => $user->bloqueado_fecha
                ], 403);
            }

            // ═══════════════════════════════════════════════════════
            // VERIFICAR SANCIONES ACTIVAS (doble check — seguridad)
            // LEVE/MEDIA/GRAVE: bloqueado durante el periodo asignado
            // GRAVISIMA: bloqueado hasta resolución legal (sin fecha)
            // ═══════════════════════════════════════════════════════
            if ($user) {
                $sancionActiva = UserSancion::where('idUser', $user->idUser)
                    ->whereIn('estado_sancion', [EstadoSancion::ACTIVA, EstadoSancion::EN_REVISION_COMITE])
                    ->where(function ($q) {
                        // GRAVISIMA sin importar fecha / resto con fecha_fin vigente
                        $q->where('nivel', NivelSancion::GRAVISIMA)
                          ->orWhere(function ($q2) {
                              $q2->where('fecha_fin', '>=', now()->toDateString());
                          });
                    })
                    ->orderByRaw("FIELD(nivel, 'GRAVISIMA','GRAVE','MEDIA','LEVE') ASC")
                    ->first();

                if ($sancionActiva) {
                    $nivel = $sancionActiva->nivel;
                    if ($nivel === NivelSancion::GRAVISIMA) {
                        $msg = 'Tienes una sanción GRAVÍSIMA activa. No puedes solicitar equipos hasta que se resuelva el proceso legal/comité.';
                    } else {
                        $fechaFin = $sancionActiva->fecha_fin
                            ? Carbon::parse($sancionActiva->fecha_fin)->format('d/m/Y')
                            : '—';
                        $msg = "Tienes una sanción {$nivel} activa. No puedes solicitar equipos hasta el {$fechaFin}.";
                    }

                    return response()->json([
                        'message' => $msg,
                        'motivo'  => $msg,
                        'fecha'   => $sancionActiva->fecha_inicio,
                        'sancion' => [
                            'nivel'       => $nivel,
                            'fecha_fin'   => $sancionActiva->fecha_fin,
                            'estado'      => $sancionActiva->estado_sancion,
                            'categoria'   => $sancionActiva->categoria_falta,
                        ],
                    ], 403);
                }
            }

            if ($user && $user->hasRole('ALUMNO')) {
                $usuariosValidar = array_merge([$user->idUser], $integrantes);
                $bloqueos = $service->validarMaximoPrestamo($usuariosValidar, $request->equipos);

                if (!empty($bloqueos)) {
                    return response()->json([
                        'error' => 'MAXIMO_PRESTAMO_EXCEDIDO',
                        'message' => 'Se alcanzó el máximo permitido para uno o más integrantes.',
                        'bloqueos' => $bloqueos,
                    ], 422);
                }
            }

            if ($request->tipo === 'DENTRO' && $user && $user->hasRole('ALUMNO')) {
                $tiposSolicitados = $service->obtenerTiposSolicitados($request->equipos ?? []);
                $bloques = $request->bloques ?? [];

                if (!empty($tiposSolicitados) && !empty($bloques)) {
                    $zonaHoraria = config('app.timezone', 'America/Santiago');
                    $fechaReserva = $request->input('fecha_inicio');

                    $fechaReferencia = $fechaReserva
                        ? Carbon::parse($fechaReserva, $zonaHoraria)
                        : Carbon::now($zonaHoraria);

                    $diaSemana = $fechaReferencia->dayOfWeekIso; // 1 = Lunes, 7 = Domingo
                    $semanaInicio = $fechaReferencia->copy()->startOfWeek(Carbon::MONDAY)->toDateString();

                    $existeBloqueo = BloqueoHorario::where('activo', true)
                        ->where('semana_inicio', $semanaInicio)
                        ->where('dia_semana', $diaSemana)
                        ->whereIn('idBloque', $bloques)
                        ->whereIn('idTipoEquipo', $tiposSolicitados)
                        ->exists();

                    if ($existeBloqueo) {
                        return response()->json([
                            'error' => 'BLOQUEO_HORARIO',
                            'message' => 'Este equipo está bloqueado para el horario seleccionado.',
                        ], 409);
                    }
                }
            }

            // Obtener asignatura - puede venir como nombre o como ID
            $asignaturaInput = $request->asignatura;
            $asignaturaId = null;

            if ($asignaturaInput === 'OTROS') {
                // Cuando es OTROS, no se asocia ninguna asignatura
                // El motivo personalizado se guarda en otra_motivo
                $asignaturaId = null;
            } elseif (is_numeric($asignaturaInput)) {
                $asignaturaId = (int) $asignaturaInput;
            } elseif (is_string($asignaturaInput) && trim($asignaturaInput) !== '') {
                // Buscar asignatura por nombre (case insensitive)
                $asignaturaId = Asignatura::whereRaw('LOWER(nombre) = ?', [mb_strtolower(trim($asignaturaInput))])->value('idAsignatura');
            }

            $estadoInicial = ($user && $user->hasRole('ALUMNO')) ? 'PENDIENTE' : 'APROBADO';

            $prestamo = $service->crearPrestamo([
                'idUser'       => $user->idUser,
                'fecha_inicio' => $request->fecha_inicio,
                'fecha_fin'    => $request->fecha_fin,
                'otra_motivo'  => $request->motivo,
                'tipo'         => $request->tipo,
                'estado'       => $estadoInicial,
                'observacion'  => $request->observacion,
            ]);

            // Si se envía grupo_id, asociar el préstamo al grupo
            if ($request->filled('grupo_id')) {
                $service->asignarGrupoPrestamo($request->grupo_id, $prestamo->idPrestamo);
            }

            if ($request->tipo === 'DENTRO') {
                $service->asignarBloques(
                    $prestamo->idPrestamo,
                    $request->bloques,
                    $asignaturaId
                );
            }

            // 🔥 AQUÍ ESTABA EL ERROR
            if ($request->has('equipos')) {
                $service->procesarEquipos(
                    $prestamo->idPrestamo,
                    $request->equipos
                );
            }

            if (!empty($integrantes)) {
                $service->asignarIntegrantes($prestamo->idPrestamo, $integrantes);
            }

            DB::commit();

            try {
                $service->notificarEncargadosSolicitud($prestamo->idPrestamo);
            } catch (\Exception $e) {
                // Evitar bloquear la respuesta si falla la notificacion
                \Log::warning('No se pudo notificar encargados', [
                    'prestamo_id' => $prestamo->idPrestamo,
                    'error' => $e->getMessage(),
                ]);
            }

            return response()->json([
                'message'    => 'Solicitud enviada correctamente',
                'idPrestamo' => $prestamo->idPrestamo
            ], 201);

        } catch (\Exception $e) {
            DB::rollBack();
            if ($e->getCode() === 403 && $e->getMessage() === 'ALUMNO_BLOQUEADO') {
                return response()->json([
                    'message' => 'Alumno bloqueado. No puedes solicitar equipos hasta resolver el incidente.',
                    'motivo' => $user->bloqueado_motivo ?? null,
                    'fecha' => $user->bloqueado_fecha ?? null
                ], 403);
            }
            return response()->json(['error' => $e->getMessage()], 400);
        }
    }

    // =========================================================
    // VALIDAR MÁXIMO POR TIPO (ALUMNO + INTEGRANTES)
    // =========================================================
    public function validarMaximo(Request $request, PrestamoService $service)
    {
        $request->validate([
            'equipos' => 'required|array|min:1',
            'integrantes' => 'nullable|array',
            'integrantes.*' => 'integer|distinct|exists:users,idUser',
        ]);

        $user = Auth::user();
        if (!$user || !$user->hasRole('ALUMNO')) {
            return response()->json(['bloqueos' => []], 200);
        }

        $integrantes = array_values(array_unique($request->input('integrantes', [])));
        $integrantes = array_filter($integrantes, fn ($id) => $id !== ($user->idUser));
        $usuariosValidar = array_merge([$user->idUser], $integrantes);

        $bloqueos = $service->validarMaximoPrestamo($usuariosValidar, $request->equipos);

        return response()->json([
            'bloqueos' => $bloqueos
        ], 200);
    }

    // =========================================================
    // CANCELAR SOLICITUD (ALUMNO)
    // =========================================================
    public function destroy(int $id)
    {
        $user = Auth::user();

        if (!$user) {
            return response()->json(['error' => 'Usuario no autenticado'], 401);
        }

        $prestamo = Prestamo::with('equipos')->find($id);

        if (!$prestamo || $prestamo->idUser !== $user->idUser) {
            return response()->json(['error' => 'No encontrado'], 404);
        }

        // Solo permitir cancelar si aún no se ha entregado
        if (!in_array($prestamo->estado, [EstadoPrestamo::PENDIENTE, EstadoPrestamo::APROBADO, EstadoPrestamo::PENDIENTE_ENTREGA], true)) {
            return response()->json(['error' => 'No se puede cancelar en el estado actual'], 422);
        }

        DB::beginTransaction();

        try {
            $estadoAnterior = $prestamo->estado;

            $prestamo->estado = EstadoPrestamo::RECHAZADO;
            $prestamo->motivo_rechazo = 'CANCELADO_POR_ALUMNO';
            $prestamo->observacion = ($prestamo->observacion ? $prestamo->observacion . ' | ' : '') . '[ALUMNO] Cancelado por el solicitante';
            $prestamo->save();

            foreach ($prestamo->equipos as $equipo) {
                $equipo->estado = EstadoEquipo::DISPONIBLE;
                $equipo->save();
            }

            PrestamoHistorial::create([
                'idPrestamo'      => $prestamo->idPrestamo,
                'idUser'          => $user->idUser,
                'estado_anterior' => $estadoAnterior,
                'estado_nuevo'    => EstadoPrestamo::RECHAZADO,
                'descripcion'     => '[ALUMNO] Cancelación voluntaria'
            ]);

            DB::commit();

            return response()->json(['message' => 'Solicitud cancelada y equipos liberados'], 200);
        } catch (\Throwable $e) {
            DB::rollBack();
            return response()->json(['error' => 'No se pudo cancelar la solicitud'], 500);
        }
    }



}
