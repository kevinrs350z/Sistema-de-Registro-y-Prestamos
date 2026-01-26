<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class PrestamoHistorial extends Model
{
    use HasFactory;

    protected $table = 'prestamo_historial';

    protected $fillable = [
        'idPrestamo',
        'idUser',
        'estado_anterior',
        'estado_nuevo',
        'descripcion',
    ];

    public function prestamo()
    {
        return $this->belongsTo(Prestamo::class, 'idPrestamo', 'idPrestamo');
    }

    public function usuario()
    {
        return $this->belongsTo(User::class, 'idUser', 'idUser');
    }
}
