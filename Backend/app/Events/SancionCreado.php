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

class SancionCreado implements ShouldBroadcast
{
    use Dispatchable, InteractsWithSockets, SerializesModels;

    public $sancion;
    public $usuario;

    public function __construct(UserSancion $sancion)
    {
        $this->sancion = $sancion;
        $this->usuario = $sancion->user;
    }

    public function broadcastOn()
    {
        return new Channel('sanciones');
    }

    public function broadcastAs()
    {
        return 'sancion.creado';
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
        ];
    }
}
