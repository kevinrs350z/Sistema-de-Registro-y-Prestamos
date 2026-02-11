<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use App\Models\Prestamo;
use App\Models\PrestamoHistorial;
use App\Models\Bloque;
use App\Enums\EstadoPrestamo;
use Carbon\Carbon;

class RechazarSolicitudesPendientesPorRetraso extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'app:rechazar-solicitudes-pendientes-por-retraso';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Rechaza automáticamente solicitudes pendientes si el alumno no llega a tiempo (más de 10 minutos de retraso).';

    /**
     * Execute the console command.
     */
    public function handle()
    {
        $now = Carbon::now();
        $limite = $now->copy()->subMinutes(10);

        $total = 0;

        // Externos: por fecha_inicio
        $pendientesExternos = Prestamo::where('estado', EstadoPrestamo::PENDIENTE)
            ->where('tipo', 'FUERA')
            ->where('fecha_inicio', '<', $limite)
            ->get();

        foreach ($pendientesExternos as $prestamo) {
            $estadoAnterior = $prestamo->estado;
            $prestamo->estado = EstadoPrestamo::RECHAZADO;
            $prestamo->observacion = ($prestamo->observacion ? $prestamo->observacion.' | ' : '') . '[AUTO] Rechazado: paso el limite de tiempo';
            $prestamo->save();

            PrestamoHistorial::create([
                'idPrestamo' => $prestamo->idPrestamo,
                'idUser' => $prestamo->idUser,
                'estado_anterior' => $estadoAnterior,
                'estado_nuevo' => EstadoPrestamo::RECHAZADO,
                'descripcion' => '[AUTO] Rechazo automático: paso el limite de tiempo',
            ]);
            $total++;
        }

        // Internos: por bloques
        $pendientesInternos = Prestamo::where('estado', EstadoPrestamo::PENDIENTE)
            ->where('tipo', 'DENTRO')
            ->get();

        foreach ($pendientesInternos as $prestamo) {
            $primerBloque = $prestamo->bloquePrestamo()->with('bloque')->orderBy('idBloque')->first();
            if ($primerBloque && $primerBloque->bloque) {
                $horaInicio = $primerBloque->bloque->hora_inicio;
                $horaInicioCarbon = Carbon::createFromFormat('H:i:s', $horaInicio);
                $horaLimite = $horaInicioCarbon->copy()->addMinutes(10);
                // Log para depuración
                \Log::info('[RECHAZO AUTO] Solicitud '.$prestamo->idPrestamo.' | now: '.$now->format('H:i:s').' | hora_inicio: '.$horaInicioCarbon->format('H:i:s').' | hora_limite: '.$horaLimite->format('H:i:s'));
                // Solo rechazar si la hora actual es mayor o igual a la hora de inicio y han pasado más de 10 minutos
                if ($now->greaterThanOrEqualTo($horaLimite) && $now->greaterThanOrEqualTo($horaInicioCarbon)) {
                    $estadoAnterior = $prestamo->estado;
                    $prestamo->estado = EstadoPrestamo::RECHAZADO;
                    $prestamo->observacion = ($prestamo->observacion ? $prestamo->observacion.' | ' : '') . '[AUTO] Rechazado: paso el limite de tiempo';
                    $prestamo->save();

                    PrestamoHistorial::create([
                        'idPrestamo' => $prestamo->idPrestamo,
                        'idUser' => $prestamo->idUser,
                        'estado_anterior' => $estadoAnterior,
                        'estado_nuevo' => EstadoPrestamo::RECHAZADO,
                        'descripcion' => '[AUTO] Rechazo automático: paso el limite de tiempo',
                    ]);
                    $total++;
                }
            }
        }

        $this->info("Solicitudes rechazadas automáticamente: $total");
    }
}
