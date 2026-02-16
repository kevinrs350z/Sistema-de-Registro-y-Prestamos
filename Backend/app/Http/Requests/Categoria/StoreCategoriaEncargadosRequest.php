<?php

namespace App\Http\Requests\Categoria;

use Illuminate\Foundation\Http\FormRequest;

class StoreCategoriaEncargadosRequest extends FormRequest
{
    public function authorize()
    {
        $user = $this->user();
        return $user && method_exists($user, 'isAdminOrSuper') && $user->isAdminOrSuper();
    }

    public function rules()
    {
        return [
            'usuarios' => 'required|array|min:1',
            'usuarios.*' => 'integer|distinct|exists:users,idUser',
        ];
    }
}
