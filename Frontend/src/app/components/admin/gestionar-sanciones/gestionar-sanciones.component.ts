import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
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
  descripcion?: string;
  fecha_inicio: string;
  fecha_fin: string;
  estado: 'ACTIVA' | 'EXPIRADA';  
  asignada_por?: string;
  asignada_en?: string;
}

interface PrefillData {
  prestamo: {
    idPrestamo: number;
    estado: string;
    fecha_inicio?: string;
    fecha_fin?: string;
    equipos?: { id: number; nombre: string; codigo?: string }[];
  };
  usuario: {
    idUser?: number;
    nombre?: string;
    apellido?: string;
    email?: string;
    rut?: string;
  };
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
    private sancionesService: SancionesService,
    private route: ActivatedRoute
    , private usuariosService: UsuariosService
  ) {}


  sanciones: Sancion[] = [];
  sancionSeleccionada: Sancion | null = null;
  filtro = '';
  // Autocomplete usuarios
  usuariosSugeridos: any[] = [];
  private buscarTimeout: any = null;


  tiposSancion: { id: number; nivel: string; descripcion?: string }[] = [];

  // Formularios
  formularioVisible = false;
  formularioAsignar = false;

  // Nuevo tipo
  nuevoTipo = '';

  // Asignación
  asignarUsuario = '';
  asignarTipo: number = 0;
  asignarInicio = '';
  asignarFin = '';
  asignarDescripcion = '';


  mostrarModalAmpliar = false;
  motivoAmpliacion = '';
  // Editar sanción
  editarSancionVisible = false;
  motivoEdicion = '';
  extender = false;
  extenderDias = 7; // por defecto mostrar 7 días

  prefillData: PrefillData | null = null;
  prefillLoading = false;
  prefillError: string | null = null;

  private notify = inject(NotificationService);


  ngOnInit(): void {
    this.cargarDatosReales();
    this.cargarCatalogo();

    this.route.queryParams.subscribe((params) => {
      const prestamoId = Number(params['prestamoId']);
      if (prestamoId) {
        this.precargarSancion(prestamoId);
      }
    });

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

  cargarCatalogo(): void {
    this.sancionesService.getCatalogo().subscribe({
      next: (resp) => {
        this.tiposSancion = resp.sanciones || [];
        this.asignarTipo = this.tiposSancion[0]?.id ?? 0;
      },
      error: () => {
        this.notify.error('No se pudo cargar el catálogo de sanciones.');
      }
    });
  }

  precargarSancion(prestamoId: number): void {
    this.prefillLoading = true;
    this.prefillError = null;
    this.prefillData = null;

    this.sancionesService.prefillSancion(prestamoId).subscribe({
      next: (data: any) => {
        const usuario = data?.usuario || {};
        const prestamo = data?.prestamo || {};

        this.asignarUsuario = usuario.email || usuario.rut || usuario.idUser || '';
        this.asignarInicio = prestamo.fecha_inicio || '';
        this.asignarFin = prestamo.fecha_fin || '';

        this.prefillData = { usuario, prestamo };

        this.formularioAsignar = true;
        this.formularioVisible = false;
        this.sancionSeleccionada = null;

        this.notify.success('Datos precargados para sanción.');
        this.prefillLoading = false;
      },
      error: () => {
        this.prefillLoading = false;
        this.prefillError = 'No se pudo precargar la sanción.';
        this.notify.error('No se pudo precargar la sanción.');
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
            descripcion: s.descripcion ?? '',
            fecha_inicio: s.fecha_inicio,
            fecha_fin: s.fecha_fin,
            estado: estadoUI,
            asignada_por: `${u?.pivot?.assigned_by_nombre ?? ''} ${u?.pivot?.assigned_by_apellido ?? ''}`.trim() || u?.pivot?.assigned_by_email || '—',
            asignada_en: u?.pivot?.created_at ?? ''
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
      // Resetear campos del formulario
      this.resetFormularioAsignar();
    }
  }

  resetFormularioAsignar(): void {
    this.asignarUsuario = '';
    this.asignarTipo = this.tiposSancion[0]?.id ?? 0;
    this.asignarInicio = '';
    this.asignarFin = '';
    this.asignarDescripcion = '';
    this.prefillData = null;
    this.prefillError = null;
    this.usuariosSugeridos = [];
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
    this.notify.info('El catálogo de sanciones se administra desde el backend.');
  }


asignarSancion(): void {
  // Validaciones específicas para cada campo
  if (!this.asignarUsuario || !this.asignarUsuario.trim()) {
    this.notify.warning('Debes ingresar un usuario (correo, RUT o ID).');
    return;
  }

  if (!this.asignarTipo || this.asignarTipo <= 0) {
    this.notify.warning('Selecciona un tipo de sanción válido.');
    return;
  }

  if (!this.asignarInicio) {
    this.notify.warning('Debes seleccionar una fecha de inicio.');
    return;
  }

  if (!this.asignarFin) {
    this.notify.warning('Debes seleccionar una fecha de fin.');
    return;
  }

  const payload = {
    usuario: this.asignarUsuario.trim(), // id, correo o rut
      idSancion: this.asignarTipo,
    descripcion: this.asignarDescripcion?.trim() || null,
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
