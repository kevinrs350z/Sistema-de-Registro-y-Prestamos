<?php

namespace App\Http\Controllers\Reportes;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Services\Reportes\ReporteProfesorService;

class ReporteProfesorController extends Controller
{
    public function __construct(
        private ReporteProfesorService $service
    ) {}

    // Gráfico: préstamos por profesor
    public function prestamosPorProfesor()
    {
        return response()->json(
            $this->service->getPrestamosPorProfesor()
        );
    }

    // Gráfico: tendencia mensual
    public function tendencia()
    {
        return response()->json(
            $this->service->getTendenciaMensual()
        );
    }

    // Tabla: equipos más solicitados por profesor
    public function equipos(Request $request)
    {
        $page = $request->get('page', 1);
        $pageSize = $request->get('pageSize', 10);

        return response()->json(
            $this->service->getEquiposPorProfesor($page, $pageSize)
        );
    }
}
