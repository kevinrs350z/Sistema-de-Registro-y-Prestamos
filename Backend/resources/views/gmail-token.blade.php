<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Gmail API - Refresh Token Obtenido</title>
    <style>
        body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            max-width: 700px;
            margin: 50px auto;
            padding: 20px;
            background: #f5f5f5;
        }
        .card {
            background: white;
            border-radius: 12px;
            padding: 30px;
            box-shadow: 0 2px 10px rgba(0,0,0,0.1);
        }
        h1 { color: #1a73e8; font-size: 24px; }
        .token-box {
            background: #f8f9fa;
            border: 2px solid #1a73e8;
            border-radius: 8px;
            padding: 15px;
            word-break: break-all;
            font-family: monospace;
            font-size: 14px;
            margin: 15px 0;
            cursor: pointer;
        }
        .token-box:hover { background: #e8f0fe; }
        .steps {
            background: #fff3cd;
            border-radius: 8px;
            padding: 15px;
            margin-top: 20px;
        }
        .steps h3 { margin-top: 0; color: #856404; }
        .steps code {
            background: #e9ecef;
            padding: 2px 6px;
            border-radius: 4px;
            font-size: 13px;
        }
        .success { color: #28a745; }
        .warning { color: #dc3545; }
        button {
            background: #1a73e8;
            color: white;
            border: none;
            padding: 8px 16px;
            border-radius: 6px;
            cursor: pointer;
            font-size: 14px;
        }
        button:hover { background: #1557b0; }
    </style>
</head>
<body>
    <div class="card">
        <h1>✅ Gmail API Autorizado Correctamente</h1>

        @if($refreshToken !== 'NO SE OBTUVO (intenta de nuevo con prompt=consent)')
            <p class="success"><strong>Refresh Token obtenido exitosamente.</strong></p>
            
            <p>Haz clic en el token para copiarlo:</p>
            <div class="token-box" id="tokenBox" onclick="copyToken()" title="Clic para copiar">
                {{ $refreshToken }}
            </div>
            <button onclick="copyToken()">📋 Copiar Token</button>
            <span id="copied" style="display:none; color: #28a745; margin-left: 10px;">¡Copiado!</span>

            <div class="steps">
                <h3>📝 Pasos para activar Gmail API:</h3>
                <ol>
                    <li>Abre el archivo <code>.env</code> en tu Backend</li>
                    <li>Cambia <code>MAIL_MAILER=smtp</code> a <code>MAIL_MAILER=gmail-api</code></li>
                    <li>Agrega esta línea:<br>
                        <code>GMAIL_REFRESH_TOKEN={{ $refreshToken }}</code>
                    </li>
                    <li>Reinicia el servidor: <code>php artisan config:clear</code></li>
                    <li>Inicia el worker: <code>php artisan queue:work</code></li>
                </ol>
            </div>
        @else
            <p class="warning"><strong>No se pudo obtener el refresh_token.</strong></p>
            <p>Intenta de nuevo visitando <a href="/gmail/authorize">/gmail/authorize</a></p>
        @endif

        @if($expiresIn)
            <p style="margin-top: 15px; color: #666; font-size: 13px;">
                Access token expira en: {{ $expiresIn }} segundos
            </p>
        @endif
    </div>

    <script>
        function copyToken() {
            const token = document.getElementById('tokenBox').innerText.trim();
            navigator.clipboard.writeText(token).then(() => {
                document.getElementById('copied').style.display = 'inline';
                setTimeout(() => {
                    document.getElementById('copied').style.display = 'none';
                }, 2000);
            });
        }
    </script>
</body>
</html>
