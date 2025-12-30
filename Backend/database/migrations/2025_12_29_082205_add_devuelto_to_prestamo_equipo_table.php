<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::table('prestamo_equipo', function (Blueprint $table) {
            $table->boolean('devuelto')
                ->default(false)
                ->after('idEquipo');
        });
    }

    public function down(): void
    {
        Schema::table('prestamo_equipo', function (Blueprint $table) {
            $table->dropColumn('devuelto');
        });
    }
};
