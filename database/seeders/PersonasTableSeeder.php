<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

class PersonasTableSeeder extends Seeder
{
    public function run(): void
    {
        DB::table('persona')->insert([
            [
                'Nombre' => 'Juan',
                'apellido1' => 'Meneses',
                'apellido2' => 'Muñoz',
                'Rut' => '20.111.333-4',
                'Email' => 'juan.meneses75m@gmail.com',
                'celular' => '569 5452',
                'telefono' => '569 752222',
                
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'Nombre' => 'Juan',
                'apellido1' => 'Meneses',
                'apellido2' => 'UTA',
                'Rut' => '21.222.444-5',
                'Email' => 'juan.meneses.munoz@alumnos.uta.cl',
                'celular' => '569 5452',
                'telefono' => '569 752222',
                
                'created_at' => now(),
                'updated_at' => now(),
                
            ],
            [
                'Nombre' => 'Kevin',
                'apellido1' => 'Rojas',
                'apellido2' => null,
                'Rut' => '22.333.555-6',
                'Email' => 'kevin.rojas@alumnos.uta.cl',
                'celular' => '569 5452',
                'telefono' => '569 752222',
                
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'Nombre' => 'Pablo',
                'apellido1' => 'Valladares',
                'apellido2' => null,
                'Rut' => '23.444.666-7',
                'Email' => 'pablo.valladares@alumnos.uta.cl',
                'celular' => '569 5452',
                'telefono' => '569 752222',
                
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'Nombre' => 'Andrea',
                'apellido1' => 'Navia',
                'apellido2' => null,
                'Rut' => '24.555.777-8',
                'Email' => 'andrea.navia@alumnos.uta.cl',
                'celular' => '569 5452',
                'telefono' => '569 752222',
                
                'created_at' => now(),
                'updated_at' => now(),
            ],
        ]);
    }
}
