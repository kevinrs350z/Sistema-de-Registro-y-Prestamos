<?php

namespace App\Http\Controllers\Reportes\Dashboard;

use App\Http\Controllers\Controller;
use App\Services\Reportes\DashboardOperationalService;

class DashboardOperationalController extends Controller
{
    protected $service;

    public function __construct(DashboardOperationalService $service)
    {
        $this->service = $service;
    }

    public function getKPIs()
    {
        return response()->json($this->service->getKPIsOperativos());
    }

    public function getEstadoInventario()
    {
        return response()->json($this->service->getEstadoInventario());
    }

    public function getAlertasCriticas()
    {
        return response()->json($this->service->getAlertasCriticas());
    }

    public function getActividadReciente()
    {
        return response()->json($this->service->getActividadReciente());
    }

    public function getSaludSistema()
    {
        return response()->json($this->service->getSaludSistema());
    }

    // Nuevos endpoints operativos - Equipos
    public function getDisponibilidad()
    {
        return response()->json($this->service->getDisponibilidadEquipos());
    }

    public function getEquiposCriticos()
    {
        return response()->json($this->service->getEquiposCriticos());
    }

    public function getEquipoUltimoEvento($id)
    {
        return response()->json($this->service->getEquipoUltimoEvento((int)$id));
    }

    // Profesores - operativos por profesor
    public function getPrestamosActivosPorProfesor($id)
    {
        return response()->json($this->service->getPrestamosActivosPorProfesor((int)$id));
    }

    public function getPrestamosProximosPorProfesor($id)
    {
        return response()->json($this->service->getPrestamosProximosPorProfesor((int)$id));
    }

    public function getRiesgosPorProfesor($id)
    {
        return response()->json($this->service->getRiesgosPorProfesor((int)$id));
    }

    public function getResponsabilidadPorProfesor($id)
    {
        return response()->json($this->service->getResponsabilidadPorProfesor((int)$id));
    }

    public function getAlertasPorProfesor($id)
    {
        return response()->json($this->service->getAlertasPorProfesor((int)$id));
    }

    // KPIs de inventario, mantenimientos y sanciones
    public function getKPIsInventario()
    {
        return response()->json($this->service->getKPIsInventario());
    }

    public function getKPIsMantenimientos()
    {
        return response()->json($this->service->getKPIsMantenimientos());
    }

    public function getKPIsSanciones()
    {
        return response()->json($this->service->getKPIsSanciones());
    }
}
