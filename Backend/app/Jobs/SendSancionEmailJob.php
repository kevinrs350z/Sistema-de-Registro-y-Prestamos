<?php

namespace App\Jobs;

use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Facades\Log;
use App\Mail\SancionNotificacion;

/**
 * Job para envío de correos de sanciones en segundo plano.
 * 
 * @package App\Jobs
 */
class SendSancionEmailJob implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    public int $tries = 3;
    public int $timeout = 30;
    public array $backoff = [10, 30, 60];
    public bool $deleteWhenMissingModels = true;

    private string $email;
    private string $nombreUsuario;
    private string $motivo;
    private string $fechaInicio;
    private string $fechaFin;

    public function __construct(
        string $email,
        string $nombreUsuario,
        string $motivo,
        string $fechaInicio,
        string $fechaFin
    ) {
        $this->email = $email;
        $this->nombreUsuario = $nombreUsuario;
        $this->motivo = $motivo;
        $this->fechaInicio = $fechaInicio;
        $this->fechaFin = $fechaFin;

        $this->onQueue('emails');
    }

    public function handle(): void
    {
        Log::info('Enviando correo de sanción', ['email' => $this->email]);

        Mail::to($this->email)->send(new SancionNotificacion(
            $this->nombreUsuario,
            $this->motivo,
            $this->fechaInicio,
            $this->fechaFin
        ));

        Log::info('Correo de sanción enviado', ['email' => $this->email]);
    }

    public function failed(\Throwable $exception): void
    {
        Log::error('FALLO en envío de correo de sanción', [
            'email' => $this->email,
            'error' => $exception->getMessage()
        ]);
    }

    public function tags(): array
    {
        return ['email', 'sancion'];
    }
}
