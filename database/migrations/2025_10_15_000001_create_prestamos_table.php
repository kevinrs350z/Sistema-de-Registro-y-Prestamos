<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::create('prestamos', function (Blueprint $table) {
            $table->id('idPrestamo');
            $table->unsignedBigInteger('idUser');
            $table->unsignedBigInteger('idEquipo');
            $table->date('fecha_inicio')->nullable();
            $table->date('fecha_fin')->nullable();
            $table->string('estado')->default('pendiente');
            $table->string('otra_motivo')->nullable();;
            $table->string('tipo')->default('externo');
            $table->string('Observacion')->nullable();

            $table->foreign('idUser')->references('idUser')->on('users');
            $table->foreign('idEquipo')->references('idEquipo')->on('equipos');
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('prestamos');
    }
};
