<?php

namespace App\Http\Requests\Categoria;

use Illuminate\Foundation\Http\FormRequest;

class UpdateCategoriaRequest extends FormRequest
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
        $id = $this->route('id');
        return [
            'nombre'      => 'sometimes|required|string|unique:categorias,nombre,' . $id . ',id',
            'descripcion' => 'sometimes|nullable|string',
            'icono'       => 'sometimes|nullable|string|max:100',
            'activo'      => 'sometimes|boolean',
        ];
    }
}
