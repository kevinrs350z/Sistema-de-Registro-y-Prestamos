<?php

namespace App\Http\Requests\Usuario;

use Illuminate\Foundation\Http\FormRequest;

class UpdateUsuarioRequest extends FormRequest
{
    public function authorize()
    {
        return true;
    }

    public function rules()
    {
        return [
            'nombre'     => 'required|string|max:255',
            'apellido1'  => 'required|string|max:255',
            'apellido2'  => 'nullable|string|max:255',
            'rut'        => 'required|string',
            'email'      => 'required|email',
            'telefono'   => 'nullable|string|max:20',
            'celular'    => 'nullable|string|max:20',
            'password'   => 'nullable|string|min:6',
            'rol'        => 'required|string|exists:rol,Nombre'
        ];
    }

}
