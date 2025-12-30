    <?php

    namespace App\Http\Controllers\Prestamo;

    use App\Http\Controllers\Controller;
    use App\Http\Requests\Prestamo\Admin\AprobarRechazarPrestamoRequest;
    use App\Http\Requests\Prestamo\Admin\MarcarDevueltoRequest;
    use App\Services\Prestamos\PrestamoAdminService;

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
            $this->service->cambiarEstado(
                $id,
                'rechazar',
                $request->motivo
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
    }
