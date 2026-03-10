import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { AuthService } from '../services/auth.service'; 
import { SessionService } from '../services/session.service';
import { CommonModule } from '@angular/common';
import { environment } from '../../environments/environment';

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
    private authService: AuthService,
    private sessionService: SessionService
  ) {}

  ngOnInit() {
    this.route.queryParamMap.subscribe(params => {
      const token = params.get('token');
      const error = params.get('error');

      if (error) {
        console.error('Error al iniciar sesión con Google:', error);
        this.router.navigate(['/auth/login'], { replaceUrl: true });
        return;
      }

      if (token) {
        // 🔐 Guardar autenticación
        sessionStorage.setItem('token', token);
        
        // 🌐 Guardar URL base de API para SSE
        localStorage.setItem('apiBaseUrl', environment.apiBaseUrl);
        console.log('[AuthCallbackComponent] Guardado apiBaseUrl:', environment.apiBaseUrl);

        // pedir el usuario
        this.authService.getUsuario(token).subscribe({
          next: user => {
            sessionStorage.setItem('user', JSON.stringify(user));
            this.sessionService.start();
            this.router.navigate(['/equipos/catalogo'], { replaceUrl: true });
          },
          error: err => {
            console.error(err);
            this.router.navigate(['/auth/login'], { replaceUrl: true });
          }
        });
      }
    });
  }
}
