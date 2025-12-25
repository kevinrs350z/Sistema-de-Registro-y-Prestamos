import { Component, OnInit } from '@angular/core';
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
export class InventarioComponent implements OnInit {

  equipos: any[] = [];
  equiposFiltrados: any[] = [];

  categorias: any[] = [];
  todosTipos: any[] = [];
  modelosDeCategoria: any[] = [];

  areas: string[] = [];
  modelos: string[] = [];

  archivoImagen: File | null = null;
  previewImagen: string | null = null;

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
    estado: 'DISPONIBLE'
  };

  constructor(
    private equiposService: EquiposService,
    private categoriaService: CategoriaService,
    private tipoEquipoService: TipoEquipoService
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
  }

  onFileSelected(event: any) {
    const file = event.target.files[0];
    if (!file) return;

    this.archivoImagen = file;
    const reader = new FileReader();
    reader.onload = () => this.previewImagen = reader.result as string;
    reader.readAsDataURL(file);
  }

  guardarNuevoEquipo() {
    if (!this.nuevoEquipo.categoria_id || !this.nuevoEquipo.codigo) {
      alert('Complete los campos obligatorios');
      return;
    }

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
      ).subscribe({
        next: res => this.crearEquipoFinal(res.tipoEquipo.id),
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
        alert('Equipo creado exitosamente');
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
      estado: 'DISPONIBLE'
    };
    this.archivoImagen = null;
    this.previewImagen = null;
    this.modo = 'existente';
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
    this.modeloSeleccionado = {
      nombre: grupo.modelo,
      categoria: grupo.equipos[0].categoria,
      equipos: grupo.equipos
    };
    this.equipoSeleccionado = null;
  }

  verDetalle(eq: any) {
    this.equipoSeleccionado = { ...eq };
    this.modeloSeleccionado = null;
  }

  cerrarPanel() {
    this.equipoSeleccionado = null;
  }

guardarCambiosEquipo() {
  if (this.guardando || !this.equipoSeleccionado?.id) return;

  this.guardando = true;

  // 🔴 ELIMINAR
  if (this.equipoSeleccionado.estado === 'ELIMINAR') {
    this.equiposService.eliminarEquipo(this.equipoSeleccionado.id)
      .subscribe({
        next: () => {
          alert('Equipo eliminado correctamente');
          this.cargarEquipos();
          this.cerrarPanel();
          this.guardando = false;
        },
        error: err => {
          console.error(err);
          alert('Error al eliminar equipo');
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
      alert('Equipo actualizado correctamente');
      this.cargarEquipos();
      this.cerrarPanel();
      this.guardando = false;
    },
    error: err => {
      console.error(err);
      alert('Error al actualizar equipo');
      this.guardando = false;
    }
  });
}



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
