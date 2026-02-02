<?php

namespace App\Http\Controllers\Reportes;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Services\Reportes\ReportesSancionesService;

class ReportesSancionesController extends Controller
{
    public function __construct(private ReportesSancionesService $service) {}

    public function kpis()
    {
        return response()->json($this->service->kpis());
    }

    public function motivos(Request $request)
    {
        return response()->json(
            $this->service->motivosFrecuentes(
                $request->query('inicio'),
                $request->query('fin')
            )
        );
    }

    public function reincidencia(Request $request)
    {
        return response()->json(
            $this->service->reincidenciaUsuarios(
                $request->query('inicio'),
                $request->query('fin')
            )
        );
    }

    public function bloqueos()
    {
        return response()->json($this->service->bloqueosActivos());
    }

    public function relacionAtrasos()
    {
        return response()->json($this->service->relacionAtrasos());
    }
}
