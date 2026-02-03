<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

class AsignaturaSeeder extends Seeder
{
    public function run(): void
    {
        DB::table('asignaturas')->insert([
            ['nombre' => 'Taller de fotografía Digital'],
            ['nombre' => 'Taller de fotografía Publicitaria'],
            ['nombre' => 'Taller de Producción Multimedia I'],
            ['nombre' => 'Taller de Video Digital'],
            ['nombre' => 'Taller de Medios de Comunicación'],
            ['nombre' => 'Taller de Música y Sonido'],
            ['nombre' => 'Laboratorio de Video Digital'],
            ['nombre' => 'Practica Laboral Segundo año'],
            ['nombre' => 'Practica Profesional Cuarto año'],
        ]);
    }
}
