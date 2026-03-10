<?php

namespace App\Listeners;

use App\Events\SancionActualizado;
use App\Models\SistemaEvento;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Queue\InteractsWithQueue;

class LogSancionActualizado implements ShouldQueue
{
    use InteractsWithQueue;

    public function handle(SancionActualizado $event)
    {
        SistemaEvento::create([
            'tipo' => 'SANCION_ACTUALIZADO',
            'referencia_id' => $event->sancion->id,
            'referencia_tipo' => 'UserSancion',
            'datos' => json_encode($event->broadcastWith()),
            'usuario_id' => auth()->id(),
        ]);
    }
}
