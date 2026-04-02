<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\TipoEquipo;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Str;

class TipoEquipoImagenSeeder extends Seeder
{
    /**
     * Asigna imágenes reales a los tipos de equipo.
     * Las imágenes se descargan de URLs públicas y se guardan en storage.
     */
    public function run(): void
    {
        // Mapeo de tipos de equipo con URLs de imágenes reales
        // Usando imágenes de Unsplash y otras fuentes libres
        $imagenes = [
            // ========== CÁMARAS ==========
            'Cámara Canon T3i' => 'https://images.unsplash.com/photo-1516035069371-29a1b244cc32?w=400&q=80',
            'Cámara Canon T5i' => 'https://images.unsplash.com/photo-1502920917128-1aa500764cbd?w=400&q=80',
            'Cámara Canon SL3' => 'https://images.unsplash.com/photo-1510127034890-ba27508e9f1c?w=400&q=80',
            'Canon XA60' => 'https://images.unsplash.com/photo-1585363239219-92c30e0e14bb?w=400&q=80',
            
            // ========== TRÍPODES ==========
            'Trípode Manfrotto' => 'https://images.unsplash.com/photo-1617802690992-15d93263d3a9?w=400&q=80',
            'Trípode de luces' => 'https://images.unsplash.com/photo-1598387993441-a364f854c3e1?w=400&q=80',
            'Trípode de video' => 'https://images.unsplash.com/photo-1617802690992-15d93263d3a9?w=400&q=80',
            
            // ========== ILUMINACIÓN ==========
            'Flash de estudio' => 'https://images.unsplash.com/photo-1542601906990-b4d3fb778b09?w=400&q=80',
            'Softbox' => 'https://images.unsplash.com/photo-1598387993441-a364f854c3e1?w=400&q=80',
            'Reflector' => 'https://images.unsplash.com/photo-1574717025058-2f8737d2e2b7?w=400&q=80',
            'Luz LED' => 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=400&q=80',
            
            // ========== FONDOS ==========
            'Telón de fondo' => 'https://images.unsplash.com/photo-1598387993441-a364f854c3e1?w=400&q=80',
            
            // ========== LENTES ==========
            'Lente Canon' => 'https://images.unsplash.com/photo-1617005082133-548c4dd27f35?w=400&q=80',
            
            // ========== MICRÓFONOS ==========
            'Micrófono Lavalier RODE' => 'https://images.unsplash.com/photo-1590602847861-f357a9332bbc?w=400&q=80',
            'Micrófono Shotgun RODE' => 'https://images.unsplash.com/photo-1598653222000-6b7b7a552625?w=400&q=80',
            'Micrófono Shure' => 'https://images.unsplash.com/photo-1478737270239-2f02b77fc618?w=400&q=80',
            'Micrófono Rode' => 'https://images.unsplash.com/photo-1590602847861-f357a9332bbc?w=400&q=80',
            'Blimp Rode' => 'https://images.unsplash.com/photo-1598653222000-6b7b7a552625?w=400&q=80',
            
            // ========== ESTABILIZADORES Y CÁMARAS ESPECIALES ==========
            'Estabilizador FeiyuTech Mini 2' => 'https://images.unsplash.com/photo-1583001931096-959e9a1a6223?w=400&q=80',
            'DJI Osmo Pocket 3' => 'https://images.unsplash.com/photo-1583001931096-959e9a1a6223?w=400&q=80',
            'Insta360 ONE RS' => 'https://images.unsplash.com/photo-1583001931096-959e9a1a6223?w=400&q=80',
            'Insta360 ONE RS Twin' => 'https://images.unsplash.com/photo-1583001931096-959e9a1a6223?w=400&q=80',
            'Vaddio Robótica' => 'https://images.unsplash.com/photo-1585363239219-92c30e0e14bb?w=400&q=80',
            'Hollyland' => 'https://images.unsplash.com/photo-1598653222000-6b7b7a552625?w=400&q=80',
            
            // ========== COMPUTADORAS ==========
            'iMac 21.5"' => 'https://images.unsplash.com/photo-1527443224154-c4a3942d3acf?w=400&q=80',
            'Notebook HP ZBook 15v' => 'https://images.unsplash.com/photo-1496181133206-80ce9b88a853?w=400&q=80',
            
            // ========== ALMACENAMIENTO Y ACCESORIOS ==========
            'Disco Duro Externo' => 'https://images.unsplash.com/photo-1531492746076-161ca9bcad58?w=400&q=80',
            'USB-C Hub' => 'https://images.unsplash.com/photo-1625723044792-44de16ccb4e9?w=400&q=80',
        ];

        $this->command->info('Descargando e asignando imágenes a tipos de equipo...');

        foreach ($imagenes as $nombreTipo => $url) {
            $tipo = TipoEquipo::where('nombre', $nombreTipo)->first();
            
            if (!$tipo) {
                $this->command->warn("Tipo de equipo no encontrado: {$nombreTipo}");
                continue;
            }

            try {
                // Descargar imagen
                $response = Http::timeout(30)->get($url);
                
                if ($response->successful()) {
                    // Generar nombre único
                    $extension = 'jpg';
                    $filename = 'tipo_equipos/' . Str::random(40) . '.' . $extension;
                    
                    // Guardar en storage
                    Storage::disk('public')->put($filename, $response->body());
                    
                    // Actualizar tipo de equipo
                    $tipo->imagen = $filename;
                    $tipo->save();
                    
                    $this->command->info("✓ {$nombreTipo}: imagen guardada");
                } else {
                    $this->command->error("✗ {$nombreTipo}: error descargando imagen (HTTP {$response->status()})");
                }
            } catch (\Exception $e) {
                $this->command->error("✗ {$nombreTipo}: {$e->getMessage()}");
            }
        }

        $this->command->info('Proceso completado.');
    }
}
