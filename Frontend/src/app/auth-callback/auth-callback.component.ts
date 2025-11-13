import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { AuthService } from '../services/auth.service'; // ajusta la ruta
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
        this.router.navigate(['/login']);
        return;
      }

      if (token) {
        localStorage.setItem('token', token);

        // pedir el usuario
        this.authService.getUsuario(token).subscribe({
          next: user => {
            localStorage.setItem('user', JSON.stringify(user));
            this.router.navigate(['/']); // o a tu dashboard
          },
          error: err => {
            console.error(err);
            this.router.navigate(['/login']);
          }
        });
      }
    });
  }
}
