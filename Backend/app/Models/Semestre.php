<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Semestre extends Model
{
    use HasFactory;

    protected $table = 'semestres';
    protected $primaryKey = 'idSemestre';

    protected $fillable = [
        'nombre',
        'numero',
        //'tipo',
    ];

    public function asignaturas()
    {
        return $this->belongsToMany(
            Asignatura::class,
            'asignatura_semestre',
            'idSemestre',
            'idAsignatura'
        );
    }
}
