<?php

namespace App\Jobs;

use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Facades\Log;
use App\Mail\PrestamoAprobadoMail;
use App\Mail\PrestamoRechazadoMail;

/**
 * Job para envío de correos de préstamos en segundo plano.
 * 
 * Este Job implementa:
 * - Reintentos automáticos con backoff exponencial
 * - Timeout definido
 * - Logging de errores
 * - Método failed() para fallos definitivos
 * 
 * @package App\Jobs
 */
class SendPrestamoEmailJob implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    /**
     * Número máximo de intentos antes de marcar como fallido.
     */
    public int $tries = 3;

    /**
     * Tiempo máximo de ejecución en segundos.
     */
    public int $timeout = 30;

    /**
     * Segundos antes de reintentar (backoff exponencial).
     */
    public array $backoff = [10, 30, 60];

    /**
     * Eliminar el job si el modelo asociado fue eliminado.
     */
    public bool $deleteWhenMissingModels = true;

    /**
     * Datos del correo a enviar.
     */
    private string $tipo;
    private string $email;
    private string $nombreUsuario;
    private int $prestamoId;
    private string $fechaSolicitud;
    private ?string $motivo;
    private ?array $equipos;

    /**
     * Crear una nueva instancia del Job.
     *
     * @param string $tipo 'aprobado' o 'rechazado'
     * @param string $email Email del destinatario
     * @param string $nombreUsuario Nombre del usuario
     * @param int $prestamoId ID del préstamo
     * @param string $fechaSolicitud Fecha formateada de la solicitud
     * @param string|null $motivo Motivo/observación
     * @param array|null $equipos Lista de equipos (solo para aprobación)
     */
    public function __construct(
        string $tipo,
        string $email,
        string $nombreUsuario,
        int $prestamoId,
        string $fechaSolicitud,
        ?string $motivo = null,
        ?array $equipos = null
    ) {
        $this->tipo = $tipo;
        $this->email = $email;
        $this->nombreUsuario = $nombreUsuario;
        $this->prestamoId = $prestamoId;
        $this->fechaSolicitud = $fechaSolicitud;
        $this->motivo = $motivo;
        $this->equipos = $equipos;

        // Asignar a cola específica de emails
        $this->onQueue('emails');
    }

    /**
     * Ejecutar el Job.
     */
    public function handle(): void
    {
        Log::info('Iniciando envío de correo de préstamo', [
            'tipo' => $this->tipo,
            'prestamo_id' => $this->prestamoId,
            'email' => $this->email,
            'intento' => $this->attempts()
        ]);

        try {
            if ($this->tipo === 'aprobado') {
                Mail::to($this->email)->send(new PrestamoAprobadoMail(
                    $this->nombreUsuario,
                    $this->prestamoId,
                    $this->fechaSolicitud,
                    $this->motivo,
                    collect($this->equipos)
                ));
            } else {
                Mail::to($this->email)->send(new PrestamoRechazadoMail(
                    $this->nombreUsuario,
                    $this->prestamoId,
                    $this->fechaSolicitud,
                    $this->motivo
                ));
            }

            Log::info('Correo de préstamo enviado exitosamente', [
                'tipo' => $this->tipo,
                'prestamo_id' => $this->prestamoId,
                'email' => $this->email
            ]);

        } catch (\Throwable $e) {
            Log::warning('Error en intento de envío de correo', [
                'prestamo_id' => $this->prestamoId,
                'intento' => $this->attempts(),
                'error' => $e->getMessage()
            ]);

            // Re-lanzar para que el sistema de colas maneje el reintento
            throw $e;
        }
    }

    /**
     * Manejar el fallo definitivo del Job.
     */
    public function failed(\Throwable $exception): void
    {
        Log::error('FALLO DEFINITIVO en envío de correo de préstamo', [
            'tipo' => $this->tipo,
            'prestamo_id' => $this->prestamoId,
            'email' => $this->email,
            'intentos_realizados' => $this->attempts(),
            'error' => $exception->getMessage(),
            'trace' => $exception->getTraceAsString()
        ]);

        // Aquí podrías notificar a un admin, guardar en tabla de errores, etc.
        // Ejemplo: NotifyAdminJob::dispatch('Error enviando correo préstamo ' . $this->prestamoId);
    }

    /**
     * Determinar si el Job debe ser marcado como fallido.
     */
    public function shouldMarkAsFailed(\Throwable $e): bool
    {
        // Marcar como fallido solo si es un error permanente
        return $this->attempts() >= $this->tries;
    }

    /**
     * Tags para identificar el job en el dashboard.
     */
    public function tags(): array
    {
        return [
            'email',
            'prestamo:' . $this->prestamoId,
            'tipo:' . $this->tipo
        ];
    }
}
