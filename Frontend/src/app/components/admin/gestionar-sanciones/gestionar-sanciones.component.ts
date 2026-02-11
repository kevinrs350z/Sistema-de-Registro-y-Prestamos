import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { NavbarAdminComponent } from '../navbar-admin/navbar-admin.component';
import { SancionesService } from '../../../services/sanciones.service';
import { NotificationService } from '../../../services/notification.service';
import { UsuariosService } from '../../../services/usuarios.service';
import * as XLSX from 'xlsx';

interface Sancion {
  id: number;
  key: string;

 
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
  cargandoSanciones = false;
  errorSanciones: string | null = null;
  page = 1;
  pageSize = 8;
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
        const nivelesPermitidos = ['LEVE', 'MEDIA', 'GRAVE'];
        const catalogo = (resp.sanciones || [])
          .filter((s: any) => nivelesPermitidos.includes(String(s.nivel || '').toUpperCase()))
          .reduce((acc: any[], s: any) => {
            const nivel = String(s.nivel || '').toUpperCase();
            if (!acc.some((x) => String(x.nivel || '').toUpperCase() === nivel)) {
              acc.push({
                id: s.id ?? s.idSancion,
                nivel: s.nivel,
                descripcion: s.descripcion
              });
            }
            return acc;
          }, [])
          .sort((a: any, b: any) =>
            nivelesPermitidos.indexOf(String(a.nivel || '').toUpperCase()) -
            nivelesPermitidos.indexOf(String(b.nivel || '').toUpperCase())
          );

        this.tiposSancion = catalogo;
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
        this.asignarDescripcion = '';

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
    this.cargandoSanciones = true;
    this.errorSanciones = null;
    this.sancionesService.getSanciones().subscribe({
      next: (resp) => {
        const lista = (resp.sanciones || []).flatMap((s: any) => {
          const usuarios = Array.isArray(s.users) ? s.users : [];

          return usuarios.map((u: any) => {
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
              key: `${s.idSancion}-${u?.idUser ?? u?.id ?? 'user'}`,
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
        });

        this.sanciones = lista;
        this.sancionSeleccionada = this.sanciones[0] || null;
        this.page = 1;
        this.cargandoSanciones = false;
    },
    error: (err) => {
      console.error('Error cargando sanciones', err);
      this.errorSanciones = 'No se pudieron cargar las sanciones.';
      this.cargandoSanciones = false;
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

  get totalPaginas(): number {
    return Math.max(1, Math.ceil(this.sancionesFiltradas.length / this.pageSize));
  }

  get sancionesPaginadas(): Sancion[] {
    const start = (this.page - 1) * this.pageSize;
    return this.sancionesFiltradas.slice(start, start + this.pageSize);
  }

  cambiarPagina(delta: number): void {
    const next = this.page + delta;
    if (next < 1 || next > this.totalPaginas) return;
    this.page = next;
  }

  onFiltroChange(): void {
    this.page = 1;
  }

  exportarCsv(): void {
    const filas = this.buildExportRows();
    if (filas.length === 0) {
      this.notify.warning('No hay datos para exportar.');
      return;
    }

    const headers = Object.keys(filas[0]);
    const csv = [
      headers.join(','),
      ...filas.map((row) => headers.map((h) => this.csvEscape(row[h as keyof typeof row])).join(','))
    ].join('\n');

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `sanciones_${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
    window.URL.revokeObjectURL(url);
  }

  exportarExcel(): void {
    const filas = this.buildExportRows();
    if (filas.length === 0) {
      this.notify.warning('No hay datos para exportar.');
      return;
    }

    const worksheet = XLSX.utils.json_to_sheet(filas);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Sanciones');
    XLSX.writeFile(workbook, `sanciones_${new Date().toISOString().slice(0, 10)}.xlsx`);
  }

  private buildExportRows(): Array<Record<string, string>> {
    return this.sancionesFiltradas.map((s) => ({
      usuario: s.usuario,
      correo: s.correo,
      rut: s.rut,
      motivo: s.motivo,
      descripcion: s.descripcion || '',
      fecha_inicio: s.fecha_inicio,
      fecha_fin: s.fecha_fin,
      estado: s.estado,
      asignada_por: s.asignada_por || '',
      asignada_en: s.asignada_en || ''
    }));
  }

  private csvEscape(value: string): string {
    const v = value ?? '';
    const needsQuotes = /[",\n]/.test(v);
    const escaped = v.replace(/"/g, '""');
    return needsQuotes ? `"${escaped}"` : escaped;
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
    } else {
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

  const inicio = new Date(this.asignarInicio);
  const fin = new Date(this.asignarFin);
  if (inicio > fin) {
    this.notify.warning('La fecha de fin no puede ser menor que la fecha de inicio.');
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
      this.formularioAsignar = false;
      this.filtro = '';
      this.page = 1;
      this.resetFormularioAsignar();
      this.cargarDatosReales();
    },
    error: (err) => {
      console.error(err);
        this.notify.error(err?.error?.error || err?.error?.message || 'Ocurrió un error al asignar la sanción.');
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
