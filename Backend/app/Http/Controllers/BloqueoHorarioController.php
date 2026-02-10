<?php

namespace App\Http\Controllers;

use App\Models\BloqueoHorario;
use Illuminate\Http\Request;

class BloqueoHorarioController extends Controller
{
    public function index(Request $request)
    {
        $tipoEquipoId = $request->query('tipo_equipo_id');

        $query = BloqueoHorario::query()->where('activo', true);

        if ($tipoEquipoId) {
            $query->where('idTipoEquipo', $tipoEquipoId);
        }

        return response()->json($query->get());
    }

    public function store(Request $request)
    {
        $data = $request->validate([
            'dia_semana' => ['required', 'integer', 'between:1,7'],
            'idBloque' => ['required', 'integer', 'exists:bloques,idBloque'],
            'idTipoEquipo' => ['required', 'integer', 'exists:tipo_equipos,id'],
            'activo' => ['required', 'boolean'],
            'motivo' => ['nullable', 'string'],
        ]);

        $data['creado_por'] = auth()->user()?->idUser;

        $registro = BloqueoHorario::updateOrCreate(
            [
                'dia_semana' => $data['dia_semana'],
                'idBloque' => $data['idBloque'],
                'idTipoEquipo' => $data['idTipoEquipo'],
            ],
            [
                'activo' => $data['activo'],
                'motivo' => $data['motivo'] ?? null,
                'creado_por' => $data['creado_por'],
            ]
        );

        return response()->json([
            'message' => 'Bloqueo actualizado correctamente.',
            'data' => $registro,
        ]);
    }
}
