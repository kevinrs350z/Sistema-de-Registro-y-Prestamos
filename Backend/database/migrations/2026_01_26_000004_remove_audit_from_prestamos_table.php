<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::table('prestamos', function (Blueprint $table) {
            // Remover campos que no necesitamos (el historial está en observaciones)
            $table->dropForeign(['admin_responsable_id']);
            $table->dropColumn(['admin_responsable_id', 'fecha_cambio_estado']);
        });
    }

    public function down(): void
    {
        Schema::table('prestamos', function (Blueprint $table) {
            $table->unsignedBigInteger('admin_responsable_id')->nullable()->after('estado');
            $table->dateTime('fecha_cambio_estado')->nullable()->after('admin_responsable_id');
            
            $table->foreign('admin_responsable_id')
                ->references('idUser')
                ->on('users')
                ->onDelete('set null');
        });
    }
};
