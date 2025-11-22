<?php

namespace App\Http\Requests\Equipo;

use Illuminate\Foundation\Http\FormRequest;

class StoreEquipoRequest extends FormRequest
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
            'tipo_equipo_id' => 'required|exists:tipo_equipos,id',
            'codigo'         => 'required|string|max:225',
            'estado'         => 'required|string|max:50'
        ];
    }
}
