<?php

namespace App\Services;

use App\Models\Pack;
use Illuminate\Support\Facades\DB;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;

class PackService
{
    /**
     * Listar packs paginados con equipos.
     */
    public function listarPaginado(int $perPage = 10)
    {
        return Pack::with([
                'equipos.tipo' // 👈 CLAVE
            ])
            ->orderByDesc('created_at')
            ->paginate($perPage);
    }

    /**
     * Cantidad de packs “armables” con equipos DISPONIBLES.
     * Como cada pack refiere a equipos físicos concretos, la disponibilidad es:
     *  - 1 si TODOS los equipos del pack están DISPONIBLES
     *  - 0 si al menos uno no lo está
     */
    public function cantidadDisponible(Pack $pack): int
    {
        $total = $pack->equipos->count();
        if ($total === 0) {
            return 0;
        }

        $disponibles = $pack->equipos->where('estado', 'DISPONIBLE')->count();

        return $disponibles === $total ? 1 : 0;
    }

    /**
     * Crear un pack con imagen y equipos.
     */
    public function crear(array $data)
    {
        return DB::transaction(function () use ($data) {

            // Imagen
            $imagenPath = null;
            if (isset($data['imagen'])) {
                $imagenPath = $data['imagen']->store('packs', 'public');
            }

            $pack = Pack::create([
                'nombre'      => $data['nombre'],
                'descripcion' => $data['descripcion'] ?? null,
                'imagen'      => $imagenPath,
            ]);

            // Relación con equipos
            $pack->equipos()->sync($data['equipos']);

            return $pack;
        });
    }

    public function actualizar(Pack $pack, array $data, ?UploadedFile $imagen): void
    {
        if ($imagen) {
            if ($pack->imagen) {
                Storage::disk('public')->delete($pack->imagen);
            }

            $data['imagen'] = $imagen->store('packs', 'public');
        }

        $pack->update([
            'nombre'      => $data['nombre'],
            'descripcion' => $data['descripcion'] ?? null,
            'imagen'      => $data['imagen'] ?? $pack->imagen,
        ]);

        // 🔥 CLAVE: sincronizar equipos
        $pack->equipos()->sync($data['equipos']);
    }

    /**
     * Eliminar pack (soft delete).
     */
    public function eliminar(Pack $pack): void
    {
        $pack->delete();
    }
}
