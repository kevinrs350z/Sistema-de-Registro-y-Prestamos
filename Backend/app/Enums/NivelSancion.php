<?php

namespace App\Enums;

final class NivelSancion
{
    public const LEVE      = 'LEVE';
    public const MEDIA     = 'MEDIA';
    public const GRAVE     = 'GRAVE';
    public const GRAVISIMA = 'GRAVISIMA';

    /** Orden jerárquico (menor → mayor). */
    private static array $jerarquia = [
        self::LEVE      => 1,
        self::MEDIA     => 2,
        self::GRAVE     => 3,
        self::GRAVISIMA => 4,
    ];

    public static function all(): array
    {
        return [self::LEVE, self::MEDIA, self::GRAVE, self::GRAVISIMA];
    }

    public static function isValid(string $nivel): bool
    {
        return in_array(strtoupper($nivel), self::all(), true);
    }

    /** Devuelve el nivel siguiente (para escalamiento). null si ya es máximo. */
    public static function siguiente(string $nivel): ?string
    {
        $map = [
            self::LEVE  => self::MEDIA,
            self::MEDIA => self::GRAVE,
            self::GRAVE => self::GRAVISIMA,
        ];
        return $map[strtoupper($nivel)] ?? null;
    }

    public static function peso(string $nivel): int
    {
        return self::$jerarquia[strtoupper($nivel)] ?? 0;
    }

    /** Duración base en días (fallback si no hay configuración). */
    public static function duracionBase(string $nivel): int
    {
        return match (strtoupper($nivel)) {
            self::LEVE      => 5,
            self::MEDIA     => 10,
            self::GRAVE     => 21,
            self::GRAVISIMA => 60,
            default         => 7,
        };
    }
}
