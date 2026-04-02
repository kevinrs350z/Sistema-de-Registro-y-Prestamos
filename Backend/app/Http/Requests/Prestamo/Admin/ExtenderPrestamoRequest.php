<?php

namespace App\Http\Requests\Prestamo\Admin;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class ExtenderPrestamoRequest extends FormRequest
{
    public function authorize(): bool
    {
        return auth()->check() && auth()->user()->isAdmin();
    }

    public function rules(): array
    {
        return [
            'fecha' => ['required', 'date', 'after_or_equal:today'],
            'comentario' => ['nullable', 'string', 'max:500'],
            'equiposIds' => ['required', 'array'],
            'equiposIds.*' => ['integer', 'distinct']
        ];
    }

    public function messages(): array
    {
        return [
            'fecha.required' => 'Debes indicar la nueva fecha límite.',
            'fecha.date' => 'La fecha proporcionada no es válida.',
            'fecha.after_or_equal' => 'La fecha debe ser igual o posterior al día de hoy.',
            'equiposIds.required' => 'Selecciona al menos un equipo para mantener en préstamo.',
            'equiposIds.array' => 'El listado de equipos no es válido.',
            'equiposIds.*.integer' => 'Cada equipo debe representarse por su identificador numérico.',
            'equiposIds.*.distinct' => 'El listado de equipos no puede contener duplicados.'
        ];
    }
}
