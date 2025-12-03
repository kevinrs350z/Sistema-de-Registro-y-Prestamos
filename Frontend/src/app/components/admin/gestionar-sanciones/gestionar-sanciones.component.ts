import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { NavbarAdminComponent } from '../navbar-admin/navbar-admin.component';
import { SancionesService } from '../../../services/sanciones.service';

interface Sancion {
  id: number;

 
  usuario: string;  
  correo: string;
  rut: string;
  nombre: string;
  apellido: string;

  motivo: string;
  fecha_inicio: string;
  fecha_fin: string;
  estado: 'ACTIVA' | 'EXPIRADA';  
}


@Component({
  selector: 'app-gestionar-sanciones',
  standalone: true,
  imports: [CommonModule, FormsModule, NavbarAdminComponent],
  templateUrl: './gestionar-sanciones.component.html',
  styleUrls: ['./gestionar-sanciones.component.css'],
})
export class GestionarSancionesComponent implements OnInit {

  constructor(
    private router: Router,
    private sancionesService: SancionesService
  ) {}


  sanciones: Sancion[] = [];
  sancionSeleccionada: Sancion | null = null;
  filtro = '';


  tiposSancion: string[] = [
    'Atraso en devolución',
    'Daño en equipo',
    'Uso indebido de sala',
    'Consumo de alimentos en laboratorio',
    'Uso prolongado de equipo sin reserva'
  ];

  // Formularios
  formularioVisible = false;
  formularioAsignar = false;

  // Nuevo tipo
  nuevoTipo = '';

  // Asignación
  asignarUsuario = '';
  asignarTipo = '';
  asignarInicio = '';
  asignarFin = '';


  mostrarModalAmpliar = false;
  motivoAmpliacion = '';


  ngOnInit(): void {
    this.cargarDatosReales();
    this.asignarTipo = this.tiposSancion[0] || '';

    // Listener navbar admin
    window.addEventListener('admin-navegacion', (e: any) => {
      const destino = e.detail;

      if (destino === 'gestionar') {
        this.router.navigate(['/admin/dashboard']);
      }
      if (destino === 'solicitudes') {
        this.router.navigate(['/admin/solicitudes']);
      }
      if (destino === 'finalizadas') {
        this.router.navigate(['/admin/solicitudes-finalizadas']);
      }
      if (destino === 'inventario') {
        this.router.navigate(['/admin/dashboard']);
      }
      if (destino === 'cuentas') {
        this.router.navigate(['/admin/dashboard']);
      }
    });
  }


  cargarDatosReales(): void {
    this.sancionesService.getSanciones().subscribe({
      next: (resp) => {
        this.sanciones = resp.sanciones.map((s: any) => {
          const u = s.users?.[0]; // primer usuario asociado
          const persona = u?.persona;

          const estadoUI: 'ACTIVA' | 'EXPIRADA' =
            s.estado === 'ACTIVA' ? 'ACTIVA' : 'EXPIRADA';


          const nombre = persona?.Nombre ?? '';
          const apellido = persona?.Apellido1 ?? '';

          return {
            id: s.idSancion,
            usuario: `${nombre} ${apellido}`.trim() || u?.Email || 'Sin usuario',
            correo: u?.Email ?? '',
            rut: persona?.Rut ?? '',
            nombre,
            apellido,
            motivo: s.nivel,
            fecha_inicio: s.fecha_inicio,
            fecha_fin: s.fecha_fin,
            estado: estadoUI
          } as Sancion;
        });

      this.sancionSeleccionada = this.sanciones[0] || null;
    },
    error: (err) => {
      console.error('Error cargando sanciones', err);
    }
  });
}



  get sancionesFiltradas(): Sancion[] {
    const f = this.filtro.toLowerCase();
    if (!f) return this.sanciones;
    return this.sanciones.filter(s =>
      s.usuario.toLowerCase().includes(f) ||
      s.motivo.toLowerCase().includes(f)
    );
  }

 
  seleccionar(s: Sancion): void {
    this.sancionSeleccionada = s;
    this.formularioVisible = false;
    this.formularioAsignar = false;
  }


  toggleRegistrar(): void {
    this.formularioVisible = !this.formularioVisible;
    if (this.formularioVisible) {
      this.formularioAsignar = false;
      this.sancionSeleccionada = null;
    }
  }

  toggleAsignar(): void {
    this.formularioAsignar = !this.formularioAsignar;
    if (this.formularioAsignar) {
      this.formularioVisible = false;
      this.sancionSeleccionada = null;
    }
  }


  abrirModalAmpliar() {
    this.mostrarModalAmpliar = true;
  }

  cancelarAmpliacion() {
    this.mostrarModalAmpliar = false;
    this.motivoAmpliacion = '';
  }

confirmarAmpliacion() {
  if (!this.motivoAmpliacion.trim()) {
    alert("Debes ingresar un motivo.");
    return;
  }

  if (!this.sancionSeleccionada) return;

  this.sancionesService
    .ampliarSancion(this.sancionSeleccionada.id, this.motivoAmpliacion.trim())
    .subscribe({
      next: () => {
        alert("Sanción ampliada correctamente.");
        this.mostrarModalAmpliar = false;
        this.motivoAmpliacion = '';
        this.cargarDatosReales();
      },
      error: (err) => {
        console.error(err);
        alert("Error al ampliar la sanción.");
      }
    });
}


 
  registrarTipo(): void {
    const tipo = this.nuevoTipo.trim();

    if (!tipo) {
      alert('Ingresa un nombre para el tipo de sanción.');
      return;
    }

    if (this.tiposSancion.some(t => t.toLowerCase() === tipo.toLowerCase())) {
      alert('Ese tipo de sanción ya existe.');
      return;
    }

    this.tiposSancion.push(tipo);
    this.nuevoTipo = '';
    alert('Tipo registrado correctamente.');
  }


asignarSancion(): void {
  if (!this.asignarUsuario.trim() ||
      !this.asignarTipo ||
      !this.asignarInicio ||
      !this.asignarFin) {
    alert('Completa todos los campos para asignar la sanción.');
    return;
  }

  const payload = {
    usuario: this.asignarUsuario.trim(), // id, correo o rut
    nivel: this.asignarTipo,
    fecha_inicio: this.asignarInicio,
    fecha_fin: this.asignarFin,
  };

  this.sancionesService.asignarSancion(payload).subscribe({
    next: () => {
      alert('Sanción asignada correctamente.');
      this.cargarDatosReales();
      this.formularioAsignar = false;
    },
    error: (err) => {
      console.error(err);
      alert('Error asignando sanción.');
    }
  });
}



quitarSancion(): void {
  if (!this.sancionSeleccionada) return;

  const confirmar = confirm('¿Estás seguro de quitar la sanción?');
  if (!confirmar) return;

  const motivo = prompt('Motivo (opcional) para quitar la sanción:') || undefined;

  this.sancionesService.quitarSancion(this.sancionSeleccionada.id, motivo).subscribe({
    next: () => {
      alert('Sanción quitada correctamente.');
      this.sancionSeleccionada = null;
      this.cargarDatosReales();
    },
    error: (err) => {
      console.error(err);
      alert('Error al quitar la sanción.');
    }
  });
}


}
