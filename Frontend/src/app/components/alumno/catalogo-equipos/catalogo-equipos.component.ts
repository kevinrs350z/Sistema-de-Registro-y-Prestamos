import { Component, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { TipoEquipoService } from '../../../services/tipoEquipo.service';
import { AuthService } from '../../../services/auth.service';
import { Pack } from '../../../models/pack.model';
import { CarritoItem } from '../catalogo-equipos/carrito-item.model';
import { CarritoService } from '../../../services/carrito.service';
import { NotificationService } from '../../../services/notification.service';
import { ImagenService } from '../../../services/image.service';

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
  private route = inject(ActivatedRoute);
  private carritoSrv = inject(CarritoService);
  private notify = inject(NotificationService);
  private imagenSrv = inject(ImagenService);
  private auth = inject(AuthService);
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
  horarioSeleccionado = signal<{ fecha?: string | null; bloqueId?: number | null }>({});

  // ✅ carrito se lee desde el servicio (fuente única)
  carrito = computed(() => this.carritoSrv.getCarrito());

  computadoresEnCarrito = computed(() =>
    this.carrito()
      .filter(item => item.tipo === 'equipo' && this.esComputadorItem(item))
      .map(item => item.idTipoEquipo)
      .filter((id): id is number => typeof id === 'number')
  );

  bloqueoPorComputador = computed(() => this.computadoresEnCarrito().length > 0);
  esAdmin = this.auth.isAdmin();

  // ===========================
  // INIT
  // ===========================
  ngOnInit(): void {
    const token: string = sessionStorage.getItem('token') ?? '';
    if (!token) {
      this.notify.warning('Debes iniciar sesión para ver el catálogo de equipos.');
      this.router.navigate(['/auth/login']);
      return;
    }

    const queryParams = this.route.snapshot.queryParamMap;
    const fecha = queryParams.get('fecha');
    const bloqueParam = queryParams.get('bloqueId') ?? queryParams.get('bloque');
    const bloqueId = bloqueParam !== null ? Number(bloqueParam) : undefined;

    this.horarioSeleccionado.set({
      fecha,
      bloqueId: Number.isFinite(bloqueId) ? bloqueId : null,
    });

    this.api.getCatalogo({
      fecha: fecha || undefined,
      bloqueId: Number.isFinite(bloqueId) ? bloqueId : undefined,
    }).subscribe({
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
  categorias = computed((): { nombre: string; icono: string }[] => {
    const seen = new Map<string, string>();
    for (const t of this.tipos()) {
      const cat = t.categoria ?? 'Otros';
      if (!seen.has(cat)) {
        seen.set(cat, t.categoria_icono ?? 'bi-tag');
      }
    }
    return [
      { nombre: 'TODOS', icono: 'bi-grid-1x2' },
      { nombre: 'PACKS', icono: 'bi-box-seam' },
      ...Array.from(seen.entries()).map(([nombre, icono]) => ({ nombre, icono }))
    ];
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

  private getMotivoNoDisponible(e: TipoEquipo): string | null {
    return e.motivoNoDisponible ?? e.motivo_no_disponible ?? null;
  }

  estaBloqueadoPorHorario(e: TipoEquipo): boolean {
    const motivo = this.getMotivoNoDisponible(e);
    return motivo === 'BLOQUEADO_HORARIO' || this.bloqueoHorarioActivo(e);
  }

  estaSinStock(e: TipoEquipo): boolean {
    const motivo = this.getMotivoNoDisponible(e);
    if (motivo === 'SIN_STOCK') {
      return true;
    }
    return (e.stock ?? 0) <= 0;
  }

  estaDisponible(e: TipoEquipo): boolean {
    if (typeof e.disponible === 'boolean') {
      return e.disponible && !this.estaBloqueadoPorHorario(e);
    }
    return (e.stock ?? 0) > 0 && !this.bloqueoHorarioActivo(e);
  }

  // ===========================
  // IMÁGENES
  // ===========================
  /**
   * Obtener URL de imagen para un tipo de equipo.
   * Usa el servicio de imágenes que apunta al API con CORS.
   */
  getImagenEquipo(e: TipoEquipo): string | null {
    return this.imagenSrv.resolveTipoEquipoImage({
      id: e.id,
      imagen_url: e.imagen_url,
      imagen: e.imagen,
      nombre: e.nombre
    });
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

  esComputador(e: TipoEquipo): boolean {
    return this.esTextoComputador(e.categoria) || this.esTextoComputador(e.nombre);
  }

  estaComputadorSeleccionado(e: TipoEquipo): boolean {
    return this.computadoresEnCarrito().includes(e.id);
  }

  private esComputadorItem(item: CarritoItem): boolean {
    return this.esTextoComputador(item.categoria) || this.esTextoComputador(item.nombre);
  }

  private esTextoComputador(texto?: string): boolean {
    if (!texto) return false;
    return /(computador|computacional|laptop|notebook|pc)/i.test(texto);
  }

  obtenerMensajeDisponibilidad(e: TipoEquipo): string | null {
    const motivo = this.getMotivoNoDisponible(e);

    if (motivo === 'BLOQUEADO_HORARIO' || this.estaBloqueadoPorHorario(e)) {
      return 'Bloqueado en este horario';
    }

    if (motivo === 'SIN_STOCK') {
      return 'Sin stock';
    }

    if (this.estaDisponible(e)) {
      return 'Disponible ahora';
    }

    if (this.estaSinStock(e) && e.proxima_disponibilidad) {
      const fecha = this.formatearDisponibilidad(e.proxima_disponibilidad);
      return fecha ? `Disponible desde ${fecha}` : 'Sin stock';
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

  bloqueoHorarioActivo(e: TipoEquipo): boolean {
    return !!(
      e.bloqueo_horario_activo ||
      e.bloqueo_horario ||
      e.bloqueado_horario ||
      e.bloqueo_horario_hasta ||
      e.bloqueo_hasta
    );
  }

  getBloqueoHorarioTexto(e: TipoEquipo): string {
    const base = e.bloqueo_horario_motivo || e.bloqueo_motivo || 'Bloqueado temporalmente por horario.';
    const hasta = this.getBloqueoHastaFecha(e);

    if (hasta) {
      return `${base} Disponible desde ${this.formatoDisponibilidad.format(hasta)}.`;
    }

    const fecha = this.horarioSeleccionado().fecha;
    return fecha ? `${base} (${fecha}).` : base;
  }

  private getBloqueoHastaFecha(e: TipoEquipo): Date | null {
    const raw = e.bloqueo_horario_hasta || e.bloqueo_hasta;
    if (!raw) return null;
    const fecha = new Date(raw);
    return Number.isNaN(fecha.getTime()) ? null : fecha;
  }

  // ===========================
  // CAMBIAR CANTIDAD (✅ ahora modifica el servicio)
  // ===========================
  cambiarCantidad(idTipo: number, delta: number): void {

    const e = this.tipos().find(t => t.id === idTipo);
    if (!e) return;
    if (!this.esAdmin) {
      if (this.estaBloqueadoPorHorario(e)) {
        this.notify.warning(this.getBloqueoHorarioTexto(e));
        return;
      }
      if (this.bloqueoPorComputador() && !this.estaComputadorSeleccionado(e)) {
        this.notify.warning('Solo puedes solicitar el computador condicional seleccionado.');
        return;
      }
      if (e.bloqueado && delta > 0) {
        this.notify.warning(e.bloqueo_motivo || 'Límite alcanzado para este tipo de equipo.');
        return;
      }
      if (delta > 0 && !this.puedeAgregarCantidad(e, delta)) {
        return;
      }
    }
    if (this.estaSinStock(e) && delta > 0) {
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
    if (!this.esAdmin) {
      if (this.estaBloqueadoPorHorario(e)) {
        this.notify.warning(this.getBloqueoHorarioTexto(e));
        return;
      }
      if (this.bloqueoPorComputador() && !this.estaComputadorSeleccionado(e)) {
        this.notify.warning('Solo puedes solicitar el computador condicional seleccionado.');
        return;
      }
      if (e.bloqueado) {
        this.notify.warning(e.bloqueo_motivo || 'Límite alcanzado para este tipo de equipo.');
        return;
      }
      if (!this.estaEnCarrito(idTipo) && !this.puedeAgregarCantidad(e, 1)) {
        return;
      }
      if (!this.estaDisponible(e)) {
        this.notify.warning(this.getBloqueoHorarioTexto(e));
        return;
      }
    }
    if (this.estaSinStock(e)) {
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

    if (!this.esAdmin && this.esComputador(e)) {
      const otros = actual.filter(c => c.tipo !== 'equipo' || c.idTipoEquipo !== idTipo);
      if (otros.length > 0) {
        this.notify.info('Se removieron otros equipos porque seleccionaste un computador condicional.');
      }
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

    if (!this.esAdmin && this.esComputador(e)) {
      this.carritoSrv.setCarrito([nuevo]);
    } else {
      this.carritoSrv.setCarrito([...actual, nuevo]);
    }
  }

  private puedeAgregarCantidad(e: TipoEquipo, delta: number): boolean {
    if (this.esAdmin) {
      return true;
    }
    const maximo = typeof e.maximo_prestamo === 'number' ? e.maximo_prestamo : null;
    if (maximo === null) {
      return true;
    }

    const activos = e.prestamos_activos ?? 0;
    const grupoIds = this.obtenerGrupoRelacionados(e);
    const totalCarritoGrupo = this.obtenerTotalCarritoGrupo(grupoIds);
    const disponible = Math.max(0, maximo - activos);

    if (maximo === 0 || disponible <= 0) {
      this.notify.warning(`No puedes solicitar más de ${maximo} ${e.nombre}.`);
      return false;
    }

    if (totalCarritoGrupo + delta > disponible) {
      const restante = Math.max(0, disponible - totalCarritoGrupo);
      this.notify.warning(
        `Límite alcanzado para ${e.nombre}. Solo puedes agregar ${restante} más (máximo ${maximo}).`
      );
      return false;
    }

    return true;
  }

  private obtenerGrupoRelacionados(e: TipoEquipo): number[] {
    const ids = Array.isArray(e.grupo_relacionados) && e.grupo_relacionados.length
      ? e.grupo_relacionados
      : [e.id];

    return ids.map((id) => Number(id)).filter((id) => Number.isFinite(id));
  }

  private obtenerTotalCarritoGrupo(ids: number[]): number {
    if (ids.length === 0) {
      return 0;
    }

    return this.carrito().reduce((total, item) => {
      if (item.tipo === 'equipo' && item.idTipoEquipo && ids.includes(item.idTipoEquipo)) {
        return total + (item.cantidad ?? 0);
      }
      return total;
    }, 0);
  }

  puedeSolicitar(e: TipoEquipo): boolean {
    if (this.esAdmin) {
      return true;
    }

    if (this.estaBloqueadoPorHorario(e)) {
      return false;
    }

    if (e.bloqueado) {
      return false;
    }

    if (this.bloqueoPorComputador() && !this.estaComputadorSeleccionado(e)) {
      return false;
    }

    if (this.estaSinStock(e)) {
      return false;
    }

    return this.estaDisponible(e);
  }

  // ===========================
  // CARRITO – PACKS (✅ ahora modifica el servicio)
  // ===========================
  agregarPackAlCarrito(pack: Pack): void {
    if (this.bloqueoPorComputador()) {
      this.notify.warning('No puedes agregar packs mientras exista un computador condicional en la solicitud.');
      return;
    }
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
    if (this.bloqueoPorComputador()) {
      this.notify.warning('No puedes agregar packs mientras exista un computador condicional en la solicitud.');
      return;
    }
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
  categoria_icono?: string;
  imagen?: string;
  imagen_url?: string;
  stock: number;
  maximo_prestamo?: number;
  prestamos_activos?: number;
  grupo_relacionados?: number[];
  bloqueado?: boolean;
  bloqueo_motivo?: string | null;
  bloqueo_horario?: boolean;
  bloqueado_horario?: boolean;
  bloqueo_horario_activo?: boolean;
  bloqueo_horario_hasta?: string | null;
  bloqueo_hasta?: string | null;
  bloqueo_horario_motivo?: string | null;
  proxima_disponibilidad?: string | null;
  disponible?: boolean;
  motivo_no_disponible?: string | null;
  motivoNoDisponible?: string | null;
}

interface EquipoFisico {
  id: number;
  codigo: string;
  estado: string;
  tipo_equipo_id: number;
}


