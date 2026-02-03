<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

class CreateEquipoHistorialsTable extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('equipo_historials', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('equipo_id');
            $table->unsignedBigInteger('admin_id');
            $table->string('accion');
            $table->json('detalle')->nullable();
            $table->timestamps();

            $table->foreign('equipo_id')
                  ->references('id')
                  ->on('equipos')
                  ->onDelete('restrict');

            $table->foreign('admin_id')
                  ->references('idUser')
                  ->on('users')
                  ->onDelete('restrict');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('equipo_historials');
    }
}
