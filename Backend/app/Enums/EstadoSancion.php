<?php

namespace App\Enums;

final class EstadoSancion
{
    public const PENDIENTE          = 'PENDIENTE';
    public const ACTIVA             = 'ACTIVA';
    public const CUMPLIDA           = 'CUMPLIDA';
    public const ESCALADA           = 'ESCALADA';
    public const APELADA            = 'APELADA';
    public const EN_REVISION_COMITE = 'EN_REVISION_COMITE';
    public const ANULADA            = 'ANULADA';
    public const EXPIRADA           = 'EXPIRADA';

    public static function all(): array
    {
        return [
            self::PENDIENTE,
            self::ACTIVA,
            self::CUMPLIDA,
            self::ESCALADA,
            self::APELADA,
            self::EN_REVISION_COMITE,
            self::ANULADA,
            self::EXPIRADA,
        ];
    }

    public static function isValid(string $estado): bool
    {
        return in_array(strtoupper($estado), self::all(), true);
    }

    /** Estados que cuentan para conteo de escalamiento. */
    public static function contablesParaEscalamiento(): array
    {
        return [self::ACTIVA, self::CUMPLIDA, self::EXPIRADA];
    }

    /** Estados terminales (no pueden transicionar). */
    public static function terminales(): array
    {
        return [self::CUMPLIDA, self::ANULADA];
    }

    /** Estados que bloquean solicitudes de préstamo. */
    public static function bloqueantes(): array
    {
        return [self::ACTIVA, self::PENDIENTE, self::EN_REVISION_COMITE];
    }
}
