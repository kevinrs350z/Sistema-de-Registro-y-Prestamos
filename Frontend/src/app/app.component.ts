import { Component } from '@angular/core';
import { Router, RouterOutlet, NavigationEnd } from '@angular/router';
import { NgIf } from '@angular/common';
import { filter } from 'rxjs/operators';

import { NavbarComponent } from './navbar/navbar.component';
import { NavbarAdminComponent } from './components/admin/navbar-admin/navbar-admin.component';
import { LoadingOverlayComponent } from './shared/loading-overlay/loading-overlay.component';
import { NotificationComponent } from './shared/notification/notification.component';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [
    RouterOutlet,
    NavbarComponent,
    NavbarAdminComponent,
    LoadingOverlayComponent, // 👈 IMPORTANTE
    NgIf,
    NotificationComponent
  ],
  templateUrl: './app.component.html'
})
export class AppComponent {

  esRutaAuth = false;
  esRutaAdmin = false;

  constructor(private router: Router) {
    this.router.events
      .pipe(
        filter((event): event is NavigationEnd => event instanceof NavigationEnd)
      )
      .subscribe(event => {
        const url = event.urlAfterRedirects;

        this.esRutaAuth = url.startsWith('/auth');
        this.esRutaAdmin = url.startsWith('/admin');
      });
  }
}
