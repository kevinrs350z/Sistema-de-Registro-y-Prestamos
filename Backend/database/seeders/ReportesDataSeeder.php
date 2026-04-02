<?php
namespace Database\Seeders;

use Carbon\Carbon;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

/**
 * Seeder para generar datos masivos para los reportes.
 * Genera préstamos, sanciones y relaciones variadas para que los gráficos se vean completos.
 */

class ReportesDataSeeder extends Seeder
{
    public function run(): void
    {
        $this->generarPrestamosHistoricos();
        $this->generarSancionesVariadas();
        $this->generarPrestamosPorEstado();
    }

    /**
     * Genera préstamos históricos distribuidos en los últimos 12 meses
     * para los gráficos de evolución temporal.
     */
    private function generarPrestamosHistoricos(): void
    {
        $estados = ['PENDIENTE', 'APROBADO', 'DEVUELTO', 'RECHAZADO', 'ENTREGADO'];
        $tipos = ['DENTRO', 'FUERA'];
        $motivos = [
            'Práctica de laboratorio',
            'Proyecto de asignatura',
            'Trabajo de título',
            'Grabación de video',
            'Sesión fotográfica',
            'Edición multimedia',
            'Presentación académica',
            'Evento universitario',
            'Taller práctico',
            'Examen práctico'
        ];

        // Obtener usuarios existentes (excluyendo admin)
        $userIds = DB::table('users')->where('idUser', '>', 1)->pluck('idUser')->toArray();
        if (empty($userIds)) {
            $userIds = [2, 3, 4, 5];
        }

        // Obtener equipos existentes
        $equipoIds = DB::table('equipos')->pluck('id')->toArray();
        if (empty($equipoIds)) {
            $equipoIds = [1, 2, 3, 4, 5, 6];
        }

        // Obtener bloques y asignaturas
        $bloqueIds = DB::table('bloques')->pluck('idBloque')->toArray();
        $asignaturaIds = DB::table('asignaturas')->pluck('idAsignatura')->toArray();

        $prestamosData = [];
        $prestamoEquipoData = [];
        $bloquePrestamosData = [];

        // Generar préstamos para los últimos 12 meses
        for ($mes = 11; $mes >= 0; $mes--) {
            // Cantidad variable de préstamos por mes (entre 15 y 40)
            $cantidadMes = rand(15, 40);

            for ($i = 0; $i < $cantidadMes; $i++) {
                $fechaBase = Carbon::now()->subMonths($mes)->subDays(rand(0, 28));
                $userId = $userIds[array_rand($userIds)];
                $tipo = $tipos[array_rand($tipos)];
                $estado = $estados[array_rand($estados)];

                // Para préstamos FUERA, definir fechas. Para DENTRO, siempre fecha_inicio.
                $fechaInicio = $fechaBase->copy()->toDateString();
                $fechaFin = null;
                if ($tipo === 'FUERA') {
                    $fechaFin = $fechaBase->copy()->addDays(rand(1, 7))->toDateString();
                }

                // Motivo de rechazo para préstamos RECHAZADO
                $motivoRechazo = null;
                if ($estado === 'RECHAZADO') {
                    $motivosRechazo = ['SIN_STOCK', 'CONFLICTO_HORARIO', 'SANCION_USUARIO', 'DOCUMENTACION', 'LIMITE_PRESTAMOS', null];
                    $motivoRechazo = $motivosRechazo[array_rand($motivosRechazo)];
                }

                $prestamosData[] = [
                    'idUser' => $userId,
                    'fecha_inicio' => $fechaInicio,
                    'fecha_fin' => $fechaFin,
                    'estado' => $estado,
                    'tipo' => $tipo,
                    'motivo_rechazo' => $motivoRechazo,
                    'otra_motivo' => $motivos[array_rand($motivos)],
                    'observacion' => rand(0, 3) === 0 ? 'Observación de prueba' : null,
                    'created_at' => $fechaBase,
                    'updated_at' => $fechaBase,
                ];
            }
        }

        // Insertar préstamos en lotes
        foreach (array_chunk($prestamosData, 100) as $chunk) {
            DB::table('prestamos')->insert($chunk);
        }

        // Obtener IDs de préstamos recién creados
        $prestamosNuevos = DB::table('prestamos')
            ->orderBy('idPrestamo', 'desc')
            ->limit(count($prestamosData))
            ->pluck('idPrestamo')
            ->toArray();

        // Asociar equipos a cada préstamo
        foreach ($prestamosNuevos as $prestamoId) {
            $cantidadEquipos = rand(1, 3);
            $equiposSeleccionados = array_rand(array_flip($equipoIds), min($cantidadEquipos, count($equipoIds)));
            
            if (!is_array($equiposSeleccionados)) {
                $equiposSeleccionados = [$equiposSeleccionados];
            }

            foreach ($equiposSeleccionados as $equipoId) {
                $prestamoEquipoData[] = [
                    'idPrestamo' => $prestamoId,
                    'idEquipo' => $equipoId,
                    'created_at' => now(),
                    'updated_at' => now(),
                ];
            }

            // Para préstamos DENTRO, agregar bloques
            $prestamo = DB::table('prestamos')->where('idPrestamo', $prestamoId)->first();
            if ($prestamo && $prestamo->tipo === 'DENTRO' && !empty($bloqueIds) && !empty($asignaturaIds)) {
                $cantidadBloques = rand(1, 2);
                for ($b = 0; $b < $cantidadBloques; $b++) {
                    $bloquePrestamosData[] = [
                        'idPrestamo' => $prestamoId,
                        'idBloque' => $bloqueIds[array_rand($bloqueIds)],
                        'idAsignatura' => $asignaturaIds[array_rand($asignaturaIds)],
                        'created_at' => now(),
                        'updated_at' => now(),
                    ];
                }
            }
        }

        // Insertar relaciones en lotes
        foreach (array_chunk($prestamoEquipoData, 100) as $chunk) {
            DB::table('prestamo_equipo')->insert($chunk);
        }

        if (!empty($bloquePrestamosData)) {
            foreach (array_chunk($bloquePrestamosData, 100) as $chunk) {
                DB::table('bloque_prestamos')->insert($chunk);
            }
        }

        $this->command->info('✓ Generados ' . count($prestamosData) . ' préstamos históricos');
    }

    /**
     * Genera sanciones variadas con diferentes niveles y estados.
     */
    private function generarSancionesVariadas(): void
    {
        $niveles = ['LEVE', 'MEDIA', 'GRAVE'];
        $sancionesData = [];
        $userSancionData = [];

        // Obtener usuarios (excluyendo admin)
        $userIds = DB::table('users')->where('idUser', '>', 1)->pluck('idUser')->toArray();
        if (empty($userIds)) {
            return;
        }

        // Generar sanciones para los últimos 12 meses
        for ($mes = 11; $mes >= 0; $mes--) {
            // Entre 3 y 10 sanciones por mes
            $cantidadMes = rand(3, 10);

            for ($i = 0; $i < $cantidadMes; $i++) {
                $fechaBase = Carbon::now()->subMonths($mes)->subDays(rand(0, 28));
                $nivel = $niveles[array_rand($niveles)];
                
                // Duración según nivel
                $duracionDias = match($nivel) {
                    'LEVE' => rand(7, 14),
                    'MEDIA' => rand(15, 30),
                    'GRAVE' => rand(30, 60),
                };

                $fechaInicio = $fechaBase->copy();
                $fechaFin = $fechaBase->copy()->addDays($duracionDias);
                
                // Estado basado en si ya expiró
                $estado = $fechaFin->isPast() ? 'EXPIRADA' : 'ACTIVA';

                $sancionesData[] = [
                    'nivel' => $nivel,
                    'descripcion' => $this->getDescripcionSancion($nivel),
                    'estado' => $estado,
                    'fecha_inicio' => $fechaInicio->toDateString(),
                    'fecha_fin' => $fechaFin->toDateString(),
                    'created_at' => $fechaInicio,
                    'updated_at' => $fechaInicio,
                ];
            }
        }

        // Insertar sanciones
        DB::table('sancions')->insert($sancionesData);

        // Obtener IDs de sanciones recién creadas
        $sancionesNuevas = DB::table('sancions')
            ->orderBy('idSancion', 'desc')
            ->limit(count($sancionesData))
            ->pluck('idSancion')
            ->toArray();

        // Asociar sanciones a usuarios
        foreach ($sancionesNuevas as $sancionId) {
            $userId = $userIds[array_rand($userIds)];
            
            $userSancionData[] = [
                'idUser' => $userId,
                'idSancion' => $sancionId,
                'assigned_by' => 1, // Admin
                'prestamo_id' => null,
                'descripcion' => 'Sanción aplicada por incumplimiento',
                'created_at' => now(),
                'updated_at' => now(),
            ];
        }

        DB::table('user_sancion')->insert($userSancionData);

        $this->command->info('✓ Generadas ' . count($sancionesData) . ' sanciones variadas');
    }

    /**
     * Genera préstamos adicionales con estados específicos para estadísticas.
     */
    private function generarPrestamosPorEstado(): void
    {
        $userIds = DB::table('users')->where('idUser', '>', 1)->pluck('idUser')->toArray();
        if (empty($userIds)) {
            return;
        }

        $equipoIds = DB::table('equipos')->pluck('id')->toArray();
        if (empty($equipoIds)) {
            return;
        }

        // Generar préstamos rechazados (para estadísticas de rechazos)
        $motivosRechazo = ['SIN_STOCK', 'CONFLICTO_HORARIO', 'SANCION_USUARIO', 'DOCUMENTACION', 'LIMITE_PRESTAMOS'];
        for ($i = 0; $i < 25; $i++) {
            $fecha = Carbon::now()->subDays(rand(1, 180));
            $userId = $userIds[array_rand($userIds)];

            $prestamoId = DB::table('prestamos')->insertGetId([
                'idUser' => $userId,
                'fecha_inicio' => $fecha->toDateString(),
                'fecha_fin' => $fecha->copy()->addDays(rand(1, 5))->toDateString(),
                'estado' => 'RECHAZADO',
                'tipo' => ['DENTRO', 'FUERA'][rand(0, 1)],
                'motivo_rechazo' => $motivosRechazo[array_rand($motivosRechazo)],
                'otra_motivo' => 'Solicitud de prueba',
                'observacion' => 'Rechazado por falta de disponibilidad',
                'created_at' => $fecha,
                'updated_at' => $fecha,
            ]);

            DB::table('prestamo_equipo')->insert([
                'idPrestamo' => $prestamoId,
                'idEquipo' => $equipoIds[array_rand($equipoIds)],
                'created_at' => now(),
                'updated_at' => now(),
            ]);
        }

        // Generar préstamos entregados (completados)
        for ($i = 0; $i < 50; $i++) {
            $fecha = Carbon::now()->subDays(rand(1, 180));
            $userId = $userIds[array_rand($userIds)];

            $prestamoId = DB::table('prestamos')->insertGetId([
                'idUser' => $userId,
                'fecha_inicio' => $fecha->toDateString(),
                'fecha_fin' => $fecha->copy()->addDays(rand(1, 7))->toDateString(),
                'estado' => 'ENTREGADO',
                'tipo' => ['DENTRO', 'FUERA'][rand(0, 1)],
                'otra_motivo' => 'Proyecto académico',
                'observacion' => null,
                'created_at' => $fecha,
                'updated_at' => $fecha,
            ]);

            DB::table('prestamo_equipo')->insert([
                'idPrestamo' => $prestamoId,
                'idEquipo' => $equipoIds[array_rand($equipoIds)],
                'created_at' => now(),
                'updated_at' => now(),
            ]);
        }

        // Generar préstamos devueltos
        for ($i = 0; $i < 80; $i++) {
            $fecha = Carbon::now()->subDays(rand(1, 180));
            $userId = $userIds[array_rand($userIds)];

            $prestamoId = DB::table('prestamos')->insertGetId([
                'idUser' => $userId,
                'fecha_inicio' => $fecha->toDateString(),
                'fecha_fin' => $fecha->copy()->addDays(rand(1, 7))->toDateString(),
                'estado' => 'DEVUELTO',
                'tipo' => ['DENTRO', 'FUERA'][rand(0, 1)],
                'otra_motivo' => 'Uso en clases',
                'observacion' => null,
                'created_at' => $fecha,
                'updated_at' => $fecha,
            ]);

            DB::table('prestamo_equipo')->insert([
                'idPrestamo' => $prestamoId,
                'idEquipo' => $equipoIds[array_rand($equipoIds)],
                'created_at' => now(),
                'updated_at' => now(),
            ]);
        }

        $this->command->info('✓ Generados 155 préstamos adicionales por estado');
    }

    /**
     * Obtiene una descripción según el nivel de sanción.
     */
    private function getDescripcionSancion(string $nivel): string
    {
        $descripciones = [
            'LEVE' => [
                'Retraso menor en la devolución del equipo',
                'Falta de comunicación sobre el uso',
                'Incumplimiento leve de protocolo',
            ],
            'MEDIA' => [
                'Retraso significativo en la devolución',
                'Daño menor al equipo prestado',
                'Incumplimiento de normas de uso',
                'Uso no autorizado del equipo',
            ],
            'GRAVE' => [
                'Daño grave al equipo prestado',
                'Pérdida del equipo',
                'Uso indebido reiterado',
                'Falsificación de información en solicitud',
            ],
        ];

        $opciones = $descripciones[$nivel] ?? ['Sanción aplicada'];
        return $opciones[array_rand($opciones)];
    }
}
