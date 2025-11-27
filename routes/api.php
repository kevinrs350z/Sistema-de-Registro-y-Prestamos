<?php

use App\Http\Controllers\AsignaturaController;
use Illuminate\Http\Request;
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
use App\Http\Controllers\UsuarioController;

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

// Ruta para iniciar sesión
// URL: /api/login
Route::post('/login', [AuthController::class, 'login']);
Route::get('auth/google', [GoogleController::class, 'redirectToGoogle']);
Route::post('/auth/google', [AuthController::class, 'googleLogin']);


// Ruta para registrar un nuevo usuario
// URL: /api/register
Route::post('/register', [AuthController::class, 'register']);

Route::middleware('auth:sanctum')->group(function () {
    
    // Ruta de prueba para verificar el token (ya la tenías)
    // URL: /api/user
    Route::get('/user', function (Request $request) {
        return $request->user();
    });

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


    Route::get('/bloques', [BloqueController::class, 'index']);// muestra los bloques
    Route::get('/asignaturas', [AsignaturaController::class, 'index']);// mostramos las asignaturas
    //dashboard de admin
    // Prestamos
    Route::get('/prestamos', [PrestamoController::class, 'index']);
    Route::post('/prestamos', [PrestamoController::class, 'store']);
    // Route::post('/prestamos/solicitar', [PrestamoController::class, 'solicitarPrestamo']);
   
    //Route::get('/admin/dashboard', [AdminDashboardController::class, 'getDashboardData']);
});
Route::middleware(['auth:sanctum', 'admin'])->group(function () {
    Route::post('/prestamos/cambiar-estado', [PrestamoAdminController::class, 'cambiarEstado']);
    Route::get('/admin/prestamos', [PrestamoAdminController::class, 'verTodosLosPrestamos']);
    Route::post('/admin/sanciones/asignar', [UserSancionController::class, 'asignarSancion']);
});

Route::prefix('admin/prestamos')->middleware(['auth:sanctum', 'role:admin'])->group(function () {
    Route::get('/pendientes', [PrestamoAdminController::class, 'pendientes']);
    Route::get('/historial', [PrestamoAdminController::class, 'historial']);
    Route::post('/aprobar/{id}', [PrestamoAdminController::class, 'aprobar']);
    Route::post('/rechazar/{id}', [PrestamoAdminController::class, 'rechazar']);
});



//Rutas nuevas, provando

Route::get('/categoria', [CategoriaController::class, 'index']);
Route::post('/categoria', [CategoriaController::class, 'store']);
Route::get('/categoria/{id}', [CategoriaController::class, 'show']);
Route::put('/categoria/{id}', [CategoriaController::class, 'update']);
Route::delete('/categoria/{id}', [CategoriaController::class, 'destroy']);

Route::post('/prestamos', [PrestamoController::class, 'store']);
Route::get('/prestamos', [PrestamoController::class, 'index']);
Route::get('/prestamos/{id}', [PrestamoController::class, 'show']);
Route::delete('/prestamos/{id}', [PrestamoController::class, 'destroy']);



Route::post('/equipos/relacion', [EquipoRelacionadoController::class, 'store']);
Route::delete('/equipos/relacion', [EquipoRelacionadoController::class, 'destroy']);
Route::get('/equipos/{id}/recomendaciones', [EquipoRelacionadoController::class, 'recomendaciones']);


Route::get('/tipoEquipo', [TipoEquipoController::class, 'index']);
Route::post('/tipoEquipo', [TipoEquipoController::class, 'store']);
Route::get('/tipoEquipo/{id}', [TipoEquipoController::class, 'show']);
Route::put('/tipoEquipo/{id}', [TipoEquipoController::class, 'update']);
Route::delete('/tipoEquipo/{id}', [TipoEquipoController::class, 'destroy']);
Route::post('/equipos/relacion', [EquipoRelacionadoController::class, 'store']);
Route::delete('/equipos/relacion', [EquipoRelacionadoController::class, 'destroy']);
Route::get('/equipos/{id}/recomendaciones', [EquipoRelacionadoController::class, 'recomendaciones']);


Route::post('/equipos', [EquipoController::class, 'store']);