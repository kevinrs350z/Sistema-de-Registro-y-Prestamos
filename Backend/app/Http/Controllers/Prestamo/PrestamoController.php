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
                    $diaSemana = Carbon::now()->dayOfWeekIso; // 1 = Lunes, 7 = Domingo
                    $semanaInicio = Carbon::now()->startOfWeek(Carbon::MONDAY)->toDateString();

                    $existeBloqueo = BloqueoHorario::where('activo', true)
                        ->where('semana_inicio', $semanaInicio)
                        ->where('dia_semana', $diaSemana)
                        ->whereIn('idBloque', $bloques)
                        ->whereIn('idTipoEquipo', $tiposSolicitados)
                        ->exists();

                    if ($existeBloqueo) {
                        return response()->json([
                            'error' => 'BLOQUEO_HORARIO',
                            'message' => 'Hay equipos bloqueados para este bloque y dia. Elige otro horario o equipo.'
                        ], 422);
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



}
