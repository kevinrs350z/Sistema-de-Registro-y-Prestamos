<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Migración para crear la tabla de relaciones entre tipos de equipo.
 * 
 * Esta tabla permite agrupar tipos de equipos que comparten el mismo límite máximo
 * de préstamo. Por ejemplo, diferentes modelos de cámaras (Sony A6400, Canon EOS, etc.)
 * pueden relacionarse para que el límite máximo se aplique al grupo completo,
 * no a cada tipo individualmente.
 */
class CreateTipoEquipoRelacionadosTable extends Migration
{
    public function up()
    {
        Schema::create('tipo_equipo_relacionados', function (Blueprint $table) {
            $table->id();

            // Tipo de equipo principal
            $table->unsignedBigInteger('tipo_equipo_id');

            // Tipo de equipo relacionado
            $table->unsignedBigInteger('relacionado_id');

            $table->timestamps();

            // Foreign keys
            $table->foreign('tipo_equipo_id')
                ->references('id')
                ->on('tipo_equipos')
                ->cascadeOnDelete();

            $table->foreign('relacionado_id')
                ->references('id')
                ->on('tipo_equipos')
                ->cascadeOnDelete();

            // Evitar duplicados y autorelaciones
            $table->unique(['tipo_equipo_id', 'relacionado_id'], 'tipo_relacion_unica');
        });
    }

    public function down()
    {
        Schema::dropIfExists('tipo_equipo_relacionados');
    }
}
