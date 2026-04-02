<?php

namespace App\Http\Requests\Prestamo;

use Illuminate\Foundation\Http\FormRequest;

class StorePrestamoAlumnoRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true; // ya validas con auth
    }

    public function rules(): array
    {
        return [
            'tipo'         => 'required|in:DENTRO,FUERA',
            'asignatura'   => 'nullable',
            'motivo'       => 'nullable|string',
            'observacion'  => 'nullable|string',
            'fecha_inicio' => 'nullable|date',
            'fecha_fin'    => 'nullable|date|after_or_equal:fecha_inicio',
            'bloques'      => 'required_if:tipo,DENTRO|array',
            'bloques.*'    => 'integer|exists:bloques,idBloque',
            'equipos'      => 'required|array|min:1',
            'integrantes'  => 'nullable|array',
            'integrantes.*' => 'integer|distinct|exists:users,idUser',
            'grupo_id'     => 'nullable|integer|exists:grupos,id',
        ];
    }
}
