<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class MotivoRechazo extends Model
{
    use HasFactory;

    protected $table = 'motivos_rechazo';

    protected $fillable = [
        'motivo',
        'descripcion',
    ];
}
