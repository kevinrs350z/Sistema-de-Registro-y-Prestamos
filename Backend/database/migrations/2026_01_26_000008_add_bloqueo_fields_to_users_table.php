<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->boolean('bloqueado')->default(false)->after('estado');
            $table->text('bloqueado_motivo')->nullable()->after('bloqueado');
            $table->dateTime('bloqueado_fecha')->nullable()->after('bloqueado_motivo');
            $table->unsignedBigInteger('bloqueado_por')->nullable()->after('bloqueado_fecha');

            $table->foreign('bloqueado_por')
                ->references('idUser')
                ->on('users')
                ->onDelete('set null');
        });
    }

    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->dropForeign(['bloqueado_por']);
            $table->dropColumn(['bloqueado', 'bloqueado_motivo', 'bloqueado_fecha', 'bloqueado_por']);
        });
    }
};