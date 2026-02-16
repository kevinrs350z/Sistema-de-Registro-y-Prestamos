import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../../services/auth.service';

interface SancionItem {
  idSancion: number;
  nivel: string;
  descripcion?: string | null;
  estado: 'ACTIVA' | 'EXPIRADA' | string;
  fecha_inicio?: string | null;
  fecha_fin?: string | null;
  detalle?: string | null;
  prestamo_id?: number | null;
  accion?: string | null;
  asignada_por?: string | null;
  asignada_por_email?: string | null;
  asignada_en?: string | null;
}

@Component({
  selector: 'app-mis-sanciones',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './mis-sanciones.component.html',
  styleUrls: ['./mis-sanciones.component.css']
})
export class MisSancionesComponent implements OnInit {
  private api = inject(AuthService);

  sanciones = signal<SancionItem[]>([]);
  cargando = signal(false);
  error = signal<string | null>(null);
  filtro = signal<'TODAS' | 'ACTIVAS' | 'PASADAS'>('TODAS');
  page = signal(1);
  readonly pageSize = 6;

  sancionesFiltradas = computed(() => {
    const list = this.sanciones();
    const f = this.filtro();
    if (f === 'ACTIVAS') return list.filter(s => s.estado === 'ACTIVA');
    if (f === 'PASADAS') return list.filter(s => s.estado !== 'ACTIVA');
    return list;
  });

  totalPages = computed(() => {
    const total = this.sancionesFiltradas().length;
    return Math.ceil(total / this.pageSize);
  });

  sancionesPaginadas = computed(() => {
    const list = this.sancionesFiltradas();
    const page = this.page();
    const start = (page - 1) * this.pageSize;
    return list.slice(start, start + this.pageSize);
  });

  ngOnInit(): void {
    const token = sessionStorage.getItem('token') ?? '';
    if (!token) {
      this.error.set('Debes iniciar sesión para ver tus sanciones.');
      return;
    }

    this.cargando.set(true);
    this.api.getMisSanciones(token).subscribe({
      next: (res) => {
        this.sanciones.set(res?.sanciones ?? []);
        this.normalizarPagina();
        this.cargando.set(false);
      },
      error: () => {
        this.error.set('No se pudo cargar el historial de sanciones.');
        this.cargando.set(false);
      }
    });
  }

  setFiltro(f: 'TODAS' | 'ACTIVAS' | 'PASADAS') {
    this.filtro.set(f);
    this.page.set(1);
    this.normalizarPagina();
  }

  prevPage() {
    if (this.page() > 1) {
      this.page.set(this.page() - 1);
    }
  }

  nextPage() {
    const total = this.totalPages();
    if (total > 0 && this.page() < total) {
      this.page.set(this.page() + 1);
    }
  }

  private normalizarPagina() {
    const total = this.totalPages();
    if (total === 0) {
      this.page.set(1);
      return;
    }

    if (this.page() > total) {
      this.page.set(total);
    }

    if (this.page() < 1) {
      this.page.set(1);
    }
  }
}
