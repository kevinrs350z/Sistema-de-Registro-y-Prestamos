<?php

namespace App\Http\Requests\Prestamo\Admin;

use Illuminate\Foundation\Http\FormRequest;

class ActualizarEquiposPrestamoRequest extends FormRequest
{
    public function authorize(): bool
    {
        return auth()->check() && auth()->user()->isAdmin();
    }

    public function rules(): array
    {
        return [
            'equipos' => ['required', 'array', 'min:1'],
            'equipos.*.idTipoEquipo' => ['required', 'integer', 'exists:tipo_equipos,id'],
            'equipos.*.cantidad' => ['required', 'integer', 'min:1'],
            'motivo' => ['nullable', 'string', 'max:500']
        ];
    }

    public function messages(): array
    {
        return [
            'equipos.required' => 'Debes indicar al menos un equipo.',
            'equipos.array' => 'El listado de equipos no es valido.',
            'equipos.*.idTipoEquipo.required' => 'Falta el tipo de equipo.',
            'equipos.*.idTipoEquipo.exists' => 'Tipo de equipo invalido.',
            'equipos.*.cantidad.required' => 'Falta la cantidad solicitada.',
            'equipos.*.cantidad.min' => 'La cantidad debe ser mayor a cero.'
        ];
    }
}
