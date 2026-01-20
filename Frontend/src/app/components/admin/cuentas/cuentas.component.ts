import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { UsuariosService } from '../../../services/usuarios.service';
import { NotificationService } from '../../../services/notification.service';

interface Alumno {
  id: number;
  nombre: string;
  estado?: string;
  apellido1?: string;
  apellido2?: string;
  email: string;
  rut?: string;
  telefono?: string;
  celular?: string;
  password?: string;
  confirmPassword?: string;
  rol?: string;
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

  filtro = '';
  filtroEstado: 'todos' | 'ACTIVO' | 'INACTIVO' = 'todos';
  editMode = false;
  creando = false;

  nuevoAlumno: Alumno = this.resetNuevoAlumno();

  currentPage = 1;
  lastPage = 1;

  // ✅ Regex PÚBLICAS porque el HTML las usa
  public soloLetrasRegex = /^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]+$/;
  public emailValidoRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  // ✅ RUT: números + puntos + guion
  public rutRegex = /^[0-9.\-]+$/;

  // ✅ Teléfono: números + espacios (ej: "569 23859228")
  public telefonoRegex = /^[0-9\s]+$/;

  private notify = inject(NotificationService);

  constructor(private usuariosService: UsuariosService) {}

  ngOnInit(): void {
    this.cargarAlumnos();
  }

  /* =========================
     CARGA Y PAGINACIÓN
  ========================= */
  cargarAlumnos(page: number = 1) {
    const estado = this.filtroEstado === 'todos' ? undefined : this.filtroEstado;
    this.usuariosService.obtenerUsuariosPorEstado(page, estado).subscribe({
      next: (res: any) => {
        this.alumnos = res.data;
        this.currentPage = res.current_page;
        this.lastPage = res.last_page;
      },
      error: err => console.error('Error cargando alumnos:', err)
    });
  }

  paginaSiguiente() {
    if (this.currentPage < this.lastPage) {
      this.cargarAlumnos(++this.currentPage);
    }
  }

  paginaAnterior() {
    if (this.currentPage > 1) {
      this.cargarAlumnos(--this.currentPage);
    }
  }

  get alumnosFiltrados() {
    if (!this.filtro.trim()) return this.alumnos;
    const f = this.filtro.toLowerCase();
    return this.alumnos.filter(a =>
      (a.nombre || '').toLowerCase().includes(f) ||
      (a.email || '').toLowerCase().includes(f)
    );
  }

  reactivarCuenta() {
    const a = this.alumnoSeleccionado;
    if (!a?.id) return;

    const ok = confirm(`¿Reactivar la cuenta de ${a.nombre} (${a.email})?`);
    if (!ok) return;

    this.usuariosService.reactivarUsuario(a.id).subscribe({
      next: () => {
        this.notify.success('Cuenta reactivada correctamente.');
        this.alumnoSeleccionado = null;
        this.cargarAlumnos(this.currentPage);
      },
      error: err => {
        console.error(err);
        this.notify.error('Ocurrió un error al reactivar la cuenta.');
      }
    });
  }

  /* =========================
     SELECCIÓN / MODOS
  ========================= */
  seleccionar(a: Alumno) {
    // ⚠️ No existe password real desde backend (por seguridad)
    // pero para UX: mostramos ******** cuando no se edita
    // y dejamos input editable vacío cuando se edita.
    this.alumnoSeleccionado = { ...a, password: '' };
    this.editMode = false;
    this.creando = false;
  }

  comenzarCrear() {
    this.creando = true;
    this.editMode = false;
    this.alumnoSeleccionado = null;
    this.nuevoAlumno = this.resetNuevoAlumno();
  }

  editar() {
    this.editMode = true;
    // dejamos password vacío para que si no escribe, no se envía
    if (this.alumnoSeleccionado) {
      this.alumnoSeleccionado.password = '';
    }
  }

  /* =========================
     VALIDADORES PARA HTML
  ========================= */
  soloLetras(valor?: string): boolean {
    if (!valor) return true;
    return this.soloLetrasRegex.test(valor);
  }

  emailValido(valor?: string): boolean {
    if (!valor) return true;
    return this.emailValidoRegex.test(valor);
  }

  rutValido(valor?: string): boolean {
    if (!valor) return true;
    return this.rutRegex.test(valor);
  }

  telefonoValido(valor?: string): boolean {
    if (!valor) return true;
    return this.telefonoRegex.test(valor);
  }

  /* =========================
     VALIDACIONES DE ENVÍO
  ========================= */
  esEdicionValida(): boolean {
    const a = this.alumnoSeleccionado;
    if (!a) return false;

    if (!this.soloLetras(a.nombre)) return false;
    if (!this.soloLetras(a.apellido1 || '')) return false;
    if (a.apellido2 && !this.soloLetras(a.apellido2)) return false;

    if (!this.emailValido(a.email)) return false;
    if (a.rut && !this.rutValido(a.rut)) return false;

    if (a.telefono && !this.telefonoValido(a.telefono)) return false;

    // password solo si se escribe
    if (a.password && a.password.length < 6) return false;

    return true;
  }

  esCreacionValida(): boolean {
    const n = this.nuevoAlumno;

    if (!this.soloLetras(n.nombre)) return false;
    if (!this.soloLetras(n.apellido1 || '')) return false;
    if (n.apellido2 && !this.soloLetras(n.apellido2)) return false;

    if (!this.emailValido(n.email)) return false;
    if (n.rut && !this.rutValido(n.rut)) return false;

    if (n.telefono && !this.telefonoValido(n.telefono)) return false;

    if (!n.password || n.password.length < 6) return false;
    if (n.password !== n.confirmPassword) return false;

    return true;
  }

  /* =========================
     GUARDAR EDICIÓN
  ========================= */
  guardar() {
    if (!this.alumnoSeleccionado) return;

    if (!this.esEdicionValida()) {
      this.notify.warning('Corrige los errores del formulario antes de guardar.');
      return;
    }

    const a = this.alumnoSeleccionado;

    const payload: any = {
      nombre: a.nombre,
      apellido1: a.apellido1,
      apellido2: a.apellido2,
      rut: a.rut,
      email: a.email,
      telefono: a.telefono,
      celular: a.celular,
      rol: a.rol
    };

    // ✅ Solo enviar password si el usuario escribió algo
    if (a.password && a.password.trim().length > 0) {
      payload.password = a.password.trim();
    }

    this.usuariosService.actualizarUsuario(a.id, payload).subscribe({
      next: () => {
        this.notify.success('Usuario actualizado correctamente.');
        this.editMode = false;
        this.cargarAlumnos(this.currentPage);
      },
      error: err => {
        console.error(err);
        this.notify.error('Ocurrió un error al actualizar el usuario.');
      }
    });
  }

  /* =========================
     ELIMINAR CUENTA
  ========================= */
  eliminarCuenta() {
    const a = this.alumnoSeleccionado;
    if (!a?.id) return;

    const ok = confirm(`¿Desactivar la cuenta de ${a.nombre} (${a.email})?`);
    if (!ok) return;

    this.usuariosService.eliminarUsuario(a.id).subscribe({
      next: () => {
        this.notify.success('Cuenta desactivada correctamente.');
        this.alumnoSeleccionado = null;
        this.editMode = false;
        this.creando = false;
        this.cargarAlumnos(this.currentPage);
      },
      error: err => {
        console.error(err);
        this.notify.error('Ocurrió un error al desactivar la cuenta.');
      }
    });
  }

  /* =========================
     CREAR CUENTA
  ========================= */
  crearCuenta() {
    if (!this.esCreacionValida()) {
      this.notify.warning('Revisa los datos ingresados antes de crear la cuenta.');
      return;
    }

    const n = this.nuevoAlumno;

    const payload: any = {
      nombre: n.nombre,
      apellido1: n.apellido1,
      apellido2: n.apellido2,
      rut: n.rut,
      email: n.email,
      telefono: n.telefono,
      password: n.password,
      // Backend acepta admin/alumno o ADMIN/ALUMNO; enviamos normalizado para evitar fallos
      rol: (n.rol ?? '').toString().toUpperCase()
    };

    this.usuariosService.crearUsuario(payload).subscribe({
      next: () => {
        this.notify.success('Cuenta creada correctamente.');
        this.creando = false;
        this.cargarAlumnos();
      },
      error: err => {
        console.error(err);
        this.notify.error('Ocurrió un error al crear la cuenta.');
      }
    });
  }

  /* =========================
     HELPERS
  ========================= */
  private resetNuevoAlumno(): Alumno {
    return {
      id: 0,
      nombre: '',
      apellido1: '',
      apellido2: '',
      email: '',
      rut: '',
      telefono: '',
      celular: '',
      password: '',
      confirmPassword: '',
      // Debe calzar con el backend y la tabla de roles (ADMIN/ALUMNO)
      rol: 'ALUMNO'
    };
  }
}
