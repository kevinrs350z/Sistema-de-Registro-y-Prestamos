<?php

namespace App\Enums;

final class CategoriaFalta
{
    // ── LEVES ──
    public const BATERIA_DESCARGADA         = 'BATERIA_DESCARGADA';
    public const RETRASO_MENOR_30MIN        = 'RETRASO_MENOR_30MIN';
    public const NO_INFORMAR_PROBLEMA_MENOR = 'NO_INFORMAR_PROBLEMA_MENOR';
    public const ENTREGA_DESORDENADA        = 'ENTREGA_DESORDENADA';

    // ── MEDIAS ──
    public const RETRASO_MAYOR_30MIN           = 'RETRASO_MAYOR_30MIN';
    public const REINCIDENCIA_LEVES            = 'REINCIDENCIA_LEVES';
    public const ACCESORIOS_FALTANTES          = 'ACCESORIOS_FALTANTES';
    public const USO_ASIGNATURA_DISTINTA       = 'USO_ASIGNATURA_DISTINTA';
    public const NO_REPORTAR_DANO_LEVE         = 'NO_REPORTAR_DANO_LEVE';
    public const MANIPULACION_SIN_AUTORIZACION = 'MANIPULACION_SIN_AUTORIZACION';
    public const USO_FUERA_CAMPUS              = 'USO_FUERA_CAMPUS';

    // ── GRAVES ──
    public const DANO_POR_NEGLIGENCIA             = 'DANO_POR_NEGLIGENCIA';
    public const PERDIDA_EQUIPO_ACCESORIOS        = 'PERDIDA_EQUIPO_ACCESORIOS';
    public const PRESTAMO_TERCEROS                = 'PRESTAMO_TERCEROS';
    public const ALTERACION_INTENCIONAL           = 'ALTERACION_INTENCIONAL';
    public const RETENCION_24H_SIN_JUSTIFICACION  = 'RETENCION_24H_SIN_JUSTIFICACION';
    public const REINCIDENCIA_MEDIAS              = 'REINCIDENCIA_MEDIAS';

    // ── GRAVÍSIMAS ──
    public const NO_DEVOLVER_EQUIPO                 = 'NO_DEVOLVER_EQUIPO';
    public const REINCIDENCIA_GRAVES                = 'REINCIDENCIA_GRAVES';
    public const DESCONOCIMIENTO_PARADERO           = 'DESCONOCIMIENTO_PARADERO';
    public const APROPIACION_INDEBIDA               = 'APROPIACION_INDEBIDA';
    public const REINCIDENCIA_GRAVE_INTENCIONAL     = 'REINCIDENCIA_GRAVE_INTENCIONAL';
    public const DETERIORO_INTENCIONAL_SIGNIFICATIVO = 'DETERIORO_INTENCIONAL_SIGNIFICATIVO';
    public const OCULTAMIENTO_INFORMACION           = 'OCULTAMIENTO_INFORMACION';
    public const CONDUCTA_SUMARIO                   = 'CONDUCTA_SUMARIO';

    // ── Especial (generado por sistema en escalamiento automático) ──
    public const REINCIDENCIA_ACUMULADA = 'REINCIDENCIA_ACUMULADA';

    /**
     * Todas las categorías disponibles.
     */
    public static function all(): array
    {
        $all = [];
        foreach (self::porNivel() as $cats) {
            foreach ($cats as $c) {
                $all[] = $c;
            }
        }
        $all[] = self::REINCIDENCIA_ACUMULADA;
        return array_unique($all);
    }

    public static function isValid(string $cat): bool
    {
        return in_array(strtoupper($cat), self::all(), true);
    }

    /**
     * Categorías agrupadas por nivel de sanción.
     * Cada nivel devuelve un array de constantes aplicables.
     */
    public static function porNivel(?string $nivel = null): array
    {
        $mapa = [
            'LEVE' => [
                self::BATERIA_DESCARGADA,
                self::RETRASO_MENOR_30MIN,
                self::NO_INFORMAR_PROBLEMA_MENOR,
                self::ENTREGA_DESORDENADA,
            ],
            'MEDIA' => [
                self::RETRASO_MAYOR_30MIN,
                self::REINCIDENCIA_LEVES,
                self::ACCESORIOS_FALTANTES,
                self::USO_ASIGNATURA_DISTINTA,
                self::NO_REPORTAR_DANO_LEVE,
                self::MANIPULACION_SIN_AUTORIZACION,
                self::USO_FUERA_CAMPUS,
            ],
            'GRAVE' => [
                self::DANO_POR_NEGLIGENCIA,
                self::PERDIDA_EQUIPO_ACCESORIOS,
                self::PRESTAMO_TERCEROS,
                self::ALTERACION_INTENCIONAL,
                self::RETENCION_24H_SIN_JUSTIFICACION,
                self::REINCIDENCIA_MEDIAS,
            ],
            'GRAVISIMA' => [
                self::NO_DEVOLVER_EQUIPO,
                self::REINCIDENCIA_GRAVES,
                self::DESCONOCIMIENTO_PARADERO,
                self::APROPIACION_INDEBIDA,
                self::REINCIDENCIA_GRAVE_INTENCIONAL,
                self::DETERIORO_INTENCIONAL_SIGNIFICATIVO,
                self::OCULTAMIENTO_INFORMACION,
                self::CONDUCTA_SUMARIO,
            ],
        ];

        if ($nivel) {
            return $mapa[strtoupper($nivel)] ?? [];
        }

        return $mapa;
    }

    /**
     * Etiquetas legibles en español para cada categoría.
     */
    public static function labels(): array
    {
        return [
            // Leves
            self::BATERIA_DESCARGADA         => 'Entregar equipo con batería descargada',
            self::RETRASO_MENOR_30MIN        => 'Retraso menor a 30 minutos en la devolución',
            self::NO_INFORMAR_PROBLEMA_MENOR => 'No informar oportunamente un problema menor',
            self::ENTREGA_DESORDENADA        => 'Entregar equipo sin el debido orden',

            // Medias
            self::RETRASO_MAYOR_30MIN           => 'Retraso superior a 30 minutos en la devolución',
            self::REINCIDENCIA_LEVES            => 'Reincidencia en faltas leves (3 leves → 1 media)',
            self::ACCESORIOS_FALTANTES          => 'Entregar equipo con accesorios faltantes',
            self::USO_ASIGNATURA_DISTINTA       => 'Uso del equipo en asignatura distinta a la declarada',
            self::NO_REPORTAR_DANO_LEVE         => 'No reportar un daño leve ocurrido durante el uso',
            self::MANIPULACION_SIN_AUTORIZACION => 'Manipular configuraciones internas sin autorización',
            self::USO_FUERA_CAMPUS              => 'Utilizar el equipo fuera del campus sin autorización',

            // Graves
            self::DANO_POR_NEGLIGENCIA            => 'Daño por negligencia comprobada',
            self::PERDIDA_EQUIPO_ACCESORIOS       => 'Pérdida del equipo o accesorios críticos',
            self::PRESTAMO_TERCEROS               => 'Prestar el equipo a terceros no autorizados',
            self::ALTERACION_INTENCIONAL          => 'Alteración intencional del equipo',
            self::RETENCION_24H_SIN_JUSTIFICACION => 'Retener el equipo más de 24h sin justificación',
            self::REINCIDENCIA_MEDIAS             => 'Reincidencia tras sanción media (2 medias → 1 grave)',

            // Gravísimas
            self::NO_DEVOLVER_EQUIPO                 => 'No devolver el equipo',
            self::REINCIDENCIA_GRAVES                => 'Reincidencia en faltas graves (2 graves → 1 gravísima)',
            self::DESCONOCIMIENTO_PARADERO           => 'Declarar desconocimiento del paradero del equipo',
            self::APROPIACION_INDEBIDA               => 'Apropiación indebida del equipo',
            self::REINCIDENCIA_GRAVE_INTENCIONAL     => 'Reincidencia grave con intención comprobada',
            self::DETERIORO_INTENCIONAL_SIGNIFICATIVO => 'Deterioro intencional significativo',
            self::OCULTAMIENTO_INFORMACION           => 'Ocultamiento deliberado de información',
            self::CONDUCTA_SUMARIO                   => 'Conducta que derive en proceso de sumario',

            // Sistema
            self::REINCIDENCIA_ACUMULADA => 'Reincidencia acumulada (automático)',
        ];
    }

    /**
     * Devuelve las categorías con labels, agrupadas por nivel.
     * Formato: ['LEVE' => [['value'=>..., 'label'=>...], ...], ...]
     */
    public static function porNivelConLabels(): array
    {
        $labels = self::labels();
        $result = [];

        foreach (self::porNivel() as $nivel => $categorias) {
            $result[$nivel] = array_map(function ($cat) use ($labels) {
                return [
                    'value' => $cat,
                    'label' => $labels[$cat] ?? $cat,
                ];
            }, $categorias);
        }

        return $result;
    }
}
