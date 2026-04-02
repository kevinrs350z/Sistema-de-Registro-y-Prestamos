@echo off
echo ========================================
echo   Scheduler - Sistema Prestamos
echo   (Rechazo automatico cada minuto)
echo ========================================
echo.

cd /d "%~dp0"

echo Ejecutando scheduler en bucle cada 60 segundos...
echo Presiona Ctrl+C para detener
echo.

:loop
php artisan schedule:run --verbose --no-interaction
timeout /t 60 /nobreak >nul
goto loop
