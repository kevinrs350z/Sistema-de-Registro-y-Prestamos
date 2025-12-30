<?php

namespace App\Http\Requests\Pack;
use Illuminate\Foundation\Http\FormRequest;

class UpdatePackRequest extends FormRequest
{
    protected function prepareForValidation()
    {
        if (is_string($this->equipos)) {
            $this->merge([
                'equipos' => json_decode($this->equipos, true)
            ]);
        }
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
}
