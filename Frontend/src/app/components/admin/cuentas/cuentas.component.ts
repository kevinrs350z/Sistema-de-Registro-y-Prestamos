import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { UsuariosService } from '../../../services/usuarios.service';

interface Alumno {
  id: number;
  nombre: string;
  apellido1?: string;
  apellido2?: string;
  email: string;
  rut?: string;
  telefono?: string;
  celular: string;
  carrera?: string;
  password?: string;
  rol?: string;
}
interface UsuarioResponse {
  data: any[];
  current_page: number;
  last_page: number;
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

  
  creando = false;
  nuevoAlumno: Alumno = {
    id: 0,
    nombre: '',
    apellido1: '',
    apellido2: '',
    email: '',
    rut: '',
    telefono: '',
    celular: '',
    password: '',
    rol: 'Alumno'
  };

  currentPage = 1;
  lastPage = 1;
  constructor(private usuariosService: UsuariosService) {}

  ngOnInit(): void {
    this.cargarAlumnos();
  }

  
  cargarAlumnos(page: number = 1) {
    this.usuariosService.obtenerUsuarios(page).subscribe({
      next: (res) => {
        this.alumnos = res.data;
        this.currentPage = res.current_page;
        this.lastPage = res.last_page;
      },
      error: (err) => console.error('Error cargando alumnos:', err)
    });
  }

  paginaSiguiente() {
    if (this.currentPage < this.lastPage) {
      this.currentPage++;
      this.cargarAlumnos(this.currentPage);
    }
  }
  paginaAnterior() {
    if (this.currentPage > 1) {
      this.currentPage--;
      this.cargarAlumnos(this.currentPage);
    }
  }


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
    apellido1: '',
    apellido2: '',
    email: '',
    rut: '',
    telefono: '',
    celular: '',
    password: '',
    rol: 'Alumno'
  };


  }
  // ✔️ Guardar edición
  guardar() {
    if (!this.alumnoSeleccionado) return;

    const id = this.alumnoSeleccionado.id;

    const payload = {
      nombre: this.alumnoSeleccionado.nombre,
      apellido1: this.alumnoSeleccionado.apellido1,  
      apellido2: this.alumnoSeleccionado.apellido2,
      rut: this.alumnoSeleccionado.rut,
      email: this.alumnoSeleccionado.email,
      telefono: this.alumnoSeleccionado.telefono,
      celular: this.alumnoSeleccionado.celular,
      password: null,
      rol: this.alumnoSeleccionado.rol  
    };

  this.usuariosService.actualizarUsuario(id, payload)
    .subscribe({
      next: (res) => {
        alert("Usuario actualizado correctamente ✔");
        this.editMode = false;
        this.cargarAlumnos(this.currentPage);
      },
    error: (err) => {
      console.error("Error al actualizar usuario", err);
      console.table(err.error.errors);   // 👈 MUY IMPORTANTE
      alert("Error al actualizar usuario (422). Revisa consola.");
    }

    });
}


  // ✔️ Crear cuenta
  crearCuenta() {
    if (!this.nuevoAlumno.nombre || !this.nuevoAlumno.email || !this.nuevoAlumno.password) {
      alert('Completa los campos obligatorios.');
      return;
    }

    const payload = {
      nombre: this.nuevoAlumno.nombre,
      apellido1: "Default",       
      apellido2: "",
      rut: this.nuevoAlumno.rut,
      email: this.nuevoAlumno.email,
      telefono: this.nuevoAlumno.telefono,
      password: this.nuevoAlumno.password,
      rol: "alumno"             
    };

    this.usuariosService.crearUsuario(payload).subscribe({
      next: (res) => {
        alert('Cuenta creada correctamente ✔️');
        this.creando = false;
        this.cargarAlumnos(); // recargar tabla
      },
      error: (err) => {
        console.error(err);
        alert("Error al crear usuario");
      }
    });
  }
  editar() {
    this.editMode = true;
  }
}
