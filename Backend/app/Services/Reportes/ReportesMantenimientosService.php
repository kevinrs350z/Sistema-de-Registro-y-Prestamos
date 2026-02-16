<?php

namespace App\Services\Reportes;

use Illuminate\Support\Facades\DB;
use Illuminate\Http\Request;
use Carbon\Carbon;

class ReportesMantenimientosService
{
    /**
     * Obtener rango de fechas del request o default (12 meses)
     */
    private function getDateRange(?Request $request, int $defaultMonths = 12): array
    {
        if ($request && $request->has('from') && $request->has('to')) {
            return [
                Carbon::parse($request->input('from'))->startOfDay(),
                Carbon::parse($request->input('to'))->endOfDay()
            ];
        }
        return [
            Carbon::now()->subMonths($defaultMonths)->startOfMonth(),
            Carbon::now()->endOfDay()
        ];
    }

    public function atrasos(?Request $request = null)
    {
        return DB::table('prestamos as p')
            ->join('users as u', 'u.idUser', '=', 'p.idUser')
            ->join('persona as per', 'per.idPersona', '=', 'u.idPersona')
            ->where('p.estado', 'APROBADO')
            ->whereNotNull('p.fecha_fin')
            ->where('p.fecha_fin', '<', Carbon::now())
            ->selectRaw("p.idPrestamo, CONCAT(per.Nombre,' ',per.Apellido1) as usuario, u.Email as email, p.fecha_fin")
            ->selectRaw('DATEDIFF(CURDATE(), p.fecha_fin) as dias_atraso')
            ->orderByDesc('dias_atraso')
            ->get();
    }

    public function incidentesPorTipo(?Request $request = null)
    {
        [$start, $end] = $this->getDateRange($request);

        return DB::table('observaciones')
            ->whereBetween('created_at', [$start, $end])
            ->selectRaw("COALESCE(tipo, 'SIN_TIPO') as tipo")
            ->selectRaw('COUNT(*) as total')
            ->groupBy('tipo')
            ->orderByDesc('total')
            ->get();
    }

    public function incidentesPorEquipo(?Request $request = null)
    {
        [$start, $end] = $this->getDateRange($request);

        return DB::table('observaciones as o')
            ->join('prestamos as p', 'p.idPrestamo', '=', 'o.idPrestamo')
            ->join('prestamo_equipo as pe', 'pe.idPrestamo', '=', 'p.idPrestamo')
            ->join('equipos as e', 'e.id', '=', 'pe.idEquipo')
            ->join('tipo_equipos as te', 'te.id', '=', 'e.tipo_equipo_id')
            ->whereBetween('o.created_at', [$start, $end])
            ->select('te.nombre as equipo', DB::raw('COUNT(*) as total'))
            ->groupBy('te.id', 'te.nombre')
            ->orderByDesc('total')
            ->limit(10)
            ->get();
    }

    public function equiposMantenimiento()
    {
        return DB::table('equipos as e')
            ->join('tipo_equipos as te', 'te.id', '=', 'e.tipo_equipo_id')
            ->whereIn('e.estado', ['MANTENIMIENTO', 'BAJA'])
            ->select('e.id as id', 'e.codigo', 'te.nombre as tipo', 'e.estado', 'e.observacion', 'e.updated_at')
            ->orderBy('e.updated_at', 'desc')
            ->get();
    }
}
