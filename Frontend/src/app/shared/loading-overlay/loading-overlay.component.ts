import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Observable } from 'rxjs';
import { LoadingService } from '../../services/loading.service';

@Component({
  selector: 'app-loading-overlay',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="overlay" *ngIf="loading$ | async">
      <div class="box">
        <div class="spinner"></div>
        <p>Procesando solicitud...</p>
      </div>
    </div>
  `,
  styleUrls: ['./loading-overlay.component.css']
})
export class LoadingOverlayComponent {

  loading$!: Observable<boolean>;

  constructor(private loadingService: LoadingService) {
    this.loading$ = this.loadingService.loading$;
  }
}
