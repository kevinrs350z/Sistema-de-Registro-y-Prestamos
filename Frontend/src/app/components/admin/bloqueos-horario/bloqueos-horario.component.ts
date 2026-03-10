import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../../services/auth.service';
import { TipoEquipoService } from '../../../services/tipoEquipo.service';
import { EquiposService } from '../../../services/equipos.service';
import { BloqueosHorarioService } from '../../../services/bloqueos-horario.service';
import { NotificationService } from '../../../services/notification.service';

interface BloqueHorarioItem {
  id: number;
  etiqueta: string;
  inicio: string;
  fin: string;
}

type EstadoCelda = 'disponible' | 'bloqueado' | 'reservado' | 'pasado';
type ModoBloqueo = 'modelo' | 'fisico';
type TipoRepeticion = 'none' | 'daily' | 'weekly' | 'monthly';
type OpcionEliminarSerie = 'solo' | 'siguientes' | 'toda';

interface DiaSemanaItem {
  id: number;
  nombre: string;
  corto: string;
  fecha: Date;
}

interface MiniCalendarDay {
  day: number;
  date: Date;
  inCurrentMonth: boolean;
  isToday: boolean;
  isSelected: boolean;
}

interface MiniCalendar {
  monthDate: Date;
  monthTitle: string;
  dayNames: string[];
  days: MiniCalendarDay[];
  isCurrentMonth: boolean;
}

interface EquipoSeleccionable {
  id: string;
  nombre: string;
}

interface BloqueoAcademico {
  id: string;
  seriesId: string;
  fecha: string;
  diaSemana: number;
  bloqueId: number;
  nombreActividad: string;
  descripcion: string;
  modo: ModoBloqueo;
  equipos: EquipoSeleccionable[];
  repeticion: TipoRepeticion;
  rangoInicio: string | null;
  rangoFin: string | null;
  diasSemanaSerie: number[];
  fechaBaseSerie: string;
  createdAt: string;
}

interface ModalBloqueoForm {
  nombreActividad: string;
  descripcion: string;
  tipoRepeticion: TipoRepeticion;
  fechaInicio: string;
  fechaFin: string;
  diasSeleccionados: number[];
  modoBloqueo: ModoBloqueo;
  busquedaEquipo: string;
}

interface CalendarCell {
  day: DiaSemanaItem;
  block: BloqueHorarioItem;
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
  private equiposSrv = inject(EquiposService);
  private bloqueosSrv = inject(BloqueosHorarioService);
  private notify = inject(NotificationService);

  private readonly storageKey = 'bloqueos-academicos-equipos-v1';
  private readonly locale = 'es-CL';
  private readonly now = signal<Date>(new Date());

  private readonly dayLabels = [
    { id: 1, nombre: 'Lunes', corto: 'LU' },
    { id: 2, nombre: 'Martes', corto: 'MA' },
    { id: 3, nombre: 'Miércoles', corto: 'MI' },
    { id: 4, nombre: 'Jueves', corto: 'JU' },
    { id: 5, nombre: 'Viernes', corto: 'VI' },
    { id: 6, nombre: 'Sábado', corto: 'SA' },
    { id: 7, nombre: 'Domingo', corto: 'DO' }
  ];

  tiposEquipos = signal<any[]>([]);
  equiposFisicos = signal<any[]>([]);
  bloques = signal<BloqueHorarioItem[]>([]);
  bloqueosAcademicos = signal<BloqueoAcademico[]>([]);

  selectedDate = signal<Date>(this.resetTime(new Date()));
  selectedMonth = signal<Date>(this.startOfMonth(new Date()));
  weekStart = signal<Date>(this.getWeekStart(new Date()));

  quickMonthPickerOpen = signal(false);
  quickPickerYear = signal(new Date().getFullYear());

  modalOpen = signal(false);
  modalMode = signal<'create' | 'edit'>('create');
  selectedCell = signal<CalendarCell | null>(null);
  editingBlock = signal<BloqueoAcademico | null>(null);
  cellActivities = signal<BloqueoAcademico[]>([]);

  form = signal<ModalBloqueoForm>({
    nombreActividad: '',
    descripcion: '',
    tipoRepeticion: 'none',
    fechaInicio: '',
    fechaFin: '',
    diasSeleccionados: [],
    modoBloqueo: 'modelo',
    busquedaEquipo: ''
  });

  selectedEquipos = signal<EquipoSeleccionable[]>([]);

  formErrors = signal({
    nombreActividad: '',
    rango: '',
    equipos: ''
  });

  deletingSeriesOption = signal<OpcionEliminarSerie>('solo');

  miniDayNames = ['LU', 'MA', 'MI', 'JU', 'VI', 'SA', 'DO'];

  bloquesOrdenados = computed(() => [...this.bloques()].sort((a, b) => a.id - b.id));

  weekDays = computed<DiaSemanaItem[]>(() => {
    const start = this.weekStart();
    return this.dayLabels.map((day, index) => {
      const date = new Date(start);
      date.setDate(start.getDate() + index);
      return {
        id: day.id,
        nombre: day.nombre,
        corto: day.corto,
        fecha: date
      };
    });
  });

  weekRangeLabel = computed(() => {
    const week = this.weekDays();
    if (!week.length) {
      return '';
    }
    const first = week[0].fecha;
    const last = week[6].fecha;
    return `Semana del ${this.formatShortDate(first)} al ${this.formatShortDate(last)} / Día seleccionado: ${this.formatLongDate(this.selectedDate())}`;
  });

  miniCalendars = computed<MiniCalendar[]>(() => {
    const center = this.selectedMonth();
    const months = [
      this.addMonths(center, -1),
      center,
      this.addMonths(center, 1)
    ];

    const today = this.resetTime(new Date());
    const selectedDate = this.resetTime(this.selectedDate());

    return months.map((monthDate) => {
      const days = this.buildMiniCalendarDays(monthDate, today, selectedDate);
      const isCurrentMonth = this.isSameMonth(monthDate, today);
      return {
        monthDate,
        monthTitle: this.formatMonthYear(monthDate),
        dayNames: this.miniDayNames,
        days,
        isCurrentMonth
      };
    });
  });

  monthTiles = computed(() => {
    const year = this.quickPickerYear();
    const today = this.resetTime(new Date());
    const selectedMonth = this.selectedMonth();
    return Array.from({ length: 12 }, (_, index) => {
      const date = new Date(year, index, 1);
      return {
        date,
        label: this.formatMonthShort(date),
        isCurrent: this.isSameMonth(date, today),
        isSelected: this.isSameMonth(date, selectedMonth)
      };
    });
  });

  filteredEquiposDisponibles = computed<EquipoSeleccionable[]>(() => {
    const f = this.form();
    const query = (f.busquedaEquipo || '').trim().toLowerCase();
    const selectedIds = new Set(this.selectedEquipos().map((item) => item.id));
    const source = f.modoBloqueo === 'modelo'
      ? this.tiposEquipos().map((t) => ({ id: `modelo-${t.id}`, nombre: t.nombre }))
      : this.equiposFisicos().map((e) => ({ id: `fisico-${e.id}`, nombre: e.codigo || e.nombre || `Activo ${e.id}` }));

    return source
      .filter((item) => !selectedIds.has(item.id))
      .filter((item) => !query || item.nombre.toLowerCase().includes(query))
      .slice(0, 10);
  });

  canSave = computed(() => {
    const f = this.form();
    const hasName = f.nombreActividad.trim().length > 0;
    const hasEquipos = this.selectedEquipos().length > 0;
    return hasName && hasEquipos && !this.isSelectedCellReadOnly();
  });

  ngOnInit(): void {
    this.startClock();
    this.loadTipos();
    this.loadEquiposFisicos();
    this.cargarBloques();
    this.loadLocalBlocks();
    this.recalculateWeekFromSelectedDate();
  }

  private startClock(): void {
    setInterval(() => this.now.set(new Date()), 60000);
  }

  private loadTipos() {
    this.tiposSrv.getTipos().subscribe({
      next: (data) => this.tiposEquipos.set(data || []),
      error: () => this.notify.error('No se pudieron cargar los tipos de equipo.')
    });
  }

  private loadEquiposFisicos() {
    this.equiposSrv.getEquipos().subscribe({
      next: (data) => this.equiposFisicos.set(data || []),
      error: () => this.notify.warning('No se pudieron cargar equipos físicos; podrás seguir bloqueando por modelo.')
    });
  }

  private cargarBloques() {
    const token = sessionStorage.getItem('token') ?? '';
    this.auth.getBloques(token).subscribe({
      next: (data) => {
        const lista = (data || []).map((b: any) => {
          const inicio = String(b.hora_inicio || '').slice(0, 5);
          const fin = String(b.hora_fin || '').slice(0, 5);
          return {
            id: b.idBloque,
            inicio,
            fin,
            etiqueta: `${inicio}–${fin}`
          };
        });

        this.bloques.set(lista.length ? lista : this.getDefaultBloques());
      },
      error: () => {
        this.bloques.set(this.getDefaultBloques());
        this.notify.warning('Se usarán bloques horarios por defecto temporalmente.');
      }
    });
  }

  private getDefaultBloques(): BloqueHorarioItem[] {
    return [
      { id: 1, inicio: '08:00', fin: '09:40', etiqueta: '08:00–09:40' },
      { id: 2, inicio: '09:45', fin: '11:10', etiqueta: '09:45–11:10' },
      { id: 3, inicio: '11:15', fin: '12:40', etiqueta: '11:15–12:40' },
      { id: 4, inicio: '14:00', fin: '15:25', etiqueta: '14:00–15:25' },
      { id: 5, inicio: '15:30', fin: '16:55', etiqueta: '15:30–16:55' },
      { id: 6, inicio: '17:00', fin: '18:25', etiqueta: '17:00–18:25' }
    ];
  }

  private loadLocalBlocks(): void {
    try {
      const raw = localStorage.getItem(this.storageKey);
      if (!raw) {
        return;
      }
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        this.bloqueosAcademicos.set(parsed);
      }
    } catch {
      this.bloqueosAcademicos.set([]);
    }
  }

  private persistBlocks(): void {
    localStorage.setItem(this.storageKey, JSON.stringify(this.bloqueosAcademicos()));
  }

  selectMiniDay(day: MiniCalendarDay): void {
    this.selectedDate.set(this.resetTime(day.date));
    this.selectedMonth.set(this.startOfMonth(day.date));
    this.recalculateWeekFromSelectedDate();
  }

  goToPreviousWeek(): void {
    const next = new Date(this.weekStart());
    next.setDate(next.getDate() - 7);
    this.weekStart.set(this.resetTime(next));
    this.selectedDate.set(this.resetTime(next));
    this.selectedMonth.set(this.startOfMonth(next));
  }

  goToNextWeek(): void {
    const next = new Date(this.weekStart());
    next.setDate(next.getDate() + 7);
    this.weekStart.set(this.resetTime(next));
    this.selectedDate.set(this.resetTime(next));
    this.selectedMonth.set(this.startOfMonth(next));
  }

  goToCurrentWeek(): void {
    const today = this.resetTime(new Date());
    this.selectedDate.set(today);
    this.selectedMonth.set(this.startOfMonth(today));
    this.recalculateWeekFromSelectedDate();
  }

  openQuickMonthPicker(): void {
    this.quickPickerYear.set(this.selectedMonth().getFullYear());
    this.quickMonthPickerOpen.set(true);
  }

  closeQuickMonthPicker(): void {
    this.quickMonthPickerOpen.set(false);
  }

  changeQuickPickerYear(delta: number): void {
    this.quickPickerYear.update((year) => year + delta);
  }

  pickMonth(date: Date): void {
    const target = new Date(date.getFullYear(), date.getMonth(), 1);
    this.selectedMonth.set(target);

    const selected = this.selectedDate();
    const day = Math.min(selected.getDate(), this.daysInMonth(target.getFullYear(), target.getMonth()));
    const newDate = new Date(target.getFullYear(), target.getMonth(), day);
    this.selectedDate.set(this.resetTime(newDate));
    this.recalculateWeekFromSelectedDate();
    this.closeQuickMonthPicker();
  }

  jumpToTodayFromPicker(): void {
    this.goToCurrentWeek();
    this.closeQuickMonthPicker();
  }

  onCellClick(day: DiaSemanaItem, block: BloqueHorarioItem): void {
    try {
      const selected = this.resetTime(day.fecha);
      this.selectedDate.set(selected);
      this.selectedMonth.set(this.startOfMonth(selected));

      const existing = this.getCellBlocks(selected, block.id)
        .slice()
        .sort((a, b) => (a.createdAt || '').localeCompare(b.createdAt || ''));

      this.selectedCell.set({ day, block });
      this.cellActivities.set(existing);

      if (existing.length) {
        this.openActivityForEdit(existing[0]);
      } else {
        this.prepareNewActivityFromCell();
      }

      this.formErrors.set({ nombreActividad: '', rango: '', equipos: '' });
      this.deletingSeriesOption.set('solo');
      this.modalOpen.set(true);
    } catch {
      this.modalMode.set('create');
      this.editingBlock.set(null);
      this.cellActivities.set([]);
      this.prepareNewActivityFromCell();
      this.modalOpen.set(true);
      this.notify.warning('Se abrió el modal en modo nuevo por un registro previo incompleto.');
    }
  }

  closeModal(): void {
    this.modalOpen.set(false);
    this.selectedCell.set(null);
    this.editingBlock.set(null);
    this.cellActivities.set([]);
  }

  openActivityForEdit(activity: BloqueoAcademico): void {
    const cell = this.selectedCell();
    if (!cell) {
      return;
    }
    const selectedIso = this.toISODate(cell.day.fecha);
    this.modalMode.set('edit');
    this.editingBlock.set(activity);
    this.form.set({
      nombreActividad: activity.nombreActividad || '',
      descripcion: activity.descripcion || '',
      tipoRepeticion: activity.repeticion || 'none',
      fechaInicio: activity.rangoInicio || selectedIso,
      fechaFin: activity.rangoFin || selectedIso,
      diasSeleccionados: activity.diasSemanaSerie?.length ? activity.diasSemanaSerie : [cell.day.id],
      modoBloqueo: activity.modo || 'modelo',
      busquedaEquipo: ''
    });
    this.selectedEquipos.set(Array.isArray(activity.equipos) ? activity.equipos : []);
  }

  prepareNewActivityFromCell(): void {
    const cell = this.selectedCell();
    if (!cell) {
      return;
    }
    const selectedIso = this.toISODate(cell.day.fecha);
    const todayISO = this.toISODate(this.resetTime(new Date()));
    this.modalMode.set('create');
    this.editingBlock.set(null);
    this.form.set({
      nombreActividad: '',
      descripcion: '',
      tipoRepeticion: 'none',
      fechaInicio: selectedIso >= todayISO ? selectedIso : todayISO,
      fechaFin: selectedIso >= todayISO ? selectedIso : todayISO,
      diasSeleccionados: [cell.day.id],
      modoBloqueo: 'modelo',
      busquedaEquipo: ''
    });
    this.selectedEquipos.set([]);
  }

  setRepetition(type: TipoRepeticion): void {
    this.form.update((current) => ({ ...current, tipoRepeticion: type }));
  }

  toggleDiaRepeticion(dayId: number): void {
    const f = this.form();
    if (f.tipoRepeticion === 'daily') {
      return;
    }
    const exists = f.diasSeleccionados.includes(dayId);
    const next = exists
      ? f.diasSeleccionados.filter((d) => d !== dayId)
      : [...f.diasSeleccionados, dayId].sort((a, b) => a - b);
    this.form.update((current) => ({ ...current, diasSeleccionados: next }));
  }

  updateFormField<K extends keyof ModalBloqueoForm>(field: K, value: ModalBloqueoForm[K]): void {
    this.form.update((current) => ({ ...current, [field]: value }));
  }

  onModoBloqueoChange(mode: ModoBloqueo): void {
    this.form.update((current) => ({
      ...current,
      modoBloqueo: mode,
      busquedaEquipo: ''
    }));
    this.selectedEquipos.set([]);
  }

  addEquipo(): void {
    const options = this.filteredEquiposDisponibles();
    const f = this.form();
    const query = f.busquedaEquipo.trim().toLowerCase();

    const selected = options.find((item) => item.nombre.toLowerCase() === query) || options[0];
    if (!selected) {
      return;
    }

    const exists = this.selectedEquipos().some((item) => item.id === selected.id);
    if (exists) {
      return;
    }

    this.selectedEquipos.update((current) => [...current, selected]);
    this.form.update((current) => ({ ...current, busquedaEquipo: '' }));
    this.formErrors.update((current) => ({ ...current, equipos: '' }));
  }

  removeEquipo(id: string): void {
    this.selectedEquipos.update((current) => current.filter((item) => item.id !== id));
  }

  saveBloqueo(): void {
    if (this.isSelectedCellReadOnly()) {
      this.notify.warning('Este bloque está en el pasado y es solo lectura.');
      return;
    }

    if (!this.validateForm()) {
      return;
    }

    const cell = this.selectedCell();
    if (!cell) {
      return;
    }

    const formValue = this.form();
    const targetDate = this.toISODate(cell.day.fecha);
    const rangeStart = formValue.tipoRepeticion === 'none' ? targetDate : formValue.fechaInicio;
    const rangeEnd = formValue.tipoRepeticion === 'none' ? targetDate : formValue.fechaFin;
    const daysForSeries = this.resolveDaysForSeries(formValue.tipoRepeticion, formValue.diasSeleccionados, cell.day.id);
    const seriesId = this.modalMode() === 'edit' && this.editingBlock() ? this.editingBlock()!.seriesId : this.generateId('serie');

    let updated = this.bloqueosAcademicos();

    if (this.modalMode() === 'edit' && this.editingBlock()) {
      const editing = this.editingBlock()!;
      const option = this.deletingSeriesOption();
      updated = this.removeByOption(updated, editing, option);
    }

    const occurrences = this.generateOccurrences(targetDate, rangeStart, rangeEnd, formValue.tipoRepeticion, daysForSeries);
    const newBlocks: BloqueoAcademico[] = occurrences.map((dateIso) => ({
      id: this.generateId('bloq'),
      seriesId,
      fecha: dateIso,
      diaSemana: this.getMondayBasedDayIndex(new Date(`${dateIso}T00:00:00`)),
      bloqueId: cell.block.id,
      nombreActividad: formValue.nombreActividad.trim(),
      descripcion: formValue.descripcion.trim(),
      modo: formValue.modoBloqueo,
      equipos: this.selectedEquipos(),
      repeticion: formValue.tipoRepeticion,
      rangoInicio: formValue.tipoRepeticion === 'none' ? null : rangeStart,
      rangoFin: formValue.tipoRepeticion === 'none' ? null : rangeEnd,
      diasSemanaSerie: daysForSeries,
      fechaBaseSerie: targetDate,
      createdAt: new Date().toISOString()
    }));

    const merged = [...updated, ...newBlocks];
    this.bloqueosAcademicos.set(merged);
    this.persistBlocks();
    
    // ✅ NUEVA: Sincronizar con el backend
    this.syncBlocksToBackend(newBlocks);
    
    this.refreshCellActivities();
    this.notify.success('Bloqueo académico guardado correctamente.');
    this.closeModal();
  }

  /**
   * 📡 Sincroniza los bloqueos académicos con el backend
   * Los bloqueos pueden contener múltiples equipos, pero el backend
   * espera un equipo por POST. Entonces hacemos N llamadas.
   */
  private syncBlocksToBackend(blocks: BloqueoAcademico[]): void {
    blocks.forEach((bloque) => {
      if (!bloque.equipos || bloque.equipos.length === 0) {
        return;
      }

      // Por cada equipo en cada bloque, hacer un POST al backend
      bloque.equipos.forEach((equipo) => {
        const equipoId = this.extractEquipoId(equipo.id);
        if (!equipoId) return;

        const payload = {
          dia_semana: bloque.diaSemana,
          idBloque: bloque.bloqueId,
          idTipoEquipo: equipoId,
          activo: true,
          motivo: bloque.nombreActividad,
          week_start: this.toISODate(new Date(bloque.fecha + 'T00:00:00'))
        };

        this.bloqueosSrv.setBloqueo(payload).subscribe({
          next: () => {
            console.log(`✅ Bloqueo sincronizado: ${equipo.nombre} en bloque ${bloque.bloqueId}`);
          },
          error: (err) => {
            console.error(`❌ Error sincronizando bloqueo:`, err);
            this.notify.warning(`⚠️ El bloqueo se guardó localmente pero puede no estar en el servidor: ${equipo.nombre}`);
          }
        });
      });
    });
  }

  /**
   * Extrae el ID numérico del equipo (removemodelo- or fisico- prefix)
   */
  private extractEquipoId(equipoId: string): number | null {
    const match = equipoId.match(/modelo-(\d+)|fisico-(\d+)/);
    if (match) {
      const id = match[1] || match[2];
      return id ? Number(id) : null;
    }
    return null;
  }

  deleteCurrentBlock(): void {
    if (this.isSelectedCellReadOnly()) {
      this.notify.warning('Este bloque está en el pasado y es solo lectura.');
      return;
    }

    const editing = this.editingBlock();
    if (!editing) {
      return;
    }
    const option = this.deletingSeriesOption();
    const remaining = this.removeByOption(this.bloqueosAcademicos(), editing, option);
    
    // Determinar qué bloqueos se van a eliminar para notificar al servidor
    const removed = this.bloqueosAcademicos().filter(b => !remaining.includes(b));
    
    this.bloqueosAcademicos.set(remaining);
    this.persistBlocks();
    
    // ✅ NUEVA: Sincronizar eliminaciones con el backend
    this.deleteBlocksFromBackend(removed);
    
    this.refreshCellActivities();
    this.notify.info('Bloqueo eliminado.');
    this.closeModal();
  }

  /**
   * 📡 Elimina los bloqueos del backend (desactivándolos)
   */
  private deleteBlocksFromBackend(blocks: BloqueoAcademico[]): void {
    blocks.forEach((bloque) => {
      if (!bloque.equipos || bloque.equipos.length === 0) {
        return;
      }

      bloque.equipos.forEach((equipo) => {
        const equipoId = this.extractEquipoId(equipo.id);
        if (!equipoId) return;

        const payload = {
          dia_semana: bloque.diaSemana,
          idBloque: bloque.bloqueId,
          idTipoEquipo: equipoId,
          activo: false,  // Marca como inactivo
          week_start: this.toISODate(new Date(bloque.fecha + 'T00:00:00'))
        };

        this.bloqueosSrv.setBloqueo(payload).subscribe({
          next: () => {
            console.log(`✅ Bloqueo eliminado del servidor: ${equipo.nombre}`);
          },
          error: (err) => {
            console.error(`⚠️ Error eliminando bloqueo del servidor:`, err);
          }
        });
      });
    });
  }

  getCellActivityCount(day: DiaSemanaItem, block: BloqueHorarioItem): number {
    return this.getCellBlocks(day.fecha, block.id).length;
  }

  getCellState(day: DiaSemanaItem, block: BloqueHorarioItem): EstadoCelda {
    const date = this.toISODate(day.fecha);
    const blocks = this.bloqueosAcademicos().filter((item) => item.fecha === date && item.bloqueId === block.id);
    if (blocks.length) {
      return 'bloqueado';
    }

    if (this.isPastCell(day.fecha, block.fin)) {
      return 'pasado';
    }

    if (this.isCurrentCell(day.fecha, block.inicio, block.fin)) {
      return 'reservado';
    }

    return 'disponible';
  }

  getCellLabel(day: DiaSemanaItem, block: BloqueHorarioItem): string {
    const state = this.getCellState(day, block);
    if (state === 'bloqueado') {
      const items = this.getCellBlocks(day.fecha, block.id);
      const count = items.length;
      if (count > 1) {
        return `${count} actividades bloqueadas`;
      }
      const info = items[0];
      return info?.nombreActividad || 'Bloqueado';
    }
    if (state === 'reservado') {
      return 'Ocupado';
    }
    if (state === 'pasado') {
      return 'Pasado';
    }
    return 'Disponible';
  }

  getCellSubLabel(day: DiaSemanaItem, block: BloqueHorarioItem): string {
    const state = this.getCellState(day, block);
    if (state !== 'bloqueado') {
      return '';
    }
    const items = this.getCellBlocks(day.fecha, block.id);
    if (items.length > 1) {
      return items.slice(0, 2).map((i) => i.nombreActividad).join(' · ');
    }
    const info = items[0];
    return info?.equipos?.map((e) => e.nombre).join(', ') || 'Equipo(s) bloqueado(s)';
  }

  private refreshCellActivities(): void {
    const cell = this.selectedCell();
    if (!cell) {
      return;
    }
    const updated = this.getCellBlocks(cell.day.fecha, cell.block.id)
      .slice()
      .sort((a, b) => (a.createdAt || '').localeCompare(b.createdAt || ''));
    this.cellActivities.set(updated);
  }

  isDayChecked(dayId: number): boolean {
    const f = this.form();
    if (f.tipoRepeticion === 'daily') {
      return true;
    }
    return f.diasSeleccionados.includes(dayId);
  }

  showRangeFields(): boolean {
    return this.form().tipoRepeticion !== 'none';
  }

  getSearchPlaceholder(): string {
    return this.form().modoBloqueo === 'modelo'
      ? 'Buscar tipo de equipo…'
      : 'Ingresar/Buscar activo físico…';
  }

  isSelectedCellReadOnly(): boolean {
    const cell = this.selectedCell();
    if (!cell) {
      return false;
    }
    return this.isPastCell(cell.day.fecha, cell.block.fin);
  }

  isCurrentMonthRef(month: Date): boolean {
    return this.isSameMonth(month, this.resetTime(new Date()));
  }

  formatWeekForModal(): string {
    const week = this.weekDays();
    if (!week.length) {
      return '';
    }
    return `Lun ${this.formatDayMonth(week[0].fecha)} – Dom ${this.formatDayMonth(week[6].fecha)}`;
  }

  formatSelectedDateForModal(): string {
    const cell = this.selectedCell();
    if (!cell) {
      return '';
    }
    return this.formatLongDate(cell.day.fecha);
  }

  private validateForm(): boolean {
    const f = this.form();
    let nombreError = '';
    let rangoError = '';
    let equiposError = '';

    if (!f.nombreActividad || !f.nombreActividad.trim()) {
      nombreError = 'Ingresa un nombre de actividad válido.';
    }

    if (f.tipoRepeticion !== 'none') {
      if (!f.fechaInicio || !f.fechaFin) {
        rangoError = 'Debes indicar fecha inicio y fecha fin.';
      } else if (f.fechaInicio > f.fechaFin) {
        rangoError = 'La fecha de inicio no puede ser mayor a la fecha fin.';
      } else {
        const today = this.toISODate(this.resetTime(new Date()));
        if (this.modalMode() === 'create' && f.fechaFin < today) {
          rangoError = 'La fecha fin no puede estar antes de hoy.';
        }
      }

      if (f.tipoRepeticion === 'weekly' && !f.diasSeleccionados.length) {
        rangoError = 'Selecciona al menos un día para repetición semanal.';
      }
    }

    if (!this.selectedEquipos().length) {
      equiposError = 'Debes agregar al menos un equipo.';
    }

    this.formErrors.set({
      nombreActividad: nombreError,
      rango: rangoError,
      equipos: equiposError
    });

    return !nombreError && !rangoError && !equiposError;
  }

  private generateOccurrences(
    targetDateISO: string,
    rangeStart: string,
    rangeEnd: string,
    repetition: TipoRepeticion,
    weekDays: number[]
  ): string[] {
    if (repetition === 'none') {
      return [targetDateISO];
    }

    const start = new Date(`${rangeStart}T00:00:00`);
    const end = new Date(`${rangeEnd}T00:00:00`);
    const baseDate = new Date(`${targetDateISO}T00:00:00`);
    const output: string[] = [];
    const dayOfMonth = baseDate.getDate();

    for (let cursor = new Date(start); cursor <= end; cursor.setDate(cursor.getDate() + 1)) {
      const current = new Date(cursor);
      if (repetition === 'daily') {
        output.push(this.toISODate(current));
        continue;
      }

      if (repetition === 'weekly') {
        const day = this.getMondayBasedDayIndex(current);
        if (weekDays.includes(day)) {
          output.push(this.toISODate(current));
        }
        continue;
      }

      if (repetition === 'monthly') {
        if (current.getDate() === dayOfMonth) {
          output.push(this.toISODate(current));
        }
      }
    }

    if (!output.length) {
      output.push(targetDateISO);
    }

    return Array.from(new Set(output));
  }

  private resolveDaysForSeries(repetition: TipoRepeticion, selected: number[], fallback: number): number[] {
    if (repetition === 'daily') {
      return [1, 2, 3, 4, 5, 6, 7];
    }
    if (repetition === 'weekly') {
      return selected.length ? selected : [fallback];
    }
    return selected.length ? selected : [fallback];
  }

  private removeByOption(list: BloqueoAcademico[], editing: BloqueoAcademico, option: OpcionEliminarSerie): BloqueoAcademico[] {
    if (option === 'solo') {
      return list.filter((item) => item.id !== editing.id);
    }

    if (option === 'toda') {
      return list.filter((item) => item.seriesId !== editing.seriesId);
    }

    return list.filter((item) => {
      if (item.seriesId !== editing.seriesId) {
        return true;
      }
      return item.fecha < editing.fecha;
    });
  }

  private getCellBlocks(date: Date, blockId: number): BloqueoAcademico[] {
    const iso = this.toISODate(date);
    return this.bloqueosAcademicos().filter((item) => item.fecha === iso && item.bloqueId === blockId);
  }

  private recalculateWeekFromSelectedDate(): void {
    this.weekStart.set(this.getWeekStart(this.selectedDate()));
  }

  private buildMiniCalendarDays(monthDate: Date, today: Date, selectedDate: Date): MiniCalendarDay[] {
    const first = new Date(monthDate.getFullYear(), monthDate.getMonth(), 1);
    const start = this.getWeekStart(first);
    const items: MiniCalendarDay[] = [];

    for (let i = 0; i < 42; i++) {
      const date = new Date(start);
      date.setDate(start.getDate() + i);
      items.push({
        day: date.getDate(),
        date,
        inCurrentMonth: date.getMonth() === monthDate.getMonth(),
        isToday: this.isSameDate(date, today),
        isSelected: this.isSameDate(date, selectedDate)
      });
    }

    return items;
  }

  private isPastCell(date: Date, endTime: string): boolean {
    const now = this.now();
    const [h, m] = endTime.split(':').map((value) => Number(value));
    const endDate = new Date(date);
    endDate.setHours(h || 0, m || 0, 0, 0);
    return endDate.getTime() < now.getTime();
  }

  private isCurrentCell(date: Date, startTime: string, endTime: string): boolean {
    const now = this.now();
    const start = new Date(date);
    const end = new Date(date);
    const [h1, m1] = startTime.split(':').map((value) => Number(value));
    const [h2, m2] = endTime.split(':').map((value) => Number(value));
    start.setHours(h1 || 0, m1 || 0, 0, 0);
    end.setHours(h2 || 0, m2 || 0, 0, 0);
    return now >= start && now <= end;
  }

  private formatMonthYear(date: Date): string {
    return new Intl.DateTimeFormat(this.locale, { month: 'long', year: 'numeric' }).format(date);
  }

  private formatMonthShort(date: Date): string {
    return new Intl.DateTimeFormat(this.locale, { month: 'short' }).format(date);
  }

  private formatShortDate(date: Date): string {
    return new Intl.DateTimeFormat(this.locale, { day: '2-digit', month: 'short' }).format(date);
  }

  private formatDayMonth(date: Date): string {
    return new Intl.DateTimeFormat(this.locale, { day: '2-digit', month: '2-digit' }).format(date);
  }

  private formatLongDate(date: Date): string {
    return new Intl.DateTimeFormat(this.locale, {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    }).format(date);
  }

  private getWeekStart(date: Date): Date {
    const value = this.resetTime(date);
    const day = value.getDay();
    const diff = day === 0 ? -6 : 1 - day;
    value.setDate(value.getDate() + diff);
    return value;
  }

  private addMonths(date: Date, delta: number): Date {
    return new Date(date.getFullYear(), date.getMonth() + delta, 1);
  }

  private startOfMonth(date: Date): Date {
    return new Date(date.getFullYear(), date.getMonth(), 1);
  }

  private resetTime(date: Date): Date {
    const copy = new Date(date);
    copy.setHours(0, 0, 0, 0);
    return copy;
  }

  private daysInMonth(year: number, month: number): number {
    return new Date(year, month + 1, 0).getDate();
  }

  private isSameDate(a: Date, b: Date): boolean {
    return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
  }

  private isSameMonth(a: Date, b: Date): boolean {
    return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth();
  }

  private getMondayBasedDayIndex(date: Date): number {
    const day = date.getDay();
    return day === 0 ? 7 : day;
  }

  private toISODate(date: Date): string {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  private generateId(prefix: string): string {
    return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  }
}
