<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Agrega campos requeridos para la gestión administrativa de grupos:
 * - descripcion: texto opcional
 * - estado: ACTIVO/CERRADO
 * - anio/semestre: periodo académico
 */
class AddAdminFieldsToGruposTable extends Migration
{
    public function up()
    {
        Schema::table('grupos', function (Blueprint $table) {
            $table->text('descripcion')->nullable()->after('nombre');
            $table->string('estado', 20)->default('ACTIVO')->after('docente_id');
            $table->year('anio')->nullable()->after('estado');
            $table->tinyInteger('semestre')->unsigned()->nullable()->after('anio');
        });
    }

    public function down()
    {
        Schema::table('grupos', function (Blueprint $table) {
            $table->dropColumn(['descripcion', 'estado', 'anio', 'semestre']);
        });
    }
}
