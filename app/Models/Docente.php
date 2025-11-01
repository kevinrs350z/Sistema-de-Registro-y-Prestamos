<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Docente extends Model
{
    protected $table = 'docentes';
    protected $primaryKey = 'idDocente';
    protected $fillable = ['codigo', 'descripcion', 'idPersona'];
    public $timestamps = true;

    // 🔹 Relaciones
    public function persona()
    {
        return $this->belongsTo(Persona::class, 'idPersona');
    }

    public function asignaturas()
    {
        return $this->belongsToMany(Asignatura::class, 'asignatura_docente', 'idDocente', 'idAsignatura');
    }
}
