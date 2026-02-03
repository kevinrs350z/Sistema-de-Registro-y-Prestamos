<?php

namespace App\Http\Controllers\Reportes;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Services\Reportes\ReportesTendenciasService;

class ReportesTendenciasController extends Controller
{
    public function __construct(private ReportesTendenciasService $service) {}

    public function prestamosPorMes(Request $request)
    {
        $inicio = $request->query('fecha_inicio') ?? $request->query('inicio');
        $fin = $request->query('fecha_fin') ?? $request->query('fin');
        $granularidad = $request->query('granularidad')
            ?? $request->query('granularity')
            ?? $request->query('periodo');
        $uso = $request->query('uso') ?? $request->query('tipo_uso');

        return response()->json(
            $this->service->prestamosPorPeriodo(
                $inicio,
                $fin,
                $granularidad,
                $uso
            )
        );
    }

    public function categorias(Request $request)
    {
        $inicio = $request->query('fecha_inicio') ?? $request->query('inicio');
        $fin = $request->query('fecha_fin') ?? $request->query('fin');
        $uso = $request->query('uso') ?? $request->query('tipo_uso');

        return response()->json(
            $this->service->categoriasMasDemandadas($inicio, $fin, $uso)
        );
    }

    public function usoPorTipo(Request $request)
    {
        $inicio = $request->query('fecha_inicio') ?? $request->query('inicio');
        $fin = $request->query('fecha_fin') ?? $request->query('fin');
        $uso = $request->query('uso') ?? $request->query('tipo_uso');

        return response()->json(
            $this->service->usoPorTipoUsuario($inicio, $fin, $uso)
        );
    }
}
