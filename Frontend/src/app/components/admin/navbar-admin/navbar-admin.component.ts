import { Component, inject, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { AuthService } from '../../../services/auth.service';
import { NotificationService } from '../../../services/notification.service';
import { SessionService } from '../../../services/session.service';

@Component({
  selector: 'app-navbar-admin',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './navbar-admin.component.html',
  styleUrls: ['./navbar-admin.component.css']
})
export class NavbarAdminComponent {

  /** Emitir cuando se pulse el botón hamburguesa (mobile) */
  @Output() toggleSidebarEvent = new EventEmitter<void>();

  public auth = inject(AuthService);
  private notify = inject(NotificationService);
  private session = inject(SessionService);

  constructor(private router: Router) {}

  toggleSidebar() {
    this.toggleSidebarEvent.emit();
  }

  irHome() {
    this.router.navigate(['/admin/dashboard']);
  }

  getUserId(): string {
    try {
      const raw = sessionStorage.getItem('user');
      if (raw) {
        const user = JSON.parse(raw);
        return user?.rut || user?.codigo || user?.email?.split('@')[0] || 'Usuario';
      }
    } catch {
      // ignore
    }
    return 'Usuario';
  }

  cerrarSesion() {
    this.session.stop();
    this.auth.logout();
    this.notify.info('Sesión cerrada.');
    this.router.navigate(['/auth/login'], { replaceUrl: true });
  }
}
