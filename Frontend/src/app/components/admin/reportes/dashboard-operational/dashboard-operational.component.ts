import { Component, OnInit, OnDestroy, ViewChild, ElementRef, ChangeDetectorRef, AfterViewInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Chart } from 'chart.js/auto';
import { DashboardOperationalService } from '../../../../services/reportes/dashboard-operational.service';
import { trigger, style, animate, transition } from '@angular/animations';

@Component({
  selector: 'app-dashboard-operational',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './dashboard-operational.component.html',
  styleUrls: ['./dashboard-operational.component.css']
  ,
  animations: [
    trigger('fadeIn', [
      transition(':enter', [
        style({ opacity: 0, transform: 'translateY(8px)' }),
        animate('300ms ease-out', style({ opacity: 1, transform: 'none' }))
      ])
    ]),
    trigger('slideIn', [
      transition(':enter', [
        style({ opacity: 0, transform: 'translateY(10px)' }),
        animate('350ms cubic-bezier(.2,.8,.2,1)', style({ opacity: 1, transform: 'none' }))
      ])
    ])
  ]
})
export class DashboardOperationalComponent implements OnInit, AfterViewInit, OnDestroy {
  @ViewChild('inventarioCanvas') inventarioCanvas?: ElementRef<HTMLCanvasElement>;

  kpis: {
    prestamosActivos: number;
    prestamosVencidos: number;
    prestamosProximosAVencer: number;
    equiposDisponibles: number;
    equiposTotales: number;
    porcentajeDisponibilidad: number;
  } = {
    prestamosActivos: 0,
    prestamosVencidos: 0,
    prestamosProximosAVencer: 0,
    equiposDisponibles: 0,
    equiposTotales: 0,
    porcentajeDisponibilidad: 0
  };

  salud: { score: number; estado: string; color: string } = {
    score: 0,
    estado: 'Cargando...',
    color: 'info'
  };

  estadoInventario: { estado: string; total: number }[] = [];

  alertas: {
    retrasos: { nombre: string; retrasos: number }[];
    sanciones: { nombre: string; nivel_sancion: string; fecha_vencimiento: string }[];
    totalRetrasos: number;
    totalSanciones: number;
  } = {
    retrasos: [],
    sanciones: [],
    totalRetrasos: 0,
    totalSanciones: 0
  };

  actividadReciente: { usuario: string; estado_actual: string; tipo_prestamo: string; fecha_solicitud: string }[] = [];

  private chartInventario?: Chart;

  constructor(private dashboardService: DashboardOperationalService, private cdr: ChangeDetectorRef) {}

  ngOnInit(): void {
    this.cargarDatos();
  }

  ngAfterViewInit(): void {
    this.cdr.detectChanges();
    if (this.estadoInventario && this.estadoInventario.length) {
      requestAnimationFrame(() => this.crearGraficoInventario());
    }
  }

  ngOnDestroy(): void {
    this.chartInventario?.destroy();
  }

  private cargarDatos(): void {
    this.dashboardService.getKPIs().subscribe({
      next: (data) => this.kpis = data,
      error: (err) => console.error('Error cargando KPIs:', err)
    });

    this.dashboardService.getSaludSistema().subscribe({
      next: (data) => this.salud = data,
      error: (err) => console.error('Error cargando salud:', err)
    });

    this.dashboardService.getEstadoInventario().subscribe({
      next: (data) => {
        this.estadoInventario = data;
        this.cdr.detectChanges();
        requestAnimationFrame(() => this.crearGraficoInventario());
      },
      error: (err) => console.error('Error cargando inventario:', err)
    });

    this.dashboardService.getAlertasCriticas().subscribe({
      next: (data) => this.alertas = data,
      error: (err) => console.error('Error cargando alertas:', err)
    });

    this.dashboardService.getActividadReciente().subscribe({
      next: (data) => this.actividadReciente = data,
      error: (err) => console.error('Error cargando actividad:', err)
    });
  }

  private crearGraficoInventario(): void {
    const canvas = this.inventarioCanvas?.nativeElement;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    this.chartInventario?.destroy();

    const labels = this.estadoInventario.map(x => x.estado);
    const data = this.estadoInventario.map(x => x.total);
    const colores = this.estadoInventario.map(x => this.getColorEstado(x.estado));

    this.chartInventario = new Chart(ctx, {
      type: 'doughnut',
      data: {
        labels,
        datasets: [{ data, backgroundColor: colores }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { position: 'bottom' }
        }
      }
    });
  }

  private getColorEstado(estado: string): string {
    const colores: any = {
      'DISPONIBLE': '#10b981',
      'PRESTADO': '#3b82f6',
      'MANTENIMIENTO': '#f59e0b',
      'BAJA': '#ef4444'
    };
    return colores[estado] || '#6b7280';
  }

  getTipoActividad(estado: string): string {
    const actividades: any = {
      'Vencido': '⏰ Vencido:',
      'Devuelto': '✅ Devuelto:',
      'Activo': '📦 Activo:',
      'Pendiente': '⏳ Pendiente:',
      'Otro': '📋 Registrado:'
    };
    return actividades[estado] || 'Evento:';
  }
}
