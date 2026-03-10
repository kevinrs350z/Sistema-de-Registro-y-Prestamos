import { Component, OnInit, computed, inject, signal, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { AuthService } from '../../../services/auth.service';
import { SancionStateService } from '../../../services/sancion-state.service';

interface SancionItem {
  id: number;
  idSancion?: number;
  nivel: string;
  descripcion?: string | null;
  categoria_falta?: string | null;
  estado: string;
  fecha_inicio?: string | null;
  fecha_fin?: string | null;
  detalle?: string | null;
  prestamo_id?: number | null;
  accion?: string | null;
  escalada_desde_id?: number | null;
  periodo_academico?: string | null;
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
export class MisSancionesComponent implements OnInit, OnDestroy {
  private api = inject(AuthService);
  private sancionState = inject(SancionStateService);
  private destroy$ = new Subject<void>();

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

    // Obtener ID de usuario del token o del sessionStorage
    const userStr = sessionStorage.getItem('user');
    const user = userStr ? JSON.parse(userStr) : null;
    const idUser = user?.idUser;

    if (!idUser) {
      this.error.set('No se pudo identificar tu usuario.');
      return;
    }

    // Conectar a sanciones del usuario usando state service
    this.cargando.set(true);
    this.sancionState.refrescarPorUsuario(idUser)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
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

    // ⚠️ NO iniciar polling manual
    // SancionStateService gestionará esto automáticamente:
    // - Si SSE conecta → sin polling
    // - Si SSE falla → polling fallback activado
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
    this.sancionState.detenerPolling();
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
