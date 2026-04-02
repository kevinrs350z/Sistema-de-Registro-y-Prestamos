<?php

namespace App\Jobs;

use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Facades\Log;

/**
 * Job para envio de correo a encargados (con BCC).
 */
class SendPrestamoSolicitudEncargadosJob implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    public int $tries = 3;
    public int $timeout = 30;
    public array $backoff = [10, 30, 60];
    public bool $deleteWhenMissingModels = true;

    private string $to;
    private array $bcc;
    private $mailable;
    private string $context;

    public function __construct(string $to, array $bcc, $mailable, string $context = 'prestamo-solicitud')
    {
        $this->to = $to;
        $this->bcc = $bcc;
        $this->mailable = $mailable;
        $this->context = $context;

        $this->onQueue('emails');
    }

    public function handle(): void
    {
        $start = microtime(true);

        Log::info("Enviando correo [{$this->context}]", [
            'to' => $this->to,
            'bcc_count' => count($this->bcc),
            'intento' => $this->attempts(),
        ]);

        $message = Mail::to($this->to);

        if (!empty($this->bcc)) {
            $message->bcc($this->bcc);
        }

        $message->send($this->mailable);

        $elapsed = round((microtime(true) - $start) * 1000);

        Log::info("Correo [{$this->context}] enviado en {$elapsed}ms", [
            'to' => $this->to,
            'bcc_count' => count($this->bcc),
        ]);
    }

    public function failed(\Throwable $exception): void
    {
        Log::error("FALLO DEFINITIVO en correo [{$this->context}]", [
            'to' => $this->to,
            'bcc' => $this->bcc,
            'intentos' => $this->attempts(),
            'error' => $exception->getMessage(),
        ]);
    }

    public function tags(): array
    {
        return ['email', 'context:' . $this->context];
    }
}
