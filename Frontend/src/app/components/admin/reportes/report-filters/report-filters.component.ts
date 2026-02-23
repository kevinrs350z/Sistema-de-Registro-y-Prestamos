import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, OnDestroy, OnInit, Output } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Subject, takeUntil } from 'rxjs';
import {
  ReportFiltersService,
  ReportFilter,
  PeriodPreset,
  Granularity,
  TipoUso,
  PeriodInfo,
  FranjaHoraria
} from '../../../../services/report-filters.service';
import { AsignaturasService } from '../../../../services/asignaturas.service';
import { EquiposService } from '../../../../services/equipos.service';

@Component({
  selector: 'app-report-filters',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <!-- CONTROL BAR: Una sola card unificada -->
    <div class="control-bar card rounded-4 shadow-sm border-0">
      
      <!-- TOOLBAR PRINCIPAL -->
      <div class="toolbar d-flex align-items-center flex-wrap gap-3 px-3 py-2">
        
        <!-- Resumen período (izquierda) -->
        <div class="period-summary d-flex align-items-center gap-2 me-auto">
          <i class="bi bi-calendar-week text-primary"></i>
          <span class="fw-semibold text-dark small">{{ periodInfo?.label }}</span>
          <span class="badge bg-primary-subtle text-primary-emphasis rounded-pill">{{ periodInfo?.daysCount }} días</span>
        </div>

        <!-- Navegación temporal -->
        <div class="btn-group btn-group-sm" role="group">
          <button type="button" class="btn btn-outline-secondary" (click)="navigatePeriod('prev')" title="Período anterior">
            <i class="bi bi-chevron-left"></i>
          </button>
          <!-- Presets período -->
          @for (preset of quickPresets; track preset.value) {
            <button 
              type="button"
              class="btn"
              [class.btn-primary]="currentFilter?.preset === preset.value"
              [class.btn-outline-secondary]="currentFilter?.preset !== preset.value"
              (click)="applyPreset(preset.value)">
              {{ preset.label }}
            </button>
          }
          <button type="button" class="btn btn-outline-secondary" (click)="navigatePeriod('next')" 
            [disabled]="isAtCurrentPeriod()" title="Período siguiente">
            <i class="bi bi-chevron-right"></i>
          </button>
        </div>

        <!-- Granularidad -->
        <div class="btn-group btn-group-sm" role="group" title="Granularidad de agrupación">
          @for (g of granularities; track g.value) {
            <button 
              type="button"
              class="btn"
              [class.btn-info]="currentFilter?.granularity === g.value"
              [class.btn-outline-secondary]="currentFilter?.granularity !== g.value"
              (click)="setGranularity(g.value)">
              {{ g.label }}
            </button>
          }
        </div>

        <!-- Asignatura -->
        <select 
          class="form-select form-select-sm w-auto"
          [ngModel]="currentFilter?.asignaturaId"
          (ngModelChange)="setAsignatura($event)">
          <option [ngValue]="null">Todas las asignaturas</option>
          @for (asig of asignaturas; track asig.id) {
            <option [ngValue]="asig.id">{{ asig.nombre }}</option>
          }
        </select>

        <!-- Tipo de equipo -->
        <select 
          class="form-select form-select-sm w-auto"
          [ngModel]="currentFilter?.tipoEquipoId"
          (ngModelChange)="setTipoEquipo($event)">
          <option [ngValue]="null">Todos los tipos</option>
          @for (tipo of tiposEquipo; track tipo.id) {
            <option [ngValue]="tipo.id">{{ tipo.nombre }}</option>
          }
        </select>

        <!-- Tipo de uso -->
        <div class="btn-group btn-group-sm" role="group">
          @for (tipo of tiposUso; track tipo.value) {
            <button 
              type="button"
              class="btn"
              [class.btn-dark]="currentFilter?.tipoUso === tipo.value && tipo.value === 'ambos'"
              [class.btn-warning]="currentFilter?.tipoUso === tipo.value && tipo.value === 'interno'"
              [class.btn-purple]="currentFilter?.tipoUso === tipo.value && tipo.value === 'externo'"
              [class.btn-outline-secondary]="currentFilter?.tipoUso !== tipo.value"
              (click)="setTipoUso(tipo.value)">
              {{ tipo.label }}
            </button>
          }
        </div>

        <!-- Año ingreso (opcional) -->
        @if (showAnioIngreso) {
          <select 
            class="form-select form-select-sm w-auto"
            [ngModel]="currentFilter?.anioIngreso"
            (ngModelChange)="setAnioIngreso($event)">
            @for (anio of aniosIngreso; track anio.value) {
              <option [ngValue]="anio.value">{{ anio.label }}</option>
            }
          </select>
        }

        <!-- Toggle Global/Individual -->
        <div class="btn-group btn-group-sm" role="group">
          <button 
            type="button"
            class="btn"
            [class.btn-secondary]="currentMode === 'global'"
            [class.btn-outline-secondary]="currentMode !== 'global'"
            (click)="setMode('global')"
            title="Filtro global">
            <i class="bi bi-globe2 me-1"></i>Global
          </button>
          <button 
            type="button"
            class="btn"
            [class.btn-secondary]="currentMode === 'individual'"
            [class.btn-outline-secondary]="currentMode !== 'individual'"
            (click)="setMode('individual')"
            title="Filtro individual">
            <i class="bi bi-ui-checks me-1"></i>Individual
          </button>
        </div>

        <!-- Toggle avanzadas -->
        <button 
          type="button"
          class="btn btn-sm"
          [class.btn-primary]="showAdvanced"
          [class.btn-outline-secondary]="!showAdvanced"
          (click)="showAdvanced = !showAdvanced">
          <i class="bi bi-sliders me-1"></i>
          {{ showAdvanced ? 'Ocultar' : 'Avanzado' }}
        </button>
      </div>

      <!-- OPCIONES AVANZADAS (collapse interno) -->
      @if (showAdvanced) {
        <div class="advanced-section border-top px-3 py-3">
          <div class="d-flex align-items-end flex-wrap gap-3">
            
            <!-- Rango personalizado -->
            <div class="d-flex align-items-end gap-2">
              <div>
                <label class="form-label small text-muted mb-1">Desde</label>
                <input type="date" class="form-control form-control-sm" [(ngModel)]="customFrom" [max]="customTo">
              </div>
              <span class="text-muted pb-2">→</span>
              <div>
                <label class="form-label small text-muted mb-1">Hasta</label>
                <input type="date" class="form-control form-control-sm" [(ngModel)]="customTo" [min]="customFrom" [max]="today">
              </div>
            </div>

            <!-- Botones acción -->
            <div class="d-flex gap-2">
              <button type="button" class="btn btn-primary btn-sm" (click)="applyCustomRange()">
                <i class="bi bi-check2 me-1"></i>Aplicar
              </button>
              <button type="button" class="btn btn-outline-secondary btn-sm" (click)="reset()">
                <i class="bi bi-arrow-counterclockwise me-1"></i>Reset
              </button>
            </div>

              <!-- Franja horaria (equipos) -->
              <div>
                <label class="form-label small text-muted mb-1">Franja horaria</label>
                <select 
                  class="form-select form-select-sm"
                  [ngModel]="currentFilter?.franjaHoraria"
                  (ngModelChange)="setFranjaHoraria($event)">
                  @for (franja of franjasHorarias; track franja.value) {
                    <option [ngValue]="franja.value">{{ franja.label }}</option>
                  }
                </select>
              </div>

            <!-- Spacer -->
            <div class="flex-grow-1"></div>

            <!-- Exportación (terciaria) -->
            @if (showExport) {
              <div class="export-section d-flex align-items-center gap-2">
                <small class="text-muted">Exportar:</small>
                <button 
                  type="button"
                  class="btn btn-outline-secondary btn-sm"
                  [disabled]="isExportingPdf"
                  (click)="handleExportPdf()">
                  <i class="bi" [ngClass]="isExportingPdf ? 'bi-arrow-repeat spin' : 'bi-file-earmark-pdf'"></i>
                  <span class="ms-1">PDF</span>
                </button>
                <button 
                  type="button"
                  class="btn btn-outline-secondary btn-sm"
                  [disabled]="isExportingExcel"
                  (click)="handleExportExcel()">
                  <i class="bi" [ngClass]="isExportingExcel ? 'bi-arrow-repeat spin' : 'bi-file-earmark-excel'"></i>
                  <span class="ms-1">Excel</span>
                </button>
              </div>
            }
          </div>
        </div>
      }

      <!-- Toast feedback -->
      @if (exportMessage) {
        <div class="px-3 pb-2">
          <div class="alert py-2 mb-0 d-inline-flex align-items-center gap-2" 
               [class.alert-success]="exportSuccess" 
               [class.alert-danger]="!exportSuccess">
            <i class="bi" [ngClass]="exportSuccess ? 'bi-check-circle-fill' : 'bi-exclamation-circle-fill'"></i>
            <small>{{ exportMessage }}</small>
          </div>
        </div>
      }

      <!-- Loading bar -->
      @if (isLoading) {
        <div class="progress rounded-0 rounded-bottom-4" style="height: 3px;">
          <div class="progress-bar progress-bar-striped progress-bar-animated bg-primary w-100"></div>
        </div>
      }
    </div>
  `,
  styles: [`
    /* Control Bar - minimalista */
    :host {
      display: block;
      margin-bottom: 1rem;
    }

    .control-bar {
      background: #f8f9fa;
    }

    /* Custom purple for externo */
    .btn-purple {
      background-color: #8b5cf6 !important;
      border-color: #8b5cf6 !important;
      color: #fff !important;
    }
    .btn-purple:hover {
      background-color: #7c3aed !important;
      border-color: #7c3aed !important;
    }

    /* Info style for granularity */
    .btn-info {
      background-color: #0dcaf0 !important;
      border-color: #0dcaf0 !important;
      color: #000 !important;
    }
    .btn-info:hover {
      background-color: #31d2f2 !important;
      border-color: #25cff2 !important;
    }

    /* Advanced section animation */
    .advanced-section {
      background: rgba(0,0,0,0.02);
      animation: slideDown 0.15s ease;
    }

    @keyframes slideDown {
      from { opacity: 0; transform: translateY(-6px); }
      to { opacity: 1; transform: translateY(0); }
    }

    /* Spin */
    .spin {
      animation: spin 0.8s linear infinite;
    }
    @keyframes spin {
      to { transform: rotate(360deg); }
    }

    /* Responsive */
    @media (max-width: 991px) {
      .toolbar { justify-content: center !important; }
      .period-summary { 
        width: 100%; 
        justify-content: center !important;
        margin-right: 0 !important;
      }
    }

    @media (max-width: 767px) {
      .advanced-section > div {
        flex-direction: column !important;
        align-items: stretch !important;
      }
      .export-section {
        border-left: none !important;
        border-top: 1px solid #dee2e6;
        padding-left: 0 !important;
        padding-top: 0.75rem;
        margin-top: 0.5rem;
      }
    }
  `]
})
export class ReportFiltersComponent implements OnInit, OnDestroy {
  @Input() showAnioIngreso = false;
  @Input() showExport = true;
  @Input() onExportPDF?: () => Promise<void> | void;
  @Input() onExportExcel?: () => Promise<void> | void;
  @Output() filtersChanged = new EventEmitter<ReportFilter>();

  currentFilter: ReportFilter | null = null;
  currentMode: 'global' | 'individual' = 'global';
  periodInfo: PeriodInfo | null = null;
  isLoading = false;
  showAdvanced = false;

  // Estados de exportación
  isExportingPdf = false;
  isExportingExcel = false;
  exportMessage = '';
  exportSuccess = true;

  customFrom = '';
  customTo = '';
  today = new Date().toISOString().split('T')[0];

  quickPresets = [
    { value: 'this_month' as PeriodPreset, label: 'Este mes', icon: '🗓️' },
    { value: 'this_quarter' as PeriodPreset, label: 'Trimestre', icon: '📊' },
    { value: 'this_semester' as PeriodPreset, label: 'Semestre', icon: '📈' },
    { value: 'this_year' as PeriodPreset, label: 'Este año', icon: '🎯' },
    { value: 'last_year' as PeriodPreset, label: 'Año anterior', icon: '◀️' },
  ];

  granularities: { value: Granularity; label: string }[] = [];
  tiposUso: { value: TipoUso; label: string; icon: string }[] = [];
  aniosIngreso: { value: number | null; label: string }[] = [];
  franjasHorarias: { value: FranjaHoraria; label: string }[] = [];

  asignaturas: { id: number; nombre: string }[] = [];
  tiposEquipo: { id: number; nombre: string }[] = [];

  private destroy$ = new Subject<void>();

  constructor(
    private filterService: ReportFiltersService,
    private asignaturasService: AsignaturasService,
    private equiposService: EquiposService
  ) {
    this.granularities = this.filterService.granularities;
    this.tiposUso = this.filterService.tiposUso;
    this.aniosIngreso = this.filterService.aniosIngreso;
    this.franjasHorarias = this.filterService.franjasHorarias;
  }

  ngOnInit(): void {
    this.filterService.filter$
      .pipe(takeUntil(this.destroy$))
      .subscribe((filter: ReportFilter) => {
        this.currentFilter = filter;
        this.customFrom = filter.from;
        this.customTo = filter.to;
        this.periodInfo = this.filterService.getPeriodInfo();
        this.filtersChanged.emit(filter);
      });

    this.filterService.mode$
      .pipe(takeUntil(this.destroy$))
      .subscribe((mode: 'global' | 'individual') => {
        this.currentMode = mode;
      });

    this.filterService.loading$
      .pipe(takeUntil(this.destroy$))
      .subscribe((loading: boolean) => {
        this.isLoading = loading;
      });

    this.loadAsignaturas();
    this.loadTiposEquipo();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  applyPreset(preset: PeriodPreset): void {
    this.filterService.applyPreset(preset);
  }

  /**
   * Navigate to previous or next period based on current date range span
   */
  navigatePeriod(direction: 'prev' | 'next'): void {
    if (!this.currentFilter) return;
    
    const from = new Date(this.currentFilter.from);
    const to = new Date(this.currentFilter.to);
    const diffMs = to.getTime() - from.getTime();
    const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24)) + 1;
    
    let newFrom: Date;
    let newTo: Date;
    
    if (direction === 'prev') {
      newTo = new Date(from);
      newTo.setDate(newTo.getDate() - 1);
      newFrom = new Date(newTo);
      newFrom.setDate(newFrom.getDate() - diffDays + 1);
    } else {
      newFrom = new Date(to);
      newFrom.setDate(newFrom.getDate() + 1);
      newTo = new Date(newFrom);
      newTo.setDate(newTo.getDate() + diffDays - 1);
      // Do not go beyond today
      const today = new Date();
      if (newTo > today) newTo = today;
    }
    
    this.filterService.applyCustomRange(
      newFrom.toISOString().split('T')[0],
      newTo.toISOString().split('T')[0],
      this.currentFilter.granularity
    );
  }

  /**
   * Check if the current period end date is today or later
   */
  isAtCurrentPeriod(): boolean {
    if (!this.currentFilter) return true;
    const to = new Date(this.currentFilter.to);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return to >= today;
  }

  setGranularity(granularity: Granularity): void {
    this.filterService.setGranularity(granularity);
  }

  setTipoUso(tipoUso: TipoUso): void {
    this.filterService.setTipoUso(tipoUso);
  }

  setAnioIngreso(anioIngreso: number | null): void {
    this.filterService.setAnioIngreso(anioIngreso ?? undefined);
  }

  setAsignatura(asignaturaId: number | null): void {
    this.filterService.setAsignatura(asignaturaId);
  }

  setTipoEquipo(tipoEquipoId: number | null): void {
    this.filterService.setTipoEquipo(tipoEquipoId);
  }

  setFranjaHoraria(franja: FranjaHoraria): void {
    this.filterService.setFranjaHoraria(franja);
  }

  setMode(mode: 'global' | 'individual'): void {
    this.filterService.setMode(mode);
  }

  onCustomDateChange(): void {
    if (!this.showAdvanced) {
      this.showAdvanced = true;
    }
  }

  applyCustomRange(): void {
    if (this.customFrom && this.customTo) {
      this.filterService.applyCustomRange(
        this.customFrom,
        this.customTo,
        this.currentFilter?.granularity
      );
    }
  }

  reset(): void {
    this.filterService.reset();
  }

  private loadAsignaturas(): void {
    this.asignaturasService.getAsignaturas().subscribe({
      next: (resp) => {
        const list = Array.isArray(resp?.data) ? resp.data : resp;
        this.asignaturas = (list || []).map((a: any) => ({ id: a.idAsignatura || a.id || a.id_asignatura, nombre: a.nombre }));
      },
      error: () => {
        this.asignaturas = [];
      }
    });
  }

  private loadTiposEquipo(): void {
    this.equiposService.getEquipos().subscribe({
      next: (resp: any) => {
        const list = Array.isArray(resp?.data) ? resp.data : (Array.isArray(resp) ? resp : []);
        const map = new Map<number, string>();
        (list || []).forEach((e: any) => {
          const id = e.tipo_equipo_id || e.tipoEquipoId || e.tipo_equipo?.id;
          const nombre = e.tipo_equipo_nombre || e.tipo_equipo?.nombre || e.nombre_tipo || e.tipo_nombre;
          if (id && nombre && !map.has(id)) {
            map.set(id, nombre);
          }
        });
        this.tiposEquipo = Array.from(map.entries()).map(([id, nombre]) => ({ id, nombre }));
      },
      error: () => {
        this.tiposEquipo = [];
      }
    });
  }

  // Métodos de exportación con feedback
  async handleExportPdf(): Promise<void> {
    if (!this.onExportPDF || this.isExportingPdf) return;
    
    this.isExportingPdf = true;
    this.exportMessage = '';
    
    try {
      await this.onExportPDF();
      this.showExportFeedback(true, 'PDF exportado correctamente.');
    } catch (error) {
      this.showExportFeedback(false, 'No se pudo exportar PDF. Intenta nuevamente.');
    } finally {
      this.isExportingPdf = false;
    }
  }

  async handleExportExcel(): Promise<void> {
    if (!this.onExportExcel || this.isExportingExcel) return;
    
    this.isExportingExcel = true;
    this.exportMessage = '';
    
    try {
      await this.onExportExcel();
      this.showExportFeedback(true, 'Excel exportado correctamente.');
    } catch (error) {
      this.showExportFeedback(false, 'No se pudo exportar Excel. Intenta nuevamente.');
    } finally {
      this.isExportingExcel = false;
    }
  }

  private showExportFeedback(success: boolean, message: string): void {
    this.exportSuccess = success;
    this.exportMessage = message;
    setTimeout(() => {
      this.exportMessage = '';
    }, 3000);
  }
}
