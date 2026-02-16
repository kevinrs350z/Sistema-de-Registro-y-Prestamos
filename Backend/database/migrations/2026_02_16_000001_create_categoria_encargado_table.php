<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

class CreateCategoriaEncargadoTable extends Migration
{
    /**
     * Run the migrations.
     */
    public function up()
    {
        Schema::create('categoria_encargado', function (Blueprint $table) {
            $table->unsignedBigInteger('categoria_id');
            $table->unsignedBigInteger('user_id');
            $table->timestamps();

            $table->primary(['categoria_id', 'user_id']);

            $table->foreign('categoria_id')
                ->references('id')
                ->on('categorias')
                ->onDelete('cascade');

            $table->foreign('user_id')
                ->references('idUser')
                ->on('users')
                ->onDelete('cascade');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down()
    {
        Schema::dropIfExists('categoria_encargado');
    }
}
