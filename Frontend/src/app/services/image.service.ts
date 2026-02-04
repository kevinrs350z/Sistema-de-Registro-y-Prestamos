import { Injectable } from '@angular/core';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class ImagenService {

  /**
   * Construye la URL pública a una imagen almacenada en Laravel (storage)
   * Usa la ruta API con CORS habilitado
   * @param path Ruta relativa guardada en BD (ej: tipo_equipos/camara.webp)
   * @returns URL completa del backend o null si no hay imagen
   */
  getStorageImage(path?: string | null): string | null {
    if (!path) {
      return null;
    }

    // Usar la API de imágenes con CORS habilitado
    return `${environment.apiBaseUrl}/api/images/${path}`;
  }

  /**
   * Obtener imagen de tipo de equipo por ID (con fallback a placeholder)
   * @param id ID del tipo de equipo
   * @returns URL de la imagen del tipo de equipo
   */
  getTipoEquipoImageById(id: number): string {
    return `${environment.apiBaseUrl}/api/tipo-equipos/${id}/imagen`;
  }

  
  /**
   * Resolver final de imagen para un tipo de equipo
   * Solo devuelve imágenes del backend, nunca del frontend
   * Prioridad: imagen_url (ya formateada) > imagen (ruta relativa) > por ID
   * @returns URL del backend o null si no hay imagen
   */
  resolveTipoEquipoImage(tipo: { id?: number; imagen_url?: string; imagen?: string; nombre?: string }): string | null {
    // Si el backend ya envía imagen_url formateada, convertirla a ruta API
    if (tipo?.imagen_url) {
      // Si la imagen_url ya es una ruta de storage, convertirla a API
      const storagePath = this.extractStoragePath(tipo.imagen_url);
      if (storagePath) {
        return this.getStorageImage(storagePath);
      }
      return tipo.imagen_url;
    }
    
    // Si solo viene la ruta relativa, construir URL
    if (tipo?.imagen) {
      return this.getStorageImage(tipo.imagen);
    }

    // Si tiene ID, usar el endpoint por ID (tiene placeholder)
    if (tipo?.id) {
      return this.getTipoEquipoImageById(tipo.id);
    }

    return null;
  }

  /**
   * Extrae la ruta del storage desde una URL completa
   * Ej: http://localhost:8000/storage/tipo_equipos/img.jpg -> tipo_equipos/img.jpg
   */
  private extractStoragePath(url: string): string | null {
    if (!url) return null;
    
    // Buscar el patrón /storage/ en la URL
    const match = url.match(/\/storage\/(.+)$/);
    return match ? match[1] : null;
  }
}
