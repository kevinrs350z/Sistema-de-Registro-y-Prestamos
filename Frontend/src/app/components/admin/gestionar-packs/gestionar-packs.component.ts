import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { NavbarAdminComponent } from '../navbar-admin/navbar-admin.component';
import { AsignaturasService } from '../../../services/asignaturas.service';
import { PacksService } from '../../../services/packs.service';

import { Pack, Equipo } from '../../../models/pack.model';
import { NotificationService } from '../../../services/notification.service';

@Component({
  selector: 'app-gestionar-packs',
  standalone: true,
  imports: [CommonModule, FormsModule, NavbarAdminComponent],
  templateUrl: './gestionar-packs.component.html',
  styleUrls: ['./gestionar-packs.component.css']
})
export class GestionarPacksComponent implements OnInit {

  /* ================================
     DATA
  ================================ */
  equipos: Equipo[] = [];
  packs: Pack[] = [];

  packSeleccionado: Pack | null = null;
  creandoPack = false;
  editandoPack = false;

  /* ================================
     UI STATES
  ================================ */
  cargando = false;
  guardando = false;
  eliminando = false;
  error: string | null = null;

  /* ================================
     FORM
  ================================ */
  form = {
    nombre: '',
    descripcion: '',
    equipos: [] as Equipo[]
  };

  equipoSeleccionado: Equipo | null = null;
  tipoSeleccionado: string | null = null;

  /* ================================
     PAGINACIÓN
  ================================ */
  currentPage = 1;
  lastPage = 1;
  perPage = 10;
  total = 0;

  /* ================================
     IMAGEN
  ================================ */
  imagenSeleccionada: File | null = null;
  previewImagen: string | null = null;

  private notify = inject(NotificationService);

  constructor(
    private asignaturasService: AsignaturasService,
    private packsService: PacksService
  ) {}

  ngOnInit(): void {
    this.cargarDatos();
  }

  /* ================================
     CARGA INICIAL
  ================================ */
  cargarDatos(): void {
    this.cargando = true;
    this.error = null;

    // Equipos
    this.asignaturasService.getEquipos().subscribe({
      next: (r: any) => {
        this.equipos = (r ?? []).map((e: any) => ({
          ...e,
          // Asegura visibilidad del código de activo fijo con múltiples llaves posibles
          codigo_activo: e.codigo_activo ?? e.codigo ?? e.codigoEquipo ?? e.codigo_equipo ?? null,
          // Normaliza un nombre de tipo para filtros
          tipo_nombre: this.getTipoNombre(e)
        })) as Equipo[];
      },
      error: () => {
        this.error = 'Error al cargar equipos.';
      }
    });

    // Packs paginados
    this.packsService.getPacks(this.currentPage, this.perPage).subscribe({
      next: (res: any) => {
        this.packs = res.data;
        this.currentPage = res.meta.current_page;
        this.lastPage = res.meta.last_page;
        this.perPage = res.meta.per_page;
        this.total = res.meta.total;
        this.cargando = false;
      },
      error: () => {
        this.packs = [];
        this.cargando = false;
        this.error = 'No se pudieron cargar los packs.';
      }
    });
  }

  /* ================================
     PAGINACIÓN
  ================================ */
  irAPagina(page: number): void {
    if (page < 1 || page > this.lastPage) return;
    this.currentPage = page;
    this.cargarDatos();
  }

  get paginas(): number[] {
    return Array.from({ length: this.lastPage }, (_, i) => i + 1);
  }

  /* ================================
     NUEVO PACK
  ================================ */
  nuevoPack(): void {
    this.creandoPack = true;
    this.editandoPack = false;
    this.packSeleccionado = null;
    this.error = null;

    this.form = {
      nombre: '',
      descripcion: '',
      equipos: []
    };

    this.equipoSeleccionado = null;
    this.imagenSeleccionada = null;
    this.previewImagen = null;
  }

  cancelarEdicion(): void {
    this.creandoPack = false;
    this.editandoPack = false;
    this.packSeleccionado = null;
    this.error = null;
  }

  /* ================================
     SELECCIONAR PACK
  ================================ */
  seleccionarPack(pack: Pack): void {
    this.packSeleccionado = pack;
    this.creandoPack = false;
    this.editandoPack = false;
    this.error = null;
  }

  /* ================================
     EDITAR PACK (UI)
  ================================ */
  editarPack(): void {
    if (!this.packSeleccionado) return;

    this.creandoPack = true;
    this.editandoPack = true;

    this.form = {
      nombre: this.packSeleccionado.nombre,
      descripcion: this.packSeleccionado.descripcion ?? '',
      equipos: [...this.packSeleccionado.equipos]
    };

    this.previewImagen = this.packSeleccionado.imagen_url ?? null;
    this.imagenSeleccionada = null;
  }

  guardarPack(): void {
    if (this.editandoPack) {
      this.actualizarPack();
    } else {
      this.crearPack();
    }
  }

  /* ================================
     EQUIPOS EN FORM
  ================================ */
  agregarEquipo(): void {
    if (!this.equipoSeleccionado) return;

    const existe = this.form.equipos.some(
      e => e.id === this.equipoSeleccionado!.id
    );

    if (existe) {
      this.notify.info('Ese equipo ya fue agregado al pack.');
      this.equipoSeleccionado = null;
      return;
    }

    this.form.equipos.push(this.equipoSeleccionado);
    this.equipoSeleccionado = null;
  }

  eliminarEquipo(i: number, event?: MouseEvent): void {
    if (event) event.stopPropagation();
    this.form.equipos.splice(i, 1);
  }

  /* ================================
     IMAGEN
  ================================ */
  onImagenSeleccionada(event: any): void {
    const file: File = event?.target?.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      this.notify.warning('El archivo seleccionado debe ser una imagen.');
      return;
    }

    this.imagenSeleccionada = file;

    const reader = new FileReader();
    reader.onload = () => {
      this.previewImagen = reader.result as string;
    };
    reader.readAsDataURL(file);
  }

  limpiarImagen(): void {
    this.imagenSeleccionada = null;
    this.previewImagen = null;
  }

  /* ================================
     FILTROS Y HELPERS
  ================================ */
  get tiposEquipos(): string[] {
    const tipos = new Set<string>();
    this.equipos.forEach(e => {
      const t = this.getTipoNombre(e);
      if (t) tipos.add(t);
    });
    return Array.from(tipos).sort();
  }

  get equiposFiltrados(): Equipo[] {
    if (!this.tipoSeleccionado) return this.equipos;
    return this.equipos.filter(e => this.getTipoNombre(e) === this.tipoSeleccionado);
  }

  getTipoNombre(e: any): string {
    return (
      e?.tipo?.nombre ||
      e?.tipo_nombre ||
      e?.tipo_equipo?.nombre ||
      e?.categoria ||
      'Sin tipo'
    );
  }

  /* ================================
     CREAR PACK (BACKEND)
  ================================ */
  crearPack(): void {
    if (!this.form.nombre.trim()) {
      this.notify.warning('Debes ingresar un nombre para el pack.');
      return;
    }

    if (this.form.equipos.length === 0) {
      this.notify.warning('Debes agregar al menos un equipo al pack.');
      return;
    }

    this.guardando = true;
    this.error = null;

    const data = new FormData();
    data.append('nombre', this.form.nombre.trim());
    data.append('descripcion', this.form.descripcion.trim());
    data.append(
      'equipos',
      JSON.stringify(this.form.equipos.map(e => e.id))
    );

    if (this.imagenSeleccionada) {
      data.append('imagen', this.imagenSeleccionada);
    }

    this.packsService.crearPack(data).subscribe({
      next: () => {
        this.notify.success('Pack creado con éxito.');
        this.guardando = false;
        this.creandoPack = false;
        this.cargarDatos();
      },
      error: (err) => {
        this.guardando = false;
        this.error =
          err?.error?.message ||
          'Error al crear pack.';
      }
    });
  }

  /* ================================
     ACTUALIZAR PACK (PENDIENTE)
  ================================ */
actualizarPack(): void {
  if (!this.packSeleccionado) return;

  if (!this.form.nombre.trim()) {
    this.notify.warning('Debes ingresar un nombre para el pack.');
    return;
  }

  if (this.form.equipos.length === 0) {
    this.notify.warning('Debes agregar al menos un equipo al pack.');
    return;
  }

  this.guardando = true;
  this.error = null;

  const data = new FormData();
  data.append('nombre', this.form.nombre.trim());
  data.append('descripcion', this.form.descripcion.trim());
  data.append(
    'equipos',
    JSON.stringify(this.form.equipos.map(e => e.id))
  );

  if (this.imagenSeleccionada) {
    data.append('imagen', this.imagenSeleccionada);
  }

  this.packsService
    .actualizarPack(this.packSeleccionado.id, data)
    .subscribe({
      next: () => {
        this.notify.success('Pack actualizado correctamente.');
        this.guardando = false;
        this.creandoPack = false;
        this.editandoPack = false;
        this.packSeleccionado = null;
        this.cargarDatos();
      },
      error: (err) => {
        this.guardando = false;
        this.error =
          err?.error?.message ||
          'Error al actualizar pack.';
      }
    });
}


  /* ================================
     ELIMINAR PACK
  ================================ */
  eliminarPack(id: number): void {
    const ok = confirm('¿Eliminar este pack?');
    if (!ok) return;

    this.eliminando = true;
    this.error = null;

    this.packsService.eliminarPack(id).subscribe({
      next: () => {
        this.notify.success('Pack eliminado correctamente.');
        this.eliminando = false;
        this.packSeleccionado = null;
        this.cargarDatos();
      },
      error: () => {
        this.eliminando = false;
        this.error = 'Error al eliminar pack.';
      }
    });
  }

  reactivarPack(id: number): void {
    const ok = confirm('¿Reactivar este pack y marcar sus equipos como DISPONIBLE?');
    if (!ok) return;

    this.guardando = true;
    this.error = null;

    this.packsService.reactivarPack(id).subscribe({
      next: () => {
        this.notify.success('Pack reactivado correctamente.');
        this.guardando = false;
        this.packSeleccionado = null;
        this.cargarDatos();
      },
      error: () => {
        this.guardando = false;
        this.error = 'Error al reactivar pack.';
      }
    });
  }

  /* ================================
     HELPERS
  ================================ */
  trackById(_: number, item: any) {
    return item?.id;
  }
}
