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

class PrestamoCreated implements ShouldBroadcast
{
    use Dispatchable, InteractsWithSockets, SerializesModels;

    public $prestamo;
    public $usuario;

    public function __construct(Prestamo $prestamo)
    {
        $this->prestamo = $prestamo;
        $this->usuario = $prestamo->user;
    }

    public function broadcastOn()
    {
        return new Channel('prestamos');
    }

    public function broadcastAs()
    {
        return 'prestamo.creado';
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
            'equipos' => $this->prestamo->equipos()->get(['id', 'nombre', 'cod_activo']),
        ];
    }
}
