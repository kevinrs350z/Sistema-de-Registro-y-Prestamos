<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\Equipo;
use App\Models\TipoEquipo;

class EquiposTableSeeder extends Seeder
{
    public function run(): void
    {
        $equipos = [

            // ================= FOTOGRAFÍA =================

            // Cámaras Canon T3i
            ['tipo'=>'Cámara Canon T3i','codigo'=>'067-1','estado_fisico'=>'Buen estado','ubicacion'=>'Oficina'],
            ['tipo'=>'Cámara Canon T3i','codigo'=>'014-2','estado_fisico'=>'Buen estado','ubicacion'=>'Oficina'],
            ['tipo'=>'Cámara Canon T3i','codigo'=>'014-4','estado_fisico'=>'Buen estado','ubicacion'=>'Oficina'],
            ['tipo'=>'Cámara Canon T3i','codigo'=>'014-7','estado_fisico'=>'Buen estado','ubicacion'=>'Oficina'],
            ['tipo'=>'Cámara Canon T3i','codigo'=>'014-8','estado_fisico'=>'Buen estado','ubicacion'=>'Oficina'],
            ['tipo'=>'Cámara Canon T3i','codigo'=>'014-9','estado_fisico'=>'Buen estado','ubicacion'=>'Oficina'],
            ['tipo'=>'Cámara Canon T3i','codigo'=>'014-10','estado_fisico'=>'Nuevo','ubicacion'=>'Oficina','observacion'=>'Lente 50mm'],
            ['tipo'=>'Cámara Canon T3i','codigo'=>'014-11','estado_fisico'=>'Nuevo','ubicacion'=>'Oficina','observacion'=>'Lente 75-300mm'],

            // Cámaras Canon T5i
            ['tipo'=>'Cámara Canon T5i','codigo'=>'071-1','estado_fisico'=>'Buen estado','ubicacion'=>'CITE'],
            ['tipo'=>'Cámara Canon T5i','codigo'=>'127-1','estado_fisico'=>'Buen estado','ubicacion'=>'Oficina'],
            ['tipo'=>'Cámara Canon T5i','codigo'=>'864-4','estado_fisico'=>'Buen estado','ubicacion'=>'Set Foto'],
            ['tipo'=>'Cámara Canon T5i','codigo'=>'864-5','estado_fisico'=>'Buen estado','ubicacion'=>'Set Foto'],
            ['tipo'=>'Cámara Canon T5i','codigo'=>'864-6','estado_fisico'=>'Buen estado','ubicacion'=>'Set Foto'],

            // Cámaras Canon SL3
            ['tipo'=>'Cámara Canon SL3','codigo'=>'196-1','estado_fisico'=>'Nuevo','ubicacion'=>'Set Foto'],
            ['tipo'=>'Cámara Canon SL3','codigo'=>'196-2','estado_fisico'=>'Nuevo','ubicacion'=>'Set Foto'],
            ['tipo'=>'Cámara Canon SL3','codigo'=>'198-1','estado_fisico'=>'Nuevo','ubicacion'=>'Set Foto'],
            ['tipo'=>'Cámara Canon SL3','codigo'=>'198-2','estado_fisico'=>'Nuevo','ubicacion'=>'Set Foto'],

            // Trípodes
            ['tipo'=>'Trípode Manfrotto','codigo'=>'051056411-1','estado_fisico'=>'Nuevo','ubicacion'=>'Centro de Práctica'],
            ['tipo'=>'Trípode Manfrotto','codigo'=>'051056411-2','estado_fisico'=>'Nuevo','ubicacion'=>'Centro de Práctica'],
            ['tipo'=>'Trípode Manfrotto','codigo'=>'051056411-3','estado_fisico'=>'Nuevo','ubicacion'=>'Centro de Práctica'],

            // ================= COMPUTACIONAL =================

            // iMac
            ['tipo'=>'iMac 21.5"','codigo'=>'IMAC-1','estado_fisico'=>'Buen estado','ubicacion'=>'UTA TV','observacion'=>'Sin mouse ni teclado'],
            ['tipo'=>'iMac 21.5"','codigo'=>'IMAC-2','estado_fisico'=>'Buen estado','ubicacion'=>'UTA TV','observacion'=>'Sin mouse ni teclado'],

            // Accesorios computacionales
            ['tipo'=>'USB-C Hub','codigo'=>'USBHUB-1','estado_fisico'=>'Buen estado','ubicacion'=>'Oficina'],
            ['tipo'=>'Disco Duro Externo','codigo'=>'DD-1','estado_fisico'=>'Buen estado','ubicacion'=>'Oficina'],
        ];

        // ================= NOTEBOOKS HP ZBOOK 15V =================

        $notebooks = [
            ['53071070-1','CND9170DHX'], ['53071070-2','CND9142QYS'],
            ['53071070-3','CND908522D'], ['53071070-4','CND9170DH7'],
            ['53071070-5','CND9170DH6'], ['53071070-6','CND9142QZ9'],
            ['53071070-7','CND9142QYF'], ['53071070-8','CND9170DJF'],
            ['53071070-9','CND9142QZ7'], ['53071070-10','CND9142QZ1'],
            ['53071070-11','CND9150X01'], ['53071070-12','CND9170DJ9'],
            ['53071070-13','CND9170DHF'], ['53071070-14','CND9170DHW'],
            ['53071070-15','CND9170DHV'], ['53071070-16','CND9170DJ6'],
            ['53071070-17','CND9170DHT'], ['53071070-18','CND9150X04'],
            ['53071070-19','CND914ZQZZ'], ['53071070-20','CDN9142QXW'],
            ['53071070-21','CND9170DHB'], ['53071070-22','CND9150X0J'],
            ['53071070-23','CND9170DH5'], ['53071070-24','CND9150X0D'],
            ['53071070-25','CND9142QYY'], ['53071070-26','CND9142QYK'],
            ['53071070-27','CND9150X09'], ['53071070-28','CND9150X08'],
            ['53071070-29','CND9142QYQ'], ['53071071-1','CDN9150X00'],
        ];

        foreach ($equipos as $e) {
            $tipo = TipoEquipo::where('nombre', $e['tipo'])->first();

            if (!$tipo) {
                throw new \Exception("TipoEquipo no encontrado: {$e['tipo']}");
            }

            Equipo::create([
                'tipo_equipo_id' => $tipo->id,
                'codigo'         => $e['codigo'],
                'estado'         => 'DISPONIBLE',
                'estado_fisico'  => $e['estado_fisico'],
                'ubicacion'      => $e['ubicacion'],
                'observacion'    => $e['observacion'] ?? null,
            ]);
        }

        $tipoNotebook = TipoEquipo::where('nombre', 'Notebook HP ZBook 15v')->first();

        if (!$tipoNotebook) {
            throw new \Exception("TipoEquipo Notebook HP ZBook 15v no encontrado");
        }

        foreach ($notebooks as [$codigo, $serie]) {
            Equipo::create([
                'tipo_equipo_id' => $tipoNotebook->id,
                'codigo'         => $codigo,
                'estado'         => 'DISPONIBLE',
                'estado_fisico'  => 'Buen estado',
                'ubicacion'      => 'Oficina',
                'observacion'    => 'Serie: '.$serie.' | Color: Gris | Pantalla 15.6"',
            ]);
        }
    }
}
