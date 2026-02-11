import { CommonModule } from '@angular/common';
import { Component, Input } from '@angular/core';
import { RouterModule } from '@angular/router';

type Role = 'alumno' | 'admin';

type QuickLink = {
  label: string;
  route?: string;
  href?: string;
};

@Component({
  selector: 'app-footer',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './footer.component.html',
  styleUrls: ['./footer.component.css']
})
export class FooterComponent {
  @Input() role: Role = 'alumno';
  @Input() version?: string;
  @Input() showLinks = true;
  @Input() compact = false;

  readonly year = new Date().getFullYear();

  private readonly alumnoLinks: QuickLink[] = [
    { label: 'Mis solicitudes', route: '/mis-solicitudes' },
    { label: 'Reservar equipo', route: '/reservas/solicitar' },
    { label: 'Preguntas frecuentes', route: '/preguntas-frecuentes' }
  ];

  private readonly adminLinks: QuickLink[] = [
    { label: 'Dashboard', route: '/admin/dashboard' },
    { label: 'Solicitudes pendientes', route: '/admin/solicitudes' },
    { label: 'Sanciones', route: '/admin/sanciones' },
    { label: 'Bloqueos de horario', route: '/admin/bloqueos-horario' }
  ];

  privacyLink: QuickLink = { label: 'Política de privacidad', route: '/privacidad', href: '#' };
  termsLink: QuickLink = { label: 'Términos de uso', route: '/terminos', href: '#' };

  get links(): QuickLink[] {
    return this.role === 'admin' ? this.adminLinks : this.alumnoLinks;
  }

  get currentVersion(): string {
    return this.version || 'v1.0.0';
  }

  get roleLabel(): string {
    return this.role === 'admin' ? 'Admin' : 'Alumno';
  }

  trackByLabel(_index: number, item: QuickLink): string {
    return item.label;
  }
}
