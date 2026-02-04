<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Symfony\Component\HttpFoundation\Response;

class ImageController extends Controller
{
    /**
     * Servir imágenes del storage público con headers CORS correctos.
     * 
     * @param string $path Ruta relativa de la imagen (ej: tipo_equipos/imagen.jpg)
     * @return Response
     */
    public function show(string $path)
    {
        // Verificar que el archivo existe en el storage público
        if (!Storage::disk('public')->exists($path)) {
            // Intentar buscar imagen por defecto o retornar 404
            return response()->json([
                'error' => 'Imagen no encontrada',
                'path' => $path
            ], 404);
        }

        $file = Storage::disk('public')->get($path);
        $mimeType = Storage::disk('public')->mimeType($path);

        return response($file, 200)
            ->header('Content-Type', $mimeType)
            ->header('Access-Control-Allow-Origin', '*')
            ->header('Access-Control-Allow-Methods', 'GET, OPTIONS')
            ->header('Access-Control-Allow-Headers', 'Content-Type, Authorization')
            ->header('Cache-Control', 'public, max-age=86400'); // Cache de 1 día
    }

    /**
     * Servir imagen de tipo de equipo por ID.
     * Útil como fallback cuando la imagen no existe.
     * 
     * @param int $id ID del tipo de equipo
     * @return Response
     */
    public function tipoEquipo(int $id)
    {
        $tipoEquipo = \App\Models\TipoEquipo::find($id);

        if (!$tipoEquipo || !$tipoEquipo->imagen) {
            return $this->getPlaceholderImage();
        }

        return $this->show($tipoEquipo->imagen);
    }

    /**
     * Retorna una imagen placeholder cuando no existe la imagen solicitada.
     */
    private function getPlaceholderImage()
    {
        // SVG placeholder simple
        $svg = '<svg xmlns="http://www.w3.org/2000/svg" width="300" height="200" viewBox="0 0 300 200">
            <rect width="300" height="200" fill="#e0e0e0"/>
            <text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle" 
                  font-family="Arial, sans-serif" font-size="16" fill="#999">
                Sin imagen
            </text>
        </svg>';

        return response($svg, 200)
            ->header('Content-Type', 'image/svg+xml')
            ->header('Access-Control-Allow-Origin', '*')
            ->header('Cache-Control', 'public, max-age=3600');
    }
}
