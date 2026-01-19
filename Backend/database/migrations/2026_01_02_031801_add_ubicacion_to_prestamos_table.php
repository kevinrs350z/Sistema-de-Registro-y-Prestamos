<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::table('prestamos', function (Blueprint $table) {
            $table->string('ubicacion', 255)
                  ->nullable()
                  ->after('observacion');
        });
    }

    public function down(): void
    {
        Schema::table('prestamos', function (Blueprint $table) {
            $table->dropColumn('ubicacion');
        });
    }
};
