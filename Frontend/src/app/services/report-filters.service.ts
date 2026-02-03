import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';

/**
 * Tipos de granularidad para agrupación temporal
 */
export type Granularity = 'day' | 'week' | 'month' | 'quarter' | 'semester' | 'year';

/**
 * Tipo de uso de préstamos
 */
export type TipoUso = 'interno' | 'externo' | 'ambos';

/**
 * Presets rápidos de período
 */
export type PeriodPreset = 
  | 'today'
  | 'this_week'
  | 'this_month' 
  | 'last_month'
  | 'this_quarter'
  | 'last_quarter'
  | 'this_semester'
  | 'last_semester'
  | 'this_year'
  | 'last_year'
  | 'custom';

/**
 * Interfaz del filtro de reportes
 * Contrato estándar para todos los reportes relacionados a préstamos
 */
export interface ReportFilter {
  from: string;           // YYYY-MM-DD
  to: string;             // YYYY-MM-DD
  granularity: Granularity;
  preset: PeriodPreset;
  tipoUso: TipoUso;       // interno | externo | ambos
  anioIngreso?: number;   // Año de ingreso del alumno (para ranking)
  timezone?: string;
}

/**
 * Información del período para mostrar en UI
 */
export interface PeriodInfo {
  label: string;
  shortLabel: string;
  from: Date;
  to: Date;
  daysCount: number;
}

/**
 * Servicio centralizado para gestión de filtros de reportes.
 * 
 * Implementa patrón Observable para que todos los componentes
 * de reportes se suscriban y actualicen automáticamente.
 * 
 * Inspirado en dashboards BI como Power BI / Apache Superset.
 */
@Injectable({
  providedIn: 'root'
})
export class ReportFiltersService {

  private readonly STORAGE_KEY = 'report_filters';

  /**
   * Presets disponibles con sus labels
   */
  readonly presets: { value: PeriodPreset; label: string; icon: string }[] = [
    { value: 'today', label: 'Hoy', icon: '📅' },
    { value: 'this_week', label: 'Esta semana', icon: '📆' },
    { value: 'this_month', label: 'Este mes', icon: '🗓️' },
    { value: 'last_month', label: 'Mes anterior', icon: '◀️' },
    { value: 'this_quarter', label: 'Este trimestre', icon: '📊' },
    { value: 'last_quarter', label: 'Trimestre anterior', icon: '◀️' },
    { value: 'this_semester', label: 'Este semestre', icon: '📈' },
    { value: 'last_semester', label: 'Semestre anterior', icon: '◀️' },
    { value: 'this_year', label: 'Este año', icon: '🎯' },
    { value: 'last_year', label: 'Año anterior', icon: '◀️' },
    { value: 'custom', label: 'Personalizado', icon: '⚙️' },
  ];

  /**
   * Granularidades disponibles
   */
  readonly granularities: { value: Granularity; label: string }[] = [
    { value: 'day', label: 'Día' },
    { value: 'week', label: 'Semana' },
    { value: 'month', label: 'Mes' },
    { value: 'quarter', label: 'Trimestre' },
    { value: 'semester', label: 'Semestre' },
    { value: 'year', label: 'Año' },
  ];

  /**
   * Tipos de uso disponibles
   */
  readonly tiposUso: { value: TipoUso; label: string; icon: string }[] = [
    { value: 'ambos', label: 'Todos', icon: '📊' },
    { value: 'interno', label: 'Interno', icon: '🏠' },
    { value: 'externo', label: 'Externo', icon: '🌐' },
  ];

  /**
   * Años de ingreso disponibles (últimos 10 años)
   */
  readonly aniosIngreso: { value: number | null; label: string }[] = this.generateAniosIngreso();

  /**
   * Filtro por defecto: último año, ambos tipos de uso
   */
  private defaultFilter: ReportFilter = {
    from: this.formatDate(this.subtractMonths(new Date(), 12)),
    to: this.formatDate(new Date()),
    granularity: 'month',
    preset: 'this_year',
    tipoUso: 'ambos'
  };

  /**
   * BehaviorSubject para estado reactivo
   */
  private filterSubject = new BehaviorSubject<ReportFilter>(this.loadFromStorage() || this.defaultFilter);

  /**
   * Observable público para suscripciones
   */
  readonly filter$: Observable<ReportFilter> = this.filterSubject.asObservable();

  /**
   * Modo de filtro: global o individual
   */
  private modeSubject = new BehaviorSubject<'global' | 'individual'>('global');
  readonly mode$: Observable<'global' | 'individual'> = this.modeSubject.asObservable();

  /**
   * Loading state
   */
  private loadingSubject = new BehaviorSubject<boolean>(false);
  readonly loading$: Observable<boolean> = this.loadingSubject.asObservable();

  constructor() {
    // Inicializar con datos persistidos o default
    const saved = this.loadFromStorage();
    if (saved) {
      this.filterSubject.next(saved);
    }
  }

  /**
   * Obtener filtro actual (snapshot)
   */
  get currentFilter(): ReportFilter {
    return this.filterSubject.getValue();
  }

  /**
   * Obtener modo actual
   */
  get currentMode(): 'global' | 'individual' {
    return this.modeSubject.getValue();
  }

  /**
   * Cambiar modo de filtro
   */
  setMode(mode: 'global' | 'individual'): void {
    this.modeSubject.next(mode);
  }

  /**
   * Cambiar tipo de uso
   */
  setTipoUso(tipoUso: TipoUso): void {
    this.updateFilter({
      ...this.currentFilter,
      tipoUso
    });
  }

  /**
   * Cambiar año de ingreso (para ranking de alumnos)
   */
  setAnioIngreso(anioIngreso: number | undefined): void {
    this.updateFilter({
      ...this.currentFilter,
      anioIngreso
    });
  }

  /**
   * Aplicar un preset rápido
   */
  applyPreset(preset: PeriodPreset): void {
    const { from, to } = this.calculatePresetDates(preset);
    const granularity = this.suggestGranularity(from, to);
    
    this.updateFilter({
      ...this.currentFilter,
      from: this.formatDate(from),
      to: this.formatDate(to),
      granularity,
      preset
    });
  }

  /**
   * Aplicar rango personalizado
   */
  applyCustomRange(from: string, to: string, granularity?: Granularity): void {
    const fromDate = new Date(from);
    const toDate = new Date(to);
    
    this.updateFilter({
      ...this.currentFilter,
      from,
      to,
      granularity: granularity || this.suggestGranularity(fromDate, toDate),
      preset: 'custom'
    });
  }

  /**
   * Cambiar granularidad manteniendo fechas
   */
  setGranularity(granularity: Granularity): void {
    this.updateFilter({
      ...this.currentFilter,
      granularity
    });
  }

  /**
   * Actualizar filtro y notificar suscriptores
   */
  private updateFilter(filter: ReportFilter): void {
    this.filterSubject.next(filter);
    this.saveToStorage(filter);
  }

  /**
   * Calcular fechas según preset
   */
  private calculatePresetDates(preset: PeriodPreset): { from: Date; to: Date } {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    
    switch (preset) {
      case 'today':
        return { from: today, to: today };

      case 'this_week': {
        const startOfWeek = new Date(today);
        startOfWeek.setDate(today.getDate() - today.getDay() + 1); // Lunes
        return { from: startOfWeek, to: today };
      }

      case 'this_month':
        return { 
          from: new Date(now.getFullYear(), now.getMonth(), 1), 
          to: today 
        };

      case 'last_month': {
        const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
        const endLastMonth = new Date(now.getFullYear(), now.getMonth(), 0);
        return { from: lastMonth, to: endLastMonth };
      }

      case 'this_quarter': {
        const quarter = Math.floor(now.getMonth() / 3);
        const startQuarter = new Date(now.getFullYear(), quarter * 3, 1);
        return { from: startQuarter, to: today };
      }

      case 'last_quarter': {
        const quarter = Math.floor(now.getMonth() / 3);
        const startLastQuarter = new Date(now.getFullYear(), (quarter - 1) * 3, 1);
        const endLastQuarter = new Date(now.getFullYear(), quarter * 3, 0);
        return { from: startLastQuarter, to: endLastQuarter };
      }

      case 'this_semester': {
        const semester = now.getMonth() < 6 ? 0 : 6;
        return { 
          from: new Date(now.getFullYear(), semester, 1), 
          to: today 
        };
      }

      case 'last_semester': {
        const semester = now.getMonth() < 6 ? 6 : 0;
        const year = now.getMonth() < 6 ? now.getFullYear() - 1 : now.getFullYear();
        const endMonth = semester === 0 ? 5 : 11;
        return { 
          from: new Date(year, semester, 1), 
          to: new Date(year, endMonth + 1, 0)
        };
      }

      case 'this_year':
        return { 
          from: new Date(now.getFullYear(), 0, 1), 
          to: today 
        };

      case 'last_year':
        return { 
          from: new Date(now.getFullYear() - 1, 0, 1), 
          to: new Date(now.getFullYear() - 1, 11, 31)
        };

      default:
        return { from: this.subtractMonths(today, 12), to: today };
    }
  }

  /**
   * Sugerir granularidad según rango de fechas
   */
  private suggestGranularity(from: Date, to: Date): Granularity {
    const diffDays = Math.ceil((to.getTime() - from.getTime()) / (1000 * 60 * 60 * 24));
    
    if (diffDays <= 7) return 'day';
    if (diffDays <= 31) return 'day';
    if (diffDays <= 90) return 'week';
    if (diffDays <= 180) return 'month';
    if (diffDays <= 365) return 'month';
    return 'quarter';
  }

  /**
   * Obtener información del período actual para mostrar en UI
   */
  getPeriodInfo(): PeriodInfo {
    const filter = this.currentFilter;
    const from = new Date(filter.from);
    const to = new Date(filter.to);
    const daysCount = Math.ceil((to.getTime() - from.getTime()) / (1000 * 60 * 60 * 24)) + 1;

    const preset = this.presets.find(p => p.value === filter.preset);
    
    const shortLabel = `${this.formatDateShort(from)} - ${this.formatDateShort(to)}`;
    const label = preset?.value !== 'custom' 
      ? `${preset?.label} (${shortLabel})`
      : shortLabel;

    return { label, shortLabel, from, to, daysCount };
  }

  /**
   * Obtener parámetros para API (contrato estándar)
   */
  getApiParams(): { 
    from: string; 
    to: string; 
    granularity: string;
    uso: TipoUso;
    anioIngreso?: number;
  } {
    const filter = this.currentFilter;
    const params: any = {
      from: filter.from,
      to: filter.to,
      granularity: filter.granularity,
      uso: filter.tipoUso || 'ambos'
    };
    
    if (filter.anioIngreso) {
      params.anioIngreso = filter.anioIngreso;
    }
    
    return params;
  }

  /**
   * Obtener query string para API (legacy compatibility)
   */
  getQueryString(): string {
    const params = this.getApiParams();
    const searchParams = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        searchParams.append(key, String(value));
      }
    });
    return searchParams.toString();
  }

  /**
   * Set loading state
   */
  setLoading(loading: boolean): void {
    this.loadingSubject.next(loading);
  }

  // ============== Utilidades ==============

  /**
   * Generar lista de años de ingreso (últimos 10 años)
   */
  private generateAniosIngreso(): { value: number | null; label: string }[] {
    const currentYear = new Date().getFullYear();
    const years: { value: number | null; label: string }[] = [
      { value: null, label: 'Todos los años' }
    ];
    
    for (let i = 0; i < 10; i++) {
      const year = currentYear - i;
      years.push({ value: year, label: String(year) });
    }
    
    return years;
  }

  private formatDate(date: Date): string {
    return date.toISOString().split('T')[0];
  }

  private formatDateShort(date: Date): string {
    return date.toLocaleDateString('es-CL', { 
      day: '2-digit', 
      month: 'short', 
      year: 'numeric' 
    });
  }

  private subtractMonths(date: Date, months: number): Date {
    const result = new Date(date);
    result.setMonth(result.getMonth() - months);
    return result;
  }

  private saveToStorage(filter: ReportFilter): void {
    try {
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(filter));
    } catch (e) {
      console.warn('No se pudo guardar filtro en localStorage', e);
    }
  }

  private loadFromStorage(): ReportFilter | null {
    try {
      const saved = localStorage.getItem(this.STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        // Asegurar que tipoUso exista (migración)
        if (!parsed.tipoUso) {
          parsed.tipoUso = 'ambos';
        }
        return parsed;
      }
      return null;
    } catch (e) {
      return null;
    }
  }

  /**
   * Resetear a valores por defecto
   */
  reset(): void {
    this.updateFilter(this.defaultFilter);
  }
}
