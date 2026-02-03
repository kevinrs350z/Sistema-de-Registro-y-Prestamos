<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Agrega bloque_id a la tabla grupos para relacionar con bloques horarios.
 */
class AddBloqueIdToGruposTable extends Migration
{
    public function up()
    {
        Schema::table('grupos', function (Blueprint $table) {
            $table->unsignedBigInteger('bloque_id')->nullable()->after('asignatura_id');
            $table->foreign('bloque_id')->references('idBloque')->on('bloques')->nullOnDelete();
        });
    }

    public function down()
    {
        Schema::table('grupos', function (Blueprint $table) {
            $table->dropForeign(['bloque_id']);
            $table->dropColumn('bloque_id');
        });
    }
}
