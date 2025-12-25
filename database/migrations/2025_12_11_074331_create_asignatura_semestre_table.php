<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

class CreateAsignaturaSemestreTable extends Migration
{
    /**
     * Run the migrations.
     *
     * @return void
     */
    public function up()
    {
        Schema::create('asignatura_semestre', function (Blueprint $table) {
            $table->id();
            
            $table->unsignedBigInteger('idAsignatura');
            $table->unsignedBigInteger('idSemestre');

            $table->foreign('idAsignatura')->references('idAsignatura')->on('asignaturas')->onDelete('cascade');
            $table->foreign('idSemestre')->references('idSemestre')->on('semestres')->onDelete('cascade');
        });
    }


    /**
     * Reverse the migrations.
     *
     * @return void
     */
    public function down()
    {
        Schema::dropIfExists('asignatura_semestre');
    }
}
