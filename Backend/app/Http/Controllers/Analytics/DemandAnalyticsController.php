<?php

namespace App\Http\Controllers\Analytics;

use App\Http\Controllers\Controller;
use App\Services\Analytics\DemandAnalyticsService;
use Illuminate\Http\Request;

class DemandAnalyticsController extends Controller
{
    public function __construct(private readonly DemandAnalyticsService $service)
    {
    }

    /**
     * KPIs ejecutivos: 6 tarjetas con valor + variación vs período anterior.
     */
    public function executiveKpis(Request $request)
    {
        $tipo = strtoupper(trim($request->input('tipo', 'FUERA')));

        $rules = [
            'tipo'        => ['nullable', 'in:FUERA,DENTRO'],
            'categoria'   => ['nullable', 'string'],
            'asignatura'  => ['nullable', 'integer'],
            'anioIngreso' => ['nullable', 'integer'],
            'estado'      => ['nullable', 'string'],
        ];

        if ($tipo !== 'DENTRO') {
            $rules['from'] = ['required', 'date'];
            $rules['to']   = ['required', 'date', 'after_or_equal:from'];
        } else {
            $rules['from'] = ['nullable', 'date'];
            $rules['to']   = ['nullable', 'date'];
        }

        $validated = $request->validate($rules);
        $validated['tipo'] = $tipo;

        return response()->json($this->service->getExecutiveKpis($validated));
    }

    /**
     * Demanda histórica.
     *
     * tipo=FUERA  → serie temporal por fecha_inicio  (requiere from / to / bucket)
     * tipo=DENTRO → demanda agregada por bloque horario (from / to opcionales)
     */
    public function demandTimeseries(Request $request)
    {
        $tipo = strtoupper(trim($request->input('tipo', 'FUERA')));

        $rules = [
            'tipo'        => ['nullable', 'in:FUERA,DENTRO'],
            'bucket'      => ['nullable', 'in:day,week,month'],
            'categoria'   => ['nullable', 'string'],
            'asignatura'  => ['nullable', 'integer'],
            'anioIngreso' => ['nullable', 'integer'],
            'estado'      => ['nullable', 'string'],
        ];

        // from / to solo requeridos para modo externo
        if ($tipo !== 'DENTRO') {
            $rules['from'] = ['required', 'date'];
            $rules['to']   = ['required', 'date', 'after_or_equal:from'];
        } else {
            $rules['from'] = ['nullable', 'date'];
            $rules['to']   = ['nullable', 'date'];
        }

        $validated = $request->validate($rules);
        $validated['tipo'] = $tipo;

        return response()->json($this->service->getDemandTimeseries($validated));
    }

    /**
     * Distribución de duración de préstamos (boxplot + P90).
     *
     * tipo=FUERA  → duración en días (fecha_inicio / fecha_fin)   – requiere from/to
     * tipo=DENTRO → duración en minutos (bloques.hora_inicio/fin) – from/to opcionales
     */
    public function loanDurationDistribution(Request $request)
    {
        $tipo = strtoupper(trim($request->input('tipo', 'FUERA')));

        $rules = [
            'tipo'        => ['nullable', 'in:FUERA,DENTRO'],
            'groupBy'     => ['nullable', 'in:period,categoria,asignatura'],
            'bucket'      => ['nullable', 'in:week,month'],
            'categoria'   => ['nullable', 'string'],
            'asignatura'  => ['nullable', 'integer'],
            'anioIngreso' => ['nullable', 'integer'],
            'estado'      => ['nullable', 'string'],
        ];

        if ($tipo !== 'DENTRO') {
            $rules['from'] = ['required', 'date'];
            $rules['to']   = ['required', 'date', 'after_or_equal:from'];
        } else {
            $rules['from'] = ['nullable', 'date'];
            $rules['to']   = ['nullable', 'date'];
        }

        $validated = $request->validate($rules);
        $validated['tipo'] = $tipo;

        return response()->json($this->service->getLoanDurationDistribution($validated));
    }

    /**
     * Scatter: Demanda vs Duración típica por periodo/categoría/asignatura.
     *
     * X = # de préstamos
     * Y = duración típica (P50 o P90)
     * size = % rechazos por stock
     */
    public function demandVsDuration(Request $request)
    {
        $tipo = strtoupper(trim($request->input('tipo', 'FUERA')));

        $rules = [
            'tipo' => ['nullable', 'in:FUERA,DENTRO'],
            'groupBy' => ['nullable', 'in:period,categoria,asignatura'],
            'bucket' => ['nullable', 'in:week,month'],
            'durationMetric' => ['nullable', 'in:p50,p90,P50,P90'],
            'drillKey' => ['nullable', 'string'],
            'categoria' => ['nullable', 'string'],
            'asignatura' => ['nullable', 'integer'],
            'anioIngreso' => ['nullable', 'integer'],
            'estado' => ['nullable', 'string'],
        ];

        if ($tipo !== 'DENTRO') {
            $rules['from'] = ['required', 'date'];
            $rules['to'] = ['required', 'date', 'after_or_equal:from'];
        } else {
            $rules['from'] = ['nullable', 'date'];
            $rules['to'] = ['nullable', 'date'];
        }

        $validated = $request->validate($rules);
        $validated['tipo'] = $tipo;

        return response()->json($this->service->getDemandVsDuration($validated));
    }

    /**
     * Scatter: Demanda vs Stock operativo por tipo_equipo/categoría.
     *
     * X = # préstamos aprobados
     * Y = stock operativo actual
     * Color = categoría
     */
    public function demandVsStock(Request $request)
    {
        $tipo = strtoupper(trim($request->input('tipo', 'FUERA')));

        $rules = [
            'tipo' => ['nullable', 'in:FUERA,DENTRO'],
            'groupBy' => ['nullable', 'in:tipo_equipo,categoria'],
            'categoria' => ['nullable', 'string'],
            'asignatura' => ['nullable', 'integer'],
            'anioIngreso' => ['nullable', 'integer'],
            'estado' => ['nullable', 'string'],
        ];

        if ($tipo !== 'DENTRO') {
            $rules['from'] = ['required', 'date'];
            $rules['to'] = ['required', 'date', 'after_or_equal:from'];
        } else {
            $rules['from'] = ['nullable', 'date'];
            $rules['to'] = ['nullable', 'date'];
        }

        $validated = $request->validate($rules);
        $validated['tipo'] = $tipo;

        return response()->json($this->service->getDemandVsStock($validated));
    }

    /**
     * Ranking Top solicitados por demanda.
     *
     * topN: 10 o 20
     * groupBy: equipo | categoria | asignatura
     * drillKey: item seleccionado para devolver serie temporal
     */
    public function topRequested(Request $request)
    {
        $tipo = strtoupper(trim($request->input('tipo', 'FUERA')));

        $rules = [
            'tipo' => ['nullable', 'in:FUERA,DENTRO'],
            'groupBy' => ['nullable', 'in:equipo,categoria,asignatura'],
            'topN' => ['nullable', 'in:10,20'],
            'bucket' => ['nullable', 'in:week,month'],
            'drillKey' => ['nullable', 'string'],
            'categoria' => ['nullable', 'string'],
            'asignatura' => ['nullable', 'integer'],
            'anioIngreso' => ['nullable', 'integer'],
            'estado' => ['nullable', 'string'],
        ];

        if ($tipo !== 'DENTRO') {
            $rules['from'] = ['required', 'date'];
            $rules['to'] = ['required', 'date', 'after_or_equal:from'];
        } else {
            $rules['from'] = ['nullable', 'date'];
            $rules['to'] = ['nullable', 'date'];
        }

        $validated = $request->validate($rules);
        $validated['tipo'] = $tipo;

        return response()->json($this->service->getTopRequested($validated));
    }

    /**
     * Heatmap de demanda por día de semana y bloque/hora.
     *
     * X = bloque horario (DENTRO) u hora (FUERA)
     * Y = día de la semana
     * Valor = # solicitudes (normalizable por semanas)
     */
    public function demandHeatmap(Request $request)
    {
        $tipo = strtoupper(trim($request->input('tipo', 'DENTRO')));

        // Query strings envían "true"/"false" como texto; casteamos antes de validar
        if ($request->has('normalizeByWeeks')) {
            $request->merge([
                'normalizeByWeeks' => filter_var($request->input('normalizeByWeeks'), FILTER_VALIDATE_BOOLEAN),
            ]);
        }

        $rules = [
            'tipo' => ['nullable', 'in:FUERA,DENTRO'],
            'normalizeByWeeks' => ['nullable', 'boolean'],
            'categoria' => ['nullable', 'string'],
            'asignatura' => ['nullable', 'integer'],
            'anioIngreso' => ['nullable', 'integer'],
            'estado' => ['nullable', 'string'],
        ];

        if ($tipo !== 'DENTRO') {
            $rules['from'] = ['required', 'date'];
            $rules['to'] = ['required', 'date', 'after_or_equal:from'];
        } else {
            $rules['from'] = ['nullable', 'date'];
            $rules['to'] = ['nullable', 'date'];
        }

        $validated = $request->validate($rules);
        $validated['tipo'] = $tipo;

        return response()->json($this->service->getDemandHeatmap($validated));
    }

    /**
     * Distribución de motivos de rechazo o estados de préstamo.
     *
     * Si hay pocas categorías => donut
     * Si hay muchas categorías => treemap
     */
    public function rejectionsAndStatus(Request $request)
    {
        $tipo = strtoupper(trim($request->input('tipo', 'FUERA')));

        $rules = [
            'tipo' => ['nullable', 'in:FUERA,DENTRO'],
            'view' => ['nullable', 'in:motivos,estados'],
            'categoria' => ['nullable', 'string'],
            'asignatura' => ['nullable', 'integer'],
            'anioIngreso' => ['nullable', 'integer'],
            'estado' => ['nullable', 'string'],
        ];

        if ($tipo !== 'DENTRO') {
            $rules['from'] = ['required', 'date'];
            $rules['to'] = ['required', 'date', 'after_or_equal:from'];
        } else {
            $rules['from'] = ['nullable', 'date'];
            $rules['to'] = ['nullable', 'date'];
        }

        $validated = $request->validate($rules);
        $validated['tipo'] = $tipo;

        return response()->json($this->service->getRejectionsAndStatus($validated));
    }

    /**
     * Forecast simple de demanda por semana/mes.
     *
     * Modelo interpretable: tendencia lineal + estacionalidad simple.
     */
    public function demandForecast(Request $request)
    {
        $tipo = strtoupper(trim($request->input('tipo', 'FUERA')));

        $rules = [
            'tipo' => ['nullable', 'in:FUERA,DENTRO'],
            'bucket' => ['nullable', 'in:week,month'],
            'horizon' => ['nullable', 'integer', 'min:2', 'max:12'],
            'categoria' => ['nullable', 'string'],
            'asignatura' => ['nullable', 'integer'],
            'anioIngreso' => ['nullable', 'integer'],
            'estado' => ['nullable', 'string'],
        ];

        if ($tipo !== 'DENTRO') {
            $rules['from'] = ['required', 'date'];
            $rules['to'] = ['required', 'date', 'after_or_equal:from'];
        } else {
            $rules['from'] = ['nullable', 'date'];
            $rules['to'] = ['nullable', 'date'];
        }

        $validated = $request->validate($rules);
        $validated['tipo'] = $tipo;

        return response()->json($this->service->getDemandForecast($validated));
    }

    /**
     * Flujo de estados para visualización Sankey.
     */
    public function statusFlow(Request $request)
    {
        $tipo = strtoupper(trim($request->input('tipo', 'FUERA')));

        $rules = [
            'tipo' => ['nullable', 'in:FUERA,DENTRO'],
            'categoria' => ['nullable', 'string'],
            'asignatura' => ['nullable', 'integer'],
            'anioIngreso' => ['nullable', 'integer'],
            'estado' => ['nullable', 'string'],
        ];

        if ($tipo !== 'DENTRO') {
            $rules['from'] = ['required', 'date'];
            $rules['to'] = ['required', 'date', 'after_or_equal:from'];
        } else {
            $rules['from'] = ['nullable', 'date'];
            $rules['to'] = ['nullable', 'date'];
        }

        $validated = $request->validate($rules);
        $validated['tipo'] = $tipo;

        return response()->json($this->service->getStatusFlow($validated));
    }
}
