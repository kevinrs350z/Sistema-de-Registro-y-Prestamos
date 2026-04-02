<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Índices de rendimiento para las queries de reportes y analíticas.
 *
 * Corrige la ausencia de índices compuestos que usa DemandAnalyticsService,
 * StockoutAnalyticsService y DashboardOperationalService.
 */
return new class extends Migration
{
    public function up(): void
    {
        // Índice compuesto principal: usado en TODOS los whereBetween del módulo de reportes
        Schema::table('prestamos', function (Blueprint $table) {
            $table->index(['tipo', 'fecha_inicio', 'estado'], 'idx_prestamos_tipo_fecha_estado');
            $table->index(['estado', 'fecha_inicio'], 'idx_prestamos_estado_fecha');
            $table->index(['idUser', 'estado'], 'idx_prestamos_user_estado');
        });

        // Índice inverso para consultas "historial de equipo" 
        Schema::table('prestamo_equipo', function (Blueprint $table) {
            $table->index(['idEquipo', 'idPrestamo'], 'idx_pe_equipo_prestamo');
        });

        // bloque_prestamos: usado en queries de tipo DENTRO
        Schema::table('bloque_prestamos', function (Blueprint $table) {
            $table->index('idPrestamo', 'idx_bp_prestamo');
        });

        // grupo_prestamo: índice inverso para el LEFT JOIN en baseQuery
        Schema::table('grupo_prestamo', function (Blueprint $table) {
            $table->index('prestamo_id', 'idx_gp_prestamo');
        });

        // equipos: filtro por estado + tipo_equipo_id usado en KPIs de disponibilidad
        Schema::table('equipos', function (Blueprint $table) {
            $table->index(['estado', 'tipo_equipo_id'], 'idx_eq_estado_tipo');
        });
    }

    public function down(): void
    {
        Schema::table('prestamos', function (Blueprint $table) {
            $table->dropIndex('idx_prestamos_tipo_fecha_estado');
            $table->dropIndex('idx_prestamos_estado_fecha');
            $table->dropIndex('idx_prestamos_user_estado');
        });

        Schema::table('prestamo_equipo', function (Blueprint $table) {
            $table->dropIndex('idx_pe_equipo_prestamo');
        });

        Schema::table('bloque_prestamos', function (Blueprint $table) {
            $table->dropIndex('idx_bp_prestamo');
        });

        Schema::table('grupo_prestamo', function (Blueprint $table) {
            $table->dropIndex('idx_gp_prestamo');
        });

        Schema::table('equipos', function (Blueprint $table) {
            $table->dropIndex('idx_eq_estado_tipo');
        });
    }
};
