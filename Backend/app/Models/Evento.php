<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Evento extends Model
{
    use HasFactory;

    protected $table = 'eventos';

    /**
     * Campos asignables en masa
     */
    protected $fillable = [
        'nombre_evento',
        'fecha_inicio',
        'fecha_fin',
        'responsable_id',
        'responsable_nombre',
        'descripcion',
    ];

    /**
     * Casts automáticos
     */
    protected $casts = [
        'fecha_inicio' => 'date',
        'fecha_fin'    => 'date',
    ];

    /* ============================================================
        RELACIONES
    ============================================================ */

    /**
     * Evento → Préstamo
     * Un evento tiene un único préstamo asociado
     */
    public function prestamo()
    {
        return $this->hasOne(Prestamo::class, 'evento_id');
    }

    /**
     * Responsable del evento (si existe en users)
     */
    public function responsable()
    {
        return $this->belongsTo(User::class, 'responsable_id', 'idUser');
    }
}
