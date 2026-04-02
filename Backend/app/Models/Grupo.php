<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Grupo extends Model
{
    use HasFactory;

    protected $table = 'grupos';

    protected $fillable = [
        'nombre',
        'descripcion',
        'asignatura_id',
        'bloque_id',
        'docente_id',
        'estado',
        'anio',
        'semestre',
    ];

    protected $casts = [
        'anio' => 'integer',
        'semestre' => 'integer',
        'asignatura_id' => 'integer',
        'bloque_id' => 'integer',
        'docente_id' => 'integer',
    ];

    protected $appends = [
        'integrantes_count',
        'asignatura_nombre',
        'bloque_label',
        'docente_nombre',
    ];

    /* ─────────────────────────────────────────────
     * Relaciones
     * ───────────────────────────────────────────── */

    public function usuarios()
    {
        return $this->belongsToMany(User::class, 'grupo_usuario', 'grupo_id', 'usuario_id')
                    ->withTimestamps();
    }

    public function prestamos()
    {
        return $this->belongsToMany(Prestamo::class, 'grupo_prestamo', 'grupo_id', 'prestamo_id')
                    ->withTimestamps();
    }

    public function asignatura()
    {
        return $this->belongsTo(Asignatura::class, 'asignatura_id', 'idAsignatura');
    }

    public function bloque()
    {
        return $this->belongsTo(Bloque::class, 'bloque_id', 'idBloque');
    }

    public function docente()
    {
        return $this->belongsTo(User::class, 'docente_id', 'idUser');
    }

    /* ─────────────────────────────────────────────
     * Accessors
     * ───────────────────────────────────────────── */

    public function getIntegrantesCountAttribute(): int
    {
        return $this->usuarios()->count();
    }

    public function getAsignaturaNombreAttribute(): ?string
    {
        return $this->asignatura?->nombre;
    }

    public function getBloqueLabelAttribute(): ?string
    {
        if (!$this->bloque) {
            return null;
        }
        return trim($this->bloque->nombre . ' (' . ($this->bloque->hora_inicio ?? '') . '-' . ($this->bloque->hora_fin ?? '') . ')');
    }

    public function getDocenteNombreAttribute(): ?string
    {
        if (!$this->docente) {
            return null;
        }
        return trim(($this->docente->persona->nombre ?? '') . ' ' . ($this->docente->persona->apellido ?? ''));
    }
}
