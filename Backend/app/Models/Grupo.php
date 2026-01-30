<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Grupo extends Model
{
    use HasFactory;
    protected $table = 'grupos';
    protected $fillable = ['nombre', 'asignatura_id', 'docente_id'];

    public function usuarios()
    {
        return $this->belongsToMany(User::class, 'grupo_usuario', 'grupo_id', 'usuario_id');
    }

    public function prestamos()
    {
        return $this->belongsToMany(Prestamo::class, 'grupo_prestamo', 'grupo_id', 'prestamo_id');
    }

    public function asignatura()
    {
        return $this->belongsTo(Asignatura::class, 'asignatura_id');
    }

    public function docente()
    {
        return $this->belongsTo(User::class, 'docente_id');
    }
}
