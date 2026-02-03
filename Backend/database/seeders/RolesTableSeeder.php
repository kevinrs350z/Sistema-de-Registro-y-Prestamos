<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

class RolesTableSeeder extends Seeder
{
    public function run(): void
    {
        $roles = [
                      ['Nombre' => 'ADMIN', 'Descripcion' => 'Administrador del sistema', 'created_at' => now(), 'updated_at' => now()],
            ['Nombre' => 'ALUMNO', 'Descripcion' => 'Usuario del sistema', 'created_at' => now(), 'updated_at' => now()],
            ['Nombre' => 'SUPER_USUARIO', 'Descripcion' => 'Gestor avanzado de préstamos y equipos, sin permisos administrativos', 'created_at' => now(), 'updated_at' => now()],
            ];	
        foreach ($roles as $rol) {
            if (!DB::table('rol')->where('Nombre', $rol['Nombre'])->exists()) {
                DB::table('rol')->insert($rol);
            }
        }
    }
}
