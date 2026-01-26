<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration {
    public function up(): void
    {
        Schema::table('prestamos', function (Blueprint $table) {
            // Eliminar FK vieja
            $table->dropForeign(['admin_entregado_id']);
            // Renombrar columnas
            $table->renameColumn('admin_entregado_id', 'admin_responsable_id');
            $table->renameColumn('fecha_entregado', 'fecha_cambio_estado');
        });
        
        // Recrear FK con nuevo nombre
        Schema::table('prestamos', function (Blueprint $table) {
            $table->foreign('admin_responsable_id')
                ->references('idUser')
                ->on('users')
                ->onDelete('set null');
        });
    }

    public function down(): void
    {
        Schema::table('prestamos', function (Blueprint $table) {
            $table->dropForeign(['admin_responsable_id']);
            $table->renameColumn('admin_responsable_id', 'admin_entregado_id');
            $table->renameColumn('fecha_cambio_estado', 'fecha_entregado');
        });
        
        Schema::table('prestamos', function (Blueprint $table) {
            $table->foreign('admin_entregado_id')
                ->references('idUser')
                ->on('users')
                ->onDelete('set null');
        });
    }
};
