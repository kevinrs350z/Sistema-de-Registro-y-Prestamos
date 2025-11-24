import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { EquiposService } from '../../../services/equipos.service';

@Component({
  selector: 'app-inventario',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './inventario.component.html',
  styleUrls: ['./inventario.component.css']
})
export class InventarioComponent {

  equipos: any[] = [];
  equiposFiltrados: any[] = [];

  areas: string[] = [];
  modelos: string[] = [];

  filtroArea = '';
  filtroModelo = '';
  busqueda = '';

  equipoSeleccionado: any = null;
  solicitudActiva: any = null;

  modeloSeleccionado: any = null;
  editandoModelo = false;

  constructor(private equiposService: EquiposService) { }

  ngOnInit(): void {
    this.cargarEquipos();
  }

  // ============================================================
  // CARGAR EQUIPOS
  // ============================================================
  cargarEquipos() {
    this.equiposService.getEquipos().subscribe({
      next: (data) => {
        this.equipos = data;

        // Llenar filtros
        this.areas = [...new Set(data.map(e => e.categoria))];
        this.modelos = [...new Set(data.map(e => e.nombre))];

        this.filtrar();
      },
      error: err => console.error('Error cargando equipos:', err)
    });
  }

  // ============================================================
  // FILTRAR
  // ============================================================
  filtrar() {
    const texto = this.busqueda.toLowerCase();

    this.equiposFiltrados = this.equipos.filter(e =>
      (this.filtroArea === '' || e.categoria === this.filtroArea) &&
      (this.filtroModelo === '' || e.nombre === this.filtroModelo) &&
      (e.nombre.toLowerCase().includes(texto) || e.codigo.toLowerCase().includes(texto))
    );
  }

  // ============================================================
  // AGRUPAR POR MODELO
  // ============================================================
  get modelosAgrupados() {
    const grupos: any = {};

    this.equiposFiltrados.forEach(e => {
      if (!grupos[e.nombre]) grupos[e.nombre] = [];
      grupos[e.nombre].push(e);
    });

    return Object.keys(grupos).map(nombre => ({
      modelo: nombre,
      equipos: grupos[nombre]
    }));
  }

  // ============================================================
  // VER MODELO (Panel derecho)
  // ============================================================
  editarModelo(grupo: any) {
    const lista = grupo.equipos;
    this.editandoModelo = false;

    this.modeloSeleccionado = {
      nombre: grupo.modelo,
      categoria: lista[0].categoria,
      nombreOriginal: grupo.modelo,

      equipos: lista.map((e: any) => ({
        idEquipo: e.idEquipo,
        codigo: e.codigo,
        estado: e.estado,
        created_at: e.created_at,
        updated_at: e.updated_at
      }))
    };

    this.equipoSeleccionado = null;
    this.solicitudActiva = null;
  }

  cerrarEdicionModelo() {
    this.modeloSeleccionado = null;
    this.editandoModelo = false;
  }

  activarEdicionModelo() {
    this.editandoModelo = true;
  }

  // ============================================================
  // GUARDAR CAMBIOS DEL MODELO (solo visual)
  // ============================================================
  guardarCambiosModelo() {

    if (!this.modeloSeleccionado) return;

    const nombreNuevo = this.modeloSeleccionado.nombre;
    const categoriaNueva = this.modeloSeleccionado.categoria;
    const nombreOriginal = this.modeloSeleccionado.nombreOriginal;

    // 1) Actualizar todos los equipos que están dentro del modelo
    this.modeloSeleccionado.equipos.forEach((eq: any) => {

      const index = this.equipos.findIndex(e => e.idEquipo === eq.idEquipo);

      if (index !== -1) {
        this.equipos[index] = {
          ...this.equipos[index],
          nombre: nombreNuevo,
          categoria: categoriaNueva,
          codigo: eq.codigo,
          estado: eq.estado
        };
      }
    });

    // 2) Actualizar cualquier otro equipo que comparta el mismo modelo original
    this.equipos = this.equipos.map(e => {
      if (e.nombre === nombreOriginal) {
        return { ...e, nombre: nombreNuevo, categoria: categoriaNueva };
      }
      return e;
    });

    alert('Cambios aplicados (solo visual)');

    this.filtrar();

    this.editandoModelo = false;
    this.modeloSeleccionado = null;
  }

  // ============================================================
  // VER DETALLE DE EQUIPO INDIVIDUAL
  // ============================================================
  verDetalle(eq: any) {
    this.equipoSeleccionado = { ...eq };
    this.modeloSeleccionado = null;

    if (eq.estado !== 'disponible') {
      // Simulación de solicitud activa
      this.solicitudActiva = {
        usuario: "Usuario desconocido",
        fecha: eq.updated_at,
        motivo: "Información no disponible",
        id: eq.idEquipo
      };
    } else {
      this.solicitudActiva = null;
    }
  }

  // ============================================================
  // GUARDAR CAMBIOS DE UN EQUIPO (SOLO VISUAL)
  // ============================================================
  guardarCambiosEquipo() {

    if (!this.equipoSeleccionado) return;

    const index = this.equipos.findIndex(e => e.idEquipo === this.equipoSeleccionado.idEquipo);

    if (index !== -1) {

      // 🔥 Actualiza la lista principal (solo visual)
      this.equipos[index] = {
        ...this.equipos[index],
        codigo: this.equipoSeleccionado.codigo,
        estado: this.equipoSeleccionado.estado
      };

      alert("Cambios guardados (solo visual, no en BD)");
    }

    this.cerrarPanel();
    this.filtrar();
  }


  // ============================================================
  // VER SOLICITUD (SIMULADO)
  // ============================================================
  verSolicitud(eq: any) {
    alert("Vista de solicitud simulada. Se implementará después.");
  }

  // ============================================================
  // TERMINAR PRÉSTAMO
  // ============================================================
  terminarPrestamo() {
    if (!this.equipoSeleccionado) return;

    this.equipoSeleccionado.estado = 'disponible';
    this.solicitudActiva = null;

    alert("Equipo marcado como disponible (solo visual)");
    this.cargarEquipos();
  }

  cerrarPanel() {
    this.equipoSeleccionado = null;
    this.solicitudActiva = null;
  }




  // ==========================================
  // OBTENER IMAGEN DEL EQUIPO (MISMA LÓGICA QUE CATÁLOGO)
  // ==========================================
  getImagenEquipo(equipo: any): string {
    const nombre = equipo.nombre?.toLowerCase() || '';

    if (nombre.includes('cámara') || nombre.includes('canon')) return 'assets/equipos/camara.jpg';
    if (nombre.includes('micrófono') || nombre.includes('rode')) return 'assets/equipos/aro.jpg';
    if (nombre.includes('tablet') || nombre.includes('wacom')) return 'assets/equipos/computador.jpg';
    if (nombre.includes('proyector') || nombre.includes('epson')) return 'assets/equipos/proyector.jpg';
    if (nombre.includes('grabadora') || nombre.includes('zoom')) return 'assets/equipos/luz.jpg';

    return 'assets/equipos/lampara.jpg';
  }

}
