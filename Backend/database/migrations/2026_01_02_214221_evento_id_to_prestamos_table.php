<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::table('prestamos', function (Blueprint $table) {

            $table->unsignedBigInteger('evento_id')
                  ->nullable()
                  ->after('idUser');

            $table->foreign('evento_id')
                  ->references('id')
                  ->on('eventos')
                  ->nullOnDelete();
        });
    }

    public function down(): void
    {
        Schema::table('prestamos', function (Blueprint $table) {
            $table->dropForeign(['evento_id']);
            $table->dropColumn('evento_id');
        });
    }
};
