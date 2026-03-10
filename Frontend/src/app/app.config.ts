import { ApplicationConfig, importProvidersFrom, provideZoneChangeDetection } from '@angular/core';
import { provideRouter } from '@angular/router';
import { routes } from './app.routes';
import { provideAnimations } from '@angular/platform-browser/animations';
import { ReactiveFormsModule, FormsModule } from '@angular/forms';
import { provideHttpClient, withInterceptors } from '@angular/common/http';

import { AuthInterceptor } from './interceptors/auth.interceptor';
import { LoadingInterceptor } from './interceptors/loading.interceptor';
import { DataSyncService } from './services/data-sync.service';
import { PrestamoStateService } from './services/prestamo-state.service';
import { SancionStateService } from './services/sancion-state.service';

export const appConfig: ApplicationConfig = {
  providers: [
    provideZoneChangeDetection({ eventCoalescing: true }),
    provideRouter(routes),
    provideHttpClient(
      withInterceptors([
        AuthInterceptor,
        LoadingInterceptor   
      ])
    ),
    provideAnimations(),
    importProvidersFrom(ReactiveFormsModule, FormsModule),
    DataSyncService,
    PrestamoStateService,
    SancionStateService
  ]
};
