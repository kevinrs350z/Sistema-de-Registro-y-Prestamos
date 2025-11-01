<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class BloquePrestamo extends Model
{
    protected $table = 'bloquePrestamos';
    protected $primaryKey = 'idBloquePrestamo';
    public $timestamps = false;

    protected $fillable = [
        'idPrestamo',
        'idBloque',
        'idAsignatura'
    ];

    public function bloque()
    {
        return $this->belongsTo(Bloque::class, 'idBloque');
    }
     public function asignatura()
    {
        return $this->belongsTo(Asignatura::class, 'idAsignatura');
    }


    public function prestamo()
    {
        return $this->belongsTo(Prestamo::class, 'idPrestamo');
    }
}
