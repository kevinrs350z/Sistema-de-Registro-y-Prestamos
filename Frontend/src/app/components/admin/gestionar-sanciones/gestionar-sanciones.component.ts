import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { NavbarAdminComponent } from '../navbar-admin/navbar-admin.component';

interface Sancion {
  id: number;
  usuario: string;
  motivo: string;        // tipo de sanción
  fecha_inicio: string;
  fecha_fin: string;
  estado: 'ACTIVA' | 'EXPIRADA';
}

@Component({
  selector: 'app-gestionar-sanciones',
  standalone: true,
  imports: [CommonModule, FormsModule, NavbarAdminComponent],
  templateUrl: './gestionar-sanciones.component.html',
  styleUrls: ['./gestionar-sanciones.component.css'],
})
export class GestionarSancionesComponent implements OnInit {

  // ======================================
  //  LISTA DE SANCIONES (ASIGNADAS A USUARIOS)
  // ======================================
  sanciones: Sancion[] = [];
  sancionSeleccionada: Sancion | null = null;
  filtro = '';

  // ======================================
  //  TIPOS DE SANCIÓN DISPONIBLES
  //  (PARA EL SELECT DE "ASIGNAR SANCIÓN")
  // ======================================
  tiposSancion: string[] = [
    'Atraso en devolución',
    'Daño en equipo',
    'Uso indebido de sala',
    'Consumo de alimentos en laboratorio',
    'Uso prolongado de equipo sin reserva'
  ];

  // ======================================
  //  ESTADO DE LOS FORMULARIOS
  // ======================================
  formularioVisible = false;   // 👉 formulario "Registrar nueva sanción (tipo)"
  formularioAsignar = false;   // 👉 formulario "Asignar sanción a usuario"

  // ======================================
  //  CAMPOS FORMULARIO "REGISTRAR TIPO"
  // ======================================
  nuevoTipo = '';

  // ======================================
  //  CAMPOS FORMULARIO "ASIGNAR SANCIÓN"
  // ======================================
  asignarUsuario = '';
  asignarTipo = '';
  asignarInicio = '';
  asignarFin = '';

  // ======================================
  //  CICLO DE VIDA
  // ======================================
  ngOnInit(): void {
    this.cargarDatosSimulados();
    // valor por defecto del select
    this.asignarTipo = this.tiposSancion[0] || '';
  }

  // Datos simulados como los que tenías antes
  cargarDatosSimulados(): void {
    this.sanciones = [
      {
        id: 1,
        usuario: 'Andrea Navia',
        motivo: 'Atraso en devolución',
        fecha_inicio: '2025-02-01',
        fecha_fin: '2025-02-10',
        estado: 'ACTIVA'
      },
      {
        id: 2,
        usuario: 'Juan Pérez',
        motivo: 'Daño en equipo',
        fecha_inicio: '2025-01-10',
        fecha_fin: '2025-03-10',
        estado: 'ACTIVA'
      },
      {
        id: 3,
        usuario: 'Carla Soto',
        motivo: 'Uso indebido de sala',
        fecha_inicio: '2024-12-01',
        fecha_fin: '2024-12-15',
        estado: 'EXPIRADA'
      }
    ];
    // por defecto mostramos la primera en el detalle
    this.sancionSeleccionada = this.sanciones[0] || null;
  }

  // ======================================
  //  LISTA FILTRADA
  // ======================================
  get sancionesFiltradas(): Sancion[] {
    const f = this.filtro.toLowerCase();
    if (!f) return this.sanciones;
    return this.sanciones.filter(s =>
      s.usuario.toLowerCase().includes(f) ||
      s.motivo.toLowerCase().includes(f)
    );
  }

  // ======================================
  //  SELECCIÓN EN LA LISTA
  // ======================================
  seleccionar(s: Sancion): void {
    this.sancionSeleccionada = s;
    this.formularioVisible = false;
    this.formularioAsignar = false;
  }

  // ======================================
  //  TOGGLE FORM REGISTRAR TIPO
  // ======================================
  toggleRegistrar(): void {
    this.formularioVisible = !this.formularioVisible;
    if (this.formularioVisible) {
      this.formularioAsignar = false;
      this.sancionSeleccionada = null;
    }
  }

  // ======================================
  //  TOGGLE FORM ASIGNAR SANCIÓN
  // ======================================
  toggleAsignar(): void {
    this.formularioAsignar = !this.formularioAsignar;
    if (this.formularioAsignar) {
      this.formularioVisible = false;
      this.sancionSeleccionada = null;
    }
  }

  // ======================================
  //  ACCIONES SOBRE LA SANCIÓN SELECCIONADA
  // ======================================
  ampliarSancion(): void {
    if (!this.sancionSeleccionada) return;

    const fecha = new Date(this.sancionSeleccionada.fecha_fin);
    fecha.setDate(fecha.getDate() + 7);
    this.sancionSeleccionada.fecha_fin = fecha.toISOString().slice(0, 10);
  }

  quitarSancion(): void {
    if (!this.sancionSeleccionada) return;

    const id = this.sancionSeleccionada.id;
    this.sanciones = this.sanciones.filter(s => s.id !== id);
    this.sancionSeleccionada = null;
  }

  // ======================================
  //  FORMULARIO: REGISTRAR NUEVO TIPO
  // ======================================
  registrarTipo(): void {
    const tipo = this.nuevoTipo.trim();
    if (!tipo) {
      alert('Ingresa un nombre para el tipo de sanción.');
      return;
    }

    // evitar duplicados
    if (this.tiposSancion.some(t => t.toLowerCase() === tipo.toLowerCase())) {
      alert('Ese tipo de sanción ya existe.');
      return;
    }

    this.tiposSancion = [...this.tiposSancion, tipo];
    this.nuevoTipo = '';
    alert('Tipo de sanción registrado correctamente.');
  }

  // ======================================
  //  FORMULARIO: ASIGNAR SANCIÓN A USUARIO
  // ======================================
  asignarSancion(): void {
    if (!this.asignarUsuario.trim() ||
      !this.asignarTipo ||
      !this.asignarInicio ||
      !this.asignarFin) {
      alert('Completa todos los campos para asignar la sanción.');
      return;
    }

    const nuevoId = this.sanciones.length
      ? Math.max(...this.sanciones.map(s => s.id)) + 1
      : 1;

    const nueva: Sancion = {
      id: nuevoId,
      usuario: this.asignarUsuario.trim(),
      motivo: this.asignarTipo,
      fecha_inicio: this.asignarInicio,
      fecha_fin: this.asignarFin,
      estado: 'ACTIVA'
    };

    this.sanciones = [...this.sanciones, nueva];

    // limpiar formulario
    this.asignarUsuario = '';
    this.asignarTipo = this.tiposSancion[0] || '';
    this.asignarInicio = '';
    this.asignarFin = '';

    // cerrar formulario y mostrar detalle de la nueva
    this.formularioAsignar = false;
    this.sancionSeleccionada = nueva;
  }



  // ======================
  //  MODAL AMPLIAR SANCIÓN
  // ======================
  mostrarModalAmpliar = false;
  motivoAmpliacion = '';

  abrirModalAmpliar() {
    this.mostrarModalAmpliar = true;
  }

  cancelarAmpliacion() {
    this.mostrarModalAmpliar = false;
    this.motivoAmpliacion = '';
  }

  confirmarAmpliacion() {
    if (!this.motivoAmpliacion.trim()) {
      alert("Debes ingresar un motivo.");
      return;
    }

    if (!this.sancionSeleccionada) return;

    // ampliar 7 días
    const nuevaFecha = new Date(this.sancionSeleccionada.fecha_fin);
    nuevaFecha.setDate(nuevaFecha.getDate() + 7);
    this.sancionSeleccionada.fecha_fin = nuevaFecha.toISOString().slice(0, 10);

    alert("Sanción ampliada con motivo: " + this.motivoAmpliacion);

    this.mostrarModalAmpliar = false;
    this.motivoAmpliacion = '';
  }

}
