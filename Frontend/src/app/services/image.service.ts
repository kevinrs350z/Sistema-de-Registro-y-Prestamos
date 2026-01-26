import { Injectable } from '@angular/core';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class ImagenService {

  // Imagen por defecto (cuando no hay imagen en backend)
  private readonly DEFAULT_IMAGE = 'assets/equipos/lampara.jpg';

  /**
   * Construye la URL pública a una imagen almacenada en Laravel (storage)
   * @param path Ruta relativa guardada en BD (ej: tipos_equipo/camara.webp)
   */
  getStorageImage(path?: string | null): string {
    if (!path) {
      return this.DEFAULT_IMAGE;
    }

    return `${environment.apiBaseUrl}/storage/${path}`;
  }

  
  /**
   * Resolver final de imagen para un tipo de equipo
   * Prioridad:
   * 1 Imagen desde backend
   * 2 Fallback por nombre
   * 3 Imagen default
   */
  resolveTipoEquipoImage(tipo: { imagen?: string; nombre?: string }): string {
    if (tipo?.imagen) {
      return this.getStorageImage(tipo.imagen);
    }

    // Fallback por nombre
    if (tipo?.nombre) {
      const nombreLower = tipo.nombre.toLowerCase();
    }

    return this.DEFAULT_IMAGE;
  }
}
