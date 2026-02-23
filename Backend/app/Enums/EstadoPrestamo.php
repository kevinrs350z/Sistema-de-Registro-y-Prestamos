<?php

namespace App\Enums;

final class EstadoPrestamo
{
    public const PENDIENTE           = 'PENDIENTE';
    public const APROBADO            = 'APROBADO';
    public const PENDIENTE_ENTREGA   = 'PENDIENTE_ENTREGA';
    public const ENTREGADO           = 'ENTREGADO';
    public const ATRASADO            = 'ATRASADO';
    public const DEVUELTO            = 'DEVUELTO';
    public const RECHAZADO           = 'RECHAZADO';
}

