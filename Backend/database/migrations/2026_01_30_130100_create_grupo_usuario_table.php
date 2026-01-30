<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

class CreateGrupoUsuarioTable extends Migration
{
    public function up()
    {
        Schema::create('grupo_usuario', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('grupo_id');
            $table->unsignedBigInteger('usuario_id');
            $table->timestamps();

            $table->foreign('grupo_id')->references('id')->on('grupos')->onDelete('cascade');
            $table->foreign('usuario_id')->references('idUser')->on('users')->onDelete('cascade');
            $table->unique(['grupo_id', 'usuario_id']);
        });
    }

    public function down()
    {
        Schema::dropIfExists('grupo_usuario');
    }
}
