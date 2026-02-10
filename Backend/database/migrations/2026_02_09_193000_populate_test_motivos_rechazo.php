<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;
use App\Enums\MotivoRechazo;

/**
 * Seeder para generar datos de prueba de rechazos con motivos.
 * Actualiza algunos rechazos existentes para que tengan motivos variados.
 */
return new class extends Migration {
    public function up(): void
    {
        // Obtener algunos préstamos rechazados
        $rechazados = DB::table('prestamos')
            ->where('estado', 'RECHAZADO')
            ->limit(10)
            ->get();

        if ($rechazados->isEmpty()) {
            echo "No hay préstamos rechazados para actualizar.\n";
            return;
        }

        $motivos = [
            MotivoRechazo::SIN_STOCK,
            MotivoRechazo::CONFLICTO_HORARIO,
            MotivoRechazo::SANCION_USUARIO,
            MotivoRechazo::DOCUMENTACION,
            MotivoRechazo::LIMITE_PRESTAMOS,
            MotivoRechazo::OTRO,
        ];

        foreach ($rechazados as $index => $prestamo) {
            // Asignar motivo rotativo
            $motivo = $motivos[$index % count($motivos)];
            
            DB::table('prestamos')
                ->where('idPrestamo', $prestamo->idPrestamo)
                ->update(['motivo_rechazo' => $motivo]);
            
            echo "Préstamo {$prestamo->idPrestamo} actualizado con motivo: {$motivo}\n";
        }

        echo "✅ Se actualizaron " . $rechazados->count() . " rechazos con motivos variados.\n";
    }

    public function down(): void
    {
        DB::table('prestamos')
            ->where('estado', 'RECHAZADO')
            ->update(['motivo_rechazo' => null]);
    }
};
