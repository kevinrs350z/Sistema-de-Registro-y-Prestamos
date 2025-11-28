import { Component, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { TipoEquipoService } from '../../../services/tipoEquipo.service';

@Component({
  selector: 'app-catalogo-equipos',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './catalogo-equipos.component.html',
  styleUrls: ['./catalogo-equipos.component.css']
})
export class CatalogoEquiposComponent {

  private api = inject(TipoEquipoService);
  private router = inject(Router);

  tipos = signal<TipoEquipo[]>([]);
  equiposFisicos = signal<EquipoFisico[]>([]);

  categoriaSeleccionada = signal<string>('TODOS');
  busqueda = signal<string>('');

  carrito = signal<CarritoItem[]>([]);

  ngOnInit() {
    const token = localStorage.getItem('token') ?? '';
    if (!token) {
      alert('⚠️ Debes iniciar sesión para ver los equipos.');
      this.router.navigate(['/auth/login']);
      return;
    }

    this.api.getCatalogo().subscribe({
      next: (data: TipoEquipo[]) => {
        this.tipos.set(data);
      },
      error: (err: any) => {
        console.error('❌ Error al obtener catálogo:', err);
      },
    });
  }

  // ====================
  // CATEGORÍAS
  // ====================
  categorias = computed(() => {
    const todas = this.tipos().map(t => t.categoria ?? 'Otros');
    return ['TODOS', ...Array.from(new Set(todas))];
  });

  tiposFiltrados = computed(() => {
    const texto = this.busqueda().toLowerCase();
    const categoria = this.categoriaSeleccionada();

    return this.tipos().filter(t => {
      const coincideCategoria =
        categoria === 'TODOS' || (t.categoria ?? '') === categoria;

      const coincideTexto =
        t.nombre.toLowerCase().includes(texto) ||
        (t.descripcion ?? '').toLowerCase().includes(texto);

      return coincideCategoria && coincideTexto;
    });
  });

  filtrarPorBusqueda(event: Event) {
    this.busqueda.set((event.target as HTMLInputElement).value);
    }

  // ===========================
  // IMÁGENES
  // ===========================
  urlImagen(path: string): string {
    return `http://localhost:8000/storage/${path}`;
  }

  getImagenEquipo(e: TipoEquipo): string {
    const nombre = e.nombre?.toLowerCase() || '';

    if (nombre.includes('cámara') || nombre.includes('canon')) return 'assets/equipos/camara.jpg';
    if (nombre.includes('micrófono') || nombre.includes('rode')) return 'assets/equipos/aro.jpg';
    if (nombre.includes('tablet') || nombre.includes('wacom')) return 'assets/equipos/computador.jpg';
    if (nombre.includes('proyector') || nombre.includes('epson')) return 'assets/equipos/proyector.jpg';
    if (nombre.includes('grabadora') || nombre.includes('zoom')) return 'assets/equipos/luz.jpg';

    return 'assets/equipos/lampara.jpg';
  }

  // ===========================
  // CARRITO
  // ===========================
  estaEnCarrito(idTipo: number): boolean {
    return this.carrito().some(c => c.idTipoEquipo === idTipo);
  }

  getCantidad(idTipo: number): number {
    return this.carrito().find(c => c.idTipoEquipo === idTipo)?.cantidad ?? 0;
  }

  getModo(idTipo: number): 'cualquiera' | 'especifico' {
    return this.carrito().find(c => c.idTipoEquipo === idTipo)?.modo ?? 'cualquiera';
  }

  cambiarModoDesdeEvento(idTipo: number, event: Event) {
    const value = (event.target as HTMLSelectElement).value;
    this.cambiarModo(idTipo, value);
  }

  private agregarSiNoExiste(idTipo: number) {
    if (!this.estaEnCarrito(idTipo)) {
      this.carrito.set([
        ...this.carrito(),
        {
          idTipoEquipo: idTipo,
          cantidad: 1,
          modo: 'cualquiera',
          equiposSeleccionados: []
        }
      ]);
    }
  }

  cambiarCantidad(idTipo: number, delta: number) {
    if (!this.estaEnCarrito(idTipo) && delta > 0) {
      this.agregarSiNoExiste(idTipo);
    }

    this.carrito.update(items =>
      items.map(item => {
        if (item.idTipoEquipo === idTipo) {
          let nueva = item.cantidad + delta;
          if (nueva < 1) nueva = 1;

          const stock = this.tipos().find(t => t.id === idTipo)?.stock ?? 0;
          if (nueva > stock) nueva = stock;

          return { ...item, cantidad: nueva };
        }
        return item;
      })
    );
  }

  cambiarModo(idTipo: number, valor: string) {
    const modo = valor === 'especifico' ? 'especifico' : 'cualquiera';

    this.carrito.update(items =>
      items.map(item =>
        item.idTipoEquipo === idTipo
          ? { ...item, modo, equiposSeleccionados: [] }
          : item
      )
    );
  }

  toggleProducto(idTipo: number) {
    if (this.estaEnCarrito(idTipo)) {
      this.carrito.set(this.carrito().filter(c => c.idTipoEquipo !== idTipo));
    } else {
      this.agregarSiNoExiste(idTipo);
    }
  }

  toggleEquipo(idTipo: number) {
    this.toggleProducto(idTipo);
  }

  abrirModalEquipos(idTipo: number) {
    this.api.getEquiposPorTipo(idTipo).subscribe({
      next: (resp: EquipoFisico[]) => {
        this.equiposFisicos.set(resp);
        console.log('Equipos físicos disponibles:', resp);
      },
      error: (err: any) => console.error('Error al cargar equipos físicos', err)
    });
  }

  continuarReserva() {
    if (this.carrito().length === 0) {
      alert('⚠️ Debes seleccionar al menos un equipo antes de continuar.');
      return;
    }

    this.router.navigate(['/reservas/solicitar'], {
      state: { carrito: this.carrito() }
    });
  }
}

// ===========================
// INTERFACES
// ===========================
interface TipoEquipo {
  id: number;
  nombre: string;
  descripcion?: string;
  categoria?: string;
  imagen?: string;
  stock: number;
}

interface EquipoFisico {
  id: number;
  codigo: string;
  estado: string;
  tipo_equipo_id: number;
}

interface CarritoItem {
  idTipoEquipo: number;
  cantidad: number;
  modo: 'cualquiera' | 'especifico';
  equiposSeleccionados: number[];
}
