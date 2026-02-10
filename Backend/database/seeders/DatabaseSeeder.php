<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;

class DatabaseSeeder extends Seeder
{
    public function run(): void
    {
        $this->call([
            RolesTableSeeder::class,
            PersonasTableSeeder::class,
            UsersTableSeeder::class,
            CategoriasSeeder::class,
            TipoEquiposSeeder::class,
            AsignaturaSeeder::class,
            BloqueSeeder::class,
            EquiposTableSeeder::class,
            PrestamoSeeder::class,
            
            ObservacionSeeder::class,
            SancionSeeder::class,
            UserSancionSeeder::class,
            DocenteSeeder::class,
            
            AsignaturaDocenteSeeder::class,
            //BloquePrestamosSeeder::class,
            EquiposRelacionadosSeeder::class,
            
            // Catálogo de tipos de falla para auditoría de equipos
            TiposFallaSeeder::class,
            
            // Seeder de datos masivos para reportes
            ReportesDataSeeder::class,
        ]);
    }
}
