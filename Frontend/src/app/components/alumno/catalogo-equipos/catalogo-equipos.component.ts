import { Component, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { TipoEquipoService } from '../../../services/tipoEquipo.service';
import { Pack } from '../../../models/pack.model';
import { CarritoItem } from '../catalogo-equipos/carrito-item.model';
import { CarritoService } from '../../../services/carrito.service';
import { NotificationService } from '../../../services/notification.service';

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
  private notify = inject(NotificationService);
  private readonly formatoDisponibilidad = new Intl.DateTimeFormat('es-CL', {
    dateStyle: 'short',
    timeStyle: 'short'
  });

  // ===========================
  // ESTADOS
  // ===========================
  tipos = signal<TipoEquipo[]>([]);
  packs = signal<Pack[]>([]);
  equiposFisicos = signal<EquipoFisico[]>([]);
  expandedPacks = signal<number[]>([]);

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
      this.notify.warning('Debes iniciar sesión para ver el catálogo de equipos.');
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

  obtenerMensajeDisponibilidad(e: TipoEquipo): string | null {
    if (e.stock > 0) {
      return 'Disponible ahora';
    }

    if (e.proxima_disponibilidad) {
      const fecha = this.formatearDisponibilidad(e.proxima_disponibilidad);
      return fecha ? `Disponible desde ${fecha}` : null;
    }

    return 'Sin disponibilidad próxima';
  }

  private formatearDisponibilidad(fechaIso: string): string | null {
    const fecha = new Date(fechaIso);
    if (Number.isNaN(fecha.getTime())) {
      return null;
    }

    return this.formatoDisponibilidad.format(fecha);
  }

  // ===========================
  // CAMBIAR CANTIDAD (✅ ahora modifica el servicio)
  // ===========================
  cambiarCantidad(idTipo: number, delta: number): void {

    const e = this.tipos().find(t => t.id === idTipo);
    if (!e) return;
    if (e.bloqueado && delta > 0) {
      this.notify.warning(e.bloqueo_motivo || 'Límite alcanzado para este tipo de equipo.');
      return;
    }
    if (e.stock <= 0 && delta > 0) {
      this.notify.warning('Este equipo está agotado.');
      return;
    }

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
    const actualizado: CarritoItem[] = [];
    for (const i of actual) {
      if (i.tipo === 'equipo' && i.idTipoEquipo === idTipo) {
        let nueva = (i.cantidad ?? 0) + delta;

        // Permitir llegar a 0 → se elimina del carrito
        if (nueva <= 0) {
          continue;
        }
        if (nueva > e.stock) nueva = e.stock;

        actualizado.push({ ...i, cantidad: nueva });
      } else {
        actualizado.push(i);
      }
    }

    this.carritoSrv.setCarrito(actualizado);
  }

  // ===========================
  // TOGGLE (✅ ahora modifica el servicio)
  // ===========================
  toggleProducto(idTipo: number): void {

    const e = this.tipos().find(t => t.id === idTipo);
    if (!e) return;
    if (e.bloqueado) {
      this.notify.warning(e.bloqueo_motivo || 'Límite alcanzado para este tipo de equipo.');
      return;
    }
    if (e.stock <= 0) {
      this.notify.warning('Este equipo está agotado.');
      return;
    }

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
    if (pack.disponibles !== undefined && pack.disponibles <= 0) {
      this.notify.warning('Este pack está agotado.');
      return;
    }

    if (this.estaPackEnCarrito(pack.id)) {
      this.notify.info('Este pack ya está agregado a tu solicitud.');
      return;
    }

    const actual = this.carritoSrv.getCarrito();

    const nuevo: CarritoItem = {
      tipo: 'pack',
      idPack: pack.id,
      cantidad: 1, // ✅ Siempre 1
      modo: 'cualquiera',
      equiposSeleccionados: []
    };

    this.carritoSrv.setCarrito([...actual, nuevo]);
  }

  estaPackEnCarrito(idPack: number): boolean {
    return this.carrito().some(c => c.tipo === 'pack' && c.idPack === idPack);
  }

  togglePack(idPack: number): void {
    const p = this.packs().find(x => x.id === idPack);
    if (!p) return;

    if (p.disponibles !== undefined && p.disponibles <= 0) {
      this.notify.warning('Este pack está agotado.');
      return;
    }

    const actual = this.carritoSrv.getCarrito();

    // Si ya está en el carrito, removerlo
    if (this.estaPackEnCarrito(idPack)) {
      this.carritoSrv.setCarrito(
        actual.filter(c => !(c.tipo === 'pack' && c.idPack === idPack))
      );
      this.notify.info('Pack quitado de la solicitud.');
      return;
    }

    // Agregar al carrito
    const nuevo: CarritoItem = {
      tipo: 'pack',
      idPack: idPack,
      cantidad: 1,
      modo: 'cualquiera',
      equiposSeleccionados: []
    };

    this.carritoSrv.setCarrito([...actual, nuevo]);
    this.notify.success('Pack agregado a la solicitud.');
  }

  toggleDetallesPack(idPack: number): void {
    const arr = [...this.expandedPacks()];
    const idx = arr.indexOf(idPack);
    if (idx >= 0) {
      arr.splice(idx, 1);
    } else {
      arr.push(idPack);
    }
    this.expandedPacks.set(arr);
  }

  isExpanded(idPack: number): boolean {
    return this.expandedPacks().includes(idPack);
  }

  hasEquipos(p: Pack): boolean {
    return Array.isArray(p.equipos) && p.equipos.length > 0;
  }

  // ===========================
  // CONTINUAR (✅ ya NO uses history.state)
  // ===========================
  continuarReserva(): void {
    if (this.carrito().length === 0) {
      this.notify.warning('Debes seleccionar al menos un equipo o pack para continuar.');
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
  maximo_prestamo?: number;
  prestamos_activos?: number;
  bloqueado?: boolean;
  bloqueo_motivo?: string | null;
  proxima_disponibilidad?: string | null;
}

interface EquipoFisico {
  id: number;
  codigo: string;
  estado: string;
  tipo_equipo_id: number;
}


