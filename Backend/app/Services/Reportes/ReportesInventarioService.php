<?php

namespace App\Services\Reportes;

use Illuminate\Support\Facades\DB;
use Carbon\Carbon;

class ReportesInventarioService
{
    use ReportDateHelpers;

    /**
     * Aplicar filtro de tipo de uso (interno / externo / ambos) si viene definido.
     */
    private function applyTipoUsoFilter($query, ?string $tipoUso, string $alias = 'p'): void
    {
        $tipo = strtoupper((string) $tipoUso);

        if (in_array($tipo, ['INTERNO', 'DENTRO'])) {
            $query->whereRaw("UPPER({$alias}.tipo) IN ('INTERNO', 'DENTRO')");
        } elseif (in_array($tipo, ['EXTERNO', 'FUERA'])) {
            $query->whereRaw("UPPER({$alias}.tipo) IN ('EXTERNO', 'FUERA')");
        }
    }

    public function estadoInventario()
    {
        return DB::table('equipos')
            ->select('estado', DB::raw('COUNT(*) as total'))
            ->groupBy('estado')
            ->orderBy('estado')
            ->get();
    }

    public function equiposPorCategoria()
    {
        return DB::table('equipos as e')
            ->join('tipo_equipos as te', 'te.id', '=', 'e.tipo_equipo_id')
            ->join('categorias as c', 'c.id', '=', 'te.categoria_id')
            ->select('c.nombre as categoria', DB::raw('COUNT(*) as total'))
            ->groupBy('c.id', 'c.nombre')
            ->orderByDesc('total')
            ->get();
    }

    public function antiguedadEquipos()
    {
        return DB::table('equipos')
            ->selectRaw("CASE 
                WHEN TIMESTAMPDIFF(YEAR, created_at, CURDATE()) <= 1 THEN '0-1 años'
                WHEN TIMESTAMPDIFF(YEAR, created_at, CURDATE()) BETWEEN 2 AND 3 THEN '2-3 años'
                WHEN TIMESTAMPDIFF(YEAR, created_at, CURDATE()) BETWEEN 4 AND 5 THEN '4-5 años'
                ELSE '6+ años' END as rango")
            ->selectRaw('COUNT(*) as total')
            ->groupBy('rango')
            ->orderByRaw("FIELD(rango, '0-1 años','2-3 años','4-5 años','6+ años')")
            ->get();
    }

    public function topUtilizados(?string $inicio = null, ?string $fin = null, int $limit = 10)
    {
        [$start, $end] = $this->rangoFechas($inicio, $fin);

        return DB::table('prestamo_equipo as pe')
            ->join('prestamos as p', 'p.idPrestamo', '=', 'pe.idPrestamo')
            ->join('equipos as e', 'e.id', '=', 'pe.idEquipo')
            ->join('tipo_equipos as te', 'te.id', '=', 'e.tipo_equipo_id')
            ->whereBetween('p.created_at', [$start, $end])
            ->select('te.nombre as equipo', DB::raw('COUNT(*) as total'))
            ->groupBy('te.id', 'te.nombre')
            ->orderByDesc('total')
            ->limit($limit)
            ->get();
    }

    public function subUtilizados(?string $inicio = null, ?string $fin = null, int $limit = 10)
    {
        [$start, $end] = $this->rangoFechas($inicio, $fin);

        return DB::table('tipo_equipos as te')
            ->leftJoin('equipos as e', 'e.tipo_equipo_id', '=', 'te.id')
            ->leftJoin('prestamo_equipo as pe', 'pe.idEquipo', '=', 'e.id')
            ->leftJoin('prestamos as p', function ($join) use ($start, $end) {
                $join->on('p.idPrestamo', '=', 'pe.idPrestamo')
                     ->whereBetween('p.created_at', [$start, $end]);
            })
            ->select('te.nombre as equipo', DB::raw('COUNT(p.idPrestamo) as total'))
            ->groupBy('te.id', 'te.nombre')
            ->orderBy('total')
            ->limit($limit)
            ->get();
    }

    /**
     * DEMANDA VS STOCK OPERATIVO
     * 
     * Concepto simplificado y más intuitivo:
     * - Stock Operativo: cantidad fija de equipos disponibles para préstamo (total - no operativos)
     * - Demanda: cuántos equipos distintos se solicitaron en préstamos por período
     * - Déficit: cuando la demanda supera el stock operativo
     * 
     * Barras: demanda de préstamos por período
     * Línea: stock operativo (valor fijo que no cambia por período)
     */
    public function demandaVsDisponibilidad(
        ?string $inicio = null,
        ?string $fin = null,
        ?string $granularity = null,
        ?string $tipoUso = 'ambos',
        ?int $tipoEquipoId = null
    )
    {
        $gran = $this->normalizeGranularity($granularity);
        [$start, $end] = $this->rangoFechas($inicio, $fin);

        $label = $this->getGranularityLabel($gran);
        $format = $this->getGranularityFormat($gran, 'p.fecha_inicio');

        // Scope de tipos de equipo (incluye relacionados)
        $tipoEquipoIds = [];
        $tipoEquipoNombre = 'Todos';
        if ($tipoEquipoId) {
            $tipoEquipoIds = $this->getTipoEquipoIdsWithRelacionados($tipoEquipoId);
            $tipoEquipoNombre = DB::table('tipo_equipos')
                ->where('id', $tipoEquipoId)
                ->value('nombre') ?? 'Seleccionado';
        }

        // Calcular el STOCK OPERATIVO (fijo): total de equipos operativos del tipo
        $equiposQuery = DB::table('equipos');
        if (!empty($tipoEquipoIds)) {
            $equiposQuery->whereIn('tipo_equipo_id', $tipoEquipoIds);
        }

        $totalEquipos = (clone $equiposQuery)->count();
        $noOperativos = (clone $equiposQuery)
            ->whereIn('estado', ['MANTENIMIENTO', 'BAJA'])
            ->count();
        
        // Stock operativo = equipos que pueden prestarse (DISPONIBLE + PRESTADO actualmente)
        $stockOperativo = $totalEquipos - $noOperativos;

        // Demanda de préstamos por período: cuántos equipos distintos se pidieron
        $demandaQuery = DB::table('prestamo_equipo as pe')
            ->join('prestamos as p', 'p.idPrestamo', '=', 'pe.idPrestamo')
            ->join('equipos as e', 'e.id', '=', 'pe.idEquipo')
            ->whereBetween('p.fecha_inicio', [$start, $end]);

        $this->applyTipoUsoFilter($demandaQuery, $tipoUso, 'p');

        if (!empty($tipoEquipoIds)) {
            $demandaQuery->whereIn('e.tipo_equipo_id', $tipoEquipoIds);
        }

        $demanda = $demandaQuery
            ->selectRaw("$format as $label, COUNT(DISTINCT pe.idEquipo) as demanda")
            ->groupBy($label)
            ->orderBy($label)
            ->get();

        $seriesBase = $this->generateTimeSeries($start, $end, $gran);
        $demandaMap = $demanda->keyBy($label);

        $series = [];
        $demandaMaxima = 0;
        $totalDemanda = 0;
        $periodosConDemanda = 0;

        foreach ($seriesBase as $item) {
            $periodo = $item['label'];
            $demandaVal = (int) ($demandaMap[$periodo]->demanda ?? 0);
            
            if ($demandaVal > $demandaMaxima) {
                $demandaMaxima = $demandaVal;
            }
            if ($demandaVal > 0) {
                $totalDemanda += $demandaVal;
                $periodosConDemanda++;
            }

            // Saturación: qué porcentaje del stock se demandó
            $saturacion = $stockOperativo > 0
                ? round(($demandaVal / $stockOperativo) * 100, 1)
                : ($demandaVal > 0 ? 100 : 0);

            // Déficit: positivo si demanda > stock
            $deficit = $demandaVal - $stockOperativo;

            $series[] = [
                'periodo' => $periodo,
                'demanda' => $demandaVal,
                'stockOperativo' => $stockOperativo, // valor fijo para línea horizontal
                'saturacion' => $saturacion,
                'deficit' => $deficit,
            ];
        }

        // Promedio de demanda en períodos con actividad
        $demandaPromedio = $periodosConDemanda > 0 
            ? round($totalDemanda / $periodosConDemanda, 1) 
            : 0;

        return [
            'meta' => [
                'totalEquipos' => $totalEquipos,
                'stockOperativo' => $stockOperativo,
                'noOperativos' => $noOperativos,
                'demandaMaxima' => $demandaMaxima,
                'demandaPromedio' => $demandaPromedio,
                'granularidad' => $gran,
                'tipoUso' => $tipoUso,
                'tipoEquipoId' => $tipoEquipoId,
                'tipoEquipoNombre' => $tipoEquipoNombre,
            ],
            'series' => $series,
        ];
    }

    /**
     * Obtener IDs del tipo de equipo y sus relacionados (bidireccional)
     */
    private function getTipoEquipoIdsWithRelacionados(int $tipoEquipoId): array
    {
        $ids = [$tipoEquipoId];

        $relacionados = DB::table('tipo_equipo_relacionados')
            ->select('tipo_equipo_id', 'relacionado_id')
            ->where('tipo_equipo_id', $tipoEquipoId)
            ->orWhere('relacionado_id', $tipoEquipoId)
            ->get();

        foreach ($relacionados as $rel) {
            $ids[] = (int) $rel->tipo_equipo_id;
            $ids[] = (int) $rel->relacionado_id;
        }

        return array_values(array_unique($ids));
    }
}
