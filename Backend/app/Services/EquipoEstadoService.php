<?php

namespace App\Services;

use App\Models\Equipo;
use App\Models\EquipoEstadoEvento;
use App\Models\TipoFalla;
use App\Enums\EstadoEquipo;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;
use Illuminate\Database\Eloquent\ModelNotFoundException;

/**
 * Servicio central para gestionar cambios de estado de equipos.
 * 
 * Este servicio implementa el patrón UseCase para:
 * - Validar transiciones de estado
 * - Registrar eventos de auditoría (audit trail)
 * - Ejecutar cambios en transacción
 * 
 * La fuente de verdad histórica es la tabla equipo_estado_eventos.
 * La columna estado en equipos actúa como caché del estado actual.
 */
class EquipoEstadoService
{
    /**
     * Cambia el estado de un equipo con registro de auditoría.
     *
     * @param int $equipoId ID del equipo
     * @param string $nuevoEstado Nuevo estado (debe ser válido en EstadoEquipo)
     * @param int $usuarioId ID del usuario que realiza el cambio
     * @param string|null $motivo Motivo del cambio (requerido para DADO_DE_BAJA)
     * @param int|null $tipoFallaId ID del tipo de falla (requerido para MANTENIMIENTO)
     * @param string|null $observacion Observación adicional
     * @param string $origen Origen del cambio: admin, sistema, prestamo, mantenimiento
     * @return Equipo
     * 
     * @throws ModelNotFoundException Si el equipo no existe
     * @throws ValidationException Si las validaciones fallan
     */
    public function cambiarEstadoEquipo(
        int $equipoId,
        string $nuevoEstado,
        int $usuarioId,
        ?string $motivo = null,
        ?int $tipoFallaId = null,
        ?string $observacion = null,
        string $origen = EquipoEstadoEvento::ORIGEN_ADMIN
    ): Equipo {
        // Validar que el estado sea válido
        $this->validarEstado($nuevoEstado);

        // Validar origen
        $this->validarOrigen($origen);

        // Validaciones específicas por estado
        $this->validarRequerimientosEstado($nuevoEstado, $motivo, $tipoFallaId);

        // Ejecutar cambio en transacción
        return DB::transaction(function () use (
            $equipoId, 
            $nuevoEstado, 
            $usuarioId, 
            $motivo, 
            $tipoFallaId, 
            $observacion, 
            $origen
        ) {
            // Obtener equipo con bloqueo para evitar condiciones de carrera
            $equipo = Equipo::lockForUpdate()->find($equipoId);

            if (!$equipo) {
                throw new ModelNotFoundException("Equipo con ID {$equipoId} no encontrado.");
            }

            $estadoAnterior = $equipo->estado;

            // Si el estado es el mismo, no crear evento innecesario
            if ($estadoAnterior === $nuevoEstado) {
                return $equipo;
            }

            // Crear evento de auditoría
            EquipoEstadoEvento::create([
                'equipo_id' => $equipoId,
                'usuario_id' => $usuarioId,
                'estado_anterior' => $estadoAnterior,
                'estado_nuevo' => $nuevoEstado,
                'fecha_evento' => now(),
                'motivo' => $motivo,
                'observacion' => $observacion,
                'tipo_falla_id' => $tipoFallaId,
                'origen' => $origen,
            ]);

            // Actualizar estado actual del equipo (caché)
            $equipo->estado = $nuevoEstado;
            $equipo->save();

            return $equipo->fresh();
        });
    }

    /**
     * Envía un equipo a mantenimiento por una falla específica.
     *
     * @param int $equipoId
     * @param int $usuarioId
     * @param int $tipoFallaId
     * @param string|null $motivo
     * @param string|null $observacion
     * @param string $origen
     * @return Equipo
     */
    public function enviarAMantenimiento(
        int $equipoId,
        int $usuarioId,
        int $tipoFallaId,
        ?string $motivo = null,
        ?string $observacion = null,
        string $origen = EquipoEstadoEvento::ORIGEN_ADMIN
    ): Equipo {
        // Validar que el tipo de falla exista y esté activo
        $tipoFalla = TipoFalla::activos()->find($tipoFallaId);
        if (!$tipoFalla) {
            throw ValidationException::withMessages([
                'tipoFallaId' => ['El tipo de falla especificado no existe o no está activo.'],
            ]);
        }

        return $this->cambiarEstadoEquipo(
            $equipoId,
            EstadoEquipo::MANTENIMIENTO,
            $usuarioId,
            $motivo,
            $tipoFallaId,
            $observacion,
            $origen
        );
    }

    /**
     * Devuelve un equipo de mantenimiento a disponible.
     *
     * @param int $equipoId
     * @param int $usuarioId
     * @param string|null $observacion
     * @return Equipo
     */
    public function finalizarMantenimiento(
        int $equipoId,
        int $usuarioId,
        ?string $observacion = null
    ): Equipo {
        return $this->cambiarEstadoEquipo(
            $equipoId,
            EstadoEquipo::DISPONIBLE,
            $usuarioId,
            'Mantenimiento finalizado',
            null,
            $observacion,
            EquipoEstadoEvento::ORIGEN_MANTENIMIENTO
        );
    }

    /**
     * Da de baja un equipo permanentemente.
     *
     * @param int $equipoId
     * @param int $usuarioId
     * @param string $motivo (requerido)
     * @param string|null $observacion
     * @return Equipo
     */
    public function darDeBaja(
        int $equipoId,
        int $usuarioId,
        string $motivo,
        ?string $observacion = null
    ): Equipo {
        return $this->cambiarEstadoEquipo(
            $equipoId,
            EstadoEquipo::DADO_DE_BAJA,
            $usuarioId,
            $motivo,
            null,
            $observacion,
            EquipoEstadoEvento::ORIGEN_ADMIN
        );
    }

    /**
     * Obtiene el historial de estados de un equipo.
     *
     * @param int $equipoId
     * @param int $perPage
     * @return \Illuminate\Pagination\LengthAwarePaginator
     */
    public function obtenerHistorialEstados(int $equipoId, int $perPage = 15)
    {
        // Verificar que el equipo existe
        $equipo = Equipo::find($equipoId);
        if (!$equipo) {
            throw new ModelNotFoundException("Equipo con ID {$equipoId} no encontrado.");
        }

        return EquipoEstadoEvento::with(['usuario.persona', 'tipoFalla'])
            ->where('equipo_id', $equipoId)
            ->orderBy('fecha_evento', 'desc')
            ->orderBy('id', 'desc')
            ->paginate($perPage);
    }

    /**
     * Obtiene el catálogo de tipos de falla activos.
     *
     * @param string|null $categoria Filtrar por categoría
     * @return \Illuminate\Database\Eloquent\Collection
     */
    public function obtenerTiposFalla(?string $categoria = null)
    {
        $query = TipoFalla::activos()->orderBy('categoria')->orderBy('nombre');

        if ($categoria) {
            $query->where('categoria', $categoria);
        }

        return $query->get();
    }

    /**
     * Valida que el estado sea válido.
     *
     * @param string $estado
     * @throws ValidationException
     */
    private function validarEstado(string $estado): void
    {
        if (!EstadoEquipo::isValid($estado)) {
            throw ValidationException::withMessages([
                'estado' => [
                    "El estado '{$estado}' no es válido. Estados permitidos: " . 
                    implode(', ', EstadoEquipo::all())
                ],
            ]);
        }
    }

    /**
     * Valida que el origen sea válido.
     *
     * @param string $origen
     * @throws ValidationException
     */
    private function validarOrigen(string $origen): void
    {
        if (!in_array($origen, EquipoEstadoEvento::origenesValidos(), true)) {
            throw ValidationException::withMessages([
                'origen' => [
                    "El origen '{$origen}' no es válido. Orígenes permitidos: " . 
                    implode(', ', EquipoEstadoEvento::origenesValidos())
                ],
            ]);
        }
    }

    /**
     * Valida requerimientos específicos según el estado destino.
     *
     * @param string $nuevoEstado
     * @param string|null $motivo
     * @param int|null $tipoFallaId
     * @throws ValidationException
     */
    private function validarRequerimientosEstado(
        string $nuevoEstado, 
        ?string $motivo, 
        ?int $tipoFallaId
    ): void {
        $errores = [];

        // MANTENIMIENTO requiere tipo de falla
        if ($nuevoEstado === EstadoEquipo::MANTENIMIENTO && !$tipoFallaId) {
            $errores['tipoFallaId'] = [
                'El tipo de falla es obligatorio cuando el estado es MANTENIMIENTO.'
            ];
        }

        // DADO_DE_BAJA requiere motivo
        if ($nuevoEstado === EstadoEquipo::DADO_DE_BAJA && empty($motivo)) {
            $errores['motivo'] = [
                'El motivo es obligatorio cuando el estado es DADO_DE_BAJA.'
            ];
        }

        // Validar que tipo_falla_id exista si se proporciona
        if ($tipoFallaId) {
            $tipoFalla = TipoFalla::find($tipoFallaId);
            if (!$tipoFalla) {
                $errores['tipoFallaId'] = [
                    "El tipo de falla con ID {$tipoFallaId} no existe."
                ];
            } elseif (!$tipoFalla->activo) {
                $errores['tipoFallaId'] = [
                    "El tipo de falla '{$tipoFalla->nombre}' no está activo."
                ];
            }
        }

        if (!empty($errores)) {
            throw ValidationException::withMessages($errores);
        }
    }
}
