<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Bloque extends Model
{
    protected $table = 'bloques';
    protected $primaryKey = 'idBloque';
    public $timestamps = false;

    protected $fillable = [
        'hora_inicio',
        'hora_fin'
    ];

public function prestamos()
    {
        return $this->belongsToMany(
            Prestamo::class,
            'bloquePrestamos',
            'idBloque',
            'idPrestamo'
        );
    }
}
