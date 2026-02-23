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
            'password' => 'required|min:8|confirmed',
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

        // Comparar token con hash almacenado (compatible con ambos formatos)
        $tokenValido = Hash::check($request->token, $record->token)
                    || $request->token === $record->token;

        if (!$tokenValido) {
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

    public function validateToken($token)
    {
        // Buscar en todos los registros de password_resets
        $records = DB::table('password_resets')->get();

        foreach ($records as $record) {
            // Compatible: verificar hash o comparación directa (migración gradual)
            $match = Hash::check($token, $record->token) || $token === $record->token;

            if ($match) {
                // Verificar expiración (60 minutos)
                if (now()->diffInMinutes($record->created_at) > 60) {
                    DB::table('password_resets')->where('email', $record->email)->delete();
                    return response()->json(['message' => 'Token expirado. Solicita uno nuevo.'], 400);
                }

                return response()->json(['email' => $record->email]);
            }
        }

        return response()->json(['message' => 'Token inválido o expirado.'], 400);
    }
}
