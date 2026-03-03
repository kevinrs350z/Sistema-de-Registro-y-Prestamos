<?php

namespace App\Http\Controllers\Reportes\Dashboard;

use App\Http\Controllers\Controller;
use App\Services\Reportes\KpiAuditoriaService;
use Illuminate\Http\Request;

class KpiAuditoriaController extends Controller
{
    public function __construct(private readonly KpiAuditoriaService $service)
    {
    }

    /**
     * Resumen general: tarjetas KPI (fill rate, atraso, throughput, huérfanos).
     */
    public function resumen(Request $request)
    {
        $filters = $request->validate([
            'from' => ['nullable', 'date'],
            'to'   => ['nullable', 'date', 'after_or_equal:from'],
        ]);

        return response()->json($this->service->resumenGeneral($filters));
    }

    /**
     * KPI-04: Fill Rate por Tipo Equipo
     */
    public function fillRate(Request $request)
    {
        $filters = $request->validate([
            'from'           => ['nullable', 'date'],
            'to'             => ['nullable', 'date', 'after_or_equal:from'],
            'tipo_equipo_id' => ['nullable', 'integer'],
        ]);

        return response()->json($this->service->fillRate($filters));
    }

    /**
     * KPI-10: Tasa de Atraso por Tipo Equipo
     */
    public function tasaAtraso(Request $request)
    {
        $filters = $request->validate([
            'from'           => ['nullable', 'date'],
            'to'             => ['nullable', 'date', 'after_or_equal:from'],
            'tipo_equipo_id' => ['nullable', 'integer'],
        ]);

        return response()->json($this->service->tasaAtraso($filters));
    }

    /**
     * KPI-16: Pareto de Rechazos por Motivo
     */
    public function paretoRechazos(Request $request)
    {
        $filters = $request->validate([
            'from'           => ['nullable', 'date'],
            'to'             => ['nullable', 'date', 'after_or_equal:from'],
            'tipo_equipo_id' => ['nullable', 'integer'],
        ]);

        return response()->json($this->service->paretoRechazos($filters));
    }

    /**
     * KPI-24: Throughput del Sistema
     */
    public function throughput(Request $request)
    {
        $filters = $request->validate([
            'from'   => ['nullable', 'date'],
            'to'     => ['nullable', 'date', 'after_or_equal:from'],
            'bucket' => ['nullable', 'in:day,week,month'],
        ]);

        return response()->json($this->service->throughput($filters));
    }

    /**
     * KPI-26: Equipos Huérfanos
     */
    public function equiposHuerfanos(Request $request)
    {
        $filters = $request->validate([
            'meses' => ['nullable', 'integer', 'min:1', 'max:24'],
        ]);

        return response()->json($this->service->equiposHuerfanos($filters));
    }

    /**
     * D.5: Segmentación ABC de Modelos
     */
    public function segmentacionABC(Request $request)
    {
        $filters = $request->validate([
            'from' => ['nullable', 'date'],
            'to'   => ['nullable', 'date', 'after_or_equal:from'],
        ]);

        return response()->json($this->service->segmentacionABC($filters));
    }

    /**
     * KPI-12: Heatmap Bloque × Día × Tipo Equipo (mejorado)
     */
    public function heatmap(Request $request)
    {
        $filters = $request->validate([
            'from'           => ['nullable', 'date'],
            'to'             => ['nullable', 'date', 'after_or_equal:from'],
            'tipo_equipo_id' => ['nullable', 'integer'],
        ]);

        return response()->json($this->service->heatmapMejorado($filters));
    }
}
