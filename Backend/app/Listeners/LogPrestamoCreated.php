<?php

namespace App\Listeners;

use App\Events\PrestamoCreated;
use App\Models\SistemaEvento;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Queue\InteractsWithQueue;

class LogPrestamoCreated implements ShouldQueue
{
    use InteractsWithQueue;

    public function handle(PrestamoCreated $event)
    {
        // Registrar evento en tabla de auditoría/eventos
        SistemaEvento::create([
            'tipo' => 'PRESTAMO_CREADO',
            'referencia_id' => $event->prestamo->id,
            'referencia_tipo' => 'Prestamo',
            'datos' => json_encode($event->broadcastWith()),
            'usuario_id' => auth()->id(),
        ]);
    }
}
