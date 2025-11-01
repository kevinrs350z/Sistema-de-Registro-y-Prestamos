<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Equipo extends Model
{
    protected $table = 'equipos';
    protected $primaryKey = 'idEquipo';
    public $timestamps = false;

    protected $fillable = [
        'nombre',
        'codigo',
        'categoria',
        'estado',
        'tipo'
    ];

    // 🔹 Relaciones

    public function prestamos()
    {
        return $this->hasMany(Prestamo::class, 'idEquipo');
    }

    public function pack()
    {
        return $this->belongsToMany(Pack::class, 'pack_equipo', 'idEquipo', 'idPack');
    }
}
