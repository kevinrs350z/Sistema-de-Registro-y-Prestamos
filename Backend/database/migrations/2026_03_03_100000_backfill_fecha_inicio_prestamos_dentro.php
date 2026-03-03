<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration {
    /**
     * Normalizar fecha_inicio en préstamos DENTRO.
     *
     * Los préstamos tipo DENTRO usaban solo bloques (bloque_prestamos) y no
     * guardaban fecha_inicio / fecha_fin. Esto dificulta las queries analíticas.
     *
     * Esta migración rellena fecha_inicio con DATE(created_at) para los
     * préstamos DENTRO que no lo tengan, garantizando que todos los préstamos
     * tengan fecha_inicio como referencia temporal unificada.
     */
    public function up(): void
    {
        // Rellenar fecha_inicio con la fecha de creación para DENTRO
        DB::statement("
            UPDATE prestamos
            SET fecha_inicio = DATE(created_at)
            WHERE tipo = 'DENTRO'
              AND fecha_inicio IS NULL
        ");

        // Para DENTRO, fecha_fin = fecha_inicio (mismo día, usan bloques horarios)
        DB::statement("
            UPDATE prestamos
            SET fecha_fin = fecha_inicio
            WHERE tipo = 'DENTRO'
              AND fecha_fin IS NULL
              AND fecha_inicio IS NOT NULL
        ");

        // Rellenar fecha_inicio para FUERA que por algún leak del seeder quedaron NULL
        DB::statement("
            UPDATE prestamos
            SET fecha_inicio = DATE(created_at)
            WHERE tipo = 'FUERA'
              AND fecha_inicio IS NULL
        ");

        // FUERA sin fecha_fin: asumir 3 días de préstamo
        DB::statement("
            UPDATE prestamos
            SET fecha_fin = DATE_ADD(fecha_inicio, INTERVAL 3 DAY)
            WHERE tipo = 'FUERA'
              AND fecha_fin IS NULL
              AND fecha_inicio IS NOT NULL
        ");
    }

    public function down(): void
    {
        // Revertir: dejar NULL las fechas de DENTRO que fueron rellenadas
        // No se puede saber con certeza cuáles eran originalmente NULL,
        // pero los originales del PrestamoSeeder sí eran NULL.
        // No revertimos para evitar pérdida de datos.
    }
};
