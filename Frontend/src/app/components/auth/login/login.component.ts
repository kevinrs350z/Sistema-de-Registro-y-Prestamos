import { Component } from '@angular/core';
import { FormBuilder, Validators, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../../services/auth.service'; // 👈 ajusta si tu servicio está en otra carpeta

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.css']
})
export class LoginComponent {
  hide: boolean = true;
  form: FormGroup;
  errorMessage = '';
  loading = false;

  constructor(
    private fb: FormBuilder,
    private router: Router,
    private authService: AuthService
  ) {
    this.form = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', Validators.required]
    });
  }

  submit() {
    if (this.form.invalid) return;

    const { email, password } = this.form.value;
    this.loading = true;
    this.errorMessage = '';

    // 🔥 Lógica igual que la versión anterior que funcionaba
    this.authService.login(email, password).subscribe({
      next: (res) => {
        this.loading = false;

        // Guardar token y usuario
        localStorage.setItem('token', res.token);
        localStorage.setItem('user', JSON.stringify(res.user));
        localStorage.setItem('rol', res.user.rol.nombre);

        // Redirigir según rol
        const rol = res.user.rol.nombre.toLowerCase();
        if (rol === 'admin') {
          this.router.navigate(['/admin/dashboard']);
        } else {
          this.router.navigate(['/equipos/catalogo']);
        }
      },
      error: () => {
        this.loading = false;
        this.errorMessage = 'Credenciales incorrectas o servidor no disponible.';
      }
    });
  }
}
