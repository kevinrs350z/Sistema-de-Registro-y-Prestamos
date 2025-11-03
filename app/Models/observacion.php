<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class observacion extends Model
{
    use HasFactory;
    protected $table = 'observaciones';
    protected $primaryKey = 'idObservacion';
    public $timestamps = false;

    protected $fillable = [
        'idPrestamo',
        'descripcion',
        'estado',
    ];

    public function prestamo()
    {
        return $this->belongsTo(Prestamo::class, 'idPrestamo');
    }
}
