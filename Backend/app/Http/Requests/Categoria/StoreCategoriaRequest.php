<?php

namespace App\Http\Requests\Categoria;

use Illuminate\Foundation\Http\FormRequest;

class StoreCategoriaRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     *
     * @return bool
     */
    public function authorize()
    {
        $user = $this->user();
        return $user && method_exists($user, 'isAdminOrSuper') && $user->isAdminOrSuper();
    }

    /**
     * Get the validation rules that apply to the request.
     *
     * @return array
     */
    public function rules()
    {
        return [
            'nombre'      => 'required|string|unique:categorias,nombre',
            'descripcion' => 'nullable|string',
            'icono'       => 'nullable|string|max:100',
            'activo'      => 'nullable|boolean',
        ];
    }
}
