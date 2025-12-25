<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
class SemestreSeeder extends Seeder
{
    /**
     * Run the database seeds.
     *
     * @return void
     */
    public function run(): void
    {
        DB::table('semestres')->insert([
            ['nombre' => 'Primer Semestre', 'numero' => 1],
            ['nombre' => 'Segundo Semestre', 'numero' => 2],
            ['nombre' => 'Tercer Semestre', 'numero' => 3],
            ['nombre' => 'Cuarto Semestre', 'numero' => 4],
            ['nombre' => 'Quinto Semestre', 'numero' => 5],
            ['nombre' => 'Sexto Semestre', 'numero' => 6],
            ['nombre' => 'Séptimo Semestre', 'numero' => 7],
            ['nombre' => 'Octavo Semestre', 'numero' => 8],
        ]);
    }

}
