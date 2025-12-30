<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\TipoEquipo;

class TipoEquiposSeeder extends Seeder
{
    public function run(): void
    {
        $tipos = [

            // ================= FOTOGRAFÍA =================
            ['categoria_id'=>1,'nombre'=>'Cámara Canon T3i','marca'=>'Canon','modelo'=>'T3i','descripcion'=>null],
            ['categoria_id'=>1,'nombre'=>'Cámara Canon T5i','marca'=>'Canon','modelo'=>'T5i','descripcion'=>null],
            ['categoria_id'=>1,'nombre'=>'Cámara Canon SL3','marca'=>'Canon','modelo'=>'SL3','descripcion'=>null],
            ['categoria_id'=>1,'nombre'=>'Trípode Manfrotto','marca'=>'Manfrotto','modelo'=>'Foto','descripcion'=>null],
            ['categoria_id'=>1,'nombre'=>'Flash de estudio','marca'=>'Genérico','modelo'=>'Flash','descripcion'=>null],
            ['categoria_id'=>1,'nombre'=>'Telón de fondo','marca'=>'Genérico','modelo'=>'Telón','descripcion'=>null],
            ['categoria_id'=>1,'nombre'=>'Softbox','marca'=>'Genérico','modelo'=>'Softbox','descripcion'=>null],
            ['categoria_id'=>1,'nombre'=>'Lente Canon','marca'=>'Canon','modelo'=>'Lentes','descripcion'=>null],
            ['categoria_id'=>1,'nombre'=>'Reflector','marca'=>'Genérico','modelo'=>'Reflector','descripcion'=>null],

            // ================= AUDIOVISUAL =================
            ['categoria_id'=>2,'nombre'=>'Micrófono Lavalier RODE','marca'=>'RODE','modelo'=>'Lavalier','descripcion'=>null],
            ['categoria_id'=>2,'nombre'=>'Micrófono Shotgun RODE','marca'=>'RODE','modelo'=>'Shotgun','descripcion'=>null],
            ['categoria_id'=>2,'nombre'=>'Micrófono Shure','marca'=>'Shure','modelo'=>'Mic','descripcion'=>null],
            ['categoria_id'=>2,'nombre'=>'Luz LED','marca'=>'Genérico','modelo'=>'LED','descripcion'=>null],
            ['categoria_id'=>2,'nombre'=>'Estabilizador FeiyuTech Mini 2','marca'=>'FeiyuTech','modelo'=>'Mini 2','descripcion'=>null],
            ['categoria_id'=>2,'nombre'=>'DJI Osmo Pocket 3','marca'=>'DJI','modelo'=>'Osmo Pocket 3','descripcion'=>null],
            ['categoria_id'=>2,'nombre'=>'Insta360 ONE RS','marca'=>'Insta360','modelo'=>'ONE RS','descripcion'=>null],
            ['categoria_id'=>2,'nombre'=>'Insta360 ONE RS Twin','marca'=>'Insta360','modelo'=>'Twin Edition','descripcion'=>null],
            ['categoria_id'=>2,'nombre'=>'Blimp Rode','marca'=>'RODE','modelo'=>'Blimp','descripcion'=>null],
            ['categoria_id'=>2,'nombre'=>'Trípode de luces','marca'=>'Genérico','modelo'=>'Luces','descripcion'=>null],
            ['categoria_id'=>2,'nombre'=>'Trípode de video','marca'=>'Genérico','modelo'=>'Video','descripcion'=>null],

            // ================= COMPUTACIONAL =================
            ['categoria_id'=>3,'nombre'=>'iMac 21.5"','marca'=>'Apple','modelo'=>'21.5','descripcion'=>null],
            ['categoria_id'=>3,'nombre'=>'Disco Duro Externo','marca'=>'Transcend','modelo'=>'1TB','descripcion'=>null],
            ['categoria_id'=>3,'nombre'=>'USB-C Hub','marca'=>'Philco','modelo'=>'6 en 1','descripcion'=>null],

            // ================= UTA TV =================
            ['categoria_id'=>2,'nombre'=>'Canon XA60','marca'=>'Canon','modelo'=>'XA60','descripcion'=>null],
            ['categoria_id'=>2,'nombre'=>'Vaddio Robótica','marca'=>'Vaddio','modelo'=>'Robotica','descripcion'=>null],
            ['categoria_id'=>2,'nombre'=>'Hollyland','marca'=>'Hollyland','modelo'=>'Mic System','descripcion'=>null],
            ['categoria_id'=>2,'nombre'=>'Micrófono Rode','marca'=>'RODE','modelo'=>'Mic','descripcion'=>null],

            // ================= NOTEBOOKS =================
            [
                'categoria_id' => 3,
                'nombre'       => 'Notebook HP ZBook 15v',
                'marca'        => 'Hewlett Packard',
                'modelo'       => 'ZBook 15v',
                'descripcion'  => 'Notebook Intel Core i7-8750H, 32GB RAM, SSD 256GB + HDD 1TB, Windows 10 Pro, pantalla 15.6"'
            ],
        ];

        foreach ($tipos as $tipo) {
            TipoEquipo::firstOrCreate(
                [
                    'categoria_id' => $tipo['categoria_id'],
                    'nombre'       => $tipo['nombre'],
                ],
                $tipo
            );
        }
    }
}
