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
            [
                'nombre' => 'Cámara Canon EOS 90D',
                'codigo' => 'CAM-001',
                'categoria' => 'Fotografía',
                'estado' => 'disponible',
               // 'tipo' => 'laboratorio',
                'created_at' => $now,
                'updated_at' => $now,
            ],
            [
                'nombre' => 'Micrófono Rode NT1-A',
                'codigo' => 'MIC-001',
                'categoria' => 'Audio',
                'estado' => 'disponible',
               // 'tipo' => 'laboratorio',
                'created_at' => $now,
                'updated_at' => $now,
            ],
            [
                'nombre' => 'Tablet Wacom Intuos Pro',
                'codigo' => 'TAB-001',
                'categoria' => 'Diseño',
                'estado' => 'disponible',
                //'tipo' => 'laboratorio',
                'created_at' => $now,
                'updated_at' => $now,
            ],
            [
                'nombre' => 'Proyector Epson PowerLite',
                'codigo' => 'PROY-001',
                'categoria' => 'Audiovisual',
                'estado' => 'disponible',
                //'tipo' => 'laboratorio',
                'created_at' => $now,
                'updated_at' => $now,
            ],
            [
                'nombre' => 'Grabadora Zoom H6',
                'codigo' => 'GRAB-001',
                'categoria' => 'Audio',
                'estado' => 'disponible',
                //'tipo' => 'laboratorio',
                'created_at' => $now,
                'updated_at' => $now,
            ],
        ]);
    }
}
