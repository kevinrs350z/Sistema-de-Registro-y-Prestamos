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
        return response()->json(
            $this->service->prestamosPorMes(
                $request->query('inicio'),
                $request->query('fin')
            )
        );
    }

    public function categorias(Request $request)
    {
        return response()->json(
            $this->service->categoriasMasDemandadas(
                $request->query('inicio'),
                $request->query('fin')
            )
        );
    }

    public function usoPorTipo(Request $request)
    {
        return response()->json(
            $this->service->usoPorTipoUsuario(
                $request->query('inicio'),
                $request->query('fin')
            )
        );
    }
}
