<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

/**
 * Seeder para poblar el catálogo de tipos de falla.
 * 
 * Categorías:
 * - CAM: Cámaras y equipos de video
 * - AUD: Equipos de audio y grabación
 * - IT: Notebooks, tablets, computación
 * - MECH: Trípodes, soportes, equipos mecánicos
 * - PWR: Energía, cables, adaptadores
 * - USR: Fallas por uso inadecuado
 * - INV: Fallas de inventario/administrativas
 */
class TiposFallaSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $tiposFalla = [
            // ============================================
            // CAM - Cámaras y equipos de video
            // ============================================
            [
                'codigo' => 'CAM_LENTE',
                'nombre' => 'Falla de lente/óptica',
                'descripcion' => 'Problemas con el lente: rayones, desenfoque, zoom atascado, fungus, tapa dañada',
                'categoria' => 'CAM',
                'activo' => true,
            ],
            [
                'codigo' => 'CAM_SENSOR',
                'nombre' => 'Falla de sensor de imagen',
                'descripcion' => 'Píxeles muertos, manchas en sensor, ruido excesivo, sensor dañado',
                'categoria' => 'CAM',
                'activo' => true,
            ],
            [
                'codigo' => 'CAM_PANTALLA',
                'nombre' => 'Falla de pantalla/visor',
                'descripcion' => 'Pantalla LCD rota, visor electrónico defectuoso, retroiluminación fallida',
                'categoria' => 'CAM',
                'activo' => true,
            ],
            [
                'codigo' => 'CAM_ALIM',
                'nombre' => 'Falla de alimentación de cámara',
                'descripcion' => 'No carga batería, no enciende, compartimiento de batería dañado',
                'categoria' => 'CAM',
                'activo' => true,
            ],
            [
                'codigo' => 'CAM_PUERTOS',
                'nombre' => 'Falla de puertos/conectores',
                'descripcion' => 'Puerto HDMI, USB, audio dañado, falso contacto en conectores',
                'categoria' => 'CAM',
                'activo' => true,
            ],
            [
                'codigo' => 'CAM_MEMORIA',
                'nombre' => 'Falla de almacenamiento',
                'descripcion' => 'Slot de tarjeta SD dañado, no reconoce memorias, corrupción de datos',
                'categoria' => 'CAM',
                'activo' => true,
            ],
            [
                'codigo' => 'CAM_FIRMWARE',
                'nombre' => 'Falla de firmware/software',
                'descripcion' => 'Errores de sistema, cámara se congela, actualización corrupta',
                'categoria' => 'CAM',
                'activo' => true,
            ],
            [
                'codigo' => 'CAM_ACCESORIOS',
                'nombre' => 'Falla de accesorios de cámara',
                'descripcion' => 'Flash integrado, micrófono interno, estabilizador óptico dañado',
                'categoria' => 'CAM',
                'activo' => true,
            ],

            // ============================================
            // AUD - Equipos de audio y grabación
            // ============================================
            [
                'codigo' => 'AUD_MIC',
                'nombre' => 'Falla de micrófono',
                'descripcion' => 'Micrófono no capta sonido, distorsión, cápsula dañada',
                'categoria' => 'AUD',
                'activo' => true,
            ],
            [
                'codigo' => 'AUD_ENTRADA',
                'nombre' => 'Falla de entrada/salida audio',
                'descripcion' => 'Conectores XLR/TRS dañados, phantom power no funciona',
                'categoria' => 'AUD',
                'activo' => true,
            ],
            [
                'codigo' => 'AUD_RUIDO',
                'nombre' => 'Ruido/interferencia',
                'descripcion' => 'Ruido de fondo excesivo, interferencia electromagnética, zumbido',
                'categoria' => 'AUD',
                'activo' => true,
            ],
            [
                'codigo' => 'AUD_ALIM',
                'nombre' => 'Falla de alimentación de audio',
                'descripcion' => 'No enciende, batería no carga, fuente de poder dañada',
                'categoria' => 'AUD',
                'activo' => true,
            ],
            [
                'codigo' => 'AUD_STORAGE',
                'nombre' => 'Falla de almacenamiento audio',
                'descripcion' => 'Grabadora no guarda, memoria interna llena o dañada',
                'categoria' => 'AUD',
                'activo' => true,
            ],
            [
                'codigo' => 'AUD_FIRMWARE',
                'nombre' => 'Falla de firmware audio',
                'descripcion' => 'Errores de sistema en grabadora, mixer o interfaz de audio',
                'categoria' => 'AUD',
                'activo' => true,
            ],

            // ============================================
            // IT - Notebooks, tablets, computación
            // ============================================
            [
                'codigo' => 'IT_PANTALLA',
                'nombre' => 'Falla de pantalla',
                'descripcion' => 'Pantalla rota, píxeles muertos, retroiluminación, parpadeo',
                'categoria' => 'IT',
                'activo' => true,
            ],
            [
                'codigo' => 'IT_BATERIA',
                'nombre' => 'Falla de batería',
                'descripcion' => 'Batería no carga, duración reducida, batería hinchada',
                'categoria' => 'IT',
                'activo' => true,
            ],
            [
                'codigo' => 'IT_ALMACENAMIENTO',
                'nombre' => 'Falla de almacenamiento',
                'descripcion' => 'Disco duro/SSD dañado, sectores defectuosos, lentitud extrema',
                'categoria' => 'IT',
                'activo' => true,
            ],
            [
                'codigo' => 'IT_RAM',
                'nombre' => 'Falla de memoria RAM',
                'descripcion' => 'Pantallazos azules, reinicios aleatorios, memoria no detectada',
                'categoria' => 'IT',
                'activo' => true,
            ],
            [
                'codigo' => 'IT_SOFTWARE',
                'nombre' => 'Falla de software',
                'descripcion' => 'Sistema operativo corrupto, virus, software de diseño no funciona',
                'categoria' => 'IT',
                'activo' => true,
            ],
            [
                'codigo' => 'IT_RED',
                'nombre' => 'Falla de red/conectividad',
                'descripcion' => 'WiFi no conecta, Bluetooth dañado, puerto Ethernet fallido',
                'categoria' => 'IT',
                'activo' => true,
            ],
            [
                'codigo' => 'IT_PUERTOS',
                'nombre' => 'Falla de puertos',
                'descripcion' => 'Puertos USB, HDMI, USB-C dañados o con falso contacto',
                'categoria' => 'IT',
                'activo' => true,
            ],
            [
                'codigo' => 'IT_FISICO',
                'nombre' => 'Daño físico',
                'descripcion' => 'Carcasa rota, bisagras dañadas, teclado con teclas faltantes',
                'categoria' => 'IT',
                'activo' => true,
            ],

            // ============================================
            // MECH - Trípodes, soportes, equipos mecánicos
            // ============================================
            [
                'codigo' => 'MECH_BLOQUEO',
                'nombre' => 'Sistema de bloqueo dañado',
                'descripcion' => 'Seguros de patas, cabezal o brazos no funcionan correctamente',
                'categoria' => 'MECH',
                'activo' => true,
            ],
            [
                'codigo' => 'MECH_FISICO',
                'nombre' => 'Daño estructural',
                'descripcion' => 'Patas dobladas, columna central dañada, base inestable',
                'categoria' => 'MECH',
                'activo' => true,
            ],
            [
                'codigo' => 'MECH_ROSCA',
                'nombre' => 'Rosca/montaje dañado',
                'descripcion' => 'Rosca de montaje 1/4" o 3/8" desgastada o rota',
                'categoria' => 'MECH',
                'activo' => true,
            ],
            [
                'codigo' => 'MECH_NIVEL',
                'nombre' => 'Nivel/nivelación dañado',
                'descripcion' => 'Burbuja de nivel rota, sistema de nivelación no funciona',
                'categoria' => 'MECH',
                'activo' => true,
            ],

            // ============================================
            // PWR - Energía, cables, adaptadores
            // ============================================
            [
                'codigo' => 'PWR_CABLE',
                'nombre' => 'Cable dañado',
                'descripcion' => 'Cable cortado, aislamiento dañado, conectores rotos',
                'categoria' => 'PWR',
                'activo' => true,
            ],
            [
                'codigo' => 'PWR_ADAPTADOR',
                'nombre' => 'Adaptador/cargador dañado',
                'descripcion' => 'Cargador no entrega voltaje, sobrecalentamiento, conector roto',
                'categoria' => 'PWR',
                'activo' => true,
            ],
            [
                'codigo' => 'PWR_PROTECCION',
                'nombre' => 'Dispositivo de protección dañado',
                'descripcion' => 'Regulador, UPS o protector de voltaje no funciona',
                'categoria' => 'PWR',
                'activo' => true,
            ],

            // ============================================
            // USR - Fallas por uso inadecuado
            // ============================================
            [
                'codigo' => 'USR_MALUSO',
                'nombre' => 'Daño por mal uso',
                'descripcion' => 'Equipo dañado por uso incorrecto, golpes, caídas, líquidos',
                'categoria' => 'USR',
                'activo' => true,
            ],

            // ============================================
            // INV - Fallas de inventario/administrativas
            // ============================================
            [
                'codigo' => 'INV_INCOMPLETO',
                'nombre' => 'Equipo incompleto',
                'descripcion' => 'Faltan accesorios, cables, manuales o componentes originales',
                'categoria' => 'INV',
                'activo' => true,
            ],
            [
                'codigo' => 'INV_EXTRAVIO',
                'nombre' => 'Equipo extraviado',
                'descripcion' => 'Equipo no localizado en inventario físico',
                'categoria' => 'INV',
                'activo' => true,
            ],
        ];

        foreach ($tiposFalla as $tipo) {
            DB::table('tipos_falla')->updateOrInsert(
                ['codigo' => $tipo['codigo']],
                array_merge($tipo, [
                    'created_at' => now(),
                    'updated_at' => now(),
                ])
            );
        }
    }
}
