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
 * Uso: SendGenericEmailJob::dispatch($email, new MiMailClass($params));
 * 
 * @package App\Jobs
 */
class SendGenericEmailJob implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    public int $tries = 3;
    public int $timeout = 30;
    public array $backoff = [10, 30, 60];

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
        Log::info("Enviando correo [{$this->context}]", ['email' => $this->email]);

        Mail::to($this->email)->send($this->mailable);

        Log::info("Correo [{$this->context}] enviado", ['email' => $this->email]);
    }

    public function failed(\Throwable $exception): void
    {
        Log::error("FALLO en correo [{$this->context}]", [
            'email' => $this->email,
            'error' => $exception->getMessage()
        ]);
    }

    public function tags(): array
    {
        return ['email', 'context:' . $this->context];
    }
}
