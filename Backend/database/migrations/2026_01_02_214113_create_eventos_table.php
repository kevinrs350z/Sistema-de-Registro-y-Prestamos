<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::create('eventos', function (Blueprint $table) {
            $table->id();

            // Nombre del evento
            $table->string('nombre_evento');

            // Rango de fechas del evento
            $table->date('fecha_inicio');
            $table->date('fecha_fin');

            // Responsable
            $table->unsignedBigInteger('responsable_id')->nullable();
            $table->string('responsable_nombre')->nullable();

            // Descripción opcional
            $table->text('descripcion')->nullable();

            $table->timestamps();

            // FK opcional a users
            $table->foreign('responsable_id')
                  ->references('idUser') 
                  ->on('users')
                  ->nullOnDelete();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('eventos');
    }
};
