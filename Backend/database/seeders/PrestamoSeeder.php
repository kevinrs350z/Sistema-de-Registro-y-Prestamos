<?php
namespace Database\Seeders;

use Carbon\Carbon;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;


class PrestamoSeeder extends Seeder
{
    public function run(): void
    {
        $now = Carbon::now();

        /*
        |--------------------------------------------------------------------------
        | PRÉSTAMO 1 - DENTRO
        |--------------------------------------------------------------------------
        */
        $p1 = DB::table('prestamos')->insertGetId([
            'idUser'       => 1,
            'fecha_inicio' => null,
            'fecha_fin'    => null,
            'estado'       => 'PENDIENTE',
            'tipo'         => 'DENTRO',
            'otra_motivo'  => 'Clase práctica',
            'observacion'  => null,
            'created_at'   => $now,
            'updated_at'   => $now,
        ]);

        DB::table('prestamo_equipo')->insert([
            [ 'idPrestamo' => $p1, 'idEquipo' => 1, 'created_at' => $now, 'updated_at' => $now ],
            [ 'idPrestamo' => $p1, 'idEquipo' => 3, 'created_at' => $now, 'updated_at' => $now ],
        ]);

        DB::table('bloque_prestamos')->insert([
            [ 'idPrestamo' => $p1, 'idBloque' => 1, 'idAsignatura' => 1, 'created_at' => $now, 'updated_at' => $now ],
            [ 'idPrestamo' => $p1, 'idBloque' => 2, 'idAsignatura' => 1, 'created_at' => $now, 'updated_at' => $now ],
        ]);


        /*
        |--------------------------------------------------------------------------
        | PRÉSTAMO 2 - FUERA
        |--------------------------------------------------------------------------
        */
        $p2 = DB::table('prestamos')->insertGetId([
            'idUser'       => 2,
            'fecha_inicio' => '2025-11-20',
            'fecha_fin'    => '2025-11-22',
            'estado'       => 'PENDIENTE',
            'tipo'         => 'FUERA',
            'otra_motivo'  => 'Grabación externa',
            'observacion'  => null,
            'created_at'   => $now,
            'updated_at'   => $now,
        ]);

        DB::table('prestamo_equipo')->insert([
            [ 'idPrestamo' => $p2, 'idEquipo' => 2, 'created_at' => $now, 'updated_at' => $now ],
            [ 'idPrestamo' => $p2, 'idEquipo' => 4, 'created_at' => $now, 'updated_at' => $now ],
        ]);


        /*
        |--------------------------------------------------------------------------
        | PRÉSTAMO 3 - DENTRO
        |--------------------------------------------------------------------------
        */
        $p3 = DB::table('prestamos')->insertGetId([
            'idUser'       => 1,
            'fecha_inicio' => null,
            'fecha_fin'    => null,
            'estado'       => 'APROBADO',
            'tipo'         => 'DENTRO',
            'otra_motivo'  => 'Práctica guiada',
            'observacion'  => null,
            'created_at'   => $now,
            'updated_at'   => $now,
        ]);

        DB::table('prestamo_equipo')->insert([
            [ 'idPrestamo' => $p3, 'idEquipo' => 5, 'created_at' => $now, 'updated_at' => $now ],
        ]);

        DB::table('bloque_prestamos')->insert([
            [ 'idPrestamo' => $p3, 'idBloque' => 3, 'idAsignatura' => 1, 'created_at' => $now, 'updated_at' => $now ],
        ]);


        /*
        |--------------------------------------------------------------------------
        | PRÉSTAMO 4 - FUERA
        |--------------------------------------------------------------------------
        */
        $p4 = DB::table('prestamos')->insertGetId([
            'idUser'       => 3,
            'fecha_inicio' => '2025-12-01',
            'fecha_fin'    => '2025-12-08',
            'estado'       => 'PENDIENTE',
            'tipo'         => 'FUERA',
            'otra_motivo'  => 'Proyecto personal',
            'observacion'  => 'Debe devolver antes del lunes',
            'created_at'   => $now,
            'updated_at'   => $now,
        ]);

        DB::table('prestamo_equipo')->insert([
            [ 'idPrestamo' => $p4, 'idEquipo' => 1, 'created_at' => $now, 'updated_at' => $now ],
            [ 'idPrestamo' => $p4, 'idEquipo' => 4, 'created_at' => $now, 'updated_at' => $now ],
        ]);


        /*
        |--------------------------------------------------------------------------
        | PRÉSTAMO 5 - DENTRO
        |--------------------------------------------------------------------------
        */
        $p5 = DB::table('prestamos')->insertGetId([
            'idUser'       => 2,
            'fecha_inicio' => null,
            'fecha_fin'    => null,
            'estado'       => 'PENDIENTE',
            'tipo'         => 'DENTRO',
            'otra_motivo'  => 'Clases prácticas',
            'observacion'  => null,
            'created_at'   => $now,
            'updated_at'   => $now,
        ]);

        DB::table('prestamo_equipo')->insert([
            [ 'idPrestamo' => $p5, 'idEquipo' => 2, 'created_at' => $now, 'updated_at' => $now ],
            [ 'idPrestamo' => $p5, 'idEquipo' => 5, 'created_at' => $now, 'updated_at' => $now ],
        ]);

        DB::table('bloque_prestamos')->insert([
            [ 'idPrestamo' => $p5, 'idBloque' => 1, 'idAsignatura' => 1, 'created_at' => $now, 'updated_at' => $now ],
            [ 'idPrestamo' => $p5, 'idBloque' => 2, 'idAsignatura' => 2, 'created_at' => $now, 'updated_at' => $now ],
        ]);

        // GENERAR MUCHOS MÁS PRÉSTAMOS PARA VISUALIZAR EL RANKING
        for ($i = 2; $i <= 5; $i++) {
            for ($j = 0; $j < 8; $j++) {
                DB::table('prestamos')->insert([
                    'idUser'       => $i,
                    'fecha_inicio' => null,
                    'fecha_fin'    => null,
                    'estado'       => ['PENDIENTE', 'APROBADO', 'DEVUELTO'][rand(0, 2)],
                    'tipo'         => ['DENTRO', 'FUERA'][rand(0, 1)],
                    'otra_motivo'  => 'Préstamo ' . $j,
                    'observacion'  => null,
                    'created_at'   => Carbon::now()->subDays(rand(1, 30)),
                    'updated_at'   => Carbon::now(),
                ]);
            }
        }

        /*
        |--------------------------------------------------------------------------
        | PRÉSTAMOS PRÓXIMOS A VENCER (FUERA) - USADOS PARA EL DASHBOARD
        | Se crean préstamos tipo FUERA con fecha_fin entre hoy +1 y +3 días
        |--------------------------------------------------------------------------
        */
        for ($u = 2; $u <= 4; $u++) {
            for ($k = 0; $k < 2; $k++) {
                $inicio = Carbon::now()->subDays(rand(1, 5))->toDateString();
                $fin = Carbon::now()->addDays(rand(1, 3))->toDateString();

                $pid = DB::table('prestamos')->insertGetId([
                    'idUser'       => $u,
                    'fecha_inicio' => $inicio,
                    'fecha_fin'    => $fin,
                    'estado'       => 'APROBADO',
                    'tipo'         => 'FUERA',
                    'otra_motivo'  => 'Préstamo exterior próximamente a vencer',
                    'observacion'  => null,
                    'created_at'   => Carbon::now()->subDays(rand(1, 10)),
                    'updated_at'   => Carbon::now(),
                ]);

                // asociar un equipo aleatorio (1..6 si existen)
                $equipoId = rand(1, 6);
                DB::table('prestamo_equipo')->insert([
                    'idPrestamo' => $pid,
                    'idEquipo' => $equipoId,
                    'created_at' => Carbon::now(),
                    'updated_at' => Carbon::now(),
                ]);
            }
        }
    }
}
