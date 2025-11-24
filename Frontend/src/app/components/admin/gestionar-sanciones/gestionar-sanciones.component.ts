import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { NavbarAdminComponent } from '../navbar-admin/navbar-admin.component';


interface Sancion {
  id: number;
  usuario: string;
  motivo: string;
  fecha_inicio: string;
  fecha_fin: string;
  estado: 'ACTIVA' | 'EXPIRADA';
}

@Component({
  selector: 'app-gestionar-sanciones',
  standalone: true,
  imports: [CommonModule, FormsModule,  NavbarAdminComponent],
  templateUrl: './gestionar-sanciones.component.html',
  styleUrls: ['./gestionar-sanciones.component.css'],
})
export class GestionarSancionesComponent implements OnInit {

  sanciones: Sancion[] = [];
  sancionSeleccionada: Sancion | null = null;
  filtro = '';

  ngOnInit(): void {
    this.cargarDatosSimulados();
  }

  cargarDatosSimulados() {
    this.sanciones = [
      {
        id: 1,
        usuario: 'Andrea Navia',
        motivo: 'Atraso en devolución',
        fecha_inicio: '2025-02-01',
        fecha_fin: '2025-02-10',
        estado: 'ACTIVA'
      },
      {
        id: 2,
        usuario: 'Juan Pérez',
        motivo: 'Daño en equipo',
        fecha_inicio: '2025-01-10',
        fecha_fin: '2025-03-10',
        estado: 'ACTIVA'
      },
      {
        id: 3,
        usuario: 'Carla Soto',
        motivo: 'Uso indebido de sala',
        fecha_inicio: '2024-12-01',
        fecha_fin: '2024-12-15',
        estado: 'EXPIRADA'
      }
    ];
  }

  // 🔥 FILTRADO SIN PIPE
  get sancionesFiltradas() {
    return this.sanciones.filter(s =>
      s.usuario.toLowerCase().includes(this.filtro.toLowerCase()) ||
      s.motivo.toLowerCase().includes(this.filtro.toLowerCase())
    );
  }

  seleccionar(s: Sancion) {
    this.sancionSeleccionada = s;
  }

  ampliarSancion() {
    if (!this.sancionSeleccionada) return;

    const nuevaFecha = new Date(this.sancionSeleccionada.fecha_fin);
    nuevaFecha.setDate(nuevaFecha.getDate() + 7);

    this.sancionSeleccionada.fecha_fin = nuevaFecha.toISOString().slice(0, 10);
  }

  quitarSancion() {
    if (!this.sancionSeleccionada) return;
    this.sanciones = this.sanciones.filter(s => s.id !== this.sancionSeleccionada!.id);
    this.sancionSeleccionada = null;
  }
}
