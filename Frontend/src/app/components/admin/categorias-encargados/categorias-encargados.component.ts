import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { CategoriaService } from '../../../services/categoria.service';
import { AdminUsersService, AdminUser } from '../../../services/admin-users.service';
import { NotificationService } from '../../../services/notification.service';
import { ConfiguracionService, Configuracion } from '../../../services/configuracion.service';
import { Categoria, Encargado } from '../../../models/categoria.model';

interface IconOption {
  name: string;
  label: string;
}

@Component({
  selector: 'app-categorias-encargados',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './categorias-encargados.component.html',
  styleUrls: ['./categorias-encargados.component.css']
})
export class CategoriasEncargadosComponent implements OnInit {
  categorias: Categoria[] = [];
  categoriaSeleccionada: Categoria | null = null;
  encargados: Encargado[] = [];

  cargando = false;
  guardando = false;
  error: string | null = null;

  modoEdicion = false;

  form = {
    nombre: '',
    descripcion: '',
    icono: '',
    activo: true
  };

  iconPickerOpen = false;
  iconSearch = '';

  iconOptions: IconOption[] = [
    { name: 'bi-camera', label: 'Camara' },
    { name: 'bi-camera-video', label: 'Video' },
    { name: 'bi-laptop', label: 'Laptop' },
    { name: 'bi-lightbulb', label: 'Luz' },
    { name: 'bi-mic', label: 'Microfono' },
    { name: 'bi-robot', label: 'Robot' },
    { name: 'bi-cpu', label: 'CPU' },
    { name: 'bi-speaker', label: 'Audio' },
    { name: 'bi-display', label: 'Pantalla' },
    { name: 'bi-tools', label: 'Herramientas' },
    { name: 'bi-headphones', label: 'Audifonos' },
    { name: 'bi-battery-charging', label: 'Energia' },
    { name: 'bi-gear', label: 'Accesorios' },
    { name: 'bi-magic', label: 'Creativo' },
    { name: 'bi-journal-text', label: 'Documentos' },
    { name: 'bi-pc-display', label: 'Monitor' },
    { name: 'bi-tablet', label: 'Tablet' },
    { name: 'bi-phone', label: 'Telefono' },
    { name: 'bi-projector', label: 'Proyector' },
    { name: 'bi-cassette', label: 'Audio retro' },
    { name: 'bi-play-btn', label: 'Reproduccion' },
    { name: 'bi-vinyl', label: 'Musica' },
    { name: 'bi-brush', label: 'Diseno' },
    { name: 'bi-image', label: 'Fotografia' },
    { name: 'bi-bounding-box', label: 'Modelado' },
    { name: 'bi-palette', label: 'Color' },
    { name: 'bi-scissors', label: 'Edicion' },
    { name: 'bi-easel2', label: 'Arte' },
    { name: 'bi-hdd-stack', label: 'Storage' },
    { name: 'bi-usb-drive', label: 'USB' },
    { name: 'bi-printer', label: 'Impresion' },
    { name: 'bi-wifi', label: 'Conexion' },
    { name: 'bi-broadcast', label: 'Streaming' },
    { name: 'bi-camera-reels', label: 'Filmacion' },
    { name: 'bi-controller', label: 'Gaming' },
    { name: 'bi-joystick', label: 'Control' },
    { name: 'bi-scissors', label: 'Edicion 2' },
    { name: 'bi-bezier', label: 'Vector' },
    { name: 'bi-cassette-fill', label: 'Audio 2' },
    { name: 'bi-sd-card', label: 'Memoria' },
    { name: 'bi-collection-play', label: 'Multimedia' },
    { name: 'bi-window', label: 'UI' },
    { name: 'bi-bounding-box-circles', label: '3D' },
    { name: 'bi-cpu-fill', label: 'Procesamiento' },
    { name: 'bi-card-image', label: 'Imagenes' },
    { name: 'bi-bezier2', label: 'Curvas' },
    { name: 'bi-lightning', label: 'Energia 2' },
    { name: 'bi-fan', label: 'Ventilacion' },
    { name: 'bi-activity', label: 'Sensores' },
    { name: 'bi-ethernet', label: 'Red' },
  ];

  busquedaEncargado = '';
  buscandoEncargados = false;
  errorEncargados: string | null = null;
  resultadosEncargados: AdminUser[] = [];

  // Configuracion de correos
  emailConfigs: Configuracion[] = [];
  emailValores: { [clave: string]: string } = {};
  cargandoEmails = false;
  guardandoEmails = false;

  emailEtiquetas: { [clave: string]: string } = {
    'inventario_email': 'Email de Inventario',
    'prestamo_fallback_email': 'Email de Respaldo'
  };

  emailDescripciones: { [clave: string]: string } = {
    'inventario_email': 'Se notifica a este correo cuando un prestamo externo (FUERA de la UTA) cambia de estado.',
    'prestamo_fallback_email': 'Correo de respaldo cuando no hay encargados asignados a las categorias.'
  };

  constructor(
    private categoriaService: CategoriaService,
    private adminUsers: AdminUsersService,
    private notify: NotificationService,
    private configService: ConfiguracionService
  ) {}

  ngOnInit(): void {
    this.cargarCategorias();
    this.cargarEmailConfigs();
  }

  cargarCategorias(): void {
    this.cargando = true;
    this.error = null;

    this.categoriaService.getCategoriasAdmin().subscribe({
      next: (data) => {
        this.categorias = data || [];
        this.cargando = false;
      },
      error: () => {
        this.error = 'No se pudieron cargar las categorias.';
        this.cargando = false;
      }
    });
  }

  seleccionarCategoria(categoria: Categoria): void {
    this.categoriaSeleccionada = categoria;
    this.modoEdicion = true;
    this.form = {
      nombre: categoria.nombre || '',
      descripcion: categoria.descripcion || '',
      icono: categoria.icono || '',
      activo: categoria.activo
    };
    this.iconPickerOpen = false;
    this.iconSearch = '';

    this.categoriaService.getCategoriaAdmin(categoria.id).subscribe({
      next: (data) => {
        this.encargados = this.mapEncargados(data?.encargados || []);
      },
      error: () => {
        this.encargados = [];
      }
    });
  }

  nuevaCategoria(): void {
    this.categoriaSeleccionada = null;
    this.modoEdicion = false;
    this.encargados = [];
    this.form = {
      nombre: '',
      descripcion: '',
      icono: '',
      activo: true
    };
    this.iconPickerOpen = false;
    this.iconSearch = '';
  }

  guardarCategoria(): void {
    if (!this.form.nombre.trim()) {
      this.notify.warning('El nombre es obligatorio.');
      return;
    }

    this.guardando = true;
    const payload = {
      nombre: this.form.nombre.trim(),
      descripcion: this.form.descripcion?.trim() || null,
      icono: this.form.icono || null,
      activo: this.form.activo
    };

    if (this.categoriaSeleccionada) {
      this.categoriaService.actualizarCategoriaAdmin(this.categoriaSeleccionada.id, payload).subscribe({
        next: (res) => {
          this.guardando = false;
          this.notify.success('Categoria actualizada.');
          this.cargarCategorias();
          if (res?.categoria) {
            this.seleccionarCategoria(res.categoria);
          }
        },
        error: () => {
          this.guardando = false;
          this.notify.error('No se pudo actualizar la categoria.');
        }
      });
      return;
    }

    this.categoriaService.crearCategoriaAdmin(payload).subscribe({
      next: (res) => {
        this.guardando = false;
        this.notify.success('Categoria creada.');
        this.cargarCategorias();
        if (res?.categoria) {
          this.seleccionarCategoria(res.categoria);
        }
      },
      error: () => {
        this.guardando = false;
        this.notify.error('No se pudo crear la categoria.');
      }
    });
  }

  desactivarCategoria(categoria: Categoria): void {
    this.categoriaService.actualizarEstadoCategoria(categoria.id, false).subscribe({
      next: () => {
        this.notify.info('Categoria desactivada.');
        this.cargarCategorias();
        if (this.categoriaSeleccionada?.id === categoria.id) {
          this.categoriaSeleccionada.activo = false;
          this.form.activo = false;
        }
      },
      error: () => {
        this.notify.error('No se pudo desactivar la categoria.');
      }
    });
  }

  activarCategoria(categoria: Categoria): void {
    this.categoriaService.actualizarEstadoCategoria(categoria.id, true).subscribe({
      next: () => {
        this.notify.success('Categoria activada.');
        this.cargarCategorias();
        if (this.categoriaSeleccionada?.id === categoria.id) {
          this.categoriaSeleccionada.activo = true;
          this.form.activo = true;
        }
      },
      error: () => {
        this.notify.error('No se pudo activar la categoria.');
      }
    });
  }

  toggleIconPicker(): void {
    this.iconPickerOpen = !this.iconPickerOpen;
  }

  seleccionarIcono(icono: string): void {
    this.form.icono = icono;
    this.iconPickerOpen = false;
  }

  get iconosFiltrados(): IconOption[] {
    const q = this.iconSearch.trim().toLowerCase();
    if (!q) return this.iconOptions;
    return this.iconOptions.filter(i => i.name.includes(q) || i.label.toLowerCase().includes(q));
  }

  buscarEncargados(): void {
    this.errorEncargados = null;
    this.resultadosEncargados = [];

    if (!this.busquedaEncargado || this.busquedaEncargado.trim().length < 2) {
      return;
    }

    this.buscandoEncargados = true;
    this.adminUsers.search(this.busquedaEncargado.trim(), 8, ['ADMIN', 'SUPER_USUARIO']).subscribe({
      next: (resp) => {
        this.resultadosEncargados = resp || [];
        this.buscandoEncargados = false;
      },
      error: () => {
        this.errorEncargados = 'Error al buscar usuarios.';
        this.buscandoEncargados = false;
      }
    });
  }

  agregarEncargado(user: AdminUser): void {
    if (!this.categoriaSeleccionada) return;

    const existe = this.encargados.some(e => e.id === user.id);
    if (existe) {
      this.notify.info('El usuario ya es encargado.');
      this.resultadosEncargados = [];
      this.busquedaEncargado = '';
      return;
    }

    this.categoriaService.addEncargados(this.categoriaSeleccionada.id, [user.id]).subscribe({
      next: (res) => {
        const lista = res?.encargados || [];
        this.encargados = this.mapEncargados(lista);
        this.notify.success('Encargado agregado.');
        this.resultadosEncargados = [];
        this.busquedaEncargado = '';
        this.cargarCategorias();
      },
      error: () => {
        this.notify.error('No se pudo agregar el encargado.');
      }
    });
  }

  quitarEncargado(encargado: Encargado): void {
    if (!this.categoriaSeleccionada) return;

    this.categoriaService.removeEncargado(this.categoriaSeleccionada.id, encargado.id).subscribe({
      next: () => {
        this.encargados = this.encargados.filter(e => e.id !== encargado.id);
        this.notify.info('Encargado removido.');
        this.cargarCategorias();
      },
      error: () => {
        this.notify.error('No se pudo quitar el encargado.');
      }
    });
  }

  private mapEncargados(data: any[]): Encargado[] {
    return (data || []).map((u: any) => ({
      id: u.idUser ?? u.id,
      nombre: u.persona
        ? `${u.persona.Nombre ?? ''} ${u.persona.apellido1 ?? ''} ${u.persona.apellido2 ?? ''}`.trim()
        : (u.nombre ?? ''),
      email: u.Email ?? u.email,
      rut: u.persona?.Rut ?? u.rut,
      rol: u.roles?.[0]?.Nombre ?? u.rol
    }));
  }

  // ===================== CONFIGURACION DE CORREOS =====================

  cargarEmailConfigs(): void {
    this.cargandoEmails = true;
    this.configService.getConfiguraciones('emails').subscribe({
      next: (data) => {
        this.emailConfigs = data;
        this.emailValores = {};
        data.forEach(c => {
          this.emailValores[c.clave] = c.valor ?? '';
        });
        this.cargandoEmails = false;
      },
      error: () => {
        this.cargandoEmails = false;
      }
    });
  }

  guardarEmails(): void {
    this.guardandoEmails = true;

    const configuraciones = Object.entries(this.emailValores).map(([clave, valor]) => ({
      clave,
      valor: valor?.trim() || null
    }));

    // Validar emails
    for (const c of configuraciones) {
      if (c.valor && !this.esEmailValido(c.valor)) {
        this.notify.warning(`"${this.emailEtiquetas[c.clave] || c.clave}" no es un email valido.`);
        this.guardandoEmails = false;
        return;
      }
    }

    this.configService.actualizarConfiguraciones(configuraciones).subscribe({
      next: () => {
        this.notify.success('Correos actualizados correctamente.');
        this.guardandoEmails = false;
        this.cargarEmailConfigs();
      },
      error: (err) => {
        this.notify.error(err.error?.error || 'Error al guardar los correos.');
        this.guardandoEmails = false;
      }
    });
  }

  esEmailValido(email: string): boolean {
    if (!email) return true;
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  }

  getEmailEtiqueta(clave: string): string {
    return this.emailEtiquetas[clave] || clave;
  }

  getEmailDescripcion(clave: string): string {
    return this.emailDescripciones[clave] || '';
  }

  getEmailIcono(clave: string): string {
    if (clave.includes('inventario')) return 'bi-box-seam';
    if (clave.includes('fallback')) return 'bi-envelope-exclamation';
    return 'bi-envelope';
  }
}
