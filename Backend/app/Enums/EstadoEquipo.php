<?php

namespace App\Enums;

/**
 * Estados posibles de un equipo en el sistema de inventario.
 * 
 * Estados operativos:
 * - DISPONIBLE: Equipo listo para préstamo
 * - PRESTADO: Equipo actualmente en préstamo
 * - RESERVADO: Equipo reservado para un préstamo futuro
 * 
 * Estados de mantenimiento:
 * - MANTENIMIENTO: Equipo en reparación/revisión (requiere tipo_falla_id)
 * - BAJA_TEMPORAL: Equipo temporalmente fuera de servicio
 * 
 * Estados finales:
 * - DADO_DE_BAJA: Equipo retirado del inventario (requiere motivo)
 */
final class EstadoEquipo
{
    // Estados operativos (existentes - NO MODIFICAR)
    public const DISPONIBLE = 'DISPONIBLE';
    public const PRESTADO   = 'PRESTADO';

    // Estados nuevos para inventario
    public const RESERVADO      = 'RESERVADO';
    public const MANTENIMIENTO  = 'MANTENIMIENTO';
    public const BAJA_TEMPORAL  = 'BAJA_TEMPORAL';
    public const DADO_DE_BAJA   = 'DADO_DE_BAJA';

    /**
     * Retorna todos los estados válidos.
     *
     * @return array<string>
     */
    public static function all(): array
    {
        return [
            self::DISPONIBLE,
            self::PRESTADO,
            self::RESERVADO,
            self::MANTENIMIENTO,
            self::BAJA_TEMPORAL,
            self::DADO_DE_BAJA,
        ];
    }

    /**
     * Verifica si un estado es válido.
     *
     * @param string $estado
     * @return bool
     */
    public static function isValid(string $estado): bool
    {
        return in_array($estado, self::all(), true);
    }

    /**
     * Estados que indican que el equipo está fuera de servicio.
     *
     * @return array<string>
     */
    public static function fueraDeServicio(): array
    {
        return [
            self::MANTENIMIENTO,
            self::BAJA_TEMPORAL,
            self::DADO_DE_BAJA,
        ];
    }

    /**
     * Estados operativos (equipo puede ser usado).
     *
     * @return array<string>
     */
    public static function operativos(): array
    {
        return [
            self::DISPONIBLE,
            self::PRESTADO,
            self::RESERVADO,
        ];
    }
}
