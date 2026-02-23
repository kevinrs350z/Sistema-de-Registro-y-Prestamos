<?php

namespace App\Http\Controllers\Reportes;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Services\Reportes\ReportesAsignaturasService;


class ReportesAsignaturasController extends Controller
{
    protected $service;

    public function __construct(ReportesAsignaturasService $service)
    {
        $this->service = $service;
    }

    public function getUsoAsignaturas(Request $request)
    {
        return response()->json($this->service->getUsoAsignaturas($request));
    }

    public function getTendencia(Request $request)
    {
        return response()->json($this->service->getTendenciaAsignaturas($request));
    }

    public function getEquiposPorAsignatura(Request $request)
    {
        return response()->json(
            $this->service->getEquiposPorAsignatura($request)
        );
    }
}
