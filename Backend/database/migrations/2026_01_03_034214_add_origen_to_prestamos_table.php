<?php
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::table('prestamos', function (Blueprint $table) {
            $table->enum('origen', ['ALUMNO', 'ADMIN'])
                  ->default('ALUMNO')
                  ->after('tipo');
        });
    }

    public function down(): void
    {
        Schema::table('prestamos', function (Blueprint $table) {
            $table->dropColumn('origen');
        });
    }
};
