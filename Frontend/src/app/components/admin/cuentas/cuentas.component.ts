import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

interface Alumno {
  id: number;
  nombre: string;
  email: string;
  rut?: string;
  telefono?: string;
  carrera?: string;
  password?: string; // ✔️ agregado
}

@Component({
  selector: 'app-cuentas',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './cuentas.component.html',
  styleUrls: ['./cuentas.component.css']
})
export class CuentasComponent implements OnInit {

  alumnos: Alumno[] = [];
  alumnoSeleccionado: Alumno | null = null;

  filtro: string = '';
  editMode = false;

  // ✔️ Control de creación de cuentas
  creando = false;
  nuevoAlumno: Alumno = {
    id: 0,
    nombre: '',
    email: '',
    rut: '',
    telefono: '',
    password: ''
  };

  ngOnInit(): void {
    this.cargarAlumnos();
  }

  // Datos simulados
  cargarAlumnos() {
    this.alumnos = [
      {
        id: 1,
        nombre: "Andrea Navia",
        email: "andrea.navia@alumnos.uta.cl",
        rut: "20.123.456-7",
        telefono: "+56 9 1234 5678",
      },
      {
        id: 2,
        nombre: "Pablo Salinas",
        email: "pablo.salinas@alumnos.uta.cl",
        rut: "19.876.543-2",
        telefono: "+56 9 9876 5432",
      },
      {
        id: 3,
        nombre: "Kevin Lagos",
        email: "kevin.lagos@alumnos.uta.cl",
        rut: "21.333.111-4",
        telefono: "+56 9 4567 8901",
      }
    ];
  }

  // ✔️ Filtrar sin pipes
  get alumnosFiltrados() {
    if (!this.filtro.trim()) return this.alumnos;
    const f = this.filtro.toLowerCase();

    return this.alumnos.filter(a =>
      a.nombre.toLowerCase().includes(f) ||
      a.email.toLowerCase().includes(f)
    );
  }

  seleccionar(a: Alumno) {
    this.alumnoSeleccionado = { ...a };
    this.editMode = false;
    this.creando = false;
  }

  // ✔️ Comenzar creación
  comenzarCrear() {
    this.creando = true;
    this.alumnoSeleccionado = null;
    this.editMode = false;

    this.nuevoAlumno = {
      id: 0,
      nombre: '',
      email: '',
      rut: '',
      telefono: '',
      password: ''
    };
  }

  // ✔️ Guardar edición
  guardar() {
    alert("Cambios guardados (simulado)");
    this.editMode = false;
  }

  // ✔️ Crear cuenta
  crearCuenta() {
    if (!this.nuevoAlumno.nombre || !this.nuevoAlumno.email || !this.nuevoAlumno.password) {
      alert('Completa los campos obligatorios.');
      return;
    }

    this.nuevoAlumno.id = this.alumnos.length + 1;
    this.alumnos.push({ ...this.nuevoAlumno });

    alert('Cuenta creada correctamente ✔️');
    this.creando = false;
  }

  editar() {
    this.editMode = true;
  }
}
