<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Migración para agregar campos necesarios para estadísticas de demanda.
 * 
 * Agrega:
 * - motivo_rechazo: enum para categorizar rechazos y calcular demanda insatisfecha
 * - fecha_entrega_real: timestamp real de entrega (no la fecha estimada)
 * - fecha_devolucion_real: timestamp real de devolución
 * 
 * Estos campos son necesarios para:
 * - Calcular tasa de rechazo por falta de stock vs otros motivos
 * - Calcular tiempos de espera reales (solicitud → entrega)
 * - Calcular duración real de préstamos
 */
class AddEstadisticasFieldsToPrestamosTable extends Migration
{
    /**
     * Motivos de rechazo posibles.
     * 
     * SIN_STOCK: No hay equipos disponibles del modelo solicitado
     * CONFLICTO_HORARIO: El equipo está reservado para ese horario
     * SANCION_USUARIO: El usuario tiene sanción activa
     * DOCUMENTACION: Falta documentación o requisitos
     * OTRO: Otros motivos administrativos
     */
    public function up(): void
    {
        Schema::table('prestamos', function (Blueprint $table) {
            // Motivo de rechazo categorizado (para estadísticas)
            $table->string('motivo_rechazo', 50)->nullable()->after('observacion');
            
            // Timestamps reales para cálculo de métricas
            $table->timestamp('fecha_entrega_real')->nullable()->after('fecha_fin');
            $table->timestamp('fecha_devolucion_real')->nullable()->after('fecha_entrega_real');
            
            // Índice para consultas de rechazos por stock
            $table->index('motivo_rechazo', 'idx_motivo_rechazo');
        });
    }

    public function down(): void
    {
        Schema::table('prestamos', function (Blueprint $table) {
            $table->dropIndex('idx_motivo_rechazo');
            $table->dropColumn(['motivo_rechazo', 'fecha_entrega_real', 'fecha_devolucion_real']);
        });
    }
}
