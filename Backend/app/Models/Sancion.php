<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Sancion extends Model
{
    protected $table = 'sancions';
    protected $primaryKey = 'idSancion';
    protected $fillable = ['nivel', 'descripcion', 'estado', 'fecha_inicio', 'fecha_fin'];
    public $timestamps = true;

    // 🔹 Relaciones
    public function users()
    {
        return $this->belongsToMany(User::class, 'user_sancion', 'idSancion', 'idUser')
            ->withPivot(['assigned_by', 'prestamo_id', 'descripcion', 'accion', 'created_at'])
            ->withTimestamps();
    }
}
