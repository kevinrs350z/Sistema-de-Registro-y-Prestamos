<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class TipoEquipo extends Model
{
    use HasFactory;

    protected $table ='tipo_equipos';
    protected $primaryKey = 'id';
    protected $fillable = [
        'categoria_id',
        'nombre',
        'marca',
        'modelo',
        'imagen',
        'descripcion',
        'maximo_prestamo'
    ];

    public function categoria()
    {
        return $this->belongsTo(Categoria::class);
    }

    public function equipos()
    {
        return $this->hasMany(Equipo::class, 'tipo_equipo_id');
    }

    /**
     * Tipos de equipo relacionados (donde este tipo es el principal).
     */
    public function relacionadosComo()
    {
        return $this->belongsToMany(
            TipoEquipo::class,
            'tipo_equipo_relacionados',
            'tipo_equipo_id',
            'relacionado_id'
        );
    }

    /**
     * Tipos de equipo que tienen a este como relacionado.
     */
    public function relacionadosDe()
    {
        return $this->belongsToMany(
            TipoEquipo::class,
            'tipo_equipo_relacionados',
            'relacionado_id',
            'tipo_equipo_id'
        );
    }

    /**
     * Obtener TODOS los tipos relacionados (bidireccional).
     * Incluye tanto los que este tipo tiene como relacionados,
     * como los tipos que tienen a este como relacionado.
     */
    public function getTodosRelacionadosAttribute(): array
    {
        $como = $this->relacionadosComo()->pluck('tipo_equipos.id')->toArray();
        $de = $this->relacionadosDe()->pluck('tipo_equipos.id')->toArray();

        return array_values(array_unique(array_merge($como, $de)));
    }

    /**
     * Obtener el grupo completo de tipos relacionados (incluye a sí mismo).
     */
    public function getGrupoRelacionadoAttribute(): array
    {
        $relacionados = $this->todos_relacionados;
        return array_values(array_unique(array_merge([$this->id], $relacionados)));
    }

    protected $casts = [
        'categoria_id' => 'integer',
        'maximo_prestamo' => 'integer',
    ];
}
