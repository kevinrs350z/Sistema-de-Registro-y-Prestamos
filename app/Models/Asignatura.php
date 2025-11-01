<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Asignatura extends Model
{
    protected $table = 'asignaturas';
    protected $primaryKey = 'idAsignatura';
    protected $fillable = ['nombre'];
    public $timestamps = true;

    // 🔹 Relaciones
    public function docentes()
    {
        return $this->belongsToMany(Docente::class, 'asignatura_docente', 'idAsignatura', 'idDocente');
    }
}
