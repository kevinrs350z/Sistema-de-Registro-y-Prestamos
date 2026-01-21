import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { NavbarAdminComponent } from '../navbar-admin/navbar-admin.component';
import { SancionesService } from '../../../services/sanciones.service';
import { NotificationService } from '../../../services/notification.service';
import { UsuariosService } from '../../../services/usuarios.service';

interface Sancion {
  id: number;

 
  usuario: string;  
  correo: string;
  rut: string;
  nombre: string;
  apellido: string;

  motivo: string;
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

  constructor(
    private router: Router,
    private sancionesService: SancionesService
    , private usuariosService: UsuariosService
  ) {}


  sanciones: Sancion[] = [];
  sancionSeleccionada: Sancion | null = null;
  filtro = '';
  // Autocomplete usuarios
  usuariosSugeridos: any[] = [];
  private buscarTimeout: any = null;


  tiposSancion: string[] = [
    'Atraso en devolución',
    'Daño en equipo',
    'Uso indebido de sala',
    'Consumo de alimentos en laboratorio',
    'Uso prolongado de equipo sin reserva'
  ];

  // Formularios
  formularioVisible = false;
  formularioAsignar = false;

  // Nuevo tipo
  nuevoTipo = '';

  // Asignación
  asignarUsuario = '';
  asignarTipo = '';
  asignarInicio = '';
  asignarFin = '';


  mostrarModalAmpliar = false;
  motivoAmpliacion = '';
  // Editar sanción
  editarSancionVisible = false;
  motivoEdicion = '';
  extender = false;
  extenderDias = 7; // por defecto mostrar 7 días

  private notify = inject(NotificationService);


  ngOnInit(): void {
    this.cargarDatosReales();
    this.asignarTipo = this.tiposSancion[0] || '';

    // Listener navbar admin
    window.addEventListener('admin-navegacion', (e: any) => {
      const destino = e.detail;

      if (destino === 'gestionar') {
        this.router.navigate(['/admin/dashboard']);
      }
      if (destino === 'solicitudes') {
        this.router.navigate(['/admin/solicitudes']);
      }
      if (destino === 'finalizadas') {
        this.router.navigate(['/admin/solicitudes-finalizadas']);
      }
      if (destino === 'inventario') {
        this.router.navigate(['/admin/dashboard']);
      }
      if (destino === 'cuentas') {
        this.router.navigate(['/admin/dashboard']);
      }
    });
  }


  cargarDatosReales(): void {
    this.sancionesService.getSanciones().subscribe({
      next: (resp) => {
        this.sanciones = resp.sanciones.map((s: any) => {
          const u = s.users?.[0]; // primer usuario asociado
          const persona = u?.persona;

          const estadoUI: 'ACTIVA' | 'EXPIRADA' =
            s.estado === 'ACTIVA' ? 'ACTIVA' : 'EXPIRADA';


          const nombre = persona?.Nombre ?? persona?.nombre ?? '';
          const apellido =
            persona?.Apellido1 ??
            persona?.apellido1 ??
            persona?.Apellido2 ??
            persona?.apellido2 ??
            '';

          return {
            id: s.idSancion,
            usuario: `${nombre} ${apellido}`.trim() || u?.Email || 'Sin usuario',
            correo: u?.Email ?? '',
            rut: persona?.Rut ?? '',
            nombre,
            apellido,
            motivo: s.nivel,
            fecha_inicio: s.fecha_inicio,
            fecha_fin: s.fecha_fin,
            estado: estadoUI
          } as Sancion;
        });

      this.sancionSeleccionada = this.sanciones[0] || null;
    },
    error: (err) => {
      console.error('Error cargando sanciones', err);
    }
  });
}



  get sancionesFiltradas(): Sancion[] {
    const f = this.filtro.toLowerCase();
    if (!f) return this.sanciones;
    return this.sanciones.filter(s =>
      s.usuario.toLowerCase().includes(f) ||
      s.motivo.toLowerCase().includes(f)
    );
  }

 
  seleccionar(s: Sancion): void {
    this.sancionSeleccionada = s;
    this.formularioVisible = false;
    this.formularioAsignar = false;
  }

  // ===== Autocomplete para asignar sanción =====
  onAsignarUsuarioInput(term: string) {
    this.asignarUsuario = term;

    if (this.buscarTimeout) clearTimeout(this.buscarTimeout);

    const q = term.trim();
    if (!q) {
      this.usuariosSugeridos = [];
      return;
    }

    // debounce 300ms
    this.buscarTimeout = setTimeout(() => {
      this.usuariosService.buscarUsuarios(q, 1).subscribe({
        next: (res: any) => {
          // buscamos en res.data
          this.usuariosSugeridos = (res.data || []).slice(0, 8).map((u: any) => ({
            id: u.id,
            nombre: `${u.nombre} ${u.apellido1 || ''} ${u.apellido2 || ''}`.trim(),
            email: u.email,
            rut: u.rut
          }));
        },
        error: (err: any) => {
          console.error('Error buscando usuarios:', err);
          this.usuariosSugeridos = [];
        }
      });
    }, 300);
  }

  seleccionarSugerido(u: any) {
    // seleccionamos por email para que backend lo encuentre fácilmente
    this.asignarUsuario = u.email || u.rut || u.id;
    this.usuariosSugeridos = [];
  }


  toggleRegistrar(): void {
    this.formularioVisible = !this.formularioVisible;
    if (this.formularioVisible) {
      this.formularioAsignar = false;
      this.sancionSeleccionada = null;
    }
  }

  cancelarRegistrar(): void {
    this.formularioVisible = false;
    this.nuevoTipo = '';
  }

  toggleAsignar(): void {
    this.formularioAsignar = !this.formularioAsignar;
    if (this.formularioAsignar) {
      this.formularioVisible = false;
      this.sancionSeleccionada = null;
    }
  }


  abrirModalAmpliar() {
    this.mostrarModalAmpliar = true;
  }

  cancelarAmpliacion() {
    this.mostrarModalAmpliar = false;
    this.motivoAmpliacion = '';
  }

confirmarAmpliacion() {
  if (!this.motivoAmpliacion.trim()) {
    this.notify.warning('Debes ingresar un motivo para ampliar la sanción.');
    return;
  }

  if (!this.sancionSeleccionada) return;

  this.sancionesService
    .ampliarSancion(this.sancionSeleccionada.id, this.motivoAmpliacion.trim())
    .subscribe({
      next: () => {
        this.notify.success('Sanción ampliada correctamente.');
        this.mostrarModalAmpliar = false;
        this.motivoAmpliacion = '';
        this.cargarDatosReales();
      },
      error: (err) => {
        console.error(err);
        this.notify.error('Ocurrió un error al ampliar la sanción.');
      }
    });
}

  // ====== EDITAR SANCIÓN ======
  toggleEditarSancion() {
    if (!this.sancionSeleccionada) return;
    this.editarSancionVisible = !this.editarSancionVisible;
    this.motivoEdicion = '';
    this.extender = false;
    this.extenderDias = 7;
  }

  guardarEdicion() {
    if (!this.sancionSeleccionada) return;

    // Si el admin eligió extender, usamos el endpoint existente 'ampliarSancion'
    if (this.extender) {
      if (!this.motivoEdicion.trim()) {
        this.notify.warning('Debes ingresar un motivo para la extensión.');
        return;
      }

      // Nota: la API actual solo recibe 'motivo' y determina la extensión.
      this.sancionesService.ampliarSancion(this.sancionSeleccionada.id, this.motivoEdicion.trim())
        .subscribe({
          next: () => {
            this.notify.success('Sanción extendida correctamente.');
            this.editarSancionVisible = false;
            this.motivoEdicion = '';
            this.extender = false;
            this.cargarDatosReales();
          },
          error: (err) => {
            console.error(err);
            this.notify.error('Ocurrió un error al extender la sanción.');
          }
        });
    } else {
      this.notify.info('No se aplicaron cambios. Marca "Extender" para ampliar la sanción.');
      this.editarSancionVisible = false;
    }
  }


 
  registrarTipo(): void {
    const tipo = this.nuevoTipo.trim();

    if (!tipo) {
      this.notify.warning('Ingresa un nombre para el tipo de sanción.');
      return;
    }

    if (this.tiposSancion.some(t => t.toLowerCase() === tipo.toLowerCase())) {
      this.notify.info('Ese tipo de sanción ya existe.');
      return;
    }

    this.tiposSancion.push(tipo);
    this.nuevoTipo = '';
    this.notify.success('Tipo de sanción registrado correctamente.');
  }


asignarSancion(): void {
  if (!this.asignarUsuario.trim() ||
      !this.asignarTipo ||
      !this.asignarInicio ||
      !this.asignarFin) {
    this.notify.warning('Completa todos los campos para asignar la sanción.');
    return;
  }

  const payload = {
    usuario: this.asignarUsuario.trim(), // id, correo o rut
    nivel: this.asignarTipo,
    fecha_inicio: this.asignarInicio,
    fecha_fin: this.asignarFin,
  };

  this.sancionesService.asignarSancion(payload).subscribe({
    next: () => {
      this.notify.success('Sanción asignada correctamente.');
      this.cargarDatosReales();
      this.formularioAsignar = false;
    },
    error: (err) => {
      console.error(err);
      this.notify.error('Ocurrió un error al asignar la sanción.');
    }
  });
}



quitarSancion(): void {
  if (!this.sancionSeleccionada) return;

  const confirmar = confirm('¿Estás seguro de quitar la sanción?');
  if (!confirmar) return;

  const motivo = prompt('Motivo (opcional) para quitar la sanción:') || undefined;

  this.sancionesService.quitarSancion(this.sancionSeleccionada.id, motivo).subscribe({
    next: () => {
      this.notify.success('Sanción quitada correctamente.');
      this.sancionSeleccionada = null;
      this.cargarDatosReales();
    },
    error: (err) => {
      console.error(err);
      this.notify.error('Ocurrió un error al quitar la sanción.');
    }
  });
}


}
