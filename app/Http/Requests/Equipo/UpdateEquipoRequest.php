<?php

namespace App\Http\Requests\Equipo;

use Illuminate\Foundation\Http\FormRequest;

class UpdateEquipoRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     *
     * @return bool
     */
    public function authorize()
    {
        return true;
    }

    /**
     * Get the validation rules that apply to the request.
     *
     * @return array
     */
    public function rules()
    {
        return [
            'tipo_equipo_id' => 'sometimes|required|exists:tipo_equipos,id',
            'codigo'         => 'sometimes|required|string|max:50',
            'estado'         => 'sometimes|required|string|max:225'
        ];
    }
}
