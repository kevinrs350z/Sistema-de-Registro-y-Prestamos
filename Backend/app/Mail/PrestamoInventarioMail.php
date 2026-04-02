<?php

namespace App\Mail;

use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Queue\SerializesModels;

/**
 * Correo de notificacion a Inventario cuando un prestamo de tipo FUERA
 * (externo a la universidad) cambia de estado.
 * Inventario debe rendir cuenta cuando se sacan equipos fuera de la UTA.
 */
class PrestamoInventarioMail extends Mailable
{
    use Queueable, SerializesModels;

    public string $nombreAlumno;
    public int $idPrestamo;
    public string $fechaSolicitud;
    public ?string $fechaInicio;
    public ?string $fechaFin;
    public string $estado;
    public array $equipos;
    public ?string $observacion;
    public string $fechaEvento;

    public function __construct($prestamo, string $estado)
    {
        $persona = $prestamo->user?->persona;

        $this->nombreAlumno = trim(($persona?->Nombre ?? '') . ' ' . ($persona?->apellido1 ?? '') . ' ' . ($persona?->apellido2 ?? ''));
        $this->idPrestamo = (int) $prestamo->idPrestamo;
        $this->fechaSolicitud = $prestamo->created_at?->format('d/m/Y H:i') ?? '';
        $this->fechaInicio = $prestamo->fecha_inicio ? (string) $prestamo->fecha_inicio : null;
        $this->fechaFin = $prestamo->fecha_fin ? (string) $prestamo->fecha_fin : null;
        $this->estado = $estado;
        $this->observacion = $prestamo->observacion ?? null;
        $this->fechaEvento = now()->format('d/m/Y H:i');

        $this->equipos = $prestamo->equipos
            ? $prestamo->equipos->map(function ($equipo) {
                return [
                    'nombre' => $equipo->tipo?->nombre ?? 'Equipo',
                    'codigo' => $equipo->codigo ?? '',
                ];
            })->toArray()
            : [];
    }

    public function build()
    {
        $estadoTexto = match ($this->estado) {
            'PENDIENTE' => 'Nueva solicitud externa',
            'APROBADO' => 'Solicitud externa aprobada',
            'ENTREGADO' => 'Equipos entregados (salida)',
            'DEVUELTO' => 'Equipos devueltos (reingreso)',
            default => 'Actualizacion prestamo externo',
        };

        return $this->subject("[Inventario] {$estadoTexto} - Prestamo #{$this->idPrestamo}")
            ->markdown('emails.prestamos.inventario');
    }
}
