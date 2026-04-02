<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use App\Models\Equipo;
use App\Models\User;

class EquipoHistorial extends Model
{
    protected $table = 'equipo_historials';

    protected $fillable = [
        'equipo_id',
        'admin_id',
        'accion',
        'detalle',
    ];

    protected $casts = [
        'detalle' => 'array',
    ];

    public function equipo()
    {
        return $this->belongsTo(Equipo::class, 'equipo_id', 'id');
    }

    public function admin()
    {
        return $this->belongsTo(User::class, 'admin_id', 'idUser');
    }
}
