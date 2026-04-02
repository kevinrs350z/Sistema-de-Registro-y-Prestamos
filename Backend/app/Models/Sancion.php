<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

/**
 * Tabla catálogo de sanciones (templates por nivel).
 * Los registros individuales se gestionan a través de UserSancion (pivot).
 */
class Sancion extends Model
{
    protected $table = 'sancions';
    protected $primaryKey = 'idSancion';
    protected $fillable = ['nivel', 'descripcion', 'estado', 'fecha_inicio', 'fecha_fin'];
    public $timestamps = true;

    public function users()
    {
        return $this->belongsToMany(User::class, 'user_sancion', 'idSancion', 'idUser')
            ->withPivot([
                'id', 'assigned_by', 'prestamo_id', 'descripcion', 'accion',
                'nivel', 'estado_sancion', 'categoria_falta',
                'fecha_inicio', 'fecha_fin', 'escalada_desde_id', 'periodo_academico',
                'created_at',
            ])
            ->withTimestamps();
    }

    /** Registros pivot (sanciones individuales) vinculados a este catálogo. */
    public function asignaciones()
    {
        return $this->hasMany(UserSancion::class, 'idSancion', 'idSancion');
    }
}
