<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

class CreateGrupoPrestamoTable extends Migration
{
    public function up()
    {
        if (Schema::hasTable('grupo_prestamo')) {
            return;
        }
        
        Schema::create('grupo_prestamo', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('grupo_id');
            $table->unsignedBigInteger('prestamo_id');
            $table->timestamps();

            $table->foreign('grupo_id')->references('id')->on('grupos')->onDelete('cascade');
            $table->foreign('prestamo_id')->references('idPrestamo')->on('prestamos')->onDelete('cascade');
            $table->unique(['grupo_id', 'prestamo_id']);
        });
    }

    public function down()
    {
        Schema::dropIfExists('grupo_prestamo');
    }
}
