<?php

namespace App\Http\Requests\Equipo;

use Illuminate\Foundation\Http\FormRequest;
/**
 * FormRequest encargado de validar los datos enviados para la creación
 * de un nuevo equipo dentro del sistema. Esta clase centraliza las reglas
 * de validación, garantizando que solo información correcta y segura llegue
 * al controlador y posteriormente al servicio.
 *
 * Su uso permite mantener un controlador limpio, aplicar el principio de
 * responsabilidad única (SRP) y asegurar la integridad de los datos antes
 * de cualquier operación en la base de datos.
 */
class StoreEquipoRequest extends FormRequest
{
    /**
     * Determina si el usuario tiene autorización para ejecutar esta solicitud.
     * 
     * En este caso, se permite el acceso sin restricciones adicionales,
     * asumiendo que la protección se maneja mediante middleware o tokens.
     *
     * @return bool
     */
    public function authorize()
    {
        return true;
    }

    /**
     * Reglas de validación para la creación de un equipo.
     *
     * - tipo_equipo_id: Debe existir en la tabla tipo_equipos.
     * - codigo: Campo obligatorio, con texto válido y máximo 225 caracteres.
     * - estado: Define la condición del equipo (disponible, prestado, etc.).
     *
     * Estas reglas garantizan que el registro cumpla con los requisitos mínimos
     * del sistema antes de ser procesado por el EquipoService.
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
