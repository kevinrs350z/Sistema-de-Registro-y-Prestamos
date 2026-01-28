<?php

namespace App\Http\Controllers\Prestamo;

    use App\Http\Controllers\Controller;
    use App\Http\Requests\Prestamo\Admin\AprobarRechazarPrestamoRequest;
    use App\Http\Requests\Prestamo\Admin\MarcarDevueltoRequest;
    use App\Http\Requests\Prestamo\Admin\ExtenderPrestamoRequest;
    use App\Services\Prestamos\PrestamoAdminService;
    use App\Http\Requests\Prestamo\StorePrestamoAdminRequest;
    use Illuminate\Support\Facades\DB;
    use Illuminate\Http\Request;
    use App\Models\Prestamo;

    class PrestamoAdminController extends Controller
    {
        public function __construct(
            private PrestamoAdminService $service
        ) {}

        /* ============================================================
            APROBAR
        ============================================================ */
        public function aprobar(
            AprobarRechazarPrestamoRequest $request,
            int $id
        ) {
            $this->service->cambiarEstado(
                $id,
                'aprobar',
                $request->motivo
            );

            return response()->json([
                'message' => 'Préstamo aprobado correctamente.'
            ]);
        }

        /* ============================================================
            RECHAZAR
        ============================================================ */
        public function rechazar(
            AprobarRechazarPrestamoRequest $request,
            int $id
        ) {
                // Para rechazos, motivo es obligatorio en la lógica del controlador
                $motivo = $request->motivo;
                if (is_null($motivo) || trim($motivo) === '') {
                    return response()->json(['error' => 'Debe ingresar un motivo para el rechazo.'], 422);
                }

                $this->service->cambiarEstado(
                    $id,
                    'rechazar',
                    $motivo
                );

            return response()->json([
                'message' => 'Préstamo rechazado correctamente.'
            ]);
        }

        /* ============================================================
            MARCAR DEVUELTO
        ============================================================ */
        public function marcarDevuelto(
            MarcarDevueltoRequest $request,
            int $id
        ) {
            $this->service->marcarDevuelto(
                $id,
                $request->motivo
            );

            return response()->json([
                'message' => 'Préstamo marcado como DEVUELTO correctamente.'
            ]);
        }

            public function devolverEquipo(
            MarcarDevueltoRequest $request,
            int $idPrestamo,
            int $idEquipo
        ) {
            $this->service->devolverEquipo(
                $idPrestamo,
                $idEquipo,
                $request->motivo
            );

            return response()->json([
                'message' => 'Equipo devuelto correctamente.'
            ]);
        }

        public function extender(
            ExtenderPrestamoRequest $request,
            int $id
        ) {
            $this->service->extenderPrestamo(
                $id,
                $request->fecha,
                $request->equiposIds,
                $request->comentario
            );

            return response()->json([
                'message' => 'Préstamo extendido correctamente.'
            ]);
        }

        /* ============================================================
            MARCAR ENTREGADO
        ============================================================ */
        public function marcarEntregado(
            int $id
        ) {
            try {
                $this->service->marcarEntregado(
                    $id,
                    auth()->user()->idUser
                );

                return response()->json([
                    'message' => 'Préstamo marcado como ENTREGADO correctamente.'
                ]);
            } catch (\Exception $e) {
                return response()->json([
                    'error' => $e->getMessage()
                ], 400);
            }
        }

        /* ============================================================
            PENDIENTES
        ============================================================ */
        public function pendientes()
        {
            return response()->json(
                $this->service->obtenerPendientes()
            );
        }

        /* ============================================================
            HISTORIAL
        ============================================================ */
        public function historial()
        {
            return response()->json(
                $this->service->obtenerHistorial()
            );
        }


        public function store( StorePrestamoAdminRequest $request) 
        {
            DB::beginTransaction();

            try {

                $prestamo = $this->service->crearPrestamoAdmin([
                    'idUser'       => $request->idUserAlumno,
                    'tipo'         => $request->tipo === 'EVENTO' ? 'EVENTO' : 'DENTRO',
                    'estado'       => 'APROBADO',
                    'observacion'  => $request->observacion,
                    'ubicacion'    => $request->ubicacion,
                    'fecha_inicio' => $request->fecha_inicio ?? null,
                    'fecha_fin'    => $request->fecha_fin ?? null,
                ], $request);

                DB::commit();

                return response()->json([
                    'message'    => 'Reserva creada correctamente',
                    'idPrestamo' => $prestamo->idPrestamo
                ], 201);

            } catch (\Exception $e) {
                DB::rollBack();

                return response()->json([
                    'error' => $e->getMessage()
                ], 400);
            }
        }

        public function index(Request $request)
        {
            $perPage = (int) $request->get('per_page', 8);

            $prestamos = Prestamo::with([
                    'evento',
                    'equipos.tipo',           // 👈 como en tu ejemplo
                    'bloquePrestamo.bloque'   // 👈 como en tu ejemplo
                ])
                ->where('origen', 'ADMIN')
                ->whereIn('tipo', ['DENTRO', 'EVENTO'])
                ->orderByDesc('created_at')
                ->paginate($perPage);

            return response()->json([
                'data' => $prestamos->map(function ($p) {

                    // Bloques texto
                    $bloquesTexto = null;
                    if ($p->bloquePrestamo && $p->bloquePrestamo->count() > 0) {
                        $bloquesTexto = $p->bloquePrestamo
                            ->map(fn ($bp) =>
                                optional($bp->bloque)->nombre ?? "Bloque {$bp->idBloque}"
                            )
                            ->join(', ');
                    }

                    return [
                        'idPrestamo'   => $p->idPrestamo,
                        'tipo'         => $p->tipo,
                        'estado'       => $p->estado,
                        'observacion'  => $p->observacion,
                        'fecha_inicio' => $p->fecha_inicio,
                        'fecha_fin'    => $p->fecha_fin,

                        'eventoNombre' => optional($p->evento)->nombre_evento,

                        'bloques' => $bloquesTexto,

                        'equipos' => $p->equipos->map(function ($e) {
                            return [
                                'id'       => $e->id,
                                'codigo'   => $e->codigo,
                                'nombre'   => optional($e->tipo)->nombre ?? 'Equipo',
                                'cantidad' => $e->pivot->cantidad ?? 1,
                            ];
                        }),
                    ];
                }),
                'current_page' => $prestamos->currentPage(),
                'per_page'     => $prestamos->perPage(),
                'total'        => $prestamos->total(),
                'last_page'    => $prestamos->lastPage(),
            ]);
        }


}
