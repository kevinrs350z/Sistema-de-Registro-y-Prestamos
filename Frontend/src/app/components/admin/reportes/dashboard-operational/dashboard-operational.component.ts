import { Component, OnInit, OnDestroy, ViewChild, ElementRef, ChangeDetectorRef, AfterViewInit } from '@angular/core';
import { CommonModule, TitleCasePipe, SlicePipe } from '@angular/common';
import { Chart } from 'chart.js/auto';
import { DashboardOperationalService } from '../../../../services/reportes/dashboard-operational.service';
import { trigger, style, animate, transition } from '@angular/animations';

@Component({
  selector: 'app-dashboard-operational',
  standalone: true,
  imports: [CommonModule, TitleCasePipe, SlicePipe],
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

  today = new Date();

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

  // KPIs de Inventario
  kpisInventario: {
    total: number;
    disponibles: number;
    mantenimiento: number;
    baja: number;
  } = {
    total: 0,
    disponibles: 0,
    mantenimiento: 0,
    baja: 0
  };

  // KPIs de Mantenimientos
  kpisMantenimientos: {
    atrasos: number;
    incidentes: number;
    equiposMantenimiento: number;
  } = {
    atrasos: 0,
    incidentes: 0,
    equiposMantenimiento: 0
  };

  // KPIs de Sanciones
  kpisSanciones: {
    sancionesActivas: number;
    sancionesTotal: number;
    bloqueosActivos: number;
    bloqueosHistoricos: number;
  } = {
    sancionesActivas: 0,
    sancionesTotal: 0,
    bloqueosActivos: 0,
    bloqueosHistoricos: 0
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

    // Cargar KPIs adicionales
    this.dashboardService.getKPIsInventario().subscribe({
      next: (data) => this.kpisInventario = data,
      error: (err) => console.error('Error cargando KPIs inventario:', err)
    });

    this.dashboardService.getKPIsMantenimientos().subscribe({
      next: (data) => this.kpisMantenimientos = data,
      error: (err) => console.error('Error cargando KPIs mantenimientos:', err)
    });

    this.dashboardService.getKPIsSanciones().subscribe({
      next: (data) => this.kpisSanciones = data,
      error: (err) => console.error('Error cargando KPIs sanciones:', err)
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
        datasets: [{ 
          data, 
          backgroundColor: colores,
          borderWidth: 0,
          hoverOffset: 4
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        cutout: '65%',
        plugins: {
          legend: { display: false },
          tooltip: {
            backgroundColor: '#202124',
            titleFont: { size: 12, weight: 'bold' },
            bodyFont: { size: 11 },
            padding: 10,
            cornerRadius: 6
          }
        }
      }
    });
  }

  private getColorEstado(estado: string): string {
    const colores: any = {
      'DISPONIBLE': '#1e8e3e',
      'PRESTADO': '#1a73e8',
      'MANTENIMIENTO': '#f9ab00',
      'BAJA': '#d93025'
    };
    return colores[estado] || '#9aa0a6';
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
