<?php

namespace App\Services;

use App\Models\Configuracion;
use Illuminate\Support\Facades\Log;

class ConfiguracionService
{
    /**
     * Obtener todas las configuraciones de un grupo.
     */
    public function obtenerPorGrupo(string $grupo): array
    {
        return Configuracion::where('grupo', $grupo)
            ->orderBy('clave')
            ->get()
            ->toArray();
    }

    /**
     * Obtener todas las configuraciones.
     */
    public function obtenerTodas(): array
    {
        return Configuracion::orderBy('grupo')
            ->orderBy('clave')
            ->get()
            ->toArray();
    }

    /**
     * Obtener valor de una configuracion por clave.
     */
    public function obtener(string $clave, $default = null): ?string
    {
        return Configuracion::obtener($clave, $default);
    }

    /**
     * Actualizar multiples configuraciones.
     */
    public function actualizarMultiples(array $configuraciones): array
    {
        $actualizadas = [];

        foreach ($configuraciones as $item) {
            $clave = $item['clave'] ?? null;
            $valor = $item['valor'] ?? null;

            if (!$clave) {
                continue;
            }

            // Validar formato email si la clave contiene 'email'
            if (str_contains($clave, 'email') && !empty($valor)) {
                if (!filter_var($valor, FILTER_VALIDATE_EMAIL)) {
                    throw new \InvalidArgumentException(
                        "El valor para '{$clave}' no es un email valido: {$valor}"
                    );
                }
            }

            $config = Configuracion::where('clave', $clave)->first();

            if ($config) {
                $config->valor = $valor;
                $config->save();
                $actualizadas[] = $config;

                Log::info('Configuracion actualizada', [
                    'clave' => $clave,
                    'valor' => $valor,
                ]);
            }
        }

        return $actualizadas;
    }

    /**
     * Actualizar una sola configuracion.
     */
    public function actualizar(string $clave, ?string $valor): Configuracion
    {
        if (str_contains($clave, 'email') && !empty($valor)) {
            if (!filter_var($valor, FILTER_VALIDATE_EMAIL)) {
                throw new \InvalidArgumentException(
                    "El valor para '{$clave}' no es un email valido: {$valor}"
                );
            }
        }

        $config = Configuracion::where('clave', $clave)->firstOrFail();
        $config->valor = $valor;
        $config->save();

        Log::info('Configuracion actualizada', [
            'clave' => $clave,
            'valor' => $valor,
        ]);

        return $config;
    }
}
