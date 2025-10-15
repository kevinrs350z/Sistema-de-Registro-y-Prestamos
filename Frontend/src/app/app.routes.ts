import { Routes } from '@angular/router';
import { CatalogoEquiposComponent } from './components/catalogo-equipos/catalogo-equipos.component';
import { SolicitarReservaComponent } from './components/solicitar-reserva/solicitar-reserva.component';
import { MisSolicitudesComponent } from './components/mis-solicitudes/mis-solicitudes.component';

export const routes: Routes = [
  { path: '', redirectTo: 'equipos/catalogo', pathMatch: 'full' },
  { path: 'equipos/catalogo', component: CatalogoEquiposComponent },
  { path: 'reservas/solicitar', component: SolicitarReservaComponent },
  { path: 'mis-solicitudes', loadComponent: () => import('./components/mis-solicitudes/mis-solicitudes.component').then(m => m.MisSolicitudesComponent) },
  { path: 'admin/gestionar', loadComponent: () => import('./components/gestionar-solicitudes/gestionar-solicitudes.component').then(m => m.GestionarSolicitudesComponent) },



];
