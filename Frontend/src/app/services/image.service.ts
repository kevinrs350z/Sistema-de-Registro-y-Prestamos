import { Injectable } from '@angular/core';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class ImagenService {

  /**
   * Construye la URL pública a una imagen almacenada en Laravel (storage)
   * @param path Ruta relativa guardada en BD (ej: tipos_equipo/camara.webp)
   * @returns URL completa del backend o null si no hay imagen
   */
  getStorageImage(path?: string | null): string | null {
    if (!path) {
      return null;
    }

    return `${environment.apiBaseUrl}/storage/${path}`;
  }

  
  /**
   * Resolver final de imagen para un tipo de equipo
   * Solo devuelve imágenes del backend, nunca del frontend
   * Prioridad: imagen_url (ya formateada) > imagen (ruta relativa)
   * @returns URL del backend o null si no hay imagen
   */
  resolveTipoEquipoImage(tipo: { imagen_url?: string; imagen?: string; nombre?: string }): string | null {
    // Si el backend ya envía imagen_url formateada, usarla
    if (tipo?.imagen_url) {
      return tipo.imagen_url;
    }
    
    // Si solo viene la ruta relativa, construir URL
    if (tipo?.imagen) {
      return this.getStorageImage(tipo.imagen);
    }

    return null;
  }
}
