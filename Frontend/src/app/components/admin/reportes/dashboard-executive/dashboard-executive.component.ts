import { Component, OnDestroy, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Subject, takeUntil } from 'rxjs';
import {
  DashboardOperationalService,
  ExecutiveKpisParams
} from '../../../../services/reportes/dashboard-operational.service';
import { ReportFiltersComponent } from '../report-filters/report-filters.component';
import { ReportFilter } from '../../../../services/report-filters.service';

export interface KpiCard {
  key: string;
  label: string;
  value: any;
  unit?: string | null;
  prev?: number | null;
  variation?: number | null;
  direction: 'up' | 'down' | 'neutral';
  color: 'green' | 'red' | 'amber' | 'blue' | 'gray';
  tooltip: string;
  detail?: string;
  p50?: number;
  p90?: number;
  pressure?: number;
  pctDisp?: number;
  total?: number;
  prestados?: number;
  mantenimiento?: number;
  activosAhora?: number;
  totalUsers?: number;
  peakDay?: string;
  count?: number;
}

@Component({
  selector: 'app-dashboard-executive',
  standalone: true,
  imports: [CommonModule, FormsModule, ReportFiltersComponent],
  templateUrl: './dashboard-executive.component.html',
  styleUrls: ['./dashboard-executive.component.css']
})
export class DashboardExecutiveComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();

  loading = false;
  error = '';
  kpis: KpiCard[] = [];
  meta: any = null;
  currentFilter: ReportFilter | null = null;

  // tipo FUERA/DENTRO
  tipoSeleccionado: 'FUERA' | 'DENTRO' = 'FUERA';
  estadoSeleccionado = 'TODOS';

  estadosDisponibles = [
    'TODOS', 'PENDIENTE', 'APROBADO', 'PENDIENTE_ENTREGA',
    'ENTREGADO', 'ATRASADO', 'DEVUELTO', 'RECHAZADO'
  ];

  ngOnInit(): void {}

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  constructor(private dashboardService: DashboardOperationalService) {}

  onFiltersChanged(filter: ReportFilter): void {
    this.currentFilter = filter;
    this.loadKpis();
  }

  onTipoChange(tipo: 'FUERA' | 'DENTRO'): void {
    this.tipoSeleccionado = tipo;
    this.loadKpis();
  }

  onEstadoChange(estado: string): void {
    this.estadoSeleccionado = estado;
    this.loadKpis();
  }

  private loadKpis(): void {
    if (!this.currentFilter && this.tipoSeleccionado === 'FUERA') return;

    this.loading = true;
    this.error = '';

    const params: ExecutiveKpisParams = {
      tipo: this.tipoSeleccionado,
      categoria: this.currentFilter?.tipoEquipoId ?? null,
      asignatura: this.currentFilter?.asignaturaId ?? null,
      anioIngreso: this.currentFilter?.anioIngreso ?? null,
      estado: this.estadoSeleccionado,
    };

    if (this.tipoSeleccionado === 'FUERA' && this.currentFilter) {
      params.from = this.currentFilter.from;
      params.to = this.currentFilter.to;
    }

    this.dashboardService.getExecutiveKpis(params)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (data) => {
          this.kpis = data?.kpis ?? [];
          this.meta = data?.meta ?? null;
          this.loading = false;
        },
        error: () => {
          this.error = 'No se pudieron cargar los KPIs ejecutivos.';
          this.loading = false;
        }
      });
  }

  getArrow(dir: string): string {
    if (dir === 'up') return '↑';
    if (dir === 'down') return '↓';
    return '→';
  }

  getVariationText(kpi: KpiCard): string {
    if (kpi.variation == null) return '';
    const sign = kpi.variation > 0 ? '+' : '';
    return `${sign}${kpi.variation}%`;
  }

  getDisplayValue(kpi: KpiCard): string {
    const dualKeys = ['duracion', 'tiempo_ciclo', 'frecuencia_usuario'];
    if (dualKeys.includes(kpi.key)) return '';
    if (kpi.key === 'top_critica') return kpi.value;
    if (kpi.key === 'equipos_disponibles') return '';
    if (kpi.key === 'prestamos_activos') return '';
    if (kpi.key === 'demanda_pico') return '';
    if (kpi.unit === '%') return `${kpi.value}%`;
    return `${kpi.value}`;
  }

  trackByKey(_: number, kpi: KpiCard): string {
    return kpi.key;
  }
}
