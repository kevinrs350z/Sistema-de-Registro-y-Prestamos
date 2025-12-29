<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class Pack extends Model
{
    use SoftDeletes;

    protected $table = 'packs';

    protected $fillable = [
        'nombre',
        'descripcion',
        'imagen',
    ];

    /**
     * Relación con equipos (muchos a muchos)
     * Se implementará cuando tengamos la tabla pivote.
     */
    public function equipos()
    {
        return $this->belongsToMany(
            Equipo::class,
            'pack_equipo',
            'pack_id',
            'equipo_id'
        )->withTimestamps();
    }
}
