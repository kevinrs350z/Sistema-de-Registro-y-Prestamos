<?php

namespace App\Mail;

use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Queue\SerializesModels;

/**
 * Correo de confirmacion al alumno cuando se registra su solicitud.
 */
class PrestamoSolicitudConfirmacionMail extends Mailable
{
    use Queueable, SerializesModels;

    public string $nombreAlumno;
    public int $idPrestamo;
    public string $fechaSolicitud;
    public ?string $fechaInicio;
    public ?string $fechaFin;
    public string $tipo;
    public array $equipos;
    public ?string $observacion;

    public function __construct($prestamo)
    {
        $persona = $prestamo->user?->persona;

        $this->nombreAlumno = trim(($persona?->Nombre ?? '') . ' ' . ($persona?->apellido1 ?? '') . ' ' . ($persona?->apellido2 ?? ''));
        $this->idPrestamo = (int) $prestamo->idPrestamo;
        $this->fechaSolicitud = $prestamo->created_at?->format('d/m/Y H:i') ?? '';
        $this->fechaInicio = $prestamo->fecha_inicio ? (string) $prestamo->fecha_inicio : null;
        $this->fechaFin = $prestamo->fecha_fin ? (string) $prestamo->fecha_fin : null;
        $this->tipo = (string) $prestamo->tipo;
        $this->observacion = $prestamo->observacion ?? null;

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
        return $this->subject('Confirmacion de solicitud de prestamo #' . $this->idPrestamo)
            ->markdown('emails.prestamos.solicitud-confirmacion');
    }
}
