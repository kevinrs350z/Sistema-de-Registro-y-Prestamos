<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use App\Models\Prestamo;
use App\Models\PrestamoHistorial;
use App\Enums\EstadoPrestamo;
use App\Enums\EstadoEquipo;
use Carbon\Carbon;
use Illuminate\Support\Facades\Log;

class RechazarSolicitudesPendientesPorRetraso extends Command
{
    protected $signature = 'app:rechazar-solicitudes-pendientes-por-retraso';

    protected $description = 'Rechaza automáticamente solicitudes pendientes si el alumno no llega a tiempo (más de 10 minutos de retraso).';

    /** Minutos de tolerancia antes del rechazo automático */
    private const MINUTOS_TOLERANCIA = 10;

    public function handle(): void
    {
        $now = Carbon::now();
        $total = 0;

        Log::info("[RECHAZO AUTO] ── Inicio del comando ── now: {$now->format('Y-m-d H:i:s')}");

        // ═══════════════════════════════════════════════════════
        // 1. EXTERNOS (FUERA): comparación directa con fecha_inicio
        // ═══════════════════════════════════════════════════════
        $this->procesarExternos($now, $total);

        // ═══════════════════════════════════════════════════════
        // 2. INTERNOS (DENTRO): fecha del préstamo + hora del bloque
        // ═══════════════════════════════════════════════════════
        $this->procesarInternos($now, $total);

        Log::info("[RECHAZO AUTO] ── Fin del comando ── Total rechazados: {$total}");
        $this->info("Solicitudes rechazadas automáticamente: {$total}");
    }

    /**
     * Procesar préstamos EXTERNOS.
     * Usa fecha_inicio directamente (es una columna DATE).
     */
    private function procesarExternos(Carbon $now, int &$total): void
    {
        $limite = $now->copy()->subMinutes(self::MINUTOS_TOLERANCIA);

        $pendientes = Prestamo::where('estado', EstadoPrestamo::PENDIENTE)
            ->where('tipo', 'FUERA')
            ->where('fecha_inicio', '<', $limite)
            ->get();

        foreach ($pendientes as $prestamo) {
            Log::info("[RECHAZO AUTO] EXTERNO #{$prestamo->idPrestamo} | fecha_inicio: {$prestamo->fecha_inicio} | limite: {$limite->format('Y-m-d H:i:s')}");
            $this->rechazarPrestamo($prestamo, $total);
        }
    }

    /**
     * Procesar préstamos INTERNOS.
     *
     * Construye un datetime completo combinando:
     *   - Fecha del préstamo (fecha_inicio ?? created_at)
     *   - hora_inicio del primer bloque asociado
     *
     * Rechaza si: now >= (fecha + hora_inicio + 10 min)
     */
    private function procesarInternos(Carbon $now, int &$total): void
    {
        $hoy = $now->toDateString(); // YYYY-MM-DD

        $pendientes = Prestamo::where('estado', EstadoPrestamo::PENDIENTE)
            ->where('tipo', 'DENTRO')
            ->get();

        foreach ($pendientes as $prestamo) {
            // ── Obtener el primer bloque horario asociado ──
            $primerBP = $prestamo->bloquePrestamo()
                ->with('bloque')
                ->orderBy('idBloque', 'asc')
                ->first();

            if (!$primerBP || !$primerBP->bloque) {
                Log::warning("[RECHAZO AUTO] INTERNO #{$prestamo->idPrestamo}: sin bloque asociado, se omite.");
                continue;
            }

            $bloque = $primerBP->bloque;

            // ── Determinar la FECHA del préstamo ──
            // fecha_inicio puede ser null en préstamos creados por admin
            $fechaPrestamo = $prestamo->fecha_inicio
                ? Carbon::parse($prestamo->fecha_inicio)->toDateString()
                : Carbon::parse($prestamo->created_at)->toDateString();

            // ── Ignorar préstamos de fechas futuras ──
            if ($fechaPrestamo > $hoy) {
                Log::info("[RECHAZO AUTO] INTERNO #{$prestamo->idPrestamo}: fecha futura ({$fechaPrestamo}), se omite.");
                continue;
            }

            // ── Construir DATETIME completo: fecha + hora_inicio del bloque ──
            // Carbon::parse maneja tanto "HH:mm:ss" como "HH:mm" de forma robusta
            $horaInicioStr = trim($bloque->hora_inicio);
            $datetimeInicio = Carbon::parse("{$fechaPrestamo} {$horaInicioStr}");
            $datetimeLimite = $datetimeInicio->copy()->addMinutes(self::MINUTOS_TOLERANCIA);

            Log::info("[RECHAZO AUTO] INTERNO #{$prestamo->idPrestamo}"
                . " | now: {$now->format('Y-m-d H:i:s')}"
                . " | fechaPrestamo: {$fechaPrestamo}"
                . " | bloque: {$bloque->nombre} ({$horaInicioStr})"
                . " | inicio: {$datetimeInicio->format('Y-m-d H:i:s')}"
                . " | limite: {$datetimeLimite->format('Y-m-d H:i:s')}"
            );

            // ── Rechazar solo si ya pasó el límite ──
            if ($now->greaterThanOrEqualTo($datetimeLimite)) {
                $this->rechazarPrestamo($prestamo, $total);
            }
        }
    }

    /**
     * Marca un préstamo como RECHAZADO y registra historial.
     */
    private function rechazarPrestamo(Prestamo $prestamo, int &$total): void
    {
        $estadoAnterior = $prestamo->estado;

        $prestamo->estado = EstadoPrestamo::RECHAZADO;
        $prestamo->motivo_rechazo = 'TIEMPO_EXCEDIDO';
        $prestamo->observacion = ($prestamo->observacion ? $prestamo->observacion . ' | ' : '')
            . '[AUTO] Rechazado: pasó el límite de tiempo (10 min después del inicio del bloque)';
        $prestamo->save();

        // Liberar equipos asociados a DISPONIBLE
        $prestamo->load('equipos');
        foreach ($prestamo->equipos as $equipo) {
            $equipo->estado = EstadoEquipo::DISPONIBLE;
            $equipo->save();
        }

        PrestamoHistorial::create([
            'idPrestamo'     => $prestamo->idPrestamo,
            'idUser'         => $prestamo->idUser,
            'estado_anterior' => $estadoAnterior,
            'estado_nuevo'   => EstadoPrestamo::RECHAZADO,
            'descripcion'    => '[AUTO] Rechazo automático: pasó el límite de tiempo (10 min después del inicio del bloque)',
        ]);

        Log::info("[RECHAZO AUTO] ✅ Préstamo #{$prestamo->idPrestamo} RECHAZADO (era: {$estadoAnterior}) — equipos liberados");
        $total++;
    }
}
