<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::table('observaciones', function (Blueprint $table) {
            // Admin que registra esta observación/cambio
            $table->unsignedBigInteger('idUser')->nullable()->after('idPrestamo');
            
            // Tipo de evento (APROBACION, RECHAZO, ENTREGA, DEVOLUCION, etc)
            $table->string('tipo')->nullable()->after('descripcion');
            
            // Timestamps para auditoría
            $table->timestamps();
            
            // Foreign key
            $table->foreign('idUser')
                ->references('idUser')
                ->on('users')
                ->onDelete('set null');
            
            // Índices para búsqueda rápida
            $table->index(['idPrestamo', 'tipo']);
            $table->index(['idUser', 'created_at']);
        });
    }

    public function down(): void
    {
        Schema::table('observaciones', function (Blueprint $table) {
            $table->dropForeign(['idUser']);
            $table->dropColumn(['idUser', 'tipo', 'created_at', 'updated_at']);
        });
    }
};
