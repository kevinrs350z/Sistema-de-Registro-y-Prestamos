<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use App\Enums\EstadoEquipo;

/**
 * Modelo para la tabla de auditoría de estados de equipos.
 * 
 * Esta tabla registra TODOS los cambios de estado de los equipos,
 * funcionando como audit trail / fuente de verdad histórica.
 * Cada cambio de estado genera un INSERT (nunca UPDATE).
 *
 * @property int $id
 * @property int $equipo_id
 * @property int $usuario_id
 * @property string|null $estado_anterior
 * @property string $estado_nuevo
 * @property \Carbon\Carbon $fecha_evento
 * @property string|null $motivo
 * @property string|null $observacion
 * @property int|null $tipo_falla_id
 * @property string|null $origen
 * @property \Carbon\Carbon $created_at
 * @property \Carbon\Carbon $updated_at
 */
class EquipoEstadoEvento extends Model
{
    protected $table = 'equipo_estado_eventos';

    protected $fillable = [
        'equipo_id',
        'usuario_id',
        'estado_anterior',
        'estado_nuevo',
        'fecha_evento',
        'motivo',
        'observacion',
        'tipo_falla_id',
        'origen',
    ];

    protected $casts = [
        'fecha_evento' => 'datetime',
    ];

    /**
     * Orígenes válidos para los eventos.
     */
    public const ORIGEN_ADMIN = 'admin';
    public const ORIGEN_SISTEMA = 'sistema';
    public const ORIGEN_PRESTAMO = 'prestamo';
    public const ORIGEN_MANTENIMIENTO = 'mantenimiento';

    /**
     * Relación: el equipo al que pertenece este evento.
     *
     * @return BelongsTo
     */
    public function equipo(): BelongsTo
    {
        return $this->belongsTo(Equipo::class, 'equipo_id', 'id');
    }

    /**
     * Relación: el usuario que realizó el cambio de estado.
     *
     * @return BelongsTo
     */
    public function usuario(): BelongsTo
    {
        return $this->belongsTo(User::class, 'usuario_id', 'idUser');
    }

    /**
     * Relación: el tipo de falla asociado (si aplica).
     *
     * @return BelongsTo
     */
    public function tipoFalla(): BelongsTo
    {
        return $this->belongsTo(TipoFalla::class, 'tipo_falla_id');
    }

    /**
     * Scope para filtrar por equipo.
     *
     * @param \Illuminate\Database\Eloquent\Builder $query
     * @param int $equipoId
     * @return \Illuminate\Database\Eloquent\Builder
     */
    public function scopeDeEquipo($query, int $equipoId)
    {
        return $query->where('equipo_id', $equipoId);
    }

    /**
     * Scope para filtrar por estado nuevo.
     *
     * @param \Illuminate\Database\Eloquent\Builder $query
     * @param string $estado
     * @return \Illuminate\Database\Eloquent\Builder
     */
    public function scopeConEstado($query, string $estado)
    {
        return $query->where('estado_nuevo', $estado);
    }

    /**
     * Scope para eventos de mantenimiento.
     *
     * @param \Illuminate\Database\Eloquent\Builder $query
     * @return \Illuminate\Database\Eloquent\Builder
     */
    public function scopeMantenimientos($query)
    {
        return $query->where('estado_nuevo', EstadoEquipo::MANTENIMIENTO);
    }

    /**
     * Scope para filtrar por rango de fechas.
     *
     * @param \Illuminate\Database\Eloquent\Builder $query
     * @param string $desde
     * @param string $hasta
     * @return \Illuminate\Database\Eloquent\Builder
     */
    public function scopeEntreFechas($query, string $desde, string $hasta)
    {
        return $query->whereBetween('fecha_evento', [$desde, $hasta]);
    }

    /**
     * Scope para ordenar por fecha descendente.
     *
     * @param \Illuminate\Database\Eloquent\Builder $query
     * @return \Illuminate\Database\Eloquent\Builder
     */
    public function scopeRecientes($query)
    {
        return $query->orderBy('fecha_evento', 'desc');
    }

    /**
     * Verifica si el evento es de entrada a mantenimiento.
     *
     * @return bool
     */
    public function esEntradaMantenimiento(): bool
    {
        return $this->estado_nuevo === EstadoEquipo::MANTENIMIENTO;
    }

    /**
     * Verifica si el evento es de salida de mantenimiento.
     *
     * @return bool
     */
    public function esSalidaMantenimiento(): bool
    {
        return $this->estado_anterior === EstadoEquipo::MANTENIMIENTO 
            && $this->estado_nuevo !== EstadoEquipo::MANTENIMIENTO;
    }

    /**
     * Orígenes válidos para validación.
     *
     * @return array<string>
     */
    public static function origenesValidos(): array
    {
        return [
            self::ORIGEN_ADMIN,
            self::ORIGEN_SISTEMA,
            self::ORIGEN_PRESTAMO,
            self::ORIGEN_MANTENIMIENTO,
        ];
    }
}
