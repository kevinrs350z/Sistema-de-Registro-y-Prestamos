<?php

namespace App\Services;

use App\Enums\CategoriaFalta;
use App\Enums\EstadoSancion;
use App\Enums\NivelSancion;
use App\Models\Sancion;
use App\Models\User;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

/**
 * Servicio responsable de la lógica de escalamiento automático de sanciones.
 *
 * Reglas:
 *   3 LEVES  dentro de la ventana → genera 1 MEDIA
 *   2 MEDIAS dentro de la ventana → genera 1 GRAVE
 *   2 GRAVES dentro de la ventana → genera 1 GRAVISIMA
 *
 * La ventana se obtiene de configuracion_sanciones (default 180 días).
 * El escalamiento es recursivo: una MEDIA generada puede gatillar una GRAVE.
 */
class EscalamientoService
{
    /**
     * Verificar y ejecutar escalamiento después de asignar una nueva sanción.
     *
     * @param  int    $userId      ID del usuario
     * @param  string $nivel       Nivel de la sanción recién asignada
     * @param  int    $pivotId     ID del registro en user_sancion recién creado
     * @param  int|null $adminId   ID del admin que asignó (null = sistema)
     * @return array  Lista de escalamientos generados [{nivel, pivot_id}]
     */
    public function verificar(int $userId, string $nivel, int $pivotId, ?int $adminId = null): array
    {
        $escalamientos = [];
        $this->verificarRecursivo($userId, strtoupper($nivel), $pivotId, $adminId, $escalamientos);
        return $escalamientos;
    }

    private function verificarRecursivo(int $userId, string $nivel, int $pivotId, ?int $adminId, array &$resultado): void
    {
        $nivelSuperior = NivelSancion::siguiente($nivel);
        if (! $nivelSuperior) {
            return; // GRAVISIMA no escala más
        }

        $umbral = $this->getUmbral($nivel);
        $ventanaDias = $this->getVentana();
        $fechaCorte = now()->subDays($ventanaDias)->toDateString();

        // Contar sanciones del MISMO nivel en la ventana (excluyendo escalamientos previos)
        $conteo = DB::table('user_sancion')
            ->where('idUser', $userId)
            ->where('nivel', $nivel)
            ->whereIn('estado_sancion', EstadoSancion::contablesParaEscalamiento())
            ->where(function ($q) {
                $q->where('categoria_falta', '!=', CategoriaFalta::REINCIDENCIA_ACUMULADA)
                  ->orWhereNull('categoria_falta');
            })
            ->where('created_at', '>=', $fechaCorte)
            ->count();

        if ($conteo < $umbral) {
            return; // Aún no alcanza el umbral
        }

        Log::info("Escalamiento automático: usuario {$userId} alcanzó {$conteo}/{$umbral} sanciones {$nivel} → generando {$nivelSuperior}");

        // ===== Generar la sanción de nivel superior =====

        // Buscar catálogo del nivel superior
        $catalogo = Sancion::whereRaw('UPPER(nivel) = ?', [$nivelSuperior])->first();
        $idSancion = $catalogo?->idSancion;

        if (! $idSancion) {
            Log::warning("No se encontró catálogo para nivel {$nivelSuperior}. Escalamiento abortado.");
            return;
        }

        // Calcular fecha fin basada en duración configurada
        $duracionDias = $this->getDuracion($nivelSuperior);
        $hoy = now()->toDateString();
        $fechaFin = now()->addDays($duracionDias)->toDateString();

        // Determinar periodo académico actual (formato YYYY-S)
        $mes = (int) date('m');
        $semestre = $mes <= 7 ? '1' : '2';
        $periodo = date('Y') . '-' . $semestre;

        // Crear nueva sanción en pivot
        $newPivotId = DB::table('user_sancion')->insertGetId([
            'idUser'            => $userId,
            'idSancion'         => $idSancion,
            'nivel'             => $nivelSuperior,
            'estado_sancion'    => $nivelSuperior === NivelSancion::GRAVISIMA
                                      ? EstadoSancion::EN_REVISION_COMITE
                                      : EstadoSancion::ACTIVA,
            'categoria_falta'   => CategoriaFalta::REINCIDENCIA_ACUMULADA,
            'fecha_inicio'      => $hoy,
            'fecha_fin'         => $fechaFin,
            'assigned_by'       => $adminId,
            'prestamo_id'       => null,
            'descripcion'       => "Escalamiento automático: {$conteo} sanciones {$nivel} acumuladas en {$ventanaDias} días",
            'accion'            => 'ESCALAMIENTO',
            'escalada_desde_id' => $pivotId,
            'periodo_academico' => $periodo,
            'created_at'        => now(),
            'updated_at'        => now(),
        ]);

        // Registrar en historial
        DB::table('historial_sanciones')->insert([
            'user_sancion_id' => $newPivotId,
            'accion'          => 'ESCALAMIENTO',
            'estado_anterior' => null,
            'estado_nuevo'    => $nivelSuperior === NivelSancion::GRAVISIMA
                                    ? EstadoSancion::EN_REVISION_COMITE
                                    : EstadoSancion::ACTIVA,
            'descripcion'     => "Escalamiento automático: {$conteo} {$nivel} → 1 {$nivelSuperior}",
            'ejecutado_por'   => null,
            'es_automatico'   => true,
            'metadata'        => json_encode([
                'nivel_origen'      => $nivel,
                'nivel_destino'     => $nivelSuperior,
                'conteo'            => $conteo,
                'umbral'            => $umbral,
                'ventana_dias'      => $ventanaDias,
                'sancion_origen_id' => $pivotId,
            ]),
            'created_at'      => now(),
        ]);

        // Marcar las sanciones que gatillaron como ESCALADA
        DB::table('user_sancion')
            ->where('idUser', $userId)
            ->where('nivel', $nivel)
            ->where('estado_sancion', EstadoSancion::ACTIVA)
            ->where(function ($q) {
                $q->where('categoria_falta', '!=', CategoriaFalta::REINCIDENCIA_ACUMULADA)
                  ->orWhereNull('categoria_falta');
            })
            ->where('created_at', '>=', $fechaCorte)
            ->update(['estado_sancion' => EstadoSancion::ESCALADA]);

        // Bloquear usuario si es GRAVE o GRAVISIMA
        if (in_array($nivelSuperior, [NivelSancion::GRAVE, NivelSancion::GRAVISIMA])) {
            DB::table('users')
                ->where('idUser', $userId)
                ->update([
                    'bloqueado'        => true,
                    'bloqueado_motivo' => "Escalamiento automático a {$nivelSuperior}",
                    'bloqueado_fecha'  => now(),
                    'bloqueado_por'    => $adminId,
                ]);
        }

        $resultado[] = [
            'nivel'    => $nivelSuperior,
            'pivot_id' => $newPivotId,
        ];

        // Recursión: verificar si el nivel superior también alcanza umbral
        $this->verificarRecursivo($userId, $nivelSuperior, $newPivotId, $adminId, $resultado);
    }

    // ─── Helpers de configuración ───

    private function getUmbral(string $nivel): int
    {
        $clave = match (strtoupper($nivel)) {
            NivelSancion::LEVE  => 'escalamiento_leve_limite',
            NivelSancion::MEDIA => 'escalamiento_media_limite',
            NivelSancion::GRAVE => 'escalamiento_grave_limite',
            default             => null,
        };

        if (! $clave) return PHP_INT_MAX;

        return (int) ($this->config($clave) ?? match (strtoupper($nivel)) {
            NivelSancion::LEVE  => 3,
            NivelSancion::MEDIA => 2,
            NivelSancion::GRAVE => 2,
            default             => PHP_INT_MAX,
        });
    }

    private function getVentana(): int
    {
        return (int) ($this->config('ventana_reincidencia_dias') ?? 180);
    }

    private function getDuracion(string $nivel): int
    {
        $clave = match (strtoupper($nivel)) {
            NivelSancion::LEVE      => 'duracion_leve_dias',
            NivelSancion::MEDIA     => 'duracion_media_dias',
            NivelSancion::GRAVE     => 'duracion_grave_dias',
            NivelSancion::GRAVISIMA => 'duracion_gravisima_dias',
            default                 => null,
        };

        if ($clave) {
            $val = $this->config($clave);
            if ($val !== null) return (int) $val;
        }

        return NivelSancion::duracionBase($nivel);
    }

    private function config(string $clave): ?string
    {
        return DB::table('configuracion_sanciones')
            ->where('clave', $clave)
            ->value('valor');
    }
}
