<?php

namespace App\Services\Reportes;

use Carbon\Carbon;

/**
 * Trait para estandarizar el manejo de fechas y granularidad en reportes.
 * 
 * Inspirado en patrones de dashboards BI como Power BI / Apache Superset.
 */
trait ReportDateHelpers
{
    /**
     * Obtener rango de fechas con defaults inteligentes.
     * 
     * @param string|null $inicio Fecha inicio (YYYY-MM-DD)
     * @param string|null $fin Fecha fin (YYYY-MM-DD)
     * @param int $defaultMonths Meses hacia atrás por defecto
     * @return array [Carbon, Carbon]
     */
    protected function rangoFechas(?string $inicio, ?string $fin, int $defaultMonths = 12): array
    {
        $start = $inicio 
            ? Carbon::parse($inicio)->startOfDay() 
            : Carbon::now()->subMonths($defaultMonths)->startOfMonth();
        
        $end = $fin 
            ? Carbon::parse($fin)->endOfDay() 
            : Carbon::now()->endOfDay();

        return [$start, $end];
    }

    /**
     * Obtener formato SQL para agrupación por granularidad.
     * 
     * @param string $granularity day|week|month|quarter|semester|year
     * @param string $column Columna de fecha
     * @return string SQL expression
     */
    protected function getGranularityFormat(string $granularity, string $column = 'fecha_inicio'): string
    {
        return match ($granularity) {
            'day' => "DATE($column)",
            'week' => "DATE_FORMAT($column, '%Y-%u')",
            'month' => "DATE_FORMAT($column, '%Y-%m')",
            'quarter' => "CONCAT(YEAR($column), '-Q', QUARTER($column))",
            'semester' => "CONCAT(YEAR($column), '-S', IF(MONTH($column) <= 6, 1, 2))",
            'year' => "YEAR($column)",
            default => "DATE_FORMAT($column, '%Y-%m')",
        };
    }

    /**
     * Obtener label legible para el período agrupado.
     * 
     * @param string $granularity
     * @return string Alias para SELECT
     */
    protected function getGranularityLabel(string $granularity): string
    {
        return match ($granularity) {
            'day' => 'fecha',
            'week' => 'semana',
            'month' => 'mes',
            'quarter' => 'trimestre',
            'semester' => 'semestre',
            'year' => 'año',
            default => 'periodo',
        };
    }

    /**
     * Normalizar parámetro de granularidad.
     * 
     * @param string|null $granularity
     * @return string
     */
    protected function normalizeGranularity(?string $granularity): string
    {
        $allowed = ['day', 'week', 'month', 'quarter', 'semester', 'year'];
        return in_array($granularity, $allowed) ? $granularity : 'month';
    }

    /**
     * Generar serie temporal completa (para evitar gaps en gráficos).
     * 
     * @param Carbon $start
     * @param Carbon $end
     * @param string $granularity
     * @return array
     */
    protected function generateTimeSeries(Carbon $start, Carbon $end, string $granularity): array
    {
        $series = [];
        $current = $start->copy();

        while ($current <= $end) {
            $label = match ($granularity) {
                'day' => $current->format('Y-m-d'),
                'week' => $current->format('Y-W'),
                'month' => $current->format('Y-m'),
                'quarter' => $current->format('Y') . '-Q' . ceil($current->month / 3),
                'semester' => $current->format('Y') . '-S' . ($current->month <= 6 ? 1 : 2),
                'year' => $current->format('Y'),
                default => $current->format('Y-m'),
            };

            if (!in_array($label, array_column($series, 'label'))) {
                $series[] = ['label' => $label, 'total' => 0];
            }

            $current = match ($granularity) {
                'day' => $current->addDay(),
                'week' => $current->addWeek(),
                'month' => $current->addMonth(),
                'quarter' => $current->addMonths(3),
                'semester' => $current->addMonths(6),
                'year' => $current->addYear(),
                default => $current->addMonth(),
            };
        }

        return $series;
    }

    /**
     * Fusionar datos reales con serie temporal completa.
     * 
     * @param array $series Serie temporal vacía
     * @param \Illuminate\Support\Collection $data Datos reales
     * @param string $labelKey Columna de etiqueta en datos
     * @param string $valueKey Columna de valor en datos
     * @return array
     */
    protected function mergeWithTimeSeries(array $series, $data, string $labelKey = 'mes', string $valueKey = 'total'): array
    {
        $dataMap = $data->keyBy($labelKey)->toArray();

        foreach ($series as &$item) {
            if (isset($dataMap[$item['label']])) {
                $item['total'] = (int) $dataMap[$item['label']][$valueKey];
            }
        }

        return $series;
    }
}
