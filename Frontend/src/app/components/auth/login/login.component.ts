import { Component } from '@angular/core';
import { FormBuilder, Validators, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../../services/auth.service';
import { SessionService } from '../../../services/session.service';
import { environment } from '../../../../environments/environment';
declare var google: any;


declare global {
  interface Window {
    handleCredentialResponse: (response: any) => void;
  }
}

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.css']
})
export class LoginComponent {
  hide = true;
  form: FormGroup;
  errorMessage = '';
  loading = false;

  constructor(
    private fb: FormBuilder,
    private router: Router,
    private authService: AuthService,
    private sessionService: SessionService
  ) {
    this.form = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', Validators.required]
    });
  }

  ngOnInit() {
    window.handleCredentialResponse = (response: any) => {
      this.sendTokenToApi(response.credential);
    };
  }
    ngAfterViewInit() {
    google.accounts.id.initialize({
      client_id: "1022429090686-9bh9n3io1fkfkugsl5fska1rj6ivh222.apps.googleusercontent.com",
      callback: (response: any) => this.sendTokenToApi(response.credential)
    });

    google.accounts.id.renderButton(
      document.getElementById("googleBtn")!,
      { theme: "outline", size: "large" }
    );
  }


  sendTokenToApi(token: string) {
    console.log('TOKEN QUE ENVÍO AL BACKEND:', token);
    this.authService.loginWithGoogle(token).subscribe({
      next: (res: any) => {
        // 🔐 Guardar autenticación
        sessionStorage.setItem('token', res.token);
        sessionStorage.setItem('user', JSON.stringify(res.user));
        sessionStorage.setItem('rol', res.user.rol.nombre);
        
        // 🌐 Guardar URL base de API para SSE
        localStorage.setItem('apiBaseUrl', environment.apiBaseUrl);
        console.log('[LoginComponent] Guardado apiBaseUrl:', environment.apiBaseUrl);

        this.sessionService.start();

        if (res.user.rol.nombre.toLowerCase() === 'admin') {
          this.router.navigate(['/admin/dashboard'], { replaceUrl: true });
        } else {
          this.router.navigate(['/equipos/catalogo'], { replaceUrl: true });
        }
      },
      error: () => {
        this.errorMessage = 'Error al iniciar sesión con Google';
      }
    });
  }


  submit() {
    if (this.form.invalid) return;

    this.loading = true;
    this.errorMessage = '';

    const { email, password } = this.form.value;

    this.authService.login(email, password).subscribe({
      next: (res) => {
        this.loading = false;

        // 🔐 Guardar autenticación
        sessionStorage.setItem('token', res.token);
        sessionStorage.setItem('user', JSON.stringify(res.user));
        sessionStorage.setItem('rol', res.user.rol.nombre);
        
        // 🌐 Guardar URL base de API para SSE
        localStorage.setItem('apiBaseUrl', environment.apiBaseUrl);
        console.log('[LoginComponent] Guardado apiBaseUrl:', environment.apiBaseUrl);

        this.sessionService.start();

        const rol = res.user.rol.nombre.toLowerCase();
        if (rol === 'admin') this.router.navigate(['/admin/dashboard'], { replaceUrl: true });
        else this.router.navigate(['/equipos/catalogo'], { replaceUrl: true });
      },
      error: () => {
        this.loading = false;
        this.errorMessage = 'Credenciales incorrectas.';
      }
    });
  }
}
