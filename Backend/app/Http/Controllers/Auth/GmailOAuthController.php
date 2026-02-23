<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use GuzzleHttp\Client;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;

/**
 * Controlador temporal para obtener el refresh_token de Gmail API.
 * 
 * FLUJO (solo una vez):
 * 1. Visitar /gmail/authorize en el navegador
 * 2. Iniciar sesión con la cuenta de Gmail del sistema
 * 3. Autorizar el acceso
 * 4. Se muestra el refresh_token para copiar al .env
 */
class GmailOAuthController extends Controller
{
    /**
     * Paso 1: Redirige a Google para autorizar la app con scope de Gmail.
     */
    public function redirectToGmail()
    {
        $params = http_build_query([
            'client_id'     => env('GOOGLE_CLIENT_ID'),
            'redirect_uri'  => env('APP_URL') . '/gmail/callback',
            'response_type' => 'code',
            'scope'         => 'https://www.googleapis.com/auth/gmail.send',
            'access_type'   => 'offline',
            'prompt'        => 'consent', // Fuerza que devuelva refresh_token
        ]);

        return redirect('https://accounts.google.com/o/oauth2/v2/auth?' . $params);
    }

    /**
     * Paso 2: Google redirige aquí con el authorization code.
     * Intercambiamos el code por tokens (access_token + refresh_token).
     */
    public function callback(Request $request)
    {
        if ($request->has('error')) {
            return response()->json([
                'error'   => $request->get('error'),
                'message' => 'El usuario rechazó la autorización o hubo un error.',
            ], 400);
        }

        $code = $request->get('code');

        if (!$code) {
            return response()->json(['error' => 'No se recibió authorization code'], 400);
        }

        try {
            $client = new Client(['verify' => false]);

            $response = $client->post('https://oauth2.googleapis.com/token', [
                'form_params' => [
                    'client_id'     => env('GOOGLE_CLIENT_ID'),
                    'client_secret' => env('GOOGLE_CLIENT_SECRET'),
                    'code'          => $code,
                    'grant_type'    => 'authorization_code',
                    'redirect_uri'  => env('APP_URL') . '/gmail/callback',
                ],
            ]);

            $data = json_decode($response->getBody()->getContents(), true);

            Log::info('✅ Gmail OAuth: Tokens obtenidos', [
                'has_access_token'  => !empty($data['access_token']),
                'has_refresh_token' => !empty($data['refresh_token']),
            ]);

            $refreshToken = $data['refresh_token'] ?? 'NO SE OBTUVO (intenta de nuevo con prompt=consent)';

            // Mostrar página con instrucciones claras
            return response()->view('gmail-token', [
                'refreshToken' => $refreshToken,
                'accessToken'  => $data['access_token'] ?? '',
                'expiresIn'    => $data['expires_in'] ?? '',
            ]);
        } catch (\Exception $e) {
            Log::error('❌ Gmail OAuth: Error al intercambiar code por tokens', [
                'error' => $e->getMessage(),
            ]);

            return response()->json([
                'error'   => 'Error al obtener tokens',
                'message' => $e->getMessage(),
            ], 500);
        }
    }
}
