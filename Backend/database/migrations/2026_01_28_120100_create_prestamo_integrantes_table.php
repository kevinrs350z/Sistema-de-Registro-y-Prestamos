<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('prestamo_integrantes', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('idPrestamo');
            $table->unsignedBigInteger('idUser');
            $table->timestamps();

            $table->foreign('idPrestamo')
                ->references('idPrestamo')
                ->on('prestamos')
                ->onDelete('cascade');

            $table->foreign('idUser')
                ->references('idUser')
                ->on('users')
                ->onDelete('cascade');

            $table->unique(['idPrestamo', 'idUser']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('prestamo_integrantes');
    }
};
