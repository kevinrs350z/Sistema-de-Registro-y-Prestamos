<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class BloqueoHorario extends Model
{
    protected $table = 'bloqueos_horario';

    protected $fillable = [
        'dia_semana',
        'idBloque',
        'idTipoEquipo',
        'semana_inicio',
        'activo',
        'motivo',
        'creado_por',
    ];
}
