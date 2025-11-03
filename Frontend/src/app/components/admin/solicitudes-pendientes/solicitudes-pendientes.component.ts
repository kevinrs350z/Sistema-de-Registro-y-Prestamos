import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { SolicitudEquipo } from '../../../shared/models';

// 🔹 Tipo extendido con campos adicionales y códigos únicos de equipos
type AdminSolicitud = SolicitudEquipo & {
  tipo?: 'DENTRO' | 'FUERA';
  bloque?: string;
  periodo?: string;
  observacion?: string;
  equiposDetallados?: { nombre: string; codigoActivo: string }[];
  motivoAprobacion?: string;
};

@Component({
  selector: 'app-solicitudes-pendientes',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './solicitudes-pendientes.component.html',
  styleUrls: ['./solicitudes-pendientes.component.css']
})
export class SolicitudesPendientesComponent implements OnInit {
  solicitudes: AdminSolicitud[] = [];
  solicitudSeleccionada: AdminSolicitud | null = null;

  // 🔹 Motivos y control de modales
  motivoRechazo = '';
  motivoAprobacion = '';
  mostrarModal = false;
  mostrarModalAprobacion = false;

  filtroBusqueda = '';
  orden = 'recientes';

  ngOnInit(): void {
    // 🔹 Cargar solicitudes simuladas con códigos de activos fijos
    this.solicitudes = [
      {
        id: 1,
        estudiante: 'María González',
        email: 'maria.gonzalez@example.com',
        tipo: 'DENTRO',
        bloque: 'Bloque 1 y 2',
        equipos: ['Cámara Sony A6400', 'Trípode Manfrotto'],
        equiposDetallados: [
          { nombre: 'Cámara Sony A6400', codigoActivo: 'AF-0012' },
          { nombre: 'Trípode Manfrotto', codigoActivo: 'AF-0045' }
        ],
        observacion: 'Grabación proyecto final',
        fechaInicio: '2025-01-15',
        fechaFin: '2025-01-20',
        fechaSolicitud: '2025-01-10',
        estado: 'PENDIENTE'
      },
      {
        id: 2,
        estudiante: 'Carlos Rodríguez',
        email: 'carlos.rodriguez@example.com',
        tipo: 'FUERA',
        periodo: '17 ene - 24 ene 2025',
        equipos: ['Micrófono Rode', 'Laptop MacBook Pro'],
        equiposDetallados: [
          { nombre: 'Micrófono Rode', codigoActivo: 'AF-0077' },
          { nombre: 'Laptop MacBook Pro', codigoActivo: 'AF-0121' }
        ],
        observacion: 'Proyecto audiovisual externo',
        fechaInicio: '2025-01-18',
        fechaFin: '2025-01-25',
        fechaSolicitud: '2025-01-12',
        estado: 'PENDIENTE'
      },
      {
        id: 3,
        estudiante: 'Ana Martínez',
        email: 'ana.martinez@example.com',
        tipo: 'DENTRO',
        bloque: 'Bloque 3',
        equipos: ['Tablet iPad Pro'],
        equiposDetallados: [
          { nombre: 'Tablet iPad Pro', codigoActivo: 'AF-0034' }
        ],
        observacion: 'Pruebas de diseño',
        fechaInicio: '2025-01-05',
        fechaFin: '2025-01-10',
        fechaSolicitud: '2025-01-03',
        estado: 'APROBADA'
      }
    ];
  }

  // 🔹 Filtrar solicitudes
  get solicitudesFiltradas(): AdminSolicitud[] {
    let resultado = this.solicitudes.filter(
      s =>
        s.estado === 'PENDIENTE' &&
        (
          s.estudiante.toLowerCase().includes(this.filtroBusqueda.toLowerCase()) ||
          s.equipos.join(', ').toLowerCase().includes(this.filtroBusqueda.toLowerCase()) ||
          (s.observacion?.toLowerCase().includes(this.filtroBusqueda.toLowerCase()))
        )
    );

    if (this.orden === 'antiguas') {
      resultado.sort((a, b) => new Date(a.fechaSolicitud).getTime() - new Date(b.fechaSolicitud).getTime());
    } else {
      resultado.sort((a, b) => new Date(b.fechaSolicitud).getTime() - new Date(a.fechaSolicitud).getTime());
    }

    return resultado;
  }

  seleccionarSolicitud(s: AdminSolicitud) {
    this.solicitudSeleccionada = s;
  }

  // 🔹 Mostrar modal para aprobar con motivo
  abrirAprobacion() {
    this.mostrarModalAprobacion = true;
  }

  // 🔹 Confirmar aprobación con motivo obligatorio
  confirmarAprobacion() {
    if (this.motivoAprobacion.trim() === '') {
      alert('⚠️ Debes ingresar un motivo de aprobación.');
      return;
    }

    if (this.solicitudSeleccionada) {
      this.solicitudSeleccionada.estado = 'APROBADA';
      this.solicitudSeleccionada.motivoAprobacion = this.motivoAprobacion;
      alert(`✅ Solicitud de ${this.solicitudSeleccionada.estudiante} aprobada.\nMotivo: ${this.motivoAprobacion}`);
      this.mostrarModalAprobacion = false;
      this.motivoAprobacion = '';
      this.solicitudSeleccionada = null;
    }
  }

  // 🔹 Abrir modal de rechazo
  abrirRechazo() {
    this.mostrarModal = true;
  }

  // 🔹 Confirmar rechazo con motivo obligatorio
  confirmarRechazo() {
    if (this.motivoRechazo.trim() === '') {
      alert('⚠️ Debes ingresar un motivo.');
      return;
    }
    if (this.solicitudSeleccionada) {
      this.solicitudSeleccionada.estado = 'RECHAZADA';
      this.solicitudSeleccionada.motivoRechazo = this.motivoRechazo;
      alert(`❌ Solicitud de ${this.solicitudSeleccionada.estudiante} rechazada.\nMotivo: ${this.motivoRechazo}`);
      this.mostrarModal = false;
      this.motivoRechazo = '';
      this.solicitudSeleccionada = null;
    }
  }

  // 🔹 Cerrar cualquier modal
  cerrarModal() {
    this.mostrarModal = false;
    this.mostrarModalAprobacion = false;
    this.motivoAprobacion = '';
    this.motivoRechazo = '';
  }

  formatearFecha(f: string): string {
    return new Date(f).toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  }
}
