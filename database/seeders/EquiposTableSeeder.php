<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Carbon\Carbon;

class EquiposTableSeeder extends Seeder
{
    public function run(): void
    {
        $now = Carbon::now();

    DB::table('equipos')->insert([
        // --- Fotografía ---
        [ 'nombre' => 'Cámara Canon EOS 90D', 'codigo' => 'CAM-001', 'categoria' => 'Fotografía', 'estado' => 'disponible', 'created_at' => $now, 'updated_at' => $now ],
        [ 'nombre' => 'Cámara Nikon D750', 'codigo' => 'CAM-002', 'categoria' => 'Fotografía', 'estado' => 'disponible', 'created_at' => $now, 'updated_at' => $now ],
        [ 'nombre' => 'Cámara Sony A6400', 'codigo' => 'CAM-003', 'categoria' => 'Fotografía', 'estado' => 'disponible', 'created_at' => $now, 'updated_at' => $now ],
        [ 'nombre' => 'Cámara Fujifilm X-T30', 'codigo' => 'CAM-004', 'categoria' => 'Fotografía', 'estado' => 'disponible', 'created_at' => $now, 'updated_at' => $now ],
        [ 'nombre' => 'Trípode Manfrotto MT190XPRO', 'codigo' => 'CAM-005', 'categoria' => 'Fotografía', 'estado' => 'disponible', 'created_at' => $now, 'updated_at' => $now ],
        [ 'nombre' => 'Lente Canon 50mm f/1.8', 'codigo' => 'CAM-006', 'categoria' => 'Fotografía', 'estado' => 'disponible', 'created_at' => $now, 'updated_at' => $now ],
        [ 'nombre' => 'Flash Godox V860II', 'codigo' => 'CAM-007', 'categoria' => 'Fotografía', 'estado' => 'disponible', 'created_at' => $now, 'updated_at' => $now ],
        [ 'nombre' => 'Softbox 60x90 Neewer', 'codigo' => 'CAM-008', 'categoria' => 'Fotografía', 'estado' => 'disponible', 'created_at' => $now, 'updated_at' => $now ],
        [ 'nombre' => 'Cámara GoPro Hero 9', 'codigo' => 'CAM-009', 'categoria' => 'Fotografía', 'estado' => 'disponible', 'created_at' => $now, 'updated_at' => $now ],
        [ 'nombre' => 'Estabilizador DJI Ronin SC', 'codigo' => 'CAM-010', 'categoria' => 'Fotografía', 'estado' => 'disponible', 'created_at' => $now, 'updated_at' => $now ],

        // --- Audio ---
        [ 'nombre' => 'Micrófono Rode NT1-A', 'codigo' => 'MIC-001', 'categoria' => 'Audio', 'estado' => 'disponible', 'created_at' => $now, 'updated_at' => $now ],
        [ 'nombre' => 'Micrófono Shure SM58', 'codigo' => 'MIC-002', 'categoria' => 'Audio', 'estado' => 'disponible', 'created_at' => $now, 'updated_at' => $now ],
        [ 'nombre' => 'Audífonos Audio-Technica ATH-M50x', 'codigo' => 'MIC-003', 'categoria' => 'Audio', 'estado' => 'disponible', 'created_at' => $now, 'updated_at' => $now ],
        [ 'nombre' => 'Interfaz Focusrite Scarlett 2i2', 'codigo' => 'MIC-004', 'categoria' => 'Audio', 'estado' => 'disponible', 'created_at' => $now, 'updated_at' => $now ],
        [ 'nombre' => 'Consola Yamaha MG10XU', 'codigo' => 'MIC-005', 'categoria' => 'Audio', 'estado' => 'disponible', 'created_at' => $now, 'updated_at' => $now ],
        [ 'nombre' => 'Micrófono Blue Yeti USB', 'codigo' => 'MIC-006', 'categoria' => 'Audio', 'estado' => 'disponible', 'created_at' => $now, 'updated_at' => $now ],
        [ 'nombre' => 'Kit de grabación Zoom H6', 'codigo' => 'MIC-007', 'categoria' => 'Audio', 'estado' => 'disponible', 'created_at' => $now, 'updated_at' => $now ],
        [ 'nombre' => 'Parlantes KRK Rokit 5', 'codigo' => 'MIC-008', 'categoria' => 'Audio', 'estado' => 'disponible', 'created_at' => $now, 'updated_at' => $now ],
        [ 'nombre' => 'Micrófono Lavalier Boya BY-M1', 'codigo' => 'MIC-009', 'categoria' => 'Audio', 'estado' => 'disponible', 'created_at' => $now, 'updated_at' => $now ],
        [ 'nombre' => 'Grabadora Tascam DR-40X', 'codigo' => 'MIC-010', 'categoria' => 'Audio', 'estado' => 'disponible', 'created_at' => $now, 'updated_at' => $now ],

        // --- Diseño ---
        [ 'nombre' => 'Tablet Wacom Intuos Pro', 'codigo' => 'DES-001', 'categoria' => 'Diseño', 'estado' => 'disponible', 'created_at' => $now, 'updated_at' => $now ],
        [ 'nombre' => 'Pen Display Huion Kamvas 13', 'codigo' => 'DES-002', 'categoria' => 'Diseño', 'estado' => 'disponible', 'created_at' => $now, 'updated_at' => $now ],
        [ 'nombre' => 'iPad Pro 12.9 + Apple Pencil', 'codigo' => 'DES-003', 'categoria' => 'Diseño', 'estado' => 'disponible', 'created_at' => $now, 'updated_at' => $now ],
        [ 'nombre' => 'Monitor BenQ PD2700U', 'codigo' => 'DES-004', 'categoria' => 'Diseño', 'estado' => 'disponible', 'created_at' => $now, 'updated_at' => $now ],
        [ 'nombre' => 'Pantalla gráfica XP-Pen Artist 15.6', 'codigo' => 'DES-005', 'categoria' => 'Diseño', 'estado' => 'disponible', 'created_at' => $now, 'updated_at' => $now ],
        [ 'nombre' => 'Kit de lápices Wacom', 'codigo' => 'DES-006', 'categoria' => 'Diseño', 'estado' => 'disponible', 'created_at' => $now, 'updated_at' => $now ],
        [ 'nombre' => 'Teclado Logitech Craft', 'codigo' => 'DES-007', 'categoria' => 'Diseño', 'estado' => 'disponible', 'created_at' => $now, 'updated_at' => $now ],
        [ 'nombre' => 'Mouse Logitech MX Master 3', 'codigo' => 'DES-008', 'categoria' => 'Diseño', 'estado' => 'disponible', 'created_at' => $now, 'updated_at' => $now ],
        [ 'nombre' => 'Pad de dibujo Gaomon S620', 'codigo' => 'DES-009', 'categoria' => 'Diseño', 'estado' => 'disponible', 'created_at' => $now, 'updated_at' => $now ],
        [ 'nombre' => 'Scanner Epson Perfection V39', 'codigo' => 'DES-010', 'categoria' => 'Diseño', 'estado' => 'disponible', 'created_at' => $now, 'updated_at' => $now ],

        // --- Audiovisual ---
        [ 'nombre' => 'Proyector Epson PowerLite', 'codigo' => 'PROY-001', 'categoria' => 'Audiovisual', 'estado' => 'disponible', 'created_at' => $now, 'updated_at' => $now ],
        [ 'nombre' => 'Pantalla de proyección 100"', 'codigo' => 'PROY-002', 'categoria' => 'Audiovisual', 'estado' => 'disponible', 'created_at' => $now, 'updated_at' => $now ],
        [ 'nombre' => 'Lámpara LED Neewer 660', 'codigo' => 'PROY-003', 'categoria' => 'Audiovisual', 'estado' => 'disponible', 'created_at' => $now, 'updated_at' => $now ],
        [ 'nombre' => 'Kit Iluminación Softbox Neewer', 'codigo' => 'PROY-004', 'categoria' => 'Audiovisual', 'estado' => 'disponible', 'created_at' => $now, 'updated_at' => $now ],
        [ 'nombre' => 'Pantalla Verde Chromakey', 'codigo' => 'PROY-005', 'categoria' => 'Audiovisual', 'estado' => 'disponible', 'created_at' => $now, 'updated_at' => $now ],
        [ 'nombre' => 'Teleprompter Neewer X14', 'codigo' => 'PROY-006', 'categoria' => 'Audiovisual', 'estado' => 'disponible', 'created_at' => $now, 'updated_at' => $now ],
        [ 'nombre' => 'Foco Fresnel LED Godox', 'codigo' => 'PROY-007', 'categoria' => 'Audiovisual', 'estado' => 'disponible', 'created_at' => $now, 'updated_at' => $now ],
        [ 'nombre' => 'Cámara Blackmagic Pocket Cinema 4K', 'codigo' => 'PROY-008', 'categoria' => 'Audiovisual', 'estado' => 'disponible', 'created_at' => $now, 'updated_at' => $now ],
        [ 'nombre' => 'Monitor externo Feelworld FW568', 'codigo' => 'PROY-009', 'categoria' => 'Audiovisual', 'estado' => 'disponible', 'created_at' => $now, 'updated_at' => $now ],
        [ 'nombre' => 'Slider Neewer 80cm', 'codigo' => 'PROY-010', 'categoria' => 'Audiovisual', 'estado' => 'disponible', 'created_at' => $now, 'updated_at' => $now ],
    ]);

    }
}
