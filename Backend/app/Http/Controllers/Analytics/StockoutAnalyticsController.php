<?php

namespace App\Http\Controllers\Analytics;

use App\Http\Controllers\Controller;
use App\Services\Analytics\StockoutAnalyticsService;
use Illuminate\Http\Request;

class StockoutAnalyticsController extends Controller
{
    public function __construct(private readonly StockoutAnalyticsService $service)
    {
    }

    /**
     * Reglas de validación compartidas entre todos los endpoints.
     */
    private function sharedRules(string $tipo): array
    {
        $rules = [
            'tipo'        => ['nullable', 'in:FUERA,DENTRO'],
            'categoria'   => ['nullable', 'string'],
            'equipo'      => ['nullable', 'string'],
            'asignatura'  => ['nullable', 'integer'],
            'anioIngreso' => ['nullable', 'integer'],
        ];

        if ($tipo !== 'DENTRO') {
            $rules['from'] = ['required', 'date'];
            $rules['to']   = ['required', 'date', 'after_or_equal:from'];
        } else {
            $rules['from'] = ['nullable', 'date'];
            $rules['to']   = ['nullable', 'date'];
        }

        return $rules;
    }

    /**
     * KPI Global — Stockout Rate + alertas + top categorías.
     */
    public function kpi(Request $request)
    {
        $tipo = strtoupper(trim($request->input('tipo', 'FUERA')));
        $rules = $this->sharedRules($tipo);

        $validated = $request->validate($rules);
        $validated['tipo'] = $tipo;

        return response()->json($this->service->getStockoutKpi($validated));
    }

    /**
     * Timeseries — Demanda vs Rechazos SIN_STOCK por bucket.
     */
    public function timeseries(Request $request)
    {
        $tipo = strtoupper(trim($request->input('tipo', 'FUERA')));
        $rules = $this->sharedRules($tipo);
        $rules['bucket'] = ['nullable', 'in:day,week,month'];

        $validated = $request->validate($rules);
        $validated['tipo'] = $tipo;

        return response()->json($this->service->getStockoutTimeseries($validated));
    }

    /**
     * Ranking — Top N equipos/categorías con más demanda insatisfecha.
     */
    public function ranking(Request $request)
    {
        $tipo = strtoupper(trim($request->input('tipo', 'FUERA')));
        $rules = $this->sharedRules($tipo);
        $rules['groupBy'] = ['nullable', 'in:equipo,categoria'];
        $rules['topN']    = ['nullable', 'integer', 'min:5', 'max:50'];

        $validated = $request->validate($rules);
        $validated['tipo'] = $tipo;

        return response()->json($this->service->getStockoutRanking($validated));
    }

    /**
     * Scatter — Demanda vs Rechazos SIN_STOCK por categoría/equipo.
     */
    public function scatter(Request $request)
    {
        $tipo = strtoupper(trim($request->input('tipo', 'FUERA')));
        $rules = $this->sharedRules($tipo);
        $rules['groupBy'] = ['nullable', 'in:equipo,categoria'];

        $validated = $request->validate($rules);
        $validated['tipo'] = $tipo;

        return response()->json($this->service->getStockoutScatter($validated));
    }

    /**
     * Priority — Score de prioridad de compra (0-100) con modelo explicable.
     */
    public function priority(Request $request)
    {
        $tipo = strtoupper(trim($request->input('tipo', 'FUERA')));
        $rules = $this->sharedRules($tipo);

        $validated = $request->validate($rules);
        $validated['tipo'] = $tipo;

        return response()->json($this->service->getStockoutPriority($validated));
    }
}
