<?php

namespace App\Services\Reportes;

use Illuminate\Support\Facades\DB;

class ReportesInventarioService
{
    /**
     * Estado del inventario agrupado por tipo de equipo.
     */
    public function estadoInventario(): array
    {
        return DB::table('equipos as e')
            ->join('tipo_equipos as te', 'te.id', '=', 'e.tipo_equipo_id')
            ->select(
                'te.nombre as modelo',
                'e.estado',
                DB::raw('COUNT(*) as cantidad')
            )
            ->groupBy('te.nombre', 'e.estado')
            ->orderBy('te.nombre')
            ->get()
            ->groupBy('modelo')
            ->map(function ($items, $modelo) {
                $result = ['modelo' => $modelo, 'total' => 0];
                foreach ($items as $item) {
                    $result[strtolower($item->estado)] = (int) $item->cantidad;
                    $result['total'] += (int) $item->cantidad;
                }
                return $result;
            })
            ->values()
            ->toArray();
    }
}
