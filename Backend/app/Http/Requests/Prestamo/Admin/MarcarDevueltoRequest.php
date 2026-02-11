<?php

namespace App\Http\Requests\Prestamo\Admin;

use Illuminate\Foundation\Http\FormRequest;
use App\Models\User;
/**
 * @property User $user
 */ 

class MarcarDevueltoRequest extends FormRequest
{
    public function authorize(): bool
    {
        return auth()->check() && auth()->user()->isAdmin();
    }

    public function rules(): array
    {
        return [
            'motivo' => 'nullable|string|min:3'
        ];
    }

    public function messages(): array
    {
        return [
            'motivo.min'      => 'El motivo debe tener al menos 3 caracteres.'
        ];
    }
}
