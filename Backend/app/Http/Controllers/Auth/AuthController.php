<?php

namespace App\Http\Controllers\Auth; // <-- Asegúrate de que este namespace coincida con tu ruta

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Auth; 
use Illuminate\Support\Facades\RateLimiter;
use Illuminate\Support\Str;
use App\Mail\LoginNotification;
use App\Jobs\SendGenericEmailJob;



use App\Models\Persona; 
use App\Models\User;
use App\Models\Rol;


class AuthController extends Controller
{
    /**
     * Registra un nuevo usuario (Persona y User) y genera un token.
     */
    public function register(Request $request) // <--- ¡AQUÍ EMPIEZA EL MÉTODO!
    {
        // 1. Validar TODOS los datos
        $request->validate([
            'Nombre' => 'required|string|max:255',
            'apellido1' => 'required|string|max:255',
            'apellido2' => 'nullable|string|max:255', // Añadido 'nullable' si es opcional
            'Rut' => 'required|string|unique:persona,Rut',
            'email' => 'required|email|unique:persona,Email',
            'password' => 'required|string|min:8|confirmed|regex:/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&#+\-_.]).{8,}$/',
        ]);
    
        // 2. Crear la Entidad Persona
        $persona = Persona::create([
            'Nombre' => $request->Nombre,
            'apellido1' => $request->apellido1,
            'apellido2' => $request->apellido2 ?? null,
            'Rut' => $request->Rut,
            'Email' => $request->email,
        ]);
    
        // 3. Crear la Entidad User 
        $user = User::create([
            'idPersona' => $persona->IdPersona, 
            // Contrasena debe coincidir con la 'C' mayúscula de tu tabla
            'Contrasena' => Hash::make($request->password), 
            'estadoSancion' => 'ACTIVO', 
        ]);
    
        // 4. Asignar Rol Predeterminado 
        $defaultRole = Rol::where('Nombre', 'ALUMNO')->first(); 
        
        if ($defaultRole) {
            $user->roles()->attach($defaultRole->IdRol);
        } else {
            // Manejo de error si el rol ALUMNO no existe.
            return response()->json(['message' => 'Error: Rol predeterminado no encontrado.'], 500);
        }
    
        // 5. Generar Token 
        $token = $user->createToken('auth-token')->plainTextToken;
    
        return response()->json([
            'token' => $token,
            'user' => [
                'id' => $user->idUser,
                'nombre' => $persona->Nombre ?? '',
                'email' => $persona->Email ?? '',
                'rol' => [
                    'nombre' => $defaultRole->Nombre ?? 'ALUMNO',
                ],
            ],
        ], 201);
    } 

   /*
     public function login(Request $request)
    {
        // 1. Validar los datos de entrada
        $request->validate([
            'idPersona' => 'required|integer|exists:users,idPersona',
            'password' => 'required|string',
        ]);

        // 2. Mapear las credenciales
        // NOTA CLAVE: La llave de la contraseña SIEMPRE DEBE SER 'password' 
        // en el array de credenciales para que Laravel la verifique.
        $credentials = [
            'idPersona' => $request->idPersona, // Identificador
            'password' => $request->password,   // La llave DEBE ser 'password'
        ];

        // 3. Intentar la autenticación
        // Necesitas indicarle a Laravel qué campo usar para buscar.
        // Como 'idPersona' no es el campo por defecto, usamos where y luego attempt.

        // Buscamos primero el usuario por el ID (nuestro identificador)
        $user = User::where('idPersona', $request->idPersona)->first();

        // Si el usuario existe y la contraseña coincide (usando el campo Contrasena del modelo)
        if ($user && Auth::attempt(['idPersona' => $request->idPersona, 'password' => $request->password])) {

            // Ya que usamos Auth::attempt, Laravel ya hizo el trabajo de verificar la contraseña
            
            // 4. Crear el token
            $token = $user->createToken('auth-token')->plainTextToken;

            // Enviar notificación de login de forma asíncrona
            if ($user->persona && $user->persona->Email) {
                SendGenericEmailJob::dispatch(
                    $user->persona->Email,
                    new LoginNotification($user),
                    'login-notification'
                );
            }
            return response()->json([
                'user' => $user->load('persona', 'roles'),
                'token' => $token
            ], 200);
        }

        // Falla: Credenciales inválidas
        return response()->json([
            'message' => 'Credenciales inválidas'
        ], 401);
    }
    */
    public function login(Request $request)
    {
        // 1️⃣ Validar los datos de entrada
        //    ISO 27001 — A.9.4.2: NO usar «exists» para no enumerar cuentas
        $request->validate([
            'email' => 'required|email',
            'password' => 'required|string',
        ]);

        // ISO 27001 — A.9.4.2: Account lockout tras intentos fallidos
        $throttleKey = Str::lower($request->email) . '|' . $request->ip();

        if (RateLimiter::tooManyAttempts($throttleKey, 5)) {
            $seconds = RateLimiter::availableIn($throttleKey);
            return response()->json([
                'message' => "Demasiados intentos fallidos. Intenta de nuevo en {$seconds} segundos.",
            ], 429);
        }

        // 2️⃣ Buscar el usuario asociado a ese email
        $user = User::whereHas('persona', function ($query) use ($request) {
            $query->where('Email', $request->email);
        })
        ->with(['persona', 'roles'])
        ->first();

        // 2.1️⃣ Bloquear acceso si está desactivado
        if ($user && (($user->estado ?? 'ACTIVO') !== 'ACTIVO' || (($user->persona->estado ?? 'ACTIVO') !== 'ACTIVO'))) {
            return response()->json(['message' => 'Credenciales inválidas'], 401);
        }

        // 3️⃣ Validar credenciales
        if (!$user || !Auth::attempt(['idPersona' => $user->idPersona, 'password' => $request->password])) {
            // Incrementar contador de intentos fallidos (expira en 60 segundos)
            RateLimiter::hit($throttleKey, 60);
            return response()->json(['message' => 'Credenciales inválidas'], 401);
        }

        // Login exitoso: limpiar contador de intentos
        RateLimiter::clear($throttleKey);

        // 4️⃣ ISO 27001 — A.9.2.1: Revocar tokens anteriores antes de emitir uno nuevo
        //    Impide sesiones concurrentes no autorizadas.
        $user->tokens()->delete();

        // 5️⃣ Crear el token de autenticación
        $token = $user->createToken('auth-token')->plainTextToken;

        // 5️⃣ Obtener el rol principal (si solo tiene uno)
        $rol = $user->roles->first();

        // 6️⃣ Construir la respuesta limpia para el frontend
        return response()->json([
            'token' => $token,
            'user' => [
                'id' => $user->idUser,
                'nombre' => $user->persona->Nombre ?? '',
                'email' => $user->persona->Email ?? '',
                'rol' => [
                    'nombre' => $rol->Nombre ?? null,
                    'descripcion' => $rol->Descricion ?? null,
                ],
            ],
        ], 200);
    }

    /**
     * ISO 27001 — A.9.2.1: Cierre de sesión.
     * Revoca el token actual del usuario autenticado.
     */
    public function logout(Request $request)
    {
        // Revocar el token que se usó para esta request
        $request->user()->currentAccessToken()->delete();

        return response()->json(['message' => 'Sesión cerrada'], 200);
    }

}