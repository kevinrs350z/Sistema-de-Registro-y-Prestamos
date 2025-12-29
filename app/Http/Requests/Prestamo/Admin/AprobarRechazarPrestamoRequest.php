<?php

namespace App\Http\Requests\Prestamo\Admin;
use App\Models\User;
use Illuminate\Foundation\Http\FormRequest;

/**
 * @property User $user
 */
class AprobarRechazarPrestamoRequest extends FormRequest
{
    public function authorize(): bool
    {
        return auth()->check() && auth()->user()->isAdmin();
    }

    public function rules(): array
    {
        return [
            
            'motivo' => 'required|string|min:3'
        ];
    }

    public function messages(): array
    {
        return [
            'accion.required' => 'Debe indicar una acción.',
            'accion.in'       => 'La acción debe ser aprobar o rechazar.',
            'motivo.required' => 'Debe ingresar un motivo.',
            'motivo.min'      => 'El motivo debe tener al menos 3 caracteres.'
        ];
    }
}
