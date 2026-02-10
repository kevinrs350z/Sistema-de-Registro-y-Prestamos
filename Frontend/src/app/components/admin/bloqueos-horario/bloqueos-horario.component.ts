import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../../services/auth.service';
import { TipoEquipoService } from '../../../services/tipoEquipo.service';
import { BloqueosHorarioService } from '../../../services/bloqueos-horario.service';
import { NotificationService } from '../../../services/notification.service';

interface BloqueItem {
  id: number;
  texto: string;
}

@Component({
  selector: 'app-bloqueos-horario',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './bloqueos-horario.component.html',
  styleUrls: ['./bloqueos-horario.component.css']
})
export class BloqueosHorarioComponent implements OnInit {
  private auth = inject(AuthService);
  private tiposSrv = inject(TipoEquipoService);
  private bloqueosSrv = inject(BloqueosHorarioService);
  private notify = inject(NotificationService);

  private readonly diasBase = [
    { id: 1, nombre: 'Lun' },
    { id: 2, nombre: 'Mar' },
    { id: 3, nombre: 'Mie' },
    { id: 4, nombre: 'Jue' },
    { id: 5, nombre: 'Vie' },
    { id: 6, nombre: 'Sab' },
    { id: 7, nombre: 'Dom' },
  ];

  tipos = signal<any[]>([]);
  bloques = signal<BloqueItem[]>([]);
  tipoSeleccionado = signal<number | null>(null);
  bloqueos = signal<Set<string>>(new Set());
  weekOffset = signal(0);
  private readonly formatoFecha = new Intl.DateTimeFormat('es-CL', {
    day: '2-digit',
    month: '2-digit'
  });

  bloquesOrdenados = computed(() =>
    [...this.bloques()].sort((a, b) => a.id - b.id)
  );

  tipoNombreSeleccionado = computed(() => {
    const tipoId = this.tipoSeleccionado();
    if (!tipoId) return '—';
    return this.tipos().find(t => t.id === tipoId)?.nombre ?? '—';
  });

  semanaInicio = computed(() => {
    const base = this.getWeekStart(new Date());
    const offset = this.weekOffset();
    base.setDate(base.getDate() + offset * 7);
    return base;
  });

  dias = computed(() => {
    const inicio = this.semanaInicio();
    return this.diasBase.map((d, index) => {
      const fecha = new Date(inicio);
      fecha.setDate(inicio.getDate() + index);
      return {
        id: d.id,
        nombre: d.nombre,
        fecha,
        etiqueta: `${d.nombre} ${this.formatoFecha.format(fecha)}`
      };
    });
  });

  ngOnInit(): void {
    this.cargarTipos();
    this.cargarBloques();
  }

  private cargarTipos() {
    this.tiposSrv.getTipos().subscribe({
      next: (data) => {
        this.tipos.set(data || []);
        const primero = data?.[0]?.id ?? null;
        this.tipoSeleccionado.set(primero);
        if (primero) {
          this.cargarBloqueos(primero);
        }
      },
      error: () => this.notify.error('No se pudieron cargar los tipos de equipo.')
    });
  }

  private cargarBloques() {
    const token = sessionStorage.getItem('token') ?? '';
    this.auth.getBloques(token).subscribe({
      next: (data) => {
        const lista = (data || []).map((b: any) => ({
          id: b.idBloque,
          texto: `Bloque ${b.idBloque} (${String(b.hora_inicio || '').slice(0, 5)} - ${String(b.hora_fin || '').slice(0, 5)})`
        }));
        this.bloques.set(lista);
      },
      error: () => this.notify.error('No se pudieron cargar los bloques horarios.')
    });
  }

  onTipoChange() {
    const tipo = this.tipoSeleccionado();
    if (tipo) {
      this.cargarBloqueos(tipo);
    }
  }

  cambiarSemana(delta: number): void {
    this.weekOffset.update((actual) => actual + delta);
    const tipo = this.tipoSeleccionado();
    if (tipo) {
      this.cargarBloqueos(tipo);
    }
  }

  private cargarBloqueos(tipoEquipoId: number) {
    const weekStart = this.toISODate(this.semanaInicio());
    this.bloqueosSrv.getBloqueos(tipoEquipoId, weekStart).subscribe({
      next: (data) => {
        const set = new Set<string>();
        (data || []).forEach((b: any) => {
          set.add(this.key(b.dia_semana, b.idBloque));
        });
        this.bloqueos.set(set);
      },
      error: () => this.notify.error('No se pudieron cargar los bloqueos.')
    });
  }

  isBloqueado(dia: number, bloqueId: number): boolean {
    return this.bloqueos().has(this.key(dia, bloqueId));
  }

  toggle(dia: number, bloqueId: number): void {
    const tipoId = this.tipoSeleccionado();
    if (!tipoId) {
      this.notify.warning('Selecciona un tipo de equipo.');
      return;
    }

    const activo = !this.isBloqueado(dia, bloqueId);
    this.bloqueosSrv.setBloqueo({
      dia_semana: dia,
      idBloque: bloqueId,
      idTipoEquipo: tipoId,
      activo,
      week_start: this.toISODate(this.semanaInicio())
    }).subscribe({
      next: () => {
        const set = new Set(this.bloqueos());
        const k = this.key(dia, bloqueId);
        if (activo) {
          set.add(k);
        } else {
          set.delete(k);
        }
        this.bloqueos.set(set);
      },
      error: () => this.notify.error('No se pudo actualizar el bloqueo.')
    });
  }

  private key(dia: number, bloqueId: number): string {
    return `${dia}-${bloqueId}`;
  }

  private getWeekStart(fecha: Date): Date {
    const date = new Date(fecha);
    const day = date.getDay();
    const diff = day === 0 ? -6 : 1 - day;
    date.setDate(date.getDate() + diff);
    date.setHours(0, 0, 0, 0);
    return date;
  }

  private toISODate(fecha: Date): string {
    return fecha.toISOString().split('T')[0];
  }
}
