<?php

namespace App\Events;

use App\Models\UserSancion;
use Illuminate\Broadcasting\Channel;
use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Broadcasting\PresenceChannel;
use Illuminate\Broadcasting\PrivateChannel;
use Illuminate\Contracts\Broadcasting\ShouldBroadcast;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class SancionActualizado implements ShouldBroadcast
{
    use Dispatchable, InteractsWithSockets, SerializesModels;

    public $sancion;
    public $usuario;
    public $cambio;

    public function __construct(UserSancion $sancion, string $cambio = 'actualizado')
    {
        $this->sancion = $sancion;
        $this->usuario = $sancion->user;
        $this->cambio = $cambio;
    }

    public function broadcastOn()
    {
        return new Channel('sanciones');
    }

    public function broadcastAs()
    {
        return 'sancion.actualizado';
    }

    public function broadcastWith()
    {
        return [
            'id' => $this->sancion->id,
            'idUser' => $this->sancion->idUser,
            'nombreUsuario' => $this->usuario?->name ?? 'Usuario',
            'tipo' => $this->sancion->tipo,
            'descripcion' => $this->sancion->descripcion,
            'fecha_creacion' => $this->sancion->fecha_creacion,
            'estado' => $this->sancion->estado ?? 'ACTIVA',
            'cambio' => $this->cambio,
        ];
    }
}
