<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

class AsignaturaSemestreSeeder extends Seeder
{
    public function run()
    {
        $data = [

            // I SEMESTRE (1)
            ['idAsignatura' => 1, 'idSemestre' => 1],
            ['idAsignatura' => 2, 'idSemestre' => 1],
            ['idAsignatura' => 3, 'idSemestre' => 1],
            ['idAsignatura' => 4, 'idSemestre' => 1],
            ['idAsignatura' => 5, 'idSemestre' => 1],

            // II SEMESTRE (2)
            ['idAsignatura' => 6, 'idSemestre' => 2],
            ['idAsignatura' => 7, 'idSemestre' => 2],
            ['idAsignatura' => 8, 'idSemestre' => 2],
            ['idAsignatura' => 9, 'idSemestre' => 2],
            ['idAsignatura' => 10, 'idSemestre' => 2],
            ['idAsignatura' => 11, 'idSemestre' => 2],

            // III SEMESTRE (3)
            ['idAsignatura' => 12, 'idSemestre' => 3],
            ['idAsignatura' => 13, 'idSemestre' => 3],
            ['idAsignatura' => 14, 'idSemestre' => 3],
            ['idAsignatura' => 15, 'idSemestre' => 3],
            ['idAsignatura' => 16, 'idSemestre' => 3],
            ['idAsignatura' => 17, 'idSemestre' => 3], // Práctica I (continúa abajo)

            // IV SEMESTRE (4)
            ['idAsignatura' => 18, 'idSemestre' => 4],
            ['idAsignatura' => 19, 'idSemestre' => 4],
            ['idAsignatura' => 20, 'idSemestre' => 4],
            ['idAsignatura' => 21, 'idSemestre' => 4],
            ['idAsignatura' => 22, 'idSemestre' => 4],
            ['idAsignatura' => 23, 'idSemestre' => 4], // Práctica II

            // V SEMESTRE (5)
            ['idAsignatura' => 24, 'idSemestre' => 5],
            ['idAsignatura' => 25, 'idSemestre' => 5],
            ['idAsignatura' => 26, 'idSemestre' => 5],
            ['idAsignatura' => 27, 'idSemestre' => 5],
            ['idAsignatura' => 28, 'idSemestre' => 5],
            ['idAsignatura' => 29, 'idSemestre' => 5],

            // VI SEMESTRE (6)
            ['idAsignatura' => 30, 'idSemestre' => 6],
            ['idAsignatura' => 31, 'idSemestre' => 6],
            ['idAsignatura' => 32, 'idSemestre' => 6],
            ['idAsignatura' => 33, 'idSemestre' => 6],
            ['idAsignatura' => 34, 'idSemestre' => 6],
            ['idAsignatura' => 35, 'idSemestre' => 6],

            // VII SEMESTRE (7)
            ['idAsignatura' => 36, 'idSemestre' => 7],
            ['idAsignatura' => 37, 'idSemestre' => 7],
            ['idAsignatura' => 38, 'idSemestre' => 7],
            ['idAsignatura' => 39, 'idSemestre' => 7],
            ['idAsignatura' => 40, 'idSemestre' => 7],
            ['idAsignatura' => 41, 'idSemestre' => 7],
            ['idAsignatura' => 42, 'idSemestre' => 7], // Práctica Profesional

            // VIII SEMESTRE (8)
            ['idAsignatura' => 43, 'idSemestre' => 8],
            ['idAsignatura' => 44, 'idSemestre' => 8],
            ['idAsignatura' => 45, 'idSemestre' => 8],
            ['idAsignatura' => 46, 'idSemestre' => 8],
            ['idAsignatura' => 47, 'idSemestre' => 8],
            ['idAsignatura' => 48, 'idSemestre' => 8],
            ['idAsignatura' => 49, 'idSemestre' => 8],
            ['idAsignatura' => 50, 'idSemestre' => 8],
            ['idAsignatura' => 51, 'idSemestre' => 8],
        ];

        DB::table('asignatura_semestre')->insert($data);
    }
}
