<?php

namespace App\Http\Controllers\Reportes;

use App\Http\Controllers\Controller;
use App\Services\Reportes\ReportesAlumnosAdminService;
use Illuminate\Http\Request;

/**
 * Controlador de reportes de alumnos con filtros BI estándar.
 * 
 * Parámetros de filtro soportados:
 * - from: Fecha inicio (YYYY-MM-DD)
 * - to: Fecha fin (YYYY-MM-DD)
 * - uso: interno | externo | ambos
 * - anioIngreso: Año de ingreso del alumno (ej: 2021, 2022)
 * - granularity: day | week | month | quarter | semester | year
 * - limit: Límite de resultados (para ranking)
 */
class ReportesAlumnosAdminController extends Controller
{
    public function __construct(private ReportesAlumnosAdminService $service) {}

    /**
     * KPIs generales de alumnos
     * GET /api/reportes/alumnos/kpis?from=&to=&uso=&anioIngreso=
     */
    public function kpis(Request $request)
    {
        return response()->json($this->service->getKPIs($request));
    }

    /**
     * Préstamos por carrera
     * GET /api/reportes/alumnos/prestamos-carrera?from=&to=&uso=&anioIngreso=
     */
    public function prestamosCarrera(Request $request)
    {
        return response()->json($this->service->getPrestamosPorCarrera($request));
    }

    /**
     * Sanciones por nivel
     * GET /api/reportes/alumnos/sanciones-nivel?anioIngreso=
     */
    public function sancionesNivel(Request $request)
    {
        return response()->json($this->service->getSancionesPorNivel($request));
    }

    /**
     * Evolución de préstamos (12 meses completos con 0s)
     * GET /api/reportes/alumnos/evolucion-prestamos?from=&to=&uso=&anioIngreso=&granularity=month
     */
    public function evolucionPrestamos(Request $request)
    {
        return response()->json($this->service->getEvolucionPrestamosAlumnos($request));
    }

    /**
     * Ranking de alumnos con métricas completas
     * GET /api/reportes/alumnos/ranking?from=&to=&uso=&anioIngreso=&limit=10
     */
    public function ranking(Request $request)
    {
        $limit = (int)($request->query('limit', 10));
        return response()->json($this->service->getRankingAlumnos($request, $limit));
    }
}
