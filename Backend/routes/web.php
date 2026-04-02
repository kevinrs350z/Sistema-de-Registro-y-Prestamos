<?php

use Illuminate\Support\Facades\Route;
use Laravel\Socialite\Facades\Socialite;
use App\Http\Controllers\Auth\GoogleController;
use App\Http\Controllers\Auth\GmailOAuthController;

/*
|--------------------------------------------------------------------------
| Web Routes
|--------------------------------------------------------------------------
|
| Here is where you can register web routes for your application. These
| routes are loaded by the RouteServiceProvider within a group which
| contains the "web" middleware group. Now create something great!
|
*/
Route::get('/', fn() => response()->json(['message' => 'API funcionando 🚀']));
Route::get('/auth/google/callback', [GoogleController::class, 'handleGoogleCallback']);

// Gmail API OAuth - Rutas temporales para obtener refresh_token (usar solo una vez)
Route::get('/gmail/authorize', [GmailOAuthController::class, 'redirectToGmail']);
Route::get('/gmail/callback',  [GmailOAuthController::class, 'callback']);

//Auth::routes();

//Route::get('/home', [App\Http\Controllers\HomeController::class, 'index'])->name('home');
