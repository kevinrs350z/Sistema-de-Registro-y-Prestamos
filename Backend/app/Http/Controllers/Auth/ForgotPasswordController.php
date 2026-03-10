<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;
use App\Models\User;
use App\Mail\PasswordResetMail;
use App\Jobs\SendGenericEmailJob;

class ForgotPasswordController extends Controller
{
    /**
     * Envía un enlace de restablecimiento de contraseña al correo del usuario.
     * 
     * Optimizado: el correo se despacha vía cola (async) para respuesta instantánea.
     * El token se almacena hasheado por seguridad.
     */
    public function sendResetLinkEmail(Request $request)
    {
        $email = $request->input('email') ?? $request->input('Email');

        if (!$email) {
            return response()->json([
                'message' => 'El correo no fue recibido correctamente.',
            ], 400);
        }

        $request->merge(['email' => $email]);
        $request->validate(['email' => 'required|email']);

        $user = User::where('Email', $email)->first();

        // ISO 27001 — A.9.4.2: Respuesta genérica para no enumerar cuentas
        if (!$user) {
            return response()->json(['message' => 'Si el correo está registrado, recibirás un enlace de recuperación.']);
        }

        // Eliminar tokens anteriores para este email
        DB::table('password_resets')->where('email', $email)->delete();

        $token = Str::random(60);

        // Almacenar token hasheado por seguridad
        DB::table('password_resets')->insert([
            'email'      => $email,
            'token'      => Hash::make($token),
            'created_at' => now(),
        ]);

        $frontendUrl = config('app.frontend_url', 'http://localhost:4200') . "/reset-password#$token";

        // ✅ Envío ASÍNCRONO del correo via Job (respuesta instantánea al usuario)
        SendGenericEmailJob::dispatch(
            $email,
            new PasswordResetMail($user, $frontendUrl),
            'password-reset'
        );

        // ISO 27001 — A.9.4.2: Misma respuesta tanto si existe como si no
        return response()->json(['message' => 'Si el correo está registrado, recibirás un enlace de recuperación.']);
    }
}
