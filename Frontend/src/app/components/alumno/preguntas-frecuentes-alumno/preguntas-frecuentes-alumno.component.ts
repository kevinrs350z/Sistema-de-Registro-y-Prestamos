import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-preguntas-frecuentes-alumno',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './preguntas-frecuentes-alumno.component.html',
  styleUrl: './preguntas-frecuentes-alumno.component.css'
})
export class PreguntasFrecuentesAlumnoComponent {

  activa = signal<number | null>(null);

  preguntas = [
    { pregunta: '¿Cómo solicito un equipo?', respuesta: 'Puedes solicitar un equipo desde el módulo de reservas en el menú principal.' },
    { pregunta: '¿Qué pasa si no devuelvo a tiempo?', respuesta: 'El sistema aplicará sanciones según el reglamento del laboratorio.' },
    { pregunta: '¿Dónde veo mis solicitudes?', respuesta: 'En la sección "Mis solicitudes" encontrarás todo tu historial.' },
    { pregunta: '¿Puedo editar una solicitud enviada?', respuesta: 'No. Si necesitas cambios, contacta al administrador antes de que sea aprobada.' },
    { pregunta: '¿Qué significa una solicitud aprobada?', respuesta: 'Indica que tu reserva fue aceptada y está lista para retiro en el horario indicado.' },
    { pregunta: '¿Qué hago si necesito un equipo extra?', respuesta: 'Debes crear una nueva solicitud o pedir ajuste al administrador.' },
    { pregunta: '¿Cuánto tiempo tengo para retirar los equipos?', respuesta: 'Debes retirarlos dentro del tiempo indicado en tu bloque o fecha, con tolerancia de 10 minutos.' },
    { pregunta: '¿Dónde veo mis sanciones?', respuesta: 'En el apartado "Mis Sanciones" puedes ver sanciones activas y pasadas.' }
  ];

  toggle(i: number) {
    this.activa.set(this.activa() === i ? null : i);
  }
}
