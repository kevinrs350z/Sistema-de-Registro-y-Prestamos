<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::table('user_sancion', function (Blueprint $table) {
            $table->string('accion', 30)->nullable()->after('descripcion');
            $table->index(['accion', 'created_at']);
        });
    }

    public function down(): void
    {
        Schema::table('user_sancion', function (Blueprint $table) {
            $table->dropIndex(['accion', 'created_at']);
            $table->dropColumn(['accion']);
        });
    }
};