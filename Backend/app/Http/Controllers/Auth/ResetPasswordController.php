<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use App\Models\User;

class ResetPasswordController extends Controller
{
    public function reset(Request $request)
    {
        // Aceptar ambas formas de "email"
        $email = $request->input('email') ?? $request->input('Email');

        $request->validate([
            'token' => 'required',
            'email' => 'required_without:Email|email',
            'Email' => 'required_without:email|email',
            'password' => 'required|min:8|confirmed|regex:/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&#+\-_.]).{8,}$/',
        ]);

        // Buscar el registro de password_resets por email
        $record = DB::table('password_resets')
            ->where('email', $email)
            ->first();

        if (!$record) {
            return response()->json(['message' => 'Token inválido o expirado (no encontrado en BD).'], 400);
        }

        // Verificar expiración (tokens válidos por 60 minutos)
        if (now()->diffInMinutes($record->created_at) > 60) {
            DB::table('password_resets')->where('email', $email)->delete();
            return response()->json(['message' => 'El token ha expirado. Solicita uno nuevo.'], 400);
        }

        // ISO 27001 — A.10.1.1: Comparar token SOLO contra hash (nunca plaintext)
        if (!Hash::check($request->token, $record->token)) {
            return response()->json(['message' => 'El token no coincide.'], 400);
        }

        // Buscar usuario en tu tabla (campo "Email" con mayúscula)
        $user = User::where('Email', $email)->first();

        if (!$user) {
            return response()->json(['message' => 'Usuario no encontrado.'], 404);
        }

        // Actualizar la contraseña
        $user->Contrasena = Hash::make($request->password);
        $user->save();

        // Eliminar el token usado
        DB::table('password_resets')->where('email', $email)->delete();

        return response()->json(['message' => 'Contraseña restablecida correctamente.']);
    }

    /**
     * ISO 27001 — A.9.4.2 / A.10.1.1
     * Valida un token de restablecimiento de contraseña.
     *
     * NOTA: Dado que el token está hasheado, se buscan solo registros no
     * expirados y se comparan hasta un máximo de 50 filas para evitar DoS.
     */
    public function validateToken($token)
    {
        // Solo registros no expirados (60 min)
        $records = DB::table('password_resets')
            ->where('created_at', '>=', now()->subMinutes(60))
            ->limit(50)
            ->get();

        foreach ($records as $record) {
            if (Hash::check($token, $record->token)) {
                return response()->json(['email' => $record->email]);
            }
        }

        // Limpiar tokens expirados (garbage collection)
        DB::table('password_resets')
            ->where('created_at', '<', now()->subMinutes(60))
            ->delete();

        return response()->json(['message' => 'Token inválido o expirado.'], 400);
    }
}
