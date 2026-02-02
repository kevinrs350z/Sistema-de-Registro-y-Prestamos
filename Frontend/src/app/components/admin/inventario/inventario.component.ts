import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ImagenService } from '../../../services/image.service';

import { EquiposService } from '../../../services/equipos.service';
import { CategoriaService } from '../../../services/categoria.service';
import { TipoEquipoService } from '../../../services/tipoEquipo.service';
import { TipoEquipoRelacionadoService, TipoRelacionado } from '../../../services/tipoEquipoRelacionado.service';
import { NotificationService } from '../../../services/notification.service';

@Component({
  selector: 'app-inventario',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './inventario.component.html',
  styleUrls: ['./inventario.component.css']
})
export class InventarioComponent implements OnInit {

  private notify = inject(NotificationService);
  private relacionadosSrv = inject(TipoEquipoRelacionadoService);

  equipos: any[] = [];
  equiposFiltrados: any[] = [];

  categorias: any[] = [];
  todosTipos: any[] = [];
  modelosDeCategoria: any[] = [];

  areas: string[] = [];
  modelos: string[] = [];

  archivoImagen: File | null = null;
  previewImagen: string | null = null;

  archivoImagenTipo: File | null = null;
  previewImagenTipo: string | null = null;

  busqueda = '';
  filtroArea = '';
  filtroModelo = '';

  modeloSeleccionado: any = null;
  equipoSeleccionado: any = null;

  editandoModelo = false;
  panelCrear = false;
  guardando = false;

  modo: 'existente' | 'nuevo' = 'existente';

  nuevoEquipo: any = {
    categoria_id: '',
    tipo_equipo_id: '',
    nuevoModelo: '',
    codigo: '',
    estado: 'DISPONIBLE',
    maximo_prestamo: 1
  };

  // =====================================================
  // EQUIPOS RELACIONADOS
  // =====================================================
  relacionadosDelModelo: TipoRelacionado[] = [];
  sugerenciasRelacionados: TipoRelacionado[] = [];
  tipoRelacionadoSeleccionado: number | null = null;
  
  // Para crear nuevo tipo con relación
  relacionarConTipoId: number | null = null;
  tiposParaRelacionar: any[] = [];
  
  // Confirmación de modificación
  mostrarConfirmacionModificar = false;

  private readonly MAX_IMAGE_BYTES = 2 * 1024 * 1024; // 2MB
  private readonly ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp'];

  constructor(
    private equiposService: EquiposService,
    private categoriaService: CategoriaService,
    private tipoEquipoService: TipoEquipoService,
    private imagenSrv: ImagenService
  ) {}

  ngOnInit(): void {
    this.cargarCategorias();
    this.cargarTipos();
    this.cargarEquipos();
  }

  cargarCategorias() {
    this.categoriaService.getCategorias().subscribe({
      next: data => this.categorias = data,
      error: err => console.error('Error cargando categorías', err)
    });
  }

  cargarTipos() {
    this.tipoEquipoService.getTipos().subscribe({
      next: data => this.todosTipos = data,
      error: err => console.error('Error cargando tipos', err)
    });
  }

  cargarEquipos() {
    this.equiposService.getEquipos().subscribe({
      next: (equipos: any[]) => {
        this.equipos = equipos.filter(e => e.estado !== 'ELIMINADO');

        this.areas = [...new Set(this.equipos.map(e => e.categoria))];
        this.modelos = [...new Set(this.equipos.map(e => e.nombre))];

        this.filtrar();
      },
      error: err => console.error('Error cargando equipos', err)
    });
  }

  abrirCrearEquipo() {
    this.panelCrear = true;
    this.modeloSeleccionado = null;
    this.equipoSeleccionado = null;
  }

  cerrarCrear() {
    this.panelCrear = false;
  }

  cargarModelosPorCategoria() {
    this.modelosDeCategoria = this.todosTipos
      .filter(t => t.categoria_id == this.nuevoEquipo.categoria_id);
    
    // También cargar tipos disponibles para relacionar (misma categoría)
    this.tiposParaRelacionar = this.todosTipos
      .filter(t => t.categoria_id == this.nuevoEquipo.categoria_id);
    this.relacionarConTipoId = null;
  }

  onFileSelected(event: any) {
    const file = event.target.files[0];
    if (!file) return;

    if (!this.validarImagen(file)) {
      event.target.value = '';
      return;
    }

    this.archivoImagen = file;
    const reader = new FileReader();
    reader.onload = () => this.previewImagen = reader.result as string;
    reader.readAsDataURL(file);
  }

  onTipoImagenSelected(event: any) {
    const file = event.target.files[0];
    if (!file) return;

    if (!this.validarImagen(file)) {
      event.target.value = '';
      return;
    }

    this.archivoImagenTipo = file;
    const reader = new FileReader();
    reader.onload = () => this.previewImagenTipo = reader.result as string;
    reader.readAsDataURL(file);
  }

  private validarImagen(file: File): boolean {
    if (!this.ALLOWED_IMAGE_TYPES.includes(file.type)) {
      this.notify.error('Formato no permitido. Usa JPG, PNG o WEBP.');
      return false;
    }

    if (file.size > this.MAX_IMAGE_BYTES) {
      this.notify.error('La imagen supera el tamaño máximo permitido (2MB).');
      return false;
    }

    return true;
  }

  guardarNuevoEquipo() {
    if (!this.nuevoEquipo.categoria_id || !this.nuevoEquipo.codigo) {
      this.notify.warning('Completa los campos obligatorios antes de guardar.');
      return;
    }

    if (this.modo === 'nuevo') {
      if (!this.nuevoEquipo.nuevoModelo) {
        this.notify.warning('Ingresa el nombre del nuevo modelo.');
        return;
      }

      if (this.nuevoEquipo.maximo_prestamo === null || this.nuevoEquipo.maximo_prestamo === undefined || this.nuevoEquipo.maximo_prestamo === '') {
        this.notify.warning('Debes definir el máximo de préstamo para ALUMNO.');
        return;
      }

      if (Number(this.nuevoEquipo.maximo_prestamo) < 0) {
        this.notify.warning('El máximo de préstamo no puede ser negativo.');
        return;
      }

      this.tipoEquipoService.crearTipo(
        {
          nombre: this.nuevoEquipo.nuevoModelo,
          categoria_id: this.nuevoEquipo.categoria_id,
          maximo_prestamo: Number(this.nuevoEquipo.maximo_prestamo)
        },
        this.archivoImagen ?? undefined
      ).subscribe({
        next: res => {
          const nuevoTipoId = res.tipoEquipo.id;
          
          // Si se seleccionó relacionar con otro tipo, crear la relación
          if (this.relacionarConTipoId) {
            this.relacionadosSrv.crearRelacion(nuevoTipoId, this.relacionarConTipoId)
              .subscribe({
                next: () => {
                  this.notify.info('Relación creada con el tipo seleccionado.');
                  this.crearEquipoFinal(nuevoTipoId);
                },
                error: (err) => {
                  console.error('Error creando relación', err);
                  // Continuar aunque falle la relación
                  this.crearEquipoFinal(nuevoTipoId);
                }
              });
          } else {
            this.crearEquipoFinal(nuevoTipoId);
          }
        },
        error: err => console.error('Error creando tipo', err)
      });

    } else {
      this.crearEquipoFinal(this.nuevoEquipo.tipo_equipo_id);
    }
  }

  crearEquipoFinal(tipoId: number) {
    this.equiposService.crearEquipo({
      tipo_equipo_id: tipoId,
      codigo: this.nuevoEquipo.codigo,
      estado: this.nuevoEquipo.estado
    }).subscribe({
      next: () => {
        this.notify.success('Equipo creado exitosamente.');
        this.cargarEquipos();
        this.limpiarModal();
      },
      error: err => console.error('Error creando equipo', err)
    });
  }

  limpiarModal() {
    this.nuevoEquipo = {
      categoria_id: '',
      tipo_equipo_id: '',
      nuevoModelo: '',
      codigo: '',
      estado: 'DISPONIBLE',
      maximo_prestamo: 1
    };
    this.archivoImagen = null;
    this.previewImagen = null;
    this.modo = 'existente';
    this.relacionarConTipoId = null;
    this.tiposParaRelacionar = [];
  }

  filtrar() {
    const texto = this.busqueda.toLowerCase();

    this.equiposFiltrados = this.equipos.filter(e =>
      (this.filtroArea === '' || e.categoria === this.filtroArea) &&
      (this.filtroModelo === '' || e.nombre === this.filtroModelo) &&
      (e.nombre.toLowerCase().includes(texto) ||
       e.codigo.toLowerCase().includes(texto))
    );
  }

  get modelosAgrupados() {
    const grupos: any = {};
    this.equiposFiltrados.forEach(e => {
      if (!grupos[e.nombre]) grupos[e.nombre] = [];
      grupos[e.nombre].push(e);
    });

    return Object.keys(grupos).map(modelo => ({
      modelo,
      equipos: grupos[modelo]
    }));
  }

  editarModelo(grupo: any) {
    const tipo = this.todosTipos.find((t: any) =>
      (t.nombre ?? '').toLowerCase() === (grupo.modelo ?? '').toLowerCase()
    ) ?? null;

    this.modeloSeleccionado = {
      nombre: grupo.modelo,
      categoria: grupo.equipos[0].categoria,
      equipos: grupo.equipos,
      tipoId: tipo?.id ?? null,
      maximo_prestamo: tipo?.maximo_prestamo ?? 1,
      imagen: tipo?.imagen ?? null
    };
    this.equipoSeleccionado = null;
    this.editandoModelo = false;
    this.archivoImagenTipo = null;
    this.previewImagenTipo = null;
    
    // Cargar relaciones del tipo
    this.relacionadosDelModelo = [];
    this.sugerenciasRelacionados = [];
    if (tipo?.id) {
      this.cargarRelacionesDelTipo(tipo.id);
    }
  }

  /**
   * Cargar los tipos relacionados de un tipo de equipo
   */
  cargarRelacionesDelTipo(tipoId: number) {
    this.relacionadosSrv.getRelaciones(tipoId).subscribe({
      next: (data) => {
        this.relacionadosDelModelo = data.relacionados || [];
      },
      error: (err) => console.error('Error cargando relaciones', err)
    });
  }

  /**
   * Cargar sugerencias de tipos para relacionar
   */
  cargarSugerenciasRelacionados(tipoId: number) {
    this.relacionadosSrv.getSugerencias(tipoId).subscribe({
      next: (data) => {
        this.sugerenciasRelacionados = data || [];
      },
      error: (err) => console.error('Error cargando sugerencias', err)
    });
  }

  /**
   * Agregar una relación entre tipos de equipo
   */
  agregarRelacion(relacionadoId: number) {
    if (!this.modeloSeleccionado?.tipoId || !relacionadoId) return;

    this.relacionadosSrv.crearRelacion(this.modeloSeleccionado.tipoId, relacionadoId)
      .subscribe({
        next: () => {
          this.notify.success('Relación agregada correctamente.');
          this.cargarRelacionesDelTipo(this.modeloSeleccionado.tipoId);
          this.cargarSugerenciasRelacionados(this.modeloSeleccionado.tipoId);
          this.tipoRelacionadoSeleccionado = null;
        },
        error: (err) => {
          console.error(err);
          this.notify.error(err.error?.error || 'Error al agregar relación.');
        }
      });
  }

  /**
   * Eliminar una relación entre tipos de equipo
   */
  eliminarRelacion(relacionadoId: number) {
    if (!this.modeloSeleccionado?.tipoId || !relacionadoId) return;

    this.relacionadosSrv.eliminarRelacion(this.modeloSeleccionado.tipoId, relacionadoId)
      .subscribe({
        next: () => {
          this.notify.success('Relación eliminada correctamente.');
          this.cargarRelacionesDelTipo(this.modeloSeleccionado.tipoId);
          this.cargarSugerenciasRelacionados(this.modeloSeleccionado.tipoId);
        },
        error: (err) => {
          console.error(err);
          this.notify.error('Error al eliminar relación.');
        }
      });
  }

  verDetalle(eq: any) {
    this.equipoSeleccionado = { ...eq };
    this.modeloSeleccionado = null;
  }

  cerrarPanel() {
    this.equipoSeleccionado = null;
  }

  iniciarEdicionModelo() {
    if (!this.modeloSeleccionado?.tipoId) return;
    this.editandoModelo = true;
    this.cargarSugerenciasRelacionados(this.modeloSeleccionado.tipoId);
  }

  cancelarEdicionModelo() {
    this.editandoModelo = false;
    this.archivoImagenTipo = null;
    this.previewImagenTipo = null;
  }

  /**
   * Mostrar confirmación antes de guardar si hay relacionados
   */
  confirmarGuardarCambiosModelo() {
    if (!this.modeloSeleccionado?.tipoId) return;

    const maximo = Number(this.modeloSeleccionado.maximo_prestamo);
    if (isNaN(maximo) || maximo < 0) {
      this.notify.warning('El máximo de préstamo no puede ser negativo.');
      return;
    }

    // Si hay relacionados, mostrar confirmación
    if (this.relacionadosDelModelo.length > 0) {
      this.mostrarConfirmacionModificar = true;
    } else {
      this.guardarCambiosModelo();
    }
  }

  /**
   * Cancelar la confirmación de modificación
   */
  cancelarConfirmacionModificar() {
    this.mostrarConfirmacionModificar = false;
  }

  guardarCambiosModelo() {
    this.mostrarConfirmacionModificar = false;
    
    if (!this.modeloSeleccionado?.tipoId) return;

    const maximo = Number(this.modeloSeleccionado.maximo_prestamo);
    if (isNaN(maximo) || maximo < 0) {
      this.notify.warning('El máximo de préstamo no puede ser negativo.');
      return;
    }

    const payload: any = {
      maximo_prestamo: maximo
    };

    if (this.archivoImagenTipo) {
      payload.imagen = this.archivoImagenTipo;
    }

    this.tipoEquipoService.actualizarTipo(this.modeloSeleccionado.tipoId, payload)
      .subscribe({
        next: () => {
          this.notify.success('Tipo de equipo actualizado correctamente.');
          this.cargarTipos();
          this.cargarEquipos();
          this.editandoModelo = false;
          this.archivoImagenTipo = null;
          this.previewImagenTipo = null;
        },
        error: err => {
          console.error(err);
          this.notify.error('Ocurrió un error al actualizar el tipo de equipo.');
        }
      });
  }

guardarCambiosEquipo() {
  if (this.guardando || !this.equipoSeleccionado?.id) return;

  this.guardando = true;

  // ELIMINAR
  if (this.equipoSeleccionado.estado === 'ELIMINAR') {
    this.equiposService.eliminarEquipo(this.equipoSeleccionado.id)
      .subscribe({
        next: () => {
          this.notify.success('Equipo eliminado correctamente.');
          this.cargarEquipos();
          this.cerrarPanel();
          this.guardando = false;
        },
        error: err => {
          console.error(err);
          this.notify.error('Ocurrió un error al eliminar el equipo.');
          this.guardando = false;
        }
      });
    return;
  }

  // 🟢 UPDATE
  this.equiposService.actualizarEquipo(
    this.equipoSeleccionado.id,
    {
      codigo: this.equipoSeleccionado.codigo,
      estado: this.equipoSeleccionado.estado
    }
  ).subscribe({
    next: () => {
      this.notify.success('Equipo actualizado correctamente.');
      this.cargarEquipos();
      this.cerrarPanel();
      this.guardando = false;
    },
    error: err => {
      console.error(err);
      this.notify.error('Ocurrió un error al actualizar el equipo.');
      this.guardando = false;
    }
  });
}



private getTipoEquipoById(tipoId: number): any | null {
  return this.todosTipos.find((t: any) => Number(t.id) === Number(tipoId)) ?? null;
}

  /**
   * Imagen para EQUIPO FÍSICO (detalle derecho)
   * Usa tipo_equipo_id -> busca el tipo -> usa ImagenService (backend)
   * Solo devuelve imágenes del backend, null si no hay
   */
  getImagenEquipo(equipo: any): string | null {
    const tipo = equipo?.tipo_equipo_id
      ? this.getTipoEquipoById(equipo.tipo_equipo_id)
      : null;

    return this.imagenSrv.resolveTipoEquipoImage({
      imagen: tipo?.imagen,
      nombre: tipo?.nombre ?? equipo?.nombre
    });
  }

  /**
   * Imagen para MODELO (panel derecho cuando seleccionas grupo)
   * Solo devuelve imágenes del backend, null si no hay
   */
  getImagenModelo(modeloSeleccionado: any): string | null {
    const tipo = this.todosTipos.find((t: any) =>
      (t.nombre ?? '').toLowerCase() === (modeloSeleccionado?.nombre ?? '').toLowerCase()
    ) ?? null;

    return this.imagenSrv.resolveTipoEquipoImage({
      imagen: tipo?.imagen,
      nombre: tipo?.nombre ?? modeloSeleccionado?.nombre
    });
  }

}
