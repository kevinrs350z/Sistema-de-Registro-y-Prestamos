import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { AsignaturasService } from '../../../services/asignaturas.service';

@Component({
  selector: 'app-gestionar-asignaturas',
  standalone: true,
  imports: [CommonModule, FormsModule],
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
              RESERVAS SIMULADAS
  ======================================= */
  reservas: any[] = [
    {
      id: 1,
      tipo: 'asignatura',
      asignatura_id: 1,
      profesor: 'Marcelo Ortega',
      ubicacion: 'Sala A-203',
      bloques: ['08:00 – 09:30'],
      equipos: [],
      observacion: '',
      asignaturaNombre: 'Diseño Multimedia I',
      eventoNombre: null
    }
  ];

  reservaSeleccionada: any = null;
  mostrarFormulario = false;

  /* ======================================
              FORMULARIO PRINCIPAL
  ======================================= */
  form: any = {
    tipo: 'asignatura',
    asignatura_id: '',
    evento_nombre: '',
    profesor: '',
    ubicacion: '', // 👈 NUEVO
    bloques: [] as string[],
    equipos: [] as any[],
    observacion: ''
  };

  /* ======================================
               CAMPOS TEMPORALES
  ======================================= */
  equipoSeleccionado: any = null;
  cantidadSeleccionada: number = 1;

  /* ======================================
              BLOQUES HORARIOS
  ======================================= */
  bloques = [
    { nombre: 'Bloque 1', texto: '08:00 – 09:30' },
    { nombre: 'Bloque 2', texto: '09:40 – 11:10' },
    { nombre: 'Bloque 3', texto: '11:20 – 12:50' },
    { nombre: 'Bloque 4', texto: '12:50 – 14:40' },
    { nombre: 'Bloque 5', texto: '14:45 – 16:10' },
    { nombre: 'Bloque 6', texto: '16:20 – 17:50' },
    { nombre: 'Bloque 7', texto: '17:55 – 19:30' },
    { nombre: 'Bloque 8', texto: '19:40 – 21:10' }
  ];

  /* ======================================
              REGEX
  ======================================= */
  private soloLetrasRegex = /^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]+$/;

  constructor(private asignaturasService: AsignaturasService) {}

  ngOnInit(): void {
    this.cargarDatos();
  }

  /* ======================================
              CARGAR DATOS
  ======================================= */
  cargarDatos() {
    this.asignaturasService.getEquipos()
      .subscribe((r: any) => this.equipos = r);

    this.asignaturasService.getAsignaturas()
      .subscribe((r: any) => this.asignaturas = r);
  }

  /* ======================================
              NUEVA RESERVA
  ======================================= */
  nuevaReserva() {
    this.mostrarFormulario = true;
    this.reservaSeleccionada = null;

    this.form = {
      tipo: 'asignatura',
      asignatura_id: '',
      evento_nombre: '',
      profesor: '',
      ubicacion: '',
      bloques: [],
      equipos: [],
      observacion: ''
    };

    this.equipoSeleccionado = null;
    this.cantidadSeleccionada = 1;
  }

  /* ======================================
              SELECCIONAR RESERVA
  ======================================= */
  seleccionar(reserva: any) {
    this.reservaSeleccionada = reserva;
    this.mostrarFormulario = false;
  }

  /* ======================================
              BLOQUES
  ======================================= */
  toggleBloque(b: any) {
    const idx = this.form.bloques.indexOf(b.texto);
    if (idx >= 0) this.form.bloques.splice(idx, 1);
    else this.form.bloques.push(b.texto);
  }

  /* ======================================
              AGREGAR EQUIPOS
  ======================================= */
  agregarEquipo() {
    if (!this.equipoSeleccionado || this.cantidadSeleccionada < 1) return;

    const eq = this.equipoSeleccionado;
    const idEquipo = eq.idEquipo ?? eq.id;

    if (!idEquipo) return;

    const existente = this.form.equipos.find((e: any) => e.id === idEquipo);

    if (existente) {
      existente.cantidad += this.cantidadSeleccionada;
    } else {
      this.form.equipos.push({
        id: idEquipo,
        nombre: eq.nombre,
        cantidad: this.cantidadSeleccionada
      });
    }

    this.equipoSeleccionado = null;
    this.cantidadSeleccionada = 1;
  }

  eliminarEquipo(i: number) {
    this.form.equipos.splice(i, 1);
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
    if (this.form.tipo === 'asignatura') {
      return this.asignaturas.find(a => a.id == this.form.asignatura_id)?.nombre || '—';
    }

    if (this.form.tipo === 'evento') {
      return this.form.evento_nombre.trim() || '—';
    }

    return '—';
  }

  /* ======================================
              GUARDAR RESERVA
  ======================================= */
  guardar() {

    if (!this.form.profesor || !this.soloLetras(this.form.profesor)) {
      alert('El nombre del profesor solo debe contener letras');
      return;
    }

    if (!this.form.ubicacion || this.form.ubicacion.trim() === '') {
      alert('Debe indicar una ubicación');
      return;
    }

    const nueva = {
      ...this.form,
      id: this.reservas.length + 1,

      asignaturaNombre:
        this.form.tipo === 'asignatura'
          ? this.asignaturas.find(a => a.id == this.form.asignatura_id)?.nombre
          : null,

      eventoNombre:
        this.form.tipo === 'evento'
          ? (this.form.evento_nombre.trim() || null)
          : null
    };

    this.reservas.push(nueva);
    alert('Reserva creada con éxito.');
    this.mostrarFormulario = false;
  }

  /* ======================================
              CANCELAR RESERVA
  ======================================= */
  cancelarReserva() {
    if (!this.reservaSeleccionada) return;

    const id = this.reservaSeleccionada.id;
    this.reservas = this.reservas.filter(r => r.id !== id);
    this.reservaSeleccionada = null;

    alert('La reserva ha sido cancelada correctamente.');
  }
}
