<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;
use Carbon\Carbon;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('bloqueos_horario', function (Blueprint $table) {
            $table->date('semana_inicio')->nullable()->after('idTipoEquipo');
        });

        $weekStart = Carbon::now()->startOfWeek(Carbon::MONDAY)->toDateString();
        DB::table('bloqueos_horario')->update(['semana_inicio' => $weekStart]);

        Schema::table('bloqueos_horario', function (Blueprint $table) {
            $table->dropUnique('bloqueos_horario_dia_semana_idbloque_idtipoequipo_unique');
            $table->unique(['semana_inicio', 'dia_semana', 'idBloque', 'idTipoEquipo'], 'bloqueos_horario_semana_dia_bloque_tipo_unique');
        });
    }

    public function down(): void
    {
        Schema::table('bloqueos_horario', function (Blueprint $table) {
            $table->dropUnique('bloqueos_horario_semana_dia_bloque_tipo_unique');
        });

        Schema::table('bloqueos_horario', function (Blueprint $table) {
            $table->dropColumn('semana_inicio');
            $table->unique(['dia_semana', 'idBloque', 'idTipoEquipo']);
        });
    }
};
