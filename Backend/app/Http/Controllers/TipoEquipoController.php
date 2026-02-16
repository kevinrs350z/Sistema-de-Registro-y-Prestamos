<?php

namespace App\Http\Controllers;

use App\Http\Requests\Equipo\StoreTipoEquipoRequest as EquipoStoreTipoEquipoRequest;
use Illuminate\Http\Request;
use App\Services\TipoEquipoService;
use App\Http\Requests\TipoEquipo\UpdateTipoEquipoRequest;
use App\Http\Requests\TipoEquipo\StoreTipoEquipoRequest;
use App\Models\TipoEquipo;
use App\Services\PrestamoService;
use App\Enums\EstadoPrestamo;
use Carbon\Carbon;
use Illuminate\Support\Facades\DB;

class TipoEquipoController extends Controller
{
    public function index(TipoEquipoService $service)
    {
        $tipos = $service->getAll();
        // imagen_url se incluye automáticamente gracias al accessor en el modelo
        return response()->json($tipos, 200);
    }
    public function store(StoreTipoEquipoRequest $request, TipoEquipoService $service)
    {
        $data = $request->validated();

        try {

            // =====================================================
            // GUARDAR IMAGEN (si viene)
            // =====================================================
            if ($request->hasFile('imagen')) {
                $ruta = $request->file('imagen')->store('tipo_equipos', 'public');
                $data['imagen'] = $ruta; // se guarda solo la ruta
            }

            $tipoEquipo = $service->create($data);

            return response()->json([
                'message'     => 'Tipo de equipo creado correctamente.',
                'tipoEquipo'  => $tipoEquipo,
            ], 201);

        } catch (\Exception $e) {

            return response()->json([
                'error'   => 'Error al crear el tipo de equipo.',
                'message' => $e->getMessage(),
            ], 500);
        }
    }

    public function show($id, TipoEquipoService $service)
    {
        $data = $service->getById($id);
        return response()->json($data,200);
    }
    public function update(UpdateTipoEquipoRequest $request, TipoEquipoService $service, $id)
    {
        $data = $request->validated();

        if ($request->hasFile('imagen')) {
            $ruta = $request->file('imagen')->store('tipo_equipos', 'public');
            $data['imagen'] = $ruta;
        }

        $tipoEquipo = $service->update($id, $data);

        return response()->json([
            'message' => 'tipo de equipo actualizado correctamente',
            'tipoEquipo' => $tipoEquipo,
        ], 200);
    }
    public function destroy($id, TipoEquipoService $service)
    {
        $resultado = $service->delete($id);

        if ($resultado['error']) {
            return response()->json($resultado, 409);
        }

        return response()->json($resultado, 200);
    }
    public function catalogo(PrestamoService $prestamoService)
    {
        $tipos = TipoEquipo::select(
                'tipo_equipos.id',
                'tipo_equipos.nombre',
                'tipo_equipos.descripcion',
                'tipo_equipos.imagen',
                'tipo_equipos.maximo_prestamo',
                'categorias.nombre as categoria',
                'categorias.icono as categoria_icono'
            )
            ->leftJoin('categorias', 'categorias.id', '=', 'tipo_equipos.categoria_id')
            ->withCount([
                'equipos as stock' => function ($query) {
                    $query->where('estado', 'disponible');
                }
            ])
            ->get();

        $estadosActivos = [
            EstadoPrestamo::PENDIENTE,
            EstadoPrestamo::APROBADO,
            EstadoPrestamo::PENDIENTE_ENTREGA,
            EstadoPrestamo::ENTREGADO,
        ];

        $proximas = DB::table('prestamo_equipo as pe')
            ->join('equipos as e', 'e.id', '=', 'pe.idEquipo')
            ->join('prestamos as p', 'p.idPrestamo', '=', 'pe.idPrestamo')
            ->whereNull('e.deleted_at')
            ->where('pe.devuelto', false)
            ->whereIn('p.estado', $estadosActivos)
            ->whereNotNull('p.fecha_fin')
            ->groupBy('e.tipo_equipo_id')
            ->select('e.tipo_equipo_id', DB::raw('MIN(p.fecha_fin) as proxima_fecha'))
            ->pluck('proxima_fecha', 'e.tipo_equipo_id')
            ->map(function ($fecha) {
                try {
                    return Carbon::parse($fecha)->toIso8601String();
                } catch (\Throwable $e) {
                    return null;
                }
            })
            ->filter()
            ->toArray();

        $user = auth('sanctum')->user();
        $bloqueos = [];

        if ($user && $user->hasRole('ALUMNO')) {
            $bloqueos = $prestamoService->obtenerBloqueoPorTipoUsuario($user->idUser);
        }

        $tipos = $tipos->map(function ($t) use ($bloqueos, $proximas) {
            $info = $bloqueos[$t->id] ?? null;
            $bloqueado = (bool) ($info['bloqueado'] ?? false);
            $bloqueadoPorSolicitud = (bool) ($info['bloqueado_por_solicitud'] ?? false);
            $grupoRelacionados = $info['grupo_relacionados'] ?? [$t->id];

            // imagen_url ya viene del modelo gracias al accessor
            return array_merge($t->toArray(), [
                'prestamos_activos' => $info['activos'] ?? 0,
                'bloqueado' => $bloqueado,
                'bloqueo_motivo' => $bloqueado
                    ? ($bloqueadoPorSolicitud
                        ? 'Ya tienes una solicitud activa para este equipo. Espera aprobación o devolución.'
                        : 'Límite alcanzado para este tipo de equipo (incluyendo relacionados).')
                    : null,
                'grupo_relacionados' => $grupoRelacionados,
                'proxima_disponibilidad' => $proximas[$t->id] ?? null,
            ]);
        });

        return response()->json($tipos, 200);
    }


    public function equiposDisponibles($id)
    {
        $equipos = \App\Models\Equipo::where('tipo_equipo_id', $id)
            ->where('estado', 'disponible')
            ->select('id', 'codigo', 'estado', 'tipo_equipo_id')
            ->get();

        return response()->json($equipos, 200);
    }


}
