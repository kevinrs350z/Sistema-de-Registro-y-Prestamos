<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

class CreateGruposTable extends Migration
{
    public function up()
    {
        Schema::create('grupos', function (Blueprint $table) {
            $table->id();
            $table->string('nombre');
            $table->unsignedBigInteger('asignatura_id')->nullable();
            $table->unsignedBigInteger('docente_id')->nullable();
            $table->timestamps();

            $table->foreign('asignatura_id')->references('id')->on('asignaturas')->nullOnDelete();
            $table->foreign('docente_id')->references('idUser')->on('users')->nullOnDelete();
        });
    }

    public function down()
    {
        Schema::dropIfExists('grupos');
    }
}
