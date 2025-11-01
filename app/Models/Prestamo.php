<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Prestamo extends Model
{
    protected $table = 'prestamos';
    protected $primaryKey = 'idPrestamo';
    public $timestamps = false;

    protected $fillable = [
        'idUser',
        'idEquipo',
        'fecha_inicio',
        'fecha_fin',
        'estado',
        'otro_motivo',
        'tipo',
        'observacion'
    ];

    // 🔹 Relaciones

    public function user()
    {
        return $this->belongsTo(User::class, 'idUser');
    }

    public function equipo()
    {
        return $this->belongsTo(Equipo::class, 'idEquipo');
    }
    public function bloquePrestamo()
    {
        return $this->hasMany(BloquePrestamo::class, 'idPrestamo');
    }
   // public function bloquePrestamo()
    //{
     //   return $this->hasMany(BloquePrestamo::class, 'idPrestamo');
    //}

    public function observacion()
    {
        return $this->hasMany(Observacion::class, 'idPrestamo');
    }
}
