<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Carbon\Carbon;

class PrestamosTableSeeder extends Seeder
{
    public function run(): void
    {
        $now = Carbon::now();

        // 5 devueltos
        for ($i = 1; $i <= 5; $i++) {
            DB::table('prestamos')->insert([
                'idUser' => rand(2, 5),
                'idEquipo' => rand(1, 5),
                'fecha_inicio' => $now->copy()->subDays(rand(15, 25)),
                'fecha_fin' => $now->copy()->subDays(rand(5, 10)),
                'estado' => 'devuelto',
                'otra_motivo' => 'se usara uno 10 minutos',
                'tipo' => 'externo',
                'observacion' => 'necesito un lente extra',

                'created_at' => now(),
                'updated_at' => now(),
            ]);
        }

        // 5 prestados
        for ($i = 1; $i <= 5; $i++) {
            DB::table('prestamos')->insert([
                'idUser' => rand(2, 5),
                'idEquipo' => rand(1, 5),
                'fecha_inicio' => $now->copy()->subDays(rand(1, 3)),
                'fecha_fin' => $now->copy()->addDays(rand(3, 7)),
                'estado' => 'prestado',
                'tipo' => 'laboratorio',
                'created_at' => now(),
                'updated_at' => now(),
            ]);
        }
    }
}
