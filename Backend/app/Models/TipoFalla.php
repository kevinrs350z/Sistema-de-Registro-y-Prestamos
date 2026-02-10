<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

/**
 * Modelo para el catálogo de tipos de falla.
 * 
 * Este modelo representa las fallas posibles que pueden afectar
 * a los equipos del inventario. Se usa para clasificar las razones
 * por las que un equipo entra en estado MANTENIMIENTO.
 *
 * Categorías disponibles:
 * - CAM: Cámaras y video
 * - AUD: Audio y grabación
 * - IT: Computación
 * - MECH: Equipos mecánicos
 * - PWR: Energía y cables
 * - USR: Uso inadecuado
 * - INV: Inventario/administrativas
 *
 * @property int $id
 * @property string $codigo
 * @property string $nombre
 * @property string|null $descripcion
 * @property string $categoria
 * @property bool $activo
 * @property \Carbon\Carbon $created_at
 * @property \Carbon\Carbon $updated_at
 */
class TipoFalla extends Model
{
    protected $table = 'tipos_falla';

    protected $fillable = [
        'codigo',
        'nombre',
        'descripcion',
        'categoria',
        'activo',
    ];

    protected $casts = [
        'activo' => 'boolean',
    ];

    /**
     * Scope para obtener solo tipos de falla activos.
     *
     * @param \Illuminate\Database\Eloquent\Builder $query
     * @return \Illuminate\Database\Eloquent\Builder
     */
    public function scopeActivos($query)
    {
        return $query->where('activo', true);
    }

    /**
     * Scope para filtrar por categoría.
     *
     * @param \Illuminate\Database\Eloquent\Builder $query
     * @param string $categoria
     * @return \Illuminate\Database\Eloquent\Builder
     */
    public function scopeCategoria($query, string $categoria)
    {
        return $query->where('categoria', $categoria);
    }

    /**
     * Relación: eventos de estado que usan este tipo de falla.
     *
     * @return HasMany
     */
    public function eventos(): HasMany
    {
        return $this->hasMany(EquipoEstadoEvento::class, 'tipo_falla_id');
    }

    /**
     * Categorías disponibles con sus descripciones.
     *
     * @return array<string, string>
     */
    public static function categorias(): array
    {
        return [
            'CAM' => 'Cámaras y Video',
            'AUD' => 'Audio y Grabación',
            'IT' => 'Computación',
            'MECH' => 'Equipos Mecánicos',
            'PWR' => 'Energía y Cables',
            'USR' => 'Uso Inadecuado',
            'INV' => 'Inventario/Administrativas',
        ];
    }
}
