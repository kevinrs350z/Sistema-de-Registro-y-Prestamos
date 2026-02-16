<?php

namespace App\Mail;

use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Queue\SerializesModels;

/**
 * Correo de notificacion cuando un prestamo es devuelto.
 * Se usa tanto para el alumno como para los encargados.
 */
class PrestamoDevueltoMail extends Mailable
{
    use Queueable, SerializesModels;

    public string $nombreAlumno;
    public int $idPrestamo;
    public string $fechaSolicitud;
    public ?string $fechaInicio;
    public ?string $fechaFin;
    public string $tipo;
    public array $equipos;
    public string $fechaDevolucion;
    public ?string $motivo;
    public string $destinatario; // 'alumno' o 'encargado'

    public function __construct($prestamo, ?string $motivo = null, string $destinatario = 'alumno')
    {
        $persona = $prestamo->user?->persona;

        $this->nombreAlumno = trim(($persona?->Nombre ?? '') . ' ' . ($persona?->apellido1 ?? '') . ' ' . ($persona?->apellido2 ?? ''));
        $this->idPrestamo = (int) $prestamo->idPrestamo;
        $this->fechaSolicitud = $prestamo->created_at?->format('d/m/Y H:i') ?? '';
        $this->fechaInicio = $prestamo->fecha_inicio ? (string) $prestamo->fecha_inicio : null;
        $this->fechaFin = $prestamo->fecha_fin ? (string) $prestamo->fecha_fin : null;
        $this->tipo = (string) $prestamo->tipo;
        $this->fechaDevolucion = now()->format('d/m/Y H:i');
        $this->motivo = $motivo;
        $this->destinatario = $destinatario;

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
        $subject = $this->destinatario === 'alumno'
            ? 'Devolucion confirmada - Prestamo #' . $this->idPrestamo
            : 'Prestamo #' . $this->idPrestamo . ' devuelto por ' . $this->nombreAlumno;

        return $this->subject($subject)
            ->markdown('emails.prestamos.devuelto');
    }
}
