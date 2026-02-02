<?php

namespace App\Http\Controllers;

use App\Models\TipoEquipo;
use App\Models\TipoEquipoRelacionado;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

/**
 * Controlador para gestionar relaciones entre tipos de equipo.
 * 
 * Permite agrupar tipos de equipo que comparten el mismo límite máximo de préstamo.
 * Por ejemplo: diferentes modelos de cámaras pueden relacionarse para que el límite
 * se aplique al grupo completo.
 */
class TipoEquipoRelacionadoController extends Controller
{
    /**
     * Listar todos los tipos de equipo con sus relaciones.
     */
    public function index()
    {
        $tipos = TipoEquipo::with(['categoria'])
            ->select('id', 'nombre', 'categoria_id', 'maximo_prestamo')
            ->get()
            ->map(function ($tipo) {
                $relacionados = $this->obtenerRelacionados($tipo->id);
                return [
                    'id' => $tipo->id,
                    'nombre' => $tipo->nombre,
                    'categoria' => $tipo->categoria->nombre ?? null,
                    'maximo_prestamo' => $tipo->maximo_prestamo,
                    'relacionados' => $relacionados,
                ];
            });

        return response()->json($tipos, 200);
    }

    /**
     * Obtener relaciones de un tipo específico.
     */
    public function show($id)
    {
        $tipo = TipoEquipo::with('categoria')->findOrFail($id);
        $relacionados = $this->obtenerRelacionados($id);

        return response()->json([
            'id' => $tipo->id,
            'nombre' => $tipo->nombre,
            'categoria' => $tipo->categoria->nombre ?? null,
            'maximo_prestamo' => $tipo->maximo_prestamo,
            'relacionados' => $relacionados,
        ], 200);
    }

    /**
     * Crear una relación entre dos tipos de equipo.
     */
    public function store(Request $request)
    {
        $request->validate([
            'tipo_equipo_id' => 'required|integer|exists:tipo_equipos,id',
            'relacionado_id' => 'required|integer|exists:tipo_equipos,id|different:tipo_equipo_id',
        ]);

        $tipoId = $request->tipo_equipo_id;
        $relacionadoId = $request->relacionado_id;

        // Verificar que no exista ya (en ninguna dirección)
        $existe = TipoEquipoRelacionado::where(function ($q) use ($tipoId, $relacionadoId) {
            $q->where('tipo_equipo_id', $tipoId)->where('relacionado_id', $relacionadoId);
        })->orWhere(function ($q) use ($tipoId, $relacionadoId) {
            $q->where('tipo_equipo_id', $relacionadoId)->where('relacionado_id', $tipoId);
        })->exists();

        if ($existe) {
            return response()->json([
                'error' => 'Esta relación ya existe.',
            ], 409);
        }

        $relacion = TipoEquipoRelacionado::create([
            'tipo_equipo_id' => $tipoId,
            'relacionado_id' => $relacionadoId,
        ]);

        return response()->json([
            'message' => 'Relación creada correctamente.',
            'relacion' => $relacion,
        ], 201);
    }

    /**
     * Eliminar una relación entre dos tipos de equipo.
     */
    public function destroy(Request $request)
    {
        $request->validate([
            'tipo_equipo_id' => 'required|integer',
            'relacionado_id' => 'required|integer',
        ]);

        $tipoId = $request->tipo_equipo_id;
        $relacionadoId = $request->relacionado_id;

        // Eliminar en ambas direcciones (por si acaso)
        $deleted = TipoEquipoRelacionado::where(function ($q) use ($tipoId, $relacionadoId) {
            $q->where('tipo_equipo_id', $tipoId)->where('relacionado_id', $relacionadoId);
        })->orWhere(function ($q) use ($tipoId, $relacionadoId) {
            $q->where('tipo_equipo_id', $relacionadoId)->where('relacionado_id', $tipoId);
        })->delete();

        if ($deleted === 0) {
            return response()->json([
                'error' => 'No existe la relación especificada.',
            ], 404);
        }

        return response()->json([
            'message' => 'Relación eliminada correctamente.',
        ], 200);
    }

    /**
     * Obtener todos los relacionados de un tipo (bidireccional).
     */
    private function obtenerRelacionados(int $tipoId): array
    {
        // Donde este tipo es el principal
        $como = TipoEquipoRelacionado::where('tipo_equipo_id', $tipoId)
            ->join('tipo_equipos', 'tipo_equipos.id', '=', 'tipo_equipo_relacionados.relacionado_id')
            ->select('tipo_equipos.id', 'tipo_equipos.nombre')
            ->get();

        // Donde este tipo es el relacionado
        $de = TipoEquipoRelacionado::where('relacionado_id', $tipoId)
            ->join('tipo_equipos', 'tipo_equipos.id', '=', 'tipo_equipo_relacionados.tipo_equipo_id')
            ->select('tipo_equipos.id', 'tipo_equipos.nombre')
            ->get();

        // Combinar y eliminar duplicados
        $todos = $como->merge($de)->unique('id')->values();

        return $todos->toArray();
    }

    /**
     * Obtener sugerencias de tipos que podrían relacionarse (misma categoría).
     */
    public function sugerencias($id)
    {
        $tipo = TipoEquipo::findOrFail($id);
        
        // Obtener IDs ya relacionados
        $relacionadosIds = collect($this->obtenerRelacionados($id))->pluck('id')->toArray();
        $relacionadosIds[] = $id; // Excluir a sí mismo

        // Sugerir tipos de la misma categoría que no estén relacionados
        $sugerencias = TipoEquipo::where('categoria_id', $tipo->categoria_id)
            ->whereNotIn('id', $relacionadosIds)
            ->select('id', 'nombre', 'maximo_prestamo')
            ->get();

        return response()->json($sugerencias, 200);
    }
}
