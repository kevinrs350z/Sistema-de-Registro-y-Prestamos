<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('tipo_equipos', function (Blueprint $table) {
            $table->unsignedInteger('maximo_prestamo')
                ->default(1)
                ->after('descripcion');
        });
    }

    public function down(): void
    {
        Schema::table('tipo_equipos', function (Blueprint $table) {
            $table->dropColumn('maximo_prestamo');
        });
    }
};
