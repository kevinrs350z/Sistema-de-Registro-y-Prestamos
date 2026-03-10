<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Str;
use App\Models\Persona;
use App\Models\User;
use App\Models\Rol;
use Google\Auth\AccessToken;

/**
 * ISO 27001 — A.9.4.2 / A.14.2.5
 * Autenticación con Google ID Token.
 *
 * Seguridad aplicada:
 *  - Verificación criptográfica de firma JWT (google/auth).
 *  - Validación de audience, issuer y expiración.
 *  - Tokens anteriores revocados antes de emitir uno nuevo.
 *  - Sin exposición de datos internos en respuestas de error.
 */
class GoogleTokenController extends Controller
{
    public function login(Request $request)
    {
        try {
            $request->validate([
                'token' => 'required|string',
            ]);

            // ====================================================
            // STEP 1: VERIFICAR FIRMA CRIPTOGRÁFICA DEL JWT
            //         ISO 27001 — A.9.4.2 (Secure log-on)
            // ====================================================
            $googleAuth = new AccessToken();
            $payload = $googleAuth->verify($request->token, [
                'audience'       => config('services.google.client_id'),
                'throwException' => true,
            ]);

            if (!$payload) {
                Log::warning('[Google Auth] Token inválido — verificación de firma falló');
                return response()->json(['message' => 'Token inválido'], 401);
            }

            // ====================================================
            // STEP 2: VALIDACIONES ADICIONALES
            // ====================================================
            if (($payload['email_verified'] ?? false) !== true) {
                return response()->json(['message' => 'Email no verificado por Google'], 401);
            }

            $email = $payload['email'] ?? null;
            $name  = $payload['name']  ?? 'Usuario Google';

            if (!$email) {
                return response()->json(['message' => 'Token no contiene email'], 401);
            }

            // ====================================================
            // STEP 3: BUSCAR O CREAR PERSONA
            // ====================================================
            $persona = Persona::where('Email', $email)->first();

            if (!$persona) {
                $rutGenerado = substr((string)($payload['sub'] ?? Str::uuid()), 0, 20);

                $persona = Persona::create([
                    'Nombre'    => $name,
                    'apellido1' => '',
                    'apellido2' => null,
                    'Rut'       => $rutGenerado,
                    'Email'     => $email,
                ]);
            }

            // ====================================================
            // STEP 4: BUSCAR O CREAR USER
            // ====================================================
            $user = User::where('idPersona', $persona->idPersona)->first();

            if (!$user) {
                $user = User::create([
                    'idPersona'     => $persona->idPersona,
                    'Contrasena'    => bcrypt(Str::random(32)),
                    'estadoSancion' => 'ACTIVO',
                ]);

                $rol = Rol::where('Nombre', 'ALUMNO')->first();
                if ($rol) {
                    $user->roles()->attach($rol->IdRol);
                }
            }

            // ====================================================
            // STEP 5: TOKEN SANCTUM
            //         ISO 27001 — A.9.2.1: Revocar tokens anteriores
            // ====================================================
            $user->tokens()->delete();
            $token = $user->createToken('auth-token')->plainTextToken;

            return response()->json([
                'token' => $token,
                'user' => [
                    'id'     => $user->idUser,
                    'nombre' => $persona->Nombre,
                    'email'  => $persona->Email,
                    'rol'    => [
                        'nombre' => $user->roles->first()->Nombre ?? null,
                    ],
                ],
            ], 200);

        } catch (\Throwable $e) {
            Log::error('[Google Auth] Error en login', [
                'exception' => get_class($e),
                'message'   => $e->getMessage(),
            ]);

            // ISO 27001 — A.14.1.2: No exponer detalles internos al cliente
            return response()->json([
                'message' => 'Error de autenticación con Google',
            ], 500);
        }
    }
}
