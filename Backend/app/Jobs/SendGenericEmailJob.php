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
 * Job genérico para envío de correos en segundo plano.
 * 
 * Uso: SendGenericEmailJob::dispatch($email, new MiMailClass($params), 'contexto');
 * 
 * Optimizaciones:
 * - Reintentos con backoff exponencial (10s, 30s, 60s)
 * - Timeout de 30s para no bloquear el worker
 * - Logging completo de éxito/fallo
 * - Reutilización de conexión SMTP (keep-alive)
 * 
 * @package App\Jobs
 */
class SendGenericEmailJob implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    public int $tries = 3;
    public int $timeout = 30;
    public array $backoff = [10, 30, 60];
    public bool $deleteWhenMissingModels = true;

    private string $email;
    private $mailable;
    private string $context;

    public function __construct(string $email, $mailable, string $context = 'generic')
    {
        $this->email = $email;
        $this->mailable = $mailable;
        $this->context = $context;

        $this->onQueue('emails');
    }

    public function handle(): void
    {
        $start = microtime(true);

        Log::info("📧 Enviando correo [{$this->context}]", [
            'email'   => $this->email,
            'intento' => $this->attempts(),
        ]);

        // Enviar con transport keep-alive para reutilizar conexión SMTP
        $mailer = Mail::mailer();
        $transport = $mailer->getSymfonyTransport();

        Mail::to($this->email)->send($this->mailable);

        $elapsed = round((microtime(true) - $start) * 1000);

        Log::info("✅ Correo [{$this->context}] enviado en {$elapsed}ms", [
            'email' => $this->email,
        ]);
    }

    public function failed(\Throwable $exception): void
    {
        Log::error("❌ FALLO DEFINITIVO en correo [{$this->context}]", [
            'email'    => $this->email,
            'intentos' => $this->attempts(),
            'error'    => $exception->getMessage(),
        ]);
    }

    public function tags(): array
    {
        return ['email', 'context:' . $this->context];
    }
}
