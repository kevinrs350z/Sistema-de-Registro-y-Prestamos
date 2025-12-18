/**
 * Componente encargado de la gestión completa del inventario de equipos.
 * Se encarga de:
 *  - Cargar categorías, tipos y equipos desde el backend.
 *  - Filtrar equipos por área, modelo o búsqueda textual.
 *  - Crear nuevos equipos o modelos, incluyendo subida de imágenes.
 *  - Visualizar y editar grupos de equipos o un equipo individual.
 * 
 * Este módulo representa un punto clave del sistema, ya que gestiona el estado
 * del inventario y establece comunicación directa con los servicios del frontend
 * que, a su vez, interactúan con el backend.
 */

import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { EquiposService } from '../../../services/equipos.service';
import { CategoriaService } from '../../../services/categoria.service';
import { TipoEquipoService } from '../../../services/tipoEquipo.service';

@Component({
  selector: 'app-inventario',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './inventario.component.html',
  styleUrls: ['./inventario.component.css']
})
export class InventarioComponent {

  /** Listas principales utilizadas en el inventario */
  equipos: any[] = [];
  equiposFiltrados: any[] = [];

  categorias: any[] = [];
  todosTipos: any[] = [];
  modelosDeCategoria: any[] = [];
  /** Almacenan áreas y modelos usados para los filtros */
  areas: string[] = [];
  modelos: string[] = [];

 /** Imagen seleccionada al crear un modelo nuevo */
  archivoImagen: File | null = null;
  previewImagen: string | null = null;

 /** Variables de filtros y búsqueda */
  busqueda = '';
  filtroArea = '';
  filtroModelo = '';
 /** Variables para selección de modelos/equipos */
  modeloSeleccionado: any = null;
  equipoSeleccionado: any = null;
  solicitudActiva: any = null;
/** Controlan estados de edición */
  editandoModelo = false;

  /** Define si se creará un equipo con modelo existente o nuevo */
  modo: 'existente' | 'nuevo' = 'existente';
/** Control del panel de creación */
  panelCrear = false;
  /** Template del formulario para creación de equipos */ 
  nuevoEquipo: any = {
    categoria_id: '',
    tipo_equipo_id: '',
    nuevoModelo: '',
    codigo: '',
    estado: 'DISPONIBLE'
  };

  constructor(
    private equiposService: EquiposService,
    private categoriaService: CategoriaService,
    private tipoEquipoService: TipoEquipoService
  ) {}
  /**
   * Carga inicial del componente.
   * Se ejecutan las funciones que solicitan información al backend
   * mediante los servicios correspondientes.
   */
  ngOnInit(): void {
    this.cargarCategorias();
    this.cargarTipos();
    this.cargarEquipos();
  }

 
  /**
   * Obtiene las categorías desde el backend.
   */
  cargarCategorias() {
    this.categoriaService.getCategorias().subscribe({
      next: (data: any[]) => this.categorias = data,
      error: (err: any) => console.error('Error cargando categorías', err)
    });
  }
  /**
   * Obtiene los tipos de equipos desde el backend.
   */
  cargarTipos() {
    this.tipoEquipoService.getTipos().subscribe({
      next: (data) => {
        console.log("Tipos desde backend:", data);
        this.todosTipos = data;
      }
    });
  }
  /**
   * Obtiene los equipos, genera áreas y modelos únicos,
   * y aplica filtros iniciales.
   */
  cargarEquipos() {
    this.equiposService.getEquipos().subscribe({
      next: (equipos: any[]) => {
        this.equipos = equipos;

        this.areas = [...new Set(equipos.map(e => e.categoria))];
        this.modelos = [...new Set(equipos.map(e => e.nombre))];

        this.filtrar();
      },
      error: (err: any) => console.error('Error cargando equipos:', err)
    });
  }

  /**
   * Abre el panel para crear un nuevo equipo.
   */
  abrirCrearEquipo() {
    this.panelCrear = true;
    this.modeloSeleccionado = null;
    this.equipoSeleccionado = null;
  }
  /**
   * Cierra el panel de creación.
   */
  cerrarCrear() {
    this.panelCrear = false;
  }
  /**
   * Carga los modelos disponibles filtrando por categoría seleccionada.
   */
  cargarModelosPorCategoria() {
    const categoriaId = this.nuevoEquipo.categoria_id;
    this.modelosDeCategoria = this.todosTipos.filter(t => t.categoria_id == categoriaId);
  }

  /**
   * Alterna entre crear un equipo con modelo existente o uno nuevo.
   */
  cambiarModo() {
    this.modo = this.modo === 'existente' ? 'nuevo' : 'existente';
  }
  /**
   * Maneja la selección de archivos de imagen y genera una vista previa.
   */
  onFileSelected(event: any) {
    const file = event.target.files[0];
    if (!file) return;

    this.archivoImagen = file;

    const reader = new FileReader();
    reader.onload = () => this.previewImagen = reader.result as string;
    reader.readAsDataURL(file);
  }
  /**
   * Guarda un nuevo equipo, generando previamente un modelo si corresponde.
   */
  guardarNuevoEquipo() {
    if (!this.nuevoEquipo.categoria_id || !this.nuevoEquipo.codigo) {
      alert('Complete los campos obligatorios');
      return;
    }

 
// Si se crea un modelo nuevo
    if (this.modo === 'nuevo') {
      if (!this.nuevoEquipo.nuevoModelo) {
        alert('Ingrese el nombre del nuevo modelo');
        return;
      }

 this.tipoEquipoService.crearTipo(
  {
    nombre: this.nuevoEquipo.nuevoModelo,
    categoria_id: this.nuevoEquipo.categoria_id
  },
  this.archivoImagen ?? undefined
)
.subscribe({
        next: (res: any) => {
          const tipoId = res.tipoEquipo.id;
          this.crearEquipoFinal(tipoId);
        },
        error: (err: any) => console.error('Error creando tipo', err)
      });

    } else {
  // Con modelo existente
      this.crearEquipoFinal(this.nuevoEquipo.tipo_equipo_id);
    }
  }
  /**
   * Crea un equipo luego de contar con el ID del tipo.
   */
  crearEquipoFinal(tipoId: number) {
    this.equiposService.crearEquipo({
      tipo_equipo_id: tipoId,
      codigo: this.nuevoEquipo.codigo,
      estado: this.nuevoEquipo.estado
    }).subscribe({
      next: () => {
        alert('Equipo creado exitosamente');
        this.cargarEquipos();
        this.limpiarModal();
      },
      error: (err: any) => console.error('Error creando equipo', err)
    });
  }
  /**
   * Limpia todos los campos del formulario de creación.
   */
  limpiarModal() {
    this.nuevoEquipo = {
      categoria_id: '',
      tipo_equipo_id: '',
      nuevoModelo: '',
      codigo: '',
      estado: 'DISPONIBLE'
    };

    this.archivoImagen = null;
    this.previewImagen = null;

    this.modo = 'existente';
  }

  /**
   * Aplica filtros dinámicos sobre los equipos cargados.
   */
  filtrar() {
    const texto = this.busqueda.toLowerCase();

    this.equiposFiltrados = this.equipos.filter(e =>
      (this.filtroArea === '' || e.categoria === this.filtroArea) &&
      (this.filtroModelo === '' || e.nombre === this.filtroModelo) &&
      (e.nombre.toLowerCase().includes(texto) || e.codigo.toLowerCase().includes(texto))
    );
  }
  /**
   * Agrupa equipos por modelo para mostrar en el panel de inventario.
   */
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

  /**
   * Selecciona un modelo y prepara su información
   * para ser visualizada o editada.
   */
  editarModelo(grupo: any) {
    this.editandoModelo = false;

    this.modeloSeleccionado = {
      nombre: grupo.modelo,
      categoria: grupo.equipos[0].categoria,
      nombreOriginal: grupo.modelo,
      equipos: grupo.equipos.map((e: any) => ({
        idEquipo: e.idEquipo,
        codigo: e.codigo,
        estado: e.estado,
        created_at: e.created_at,
        updated_at: e.updated_at
      }))
    };

    this.equipoSeleccionado = null;
  }

  activarEdicionModelo() {
    this.editandoModelo = true;
  }

  cerrarEdicionModelo() {
    this.editandoModelo = false;
    this.modeloSeleccionado = null;
  }

  guardarCambiosModelo() {
    alert('Cambios aplicados');
    this.cerrarEdicionModelo();
  }

 
  /**
   * Selecciona un equipo específico para ver detalles.
   */
  verDetalle(eq: any) {
    this.equipoSeleccionado = { ...eq };
    this.modeloSeleccionado = null;
  }
/**
   * Cierra los paneles de detalle o edición.
   */
  cerrarPanel() {
    this.equipoSeleccionado = null;
    this.solicitudActiva = null;
  }
  

  guardarCambiosEquipo() {
    if (!this.equipoSeleccionado?.idEquipo) {
      console.error('Equipo no válido');
      return;
    }

    const payload = {
      estado: this.equipoSeleccionado.estado
    };

    this.equiposService
      .actualizarEquipo(this.equipoSeleccionado.idEquipo, payload)
      .subscribe({
        next: () => {
          alert('Estado del equipo actualizado correctamente');
          this.cargarEquipos();
          this.cerrarPanel();
        },
        error: (err: any) => {
          console.error('Error actualizando equipo', err);
          alert('No se pudo actualizar el estado del equipo');
        }
      });
  }


  /**
   * Retorna la imagen correspondiente a un equipo según su nombre.
   */
  getImagenEquipo(equipo: any): string {
    const n = equipo.nombre?.toLowerCase() || '';

    if (n.includes('cámara') || n.includes('canon')) return 'assets/equipos/camara.jpg';
    if (n.includes('micrófono') || n.includes('rode')) return 'assets/equipos/aro.jpg';
    if (n.includes('tablet') || n.includes('wacom')) return 'assets/equipos/computador.jpg';
    if (n.includes('proyector') || n.includes('epson')) return 'assets/equipos/proyector.jpg';
    if (n.includes('grabadora') || n.includes('zoom')) return 'assets/equipos/luz.jpg';

    return 'assets/equipos/lampara.jpg';
  }
}

