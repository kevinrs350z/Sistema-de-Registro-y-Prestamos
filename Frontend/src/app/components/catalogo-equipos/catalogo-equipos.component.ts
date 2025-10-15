import { Component, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { ReservasService } from '../solicitar-reserva/reservas.service';
import { Equipo } from '../../shared/models';

@Component({
  selector: 'app-catalogo-equipos',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './catalogo-equipos.component.html',
  styleUrls: ['./catalogo-equipos.component.css']
})
export class CatalogoEquiposComponent {
  private reservas = inject(ReservasService);
  private router = inject(Router);

  equipos = signal<Equipo[]>(this.reservas.getEquiposDisponibles());

  categoriaSeleccionada = signal<string>('TODOS');
  carrito = signal<number[]>([]); // IDs de equipos seleccionados

  categorias = computed(() => {
    const todas = this.equipos().map(e => e.categoria);
    return ['TODOS', ...new Set(todas)];
  });

  equiposFiltrados = computed(() => {
    return this.categoriaSeleccionada() === 'TODOS'
      ? this.equipos()
      : this.equipos().filter(e => e.categoria === this.categoriaSeleccionada());
  });

  toggleEquipo(id: number) {
    const actuales = this.carrito();
    this.carrito.set(actuales.includes(id)
      ? actuales.filter(x => x !== id)
      : [...actuales, id]);
  }

  continuarReserva() {
    this.router.navigate(['/reservas/solicitar'], {
      state: { equiposSeleccionados: this.carrito() }
    });
  }
}
