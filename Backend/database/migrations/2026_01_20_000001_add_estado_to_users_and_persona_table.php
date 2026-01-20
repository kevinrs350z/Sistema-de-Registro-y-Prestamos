<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

class AddEstadoToUsersAndPersonaTable extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::table('persona', function (Blueprint $table) {
            // Estado lógico de la persona: ACTIVO / INACTIVO
            $table->string('estado', 20)
                  ->default('ACTIVO')
                  ->after('celular');
        });

        Schema::table('users', function (Blueprint $table) {
            // Estado lógico del usuario: ACTIVO / INACTIVO
            $table->string('estado', 20)
                  ->default('ACTIVO')
                  ->after('Email'); // cambia a 'email' si tu columna es minúscula
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('persona', function (Blueprint $table) {
            $table->dropColumn('estado');
        });

        Schema::table('users', function (Blueprint $table) {
            $table->dropColumn('estado');
        });
    }
}
