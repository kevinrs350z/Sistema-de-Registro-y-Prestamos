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
  PeriodInfo
} from '../../../../services/report-filters.service';

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

        <!-- Presets período -->
        <div class="btn-group btn-group-sm" role="group">
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
        </div>

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

  private destroy$ = new Subject<void>();

  constructor(private filterService: ReportFiltersService) {
    this.granularities = this.filterService.granularities;
    this.tiposUso = this.filterService.tiposUso;
    this.aniosIngreso = this.filterService.aniosIngreso;
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
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  applyPreset(preset: PeriodPreset): void {
    this.filterService.applyPreset(preset);
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
