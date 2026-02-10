<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('bloqueos_horario', function (Blueprint $table) {
            $table->id();
            $table->unsignedTinyInteger('dia_semana');
            $table->unsignedBigInteger('idBloque');
            $table->unsignedBigInteger('idTipoEquipo');
            $table->boolean('activo')->default(true);
            $table->text('motivo')->nullable();
            $table->unsignedBigInteger('creado_por')->nullable();
            $table->timestamps();

            $table->unique(['dia_semana', 'idBloque', 'idTipoEquipo']);
            $table->foreign('idBloque')->references('idBloque')->on('bloques')->onDelete('cascade');
            $table->foreign('idTipoEquipo')->references('id')->on('tipo_equipos')->onDelete('cascade');
            $table->foreign('creado_por')->references('idUser')->on('users')->nullOnDelete();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('bloqueos_horario');
    }
};
