<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class AsignaturaDocente extends Model
{
    protected $table = 'asignatura_docente';
    protected $fillable = ['idAsignatura', 'idDocente'];
    public $timestamps = false;

    // 🔹 Relaciones
    public function asignatura()
    {
        return $this->belongsTo(Asignatura::class, 'idAsignatura');
    }

    public function docente()
    {
        return $this->belongsTo(Docente::class, 'idDocente');
    }
}
