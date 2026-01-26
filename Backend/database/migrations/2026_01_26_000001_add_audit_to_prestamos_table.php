<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::table('prestamos', function (Blueprint $table) {
            // Admin responsable del último cambio de estado
            $table->unsignedBigInteger('admin_responsable_id')->nullable()->after('estado');
            
            // Fecha exacta del último cambio de estado
            $table->dateTime('fecha_cambio_estado')->nullable()->after('admin_responsable_id');
            
            // Foreign key
            $table->foreign('admin_responsable_id')
                ->references('idUser')
                ->on('users')
                ->onDelete('set null');
            
            // Índices para auditoría
            $table->index('admin_responsable_id');
            $table->index('fecha_cambio_estado');
        });
    }

    public function down(): void
    {
        Schema::table('prestamos', function (Blueprint $table) {
            $table->dropForeign(['admin_responsable_id']);
            $table->dropColumn(['admin_responsable_id', 'fecha_cambio_estado']);
        });
    }
};
