import { Routes, RouterModule } from '@angular/router';
import { NgModule } from '@angular/core';
import { LoginComponent } from './components/auth/login/login.component';
import { RecuperarComponent } from './components/auth/recuperar/recuperar.component';
import { DashboardAdminComponent } from './components/admin/dashboard-admin/dashboard-admin.component';
import { CatalogoEquiposComponent } from './components/alumno/catalogo-equipos/catalogo-equipos.component';
import { SolicitarReservaComponent } from './components/alumno/solicitar-reserva/solicitar-reserva.component';
import { MisSolicitudesComponent } from './components/alumno/mis-solicitudes/mis-solicitudes.component';
import { ResetPasswordComponent } from './components/auth/reset-password/reset-password.component';
import { NotificacionesComponent } from './components/admin/notificaciones/notificaciones.component';
import { SolicitudesPendientesComponent } from './components/admin/solicitudes-pendientes/solicitudes-pendientes.component';

export const routes: Routes = [
  { path: '', redirectTo: 'auth/login', pathMatch: 'full' },
  { path: 'auth/login', component: LoginComponent },
    { 
    path: 'auth/callback', 
    loadComponent: () => import('./auth-callback/auth-callback.component')
      .then(m => m.AuthCallbackComponent) 
  },
  { path: 'auth/recuperar', component: RecuperarComponent },
  { path: 'reset-password', component: ResetPasswordComponent },
  { path: 'equipos/catalogo', component: CatalogoEquiposComponent },
  { path: 'reservas/solicitar', component: SolicitarReservaComponent },
  { path: 'mis-solicitudes', loadComponent: () => import('./components/alumno/mis-solicitudes/mis-solicitudes.component').then(m => m.MisSolicitudesComponent) },
  //{ path: 'admin/gestionar', loadComponent: () => import('./components/alumno/gestionar-solicitudes/gestionar-solicitudes.component').then(m => m.GestionarSolicitudesComponent) },
  { path: 'admin/dashboard', component: DashboardAdminComponent },
  { path: 'admin/notificaciones', component: NotificacionesComponent },
  { path: 'admin/solicitudes', component: SolicitudesPendientesComponent },
  { path: '**', redirectTo: 'auth/login' }



];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }