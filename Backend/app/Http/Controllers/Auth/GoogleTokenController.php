<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Str;
use App\Models\Persona;
use App\Models\User;
use App\Models\Rol;

class GoogleTokenController extends Controller
{
    public function login(Request $request)
    {
        Log::info('🟢 [STEP 1] Entró al controlador');

        try {

            // =========================
            // STEP 2: TOKEN LLEGA
            // =========================
            Log::info('🟡 [STEP 2] Request', [
                'has_token' => $request->has('token'),
                'token_preview' => $request->token
                    ? substr($request->token, 0, 20) . '...'
                    : null
            ]);

            $request->validate([
                'token' => 'required|string',
            ]);

            // =========================
            // STEP 3: DECODIFICAR JWT (SIN LIBRERÍAS)
            // =========================
            $parts = explode('.', $request->token);
            if (count($parts) !== 3) {
                Log::warning('🔴 [STEP 3] Token no tiene 3 partes');
                return response()->json(['message' => 'Token inválido'], 401);
            }

            $payload = json_decode(base64_decode(strtr($parts[1], '-_', '+/')), true);

            Log::info('🟢 [STEP 3] Payload decodificado', $payload);

            if (!$payload) {
                Log::warning('🔴 [STEP 3] Payload vacío');
                return response()->json(['message' => 'Token inválido'], 401);
            }

            // =========================
            // STEP 4: VALIDACIONES GOOGLE
            // =========================
            if (($payload['aud'] ?? null) !== env('GOOGLE_CLIENT_ID')) {
                Log::warning('🔴 [STEP 4] AUD inválido', ['aud' => $payload['aud'] ?? null]);
                return response()->json(['message' => 'Audience inválido'], 401);
            }

            if (($payload['iss'] ?? null) !== 'https://accounts.google.com') {
                Log::warning('🔴 [STEP 4] ISS inválido', ['iss' => $payload['iss'] ?? null]);
                return response()->json(['message' => 'Issuer inválido'], 401);
            }

            if (($payload['exp'] ?? 0) < time()) {
                Log::warning('🔴 [STEP 4] Token expirado');
                return response()->json(['message' => 'Token expirado'], 401);
            }

            if (($payload['email_verified'] ?? false) !== true) {
                Log::warning('🔴 [STEP 4] Email no verificado');
                return response()->json(['message' => 'Email no verificado'], 401);
            }

            Log::info('🟢 [STEP 4] Token Google válido');

            // =========================
            // STEP 5: DATOS USUARIO
            // =========================
            $email = $payload['email'] ?? null;
            $name  = $payload['name'] ?? 'Usuario Google';

            Log::info('🟢 [STEP 5] Datos Google', compact('email', 'name'));

            // =========================
            // STEP 6: PERSONA
            // =========================
            try {
                $persona = Persona::where('Email', $email)->first();
            } catch (\Throwable $e) {
                Log::error('🔥 [STEP 6] Error buscando Persona', ['error' => $e->getMessage()]);
                throw $e;
            }

            if (!$persona) {
                Log::info('🟡 [STEP 6] Persona NO existe, creando');

                try {
                    // Generar un Rut válido/no nulo para cumplir la restricción de la BD
                    // Usamos el "sub" de Google como identificador estable, y si no existe,
                    // generamos un UUID. Se trunca a 20 caracteres por seguridad.
                    $rutGenerado = substr((string)($payload['sub'] ?? Str::uuid()), 0, 20);

                    $persona = Persona::create([
                        'Nombre'    => $name,
                        'apellido1' => '',
                        'apellido2' => null,
                        'Rut'       => $rutGenerado,
                        'Email'     => $email,
                    ]);
                } catch (\Throwable $e) {
                    Log::error('🔥 [STEP 6] Error creando Persona', ['error' => $e->getMessage()]);
                    throw $e;
                }

                Log::info('🟢 [STEP 6] Persona creada', ['IdPersona' => $persona->idPersona]);
            }

            // =========================
            // STEP 7: USER
            // =========================
            try {
                $user = User::where('idPersona', $persona->idPersona)->first();
            } catch (\Throwable $e) {
                Log::error('🔥 [STEP 7] Error buscando User', ['error' => $e->getMessage()]);
                throw $e;
            }

            if (!$user) {
                Log::info('🟡 [STEP 7] User NO existe, creando');

                try {
                    $user = User::create([
                        'idPersona' => $persona->idPersona,
                        'Contrasena' => bcrypt(Str::random(32)),
                        'estadoSancion' => 'ACTIVO',
                    ]);
                } catch (\Throwable $e) {
                    Log::error('🔥 [STEP 7] Error creando User', ['error' => $e->getMessage()]);
                    throw $e;
                }

                Log::info('🟢 [STEP 7] User creado', ['idUser' => $user->idUser]);

                try {
                    $rol = Rol::where('Nombre', 'ALUMNO')->first();
                    if ($rol) {
                        $user->roles()->attach($rol->IdRol);
                        Log::info('🟢 [STEP 7] Rol ALUMNO asignado');
                    }
                } catch (\Throwable $e) {
                    Log::error('🔥 [STEP 7] Error asignando Rol', ['error' => $e->getMessage()]);
                    throw $e;
                }
            }

            // =========================
            // STEP 8: TOKEN SANTCUM
            // =========================
            try {
                $token = $user->createToken('auth-token')->plainTextToken;
            } catch (\Throwable $e) {
                Log::error('🔥 [STEP 8] Error creando token Sanctum', ['error' => $e->getMessage()]);
                throw $e;
            }

            Log::info('🟢 [STEP 8] Token Sanctum creado');

            return response()->json([
                'token' => $token,
                'user' => [
                    'id' => $user->idUser,
                    'nombre' => $persona->Nombre,
                    'email' => $persona->Email,
                    'rol' => [
                        'nombre' => $user->roles->first()->Nombre ?? null,
                    ],
                ],
            ], 200);

        } catch (\Throwable $e) {
            Log::error('💀 [FATAL] Error general Google Login', [
                'message' => $e->getMessage(),
                'trace' => $e->getTraceAsString()
            ]);

            return response()->json([
                'message' => 'Error interno Google Login',
                'error' => $e->getMessage()
            ], 500);
        }
    }
}
