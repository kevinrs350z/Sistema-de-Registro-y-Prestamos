<?php

namespace App\Http\Requests\TipoEquipo;

use Illuminate\Foundation\Http\FormRequest;

class  UpdateTipoEquipoRequest extends FormRequest
{
    public function authorize()
    {
        return true;
    }

    public function rules()
    {
        $id = $this->route('id');

        return [
                    'categoria_id' => 'sometimes|required|exists:categorias,id',

                    'nombre'       => 'sometimes|required|string|max:255|unique:tipo_equipos,nombre,' . $id,

                    'imagen'       => 'sometimes|nullable|image|mimes:jpg,jpeg,png,webp|max:2048',

                    'descripcion'  => 'sometimes|nullable|string',

                    'maximo_prestamo' => 'sometimes|required|integer|min:0'
                ];
    }
}
