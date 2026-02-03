import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { AuthService } from '../services/auth.service'; 
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-auth-callback',
  standalone: true,
  imports: [CommonModule],
  template: `
    <p>Procesando autenticación con Google...</p>
  `
})
export class AuthCallbackComponent implements OnInit {

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private authService: AuthService
  ) {}

  ngOnInit() {
    this.route.queryParamMap.subscribe(params => {
      const token = params.get('token');
      const error = params.get('error');

      if (error) {
        console.error('Error al iniciar sesión con Google:', error);
        this.router.navigate(['/auth/login']);
        return;
      }

      if (token) {
        sessionStorage.setItem('token', token);

        // pedir el usuario
        this.authService.getUsuario(token).subscribe({
          next: user => {
            sessionStorage.setItem('user', JSON.stringify(user));
            // En esta app la raíz redirige a /auth/login; mandamos al catálogo por defecto.
            // (Si luego quieres, aquí podemos detectar rol y mandar a /admin/dashboard)
            this.router.navigate(['/equipos/catalogo']);
          },
          error: err => {
            console.error(err);
            this.router.navigate(['/auth/login']);
          }
        });
      }
    });
  }
}
