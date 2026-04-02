<?php

namespace App\Http\Controllers;

use App\Models\Grupo;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;

/**
 * Controlador administrativo para la gestión de grupos.
 * Endpoints protegidos bajo /api/admin/grupos
 */
class AdminGrupoController extends Controller
{
    /**
     * Listar grupos con filtros y paginación.
     * GET /api/admin/grupos
     */
    public function index(Request $request)
    {
        $query = Grupo::with(['asignatura', 'bloque', 'docente.persona']);

        // Búsqueda por nombre
        if ($q = $request->input('q')) {
            $query->where('nombre', 'like', "%{$q}%");
        }

        // Filtro por año
        if ($anio = $request->input('anio')) {
            $query->where('anio', $anio);
        }

        // Filtro por semestre
        if ($semestre = $request->input('semestre')) {
            $query->where('semestre', $semestre);
        }

        // Filtro por asignatura
        if ($asignaturaId = $request->input('asignatura_id')) {
            $query->where('asignatura_id', $asignaturaId);
        }

        // Filtro por estado
        if ($estado = $request->input('estado')) {
            $query->where('estado', $estado);
        }

        // Filtro por docente (para que el profesor solo vea los suyos si aplica)
        if ($docenteId = $request->input('docente_id')) {
            $query->where('docente_id', $docenteId);
        }

        $query->orderBy('created_at', 'desc');

        $perPage = min((int) $request->input('per_page', 15), 100);
        $grupos = $query->paginate($perPage);

        return response()->json($grupos);
    }

    /**
     * Obtener detalle de un grupo con integrantes.
     * GET /api/admin/grupos/{id}
     */
    public function show($id)
    {
        $grupo = Grupo::with([
            'asignatura',
            'bloque',
            'docente.persona',
            'usuarios.persona',
            'prestamos'
        ])->findOrFail($id);

        // Formatear integrantes para el frontend
        $integrantes = $grupo->usuarios->map(function ($user) use ($grupo) {
            $pivot = DB::table('grupo_usuario')
                ->where('grupo_id', $grupo->id)
                ->where('usuario_id', $user->idUser)
                ->first();

            return [
                'id' => $user->idUser,
                'nombre' => trim(($user->persona->nombre ?? '') . ' ' . ($user->persona->apellido ?? '')),
                'rut' => $user->persona->rut ?? null,
                'email' => $user->email,
                'agregado_en' => $pivot?->created_at,
            ];
        });

        $response = $grupo->toArray();
        unset($response['usuarios']); // Quitar usuarios raw
        $response['integrantes'] = $integrantes;

        return response()->json($response);
    }

    /**
     * Crear un nuevo grupo.
     * POST /api/admin/grupos
     */
    public function store(Request $request)
    {
        $request->validate([
            'nombre' => 'required|string|max:255',
            'asignatura_id' => 'required|exists:asignaturas,idAsignatura',
            'bloque_id' => 'required|exists:bloques,idBloque',
            'docente_id' => 'nullable|exists:users,idUser',
            'descripcion' => 'nullable|string',
            'anio' => 'nullable|integer|min:2020|max:2100',
            'semestre' => 'nullable|integer|in:1,2',
            'usuarios' => 'nullable|array',
            'usuarios.*' => 'exists:users,idUser',
        ]);

        $grupo = DB::transaction(function () use ($request) {
            $grupo = Grupo::create([
                'nombre' => $request->nombre,
                'descripcion' => $request->descripcion,
                'asignatura_id' => $request->asignatura_id,
                'bloque_id' => $request->bloque_id,
                'docente_id' => $request->docente_id,
                'estado' => 'ACTIVO',
                'anio' => $request->anio ?? date('Y'),
                'semestre' => $request->semestre,
            ]);

            if ($request->has('usuarios') && is_array($request->usuarios)) {
                $grupo->usuarios()->attach($request->usuarios);
            }

            return $grupo;
        });

        return response()->json($grupo->load(['asignatura', 'bloque', 'docente.persona', 'usuarios.persona']), 201);
    }

    /**
     * Actualizar un grupo existente.
     * PATCH /api/admin/grupos/{id}
     */
    public function update(Request $request, $id)
    {
        $grupo = Grupo::findOrFail($id);

        $request->validate([
            'nombre' => 'sometimes|string|max:255',
            'asignatura_id' => 'nullable|exists:asignaturas,idAsignatura',
            'bloque_id' => 'nullable|exists:bloques,idBloque',
            'docente_id' => 'nullable|exists:users,idUser',
            'descripcion' => 'nullable|string',
            'anio' => 'nullable|integer|min:2020|max:2100',
            'semestre' => 'nullable|integer|in:1,2',
        ]);

        $grupo->update($request->only([
            'nombre',
            'descripcion',
            'asignatura_id',
            'bloque_id',
            'docente_id',
            'anio',
            'semestre',
        ]));

        return response()->json($grupo->load(['asignatura', 'bloque', 'docente.persona']));
    }

    /**
     * Cambiar estado del grupo (ACTIVO/CERRADO).
     * PATCH /api/admin/grupos/{id}/estado
     */
    public function actualizarEstado(Request $request, $id)
    {
        $request->validate([
            'estado' => 'required|in:ACTIVO,CERRADO',
        ]);

        $grupo = Grupo::findOrFail($id);
        $grupo->estado = $request->estado;
        $grupo->save();

        return response()->json([
            'message' => "Grupo marcado como {$request->estado}",
            'grupo' => $grupo,
        ]);
    }

    /**
     * Agregar integrantes a un grupo.
     * POST /api/admin/grupos/{id}/integrantes
     */
    public function addIntegrantes(Request $request, $id)
    {
        $request->validate([
            'usuarios' => 'required|array|min:1',
            'usuarios.*' => 'exists:users,idUser',
        ]);

        $grupo = Grupo::findOrFail($id);

        // Attach sin duplicar
        $grupo->usuarios()->syncWithoutDetaching($request->usuarios);

        return response()->json([
            'message' => 'Integrantes agregados correctamente',
            'grupo' => $grupo->load('usuarios.persona'),
        ]);
    }

    /**
     * Quitar un integrante de un grupo.
     * DELETE /api/admin/grupos/{id}/integrantes/{usuarioId}
     */
    public function removeIntegrante($id, $usuarioId)
    {
        $grupo = Grupo::findOrFail($id);
        $grupo->usuarios()->detach($usuarioId);

        return response()->json([
            'message' => 'Integrante removido correctamente',
            'grupo' => $grupo->load('usuarios.persona'),
        ]);
    }

    /**
     * Eliminar un grupo (solo admin).
     * DELETE /api/admin/grupos/{id}
     */
    public function destroy(Request $request, $id)
    {
        $grupo = Grupo::findOrFail($id);
        $grupo->delete();

        return response()->json(['message' => 'Grupo eliminado']);
    }
}
