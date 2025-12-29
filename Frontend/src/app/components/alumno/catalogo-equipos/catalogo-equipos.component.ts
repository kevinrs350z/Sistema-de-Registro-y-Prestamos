import { Component, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { TipoEquipoService } from '../../../services/tipoEquipo.service';
import { CarritoItem } from '../catalogo-equipos/carrito-item.model';
import { CarritoService } from '../../../services/carrito.service';

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
  private carritoSrv = inject(CarritoService);

  // ===========================
  // ESTADOS
  // ===========================
  tipos = signal<TipoEquipo[]>([]);
  packs = signal<Pack[]>([]);
  equiposFisicos = signal<EquipoFisico[]>([]);

  categoriaSeleccionada = signal<string>('TODOS');
  busqueda = signal<string>('');

  // ✅ carrito se lee desde el servicio (fuente única)
  carrito = computed(() => this.carritoSrv.getCarrito());

  // ===========================
  // INIT
  // ===========================
  ngOnInit(): void {
    const token: string = localStorage.getItem('token') ?? '';
    if (!token) {
      alert('⚠️ Debes iniciar sesión para ver los equipos.');
      this.router.navigate(['/auth/login']);
      return;
    }

    this.api.getCatalogo().subscribe({
      next: (data: TipoEquipo[]) => this.tipos.set(data),
      error: (err: any) => console.error('❌ Error catálogo:', err)
    });

    this.api.getPacks().subscribe({
      next: (data: Pack[]) => this.packs.set(data),
      error: (err: any) => console.error('❌ Error packs:', err)
    });
  }

  // ===========================
  // CATEGORÍAS
  // ===========================
  categorias = computed((): string[] => {
    const cats = this.tipos().map(t => t.categoria ?? 'Otros');
    return ['TODOS', 'PACKS', ...Array.from(new Set(cats))];
  });

  esVistaPacks = computed((): boolean =>
    this.categoriaSeleccionada() === 'PACKS'
  );

  // ===========================
  // FILTRO EQUIPOS
  // ===========================
  tiposFiltrados = computed((): TipoEquipo[] => {
    const texto = this.busqueda().toLowerCase();
    const categoria = this.categoriaSeleccionada();

    return this.tipos().filter(t =>
      (categoria === 'TODOS' || t.categoria === categoria) &&
      (t.nombre.toLowerCase().includes(texto) ||
        (t.descripcion ?? '').toLowerCase().includes(texto))
    );
  });

  filtrarPorBusqueda(event: Event): void {
    this.busqueda.set((event.target as HTMLInputElement).value);
  }

  // ===========================
  // IMÁGENES
  // ===========================
  urlImagen(path: string): string {
    return `http://localhost:8000/storage/${path}`;
  }

  getImagenEquipo(e: TipoEquipo): string {
    const n = e.nombre.toLowerCase();
    if (n.includes('cámara')) return 'assets/equipos/camara.jpg';
    if (n.includes('micrófono')) return 'assets/equipos/aro.jpg';
    if (n.includes('tablet')) return 'assets/equipos/computador.jpg';
    if (n.includes('proyector')) return 'assets/equipos/proyector.jpg';
    return 'assets/equipos/lampara.jpg';
  }

  // ===========================
  // CARRITO – EQUIPOS
  // ===========================
  estaEnCarrito(idTipo: number): boolean {
    return this.carrito().some(
      c => c.tipo === 'equipo' && c.idTipoEquipo === idTipo
    );
  }

  getCantidad(idTipo: number): number {
    return this.carrito().find(
      c => c.tipo === 'equipo' && c.idTipoEquipo === idTipo
    )?.cantidad ?? 0;
  }

  getModo(idTipo: number): 'cualquiera' | 'especifico' {
    return this.carrito().find(
      c => c.idTipoEquipo === idTipo
    )?.modo ?? 'cualquiera';
  }

  // ===========================
  // CAMBIAR CANTIDAD (✅ ahora modifica el servicio)
  // ===========================
  cambiarCantidad(idTipo: number, delta: number): void {

    const e = this.tipos().find(t => t.id === idTipo);
    if (!e) return;

    const actual = this.carritoSrv.getCarrito();

    // CASO 1: no existe y quieren sumar
    if (!this.estaEnCarrito(idTipo) && delta > 0) {
      const nuevo: CarritoItem = {
        tipo: 'equipo',
        idTipoEquipo: idTipo,
        nombre: e.nombre,
        categoria: e.categoria,
        cantidad: 1,
        modo: 'cualquiera',
        equiposSeleccionados: []
      };
      this.carritoSrv.setCarrito([...actual, nuevo]);
      return;
    }

    // CASO 2: ya existe → modificar cantidad
    const actualizado = actual.map(i => {
      if (i.tipo === 'equipo' && i.idTipoEquipo === idTipo) {

        let nueva = (i.cantidad ?? 0) + delta;

        if (nueva < 1) nueva = 1;
        if (nueva > e.stock) nueva = e.stock;

        return { ...i, cantidad: nueva };
      }
      return i;
    });

    this.carritoSrv.setCarrito(actualizado);
  }

  // ===========================
  // TOGGLE (✅ ahora modifica el servicio)
  // ===========================
  toggleProducto(idTipo: number): void {

    const e = this.tipos().find(t => t.id === idTipo);
    if (!e) return;

    const actual = this.carritoSrv.getCarrito();

    if (this.estaEnCarrito(idTipo)) {
      this.carritoSrv.setCarrito(
        actual.filter(c => c.idTipoEquipo !== idTipo)
      );
      return;
    }

    const nuevo: CarritoItem = {
      tipo: 'equipo',
      idTipoEquipo: idTipo,
      nombre: e.nombre,
      categoria: e.categoria,
      cantidad: 1,
      modo: 'cualquiera',
      equiposSeleccionados: []
    };

    this.carritoSrv.setCarrito([...actual, nuevo]);
  }

  // ===========================
  // CARRITO – PACKS (✅ ahora modifica el servicio)
  // ===========================
  agregarPackAlCarrito(pack: Pack): void {
    const actual = this.carritoSrv.getCarrito();

    const nuevo: CarritoItem = {
      tipo: 'pack',
      idPack: pack.id,
      cantidad: 1,
      modo: 'cualquiera',
      equiposSeleccionados: []
    };

    this.carritoSrv.setCarrito([...actual, nuevo]);
  }

  // ===========================
  // CONTINUAR (✅ ya NO uses history.state)
  // ===========================
  continuarReserva(): void {
    if (this.carrito().length === 0) {
      alert('⚠️ Debes seleccionar al menos un equipo o pack.');
      return;
    }

    // El carrito ya está en el servicio
    this.router.navigate(['/reservas/solicitar']);
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

interface Pack {
  id: number;
  nombre: string;
  categoria: string;
  cantidad: number;
  equipos: { nombre: string }[];
}
