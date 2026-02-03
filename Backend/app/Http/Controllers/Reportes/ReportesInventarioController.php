<?php

namespace App\Http\Controllers\Reportes;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Services\Reportes\ReportesInventarioService;

class ReportesInventarioController extends Controller
{
    public function __construct(private ReportesInventarioService $service) {}

    public function estado()
    {
        return response()->json($this->service->estadoInventario());
    }

    public function categorias()
    {
        return response()->json($this->service->equiposPorCategoria());
    }

    public function antiguedad()
    {
        return response()->json($this->service->antiguedadEquipos());
    }

    public function topUtilizados(Request $request)
    {
        return response()->json(
            $this->service->topUtilizados(
                $request->query('inicio'),
                $request->query('fin')
            )
        );
    }

    public function subUtilizados(Request $request)
    {
        return response()->json(
            $this->service->subUtilizados(
                $request->query('inicio'),
                $request->query('fin')
            )
        );
    }

    public function demandaVsDisponibilidad(Request $request)
    {
        $inicio = $request->query('fecha_inicio') ?? $request->query('inicio');
        $fin = $request->query('fecha_fin') ?? $request->query('fin');
        $granularidad = $request->query('granularidad') ?? $request->query('granularity');
        $tipoUso = $request->query('tipo_uso') ?? $request->query('tipoUso') ?? 'ambos';
        $tipoEquipoId = $request->query('tipo_equipo_id') ? (int) $request->query('tipo_equipo_id') : null;

        return response()->json(
            $this->service->demandaVsDisponibilidad(
                $inicio,
                $fin,
                $granularidad,
                $tipoUso,
                $tipoEquipoId
            )
        );
    }
}
