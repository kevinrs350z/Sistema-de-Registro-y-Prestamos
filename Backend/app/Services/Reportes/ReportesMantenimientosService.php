<?php

namespace App\Services\Reportes;

use Illuminate\Support\Facades\DB;
use Carbon\Carbon;

class ReportesMantenimientosService
{
    public function atrasos()
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

    public function incidentesPorTipo()
    {
        return DB::table('observaciones')
            ->selectRaw("COALESCE(tipo, 'SIN_TIPO') as tipo")
            ->selectRaw('COUNT(*) as total')
            ->groupBy('tipo')
            ->orderByDesc('total')
            ->get();
    }

    public function incidentesPorEquipo()
    {
        return DB::table('observaciones as o')
            ->join('prestamos as p', 'p.idPrestamo', '=', 'o.idPrestamo')
            ->join('prestamo_equipo as pe', 'pe.idPrestamo', '=', 'p.idPrestamo')
            ->join('equipos as e', 'e.id', '=', 'pe.idEquipo')
            ->join('tipo_equipos as te', 'te.id', '=', 'e.tipo_equipo_id')
            ->select('te.nombre as equipo', DB::raw('COUNT(*) as total'))
            ->groupBy('te.id', 'te.nombre')
            ->orderByDesc('total')
            ->limit(10)
            ->get();
    }

    public function equiposMantenimiento()
    {
        return DB::table('equipos')
            ->whereIn('estado', ['MANTENIMIENTO', 'BAJA'])
            ->select('id as id', 'codigo', 'estado', 'observacion', 'updated_at')
            ->orderBy('updated_at', 'desc')
            ->get();
    }
}
