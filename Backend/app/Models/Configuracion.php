<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Configuracion extends Model
{
    protected $table = 'configuraciones';

    protected $fillable = [
        'clave',
        'valor',
        'descripcion',
        'grupo',
    ];

    /**
     * Obtener el valor de una configuracion por clave.
     * Si no existe en la DB, intenta el fallback de config/mail.php o .env.
     */
    public static function obtener(string $clave, $default = null): ?string
    {
        $config = static::where('clave', $clave)->first();

        if ($config && !empty($config->valor)) {
            return $config->valor;
        }

        // Fallback: buscar en config de Laravel (mail.php, etc.)
        $fallback = config("mail.{$clave}");

        return $fallback ?? $default;
    }

    /**
     * Establecer el valor de una configuracion.
     */
    public static function establecer(string $clave, ?string $valor, ?string $descripcion = null): self
    {
        return static::updateOrCreate(
            ['clave' => $clave],
            array_filter([
                'valor' => $valor,
                'descripcion' => $descripcion,
            ], fn ($v) => !is_null($v))
        );
    }
}
