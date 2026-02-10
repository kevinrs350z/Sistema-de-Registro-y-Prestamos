<?php

namespace Database\Seeders;

use App\Enums\MotivoRechazo;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

class MotivosRechazoSeeder extends Seeder
{
    /**
     * Seed the application's database with motivos de rechazo.
     */
    public function run(): void
    {
        $descripciones = MotivoRechazo::descripciones();
        
        foreach ($descripciones as $codigo => $descripcion) {
            DB::table('motivos_rechazo')->updateOrInsert(
                ['motivo' => $codigo],
                [
                    'descripcion' => $descripcion,
                    'updated_at' => now(),
                    'created_at' => now()
                ]
            );
        }
    }
}
