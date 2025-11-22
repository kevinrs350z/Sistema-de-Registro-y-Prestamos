<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\Categoria;

class CategoriasSeeder extends Seeder
{
    /**
     * Run the database seeds.
     *
     * @return void
     */
    public function run()
    {
        Categoria::create([
            'nombre' => 'Audiovisual',
            'descripcion' => 'Equipos relacionados con producción audiovisual.'
        ]);

        Categoria::create([
            'nombre' => 'Fotografía',
            'descripcion' => 'Equipos para captura de imágenes fotográficas.'
        ]);

        Categoria::create([
            'nombre' => 'Equipo Computacional',
            'descripcion' => 'Computadores, notebooks y periféricos.'
        ]);

        Categoria::create([
            'nombre' => 'Iluminación',
            'descripcion' => 'Luces, reflectores y accesorios de iluminación.'
        ]);
    }
}
