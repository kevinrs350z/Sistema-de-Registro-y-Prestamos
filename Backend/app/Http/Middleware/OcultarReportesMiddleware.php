<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;

class OcultarReportesMiddleware
{
    /**
     * Handle an incoming request.
     *
     * @param  \Closure(\Illuminate\Http\Request): (\Illuminate\Http\Response|\Illuminate\Http\JsonResponse)  $next
     */
    public function handle(Request $request, Closure $next)
    {
        $ocultarReportes = filter_var(env('REPORTES_OCULTOS', true), FILTER_VALIDATE_BOOLEAN);

        if ($ocultarReportes) {
            return response()->json([
                'success' => true,
                'hidden' => true,
                'message' => 'Módulo de reportes oculto temporalmente',
                'data' => [],
            ]);
        }

        return $next($request);
    }
}
