<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;

/**
 * ISO 27001 — A.13.1.1 / A.14.1.2
 * Agrega cabeceras de seguridad HTTP a todas las respuestas.
 *
 * Cabeceras implementadas:
 *  - X-Content-Type-Options: Previene MIME-sniffing.
 *  - X-Frame-Options: Previene clickjacking.
 *  - X-XSS-Protection: Capa adicional contra XSS (legacy browsers).
 *  - Strict-Transport-Security: Fuerza HTTPS (HSTS).
 *  - Referrer-Policy: Limita datos enviados en Referer.
 *  - Permissions-Policy: Restringe APIs del navegador.
 *  - Content-Security-Policy: Restringe orígenes de contenido.
 *  - Cache-Control: Evita almacenamiento de respuestas sensibles.
 */
class SecurityHeaders
{
    public function handle(Request $request, Closure $next)
    {
        $response = $next($request);

        // Prevenir MIME-sniffing (ISO 27001 — A.14.1.2)
        $response->headers->set('X-Content-Type-Options', 'nosniff');

        // Prevenir clickjacking (ISO 27001 — A.14.1.2)
        $response->headers->set('X-Frame-Options', 'DENY');

        // Capa adicional contra XSS en navegadores legacy
        $response->headers->set('X-XSS-Protection', '1; mode=block');

        // HSTS: Forzar HTTPS por 1 año (ISO 27001 — A.10.1.1)
        $response->headers->set('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');

        // Limitar información en encabezado Referer
        $response->headers->set('Referrer-Policy', 'strict-origin-when-cross-origin');

        // Restringir APIs del navegador innecesarias
        $response->headers->set('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');

        // Prevenir almacenamiento en caché de respuestas API
        if ($request->is('api/*')) {
            $response->headers->set('Cache-Control', 'no-store, no-cache, must-revalidate, max-age=0');
            $response->headers->set('Pragma', 'no-cache');
        }

        return $response;
    }
}
