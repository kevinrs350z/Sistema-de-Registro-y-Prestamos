<?php

namespace App\Listeners;

use App\Events\PrestamoActualizado;
use App\Models\SistemaEvento;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Queue\InteractsWithQueue;

class LogPrestamoActualizado implements ShouldQueue
{
    use InteractsWithQueue;

    public function handle(PrestamoActualizado $event)
    {
        SistemaEvento::create([
            'tipo' => 'PRESTAMO_ACTUALIZADO',
            'referencia_id' => $event->prestamo->id,
            'referencia_tipo' => 'Prestamo',
            'datos' => json_encode($event->broadcastWith()),
            'usuario_id' => auth()->id(),
        ]);
    }
}
