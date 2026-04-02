<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

class ActualizarImagenesTipoEquipoSeeder extends Seeder
{
    /**
     * Actualiza las imágenes de tipo_equipos con los archivos hash existentes en storage.
     * 
     * Imágenes disponibles en storage/app/public/tipo_equipos/:
     * - 8kW5tQwgLkrEgijkdQXnWrXmAywJrnKyzl5gsEOE.jpg
     * - g1BF0UEszRd4O7cKGDK2yjMT3pK4NkW3MwEZUaH2.png
     * - hY2u8wSLnkRnOHbAWnPCh2VS3Dx56gNQ46qmeafY.jpg
     * - Otr1UWyP3VX58Tn4NFauq0ng2evPUK9N44xSguW9.jpg
     * - SpaOITS6fNdhnFPU9QAxW50Swn4o4jqajOyLO5y8.jpg
     * - wiBlmhPLCWqr14GZIS7D8M4fZWEHc1kZrKNLFR3F.png
     */
    public function run(): void
    {
        // Mapeo de imágenes hash disponibles por categoría/tipo
        $imagenes = [
            'tipo_equipos/8kW5tQwgLkrEgijkdQXnWrXmAywJrnKyzl5gsEOE.jpg',  // Imagen 1
            'tipo_equipos/g1BF0UEszRd4O7cKGDK2yjMT3pK4NkW3MwEZUaH2.png',  // Imagen 2
            'tipo_equipos/hY2u8wSLnkRnOHbAWnPCh2VS3Dx56gNQ46qmeafY.jpg',  // Imagen 3
            'tipo_equipos/Otr1UWyP3VX58Tn4NFauq0ng2evPUK9N44xSguW9.jpg',  // Imagen 4
            'tipo_equipos/SpaOITS6fNdhnFPU9QAxW50Swn4o4jqajOyLO5y8.jpg',  // Imagen 5
            'tipo_equipos/wiBlmhPLCWqr14GZIS7D8M4fZWEHc1kZrKNLFR3F.png',  // Imagen 6
        ];

        // Obtener todos los tipos de equipo
        $tipos = DB::table('tipo_equipos')->get();

        foreach ($tipos as $index => $tipo) {
            // Asignar imagen de forma cíclica (si hay más tipos que imágenes)
            $imagenIndex = $index % count($imagenes);
            
            DB::table('tipo_equipos')
                ->where('id', $tipo->id)
                ->update(['imagen' => $imagenes[$imagenIndex]]);
        }

        $this->command->info('✅ Imágenes de tipo_equipos actualizadas con archivos hash existentes.');
        $this->command->info('   Total tipos actualizados: ' . $tipos->count());
    }
}
