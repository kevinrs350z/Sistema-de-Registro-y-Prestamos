<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\Equipo;

class EquiposTableSeeder extends Seeder
{
    public function run()
    {
        // Ejemplos: 2 unidades por cada tipoEquipo (id 1 a 4)
        
        // TipoEquipo 1
        Equipo::create([
            'tipo_equipo_id' => 1,
            'codigo' => 'MIC-001',
            'estado' => 'disponible'
        ]);

        Equipo::create([
            'tipo_equipo_id' => 1,
            'codigo' => 'MIC-002',
            'estado' => 'disponible'
        ]);

        // TipoEquipo 2
        Equipo::create([
            'tipo_equipo_id' => 2,
            'codigo' => 'GRAB-001',
            'estado' => 'disponible'
        ]);

        Equipo::create([
            'tipo_equipo_id' => 2,
            'codigo' => 'GRAB-002',
            'estado' => 'prestado'
        ]);

        // TipoEquipo 3
        Equipo::create([
            'tipo_equipo_id' => 3,
            'codigo' => 'CAM-001',
            'estado' => 'disponible'
        ]);

        Equipo::create([
            'tipo_equipo_id' => 3,
            'codigo' => 'CAM-002',
            'estado' => 'disponible'
        ]);

        // TipoEquipo 4
        Equipo::create([
            'tipo_equipo_id' => 4,
            'codigo' => 'LED-001',
            'estado' => 'disponible'
        ]);

        Equipo::create([
            'tipo_equipo_id' => 4,
            'codigo' => 'LED-002',
            'estado' => 'mantencion'
        ]);
    }
}
