<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Equipo extends Model
{
    protected $table = 'equipos';
    protected $primaryKey = 'id';
    public $timestamps = true;

    protected $fillable = [
        'tipo_equipo_id',
        'codigo',
        'estado'
    ];

    public function tipo()
    {
        return $this->belongsTo(TipoEquipo::class, 'tipo_equipo_id');
    }

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
}
