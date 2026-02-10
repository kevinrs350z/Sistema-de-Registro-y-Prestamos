<?php

namespace App\Http\Requests\Equipo;

use Illuminate\Foundation\Http\FormRequest;
use App\Enums\EstadoEquipo;
use App\Models\EquipoEstadoEvento;

/**
 * Request para validar el cambio de estado de un equipo.
 */
class CambiarEstadoEquipoRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        // La autorización se maneja en el middleware admin
        return true;
    }

    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, \Illuminate\Contracts\Validation\ValidationRule|array|string>
     */
    public function rules(): array
    {
        return [
            'estado' => [
                'required',
                'string',
                function ($attribute, $value, $fail) {
                    if (!EstadoEquipo::isValid($value)) {
                        $fail("El estado '{$value}' no es válido. Estados permitidos: " . 
                              implode(', ', EstadoEquipo::all()));
                    }
                },
            ],
            'motivo' => [
                'nullable',
                'string',
                'max:500',
                function ($attribute, $value, $fail) {
                    // Requerido si estado es DADO_DE_BAJA
                    if ($this->input('estado') === EstadoEquipo::DADO_DE_BAJA && empty($value)) {
                        $fail('El motivo es obligatorio cuando el estado es DADO_DE_BAJA.');
                    }
                },
            ],
            'tipoFallaId' => [
                'nullable',
                'integer',
                'exists:tipos_falla,id',
                function ($attribute, $value, $fail) {
                    // Requerido si estado es MANTENIMIENTO
                    if ($this->input('estado') === EstadoEquipo::MANTENIMIENTO && empty($value)) {
                        $fail('El tipo de falla es obligatorio cuando el estado es MANTENIMIENTO.');
                    }
                },
            ],
            'observacion' => 'nullable|string|max:2000',
            'origen' => [
                'nullable',
                'string',
                function ($attribute, $value, $fail) {
                    if ($value && !in_array($value, EquipoEstadoEvento::origenesValidos(), true)) {
                        $fail("El origen '{$value}' no es válido. Orígenes permitidos: " . 
                              implode(', ', EquipoEstadoEvento::origenesValidos()));
                    }
                },
            ],
        ];
    }

    /**
     * Get custom messages for validator errors.
     *
     * @return array<string, string>
     */
    public function messages(): array
    {
        return [
            'estado.required' => 'El estado es obligatorio.',
            'tipoFallaId.exists' => 'El tipo de falla especificado no existe.',
            'tipoFallaId.integer' => 'El ID del tipo de falla debe ser un número entero.',
            'motivo.max' => 'El motivo no puede exceder los 500 caracteres.',
            'observacion.max' => 'La observación no puede exceder los 2000 caracteres.',
        ];
    }

    /**
     * Get custom attributes for validator errors.
     *
     * @return array<string, string>
     */
    public function attributes(): array
    {
        return [
            'estado' => 'estado del equipo',
            'tipoFallaId' => 'tipo de falla',
            'motivo' => 'motivo del cambio',
            'observacion' => 'observación',
            'origen' => 'origen del cambio',
        ];
    }
}
