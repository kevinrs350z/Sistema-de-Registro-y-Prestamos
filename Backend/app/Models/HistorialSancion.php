<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

/**
 * Log inmutable de auditoría para sanciones.
 * Cada cambio de estado, ampliación o escalamiento genera un registro aquí.
 */
class HistorialSancion extends Model
{
    protected $table = 'historial_sanciones';
    public $timestamps = false;

    protected $fillable = [
        'user_sancion_id', 'accion', 'estado_anterior', 'estado_nuevo',
        'descripcion', 'ejecutado_por', 'es_automatico', 'metadata', 'created_at',
    ];

    protected $casts = [
        'es_automatico' => 'boolean',
        'metadata'      => 'array',
        'created_at'    => 'datetime',
    ];

    public function userSancion()
    {
        return $this->belongsTo(UserSancion::class, 'user_sancion_id');
    }

    public function ejecutor()
    {
        return $this->belongsTo(User::class, 'ejecutado_por');
    }
}
