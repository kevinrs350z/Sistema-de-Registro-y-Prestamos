<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class SistemaEvento extends Model
{
    use HasFactory;

    protected $table = 'sistema_eventos';

    protected $fillable = [
        'tipo',
        'referencia_id',
        'referencia_tipo',
        'datos',
        'usuario_id',
    ];

    protected $casts = [
        'datos' => 'array',
        'created_at' => 'datetime',
        'updated_at' => 'datetime',
    ];

    /**
     * Obtener el usuario que generó el evento
     */
    public function usuario()
    {
        return $this->belongsTo(User::class, 'usuario_id');
    }
}
