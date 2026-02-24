import { Routes, RouterModule } from '@angular/router';
import { NgModule } from '@angular/core';

// AUTH
import { LoginComponent } from './components/auth/login/login.component';
import { RecuperarComponent } from './components/auth/recuperar/recuperar.component';
import { ResetPasswordComponent } from './components/auth/reset-password/reset-password.component';

// ALUMNO
import { CatalogoEquiposComponent } from './components/alumno/catalogo-equipos/catalogo-equipos.component';
import { SolicitarReservaComponent } from './components/alumno/solicitar-reserva/solicitar-reserva.component';
import { MisSancionesComponent } from './components/alumno/mis-sanciones/mis-sanciones.component';

// ADMIN
import { DashboardAdminComponent } from './components/admin/dashboard-admin/dashboard-admin.component';
import { NotificacionesComponent } from './components/admin/notificaciones/notificaciones.component';
import { SolicitudesPendientesComponent } from './components/admin/solicitudes-pendientes/solicitudes-pendientes.component';
import { ReportesComponent } from './components/admin/reportes/reportes/reportes.component';
import { GestionarAsignaturasComponent } from './components/admin/asignaturas/gestionar-asignaturas.component';
import { DashboardOperationalComponent } from './components/admin/reportes/dashboard-operational/dashboard-operational.component';
import { DashboardExecutiveComponent } from './components/admin/reportes/dashboard-executive/dashboard-executive.component';
import { BloqueosHorarioComponent } from './components/admin/bloqueos-horario/bloqueos-horario.component';
import { DashboardStockoutComponent } from './components/admin/reportes/dashboard-stockout/dashboard-stockout.component';
import { CategoriasEncargadosComponent } from './components/admin/categorias-encargados/categorias-encargados.component';
export const routes: Routes = [
  // REDIRECCIÓN INICIAL
  { path: '', redirectTo: 'auth/login', pathMatch: 'full' },

  // AUTH
  { path: 'auth/login', component: LoginComponent },
  {
    path: 'auth/callback',
    loadComponent: () =>
      import('./auth-callback/auth-callback.component').then(m => m.AuthCallbackComponent)
  },
  { path: 'auth/recuperar', component: RecuperarComponent },
  { path: 'reset-password', component: ResetPasswordComponent },

  // ALUMNO
  { path: 'equipos/catalogo', component: CatalogoEquiposComponent },
  { path: 'reservas/solicitar', component: SolicitarReservaComponent },

  {
    path: 'mis-solicitudes',
    loadComponent: () =>
      import('./components/alumno/mis-solicitudes/mis-solicitudes.component')
        .then(m => m.MisSolicitudesComponent)
  },

  {
    path: 'mis-sanciones',
    component: MisSancionesComponent
  },

  {
    path: 'preguntas-frecuentes',
    loadComponent: () =>
      import('./components/alumno/preguntas-frecuentes-alumno/preguntas-frecuentes-alumno.component')
        .then(c => c.PreguntasFrecuentesAlumnoComponent)
  },


  // ADMIN
  { path: 'admin/dashboard', component: DashboardAdminComponent },

  { path: 'admin/notificaciones', component: NotificacionesComponent },

  { path: 'admin/solicitudes', component: SolicitudesPendientesComponent },
  { path: 'admin/bloqueos-horario', component: BloqueosHorarioComponent },
  { path: 'admin/categorias', component: CategoriasEncargadosComponent },
  {
    path: 'admin/reportes',
    component: ReportesComponent,
    children: [
      { path: 'executive', component: DashboardExecutiveComponent },
      { path: 'dashboard', component: DashboardOperationalComponent },
      { path: 'stockout', component: DashboardStockoutComponent },
      { path: '', redirectTo: 'executive', pathMatch: 'full' }
    ]
  },


  {
    path: 'admin/solicitudes-finalizadas',
    loadComponent: () =>
      import('./components/admin/solicitudes-finalizadas/solicitudes-finalizadas.component')
        .then(m => m.SolicitudesFinalizadasComponent)
  },

  {
    path: 'admin/sanciones',
    loadComponent: () =>
      import('./components/admin/gestionar-sanciones/gestionar-sanciones.component')
        .then(c => c.GestionarSancionesComponent)
  },

  {
    path: 'admin/asignaturas',
    loadComponent: () =>
      import('./components/admin/asignaturas/gestionar-asignaturas.component')
        .then(m => m.GestionarAsignaturasComponent)
  },


  {
    path: 'admin/packs',
    loadComponent: () =>
      import('./components/admin/gestionar-packs/gestionar-packs.component')
        .then(m => m.GestionarPacksComponent)
  },

  {
  path: 'admin/preguntas-frecuentes',
  loadComponent: () =>
    import('./components/admin/preguntas-frecuentes-admin/preguntas-frecuentes-admin.component')
    .then(c => c.PreguntasFrecuentesAdminComponent)
},



  // 404 → LOGIN
  { path: '**', redirectTo: 'auth/login' }
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
