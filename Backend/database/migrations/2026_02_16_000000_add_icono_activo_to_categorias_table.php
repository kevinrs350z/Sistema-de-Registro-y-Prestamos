<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

class AddIconoActivoToCategoriasTable extends Migration
{
    /**
     * Run the migrations.
     */
    public function up()
    {
        Schema::table('categorias', function (Blueprint $table) {
            $table->string('icono')->nullable()->after('descripcion');
            $table->boolean('activo')->default(true)->after('icono');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down()
    {
        Schema::table('categorias', function (Blueprint $table) {
            $table->dropColumn(['icono', 'activo']);
        });
    }
}
