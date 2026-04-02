@echo off
echo ========================================
echo   Worker de Colas - Sistema Prestamos
echo ========================================
echo.

cd /d "%~dp0"

echo Iniciando worker para cola de emails...
echo Presiona Ctrl+C para detener
echo.

php artisan queue:work database --queue=emails --sleep=3 --tries=3 -v

pause
