<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

/**
 * Modelo para relaciones entre tipos de equipo.
 * 
 * Permite agrupar tipos de equipo que comparten el mismo límite máximo de préstamo.
 * Por ejemplo: Sony A6400, Canon EOS R, Nikon Z6 → todos son "cámaras" y comparten límite.
 * 
 * La relación es bidireccional: si A está relacionado con B, implícitamente B también
 * está relacionado con A para efectos del cálculo del límite máximo.
 */
class TipoEquipoRelacionado extends Model
{
    use HasFactory;

    protected $table = 'tipo_equipo_relacionados';

    protected $fillable = [
        'tipo_equipo_id',
        'relacionado_id',
    ];

    /**
     * Tipo de equipo principal.
     */
    public function tipoEquipo()
    {
        return $this->belongsTo(TipoEquipo::class, 'tipo_equipo_id');
    }

    /**
     * Tipo de equipo relacionado.
     */
    public function relacionado()
    {
        return $this->belongsTo(TipoEquipo::class, 'relacionado_id');
    }
}
