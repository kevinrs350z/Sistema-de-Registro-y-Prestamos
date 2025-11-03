import { Component, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { ReservasService } from '../solicitar-reserva/reservas.service';
import { Equipo } from '../../../shared/models';

@Component({
  selector: 'app-catalogo-equipos',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './catalogo-equipos.component.html',
  styleUrls: ['./catalogo-equipos.component.css']
})
export class CatalogoEquiposComponent {
  private reservas = inject(ReservasService);
  private router = inject(Router);

  // ✅ Cargar equipos desde el servicio
  equipos = signal<Equipo[]>([]);
  categoriaSeleccionada = signal<string>('TODOS');
  carrito = signal<number[]>([]);
  busqueda = signal<string>('');

  // 🔹 Al iniciar, obtener equipos desde el servicio
  ngOnInit() {
    this.equipos.set(this.reservas.getEquiposDisponibles());
  }

  // ✅ Listado de categorías dinámico
  categorias = computed(() => {
    const todas = this.equipos().map(e => e.categoria);
    return ['TODOS', ...new Set(todas)];
  });

  // ✅ Filtro combinado: categoría + búsqueda
  equiposFiltrados = computed(() => {
    const texto = this.busqueda().toLowerCase();
    const categoria = this.categoriaSeleccionada();
    return this.equipos().filter(e => {
      const coincideCategoria = categoria === 'TODOS' || e.categoria === categoria;
      const coincideTexto =
        e.nombre.toLowerCase().includes(texto) ||
        e.codigo.toLowerCase().includes(texto);
      return coincideCategoria && coincideTexto;
    });
  });

  // ✅ Cambiar categoría
  filtrarPorCategoria(cat: string) {
    this.categoriaSeleccionada.set(cat);
  }

  // ✅ Buscar por texto
  filtrarPorBusqueda(event: Event) {
    const input = event.target as HTMLInputElement;
    this.busqueda.set(input.value);
  }

  // ✅ Seleccionar o quitar equipo
  toggleEquipo(id: number) {
    const actuales = this.carrito();
    if (actuales.includes(id)) {
      this.carrito.set(actuales.filter(x => x !== id));
    } else {
      this.carrito.set([...actuales, id]);
    }
  }

  // ✅ Saber si un equipo está en el carrito
  estaSeleccionado(id: number): boolean {
    return this.carrito().includes(id);
  }

  // ✅ Continuar hacia la vista de solicitud
  continuarReserva() {
    if (this.carrito().length === 0) {
      alert('⚠️ Debes seleccionar al menos un equipo antes de continuar.');
      return;
    }

    this.router.navigate(['/reservas/solicitar'], {
      state: { equiposSeleccionados: this.carrito() }
    });
  }
}

