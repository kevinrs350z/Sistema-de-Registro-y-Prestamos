import { Routes, RouterModule } from '@angular/router';
import { NgModule } from '@angular/core';

// AUTH
import { LoginComponent } from './components/auth/login/login.component';
import { RecuperarComponent } from './components/auth/recuperar/recuperar.component';
import { ResetPasswordComponent } from './components/auth/reset-password/reset-password.component';

// ALUMNO
import { CatalogoEquiposComponent } from './components/alumno/catalogo-equipos/catalogo-equipos.component';
import { SolicitarReservaComponent } from './components/alumno/solicitar-reserva/solicitar-reserva.component';

// ADMIN
import { DashboardAdminComponent } from './components/admin/dashboard-admin/dashboard-admin.component';
import { NotificacionesComponent } from './components/admin/notificaciones/notificaciones.component';
import { SolicitudesPendientesComponent } from './components/admin/solicitudes-pendientes/solicitudes-pendientes.component';
import { ReportesEquiposComponent } from './components/admin/reportes-equipos/reportes-equipos.component';

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

  // ADMIN
  { path: 'admin/dashboard', component: DashboardAdminComponent },

  { path: 'admin/notificaciones', component: NotificacionesComponent },

  { path: 'admin/solicitudes', component: SolicitudesPendientesComponent },
  { path: 'reportes/equipos', component: ReportesEquiposComponent },

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


  // 404 → LOGIN
  { path: '**', redirectTo: 'auth/login' }
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
