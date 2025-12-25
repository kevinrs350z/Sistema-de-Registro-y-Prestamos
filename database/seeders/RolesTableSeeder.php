<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

class RolesTableSeeder extends Seeder
{
    public function run(): void
    {
        DB::table('rol')->insert([
            ['Nombre' => 'ADMIN', 'Descripcion' => 'Administrador del sistema', 'created_at' => now(), 'updated_at' => now()],
            ['Nombre' => 'ALUMNO', 'Descripcion' => 'Usuario del sistema', 'created_at' => now(), 'updated_at' => now()],
        ]);
    }
}
