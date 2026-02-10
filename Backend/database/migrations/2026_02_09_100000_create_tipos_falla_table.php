<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Migración para crear la tabla catálogo de tipos de falla.
 * 
 * Esta tabla almacena el catálogo de fallas posibles que pueden
 * afectar a los equipos del inventario. Las fallas están categorizadas
 * por tipo de equipo (cámaras, audio, IT, mecánicos, energía, administrativos).
 */
class CreateTiposFallaTable extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('tipos_falla', function (Blueprint $table) {
            $table->id();
            
            // Código único de la falla (ej: CAM_LENTE, IT_BATERIA)
            $table->string('codigo', 50)->unique();
            
            // Nombre descriptivo de la falla
            $table->string('nombre', 150);
            
            // Descripción detallada del tipo de falla
            $table->text('descripcion')->nullable();
            
            // Categoría del tipo de equipo afectado
            // CAM = Cámaras/Video, AUD = Audio, IT = Computación
            // MECH = Mecánicos, PWR = Energía, USR/INV = Administrativos
            $table->string('categoria', 10);
            
            // Si el tipo de falla está activo en el sistema
            $table->boolean('activo')->default(true);
            
            $table->timestamps();

            // Índice para búsquedas por categoría
            $table->index('categoria');
            $table->index('activo');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('tipos_falla');
    }
}
