import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { FiltroEquipoPipe } from '../../../shared/pipes/filtro-equipo.pipe';

import { EventosService } from '../../../services/eventos.service';
import { AsignaturasService } from '../../../services/asignaturas.service';
import { EquiposService } from '../../../services/equipos.service';
import { TipoEquipoService } from '../../../services/tipoEquipo.service';
import { NotificationService } from '../../../services/notification.service';

interface BloqueHorario {
  idBloque: number;
  nombre: string;
  texto: string;
}

type TipoReserva = 'ASIGNATURA' | 'EVENTO';

interface ReservaUI {
  id: number;
  tipo: TipoReserva;

  asignatura_id?: number | null;
  asignaturaNombre?: string | null;

  eventoNombre?: string | null;

  profesor: string;
  ubicacion?: string | null;

  bloques: string[];
  equipos: { idTipoEquipo: number; nombre: string; cantidad: number }[];

  observacion?: string | null;

  // opcional para estados
  estado?: string | null;
  fecha_inicio?: string | null;
  fecha_fin?: string | null;
}

@Component({
  selector: 'app-gestionar-asignaturas',
  standalone: true,
  imports: [CommonModule, FormsModule, FiltroEquipoPipe],
  templateUrl: './gestionar-asignaturas.component.html',
  styleUrls: ['./gestionar-asignaturas.component.css']
})
export class GestionarAsignaturasComponent implements OnInit {

  /* ======================================
              DATOS DEL BACKEND
  ======================================= */
  equipos: any[] = [];
  asignaturas: any[] = [];

  /* ======================================
              RESERVAS (BACKEND)
  ======================================= */
  reservas: ReservaUI[] = [];
  reservaSeleccionada: ReservaUI | null = null;
  busquedaEquipo: string = '';


  mostrarFormulario = false;
  cargandoReservas = false;

  /* ======================================
              PAGINACIÓN (BOOTSTRAP)
  ======================================= */
  page = 1;
  pageSize = 8;
  totalItems = 0;   // si backend entrega total, lo usamos
  totalPages = 1;

  get reservasPaginadas(): ReservaUI[] {
    // ✅ Si tu backend NO pagina, hacemos paginación cliente
    // (igual funciona aunque luego actives paginación servidor)
    const start = (this.page - 1) * this.pageSize;
    const end = start + this.pageSize;
    return this.reservas.slice(start, end);
  }

  /* ======================================
              FORMULARIO PRINCIPAL
  ======================================= */
  form: {
    tipo: TipoReserva;
    asignatura_id: number | '';
    evento_nombre: string;
    profesor: string;
    ubicacion: string;
    bloques: string[];
    equipos: any[];
    observacion: string;
    fecha_inicio: string;
    fecha_fin: string;
  } = {
    tipo: 'ASIGNATURA',
    asignatura_id: '',
    evento_nombre: '',
    profesor: '',
    ubicacion: '',
    bloques: [],
    equipos: [],
    observacion: '',
    fecha_inicio: '',
    fecha_fin: '',

  };

  /* ======================================
               CAMPOS TEMPORALES
  ======================================= */
  equipoSeleccionado: any = null;
  cantidadSeleccionada: number = 1;

  /* ======================================
              BLOQUES HORARIOS
  ======================================= */
  bloques: BloqueHorario[] = [
    { idBloque: 1, nombre: 'Bloque 1', texto: '08:00 – 09:30' },
    { idBloque: 2, nombre: 'Bloque 2', texto: '09:40 – 11:10' },
    { idBloque: 3, nombre: 'Bloque 3', texto: '11:20 – 12:50' },
    { idBloque: 4, nombre: 'Bloque 4', texto: '12:50 – 14:40' },
    { idBloque: 5, nombre: 'Bloque 5', texto: '14:45 – 16:10' },
    { idBloque: 6, nombre: 'Bloque 6', texto: '16:20 – 17:50' },
    { idBloque: 7, nombre: 'Bloque 7', texto: '17:55 – 19:30' },
    { idBloque: 8, nombre: 'Bloque 8', texto: '19:40 – 21:10' }
  ];

  /* ======================================
              REGEX
  ======================================= */
  private soloLetrasRegex = /^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]+$/;

  private notify = inject(NotificationService);

  constructor(private eventosService: EventosService,
              private equiposService: EquiposService,
              private asignaturasService: AsignaturasService,
              private tipoEquipo: TipoEquipoService) {}

  ngOnInit(): void {
    this.cargarDatosBase();
    this.cargarReservas(); // ✅ trae del backend al cargar
  }

  /* ======================================
        CARGAR DATOS BASE (equipos/asignaturas)
  ======================================= */
  cargarDatosBase() {

    this.tipoEquipo.getCatalogo().subscribe({
      next: (r: any[]) => {
        this.equipos = (r ?? [])
          .filter(eq => eq.stock > 0)     
          .map(eq => ({
            ...eq,
            stockDisponible: eq.stock    
          }));
      },
      error: err => console.error('Error getCatalogo', err)
    });

    this.asignaturasService.getAsignaturas().subscribe({
      next: (r: any) => this.asignaturas = r ?? [],
      error: err => console.error('Error getAsignaturas', err)
    });

  }


  /* ======================================
              CARGAR RESERVAS (con/sin paginación servidor)
  ======================================= */
  cargarReservas(page: number = this.page) {
    this.cargandoReservas = true;

    // ✅ Si tu backend soporta paginación, te conviene esto:
    this.eventosService.getReservasAdmin(page, this.pageSize).subscribe({
      next: (resp: any) => {
        // Soporta ambos formatos:
        // 1) Laravel paginator: { data:[], meta:{...} } o { data:[], total, per_page, current_page, last_page }
        // 2) Lista simple: []
        const data = Array.isArray(resp) ? resp : (resp?.data ?? resp?.reservas ?? []);
        this.reservas = (data ?? []).map((x: any) => this.mapReservaFromApi(x));

        // total/paginación servidor si existe:
        const total = resp?.total ?? resp?.meta?.total ?? null;
        const perPage = resp?.per_page ?? resp?.meta?.per_page ?? this.pageSize;
        const current = resp?.current_page ?? resp?.meta?.current_page ?? page;
        const last = resp?.last_page ?? resp?.meta?.last_page ?? null;

        this.totalItems = total ?? this.reservas.length; // fallback
        this.pageSize = perPage ?? this.pageSize;
        this.page = current ?? page;

        this.totalPages = last ?? Math.max(1, Math.ceil(this.totalItems / this.pageSize));
        this.cargandoReservas = false;
      },
      error: (err) => {
        console.error('Error cargarReservas', err);
        this.cargandoReservas = false;
      }
    });
  }

  private mapReservaFromApi(x: any): ReservaUI {
    // Ajusta aquí si tu backend devuelve nombres distintos
    const tipo: TipoReserva = (x?.tipo_reserva ?? x?.tipo ?? 'ASIGNATURA') === 'EVENTO' ? 'EVENTO' : 'ASIGNATURA';

    const bloquesTxt: string[] =
      typeof x?.bloques === 'string'
        ? x.bloques.split(',').map((b: string) => b.trim())
        : [];


    const equipos = (x?.equipos ?? x?.prestamo_equipos ?? [])
      .map((e: any) => ({
        idTipoEquipo: e?.idTipoEquipo ?? e?.tipo_equipo_id ?? e?.id_tipo_equipo ?? e?.id,
        nombre: e?.nombre ?? e?.tipoEquipo?.nombre ?? e?.tipo_equipo?.nombre ?? 'Equipo',
        cantidad: Number(e?.cantidad ?? 1)
      }))
      .filter((e: any) => !!e.idTipoEquipo);

    return {
      id: x?.id ?? x?.idPrestamo ?? 0,
      tipo,

      asignatura_id: x?.asignatura_id ?? x?.asignatura?.id ?? null,
      asignaturaNombre: x?.asignaturaNombre ?? x?.asignatura?.nombre ?? null,

      eventoNombre: x?.eventoNombre ?? x?.evento_nombre ?? x?.evento?.nombre ?? null,

      profesor: x?.profesor ?? x?.docente ?? '',
      ubicacion: x?.ubicacion ?? x?.lugar ?? '',

      bloques: bloquesTxt,
      equipos,

      observacion: x?.observacion ?? null,
      estado: x?.estado ?? null,
      fecha_inicio: x?.fecha_inicio ?? null,
      fecha_fin: x?.fecha_fin ?? null
    };
  }

  /* ======================================
              NUEVA RESERVA
  ======================================= */
  nuevaReserva() {
    this.mostrarFormulario = true;
    this.reservaSeleccionada = null;

    this.form = {
      tipo: 'ASIGNATURA',
      asignatura_id: '',
      evento_nombre: '',
      profesor: '',
      ubicacion: '',
      bloques: [],
      equipos: [],
      observacion: '',
      fecha_inicio: '',
      fecha_fin: ''
    };

    this.equipoSeleccionado = null;
    this.cantidadSeleccionada = 1;
  }

  /* ======================================
              SELECCIONAR RESERVA
  ======================================= */
  seleccionar(reserva: ReservaUI) {
    this.reservaSeleccionada = reserva;
    this.mostrarFormulario = false;
  }

  /* ======================================
              BLOQUES
  ======================================= */
  toggleBloque(b: BloqueHorario) {
    const idx = this.form.bloques.indexOf(b.texto);
    if (idx >= 0) this.form.bloques.splice(idx, 1);
    else this.form.bloques.push(b.texto);
  }

  /* ======================================
              AGREGAR EQUIPOS (por tipo_equipo)
  ======================================= */
  agregarEquipo() {
    if (!this.equipoSeleccionado || this.cantidadSeleccionada < 1) return;

    const eq = this.equipoSeleccionado;
    const idTipoEquipo = eq.id;

    const yaAgregado = this.form.equipos.find(
      (e: any) => e.idTipoEquipo === idTipoEquipo
    );

    const totalSolicitado =
      (yaAgregado?.cantidad ?? 0) + this.cantidadSeleccionada;

    if (totalSolicitado > eq.stock) {
      const disponible = eq.stock - (yaAgregado?.cantidad ?? 0);
      this.notify.warning(`Stock insuficiente. Disponible: ${disponible}`);
      return;
    }


    const existente = this.form.equipos.find(
      (e: any) => e.idTipoEquipo === idTipoEquipo
    );

    if (existente) {
      existente.cantidad += this.cantidadSeleccionada;
    } else {
      this.form.equipos.push({
        idTipoEquipo,
        nombre: eq.nombre,
        cantidad: this.cantidadSeleccionada
      });
    }

    this.equipoSeleccionado = null;
    this.cantidadSeleccionada = 1;
  }



  eliminarEquipo(i: number) {
    const eliminado = this.form.equipos[i];

    // 🔁 devolver stock al catálogo
    const eqCatalogo = this.equipos.find(
      (e: any) => e.id === eliminado.idTipoEquipo
    );

    if (eqCatalogo) {
      eqCatalogo.stockDisponible += eliminado.cantidad;
    }

    this.form.equipos.splice(i, 1);
  }

  getStockDisponible(eq: any): number {
    const agregado = this.form.equipos.find(
      (e: any) => e.idTipoEquipo === eq.id
    );

    return eq.stock - (agregado?.cantidad ?? 0);
  }

  /* ======================================
              VALIDADOR PARA HTML
  ======================================= */
  soloLetras(valor?: string): boolean {
    if (!valor) return true;
    return this.soloLetrasRegex.test(valor);
  }

  /* ======================================
              GET DE NOMBRE MOSTRADO
  ======================================= */
  getNombreAsignaturaEvento(): string {
    if (this.form.tipo === 'ASIGNATURA') {
      return this.asignaturas.find(a => a.id == this.form.asignatura_id)?.nombre || '—';
    }
    if (this.form.tipo === 'EVENTO') {
      return this.form.evento_nombre.trim() || '—';
    }
    return '—';
  }

  /* ======================================
              GUARDAR (POST backend)
  ======================================= */
  guardar() {
    if (!this.form.ubicacion?.trim()) {
      this.notify.warning('Debes indicar una ubicación para la reserva.');
      return;
    }

    if (!this.form.profesor?.trim() || !this.soloLetras(this.form.profesor)) {
      this.notify.warning('Debes ingresar un nombre de profesor válido (solo letras).');
      return;
    }

    if (this.form.tipo === 'ASIGNATURA' && !this.form.asignatura_id) {
      this.notify.warning('Debes seleccionar una asignatura.');
      return;
    }
    if (this.form.tipo === 'EVENTO') {
      if (
        !this.form.evento_nombre.trim() ||
        !this.form.fecha_inicio ||
        !this.form.fecha_fin
      ) {
        this.notify.warning('El evento requiere nombre y fechas de inicio y término.');
        return;
      }
    }
  const asignaturaId =
    this.form.tipo === 'ASIGNATURA' && this.form.asignatura_id
      ? Number(this.form.asignatura_id)
      : null;

    // ✅ mapeo de bloques a ids
    const bloquesIds = this.form.bloques
      .map(txt => this.bloques.find(x => x.texto === txt)?.idBloque)
      .filter((b): b is number => b !== undefined);

    // ✅ payload alineado a tu backend (prestamo + relacion a equipos y bloques)
  

        const tipoBackend = this.form.tipo === 'EVENTO' ? 'EVENTO' : 'DENTRO';

        const payload: any = {
          idUserAlumno: 1,
          tipo: tipoBackend,
          origen: 'ADMIN',
          profesor: this.form.profesor.trim(),
          ubicacion: this.form.ubicacion.trim(),
          observacion: this.form.observacion?.trim() || null,

          equipos: this.form.equipos.map((e: any) => ({
            idTipoEquipo: e.idTipoEquipo,
            cantidad: e.cantidad,
            modo: 'cualquiera'
          }))
        };


        // ===== ASIGNATURA =====
        if (this.form.tipo === 'ASIGNATURA') {
          payload.asignatura = Number(this.form.asignatura_id);
          payload.bloques = bloquesIds;
          payload.fecha_inicio = new Date().toISOString().slice(0, 10);
          payload.fecha_fin = new Date().toISOString().slice(0, 10);
        }

        if (this.form.tipo === 'EVENTO') {
          if (!this.form.evento_nombre?.trim()) {
            this.notify.warning('El evento requiere un nombre.');
            return;
          }

          if (!this.form.fecha_inicio || !this.form.fecha_fin) {
            this.notify.warning('El evento requiere fechas de inicio y término.');
            return;
          }

          if (this.form.fecha_fin < this.form.fecha_inicio) {
            this.notify.warning('La fecha de término no puede ser menor que la fecha de inicio.');
            return;
          }

          payload.nombre_evento = this.form.evento_nombre.trim();
          payload.fecha_inicio = this.form.fecha_inicio;
          payload.fecha_fin = this.form.fecha_fin;
        }


  

    this.asignaturasService.crearPrestamoAdmin(payload).subscribe({
      next: () => {
        this.notify.success('Reserva registrada correctamente.');
        this.mostrarFormulario = false;

        // refrescar lista
        this.cargarReservas(1);
      },  
      error: (err) => {
        console.error(err);
        const mensaje = err?.error?.error || err?.error?.message || 'Ocurrió un error al crear la reserva.';
        this.notify.error(mensaje);
      }
    });
  }

  /* ======================================
              CANCELAR RESERVA (DELETE/PATCH)
  ======================================= */
  cancelarReserva() {
    if (!this.reservaSeleccionada) return;

    const id = this.reservaSeleccionada.id;
    const motivo = prompt('Motivo de cancelación (obligatorio):')?.trim();

    if (!motivo) {
      this.notify.warning('Debes ingresar un motivo para cancelar la reserva.');
      return;
    }

    this.eventosService.cancelarReservaAdmin(id, motivo).subscribe({
      next: () => {
        this.notify.success('La reserva fue cancelada correctamente.');
        this.reservaSeleccionada = null;
        this.cargarReservas(this.page);
      },
      error: (err) => {
        console.error(err);
        const mensaje = err?.error?.message || 'Ocurrió un error al cancelar la reserva.';
        this.notify.error(mensaje);
      }
    });
  }

  /* ======================================
              PAGINACIÓN (Bootstrap)
  ======================================= */
  irPagina(p: number) {
    if (p < 1 || p > this.totalPages) return;

    this.page = p;

    // ✅ si el backend pagina, llama backend:
    this.cargarReservas(this.page);

    // ✅ si NO pagina, basta con setear page y usar reservasPaginadas
  }

  get paginas(): number[] {
    // paginación "bonita" con ventana
    const total = this.totalPages || 1;
    const current = this.page || 1;
    const window = 2;

    const start = Math.max(1, current - window);
    const end = Math.min(total, current + window);

    const arr: number[] = [];
    for (let i = start; i <= end; i++) arr.push(i);
    return arr;
  }
}
