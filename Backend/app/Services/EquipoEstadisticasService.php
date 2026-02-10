<?php

namespace App\Services;

use App\Models\EquipoEstadoEvento;
use App\Models\Equipo;
use App\Enums\EstadoEquipo;
use Illuminate\Support\Facades\DB;
use Carbon\Carbon;

/**
 * Servicio para generar estadísticas y reportes de fallas/mantenimientos.
 * 
 * Proporciona queries optimizadas para:
 * - Contar mantenimientos por tipo de equipo y tipo de falla
 * - Top modelos con más fallas
 * - Tiempo fuera de servicio (downtime) por modelo
 */
class EquipoEstadisticasService
{
    /**
     * Contar eventos de MANTENIMIENTO agrupados por tipo_equipo y tipo_falla.
     *
     * @param string|null $desde Fecha inicio (Y-m-d)
     * @param string|null $hasta Fecha fin (Y-m-d)
     * @return \Illuminate\Support\Collection
     */
    public function mantenimientosPorTipoYFalla(?string $desde = null, ?string $hasta = null)
    {
        $query = DB::table('equipo_estado_eventos as eee')
            ->join('equipos as e', 'eee.equipo_id', '=', 'e.id')
            ->join('tipo_equipos as te', 'e.tipo_equipo_id', '=', 'te.id')
            ->leftJoin('tipos_falla as tf', 'eee.tipo_falla_id', '=', 'tf.id')
            ->leftJoin('categorias as c', 'te.categoria_id', '=', 'c.id')
            ->where('eee.estado_nuevo', EstadoEquipo::MANTENIMIENTO)
            ->select(
                'te.id as tipo_equipo_id',
                'te.nombre as tipo_equipo',
                'c.nombre as categoria',
                'tf.id as tipo_falla_id',
                'tf.codigo as falla_codigo',
                'tf.nombre as falla_nombre',
                'tf.categoria as falla_categoria',
                DB::raw('COUNT(*) as total_mantenimientos')
            )
            ->groupBy(
                'te.id',
                'te.nombre',
                'c.nombre',
                'tf.id',
                'tf.codigo',
                'tf.nombre',
                'tf.categoria'
            )
            ->orderByDesc('total_mantenimientos');

        if ($desde) {
            $query->where('eee.fecha_evento', '>=', $desde);
        }
        if ($hasta) {
            $query->where('eee.fecha_evento', '<=', $hasta . ' 23:59:59');
        }

        return $query->get();
    }

    /**
     * Top modelos (tipos de equipo) con más fallas en un período.
     *
     * @param int $limite Cantidad de resultados
     * @param string|null $desde Fecha inicio
     * @param string|null $hasta Fecha fin
     * @return \Illuminate\Support\Collection
     */
    public function topModelosConFallas(int $limite = 10, ?string $desde = null, ?string $hasta = null)
    {
        $query = DB::table('equipo_estado_eventos as eee')
            ->join('equipos as e', 'eee.equipo_id', '=', 'e.id')
            ->join('tipo_equipos as te', 'e.tipo_equipo_id', '=', 'te.id')
            ->leftJoin('categorias as c', 'te.categoria_id', '=', 'c.id')
            ->where('eee.estado_nuevo', EstadoEquipo::MANTENIMIENTO)
            ->select(
                'te.id as tipo_equipo_id',
                'te.nombre as tipo_equipo',
                'c.nombre as categoria',
                DB::raw('COUNT(*) as total_fallas'),
                DB::raw('COUNT(DISTINCT e.id) as equipos_afectados')
            )
            ->groupBy('te.id', 'te.nombre', 'c.nombre')
            ->orderByDesc('total_fallas')
            ->limit($limite);

        if ($desde) {
            $query->where('eee.fecha_evento', '>=', $desde);
        }
        if ($hasta) {
            $query->where('eee.fecha_evento', '<=', $hasta . ' 23:59:59');
        }

        return $query->get();
    }

    /**
     * Top modelos con más fallas por mes.
     *
     * @param int $anio
     * @param int $mes
     * @param int $limite
     * @return \Illuminate\Support\Collection
     */
    public function topModelosPorMes(int $anio, int $mes, int $limite = 10)
    {
        $desde = Carbon::create($anio, $mes, 1)->startOfMonth();
        $hasta = Carbon::create($anio, $mes, 1)->endOfMonth();

        return $this->topModelosConFallas($limite, $desde->toDateString(), $hasta->toDateString());
    }

    /**
     * Calcular tiempo fuera de servicio (downtime) por modelo.
     * 
     * Busca pares de eventos: entrada a MANTENIMIENTO -> salida de MANTENIMIENTO
     * Si no hay evento de salida, calcula hasta la fecha actual.
     *
     * @param string|null $desde
     * @param string|null $hasta
     * @return \Illuminate\Support\Collection
     */
    public function downtimePorModelo(?string $desde = null, ?string $hasta = null)
    {
        // Obtener todos los eventos de mantenimiento ordenados
        $eventosQuery = DB::table('equipo_estado_eventos as eee')
            ->join('equipos as e', 'eee.equipo_id', '=', 'e.id')
            ->join('tipo_equipos as te', 'e.tipo_equipo_id', '=', 'te.id')
            ->where(function ($q) {
                $q->where('eee.estado_nuevo', EstadoEquipo::MANTENIMIENTO)
                  ->orWhere('eee.estado_anterior', EstadoEquipo::MANTENIMIENTO);
            })
            ->select(
                'e.id as equipo_id',
                'e.codigo as equipo_codigo',
                'te.id as tipo_equipo_id',
                'te.nombre as tipo_equipo',
                'eee.estado_anterior',
                'eee.estado_nuevo',
                'eee.fecha_evento'
            )
            ->orderBy('e.id')
            ->orderBy('eee.fecha_evento');

        if ($desde) {
            $eventosQuery->where('eee.fecha_evento', '>=', $desde);
        }
        if ($hasta) {
            $eventosQuery->where('eee.fecha_evento', '<=', $hasta . ' 23:59:59');
        }

        $eventos = $eventosQuery->get();

        // Procesar eventos para calcular downtime por equipo
        $downtimePorEquipo = [];
        $enMantenimiento = [];

        foreach ($eventos as $evento) {
            $equipoId = $evento->equipo_id;

            // Entrada a mantenimiento
            if ($evento->estado_nuevo === EstadoEquipo::MANTENIMIENTO) {
                $enMantenimiento[$equipoId] = [
                    'inicio' => Carbon::parse($evento->fecha_evento),
                    'tipo_equipo_id' => $evento->tipo_equipo_id,
                    'tipo_equipo' => $evento->tipo_equipo,
                    'equipo_codigo' => $evento->equipo_codigo,
                ];
            }
            // Salida de mantenimiento
            elseif ($evento->estado_anterior === EstadoEquipo::MANTENIMIENTO) {
                if (isset($enMantenimiento[$equipoId])) {
                    $inicio = $enMantenimiento[$equipoId]['inicio'];
                    $fin = Carbon::parse($evento->fecha_evento);
                    $duracionHoras = $inicio->diffInHours($fin);

                    if (!isset($downtimePorEquipo[$equipoId])) {
                        $downtimePorEquipo[$equipoId] = [
                            'equipo_id' => $equipoId,
                            'equipo_codigo' => $enMantenimiento[$equipoId]['equipo_codigo'],
                            'tipo_equipo_id' => $enMantenimiento[$equipoId]['tipo_equipo_id'],
                            'tipo_equipo' => $enMantenimiento[$equipoId]['tipo_equipo'],
                            'total_horas_downtime' => 0,
                            'incidentes' => 0,
                        ];
                    }

                    $downtimePorEquipo[$equipoId]['total_horas_downtime'] += $duracionHoras;
                    $downtimePorEquipo[$equipoId]['incidentes']++;

                    unset($enMantenimiento[$equipoId]);
                }
            }
        }

        // Equipos que aún están en mantenimiento (calcular hasta ahora)
        foreach ($enMantenimiento as $equipoId => $data) {
            $duracionHoras = $data['inicio']->diffInHours(Carbon::now());

            if (!isset($downtimePorEquipo[$equipoId])) {
                $downtimePorEquipo[$equipoId] = [
                    'equipo_id' => $equipoId,
                    'equipo_codigo' => $data['equipo_codigo'],
                    'tipo_equipo_id' => $data['tipo_equipo_id'],
                    'tipo_equipo' => $data['tipo_equipo'],
                    'total_horas_downtime' => 0,
                    'incidentes' => 0,
                    'en_mantenimiento' => true,
                ];
            }

            $downtimePorEquipo[$equipoId]['total_horas_downtime'] += $duracionHoras;
            $downtimePorEquipo[$equipoId]['incidentes']++;
            $downtimePorEquipo[$equipoId]['en_mantenimiento'] = true;
        }

        // Agrupar por tipo de equipo
        $downtimePorModelo = collect($downtimePorEquipo)
            ->groupBy('tipo_equipo_id')
            ->map(function ($equipos, $tipoEquipoId) {
                $primer = $equipos->first();
                return [
                    'tipo_equipo_id' => $tipoEquipoId,
                    'tipo_equipo' => $primer['tipo_equipo'],
                    'total_horas_downtime' => $equipos->sum('total_horas_downtime'),
                    'promedio_horas_por_incidente' => $equipos->sum('incidentes') > 0
                        ? round($equipos->sum('total_horas_downtime') / $equipos->sum('incidentes'), 2)
                        : 0,
                    'total_incidentes' => $equipos->sum('incidentes'),
                    'equipos_afectados' => $equipos->count(),
                    'equipos_en_mantenimiento' => $equipos->where('en_mantenimiento', true)->count(),
                ];
            })
            ->sortByDesc('total_horas_downtime')
            ->values();

        return $downtimePorModelo;
    }

    /**
     * Resumen de estados actuales del inventario.
     *
     * @return \Illuminate\Support\Collection
     */
    public function resumenEstadosInventario()
    {
        return Equipo::select('estado', DB::raw('COUNT(*) as total'))
            ->groupBy('estado')
            ->orderBy('estado')
            ->get()
            ->mapWithKeys(function ($item) {
                return [$item->estado => $item->total];
            });
    }

    /**
     * Fallas más frecuentes en un período.
     *
     * @param int $limite
     * @param string|null $desde
     * @param string|null $hasta
     * @return \Illuminate\Support\Collection
     */
    public function fallasmasFrecuentes(int $limite = 10, ?string $desde = null, ?string $hasta = null)
    {
        $query = DB::table('equipo_estado_eventos as eee')
            ->join('tipos_falla as tf', 'eee.tipo_falla_id', '=', 'tf.id')
            ->where('eee.estado_nuevo', EstadoEquipo::MANTENIMIENTO)
            ->whereNotNull('eee.tipo_falla_id')
            ->select(
                'tf.id',
                'tf.codigo',
                'tf.nombre',
                'tf.categoria',
                DB::raw('COUNT(*) as total_ocurrencias')
            )
            ->groupBy('tf.id', 'tf.codigo', 'tf.nombre', 'tf.categoria')
            ->orderByDesc('total_ocurrencias')
            ->limit($limite);

        if ($desde) {
            $query->where('eee.fecha_evento', '>=', $desde);
        }
        if ($hasta) {
            $query->where('eee.fecha_evento', '<=', $hasta . ' 23:59:59');
        }

        return $query->get();
    }

    /**
     * Evolución mensual de mantenimientos.
     *
     * @param int $meses Cantidad de meses hacia atrás
     * @return \Illuminate\Support\Collection
     */
    public function evolucionMensualMantenimientos(int $meses = 12)
    {
        $desde = Carbon::now()->subMonths($meses)->startOfMonth();

        return DB::table('equipo_estado_eventos')
            ->where('estado_nuevo', EstadoEquipo::MANTENIMIENTO)
            ->where('fecha_evento', '>=', $desde)
            ->select(
                DB::raw('YEAR(fecha_evento) as anio'),
                DB::raw('MONTH(fecha_evento) as mes'),
                DB::raw('COUNT(*) as total')
            )
            ->groupBy(DB::raw('YEAR(fecha_evento)'), DB::raw('MONTH(fecha_evento)'))
            ->orderBy('anio')
            ->orderBy('mes')
            ->get()
            ->map(function ($item) {
                return [
                    'periodo' => sprintf('%04d-%02d', $item->anio, $item->mes),
                    'anio' => $item->anio,
                    'mes' => $item->mes,
                    'total' => $item->total,
                ];
            });
    }

    /**
     * Equipos actualmente en mantenimiento.
     *
     * @return \Illuminate\Support\Collection
     */
    public function equiposEnMantenimiento()
    {
        return Equipo::with(['tipo', 'ultimoEstadoEvento.tipoFalla', 'ultimoEstadoEvento.usuario'])
            ->where('estado', EstadoEquipo::MANTENIMIENTO)
            ->get()
            ->map(function ($equipo) {
                $evento = $equipo->ultimoEstadoEvento;
                return [
                    'equipo_id' => $equipo->id,
                    'codigo' => $equipo->codigo,
                    'tipo_equipo' => $equipo->tipo ? $equipo->tipo->nombre : null,
                    'fecha_entrada' => $evento ? $evento->fecha_evento->toIso8601String() : null,
                    'dias_en_mantenimiento' => $evento 
                        ? $evento->fecha_evento->diffInDays(Carbon::now())
                        : null,
                    'tipo_falla' => $evento && $evento->tipoFalla ? [
                        'codigo' => $evento->tipoFalla->codigo,
                        'nombre' => $evento->tipoFalla->nombre,
                    ] : null,
                    'motivo' => $evento ? $evento->motivo : null,
                    'observacion' => $evento ? $evento->observacion : null,
                ];
            });
    }
}
