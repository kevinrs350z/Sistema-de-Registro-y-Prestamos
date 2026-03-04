<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class UserSancion extends Model
{
    protected $table = 'user_sancion';

    protected $fillable = [
        'idUser', 'idSancion', 'nivel', 'estado_sancion', 'categoria_falta',
        'fecha_inicio', 'fecha_fin', 'assigned_by', 'prestamo_id',
        'descripcion', 'accion', 'escalada_desde_id', 'periodo_academico',
    ];

    public $timestamps = true;

    protected $casts = [
        'fecha_inicio' => 'date',
        'fecha_fin'    => 'date',
    ];

    // ── Relaciones ──

    public function user()
    {
        return $this->belongsTo(User::class, 'idUser');
    }

    public function sancion()
    {
        return $this->belongsTo(Sancion::class, 'idSancion');
    }

    public function asignadoPor()
    {
        return $this->belongsTo(User::class, 'assigned_by');
    }

    public function escaladaDesde()
    {
        return $this->belongsTo(self::class, 'escalada_desde_id');
    }

    public function historial()
    {
        return $this->hasMany(HistorialSancion::class, 'user_sancion_id');
    }

    // ── Scopes ──

    public function scopeActivas($query)
    {
        return $query->where('estado_sancion', 'ACTIVA');
    }

    public function scopeDelUsuario($query, int $userId)
    {
        return $query->where('idUser', $userId);
    }

    public function scopeEnVentana($query, int $dias = 180)
    {
        return $query->where('created_at', '>=', now()->subDays($dias));
    }
}
