<?php

namespace App\Http\Requests\Pack;

use Illuminate\Foundation\Http\FormRequest;

class StorePackRequest extends FormRequest
{
    protected function prepareForValidation()
    {
        if (is_string($this->equipos)) {
            $this->merge([
                'equipos' => json_decode($this->equipos, true)
            ]);
        }
    }

    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'nombre'      => 'required|string|max:255',
            'descripcion' => 'nullable|string',
            'equipos'     => 'required|array|min:1',
            'equipos.*'   => 'exists:equipos,id',
            'imagen'      => 'nullable|image|max:2048',
        ];
    }

    public function messages(): array
    {
        return [
            'nombre.required'  => 'El nombre del pack es obligatorio.',
            'equipos.required' => 'Debe seleccionar al menos un equipo.',
            'equipos.array'    => 'Los equipos deben enviarse como un arreglo.',
            'equipos.*.exists' => 'Uno de los equipos seleccionados no es válido.',
            'imagen.image'     => 'El archivo debe ser una imagen.',
        ];
    }
}
