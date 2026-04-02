<?php

namespace App\Console\Commands;

use App\Enums\EstadoSancion;
use App\Enums\NivelSancion;
use App\Models\HistorialSancion;
use App\Models\UserSancion;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

class ExpirarSancionesCommand extends Command
{
    protected $signature = 'sanciones:expirar';
    protected $description = 'Marca como EXPIRADA las sanciones activas cuya fecha_fin ya pasó y desbloquea usuarios sin sanciones activas restantes';

    public function handle(): int
    {
        $hoy = now()->toDateString();

        $sancionesVencidas = UserSancion::where('estado_sancion', EstadoSancion::ACTIVA)
            ->whereNotNull('fecha_fin')
            ->where('fecha_fin', '<', $hoy)
            ->where('nivel', '!=', NivelSancion::GRAVISIMA) // GRAVISIMA no expira automáticamente
            ->get();

        if ($sancionesVencidas->isEmpty()) {
            $this->info('No hay sanciones por expirar.');
            return 0;
        }

        $expiradas = 0;
        $desbloqueados = 0;

        DB::beginTransaction();
        try {
            foreach ($sancionesVencidas as $sancion) {
                $estadoAnterior = $sancion->estado_sancion;
                $sancion->estado_sancion = EstadoSancion::EXPIRADA;
                $sancion->save();

                HistorialSancion::create([
                    'user_sancion_id' => $sancion->id,
                    'accion'          => 'EXPIRADA_AUTO',
                    'estado_anterior' => $estadoAnterior,
                    'estado_nuevo'    => EstadoSancion::EXPIRADA,
                    'descripcion'     => 'Expiración automática por fecha de fin cumplida',
                    'ejecutado_por'   => null,
                    'es_automatico'   => true,
                    'metadata'        => json_encode(['fecha_fin' => $sancion->fecha_fin]),
                ]);

                $expiradas++;

                // Desbloquear usuario si no tiene más sanciones activas ni GRAVISIMA pendiente
                $user = $sancion->user;
                if ($user) {
                    $activasRestantes = UserSancion::where('idUser', $user->idUser)
                        ->whereIn('estado_sancion', [EstadoSancion::ACTIVA, EstadoSancion::EN_REVISION_COMITE])
                        ->count();

                    if ($activasRestantes === 0 && $user->bloqueado) {
                        $user->bloqueado = false;
                        $user->save();
                        $desbloqueados++;

                        Log::info("Usuario {$user->idUser} desbloqueado automáticamente tras expirar todas sus sanciones.");
                    }
                }
            }

            DB::commit();
            $this->info("Sanciones expiradas: {$expiradas}. Usuarios desbloqueados: {$desbloqueados}.");
            Log::info("Cron sanciones:expirar — Expiradas: {$expiradas}, Desbloqueados: {$desbloqueados}");
        } catch (\Throwable $e) {
            DB::rollBack();
            Log::error('Error en sanciones:expirar: ' . $e->getMessage());
            $this->error('Error: ' . $e->getMessage());
            return 1;
        }

        return 0;
    }
}
