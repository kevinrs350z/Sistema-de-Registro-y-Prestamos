import { Component, inject, Output, EventEmitter, HostListener, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, NavigationEnd, RouterLink, RouterLinkActive } from '@angular/router';
import { AuthService } from '../../../services/auth.service';
import { filter, Subscription } from 'rxjs';

interface MenuItem {
  label: string;
  icon: string;
  action?: () => void;
  route?: string;
  seccion?: string;
}

interface MenuSection {
  key: string;
  label: string;
  icon: string;
  items: MenuItem[];
}

@Component({
  selector: 'app-admin-sidebar',
  standalone: true,
  imports: [CommonModule, RouterLink, RouterLinkActive],
  templateUrl: './admin-sidebar.component.html',
  styleUrls: ['./admin-sidebar.component.css']
})
export class AdminSidebarComponent implements OnInit, OnDestroy {

  @Output() sidebarClosed = new EventEmitter<void>();
  @Output() collapsedChange = new EventEmitter<boolean>();

  public auth = inject(AuthService);
  private router = inject(Router);
  private routerSub?: Subscription;

  /** Estado del sidebar mobile */
  isOpen = false;

  /** Estado colapsado (desktop) */
  collapsed = false;

  /** Sección activa actual (para resaltar) */
  activeSection = 'gestionar';

  /** Estado de acordeones abiertos */
  openSections: Record<string, boolean> = {
    principal: true,
    solicitudes: false,
    inventario: false,
    usuarios: false,
    config: false,
    reportes: false
  };

  /** Definición de las secciones del menú */
  menuSections: MenuSection[] = [
    {
      key: 'principal',
      label: 'Principal',
      icon: 'bi-grid-1x2-fill',
      items: [
        { label: 'Panel de administración', icon: 'bi-speedometer2', seccion: 'gestionar' },
        { label: 'Crear solicitud', icon: 'bi-clipboard-check', route: '/equipos/catalogo' }
      ]
    },
    {
      key: 'solicitudes',
      label: 'Solicitudes',
      icon: 'bi-inbox-fill',
      items: [
        { label: 'Solicitudes pendientes', icon: 'bi-clock-history', seccion: 'solicitudes' },
        { label: 'Solicitudes finalizadas', icon: 'bi-check2-circle', seccion: 'finalizadas' }
      ]
    },
    {
      key: 'inventario',
      label: 'Inventario',
      icon: 'bi-hdd-stack-fill',
      items: [
        { label: 'Gestionar Equipos', icon: 'bi-hdd-stack', seccion: 'inventario' },
        { label: 'Gestionar Categorías', icon: 'bi-tags', route: '/admin/categorias' },
        { label: 'Gestionar Packs', icon: 'bi-box-seam', route: '/admin/packs' }
      ]
    },
    {
      key: 'usuarios',
      label: 'Usuarios',
      icon: 'bi-people-fill',
      items: [
        { label: 'Gestionar Cuentas', icon: 'bi-people-fill', seccion: 'cuentas' },
        { label: 'Gestionar Sanciones', icon: 'bi-exclamation-triangle', route: '/admin/sanciones' }
      ]
    },
    {
      key: 'config',
      label: 'Configuración',
      icon: 'bi-gear-fill',
      items: [
        { label: 'Asignaturas / Eventos', icon: 'bi-calendar-event', route: '/admin/asignaturas' },
        { label: 'Bloqueos de horario', icon: 'bi-calendar2-week', route: '/admin/bloqueos-horario' },
        { label: 'Preguntas frecuentes', icon: 'bi-question-circle', route: '/admin/preguntas-frecuentes' }
      ]
    },
    {
      key: 'reportes',
      label: 'Reportes',
      icon: 'bi-bar-chart-line-fill',
      items: [
        { label: 'Visualizar Reportes', icon: 'bi-bar-chart-line-fill', route: '/admin/reportes' }
      ]
    }
  ];

  ngOnInit(): void {
    // Restaurar estado colapsado de localStorage
    this.collapsed = localStorage.getItem('admin-sidebar-collapsed') === 'true';
    // Notificar estado inicial al padre
    setTimeout(() => this.collapsedChange.emit(this.collapsed));

    // Escuchar cambios de ruta para actualizar el item activo
    this.routerSub = this.router.events.pipe(
      filter((e): e is NavigationEnd => e instanceof NavigationEnd)
    ).subscribe(e => {
      this.updateActiveFromUrl(e.urlAfterRedirects);
    });

    // Escuchar evento de navegación interna del dashboard
    window.addEventListener('admin-navegacion', this.onAdminNavegacion);
  }

  ngOnDestroy(): void {
    this.routerSub?.unsubscribe();
    window.removeEventListener('admin-navegacion', this.onAdminNavegacion);
  }

  private onAdminNavegacion = (e: Event) => {
    const detail = (e as CustomEvent).detail;
    if (detail) {
      this.activeSection = detail;
    }
  };

  private updateActiveFromUrl(url: string): void {
    if (url.includes('/admin/reportes')) {
      this.activeSection = '__route__/admin/reportes';
      this.openSections['reportes'] = true;
    } else if (url.includes('/admin/categorias')) {
      this.activeSection = '__route__/admin/categorias';
      this.openSections['inventario'] = true;
    } else if (url.includes('/admin/packs')) {
      this.activeSection = '__route__/admin/packs';
      this.openSections['inventario'] = true;
    } else if (url.includes('/admin/sanciones')) {
      this.activeSection = '__route__/admin/sanciones';
      this.openSections['usuarios'] = true;
    } else if (url.includes('/admin/asignaturas')) {
      this.activeSection = '__route__/admin/asignaturas';
      this.openSections['config'] = true;
    } else if (url.includes('/admin/bloqueos-horario')) {
      this.activeSection = '__route__/admin/bloqueos-horario';
      this.openSections['config'] = true;
    } else if (url.includes('/admin/preguntas-frecuentes')) {
      this.activeSection = '__route__/admin/preguntas-frecuentes';
      this.openSections['config'] = true;
    } else if (url.includes('/equipos/catalogo')) {
      this.activeSection = '__route__/equipos/catalogo';
      this.openSections['principal'] = true;
    }
  }

  /** Abrir/cerrar sección del acordeón */
  toggleSection(key: string): void {
    this.openSections[key] = !this.openSections[key];
  }

  /** Navegar a una sección interna del dashboard */
  navegarInterno(seccion: string): void {
    this.activeSection = seccion;
    this.closeMobile();

    if (this.router.url === '/admin/dashboard' || this.router.url.startsWith('/admin/dashboard')) {
      window.dispatchEvent(
        new CustomEvent('admin-navegacion', { detail: seccion })
      );
    } else {
      this.router.navigate(['/admin/dashboard']).then(() => {
        setTimeout(() => {
          window.dispatchEvent(
            new CustomEvent('admin-navegacion', { detail: seccion })
          );
        }, 100);
      });
    }
  }

  /** Navegar a una ruta */
  navegarRuta(route: string): void {
    this.activeSection = '__route__' + route;
    this.closeMobile();
    this.router.navigate([route]);
  }

  /** Manejar click on item */
  onItemClick(item: MenuItem): void {
    if (item.seccion) {
      this.navegarInterno(item.seccion);
    } else if (item.route) {
      this.navegarRuta(item.route);
    }
  }

  /** Verificar si un item está activo */
  isItemActive(item: MenuItem): boolean {
    if (item.seccion) {
      return this.activeSection === item.seccion;
    }
    if (item.route) {
      return this.activeSection === '__route__' + item.route;
    }
    return false;
  }

  /** Toggle colapsar/expandir (desktop) */
  toggleCollapse(): void {
    this.collapsed = !this.collapsed;
    localStorage.setItem('admin-sidebar-collapsed', String(this.collapsed));
    this.collapsedChange.emit(this.collapsed);
  }

  /** Abrir sidebar mobile */
  open(): void {
    this.isOpen = true;
  }

  /** Cerrar sidebar mobile */
  closeMobile(): void {
    if (window.innerWidth < 992) {
      this.isOpen = false;
      this.sidebarClosed.emit();
    }
  }

  /** Cerrar con overlay click */
  onOverlayClick(): void {
    this.isOpen = false;
    this.sidebarClosed.emit();
  }

  /** Cerrar con ESC */
  @HostListener('document:keydown.escape')
  onEscape(): void {
    if (this.isOpen && window.innerWidth < 992) {
      this.isOpen = false;
      this.sidebarClosed.emit();
    }
  }

  /** Filtrar sección de reportes si no es admin */
  get visibleSections(): MenuSection[] {
    return this.menuSections.filter(s => {
      if (s.key === 'reportes' && !this.auth.isAdmin()) return false;
      return true;
    });
  }
}
