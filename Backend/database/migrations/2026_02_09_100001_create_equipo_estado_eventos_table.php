<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Migración para crear la tabla de auditoría de estados de equipos.
 * 
 * Esta tabla registra TODOS los cambios de estado de los equipos,
 * funcionando como audit trail / fuente de verdad histórica.
 * Cada cambio de estado genera un INSERT (nunca UPDATE).
 */
class CreateEquipoEstadoEventosTable extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('equipo_estado_eventos', function (Blueprint $table) {
            $table->id();
            
            // FK al equipo que cambió de estado
            $table->unsignedBigInteger('equipo_id');
            
            // FK al usuario que realizó el cambio
            $table->unsignedBigInteger('usuario_id');
            
            // Estado anterior (nullable para el primer registro)
            $table->string('estado_anterior', 50)->nullable();
            
            // Estado nuevo (obligatorio)
            $table->string('estado_nuevo', 50);
            
            // Timestamp del evento
            $table->timestamp('fecha_evento')->useCurrent();
            
            // Motivo del cambio (obligatorio para DADO_DE_BAJA)
            $table->string('motivo', 500)->nullable();
            
            // Observación adicional
            $table->text('observacion')->nullable();
            
            // FK al tipo de falla (obligatorio si estado_nuevo == MANTENIMIENTO)
            $table->unsignedBigInteger('tipo_falla_id')->nullable();
            
            // Origen del cambio: admin, sistema, prestamo, mantenimiento
            $table->string('origen', 30)->nullable()->default('admin');
            
            $table->timestamps();

            // Foreign Keys
            $table->foreign('equipo_id')
                  ->references('id')
                  ->on('equipos')
                  ->onDelete('restrict');

            $table->foreign('usuario_id')
                  ->references('idUser')
                  ->on('users')
                  ->onDelete('restrict');

            $table->foreign('tipo_falla_id')
                  ->references('id')
                  ->on('tipos_falla')
                  ->onDelete('restrict');

            // Índices para consultas frecuentes
            $table->index(['equipo_id', 'fecha_evento'], 'idx_equipo_fecha');
            $table->index('estado_nuevo', 'idx_estado_nuevo');
            $table->index('usuario_id', 'idx_usuario');
            $table->index('tipo_falla_id', 'idx_tipo_falla');
            $table->index('origen', 'idx_origen');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('equipo_estado_eventos');
    }
}
