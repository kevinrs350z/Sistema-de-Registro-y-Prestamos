<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('configuraciones', function (Blueprint $table) {
            $table->id();
            $table->string('clave')->unique();
            $table->text('valor')->nullable();
            $table->string('descripcion')->nullable();
            $table->string('grupo')->default('general');
            $table->timestamps();
        });

        // Insertar configuraciones por defecto
        DB::table('configuraciones')->insert([
            [
                'clave' => 'inventario_email',
                'valor' => null,
                'descripcion' => 'Email del area de Inventario para notificaciones de prestamos externos (FUERA de la UTA)',
                'grupo' => 'emails',
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'clave' => 'prestamo_fallback_email',
                'valor' => null,
                'descripcion' => 'Email de respaldo cuando no hay encargados asignados a las categorias',
                'grupo' => 'emails',
                'created_at' => now(),
                'updated_at' => now(),
            ],
        ]);
    }

    public function down(): void
    {
        Schema::dropIfExists('configuraciones');
    }
};
