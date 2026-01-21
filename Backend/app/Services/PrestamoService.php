<?php

namespace App\Services;

use App\Models\Prestamo;
use App\Models\BloquePrestamo;
use App\Models\Pack;
use Illuminate\Support\Facades\DB;

class PrestamoService
{
    /**
     * Crear préstamo base (alumno o admin)
     */
    public function crearPrestamo(array $data): Prestamo
    {
        return Prestamo::create($data);
    }

    /**
     * Asignar bloques al préstamo
     */
    public function asignarBloques(int $idPrestamo, array $bloques, $idAsignatura = null): void
    {
        foreach ($bloques as $idBloque) {
            BloquePrestamo::create([
                'idPrestamo'   => $idPrestamo,
                'idBloque'     => $idBloque,
                'idAsignatura' => $idAsignatura,
            ]);
        }
    }

    /**
     * Procesar carrito de equipos
     */
    public function procesarEquipos(int $idPrestamo, array $equipos): void
    {
        foreach ($equipos as $item) {

            // ✅ LÓGICA DE PACKS
            if (isset($item['idPack'])) {
                $this->asignarPack($idPrestamo, $item['idPack']);
                continue;
            }

            $idTipo   = $item['idTipoEquipo'];
            $cantidad = $item['cantidad'];
            $modo     = $item['modo'];

            if ($modo === 'especifico') {
                $this->asignarEquiposEspecificos($idPrestamo, $idTipo, $cantidad, $item['equiposSeleccionados'] ?? []);
                continue;
            }

            $this->asignarEquiposCualquiera($idPrestamo, $idTipo, $cantidad);
        }
    }

    private function asignarPack(int $idPrestamo, int $idPack): void
    {
        $pack = Pack::with('equipos')->find($idPack);

        if (!$pack) {
            throw new \Exception("El pack seleccionado no existe.");
        }

        foreach ($pack->equipos as $equipo) {
            // Verificar disponibilidad del equipo específico del pack
            // Como es un pack físico pre-definido, validamos ESE equipo exacto
            if ($equipo->estado !== 'DISPONIBLE') {
                throw new \Exception("El equipo '{$equipo->codigo}' del pack no está disponible.");
            }

            $this->asignarEquipo($idPrestamo, $equipo->id);
        }
    }

    private function asignarEquiposEspecificos(int $idPrestamo, int $idTipo, int $cantidad, array $ids): void
    {
        if (count($ids) !== $cantidad) {
            throw new \Exception("Cantidad de equipos específicos incorrecta.");
        }

        $disponibles = DB::table('equipos')
            ->whereIn('id', $ids)
            ->where('tipo_equipo_id', $idTipo)
            ->where('estado', 'DISPONIBLE')
            ->whereNull('deleted_at')
            ->count();

        if ($disponibles !== $cantidad) {
            throw new \Exception("Algunos equipos no están disponibles.");
        }

        foreach ($ids as $idEquipo) {
            $this->asignarEquipo($idPrestamo, $idEquipo);
        }
    }

    private function asignarEquiposCualquiera(int $idPrestamo, int $idTipo, int $cantidad): void
    {
        $equipos = DB::table('equipos')
            ->where('tipo_equipo_id', $idTipo)
            ->where('estado', 'DISPONIBLE')
            ->whereNull('deleted_at')
            ->lockForUpdate()
            ->limit($cantidad)
            ->pluck('id');

        if ($equipos->count() < $cantidad) {
            throw new \Exception("Stock insuficiente.");
        }

        foreach ($equipos as $idEquipo) {
            $this->asignarEquipo($idPrestamo, $idEquipo);
        }
    }

    private function asignarEquipo(int $idPrestamo, int $idEquipo): void
    {
        DB::table('prestamo_equipo')->insert([
            'idPrestamo' => $idPrestamo,
            'idEquipo'   => $idEquipo,
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        DB::table('equipos')
            ->where('id', $idEquipo)
            ->update(['estado' => 'PRESTADO']);
    }
}
