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
            EquiposTableSeeder::class,
            PrestamosTableSeeder::class,
            BloqueSeeder::class,
            ObservacionSeeder::class,
            SancionSeeder::class,
            UserSancionSeeder::class,
            DocenteSeeder::class,
            AsignaturaSeeder::class,
            AsignaturaDocenteSeeder::class,
            BloquePrestamosSeeder::class
        ]);
    }
}
