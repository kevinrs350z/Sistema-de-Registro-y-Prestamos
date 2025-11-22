<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class EquipoRelacionado extends Model
{
    use HasFactory;

    protected $table = 'equipos_relacionados';

    protected $fillable = [
        'equipo_id',
        'relacionado_id',
        'tipo_relacion',
    ];
}
