<?php

namespace App\Events;

use App\Models\Prestamo;
use Illuminate\Broadcasting\Channel;
use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Broadcasting\PresenceChannel;
use Illuminate\Broadcasting\PrivateChannel;
use Illuminate\Contracts\Broadcasting\ShouldBroadcast;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class PrestamoActualizado implements ShouldBroadcast
{
    use Dispatchable, InteractsWithSockets, SerializesModels;

    public $prestamo;
    public $usuario;
    public $cambio;

    public function __construct(Prestamo $prestamo, string $cambio = 'actualizado')
    {
        $this->prestamo = $prestamo;
        $this->usuario = $prestamo->user;
        $this->cambio = $cambio;
    }

    public function broadcastOn()
    {
        return new Channel('prestamos');
    }

    public function broadcastAs()
    {
        return 'prestamo.actualizado';
    }

    public function broadcastWith()
    {
        return [
            'id' => $this->prestamo->id,
            'idUser' => $this->prestamo->idUser,
            'nombreUsuario' => $this->usuario?->name ?? 'Usuario',
            'estado' => $this->prestamo->estado,
            'fecha_inicio' => $this->prestamo->fecha_inicio,
            'fecha_fin' => $this->prestamo->fecha_fin,
            'observacion' => $this->prestamo->observacion,
            'cambio' => $this->cambio,
            'equipos' => $this->prestamo->equipos()->get(['id', 'nombre', 'cod_activo']),
        ];
    }
}
