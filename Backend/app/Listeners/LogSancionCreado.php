<?php

namespace App\Listeners;

use App\Events\SancionCreado;
use App\Models\SistemaEvento;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Queue\InteractsWithQueue;

class LogSancionCreado implements ShouldQueue
{
    use InteractsWithQueue;

    public function handle(SancionCreado $event)
    {
        SistemaEvento::create([
            'tipo' => 'SANCION_CREADO',
            'referencia_id' => $event->sancion->id,
            'referencia_tipo' => 'UserSancion',
            'datos' => json_encode($event->broadcastWith()),
            'usuario_id' => auth()->id(),
        ]);
    }
}
