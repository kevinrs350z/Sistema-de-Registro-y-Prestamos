<?php

return [

    /*
    |--------------------------------------------------------------------------
    | Ocultar módulo de reportes
    |--------------------------------------------------------------------------
    |
    | Cuando es true, el middleware OcultarReportesMiddleware intercepta
    | todas las rutas de /dashboard/operational y devuelve un JSON vacío.
    | Útil para deshabilitar temporalmente el módulo en producción.
    |
    */
    'ocultos' => env('REPORTES_OCULTOS', false),

];
