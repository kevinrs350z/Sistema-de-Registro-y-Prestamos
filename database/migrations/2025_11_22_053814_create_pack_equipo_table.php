<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

class CreatePackEquipoTable extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('pack_equipo', function (Blueprint $table) {
            $table->id();

            // Relaciones
            $table->foreignId('pack_id')
                  ->constrained('packs')
                  ->cascadeOnDelete();

            $table->foreignId('equipo_id')
                  ->constrained('equipos')
                  ->cascadeOnDelete();

            $table->timestamps();

            // Evita duplicados pack-equipo
            $table->unique(['pack_id', 'equipo_id']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('pack_equipo');
    }
}
