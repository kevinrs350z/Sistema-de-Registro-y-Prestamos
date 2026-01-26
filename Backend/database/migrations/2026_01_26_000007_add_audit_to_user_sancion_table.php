<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::table('user_sancion', function (Blueprint $table) {
            $table->unsignedBigInteger('assigned_by')->nullable()->after('idSancion');
            $table->unsignedBigInteger('prestamo_id')->nullable()->after('assigned_by');
            $table->text('descripcion')->nullable()->after('prestamo_id');

            $table->foreign('assigned_by')
                ->references('idUser')
                ->on('users')
                ->onDelete('set null');

            $table->foreign('prestamo_id')
                ->references('idPrestamo')
                ->on('prestamos')
                ->onDelete('set null');

            $table->index(['assigned_by', 'created_at']);
            $table->index(['prestamo_id', 'created_at']);
        });
    }

    public function down(): void
    {
        Schema::table('user_sancion', function (Blueprint $table) {
            $table->dropForeign(['assigned_by']);
            $table->dropForeign(['prestamo_id']);
            $table->dropColumn(['assigned_by', 'prestamo_id', 'descripcion']);
        });
    }
};