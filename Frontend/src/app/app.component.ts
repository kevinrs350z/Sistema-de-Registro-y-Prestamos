import { Component, ElementRef, ViewChild, AfterViewInit, OnDestroy } from '@angular/core';
import { Router, RouterOutlet, NavigationEnd, RouterLink } from '@angular/router';
import { NgIf } from '@angular/common';
import { fromEvent, Subscription } from 'rxjs';
import { filter, debounceTime } from 'rxjs/operators';

import { NavbarComponent } from './navbar/navbar.component';
import { NavbarAdminComponent } from './components/admin/navbar-admin/navbar-admin.component';
import { AdminSidebarComponent } from './components/admin/admin-sidebar/admin-sidebar.component';
import { LoadingOverlayComponent } from './shared/loading-overlay/loading-overlay.component';
import { NotificationComponent } from './shared/notification/notification.component';
import { FooterComponent } from './shared/footer/footer.component';
import { AuthService } from './services/auth.service';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [ 
    RouterOutlet,
    NavbarComponent,
    NavbarAdminComponent,
    AdminSidebarComponent,
    LoadingOverlayComponent, 
    NgIf,
    NotificationComponent,
    RouterLink,
    FooterComponent
  ],
  templateUrl: './app.component.html',
  styleUrl: './app.component.css'
})
export class AppComponent implements AfterViewInit, OnDestroy {

  esRutaAuth = false;
  esRutaAdmin = false;
  navbarOffset = 0;
  sidebarCollapsed = false;
  readonly versionStamp = this.computeVersionStamp();

  private resizeSub?: Subscription;
  private navbarResizeObserver?: ResizeObserver;
  private observedNavbar?: HTMLElement;

  private _userNavbar?: ElementRef<HTMLElement>;
  private _adminNavbar?: ElementRef<HTMLElement>;

  @ViewChild('adminSidebar') adminSidebar?: AdminSidebarComponent;

  @ViewChild('userNav', { read: ElementRef })
  set userNavbarRef(ref: ElementRef<HTMLElement> | undefined) {
    this._userNavbar = ref;
    this.scheduleNavbarUpdate();
  }

  @ViewChild('adminNav', { read: ElementRef })
  set adminNavbarRef(ref: ElementRef<HTMLElement> | undefined) {
    this._adminNavbar = ref;
    this.scheduleNavbarUpdate();
  }

  constructor(private router: Router, private auth: AuthService) {
    this.router.events
      .pipe(
        filter((event): event is NavigationEnd => event instanceof NavigationEnd)
      )
      .subscribe(event => {
        const url = event.urlAfterRedirects;
        const isAdminUser = this.auth.isAdmin();

        this.esRutaAuth = url.startsWith('/auth');
        // Si un admin ingresa al flujo de creación de solicitudes (catálogo), mantenemos el navbar de admin
        this.esRutaAdmin = url.startsWith('/admin') || (isAdminUser && url.startsWith('/equipos/catalogo'));

        this.scheduleNavbarUpdate();
      });
  }

  /** Abrir/cerrar sidebar en mobile */
  onToggleSidebar(): void {
    if (this.adminSidebar) {
      if (this.adminSidebar.isOpen) {
        this.adminSidebar.onOverlayClick();
      } else {
        this.adminSidebar.open();
      }
    }
  }

  ngAfterViewInit(): void {
    this.scheduleNavbarUpdate();
    this.resizeSub = fromEvent(window, 'resize')
      .pipe(debounceTime(75))
      .subscribe(() => this.updateNavbarOffset());
  }

  ngOnDestroy(): void {
    this.resizeSub?.unsubscribe();
    if (this.navbarResizeObserver && this.observedNavbar) {
      this.navbarResizeObserver.unobserve(this.observedNavbar);
      this.observedNavbar = undefined;
    }
    this.navbarResizeObserver?.disconnect();
  }

  private scheduleNavbarUpdate(): void {
    if (typeof queueMicrotask === 'function') {
      queueMicrotask(() => this.updateNavbarOffset());
      return;
    }

    setTimeout(() => this.updateNavbarOffset(), 0);
  }

  private updateNavbarOffset(): void {
    const navbarElement = this.getCurrentNavbarElement();

    if (!navbarElement) {
      this.navbarOffset = 0;
      this.detatchResizeObserver();
      return;
    }

    this.attachResizeObserver(navbarElement);

    const rect = navbarElement.getBoundingClientRect();
    const altura = Math.ceil(rect.height + 48);
    this.navbarOffset = altura;
  }

  private getCurrentNavbarElement(): HTMLElement | null {
    if (this._adminNavbar?.nativeElement) {
      return this._adminNavbar.nativeElement;
    }

    if (this._userNavbar?.nativeElement) {
      return this._userNavbar.nativeElement;
    }

    return null;
  }

  private attachResizeObserver(element: HTMLElement): void {
    if (this.observedNavbar === element) {
      return;
    }

    this.detatchResizeObserver();

    if (typeof ResizeObserver === 'undefined') {
      return;
    }

    if (!this.navbarResizeObserver) {
      this.navbarResizeObserver = new ResizeObserver(() => {
        this.scheduleNavbarUpdate();
      });
    }

    this.navbarResizeObserver.observe(element);
    this.observedNavbar = element;
  }

  private detatchResizeObserver(): void {
    if (this.navbarResizeObserver && this.observedNavbar) {
      this.navbarResizeObserver.unobserve(this.observedNavbar);
      this.observedNavbar = undefined;
    }
  }

  private computeVersionStamp(): string {
    const now = new Date();
    const yyyy = now.getFullYear();
    const mm = String(now.getMonth() + 1).padStart(2, '0');
    const dd = String(now.getDate()).padStart(2, '0');
    return `${yyyy}.${mm}.${dd}`;
  }
}
