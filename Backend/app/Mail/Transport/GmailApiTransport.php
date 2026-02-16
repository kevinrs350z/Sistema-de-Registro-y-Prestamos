<?php

namespace App\Mail\Transport;

use GuzzleHttp\Client;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Cache;
use Symfony\Component\Mailer\SentMessage;
use Symfony\Component\Mailer\Transport\AbstractTransport;
use Symfony\Component\Mime\MessageConverter;

/**
 * Transporte de correo que usa Gmail API (HTTPS) en lugar de SMTP.
 * Útil cuando la red bloquea puertos SMTP (25, 465, 587).
 * Solo necesita puerto 443 (HTTPS).
 */
class GmailApiTransport extends AbstractTransport
{
    private string $clientId;
    private string $clientSecret;
    private string $refreshToken;
    private Client $httpClient;

    public function __construct(string $clientId, string $clientSecret, string $refreshToken)
    {
        parent::__construct();

        $this->clientId     = $clientId;
        $this->clientSecret = $clientSecret;
        $this->refreshToken = $refreshToken;
        $this->httpClient   = new Client([
            'timeout' => 30,
            'verify'  => false, // Para evitar problemas con certificados en Windows
        ]);
    }

    protected function doSend(SentMessage $message): void
    {
        $email = MessageConverter::toEmail($message->getOriginalMessage());

        // Construir el mensaje RFC 2822 completo
        $rawMessage = $message->getOriginalMessage()->toString();

        // Gmail API espera el mensaje en base64url
        $encodedMessage = rtrim(strtr(base64_encode($rawMessage), '+/', '-_'), '=');

        $accessToken = $this->getAccessToken();

        try {
            $response = $this->httpClient->post(
                'https://gmail.googleapis.com/gmail/v1/users/me/messages/send',
                [
                    'headers' => [
                        'Authorization' => 'Bearer ' . $accessToken,
                        'Content-Type'  => 'application/json',
                    ],
                    'json' => [
                        'raw' => $encodedMessage,
                    ],
                ]
            );

            $result = json_decode($response->getBody()->getContents(), true);

            Log::info('✅ Gmail API: Email enviado exitosamente', [
                'message_id' => $result['id'] ?? 'unknown',
                'to'         => $email->getTo()[0]->getAddress() ?? 'unknown',
                'subject'    => $email->getSubject(),
            ]);
        } catch (\GuzzleHttp\Exception\ClientException $e) {
            $errorBody = $e->getResponse()->getBody()->getContents();
            Log::error('❌ Gmail API: Error al enviar email', [
                'status' => $e->getResponse()->getStatusCode(),
                'error'  => $errorBody,
                'to'     => $email->getTo()[0]->getAddress() ?? 'unknown',
            ]);

            // Si el token expiró, limpiamos cache y reintentamos una vez
            if ($e->getResponse()->getStatusCode() === 401) {
                Cache::forget('gmail_api_access_token');
                $accessToken = $this->getAccessToken();

                $this->httpClient->post(
                    'https://gmail.googleapis.com/gmail/v1/users/me/messages/send',
                    [
                        'headers' => [
                            'Authorization' => 'Bearer ' . $accessToken,
                            'Content-Type'  => 'application/json',
                        ],
                        'json' => [
                            'raw' => $encodedMessage,
                        ],
                    ]
                );

                Log::info('✅ Gmail API: Email enviado en reintento tras refresh de token');
            } else {
                throw $e;
            }
        }
    }

    /**
     * Obtiene un access token usando el refresh token.
     * El token se cachea por 50 minutos (expira a los 60).
     */
    private function getAccessToken(): string
    {
        return Cache::remember('gmail_api_access_token', 3000, function () {
            Log::info('🔄 Gmail API: Obteniendo nuevo access token...');

            $response = $this->httpClient->post('https://oauth2.googleapis.com/token', [
                'form_params' => [
                    'client_id'     => $this->clientId,
                    'client_secret' => $this->clientSecret,
                    'refresh_token' => $this->refreshToken,
                    'grant_type'    => 'refresh_token',
                ],
            ]);

            $data = json_decode($response->getBody()->getContents(), true);

            if (empty($data['access_token'])) {
                Log::error('❌ Gmail API: No se pudo obtener access token', $data);
                throw new \RuntimeException('No se pudo obtener access token de Gmail API');
            }

            Log::info('✅ Gmail API: Access token obtenido correctamente');

            return $data['access_token'];
        });
    }

    public function __toString(): string
    {
        return 'gmail-api';
    }
}
