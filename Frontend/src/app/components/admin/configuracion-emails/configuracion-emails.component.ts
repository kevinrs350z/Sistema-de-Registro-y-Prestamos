import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ConfiguracionService, Configuracion } from '../../../services/configuracion.service';
import { NotificationService } from '../../../services/notification.service';
import { DmLoaderComponent } from '../../../shared/dm-loader/dm-loader.component';

@Component({
  selector: 'app-configuracion-emails',
  standalone: true,
  imports: [CommonModule, FormsModule, DmLoaderComponent],
  templateUrl: './configuracion-emails.component.html',
  styleUrls: ['./configuracion-emails.component.css']
})
export class ConfiguracionEmailsComponent implements OnInit {
  configuraciones: Configuracion[] = [];
  valores: { [clave: string]: string } = {};
  cargando = false;
  guardando = false;
  error: string | null = null;

  // Descripciones amigables para mostrar en el UI
  etiquetas: { [clave: string]: string } = {
    'inventario_email': 'Email de Inventario',
    'prestamo_fallback_email': 'Email de Respaldo (Fallback)'
  };

  descripciones: { [clave: string]: string } = {
    'inventario_email': 'Se notifica a este correo cuando un prestamo de tipo FUERA (externo a la universidad) cambia de estado. Inventario debe rendir cuenta de los equipos que salen de la UTA.',
    'prestamo_fallback_email': 'Cuando no hay encargados asignados a las categorias de un prestamo, la notificacion se envia a este correo como respaldo.'
  };

  constructor(
    private configService: ConfiguracionService,
    private notify: NotificationService
  ) {}

  ngOnInit(): void {
    this.cargarConfiguraciones();
  }

  cargarConfiguraciones(): void {
    this.cargando = true;
    this.error = null;

    this.configService.getConfiguraciones('emails').subscribe({
      next: (data) => {
        this.configuraciones = data;
        this.valores = {};
        data.forEach(c => {
          this.valores[c.clave] = c.valor ?? '';
        });
        this.cargando = false;
      },
      error: (err) => {
        console.error('Error al cargar configuraciones:', err);
        this.error = 'No se pudieron cargar las configuraciones.';
        this.cargando = false;
      }
    });
  }

  guardar(): void {
    this.guardando = true;
    this.error = null;

    const configuraciones = Object.entries(this.valores).map(([clave, valor]) => ({
      clave,
      valor: valor?.trim() || null
    }));

    // Validar emails antes de enviar
    for (const c of configuraciones) {
      if (c.valor && !this.esEmailValido(c.valor)) {
        this.error = `El valor de "${this.etiquetas[c.clave] || c.clave}" no es un email valido.`;
        this.guardando = false;
        return;
      }
    }

    this.configService.actualizarConfiguraciones(configuraciones).subscribe({
      next: () => {
        this.notify.success('Configuraciones guardadas correctamente.');
        this.guardando = false;
        this.cargarConfiguraciones();
      },
      error: (err) => {
        console.error('Error al guardar:', err);
        this.error = err.error?.error || 'Error al guardar las configuraciones.';
        this.guardando = false;
      }
    });
  }

  esEmailValido(email: string): boolean {
    if (!email) return true;
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  }

  getEtiqueta(clave: string): string {
    return this.etiquetas[clave] || clave;
  }

  getDescripcion(clave: string): string {
    return this.descripciones[clave] || '';
  }

  getIcono(clave: string): string {
    if (clave.includes('inventario')) return 'bi-box-seam';
    if (clave.includes('fallback')) return 'bi-envelope-exclamation';
    return 'bi-envelope';
  }
}
