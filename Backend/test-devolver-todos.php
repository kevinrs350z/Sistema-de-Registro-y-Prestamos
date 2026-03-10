<?php
require 'vendor/autoload.php';
$app = require_once 'bootstrap/app.php';
$app->make('Illuminate\Contracts\Console\Kernel')->bootstrap();

use App\Services\Prestamos\PrestamoAdminService;
use Illuminate\Support\Facades\Auth;
use App\Models\User;

// Obtener cualquier usuario válido
$admin = User::first();

if ($admin) {
    Auth::login($admin);
    echo "Autenticado como: {$admin->email}\n\n";
} else {
    echo "No hay usuarios disponibles, ejecutando sin autenticación\n\n";
}

// Ejecutar la función
$service = app(PrestamoAdminService::class);
$result = $service->devolverTodosMasivo('Testing masivo desde script');

// Mostrar resultados
echo "RESULTADO:\n";
echo "==========\n";
echo json_encode($result, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE) . "\n";
echo "\nProcesados: " . $result['procesados'] . "\n";
echo "Errores: " . count($result['errores']) . "\n";

if (!empty($result['errores'])) {
    echo "\nPrimer error:\n";
    echo $result['errores'][0]['error'] . "\n";
}

