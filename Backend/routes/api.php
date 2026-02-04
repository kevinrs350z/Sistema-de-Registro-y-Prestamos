<?php

use App\Http\Controllers\AsignaturaController;
use Illuminate\Http\Request;
use App\Http\Controllers\Auth\GoogleTokenController;
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\Auth\AuthController; 
use App\Http\Controllers\Auth\ForgotPasswordController;
use App\Http\Controllers\Auth\ResetPasswordController;
use App\Http\Controllers\BloqueController;
use App\Http\Controllers\Prestamo\PrestamoController;
use App\Http\Controllers\EquipoController;
use App\Http\Controllers\mostrar\usuario;
use App\Http\Controllers\Prestamo\PrestamoAdminController;
use Laravel\Socialite\Facades\Socialite;
use App\Http\Controllers\Auth\GoogleController;
use App\Http\Controllers\UserSancionController;
use App\Http\Controllers\CategoriaController;
use App\Http\Controllers\EquipoRelacionadoController;
use App\Http\Controllers\TipoEquipoController;
use App\Http\Controllers\TipoEquipoRelacionadoController;
use App\Http\Controllers\UsuarioController;
use App\Http\Controllers\Prestamo\DevolucionAdminController;
use App\Http\Controllers\ReportesController;
use App\Http\Controllers\reportes\Dashboard\DashboardReportesController;
//use App\Http\Controllers\Prestamo\AdminPrestamoController;
use App\Http\Controllers\Reportes\ReporteProfesorController;
use App\Http\Controllers\PackController;
use App\Http\Controllers\Reportes\ReportesAlumnosAdminController;
use App\Http\Controllers\Reportes\Dashboard\DashboardOperationalController;
use App\Http\Controllers\Reportes\ReportesInventarioController;
use App\Http\Controllers\Reportes\ReportesSancionesController;
use App\Http\Controllers\Reportes\ReportesMantenimientosController;
use App\Http\Controllers\Reportes\ReportesTendenciasController;
use App\Http\Controllers\Reportes\ReportesAsignaturasController;
use App\Http\Controllers\ReportesEquiposNormalizadosController;
use App\Http\Controllers\AdminGrupoController;

/*
|--------------------------------------------------------------------------
| API Routes
|--------------------------------------------------------------------------
|
| Here is where you can register API routes for your application. These
| routes are loaded by the RouteServiceProvider within a group which
| is assigned the "api" middleware group. Enjoy building your API!
|
*/

// 1. RUTAS PÚBLICAS 
Route::post('/forgot', [ForgotPasswordController::class, 'sendResetLinkEmail']);
Route::post('/reset', [ResetPasswordController::class, 'reset']);
Route::get('/password/validate-token/{token}', [ResetPasswordController::class, 'validateToken']);

// =====================================================
// RUTAS DE IMÁGENES (públicas, con CORS)
// =====================================================
Route::get('/images/{path}', [\App\Http\Controllers\ImageController::class, 'show'])
    ->where('path', '.*'); // Permite rutas con subcarpetas como tipo_equipos/imagen.jpg

Route::get('/tipo-equipos/{id}/imagen', [\App\Http\Controllers\ImageController::class, 'tipoEquipo']);

// Ruta para iniciar sesión
// URL: /api/login
Route::post('/login', [AuthController::class, 'login']);


Route::post('/auth/google', [GoogleTokenController::class, 'login']);


// Ruta para registrar un nuevo usuario
// URL: /api/register
Route::post('/register', [AuthController::class, 'register']);

Route::middleware('auth:sanctum')->group(function () {
    
    // Ruta de prueba para verificar el token (ya la tenías)
    // URL: /api/user
    Route::get('/user', function (Request $request) {
        return $request->user();
    });

    Route::post('/prestamos', [PrestamoController::class, 'store']);
    Route::post('/prestamos/validar-maximo', [PrestamoController::class, 'validarMaximo']);
    Route::get('/prestamos', [PrestamoController::class, 'index']);
    Route::get('/prestamos/{id}', [PrestamoController::class, 'show']);
    Route::delete('/prestamos/{id}', [PrestamoController::class, 'destroy']);



    // Ruta para cerrar sesión (requiere que el usuario esté autenticado para invalidar su token)
    // Método: POST
    // URL: /api/logout
    Route::post('/logout', [AuthController::class, 'logout']); 
    //mostrar equipos
    Route::get('/equipos', [EquipoController::class, 'index']);
    Route::get('/userr', [usuario::class, 'index']);

    Route::get('/usuarios',      [UsuarioController::class, 'index']);
    Route::post('/usuarios',     [UsuarioController::class, 'store']);
    Route::get('/usuarios/{id}', [UsuarioController::class, 'show']);
    Route::put('/usuarios/{id}', [UsuarioController::class, 'update']);
    Route::delete('/usuarios/{id}', [UsuarioController::class, 'destroy']);
    Route::post('/usuarios/{id}/reactivar', [UsuarioController::class, 'reactivar']);


    Route::get('/bloques', [BloqueController::class, 'index']);// muestra los bloques
    //Route::get('/asignaturas', [AsignaturaController::class, 'index']);// mostramos las asignaturas
    //dashboard de admin
    // Prestamos
    Route::get('/prestamos', [PrestamoController::class, 'index']);
    Route::post('/prestamos', [PrestamoController::class, 'store']);
    // Route::post('/prestamos/solicitar', [PrestamoController::class, 'solicitarPrestamo']);
   
    //Route::get('/admin/dashboard', [AdminDashboardController::class, 'getDashboardData']);
});
Route::middleware(['auth:sanctum', 'admin'])->group(function () {
   # Route::post('/prestamos/cambiar-estado', [PrestamoAdminController::class, 'cambiarEstado']);
    Route::post('/admin/prestamos/aprobar/{id}',[PrestamoAdminController::class, 'aprobar']);
    Route::post('/admin/prestamos/rechazar/{id}',[PrestamoAdminController::class, 'rechazar']);
    Route::get('/equipos/{idEquipo}/historial', [EquipoController::class, 'historial']);
    Route::get('/admin/prestamos/pendientes', [PrestamoAdminController::class, 'verTodosLosPrestamos']);
    Route::patch('/admin/prestamos/{idPrestamo}/equipos/{idEquipo}/devolver',[PrestamoAdminController::class, 'devolverEquipo']);
    Route::patch('/admin/prestamos/{id}/extender', [PrestamoAdminController::class, 'extender']);
    Route::post('/admin/prestamos/{id}/entregar', [PrestamoAdminController::class, 'marcarEntregado']);
    Route::get('/admin/sanciones/prefill', [UserSancionController::class, 'prefill']);
    Route::get('/admin/sanciones/catalogo', [UserSancionController::class, 'catalogo']);
    Route::get('/admin/sanciones', [UserSancionController::class, 'listarSanciones']);
    Route::get('/admin/sanciones/activa', [UserSancionController::class, 'listarSancionesActivas']);
    Route::post('/admin/sanciones/asignar', [UserSancionController::class, 'asignarSancion']);
    Route::patch('/admin/sanciones/{id}/ampliar', [UserSancionController::class, 'ampliarSancion']);
    Route::patch('/admin/sanciones/{id}/quitar', [UserSancionController::class, 'quitarSancion']);
    Route::post('/admin/devolucion', [DevolucionAdminController::class, 'devolverEquipo']);

    Route::patch('/admin/alumnos/{id}/bloquear', [UsuarioController::class, 'bloquear']);
    Route::patch('/admin/alumnos/{id}/desbloquear', [UsuarioController::class, 'desbloquear']);
    
});

Route::middleware(['auth:sanctum', 'admin'])->group(function () {
    Route::post('/reservas', [PrestamoAdminController::class, 'store']);
    Route::get('admin/prestamos/pendientes', [PrestamoAdminController::class, 'pendientes']);
    Route::get('admin/prestamos/historial', [PrestamoAdminController::class, 'historial']);
    Route::patch('/reservas/{idPrestamo}/equipos/{idEquipo}/devolver',[PrestamoAdminController::class, 'devolverEquipo']);


Route::post('admin/prestamos/{id}/devolver', [PrestamoAdminController::class, 'marcarDevuelto']);
Route::patch('admin/prestamos/{id}/extender', [PrestamoAdminController::class, 'extender']);
Route::post('admin/prestamos/{id}/entregar', [PrestamoAdminController::class, 'marcarEntregado']);

    // ─────────────────────────────────────────────
    // Gestión administrativa de grupos
    // ─────────────────────────────────────────────
    Route::get('/admin/grupos', [AdminGrupoController::class, 'index']);
    Route::post('/admin/grupos', [AdminGrupoController::class, 'store']);
    Route::get('/admin/grupos/{id}', [AdminGrupoController::class, 'show']);
    Route::patch('/admin/grupos/{id}', [AdminGrupoController::class, 'update']);
    Route::delete('/admin/grupos/{id}', [AdminGrupoController::class, 'destroy']);
    Route::patch('/admin/grupos/{id}/estado', [AdminGrupoController::class, 'actualizarEstado']);
    Route::post('/admin/grupos/{id}/integrantes', [AdminGrupoController::class, 'addIntegrantes']);
    Route::delete('/admin/grupos/{id}/integrantes/{usuarioId}', [AdminGrupoController::class, 'removeIntegrante']);

    // Búsqueda de usuarios para autocompletado
    Route::get('/admin/users/search', [UsuarioController::class, 'search']);

});
Route::post('admin/prestamos', [PrestamoAdminController::class, 'store']);
Route::get('/admin/reservas', [PrestamoAdminController::class, 'index']);




//Rutas nuevas, provando

Route::get('/categoria', [CategoriaController::class, 'index']);
Route::post('/categoria', [CategoriaController::class, 'store']);
Route::get('/categoria/{id}', [CategoriaController::class, 'show']);
Route::put('/categoria/{id}', [CategoriaController::class, 'update']);
Route::delete('/categoria/{id}', [CategoriaController::class, 'destroy']);




Route::get('/asignaturas', [AsignaturaController::class, 'index']);
Route::post('/equipos/relacion', [EquipoRelacionadoController::class, 'store']);
Route::delete('/equipos/relacion', [EquipoRelacionadoController::class, 'destroy']);
Route::get('/equipos/{id}/recomendaciones', [EquipoRelacionadoController::class, 'recomendaciones']);


Route::get('/tipoEquipo', [TipoEquipoController::class, 'index']);
Route::post('/tipoEquipo', [TipoEquipoController::class, 'store']);
Route::get('/tipoEquipo/{id}', [TipoEquipoController::class, 'show']);
Route::put('/tipoEquipo/{id}', [TipoEquipoController::class, 'update']);
Route::delete('/tipoEquipo/{id}', [TipoEquipoController::class, 'destroy']);
Route::get('/tipoEquipo/{id}/equipos-disponibles', [TipoEquipoController::class, 'equiposDisponibles']);

// Rutas para relaciones entre tipos de equipo (límite compartido)
Route::get('/tipoEquipo-relacionados', [TipoEquipoRelacionadoController::class, 'index']);
Route::get('/tipoEquipo-relacionados/{id}', [TipoEquipoRelacionadoController::class, 'show']);
Route::post('/tipoEquipo-relacionados', [TipoEquipoRelacionadoController::class, 'store']);
Route::delete('/tipoEquipo-relacionados', [TipoEquipoRelacionadoController::class, 'destroy']);
Route::get('/tipoEquipo-relacionados/{id}/sugerencias', [TipoEquipoRelacionadoController::class, 'sugerencias']);

Route::get('/catalogo-equipos', [TipoEquipoController::class, 'catalogo']);


// Rutas para gestión de grupos
use App\Http\Controllers\GrupoController;
Route::get('/grupos', [GrupoController::class, 'index']);
Route::get('/grupos/{id}', [GrupoController::class, 'show']);
Route::post('/grupos', [GrupoController::class, 'store']);
Route::put('/grupos/{id}', [GrupoController::class, 'update']);
Route::delete('/grupos/{id}', [GrupoController::class, 'destroy']);
Route::post('/grupos/{id}/add-usuario', [GrupoController::class, 'addUsuario']);
Route::post('/grupos/{id}/remove-usuario', [GrupoController::class, 'removeUsuario']);
Route::post('/grupos/{id}/asignar-prestamo', [GrupoController::class, 'asignarPrestamo']);
Route::post('/grupos/{id}/quitar-prestamo', [GrupoController::class, 'quitarPrestamo']);

Route::post('/equipos/relacion', [EquipoRelacionadoController::class, 'store']);
Route::delete('/equipos/relacion', [EquipoRelacionadoController::class, 'destroy']);
Route::get('/equipos/{id}/recomendaciones', [EquipoRelacionadoController::class, 'recomendaciones']);

/*
|--------------------------------------------------------------------------
| RUTAS ADMINISTRATIVAS
|--------------------------------------------------------------------------
*/

// ---------------------------------------------------------------
// Registro de ruta para la creación de equipos
// ---------------------------------------------------------------
Route::post('/equipos', [EquipoController::class, 'store']);

// ---------------------------------------------------------------
// Rutas de reportes (requieren autenticación)
// ---------------------------------------------------------------
Route::middleware(['auth:sanctum'])->group(function () {
    Route::get('/reportes/equipos-mas-solicitados', [ReportesController::class, 'equiposMasSolicitados']);
    Route::get('/reportes/uso-interno-externo', [ReportesController::class, 'usoInternoExterno']);
    Route::get('/reportes/sanciones-rechazos', [ReportesController::class, 'sancionesYRechazos']);
    Route::get('/reportes/equipos-baja', [ReportesController::class, 'equiposDadoDeBaja']);
    Route::get('/reportes/prestamos-periodo', [ReportesController::class, 'prestamosPorPeriodo']);
    Route::get('/reportes/categorias-demandadas', [ReportesController::class, 'categoriasMasDemandadas']);
});


Route::prefix('reportes/dashboard')->group(function () {
    Route::get('/kpis', [DashboardReportesController::class, 'getKPIs']);
    Route::get('/solicitudes-dia', [DashboardReportesController::class, 'getSolicitudesPorDia']);
    Route::get('/uso-interno-externo', [DashboardReportesController::class, 'getUsoInternoExterno']);
    Route::get('/top-categorias', [DashboardReportesController::class, 'getTopCategorias']);
    Route::get('/sanciones-rechazos', [DashboardReportesController::class, 'getSancionesYRechazos']);
    Route::get('/top-alumnos', [DashboardReportesController::class, 'getTopAlumnos']);
});

// ---------------------------------------------------------------
// Rutas de reportes de equipos normalizados (métricas BI)
// ---------------------------------------------------------------
Route::middleware(['auth:sanctum'])
    ->prefix('reportes/equipos-normalizados')
    ->group(function () {
        Route::get('/kpis', [ReportesEquiposNormalizadosController::class, 'kpis']);
        Route::get('/lista', [ReportesEquiposNormalizadosController::class, 'lista']);
        Route::get('/top-por-mes', [ReportesEquiposNormalizadosController::class, 'topPorMes']);
        Route::get('/evolucion', [ReportesEquiposNormalizadosController::class, 'evolucion']);
        Route::get('/categorias', [ReportesEquiposNormalizadosController::class, 'categorias']);
        Route::get('/comparacion-antiguedad', [ReportesEquiposNormalizadosController::class, 'comparacionAntiguedad']);
    });



    Route::middleware(['auth:sanctum'])
    ->prefix('reportes/profesores')
    ->group(function () {

        Route::get('/equipos', [ReporteProfesorController::class, 'equipos']);
        Route::get('/prestamos', [ReporteProfesorController::class, 'prestamos']);
        Route::get('/tendencia', [ReporteProfesorController::class, 'tendencia']);

    });
    
    // Rutas de equipos que requieren autenticación
    Route::middleware(['auth:sanctum'])->group(function () {
        Route::put('/equipos/{id}', [EquipoController::class, 'update']);
        Route::delete('/equipos/{id}', [EquipoController::class, 'destroy']);
    });


    Route::prefix('packs')->group(function () {
        Route::get('/', [PackController::class, 'index']);
        Route::post('/', [PackController::class, 'store']);
        Route::post('/{pack}/reactivar', [PackController::class, 'reactivar']);
        Route::delete('/{pack}', [PackController::class, 'destroy']);
        Route::put('/{pack}', [PackController::class, 'update']);

    });


    //esto es de repotes tambien 
    Route::middleware(['auth:sanctum'])
      ->prefix('reportes/alumnos')
      ->group(function () {
          Route::get('/kpis', [ReportesAlumnosAdminController::class, 'kpis']);
          Route::get('/prestamos-carrera', [ReportesAlumnosAdminController::class, 'prestamosCarrera']);
          Route::get('/sanciones-nivel', [ReportesAlumnosAdminController::class, 'sancionesNivel']);
          Route::get('/evolucion-prestamos', [ReportesAlumnosAdminController::class, 'evolucionPrestamos']);
          Route::get('/ranking', [ReportesAlumnosAdminController::class, 'ranking']);

          // los que ya tenías
          Route::get('/workflow-estados', [ReportesAlumnosAdminController::class, 'workflowEstados']);
          Route::get('/tiempo-resolucion', [ReportesAlumnosAdminController::class, 'tiempoResolucion']);
          Route::get('/equipos-criticos', [ReportesAlumnosAdminController::class, 'equiposCriticos']);
          Route::get('/inventario-evolucion', [ReportesAlumnosAdminController::class, 'inventarioEvolucion']);
          Route::get('/heatmap', [ReportesAlumnosAdminController::class, 'heatmap']);
          Route::get('/riesgo', [ReportesAlumnosAdminController::class, 'riesgo']);
      });

        Route::middleware(['auth:sanctum'])
            ->prefix('reportes/asignaturas')
            ->group(function () {
                    Route::get('/uso', [ReportesAsignaturasController::class, 'getUsoAsignaturas']);
                    Route::get('/tendencia', [ReportesAsignaturasController::class, 'getTendencia']);
                    Route::get('/equipos', [ReportesAsignaturasController::class, 'getEquiposPorAsignatura']);
            });

        Route::middleware(['auth:sanctum'])
            ->prefix('reportes/inventario')
            ->group(function () {
                    Route::get('/estado', [ReportesInventarioController::class, 'estado']);
                    Route::get('/categorias', [ReportesInventarioController::class, 'categorias']);
                    Route::get('/antiguedad', [ReportesInventarioController::class, 'antiguedad']);
                    Route::get('/top-utilizados', [ReportesInventarioController::class, 'topUtilizados']);
                    Route::get('/subutilizados', [ReportesInventarioController::class, 'subUtilizados']);
                    Route::get('/demanda-vs-disponibilidad', [ReportesInventarioController::class, 'demandaVsDisponibilidad']);
            });

        Route::middleware(['auth:sanctum'])
            ->prefix('reportes/sanciones')
            ->group(function () {
                    Route::get('/kpis', [ReportesSancionesController::class, 'kpis']);
                    Route::get('/motivos', [ReportesSancionesController::class, 'motivos']);
                    Route::get('/reincidencia', [ReportesSancionesController::class, 'reincidencia']);
                    Route::get('/bloqueos', [ReportesSancionesController::class, 'bloqueos']);
                    Route::get('/relacion-atrasos', [ReportesSancionesController::class, 'relacionAtrasos']);
            });

        Route::middleware(['auth:sanctum'])
            ->prefix('reportes/mantenimientos')
            ->group(function () {
                    Route::get('/atrasos', [ReportesMantenimientosController::class, 'atrasos']);
                    Route::get('/incidentes', [ReportesMantenimientosController::class, 'incidentes']);
                    Route::get('/incidentes-equipo', [ReportesMantenimientosController::class, 'incidentesEquipo']);
                    Route::get('/equipos-mantenimiento', [ReportesMantenimientosController::class, 'equiposMantenimiento']);
            });

        Route::middleware(['auth:sanctum'])
            ->prefix('reportes/tendencias')
            ->group(function () {
                    Route::get('/prestamos-mes', [ReportesTendenciasController::class, 'prestamosPorMes']);
                    Route::get('/categorias', [ReportesTendenciasController::class, 'categorias']);
                    Route::get('/uso-tipo-usuario', [ReportesTendenciasController::class, 'usoPorTipo']);
            });

    // Dashboard operacional (estado actual del sistema)
    Route::middleware(['auth:sanctum'])
      ->prefix('dashboard/operational')
      ->group(function () {
          Route::get('/kpis', [DashboardOperationalController::class, 'getKPIs']);
          Route::get('/inventario', [DashboardOperationalController::class, 'getEstadoInventario']);
        Route::get('/disponibilidad', [DashboardOperationalController::class, 'getDisponibilidad']);
        Route::get('/criticos', [DashboardOperationalController::class, 'getEquiposCriticos']);
        Route::get('/equipos/{id}/ultimo-evento', [DashboardOperationalController::class, 'getEquipoUltimoEvento']);
        // Profesores - operativos
        Route::get('/profesores/{id}/prestamos-activos', [DashboardOperationalController::class, 'getPrestamosActivosPorProfesor']);
        Route::get('/profesores/{id}/prestamos-proximos', [DashboardOperationalController::class, 'getPrestamosProximosPorProfesor']);
        Route::get('/profesores/{id}/riesgos', [DashboardOperationalController::class, 'getRiesgosPorProfesor']);
        Route::get('/profesores/{id}/responsabilidad', [DashboardOperationalController::class, 'getResponsabilidadPorProfesor']);
        Route::get('/profesores/{id}/alertas', [DashboardOperationalController::class, 'getAlertasPorProfesor']);
          Route::get('/alertas', [DashboardOperationalController::class, 'getAlertasCriticas']);
          Route::get('/actividad-reciente', [DashboardOperationalController::class, 'getActividadReciente']);
          Route::get('/salud', [DashboardOperationalController::class, 'getSaludSistema']);
          // KPIs de inventario, mantenimientos y sanciones
          Route::get('/kpis-inventario', [DashboardOperationalController::class, 'getKPIsInventario']);
          Route::get('/kpis-mantenimientos', [DashboardOperationalController::class, 'getKPIsMantenimientos']);
          Route::get('/kpis-sanciones', [DashboardOperationalController::class, 'getKPIsSanciones']);
      });