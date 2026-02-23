<?php

namespace App\Http\Controllers\Reportes;

use App\Http\Controllers\Controller;
use App\Services\Reportes\ReportesMantenimientosService;
use Illuminate\Http\Request;

class ReportesMantenimientosController extends Controller
{
    public function __construct(private ReportesMantenimientosService $service) {}

    public function atrasos(Request $request)
    {
        return response()->json($this->service->atrasos($request));
    }

    public function incidentes(Request $request)
    {
        return response()->json($this->service->incidentesPorTipo($request));
    }

    public function incidentesEquipo(Request $request)
    {
        return response()->json($this->service->incidentesPorEquipo($request));
    }

    public function equiposMantenimiento()
    {
        return response()->json($this->service->equiposMantenimiento());
    }
}
