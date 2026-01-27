<?php

namespace App\Http\Controllers\Reportes;

use App\Http\Controllers\Controller;
use App\Services\Reportes\ReportesMantenimientosService;

class ReportesMantenimientosController extends Controller
{
    public function __construct(private ReportesMantenimientosService $service) {}

    public function atrasos()
    {
        return response()->json($this->service->atrasos());
    }

    public function incidentes()
    {
        return response()->json($this->service->incidentesPorTipo());
    }

    public function incidentesEquipo()
    {
        return response()->json($this->service->incidentesPorEquipo());
    }

    public function equiposMantenimiento()
    {
        return response()->json($this->service->equiposMantenimiento());
    }
}
