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

            // ================= CÁMARAS DE VIDEO =================

            // Cámara de video Canon XA35
            ['tipo'=>'Cámara de video Canon XA35','codigo'=>'051055967-1','estado_fisico'=>'Buen estado','ubicacion'=>'UTA TV'],
            ['tipo'=>'Cámara de video Canon XA35','codigo'=>'051055973-1','estado_fisico'=>'Buen estado','ubicacion'=>'UTA TV'],
            ['tipo'=>'Cámara de video Canon XA35','codigo'=>'051055970-1','estado_fisico'=>'Buen estado','ubicacion'=>'UTA TV'],

            // Cámara de video Canon XA60
            ['tipo'=>'Cámara de video Canon XA60','codigo'=>'053150024-1','estado_fisico'=>'Buen estado','ubicacion'=>'UTA TV'],
            ['tipo'=>'Cámara de video Canon XA60','codigo'=>'053150025-1','estado_fisico'=>'Buen estado','ubicacion'=>'UTA TV'],
            ['tipo'=>'Cámara de video Canon XA60','codigo'=>'053150026-1','estado_fisico'=>'Buen estado','ubicacion'=>'UTA TV'],

            // Cámara de video Canon XA75
            ['tipo'=>'Cámara de video Canon XA75','codigo'=>'051056460-1','estado_fisico'=>'Buen estado','ubicacion'=>'UTA TV'],
            ['tipo'=>'Cámara de video Canon XA75','codigo'=>'051056460-2','estado_fisico'=>'Buen estado','ubicacion'=>'UTA TV'],

            // DJI Osmo Pocket 3
            ['tipo'=>'DJI Osmo Pocket 3','codigo'=>'051056382-1','estado_fisico'=>'Buen estado','ubicacion'=>'Oficina'],
            ['tipo'=>'DJI Osmo Pocket 3','codigo'=>'051056412-1','estado_fisico'=>'Buen estado','ubicacion'=>'Oficina'],
            ['tipo'=>'DJI Osmo Pocket 3','codigo'=>'051056412-2','estado_fisico'=>'Buen estado','ubicacion'=>'Oficina'],

            // Insta360 One RS Twin Edition
            ['tipo'=>'Insta360 One RS Twin Edition','codigo'=>'051056381-1','estado_fisico'=>'Buen estado','ubicacion'=>'Oficina'],

            // Trípode de video Miliboo
            ['tipo'=>'Trípode de video Miliboo','codigo'=>'051056448-1','estado_fisico'=>'Buen estado','ubicacion'=>'UTA TV'],
            ['tipo'=>'Trípode de video Miliboo','codigo'=>'051056448-2','estado_fisico'=>'Buen estado','ubicacion'=>'UTA TV'],
            ['tipo'=>'Trípode de video Miliboo','codigo'=>'051056448-3','estado_fisico'=>'Buen estado','ubicacion'=>'UTA TV'],
            ['tipo'=>'Trípode de video Miliboo','codigo'=>'051056448-4','estado_fisico'=>'Buen estado','ubicacion'=>'UTA TV'],
            ['tipo'=>'Trípode de video Miliboo','codigo'=>'051056448-5','estado_fisico'=>'Buen estado','ubicacion'=>'UTA TV'],
            ['tipo'=>'Trípode de video Miliboo','codigo'=>'051056448-6','estado_fisico'=>'Buen estado','ubicacion'=>'UTA TV'],
            ['tipo'=>'Trípode de video Miliboo','codigo'=>'051056448-7','estado_fisico'=>'Buen estado','ubicacion'=>'UTA TV'],

            // Trípode de video Manfrotto
            ['tipo'=>'Trípode de video Manfrotto','codigo'=>'051055969-1','estado_fisico'=>'Buen estado','ubicacion'=>'UTA TV'],
            ['tipo'=>'Trípode de video Manfrotto','codigo'=>'051055969-2','estado_fisico'=>'Buen estado','ubicacion'=>'UTA TV'],
            ['tipo'=>'Trípode de video Manfrotto','codigo'=>'051055982-2','estado_fisico'=>'Buen estado','ubicacion'=>'UTA TV'],

            // Estabilizador FeiyuTech Mini 2
            ['tipo'=>'Estabilizador FeiyuTech Mini 2','codigo'=>'051056391-1','estado_fisico'=>'Buen estado','ubicacion'=>'Oficina'],
            ['tipo'=>'Estabilizador FeiyuTech Mini 2','codigo'=>'051056391-2','estado_fisico'=>'Buen estado','ubicacion'=>'Oficina'],

            // Estabilizador Zhiyun Weebill 3S
            ['tipo'=>'Estabilizador Zhiyun Weebill 3S','codigo'=>'051056413-1','estado_fisico'=>'Buen estado','ubicacion'=>'Oficina'],
            ['tipo'=>'Estabilizador Zhiyun Weebill 3S','codigo'=>'051056413-2','estado_fisico'=>'Buen estado','ubicacion'=>'Oficina'],

            // Micrófono Shotgun RODE
            ['tipo'=>'Micrófono Shotgun RODE','codigo'=>'051056271-1','estado_fisico'=>'Buen estado','ubicacion'=>'UTA TV'],
            ['tipo'=>'Micrófono Shotgun RODE','codigo'=>'051056254-1','estado_fisico'=>'Buen estado','ubicacion'=>'UTA TV'],
            ['tipo'=>'Micrófono Shotgun RODE','codigo'=>'051055971-2','estado_fisico'=>'Buen estado','ubicacion'=>'UTA TV'],
            ['tipo'=>'Micrófono Shotgun RODE','codigo'=>'051055971-3','estado_fisico'=>'Buen estado','ubicacion'=>'UTA TV'],
            ['tipo'=>'Micrófono Shotgun RODE','codigo'=>'051055974-3','estado_fisico'=>'Buen estado','ubicacion'=>'UTA TV'],
            ['tipo'=>'Micrófono Shotgun RODE','codigo'=>'051056390-1','estado_fisico'=>'Buen estado','ubicacion'=>'UTA TV'],
            ['tipo'=>'Micrófono Shotgun RODE','codigo'=>'051056390-2','estado_fisico'=>'Buen estado','ubicacion'=>'UTA TV'],
            ['tipo'=>'Micrófono Shotgun RODE','codigo'=>'051056390-3','estado_fisico'=>'Buen estado','ubicacion'=>'UTA TV'],

            // Blimp RODE
            ['tipo'=>'Blimp RODE','codigo'=>'051056389-1','estado_fisico'=>'Buen estado','ubicacion'=>'UTA TV'],
            ['tipo'=>'Blimp RODE','codigo'=>'051056389-2','estado_fisico'=>'Buen estado','ubicacion'=>'UTA TV'],
            ['tipo'=>'Blimp RODE','codigo'=>'051056389-3','estado_fisico'=>'Buen estado','ubicacion'=>'UTA TV'],
            ['tipo'=>'Blimp RODE','codigo'=>'051056389-4','estado_fisico'=>'Buen estado','ubicacion'=>'UTA TV'],

            // ================= FOTOGRAFÍA =================

            // Cámara fotográfica Canon Rebel T3
            ['tipo'=>'Cámara fotográfica Canon Rebel T3','codigo'=>'53110014-2','estado_fisico'=>'Buen estado','ubicacion'=>'Oficina','observacion'=>'Incluye batería y tarjeta SD'],
            ['tipo'=>'Cámara fotográfica Canon Rebel T3','codigo'=>'53110014-3','estado_fisico'=>'Buen estado','ubicacion'=>'Oficina','observacion'=>'Incluye batería y tarjeta SD'],
            ['tipo'=>'Cámara fotográfica Canon Rebel T3','codigo'=>'53110014-4','estado_fisico'=>'Buen estado','ubicacion'=>'Oficina','observacion'=>'Incluye batería y tarjeta SD'],
            ['tipo'=>'Cámara fotográfica Canon Rebel T3','codigo'=>'53110014-7','estado_fisico'=>'Buen estado','ubicacion'=>'Oficina','observacion'=>'Incluye batería y tarjeta SD'],
            ['tipo'=>'Cámara fotográfica Canon Rebel T3','codigo'=>'53110014-8','estado_fisico'=>'Buen estado','ubicacion'=>'Oficina','observacion'=>'Incluye batería y tarjeta SD'],
            ['tipo'=>'Cámara fotográfica Canon Rebel T3','codigo'=>'53110014-9','estado_fisico'=>'Buen estado','ubicacion'=>'Oficina','observacion'=>'Incluye batería y tarjeta SD'],
            ['tipo'=>'Cámara fotográfica Canon Rebel T3','codigo'=>'53110014-10','estado_fisico'=>'Buen estado','ubicacion'=>'Oficina','observacion'=>'Incluye batería y tarjeta SD'],

            // Cámara fotográfica Canon Rebel T5i
            ['tipo'=>'Cámara fotográfica Canon Rebel T5i','codigo'=>'053110071-1','estado_fisico'=>'Buen estado','ubicacion'=>'Oficina','observacion'=>'Incluye batería y tarjeta SD'],
            ['tipo'=>'Cámara fotográfica Canon Rebel T5i','codigo'=>'053110127-1','estado_fisico'=>'Buen estado','ubicacion'=>'Oficina','observacion'=>'Incluye batería y tarjeta SD'],
            ['tipo'=>'Cámara fotográfica Canon Rebel T5i','codigo'=>'053110130-1','estado_fisico'=>'Buen estado','ubicacion'=>'Oficina','observacion'=>'Incluye batería y tarjeta SD'],
            ['tipo'=>'Cámara fotográfica Canon Rebel T5i','codigo'=>'051055864-4','estado_fisico'=>'Buen estado','ubicacion'=>'Oficina','observacion'=>'Incluye batería y tarjeta SD'],
            ['tipo'=>'Cámara fotográfica Canon Rebel T5i','codigo'=>'051055864-5','estado_fisico'=>'Buen estado','ubicacion'=>'Oficina','observacion'=>'Incluye batería y tarjeta SD'],
            ['tipo'=>'Cámara fotográfica Canon Rebel T5i','codigo'=>'051055864-6','estado_fisico'=>'Buen estado','ubicacion'=>'Oficina','observacion'=>'Incluye batería y tarjeta SD'],
            ['tipo'=>'Cámara fotográfica Canon Rebel T5i','codigo'=>'051055864-7','estado_fisico'=>'Buen estado','ubicacion'=>'Oficina','observacion'=>'Incluye batería y tarjeta SD'],
            ['tipo'=>'Cámara fotográfica Canon Rebel T5i','codigo'=>'051055864-8','estado_fisico'=>'Buen estado','ubicacion'=>'Oficina','observacion'=>'Incluye batería y tarjeta SD'],
            ['tipo'=>'Cámara fotográfica Canon Rebel T5i','codigo'=>'051055864-9','estado_fisico'=>'Buen estado','ubicacion'=>'Oficina','observacion'=>'Incluye batería y tarjeta SD'],
            ['tipo'=>'Cámara fotográfica Canon Rebel T5i','codigo'=>'051055864-10','estado_fisico'=>'Buen estado','ubicacion'=>'Oficina','observacion'=>'Incluye batería y tarjeta SD'],
            ['tipo'=>'Cámara fotográfica Canon Rebel T5i','codigo'=>'051055864-12','estado_fisico'=>'Buen estado','ubicacion'=>'Oficina','observacion'=>'Incluye batería y tarjeta SD'],
            ['tipo'=>'Cámara fotográfica Canon Rebel T5i','codigo'=>'051055864-14','estado_fisico'=>'Buen estado','ubicacion'=>'Oficina','observacion'=>'Incluye batería y tarjeta SD'],
            ['tipo'=>'Cámara fotográfica Canon Rebel T5i','codigo'=>'051055864-15','estado_fisico'=>'Buen estado','ubicacion'=>'Oficina','observacion'=>'Incluye batería y tarjeta SD'],

            // Cámara fotográfica Canon Rebel SL3
            ['tipo'=>'Cámara fotográfica Canon Rebel SL3','codigo'=>'053110196-1','estado_fisico'=>'Buen estado','ubicacion'=>'Oficina','observacion'=>'Incluye batería y tarjeta SD'],
            ['tipo'=>'Cámara fotográfica Canon Rebel SL3','codigo'=>'053110196-2','estado_fisico'=>'Buen estado','ubicacion'=>'Oficina','observacion'=>'Incluye batería y tarjeta SD'],
            ['tipo'=>'Cámara fotográfica Canon Rebel SL3','codigo'=>'053110198-2','estado_fisico'=>'Buen estado','ubicacion'=>'Oficina','observacion'=>'Incluye batería y tarjeta SD'],
            ['tipo'=>'Cámara fotográfica Canon Rebel SL3','codigo'=>'053110200-2','estado_fisico'=>'Buen estado','ubicacion'=>'Oficina','observacion'=>'Incluye batería y tarjeta SD'],

            // Lente fotográfico Canon 50mm
            ['tipo'=>'Lente fotográfico Canon 50mm','codigo'=>'51056416-1','estado_fisico'=>'Buen estado','ubicacion'=>'Oficina'],
            ['tipo'=>'Lente fotográfico Canon 50mm','codigo'=>'51056416-2','estado_fisico'=>'Buen estado','ubicacion'=>'Oficina'],
            ['tipo'=>'Lente fotográfico Canon 50mm','codigo'=>'51056416-3','estado_fisico'=>'Buen estado','ubicacion'=>'Oficina'],
            ['tipo'=>'Lente fotográfico Canon 50mm','codigo'=>'51056416-4','estado_fisico'=>'Buen estado','ubicacion'=>'Oficina'],

            // Lente fotográfico Canon 18-135mm
            ['tipo'=>'Lente fotográfico Canon 18-135mm','codigo'=>'51056417-1','estado_fisico'=>'Buen estado','ubicacion'=>'Oficina'],
            ['tipo'=>'Lente fotográfico Canon 18-135mm','codigo'=>'51056417-2','estado_fisico'=>'Buen estado','ubicacion'=>'Oficina'],

            // ================= ILUMINACIÓN =================

            // Luz LED Visico Full Color 80R II
            ['tipo'=>'Luz LED Visico Full Color 80R II','codigo'=>'051056385-1','estado_fisico'=>'Buen estado','ubicacion'=>'Oficina','observacion'=>'Incluye baterías, cargador, cable de corriente y atril'],
            ['tipo'=>'Luz LED Visico Full Color 80R II','codigo'=>'051056385-2','estado_fisico'=>'Buen estado','ubicacion'=>'Oficina','observacion'=>'Incluye baterías, cargador, cable de corriente y atril'],
            ['tipo'=>'Luz LED Visico Full Color 80R II','codigo'=>'051056385-3','estado_fisico'=>'Buen estado','ubicacion'=>'Oficina','observacion'=>'Incluye baterías, cargador, cable de corriente y atril'],
            ['tipo'=>'Luz LED Visico Full Color 80R II','codigo'=>'051056385-4','estado_fisico'=>'Buen estado','ubicacion'=>'Oficina','observacion'=>'Incluye baterías, cargador, cable de corriente y atril'],

            // Luz LED Visico FT650R
            ['tipo'=>'Luz LED Visico FT650R','codigo'=>'2401R100357','estado_fisico'=>'Buen estado','ubicacion'=>'Oficina','observacion'=>'Incluye baterías, cargador, cable de corriente y atril'],
            ['tipo'=>'Luz LED Visico FT650R','codigo'=>'2401R100362','estado_fisico'=>'Buen estado','ubicacion'=>'Oficina','observacion'=>'Incluye baterías, cargador, cable de corriente y atril'],
            ['tipo'=>'Luz LED Visico FT650R','codigo'=>'2401R100354','estado_fisico'=>'Buen estado','ubicacion'=>'Oficina','observacion'=>'Incluye baterías, cargador, cable de corriente y atril'],
            ['tipo'=>'Luz LED Visico FT650R','codigo'=>'2401R100355','estado_fisico'=>'Buen estado','ubicacion'=>'Oficina','observacion'=>'Incluye baterías, cargador, cable de corriente y atril'],

            // Luz LED GODOX 500 LRC
            ['tipo'=>'Luz LED GODOX 500 LRC','codigo'=>'051055977-1','estado_fisico'=>'Buen estado','ubicacion'=>'Oficina','observacion'=>'Incluye baterías, cargador, cable de corriente y atril'],
            ['tipo'=>'Luz LED GODOX 500 LRC','codigo'=>'051055977-2','estado_fisico'=>'Buen estado','ubicacion'=>'Oficina','observacion'=>'Incluye baterías, cargador, cable de corriente y atril'],
            ['tipo'=>'Luz LED GODOX 500 LRC','codigo'=>'051055977-3','estado_fisico'=>'Buen estado','ubicacion'=>'Oficina','observacion'=>'Incluye baterías, cargador, cable de corriente y atril'],
            ['tipo'=>'Luz LED GODOX 500 LRC','codigo'=>'051055977-4','estado_fisico'=>'Buen estado','ubicacion'=>'Oficina','observacion'=>'Incluye baterías, cargador, cable de corriente y atril'],
            ['tipo'=>'Luz LED GODOX 500 LRC','codigo'=>'051055977-5','estado_fisico'=>'Buen estado','ubicacion'=>'Oficina','observacion'=>'Incluye baterías, cargador, cable de corriente y atril'],
            ['tipo'=>'Luz LED GODOX 500 LRC','codigo'=>'051055977-6','estado_fisico'=>'Buen estado','ubicacion'=>'Oficina','observacion'=>'Incluye baterías, cargador, cable de corriente y atril'],

            // ================= COMPUTACIONAL =================

            // Tableta Digitalizadora WACOM Intuos Draw
            ['tipo'=>'Tableta Digitalizadora WACOM Intuos Draw','codigo'=>'991020350-1','estado_fisico'=>'Buen estado','ubicacion'=>'Oficina','observacion'=>'Incluye cable USB y lápiz digital'],
            ['tipo'=>'Tableta Digitalizadora WACOM Intuos Draw','codigo'=>'991020350-2','estado_fisico'=>'Buen estado','ubicacion'=>'Oficina','observacion'=>'Incluye cable USB y lápiz digital'],
            ['tipo'=>'Tableta Digitalizadora WACOM Intuos Draw','codigo'=>'991020350-3','estado_fisico'=>'Buen estado','ubicacion'=>'Oficina','observacion'=>'Incluye cable USB y lápiz digital'],
            ['tipo'=>'Tableta Digitalizadora WACOM Intuos Draw','codigo'=>'991020350-4','estado_fisico'=>'Buen estado','ubicacion'=>'Oficina','observacion'=>'Incluye cable USB y lápiz digital'],
            ['tipo'=>'Tableta Digitalizadora WACOM Intuos Draw','codigo'=>'991020350-5','estado_fisico'=>'Buen estado','ubicacion'=>'Oficina','observacion'=>'Incluye cable USB y lápiz digital'],
            ['tipo'=>'Tableta Digitalizadora WACOM Intuos Draw','codigo'=>'991020350-6','estado_fisico'=>'Buen estado','ubicacion'=>'Oficina','observacion'=>'Incluye cable USB y lápiz digital'],
            ['tipo'=>'Tableta Digitalizadora WACOM Intuos Draw','codigo'=>'991020350-7','estado_fisico'=>'Buen estado','ubicacion'=>'Oficina','observacion'=>'Incluye cable USB y lápiz digital'],
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
