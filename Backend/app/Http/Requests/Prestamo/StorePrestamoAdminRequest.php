<?php

namespace App\Http\Requests\Prestamo;

use Illuminate\Foundation\Http\FormRequest;

class StorePrestamoAdminRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true; 
    }

    public function rules(): array
    {
        return [
            'idUserAlumno' => 'required|exists:users,idUser',
            'tipo'         => 'required|in:DENTRO,FUERA',
            'asignatura'   => 'nullable',
            'observacion'  => 'nullable|string',
            'fecha_inicio' => 'required|date',
            'fecha_fin'    => 'required|date|after_or_equal:fecha_inicio',
            'bloques'      => 'required_if:tipo,DENTRO|array',
            'equipos'      => 'required|array|min:1',
        ];
    }
}
