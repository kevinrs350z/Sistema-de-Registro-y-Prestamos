import { Component } from '@angular/core';
import { FormBuilder, Validators, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { AuthService } from '../auth.service';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-recuperar',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  templateUrl: './recuperar.component.html',
  styleUrls: ['./recuperar.component.css']
})
export class RecuperarComponent {
  form: FormGroup;
  message = '';
  error = '';
  loading = false;

  constructor(private fb: FormBuilder, private authService: AuthService) {
    this.form = this.fb.group({
      email: ['', [Validators.required, Validators.email]]
    });
  }

  submit() {
    if (this.form.invalid) return;

    this.loading = true;
    this.message = '';
    this.error = '';

    const { email } = this.form.value;

    this.authService.forgotPassword(email).subscribe({
      next: (res) => {
        this.loading = false;
        this.message = res.message || 'Se ha enviado un correo para restablecer tu contraseña.';
      },
      error: (err) => {
        this.loading = false;
        if (err.status === 404) {
          this.error = 'No existe un usuario con ese correo.';
        } else if (err.status === 400) {
          this.error = 'Correo inválido.';
        } else {
          this.error = 'Error al enviar el correo. Intenta más tarde.';
        }
      }
    });
  }
}
