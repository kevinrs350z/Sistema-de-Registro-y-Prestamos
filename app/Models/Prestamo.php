<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Prestamo extends Model
{
    use HasFactory;

    protected $table = 'prestamos';
    protected $primaryKey = 'idPrestamo';

    // Si la PK no es auto-incremental habría que indicarlo, pero la tenías como id().
    public $incrementing = true;
    protected $keyType = 'int';

    protected $fillable = [
        'idUser',
        'fecha_inicio',
        'fecha_fin',
        'estado',
        'otra_motivo',
        'tipo',
        'observacion', // respeta como lo tengas en BD
    ];

    /* ===================== Relaciones ===================== */

    // Un préstamo pertenece a un usuario
    public function user()
    {
        // asumiendo que users tiene PK idUser (como usas en FK)
        return $this->belongsTo(User::class, 'idUser', 'idUser');
    }

    // Un préstamo tiene muchos equipos (relación N a N por pivot)
    public function equipos()
    {
        return $this->belongsToMany(
            Equipo::class,
            'prestamo_equipo',
            'idPrestamo', // FK en la tabla pivot hacia Prestamo
            'idEquipo'    // FK en la tabla pivot hacia Equipo
        );
    }

    // Un préstamo tiene muchos registros de bloque_prestamo
    public function bloquePrestamo()
    {
        return $this->hasMany(BloquePrestamo::class, 'idPrestamo', 'idPrestamo');
    }
}
