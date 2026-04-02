<?php

namespace App\Enums;

/**
 * Motivos de rechazo de préstamos para estadísticas de demanda.
 * 
 * Estos motivos permiten calcular la "demanda insatisfecha" por falta de stock
 * vs rechazos por otras razones administrativas.
 */
final class MotivoRechazo
{
    /**
     * Rechazo por falta de stock (demanda insatisfecha real)
     * Indica que el modelo solicitado no tiene unidades disponibles.
     */
    public const SIN_STOCK = 'SIN_STOCK';

    /**
     * Rechazo por conflicto de horario
     * El equipo está reservado para ese horario específico.
     */
    public const CONFLICTO_HORARIO = 'CONFLICTO_HORARIO';

    /**
     * Rechazo por sanción activa del usuario
     */
    public const SANCION_USUARIO = 'SANCION_USUARIO';

    /**
     * Rechazo por falta de documentación o requisitos
     */
    public const DOCUMENTACION = 'DOCUMENTACION';

    /**
     * Rechazo por límite de préstamos simultáneos alcanzado
     */
    public const LIMITE_PRESTAMOS = 'LIMITE_PRESTAMOS';

    /**
     * Otros motivos administrativos
     */
    public const OTRO = 'OTRO';

    /**
     * Retorna todos los motivos válidos.
     *
     * @return array<string>
     */
    public static function all(): array
    {
        return [
            self::SIN_STOCK,
            self::CONFLICTO_HORARIO,
            self::SANCION_USUARIO,
            self::DOCUMENTACION,
            self::LIMITE_PRESTAMOS,
            self::OTRO,
        ];
    }

    /**
     * Verifica si un motivo es válido.
     *
     * @param string $motivo
     * @return bool
     */
    public static function isValid(string $motivo): bool
    {
        return in_array($motivo, self::all(), true);
    }

    /**
     * Motivos que indican demanda insatisfecha real (falta de inventario).
     * Estos se usan para calcular necesidad de compra.
     *
     * @return array<string>
     */
    public static function demandaInsatisfecha(): array
    {
        return [
            self::SIN_STOCK,
            self::CONFLICTO_HORARIO,
        ];
    }

    /**
     * Descripciones amigables de cada motivo.
     *
     * @return array<string, string>
     */
    public static function descripciones(): array
    {
        return [
            self::SIN_STOCK => 'Sin stock disponible',
            self::CONFLICTO_HORARIO => 'Conflicto de horario',
            self::SANCION_USUARIO => 'Usuario con sanción activa',
            self::DOCUMENTACION => 'Documentación incompleta',
            self::LIMITE_PRESTAMOS => 'Límite de préstamos alcanzado',
            self::OTRO => 'Otro motivo',
        ];
    }
}
