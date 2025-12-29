import { Injectable, signal } from '@angular/core';
import { CarritoItem } from '../components/alumno/catalogo-equipos/carrito-item.model';

@Injectable({ providedIn: 'root' })
export class CarritoService {

  private _carrito = signal<CarritoItem[]>([]);

  setCarrito(items: CarritoItem[]) {
    this._carrito.set(items);
  }

  getCarrito(): CarritoItem[] {
    return this._carrito();
  }

  limpiar() {
    this._carrito.set([]);
  }
}
