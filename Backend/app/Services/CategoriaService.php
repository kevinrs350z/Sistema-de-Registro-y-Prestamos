<?php
namespace App\Services;
use App\Models\Categoria;
use App\Models\User;

class CategoriaService
{
    function getAll()
    {
        return Categoria::query()
            ->withCount('encargados')
            ->orderBy('nombre', 'asc')
            ->get();
    }

    function getById($id)
    {
        return Categoria::with([
                'encargados.persona'
            ])
            ->withCount('encargados')
            ->findOrFail($id);
    }

    function create($data)
    {
        $categoria = Categoria::create([
            'nombre'      => $data['nombre'],
            'descripcion' => $data['descripcion'] ?? null,
            'icono'       => $data['icono'] ?? 'bi-tag',
            'activo'      => $data['activo'] ?? true,
        ]);
            
        return $categoria;
    }

    function update($id, $data)
    {  
        $categoria = Categoria::findOrFail($id);

        if (array_key_exists('nombre', $data)) {
            $categoria->nombre = $data['nombre'];
        }

        if (array_key_exists('descripcion', $data)) {
            $categoria->descripcion = $data['descripcion'];
        }

        if (array_key_exists('icono', $data)) {
            $categoria->icono = $data['icono'];
        }

        if (array_key_exists('activo', $data)) {
            $categoria->activo = (bool) $data['activo'];
        }

    
        $categoria->save();

            
        return $categoria;
    }

    public function delete($id)
    {
        $categoria = Categoria::findOrFail($id);

        // Verificar relaciones
        if ($categoria->tipoEquipos()->exists()) {
            return [
                'error' => true,
                'message' => 'No se puede eliminar la categoría, tiene tipos de equipo asociados.'
            ];
        }

        $categoria->delete();

        return [
            'error' => false,
            'message' => 'Categoría eliminada correctamente.'
        ];
    }

    public function actualizarEstado(int $id, bool $activo): Categoria
    {
        $categoria = Categoria::findOrFail($id);
        $categoria->activo = $activo;
        $categoria->save();

        return $categoria;
    }

    public function listarEncargados(int $categoriaId)
    {
        $categoria = Categoria::findOrFail($categoriaId);

        return $categoria->encargados()
            ->with('persona')
            ->get();
    }

    public function agregarEncargados(int $categoriaId, array $userIds): array
    {
        $categoria = Categoria::findOrFail($categoriaId);

        $userIds = array_values(array_unique(array_filter($userIds)));
        if (empty($userIds)) {
            return [];
        }

        $validos = User::whereIn('idUser', $userIds)
            ->where('estado', 'ACTIVO')
            ->whereHas('roles', function ($q) {
                $q->whereIn('Nombre', ['ADMIN', 'SUPER_USUARIO']);
            })
            ->pluck('idUser')
            ->toArray();

        $invalidos = array_values(array_diff($userIds, $validos));

        if (!empty($invalidos)) {
            throw new \InvalidArgumentException('USUARIOS_INVALIDOS', 422);
        }

        $categoria->encargados()->syncWithoutDetaching($validos);

        return $this->listarEncargados($categoriaId)->toArray();
    }

    public function quitarEncargado(int $categoriaId, int $userId): void
    {
        $categoria = Categoria::findOrFail($categoriaId);
        $categoria->encargados()->detach($userId);
    }

}