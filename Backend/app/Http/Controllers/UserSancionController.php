<?php

namespace App\Http\Controllers;

use App\Models\User;
use App\Models\Sancion;
use App\Models\Prestamo;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Mail;
use App\Mail\SancionNotificacion; // la creamos más abajo

class UserSancionController extends Controller
{
    // -------- PREFILL PARA SANCIÓN DESDE PRÉSTAMO FINALIZADO --------
    public function prefill(Request $request)
    {
        $request->validate([
            'prestamo_id' => 'required|integer'
        ]);

        $prestamo = Prestamo::with(['user.persona', 'equipos.tipo'])
            ->findOrFail($request->prestamo_id);

        if (!in_array($prestamo->estado, ['ENTREGADO', 'DEVUELTO'])) {
            return response()->json([
                'error' => 'El préstamo no está finalizado.'
            ], 422);
        }

        $persona = $prestamo->user?->persona;

        return response()->json([
            'prestamo' => [
                'idPrestamo'   => $prestamo->idPrestamo,
                'estado'       => $prestamo->estado,
                'fecha_inicio' => $prestamo->fecha_inicio,
                'fecha_fin'    => $prestamo->fecha_fin,
                'equipos'      => $prestamo->equipos->map(function ($e) {
                    return [
                        'id'     => $e->id,
                        'nombre' => $e->tipo->nombre ?? 'Equipo',
                        'codigo' => $e->codigo ?? '—'
                    ];
                })
            ],
            'usuario' => [
                'idUser'  => $prestamo->user?->idUser,
                'nombre'  => $persona?->Nombre ?? '',
                'apellido'=> $persona?->Apellido1 ?? '',
                'email'   => $prestamo->user?->Email ?? '',
                'rut'     => $persona?->Rut ?? ''
            ]
        ]);
    }
    // -------- ASIGNAR SANCION A UN USUARIO (ID, CORREO O RUT) --------
    public function asignarSancion(Request $request)
    {
        $request->validate([
            'usuario'      => 'required|string',     // puede ser id, correo o rut
            'idSancion'    => 'nullable|integer|exists:sancions,idSancion',
            'nivel'        => 'nullable|string',
            'descripcion'  => 'nullable|string',
            'fecha_inicio' => 'required|date',
            'fecha_fin'    => 'required|date|after_or_equal:fecha_inicio',
            'prestamo_id'  => 'nullable|integer|exists:prestamos,idPrestamo',
        ]);

        $identificador = $request->usuario;

        // Buscar usuario por idUser, Email o Rut (en persona)
        $userQuery = User::with('persona'); // asumiendo relación persona() en User

        if (is_numeric($identificador)) {
            $userQuery->where('idUser', $identificador);
        } elseif (str_contains($identificador, '@')) {
            $userQuery->where('Email', $identificador);
        } else {
            // Se asume que el rut está en tabla persona, campo Rut
            $userQuery->whereHas('persona', function ($q) use ($identificador) {
                $q->where('Rut', $identificador);
            });
        }

        $user = $userQuery->firstOrFail();

        // Resolver sanción desde catálogo
        $sancion = null;
        if ($request->idSancion) {
            $sancion = Sancion::findOrFail($request->idSancion);
        } elseif ($request->nivel) {
            $sancion = Sancion::where('nivel', $request->nivel)->firstOrFail();
        }

        // Asignar sanción en tabla pivote con auditoría
        $user->sanciones()->attach($sancion->idSancion, [
            'assigned_by' => auth()->user()?->idUser,
            'prestamo_id' => $request->prestamo_id,
            'descripcion' => $request->descripcion,
            'created_at'  => now(),
            'updated_at'  => now(),
        ]);

        // Enviar correo
       // Mail::to($user->Email)->send(
          //  new SancionNotificacion('asignada', $user, $sancion)
       // );

        return response()->json([
            'message' => 'Sanción creada y asignada correctamente.',
            'sancion' => $sancion,
            'usuario' => [
                'idUser'   => $user->idUser,
                'Email'    => $user->Email,
                'Rut'      => $user->persona->Rut ?? null,
                'Nombre'   => $user->persona->Nombre ?? null,
                'Apellido' => $user->persona->Apellido1 ?? null,
            ],
        ], 201);
    }

    public function catalogo()
    {
        $nivelesPermitidos = ['LEVE', 'MEDIA', 'GRAVE'];

        $catalogo = Sancion::select('idSancion', 'nivel', 'descripcion', 'estado')
            ->get()
            ->filter(function ($s) use ($nivelesPermitidos) {
                return in_array(strtoupper((string) $s->nivel), $nivelesPermitidos, true);
            })
            ->groupBy(function ($s) {
                return strtoupper((string) $s->nivel);
            })
            ->map(function ($group) {
                return $group->sortBy('idSancion')->first();
            })
            ->sortBy(function ($s) use ($nivelesPermitidos) {
                return array_search(strtoupper((string) $s->nivel), $nivelesPermitidos, true);
            })
            ->values();

        return response()->json([
            'sanciones' => $catalogo
        ]);
    }


    public function listarSanciones()
    {
        // Devolver sanciones ordenadas por fecha_inicio descendente (más recientes primero)
        $sanciones = Sancion::with(['users.persona'])
            ->orderBy('fecha_inicio', 'desc')
            ->orderBy('idSancion', 'desc')
            ->get();

        // Enriquecer con información del admin que asignó
        $assignedIds = $sanciones->flatMap(function ($s) {
            return $s->users->map(fn ($u) => $u->pivot?->assigned_by)->filter();
        })->unique()->values();

        $assignedUsers = User::with('persona')
            ->whereIn('idUser', $assignedIds)
            ->get()
            ->keyBy('idUser');

        $sanciones = $sanciones->map(function ($s) use ($assignedUsers) {
            $s->users->each(function ($u) use ($assignedUsers) {
                $assigned = $assignedUsers->get($u->pivot?->assigned_by);
                $u->pivot->assigned_by_nombre = $assigned?->persona?->Nombre ?? null;
                $u->pivot->assigned_by_apellido = $assigned?->persona?->Apellido1 ?? null;
                $u->pivot->assigned_by_email = $assigned?->Email ?? null;
            });
            return $s;
        });

        return response()->json([
            'message'   => 'Listado completo de sanciones con sus usuarios.',
            'sanciones' => $sanciones
        ]);
    }

    public function listarSancionesActivas()
    {
        // Listado de sanciones activas ordenadas por fecha inicio desc
        $sanciones = Sancion::with(['users.persona'])
            ->where('estado', 'ACTIVA')
            ->orderBy('fecha_inicio', 'desc')
            ->orderBy('idSancion', 'desc')
            ->get();

        $assignedIds = $sanciones->flatMap(function ($s) {
            return $s->users->map(fn ($u) => $u->pivot?->assigned_by)->filter();
        })->unique()->values();

        $assignedUsers = User::with('persona')
            ->whereIn('idUser', $assignedIds)
            ->get()
            ->keyBy('idUser');

        $sanciones = $sanciones->map(function ($s) use ($assignedUsers) {
            $s->users->each(function ($u) use ($assignedUsers) {
                $assigned = $assignedUsers->get($u->pivot?->assigned_by);
                $u->pivot->assigned_by_nombre = $assigned?->persona?->Nombre ?? null;
                $u->pivot->assigned_by_apellido = $assigned?->persona?->Apellido1 ?? null;
                $u->pivot->assigned_by_email = $assigned?->Email ?? null;
            });
            return $s;
        });

        return response()->json([
            'message'   => 'Listado de sanciones activas.',
            'sanciones' => $sanciones
        ]);
    }

    // -------- SANCIONES DEL USUARIO AUTENTICADO --------
    public function misSanciones(Request $request)
    {
        $user = $request->user();

        if (!$user) {
            return response()->json(['error' => 'Usuario no autenticado'], 401);
        }

        $sanciones = $user->sanciones()
            ->orderBy('fecha_inicio', 'desc')
            ->orderBy('idSancion', 'desc')
            ->get();

        $assignedIds = $sanciones
            ->map(fn ($s) => $s->pivot?->assigned_by)
            ->filter()
            ->unique()
            ->values();

        $assignedUsers = User::with('persona')
            ->whereIn('idUser', $assignedIds)
            ->get()
            ->keyBy('idUser');

        $data = $sanciones->map(function ($s) use ($assignedUsers) {
            $assigned = $assignedUsers->get($s->pivot?->assigned_by);
            $nombreAsignador = trim(
                ($assigned?->persona?->Nombre ?? '') . ' ' . ($assigned?->persona?->Apellido1 ?? '')
            );

            return [
                'idSancion' => $s->idSancion,
                'nivel' => $s->nivel,
                'descripcion' => $s->descripcion,
                'estado' => $s->estado,
                'fecha_inicio' => $s->fecha_inicio,
                'fecha_fin' => $s->fecha_fin,
                'detalle' => $s->pivot?->descripcion,
                'prestamo_id' => $s->pivot?->prestamo_id,
                'accion' => $s->pivot?->accion,
                'asignada_por' => $nombreAsignador !== '' ? $nombreAsignador : null,
                'asignada_por_email' => $assigned?->Email ?? null,
                'asignada_en' => $s->pivot?->created_at,
            ];
        });

        return response()->json([
            'message' => 'Listado de sanciones del usuario autenticado.',
            'sanciones' => $data
        ]);
    }

   
    public function ampliarSancion(Request $request, $idSancion)
    {
        $request->validate([
            'motivo' => 'required|string'
        ]);

        $sancion = Sancion::with('users.persona')->findOrFail($idSancion);

        // extender 7 días
        $fechaFin = $sancion->fecha_fin ?? now()->toDateString();
        $nuevaFecha = now()->parse($fechaFin)->addDays(7)->toDateString();
        $sancion->fecha_fin = $nuevaFecha;
        $sancion->save();

        // tomamos el primer usuario asociado (puedes adaptar a más)
        $user = $sancion->users->first();

        //if ($user) {
          //  Mail::to($user->Email)->send(
            //    new SancionNotificacion('ampliada', $user, $sancion, $request->motivo)
            //);
       // }

        return response()->json([
            'message' => 'Sanción ampliada 7 días correctamente.',
            'sancion' => $sancion
        ]);
    }

    // -------- QUITAR / DESACTIVAR SANCION --------
    public function quitarSancion(Request $request, $idSancion)
    {
        $request->validate([
            'motivo' => 'nullable|string'
        ]);

        $sancion = Sancion::with('users.persona')->findOrFail($idSancion);

        // en vez de borrar, la marcamos como no activo para mantener historial
        $sancion->estado = 'EXPIRADA';
        $sancion->save();

        $user = $sancion->users->first();

        //if ($user) {
          //  Mail::to($user->Email)->send(
            //    new SancionNotificacion('quitada', $user, $sancion, $request->motivo)
           // );
       // }

        return response()->json([
            'message' => 'Sanción desactivada correctamente.',
            'sancion' => $sancion
        ]);
    }
}
