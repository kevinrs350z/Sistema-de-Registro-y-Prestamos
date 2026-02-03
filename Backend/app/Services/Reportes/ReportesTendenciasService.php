<?php

namespace App\Services\Reportes;

use Illuminate\Support\Facades\DB;
use Carbon\Carbon;

class ReportesTendenciasService
{
    use ReportDateHelpers;

    /**
     * Préstamos agrupados por período según granularidad.
     * 
     * @param string|null $inicio Fecha inicio
     * @param string|null $fin Fecha fin
     * @param string|null $granularity day|week|month|quarter|semester|year
     * @return \Illuminate\Support\Collection
     */
    public function prestamosPorPeriodo(
        ?string $inicio = null,
        ?string $fin = null,
        ?string $granularity = 'month',
        ?string $tipoUso = 'ambos'
    )
    {
        [$start, $end] = $this->rangoFechas($inicio, $fin);
        $granularity = $this->normalizeGranularity($granularity);
        $groupExpr = $this->getGranularityFormat($granularity, 'p.fecha_inicio');
        $label = $this->getGranularityLabel($granularity);

        $query = DB::table('prestamos as p')
            ->whereBetween('p.fecha_inicio', [$start, $end]);

        $this->applyTipoUsoFilter($query, $tipoUso);

        $data = $query
            ->selectRaw("$groupExpr as $label")
            ->selectRaw('COUNT(*) as total')
            ->groupBy($label)
            ->orderBy($label)
            ->get();

        // Generar serie temporal completa para evitar gaps
        $series = $this->generateTimeSeries($start, $end, $granularity);
        
        return collect($this->mergeWithTimeSeries($series, $data, $label, 'total'));
    }

    /**
     * Alias para compatibilidad con código existente.
     */
    public function prestamosPorMes(?string $inicio = null, ?string $fin = null)
    {
        return $this->prestamosPorPeriodo($inicio, $fin, 'month');
    }

    public function categoriasMasDemandadas(?string $inicio = null, ?string $fin = null, ?string $tipoUso = 'ambos')
    {
        [$start, $end] = $this->rangoFechas($inicio, $fin);

        $query = DB::table('prestamo_equipo as pe')
            ->join('prestamos as p', 'p.idPrestamo', '=', 'pe.idPrestamo')
            ->join('equipos as e', 'e.id', '=', 'pe.idEquipo')
            ->join('tipo_equipos as te', 'te.id', '=', 'e.tipo_equipo_id')
            ->join('categorias as c', 'c.id', '=', 'te.categoria_id')
            ->whereBetween('p.fecha_inicio', [$start, $end]);

        $this->applyTipoUsoFilter($query, $tipoUso);

        return $query
            ->select('c.nombre as categoria', DB::raw('COUNT(*) as total'))
            ->groupBy('c.id', 'c.nombre')
            ->orderByDesc('total')
            ->limit(10)
            ->get();
    }

    /**
     * Distribución de préstamos por rol de usuario.
     */
    public function usoPorTipoUsuario(?string $inicio = null, ?string $fin = null, ?string $tipoUso = 'ambos')
    {
        [$start, $end] = $this->rangoFechas($inicio, $fin);

        $query = DB::table('prestamos as p')
            ->join('users as u', 'u.idUser', '=', 'p.idUser')
            ->leftJoin('rol_user as ru', 'ru.idUser', '=', 'u.idUser')
            ->leftJoin('rol as r', 'r.idRol', '=', 'ru.idRol')
            ->whereBetween('p.fecha_inicio', [$start, $end]);

        $this->applyTipoUsoFilter($query, $tipoUso);

        return $query
            ->selectRaw("COALESCE(r.Nombre, 'Sin rol') as rol")
            ->selectRaw('COUNT(p.idPrestamo) as total')
            ->groupBy('rol')
            ->orderByDesc('total')
            ->get();
    }

    /**
     * Alias legacy para compatibilidad con dashboards antiguos.
     */
    public function usoInternoExterno(?string $inicio = null, ?string $fin = null)
    {
        [$start, $end] = $this->rangoFechas($inicio, $fin);

        return DB::table('prestamos as p')
            ->whereBetween('p.fecha_inicio', [$start, $end])
            ->selectRaw("CASE 
                WHEN UPPER(p.tipo) IN ('DENTRO', 'INTERNO') THEN 'Uso Interno'
                WHEN UPPER(p.tipo) IN ('FUERA', 'EXTERNO') THEN 'Uso Externo'
                ELSE 'Sin definir'
            END as tipo")
            ->selectRaw('COUNT(*) as total')
            ->groupBy('tipo')
            ->orderByDesc('total')
            ->get();
    }

    /**
     * Aplicar filtro de tipo de uso (interno / externo / ambos) si viene definido.
     */
    private function applyTipoUsoFilter($query, ?string $tipoUso): void
    {
        $tipo = strtoupper((string) $tipoUso);

        if (in_array($tipo, ['INTERNO', 'DENTRO'])) {
            $query->whereRaw("UPPER(p.tipo) IN ('INTERNO', 'DENTRO')");
        } elseif (in_array($tipo, ['EXTERNO', 'FUERA'])) {
            $query->whereRaw("UPPER(p.tipo) IN ('EXTERNO', 'FUERA')");
        }
    }
}
