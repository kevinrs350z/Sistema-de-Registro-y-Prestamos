<?php

namespace App\Http\Requests\Prestamo;

use Illuminate\Foundation\Http\FormRequest;

class StorePrestamoAdminRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true; 
    }

    public function rules(): array
    {
        return [
            'tipo' => 'required|in:DENTRO,FUERA,EVENTO',

            'idUserAlumno' => 'required|exists:users,idUser',

            // ===== EVENTO =====
            'nombre_evento' => 'required_if:tipo,EVENTO|string|max:255',
            'fecha_inicio'  => 'required_if:tipo,EVENTO|date',
            'fecha_fin'     => 'required_if:tipo,EVENTO|date|after_or_equal:fecha_inicio',

            'responsable_id'     => 'nullable|exists:users,idUser',
            'responsable_nombre' => 'nullable|string|max:255',

            // ===== NORMAL =====
            'ubicacion'   => 'nullable|string|max:255',
            'observacion' => 'nullable|string',

            'bloques' => 'required_if:tipo,DENTRO|array',
            'equipos' => 'required|array|min:1',
        ];
    }

}
