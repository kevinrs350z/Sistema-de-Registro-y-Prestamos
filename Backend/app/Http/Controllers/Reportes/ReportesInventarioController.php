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
}
