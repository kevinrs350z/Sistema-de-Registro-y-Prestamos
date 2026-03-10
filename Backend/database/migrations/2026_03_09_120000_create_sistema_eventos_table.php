<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('sistema_eventos', function (Blueprint $table) {
            $table->id();
            $table->string('tipo'); // PRESTAMO_ACTUALIZADO, PRESTAMO_CREADO, SANCION_CREADO, etc.
            $table->unsignedBigInteger('referencia_id')->nullable(); // ID del préstamo/sanción afectado
            $table->string('referencia_tipo')->nullable(); // 'Prestamo', 'UserSancion', etc.
            $table->json('datos')->nullable(); // Datos del evento (serializado)
            $table->unsignedBigInteger('usuario_id')->nullable(); // Usuario que generó el evento
            $table->timestamps();
            
            // Índices para búsqueda y limpieza
            $table->index('tipo');
            $table->index('referencia_id');
            $table->index('created_at');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('sistema_eventos');
    }
};
