<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\TipoEquipo;

class TipoEquiposSeeder extends Seeder
{
    /**
     * Imágenes hash disponibles en storage/app/public/tipo_equipos/
     * Se asignan cíclicamente a los tipos de equipo
     */
    private array $imagenesDisponibles = [
        'tipo_equipos/8kW5tQwgLkrEgijkdQXnWrXmAywJrnKyzl5gsEOE.jpg',
        'tipo_equipos/g1BF0UEszRd4O7cKGDK2yjMT3pK4NkW3MwEZUaH2.png',
        'tipo_equipos/hY2u8wSLnkRnOHbAWnPCh2VS3Dx56gNQ46qmeafY.jpg',
        'tipo_equipos/Otr1UWyP3VX58Tn4NFauq0ng2evPUK9N44xSguW9.jpg',
        'tipo_equipos/SpaOITS6fNdhnFPU9QAxW50Swn4o4jqajOyLO5y8.jpg',
        'tipo_equipos/wiBlmhPLCWqr14GZIS7D8M4fZWEHc1kZrKNLFR3F.png',
    ];

    public function run(): void
    {
        $tipos = [

            // ================= AUDIOVISUAL =================
            [
                'categoria_id' => 2,
                'nombre'       => 'Cámara de video Canon XA35',
                'marca'        => 'Canon',
                'modelo'       => 'XA35',
                'descripcion'  => 'Videocámara profesional Full HD',
            ],
            [
                'categoria_id' => 2,
                'nombre'       => 'Cámara de video Canon XA60',
                'marca'        => 'Canon',
                'modelo'       => 'XA60',
                'descripcion'  => 'Videocámara profesional 4K UHD',
            ],
            [
                'categoria_id' => 2,
                'nombre'       => 'Cámara de video Canon XA75',
                'marca'        => 'Canon',
                'modelo'       => 'XA75',
                'descripcion'  => 'Videocámara profesional 4K UHD con SDI',
            ],
            [
                'categoria_id' => 2,
                'nombre'       => 'DJI Osmo Pocket 3',
                'marca'        => 'DJI',
                'modelo'       => 'Osmo Pocket 3',
                'descripcion'  => 'Cámara de bolsillo con gimbal estabilizador 4K',
            ],
            [
                'categoria_id' => 2,
                'nombre'       => 'Insta360 One RS Twin Edition',
                'marca'        => 'Insta360',
                'modelo'       => 'One RS Twin Edition',
                'descripcion'  => 'Cámara de acción modular 4K/360°',
            ],
            [
                'categoria_id' => 2,
                'nombre'       => 'Trípode de video Miliboo',
                'marca'        => 'Miliboo',
                'modelo'       => 'Video',
                'descripcion'  => 'Trípode profesional para video',
            ],
            [
                'categoria_id' => 2,
                'nombre'       => 'Trípode de video Manfrotto',
                'marca'        => 'Manfrotto',
                'modelo'       => 'Video',
                'descripcion'  => 'Trípode profesional para video',
            ],
            [
                'categoria_id' => 2,
                'nombre'       => 'Estabilizador FeiyuTech Mini 2',
                'marca'        => 'FeiyuTech',
                'modelo'       => 'Mini 2',
                'descripcion'  => 'Gimbal estabilizador para smartphones',
            ],
            [
                'categoria_id' => 2,
                'nombre'       => 'Estabilizador Zhiyun Weebill 3S',
                'marca'        => 'Zhiyun',
                'modelo'       => 'Weebill 3S',
                'descripcion'  => 'Gimbal estabilizador profesional para cámaras DSLR/Mirrorless',
            ],
            [
                'categoria_id' => 2,
                'nombre'       => 'Micrófono Shotgun RODE',
                'marca'        => 'RODE',
                'modelo'       => 'Shotgun',
                'descripcion'  => 'Micrófono direccional tipo cañón para video',
            ],
            [
                'categoria_id' => 2,
                'nombre'       => 'Blimp RODE',
                'marca'        => 'RODE',
                'modelo'       => 'Blimp',
                'descripcion'  => 'Sistema de suspensión y protección contra viento para micrófonos',
            ],

            // ================= FOTOGRAFÍA =================
            [
                'categoria_id' => 1,
                'nombre'       => 'Cámara fotográfica Canon Rebel T3',
                'marca'        => 'Canon',
                'modelo'       => 'Rebel T3',
                'descripcion'  => 'Cámara DSLR con batería y tarjeta SD',
            ],
            [
                'categoria_id' => 1,
                'nombre'       => 'Cámara fotográfica Canon Rebel T5i',
                'marca'        => 'Canon',
                'modelo'       => 'Rebel T5i',
                'descripcion'  => 'Cámara DSLR con batería y tarjeta SD, pantalla articulada',
            ],
            [
                'categoria_id' => 1,
                'nombre'       => 'Cámara fotográfica Canon Rebel SL3',
                'marca'        => 'Canon',
                'modelo'       => 'Rebel SL3',
                'descripcion'  => 'Cámara DSLR compacta con batería y tarjeta SD, pantalla táctil articulada',
            ],
            [
                'categoria_id' => 1,
                'nombre'       => 'Lente fotográfico Canon 50mm',
                'marca'        => 'Canon',
                'modelo'       => '50mm f/1.8',
                'descripcion'  => 'Lente fijo 50mm para retratos',
            ],
            [
                'categoria_id' => 1,
                'nombre'       => 'Lente fotográfico Canon 18-135mm',
                'marca'        => 'Canon',
                'modelo'       => '18-135mm',
                'descripcion'  => 'Lente zoom versátil 18-135mm',
            ],

            // ================= ILUMINACIÓN =================
            [
                'categoria_id' => 1,
                'nombre'       => 'Luz LED Visico Full Color 80R II',
                'marca'        => 'Visico',
                'modelo'       => 'Full Color 80R II',
                'descripcion'  => 'Luz LED con baterías, cargador, cable de corriente y atril',
            ],
            [
                'categoria_id' => 1,
                'nombre'       => 'Luz LED Visico FT650R',
                'marca'        => 'Visico',
                'modelo'       => 'FT650R',
                'descripcion'  => 'Panel LED RGB con baterías, cargador, cable de corriente y atril',
            ],
            [
                'categoria_id' => 1,
                'nombre'       => 'Luz LED GODOX 500 LRC',
                'marca'        => 'GODOX',
                'modelo'       => '500 LRC',
                'descripcion'  => 'Panel LED con baterías, cargador, cable de corriente y atril',
            ],

            // ================= COMPUTACIONAL =================
            [
                'categoria_id' => 3,
                'nombre'       => 'Tableta Digitalizadora WACOM Intuos Draw',
                'marca'        => 'WACOM',
                'modelo'       => 'Intuos Draw',
                'descripcion'  => 'Tableta digitalizadora con cable USB y lápiz digital',
            ],
            [
                'categoria_id' => 3,
                'nombre'       => 'Notebook HP ZBook 15v',
                'marca'        => 'Hewlett Packard',
                'modelo'       => 'ZBook 15v',
                'descripcion'  => 'Notebook Intel Core i7-8750H, 32GB RAM, SSD 256GB + HDD 1TB, Windows 10 Pro, pantalla 15.6"',
            ],
        ];

        foreach ($tipos as $index => $tipo) {
            // Asignar imagen cíclicamente
            $tipo['imagen'] = $this->imagenesDisponibles[$index % count($this->imagenesDisponibles)];
            
            TipoEquipo::firstOrCreate(
                [
                    'categoria_id' => $tipo['categoria_id'],
                    'nombre'       => $tipo['nombre'],
                ],
                $tipo
            );
        }
    }
}
