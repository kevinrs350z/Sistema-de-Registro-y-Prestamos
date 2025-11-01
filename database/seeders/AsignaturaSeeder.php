<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

class AsignaturaSeeder extends Seeder
{
    public function run(): void
    {
        DB::table('asignaturas')->insert([
            ['nombre' => 'Diseño Multimedia I'],
            ['nombre' => 'Programación Web'],
            ['nombre' => 'Modelado 3D'],
            ['nombre' => 'Animación Digital'],
            ['nombre' => 'Inteligencia Artificial Aplicada'],
        ]);
    }
}
