<?php

namespace App\Http\Controllers;

use App\Models\BloqueoHorario;
use Illuminate\Http\Request;
use Carbon\Carbon;

class BloqueoHorarioController extends Controller
{
    public function index(Request $request)
    {
        $tipoEquipoId = $request->query('tipo_equipo_id');
        $weekStart = $request->query('week_start');

        $zonaHoraria = config('app.timezone', 'America/Santiago');

        $semanaInicio = $weekStart
            ? Carbon::parse($weekStart, $zonaHoraria)->startOfWeek(Carbon::MONDAY)->toDateString()
            : Carbon::now($zonaHoraria)->startOfWeek(Carbon::MONDAY)->toDateString();

        $query = BloqueoHorario::query()
            ->where('activo', true)
            ->where('semana_inicio', $semanaInicio);

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
            'week_start' => ['nullable', 'date'],
        ]);

        $zonaHoraria = config('app.timezone', 'America/Santiago');

        $data['semana_inicio'] = isset($data['week_start'])
            ? Carbon::parse($data['week_start'], $zonaHoraria)->startOfWeek(Carbon::MONDAY)->toDateString()
            : Carbon::now($zonaHoraria)->startOfWeek(Carbon::MONDAY)->toDateString();

        $data['creado_por'] = auth()->user()?->idUser;

        $registro = BloqueoHorario::updateOrCreate(
            [
                'semana_inicio' => $data['semana_inicio'],
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
