<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;
use App\Models\Pack;

/**
 * Modelo que representa un equipo físico disponible para préstamo.
 *
 * Este modelo almacena la información esencial del equipo, incluyendo su
 * relación con el tipo de equipo y los equipos recomendados asociados para
 * sugerencias o compatibilidad.
 *
 * Atributos principales:
 * - tipo_equipo_id
 * - codigo
 * - estado
 *
 * Relaciones disponibles:
 * - tipo(): Relación con el modelo TipoEquipo.
 * - recomendados(): Equipos sugeridos como complementarios.
 * - recomendadoPor(): Equipos que sugieren este equipo como complemento.
 *
 * @package App\Models
 */

class Equipo extends Model
{
    use SoftDeletes;

    protected $table = 'equipos';
    protected $primaryKey = 'id';
    public $timestamps = true;

    /**
     * Atributos asignables masivamente.
     *
     * @var array
     */
    protected $fillable = [
        'tipo_equipo_id',
        'codigo',
        'estado',
        'estado_fisico',
        'ubicacion',
        'observacion'
    ];
    protected $dates = ['deleted_at'];

    /**
     * Relación: un equipo pertenece a un tipo de equipo.
     *
     * @return \Illuminate\Database\Eloquent\Relations\BelongsTo
     */
    public function tipo()
    {
        return $this->belongsTo(TipoEquipo::class, 'tipo_equipo_id');
    }

    /**
     * Relación: equipos recomendados asociados a este equipo.
     *
     * @return \Illuminate\Database\Eloquent\Relations\BelongsToMany
     */
    public function recomendados()
    {
        return $this->belongsToMany(
            Equipo::class,
            'equipos_relacionados',
            'equipo_id',
            'relacionado_id'
        )->withPivot('tipo_relacion')
         ->withTimestamps();
    }

    /**
     * Relación inversa: equipos que recomiendan a este equipo.
     *
     * @return \Illuminate\Database\Eloquent\Relations\BelongsToMany
     */
    public function recomendadoPor()
    {
        return $this->belongsToMany(
            Equipo::class,
            'equipos_relacionados',
            'relacionado_id',
            'equipo_id'
        )->withPivot('tipo_relacion')
         ->withTimestamps();
    }

    public function packs()
    {
        return $this->belongsToMany(
            Pack::class,
            'pack_equipo',
            'equipo_id',
            'pack_id'
        )->withTimestamps();
    }

    /**
     * Relación: eventos de cambio de estado de este equipo (auditoría).
     *
     * @return \Illuminate\Database\Eloquent\Relations\HasMany
     */
    public function estadoEventos()
    {
        return $this->hasMany(EquipoEstadoEvento::class, 'equipo_id', 'id');
    }

    /**
     * Obtiene el último evento de estado del equipo.
     *
     * @return \Illuminate\Database\Eloquent\Relations\HasOne
     */
    public function ultimoEstadoEvento()
    {
        return $this->hasOne(EquipoEstadoEvento::class, 'equipo_id', 'id')
            ->orderBy('fecha_evento', 'desc')
            ->orderBy('id', 'desc');
    }

    /**
     * Obtiene los eventos de mantenimiento del equipo.
     *
     * @return \Illuminate\Database\Eloquent\Relations\HasMany
     */
    public function mantenimientos()
    {
        return $this->hasMany(EquipoEstadoEvento::class, 'equipo_id', 'id')
            ->where('estado_nuevo', \App\Enums\EstadoEquipo::MANTENIMIENTO);
    }
}
