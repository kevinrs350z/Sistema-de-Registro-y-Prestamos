import { Component } from '@angular/core';
import { Router, RouterOutlet, NavigationEnd } from '@angular/router';
import { NavbarComponent } from './navbar/navbar.component';
import { NavbarAdminComponent } from './components/admin/navbar-admin/navbar-admin.component';
import { NgIf } from '@angular/common';
import { filter } from 'rxjs/operators';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, NavbarComponent, NavbarAdminComponent, NgIf],
  template: `
    <!-- 🔹 Navbar público -->
    <app-navbar *ngIf="!esRutaAuth && !esRutaAdmin"></app-navbar>

    <!-- 🔹 Navbar administrativo -->
    <app-navbar-admin *ngIf="esRutaAdmin"></app-navbar-admin>

    <!-- 🔹 Contenido -->
    <router-outlet></router-outlet>
  `
})
export class AppComponent {

  esRutaAuth = false;
  esRutaAdmin = false;

  constructor(private router: Router) {
    this.router.events
      .pipe(filter((event): event is NavigationEnd => event instanceof NavigationEnd))
      .subscribe(event => {
        const url = event.urlAfterRedirects;

        this.esRutaAuth = url.startsWith('/auth');
        this.esRutaAdmin = url.startsWith('/admin');
      });
  }
}
