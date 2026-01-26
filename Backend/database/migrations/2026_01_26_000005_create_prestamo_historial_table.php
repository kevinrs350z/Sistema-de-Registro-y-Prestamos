<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::create('prestamo_historial', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('idPrestamo');
            $table->unsignedBigInteger('idUser');
            $table->string('estado_anterior', 50);
            $table->string('estado_nuevo', 50);
            $table->string('descripcion', 255)->nullable();
            $table->timestamps();

            $table->foreign('idPrestamo')
                ->references('idPrestamo')
                ->on('prestamos')
                ->onDelete('cascade');

            $table->foreign('idUser')
                ->references('idUser')
                ->on('users')
                ->onDelete('restrict');

            $table->index(['idPrestamo', 'created_at']);
            $table->index(['idUser', 'created_at']);
            $table->index(['estado_nuevo']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('prestamo_historial');
    }
};
