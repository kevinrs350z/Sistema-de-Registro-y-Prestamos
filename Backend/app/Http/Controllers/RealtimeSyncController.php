<?php

namespace App\Http\Controllers;

use App\Models\SistemaEvento;
use Illuminate\Http\Request;
use Illuminate\Http\Response;
use Symfony\Component\HttpFoundation\StreamedResponse;
use Illuminate\Support\Facades\Log;

class RealtimeSyncController extends Controller
{
    /**
     * SSE Stream para sincronización en tiempo real
     * Conecta clientes y envía eventos cuando ocurren cambios
     * 
     * Nota: El token se pasa como query parameter porque EventSource
     * no soporta headers personalizados nativamente.
     */
    public function stream(Request $request): StreamedResponse
    {
        // 🔐 AUTENTICACIÓN: Token desde query param (EventSource no soporta headers)
        $token = $request->query('token');
        
        if (!$token) {
            return new StreamedResponse(function () {
                header('Content-Type: text/event-stream');
                echo ": error: No token provided\n\n";
                flush();
            }, 401);
        }

        // Validar token (buscar en tokens personal de Sanctum)
        $user = null;
        try {
            // Obtener el usuario desde el token personalizado
            $personalAccessToken = \Laravel\Sanctum\PersonalAccessToken::findToken($token);
            
            if (!$personalAccessToken || !$personalAccessToken->tokenable) {
                Log::warning('[RealtimeSyncController] Token inválido o expirado');
                return new StreamedResponse(function () {
                    header('Content-Type: text/event-stream');
                    echo ": error: Invalid or expired token\n\n";
                    flush();
                }, 401);
            }
            
            $user = $personalAccessToken->tokenable;
        } catch (\Throwable $e) {
            Log::error('[RealtimeSyncController] Error validando token:', ['error' => $e->getMessage()]);
            return new StreamedResponse(function () {
                header('Content-Type: text/event-stream');
                echo ": error: Authentication failed\n\n";
                flush();
            }, 401);
        }

        // ✅ Usuario autenticado, iniciar stream
        $lastEventId = intval($request->query('lastEventId', 0));

        $response = new StreamedResponse(function () use ($lastEventId, $user) {
            // Headers para SSE
            header('Content-Type: text/event-stream');
            header('Cache-Control: no-cache');
            header('Connection: keep-alive');
            header('X-Accel-Buffering: no');
            
            // Logging
            Log::info('[RealtimeSyncController] SSE conectado', ['user_id' => $user->id]);
            
            // Notificación inicial
            echo ": SSE conectado - esperando eventos...\n\n";
            flush();

            $lastCheck = now();
            $timeout = 55; // 55 segundos, antes de que Nginx/servidor cierre
            
            while (true) {
                // Verificar conexión
                if (connection_aborted()) {
                    Log::info('[RealtimeSyncController] Conexión abortada por cliente', ['user_id' => $user->id]);
                    break;
                }

                // Buscar eventos más recientes
                $eventos = SistemaEvento::where('id', '>', $lastEventId)
                    ->orderBy('id', 'asc')
                    ->limit(50)
                    ->get();

                foreach ($eventos as $evento) {
                    $datos = json_decode($evento->datos, true) ?? [];

                    echo "id: {$evento->id}\n";
                    echo "event: {$evento->tipo}\n";
                    echo "data: " . json_encode([
                        'tipo' => $evento->tipo,
                        'evento_id' => $evento->id,
                        'referencia_id' => $evento->referencia_id,
                        'referencia_tipo' => $evento->referencia_tipo,
                        'datos' => $datos,
                        'timestamp' => $evento->created_at->toIso8601String(),
                    ]) . "\n\n";
                    
                    $lastEventId = $evento->id;
                    flush();

                    // Prevenir timeout
                    if ($evento->created_at->diffInSeconds(now()) > $timeout - 5) {
                        break;
                    }
                }

                // Keep-alive: enviar comentario cada 30 segundos sin eventos
                if (now()->diffInSeconds($lastCheck) > 30) {
                    echo ": keep-alive\n\n";
                    flush();
                    $lastCheck = now();
                }

                // Sleep para no saturar CPU
                sleep(1);

                // Timeout de 55 segundos
                if (now()->diffInSeconds($lastCheck) > $timeout) {
                    echo ": timeout - reconectando...\n\n";
                    flush();
                    break;
                }
            }
            
            Log::info('[RealtimeSyncController] SSE desconectado', ['user_id' => $user->id]);
        });

        return $response;
    }
}
