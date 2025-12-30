<?php

namespace App\Http\Controllers\Reportes;

use App\Http\Controllers\Controller;
use App\Services\Reportes\ReportesAlumnosAdminService;
use Illuminate\Http\Request;

class ReportesAlumnosAdminController extends Controller
{
    public function __construct(private ReportesAlumnosAdminService $service) {}

    public function kpis()
    {
        return response()->json($this->service->getKPIs());
    }

    public function workflowEstados()
    {
        return response()->json($this->service->getWorkflowEstados());
    }

    public function tiempoResolucion(Request $request)
    {
        $months = (int)($request->query('months', 6));
        return response()->json($this->service->getTiempoResolucion($months));
    }

    public function equiposCriticos(Request $request)
    {
        $months = (int)($request->query('months', 6));
        return response()->json($this->service->getEquiposCriticos($months));
    }

    public function inventarioEvolucion(Request $request)
    {
        $months = (int)($request->query('months', 6));
        return response()->json($this->service->getInventarioEvolucion($months));
    }

    public function heatmap(Request $request)
    {
        $months = (int)($request->query('months', 3));
        return response()->json($this->service->getHeatmapSolicitudes($months));
    }

    public function riesgo(Request $request)
    {
        $months = (int)($request->query('months', 6));
        return response()->json($this->service->getRiesgoPorAlumno($months));
    }
}
