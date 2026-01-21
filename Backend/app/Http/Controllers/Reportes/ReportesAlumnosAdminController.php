<?php

namespace App\Http\Controllers\Reportes;

use App\Http\Controllers\Controller;
use App\Services\Reportes\ReportesAlumnosAdminService;
use Illuminate\Http\Request;

class ReportesAlumnosAdminController extends Controller
{
    public function __construct(private ReportesAlumnosAdminService $service) {}

    public function kpis(Request $request)
    {
        $months = (int)($request->query('months', 6));
        return response()->json($this->service->getKPIs($months));
    }

    public function prestamosCarrera(Request $request)
    {
        $months = (int)($request->query('months', 12));
        return response()->json($this->service->getPrestamosPorCarrera($months));
    }

    public function sancionesNivel(Request $request)
    {
        $months = (int)($request->query('months', 12));
        return response()->json($this->service->getSancionesPorNivel($months));
    }

    public function evolucionPrestamos(Request $request)
    {
        $months = (int)($request->query('months', 6));
        return response()->json($this->service->getEvolucionPrestamosAlumnos($months));
    }

    public function ranking(Request $request)
    {
        $limit = (int)($request->query('limit', 10));
        $months = (int)($request->query('months', 12));
        return response()->json($this->service->getRankingAlumnos($limit, $months));
    }
}
